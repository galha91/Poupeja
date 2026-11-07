/*
 * Estimativa do custo de um carregamento num posto público.
 *
 * As tarifas vêm do MOBI.E (NAP Portugal), via scripts/tarifas_ev.py e a
 * tabela tarifas_ev. Cada ponto tem:
 *   kwh    — €/kWh
 *   min    — €/min de carregamento
 *   sessao — € por carregamento
 *
 * O feed mistura DOIS modelos de preço, e tratá-los igual dava valores
 * errados (verificado em 2026-11 contra os preços oficiais):
 *
 *  1. Preço completo (ad hoc): o posto vende a energia diretamente. O valor
 *     publicado JÁ é o preço final, com energia e IVA. Ex.: Continente
 *     0,35/0,41/0,45 €/kWh (preçário oficial com IVA = valores do feed),
 *     Galp 0,60/0,65, Powerdot, Atlante, Ionity.
 *  2. Tarifa do operador (OPC) do modelo MOBI.E clássico: é só a taxa de
 *     utilização do posto, sem IVA. Quem carrega com cartão/app paga ainda
 *     ao comercializador a energia e as redes (TAR), o IEC e a tarifa da
 *     EGME (MOBI.E) por carregamento, e IVA sobre tudo. Ex.: EDP 0,14 €/kWh
 *     + 0,06 €/min, WOWPLUG 0,03 €/min + 0,16 €/carregamento.
 *
 * Distinguimos os dois pelo €/kWh: uma taxa de utilização OPC fica abaixo
 * de ~0,15 €/kWh; um preço completo nunca fica abaixo de ~0,25 €/kWh (a
 * energia com IVA já custa isso). O limiar fica no meio.
 *
 * Módulo puro (sem React, sem rede) para poder ser testado.
 */

/* €/kWh de energia + redes do comercializador (CEME), sem IVA. Só entra nos
 * postos com tarifa de operador. A app usa o cartão escolhido ou a média dos
 * cartões de lib/cartoesEV.js; isto é só o último recurso (2026: os cartões
 * principais andam entre 0,23 e 0,32 €/kWh com redes). */
export const ENERGIA_CEME_PADRAO = 0.26;

/* Tarifa da EGME (MOBI.E) que o comercializador cobra por carregamento,
 * sem IVA — ERSE, 2026. (A parte do operador já vem na taxa do posto.) */
export const EGME_SESSAO = 0.1088;

/* Imposto especial sobre a eletricidade, continente, €/kWh. */
export const IEC_KWH = 0.001;

/* Acima disto (€/kWh) o preço publicado é o preço final. */
export const LIMIAR_PRECO_COMPLETO = 0.2;

export const IVA = 0.23;

/* Até onde um posto da TomTom e um posto do MOBI.E contam como o mesmo. */
export const RAIO_JUNCAO_M = 80;

/* Perdas entre a rede e a bateria: paga-se a energia que sai do posto,
 * não a que fica na bateria. Em AC o carregador de bordo perde mais. */
const PERDAS = { AC: 1.1, DC: 1.05 };

/*
 * Minutos para ir de `de`% a `ate`%. Curva simples: potência total até 80%,
 * depois ~35% dela (a bateria abranda no fim).
 */
export function minutosCarregamento(bateriaKwh, de, ate, chargerKw, carMaxKw) {
  if (!bateriaKwh || !chargerKw || !carMaxKw || ate <= de) return null;
  const kw = Math.min(chargerKw, carMaxKw);
  if (!(kw > 0)) return null;
  const baixo = Math.max(0, Math.min(ate, 80) - Math.max(de, 0));
  const alto = Math.max(0, ate - Math.max(de, 80));
  const horas = (baixo / 100 * bateriaKwh + alto / 100 * bateriaKwh / 0.35) / kw;
  return Math.round(horas * 60);
}

