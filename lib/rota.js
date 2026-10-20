/*
 * "Compensa ir a dois supermercados?" — a poupança da divisão da lista
 * menos o que se gasta a mais em combustível (e o tempo a mais).
 *
 * Distâncias em linha reta × FATOR_ESTRADA: sem API de rotas (nem chave,
 * nem custo por pedido), e a estrada real anda tipicamente 20 a 40 % acima
 * da linha reta em Portugal. É uma estimativa e o ecrã diz isso.
 *
 * Funções puras: quem as chama dá a posição, as lojas e o carro.
 */

export const FATOR_ESTRADA = 1.3;
export const KM_H_CIDADE = 30;       // velocidade média de uma volta às compras
export const MIN_POR_PARAGEM = 10;   // estacionar, entrar, sair
export const RAIO_KM = 15;           // mais longe do que isto não conta como "perto"
export const CONSUMO_PADRAO = 6.5;   // L/100 km, carro ligeiro médio

const R = 6371;
const rad = (x) => (x * Math.PI) / 180;
export function km(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* Cadeia (id da app) a partir das etiquetas do OpenStreetMap. */
const CADEIAS = [
  ["continente", /\bcontinente\b/i],
  ["pingo-doce", /\bpingo\s*doce\b/i],
  ["auchan", /\bauchan\b/i],
  ["lidl", /\blidl\b/i],
  ["aldi", /\baldi\b/i],
  ["apolonia", /\bapol[oó]nia\b/i],
];
export function cadeiaDe(tags = {}) {
  const txt = [tags.brand, tags.name, tags.operator].filter(Boolean).join(" ");
  for (const [id, re] of CADEIAS) if (re.test(txt)) return id;
  return null;
}

/* A loja mais perto de cada cadeia: { continente: { lat, lon, nome, km }, … } */
export function maisPertoPorCadeia(lojas = [], pos, raio = RAIO_KM) {
  const out = {};
  for (const l of lojas) {
    if (!l.cadeia || !Number.isFinite(l.lat) || !Number.isFinite(l.lon)) continue;
    const d = km(pos, l);
    if (d > raio) continue;
    if (!out[l.cadeia] || d < out[l.cadeia].km) out[l.cadeia] = { ...l, km: Math.round(d * 10) / 10 };
  }
  return out;
}

/*
 * Distâncias reais por estrada (do servidor, OSRM): { ids, km, min }, onde
 * ids[0] é "casa" e os outros são cadeias. Sem matriz, estima-se: linha
 * reta × FATOR_ESTRADA e KM_H_CIDADE.
 */
function trecho(a, b, matriz) {
  if (matriz) {
    const i = matriz.ids.indexOf(a.cadeia || "casa");
    const j = matriz.ids.indexOf(b.cadeia || "casa");
    if (i >= 0 && j >= 0 && Number.isFinite(matriz.km?.[i]?.[j])) {
      return { km: matriz.km[i][j], min: matriz.min?.[i]?.[j] ?? (matriz.km[i][j] / KM_H_CIDADE) * 60 };
    }
  }
  const d = km(a, b) * FATOR_ESTRADA;
  return { km: d, min: (d / KM_H_CIDADE) * 60 };
}

/* Volta casa → lojas → casa, pela loja mais perto de cada vez: { km, min }. */
export function volta(pos, paragens, matriz = null) {
  let falta = [...paragens], aqui = pos, kmT = 0, minT = 0;
  while (falta.length) {
    falta.sort((a, b) => trecho(aqui, a, matriz).km - trecho(aqui, b, matriz).km);
    const prox = falta.shift();
    const t = trecho(aqui, prox, matriz);
    kmT += t.km; minT += t.min;
    aqui = prox;
  }
  const t = trecho(aqui, pos, matriz);
  return { km: kmT + t.km, min: minT + t.min };
}

/* Só os km (estimativa sem matriz). */
export function kmVolta(pos, paragens, matriz = null) {
  return volta(pos, paragens, matriz).km;
}

const dois = (n) => Math.round(n * 100) / 100;

/*
 * unica: { loja, total }   — tudo num supermercado
 * divisao: { lojas, total } — a lista dividida
 * Devolve null quando falta alguma loja perto (não se inventa distância).
 */
export function avaliarDeslocacao({ pos, perto, unica, divisao, consumo = CONSUMO_PADRAO, precoLitro, matriz = null }) {
  if (!pos || !unica || !divisao?.lojas?.length || !(precoLitro > 0) || !(consumo > 0)) return null;
  const faltam = [unica.loja, ...divisao.lojas].filter((c) => !perto?.[c]);
  if (faltam.length) return { faltam: [...new Set(faltam)] };

  const euroPorKm = (consumo / 100) * precoLitro;
  const vUnica = volta(pos, [{ ...perto[unica.loja], cadeia: unica.loja }], matriz);
  const vDivisao = volta(pos, divisao.lojas.map((c) => ({ ...perto[c], cadeia: c })), matriz);
  const kmUnica = vUnica.km;
  const kmDivisao = vDivisao.km;
  const combUnica = kmUnica * euroPorKm;
  const combDivisao = kmDivisao * euroPorKm;
  const totalUnica = unica.total + combUnica;
  const totalDivisao = divisao.total + combDivisao;
  const paragensExtra = divisao.lojas.length - 1;
  const minutosExtra = Math.max(0, Math.round(vDivisao.min - vUnica.min + paragensExtra * MIN_POR_PARAGEM));

  return {
    kmUnica: Math.round(kmUnica * 10) / 10,
    kmDivisao: Math.round(kmDivisao * 10) / 10,
    kmExtra: Math.round((kmDivisao - kmUnica) * 10) / 10,
    poupancaCompras: dois(unica.total - divisao.total),
    combustivelExtra: dois(combDivisao - combUnica),
    saldo: dois(totalUnica - totalDivisao), // > 0: dividir compensa
    compensa: totalDivisao < totalUnica,
    minutosExtra,
  };
}

/*
 * Cada supermercado da comparação, já com a ida e volta de carro:
 * porLoja = [{ loja, total }]. Ordenado pelo total com combustível.
 * As lojas sem nenhuma perto ficam em `faltam`.
 */
export function lojasComDeslocacao({ pos, perto, porLoja = [], consumo = CONSUMO_PADRAO, precoLitro, matriz = null }) {
  if (!pos || !(precoLitro > 0) || !(consumo > 0)) return null;
  const euroPorKm = (consumo / 100) * precoLitro;
  const lojas = [];
  const faltam = [];
  for (const t of porLoja) {
    const loja = perto?.[t.loja];
    if (!loja) { faltam.push(t.loja); continue; }
    const kmIdaVolta = kmVolta(pos, [{ ...loja, cadeia: t.loja }], matriz);
    const combustivel = dois(kmIdaVolta * euroPorKm);
    lojas.push({ loja: t.loja, compras: t.total, km: Math.round(kmIdaVolta * 10) / 10, combustivel, total: dois(t.total + combustivel) });
  }
  lojas.sort((a, b) => a.total - b.total);
  return { lojas, faltam };
}
