/*
 * Postos de combustível favoritos (a estrela na Mobilidade).
 *
 * `poupeja_postos_fav` guarda só a chave "nome__concelho" — chega para a
 * estrela, mas não para ir buscar o preço: a API só devolve postos
 * individuais à volta de uma coordenada. Por isso, ao lado, guarda-se o
 * mínimo para o Início pedir o preço de cada favorito:
 *   poupeja_postos_fav_info = { [chave]: { id, nome, marca, municipio, lat, lon } }
 * Favoritos antigos (só chave) ganham a ficha da próxima vez que o posto
 * aparecer na lista da Mobilidade.
 */

export const LS_FAV = "poupeja_postos_fav";
export const LS_FAV_INFO = "poupeja_postos_fav_info";
/* A Mobilidade já tentou completar as fichas com postos locais: a partir
   daqui o Início deixa de pedir "abre a Mobilidade" (há favoritos que nunca
   ganham coordenadas — postos sem lat/lon, ou longe de onde a pessoa está). */
export const LS_FAV_VISTO = "poupeja_postos_fav_visto";

export function chavePosto(e) {
  return `${(e?.nome || e?.posto || "").toLowerCase()}__${e?.municipio || ""}`;
}

export function fichaPosto(e) {
  return {
    id: e.id ?? null,
    nome: e.nome || e.posto || e.marca || "",
    marca: e.marca || "",
    municipio: e.municipio || "",
    lat: Number.isFinite(e.lat) ? e.lat : null,
    lon: Number.isFinite(e.lon) ? e.lon : null,
  };
}

function ler(chave, vazio) {
  try { const v = JSON.parse(localStorage.getItem(chave) || "null"); return v ?? vazio; } catch { return vazio; }
}
function gravar(chave, v) {
  try { localStorage.setItem(chave, JSON.stringify(v)); } catch {}
}

export function lerFavoritos() {
  const l = ler(LS_FAV, []);
  return Array.isArray(l) ? l : [];
}
export function lerFichas() {
  const f = ler(LS_FAV_INFO, {});
  return f && typeof f === "object" && !Array.isArray(f) ? f : {};
}

/** Guarda a ficha de `e` (ao marcar a estrela). */
export function guardarFicha(e) {
  const fichas = lerFichas();
  fichas[chavePosto(e)] = fichaPosto(e);
  gravar(LS_FAV_INFO, fichas);
}
export function apagarFicha(chave) {
  const fichas = lerFichas();
  if (!(chave in fichas)) return;
  delete fichas[chave];
  gravar(LS_FAV_INFO, fichas);
}

/**
 * Preenche as fichas em falta (ou sem coordenadas) a partir de uma lista
 * de postos acabada de chegar. Devolve true se mudou alguma coisa.
 */
export function completarFichas(favoritos, estacoes) {
  if (!favoritos?.length || !estacoes?.length) return false;
  gravar(LS_FAV_VISTO, true);
  const fichas = lerFichas();
  // Por chave, os postos distintos que lhe correspondem. Dois postos com o
  // mesmo nome no mesmo concelho (a DGEG às vezes só dá a marca) não se
  // distinguem pela chave antiga: aí não se adivinha.
  const candidatos = new Map();
  for (const e of estacoes) {
    const k = chavePosto(e);
    if (!favoritos.includes(k) || e.lat == null) continue;
    const f = fichas[k];
    if (f && f.lat != null && f.id != null) continue;
    const m = candidatos.get(k) || new Map();
    m.set(e.id ?? `${e.lat},${e.lon}`, e);
    candidatos.set(k, m);
  }
  let mudou = false;
  for (const [k, m] of candidatos) {
    if (m.size !== 1) continue;
    fichas[k] = fichaPosto([...m.values()][0]);
    mudou = true;
  }
  if (mudou) gravar(LS_FAV_INFO, fichas);
  return mudou;
}

/** Favoritos com ficha e coordenadas, pela ordem em que foram marcados. */
export function favoritosComFicha(favoritos = lerFavoritos(), fichas = lerFichas()) {
  return favoritos
    .map(k => fichas[k] ? { chave: k, ...fichas[k] } : null)
    .filter(f => f && f.lat != null && f.lon != null);
}

/**
 * Os preços de um posto numa resposta da API (uma entrada por combustível).
 * Pelo id da DGEG quando o temos; senão pelo nome e concelho.
 * → [{ tipo, preco, dataPreco }] do mais barato para o mais caro.
 */
export function precosDoPosto(estacoes, ficha) {
  const doPosto = (estacoes || []).filter(e =>
    ficha.id != null && e.id != null ? e.id === ficha.id : chavePosto(e) === ficha.chave
  );
  const porTipo = new Map();
  for (const e of doPosto) {
    if (!e.tipoLabel || !(e.preco > 0)) continue;
    const atual = porTipo.get(e.tipoLabel);
    if (!atual || e.preco < atual.preco) porTipo.set(e.tipoLabel, { tipo: e.tipoLabel, preco: e.preco, dataPreco: e.dataPreco || null, desconto: e.desconto || null });
  }
  return [...porTipo.values()].sort((a, b) => a.preco - b.preco);
}

/* As Definições guardam "GPL"; a DGEG chama-lhe "GPL Auto". */
const TIPO_DAS_DEFINICOES = { GPL: "GPL Auto" };

/** O combustível a pôr em destaque: o habitual, senão o gasóleo, senão o primeiro. */
export function escolherDestaque(precos, habitual) {
  if (!precos?.length) return null;
  const tipo = TIPO_DAS_DEFINICOES[habitual] || habitual;
  return precos.find(p => p.tipo === tipo)
    || precos.find(p => p.tipo === "Gasóleo")
    || precos[0];
}

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a, b) {
  const rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Junta favoritos próximos num só pedido: cada grupo é um centro e um
 * raio que apanha todos os seus postos (no máximo `raioMax` km).
 */
export function agruparPedidos(fichas, raioMax = 20) {
  const grupos = [];
  for (const f of fichas) {
    const g = grupos.find(g => distanciaKm(g.base, f) <= raioMax);
    if (g) g.fichas.push(f); else grupos.push({ base: { lat: f.lat, lon: f.lon }, fichas: [f] });
  }
  return grupos.map(g => {
    const lat = g.fichas.reduce((s, f) => s + f.lat, 0) / g.fichas.length;
    const lon = g.fichas.reduce((s, f) => s + f.lon, 0) / g.fichas.length;
    const raio = Math.ceil(Math.max(...g.fichas.map(f => distanciaKm({ lat, lon }, f))) + 1);
    return { lat, lon, raio, fichas: g.fichas };
  });
}