export function formatarTempo(mins) {
  if (mins == null) return null;
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/* kWh que o posto fornece (e cobra) para levar a bateria de `de`% a `ate`%. */
export function kwhFornecidos(bateriaKwh, de, ate, corrente = "AC") {
  if (!bateriaKwh || ate <= de) return 0;
  const naBateria = (ate - de) / 100 * bateriaKwh;
  return naBateria * (PERDAS[corrente] || PERDAS.AC);
}

/* true se a tarifa publicada já é o preço final (energia e IVA incluídos). */
export function ePrecoCompleto(tarifa) {
  return !!tarifa && (+tarifa.kwh || 0) >= LIMIAR_PRECO_COMPLETO;
}

/*
 * Custo do carregamento, com IVA. Devolve null sem tarifa.
 *   { total, posto, energia, completo }
 *   completo = true → total é o preço publicado pelo posto (não estimado)
 *   posto    = parte do operador; energia = comercializador + taxas
 */
export function custoCarregamento({ kwh, minutos, tarifa, energiaKwh = ENERGIA_CEME_PADRAO, taxaCartao = 0 }) {
  if (!tarifa || !(kwh > 0)) return null;
  // Sem cartão (energiaKwh null) só os postos com preço final têm conta.
  if (energiaKwh === null && !ePrecoCompleto(tarifa)) return null;
  const t = { kwh: +tarifa.kwh || 0, min: +tarifa.min || 0, sessao: +tarifa.sessao || 0 };
  // Tarifa ao minuto sem tempo estimado: não dá para fazer contas honestas.
  if (t.min > 0 && !(minutos > 0)) return null;
  const posto = kwh * t.kwh + (minutos || 0) * t.min + t.sessao;

  // Parte paga pelo tempo ligado — é o que faz um posto lento sair caro
  // quando a tarifa é ao minuto.
  const tempo = (minutos || 0) * t.min;

  if (ePrecoCompleto(t)) {
    // Já com energia e IVA: não se soma nada.
    return { total: arred(posto), posto: arred(posto), energia: 0, tempo: arred(tempo), completo: true };
  }

  // taxaCartao: o que o próprio cartão cobra por carregamento (sem IVA).
  const energia = kwh * ((energiaKwh > 0 ? energiaKwh : 0) + IEC_KWH) + EGME_SESSAO + (taxaCartao > 0 ? taxaCartao : 0);
  const f = 1 + IVA;
  return {
    total: arred((posto + energia) * f),
    posto: arred(posto * f),
    energia: arred(energia * f),
    tempo: arred(tempo * f),
    completo: false,
  };
}

/*
 * Texto curto da tarifa: "0,45 €/kWh" ou "0,25 €/kWh · 0,05 €/min · 0,30 €/carreg."
 * Na tarifa de operador os valores são sem IVA (é assim que o MOBI.E os publica).
 */
export function descreverTarifa(tarifa) {
  if (!tarifa) return null;
  const partes = [];
  if (tarifa.kwh > 0) partes.push(`${eur(tarifa.kwh)} €/kWh`);
  if (tarifa.min > 0) partes.push(`${eur(tarifa.min)} €/min`);
  if (tarifa.sessao > 0) partes.push(`${eur(tarifa.sessao)} €/carreg.`);
  return partes.length ? partes.join(" · ") : "Sem taxa do posto";
}

function eur(v) {
  // Até 3 casas para tarifas pequenas (0,025 €/min), sem zeros a mais.
  const s = v < 0.1 ? v.toFixed(3).replace(/0$/, "") : v.toFixed(2);
  return s.replace(".", ",");
}

function arred(v) {
  return Math.round(v * 100) / 100;
}

/* ─── junção posto ↔ tarifas MOBI.E ───────────────────────────────────── */

export function distanciaM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* Células de ~1 km: chega para procurar só nas vizinhas. */
const CELULA = 0.01;
const chave = (la, lo) => `${Math.floor(la / CELULA)}:${Math.floor(lo / CELULA)}`;

/*
 * Índice espacial das tarifas.
 * Entrada: [[lat, lon, operador, [[kW, corrente, kwh, min, sessao], ...]], ...]
 */
export function indexarTarifas(postos) {
  const grelha = new Map();
  for (const p of postos || []) {
    if (!Array.isArray(p) || p.length < 4) continue;
    const [lat, lon, operador, pontos] = p;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const site = {
      lat, lon, operador,
      pontos: (pontos || []).map(([kw, corrente, kwh, min, sessao]) => ({
        kw: +kw || 0, corrente, tarifa: { kwh: +kwh || 0, min: +min || 0, sessao: +sessao || 0 },
      })),
    };
    const k = chave(lat, lon);
    if (!grelha.has(k)) grelha.set(k, []);
    grelha.get(k).push(site);
  }
  return grelha;
}

/* Posto MOBI.E mais próximo de (lat, lon), até `raioM` metros. */
export function tarifasPerto(indice, lat, lon, raioM = RAIO_JUNCAO_M) {
  if (!indice || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const ci = Math.floor(lat / CELULA), cj = Math.floor(lon / CELULA);
  let melhor = null, melhorD = Infinity;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      for (const s of indice.get(`${ci + di}:${cj + dj}`) || []) {
        const d = distanciaM(lat, lon, s.lat, s.lon);
        if (d < melhorD) { melhor = s; melhorD = d; }
      }
    }
  }
  return melhorD <= raioM ? melhor : null;
}

/*
 * A tarifa de um conector: ponto do mesmo tipo de corrente com a potência
 * mais próxima. Com corrente desconhecida, a potência decide sozinha.
 */
export function tarifaDoConector(site, { kw, corrente } = {}) {
  if (!site?.pontos?.length) return null;
  const candidatos = corrente ? site.pontos.filter(p => p.corrente === corrente) : site.pontos;
  if (!candidatos.length) return null;
  const alvo = +kw || 0;
  let melhor = candidatos[0];
  for (const p of candidatos) {
    if (Math.abs(p.kw - alvo) < Math.abs(melhor.kw - alvo)) melhor = p;
  }
  return melhor.tarifa;
}
