import { excedeuLimite } from "../../lib/protecao-api";
import { cadeiaDe, maisPertoPorCadeia, RAIO_KM } from "../../lib/rota";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

/*
 * GET /api/lojas-perto?lat=38.71&lon=-9.14&tipo=Gasóleo
 *
 * Supermercados das cadeias comparadas perto (OpenStreetMap, via Photon) e o preço médio do combustível no país hoje (DGEG, tabela
 * precos_dgeg_diario). Serve o "Compensa ir a dois supermercados?".
 *
 * A posição chega arredondada a 2 casas (~1 km): chega para escolher a
 * loja mais perto, não identifica a casa de ninguém, e faz com que a
 * mesma zona dê o mesmo URL (cache da CDN). Nada é guardado.
 */

/*
 * Lojas perto pelo Photon (photon.komoot.io): pesquisa de lugares sobre os
 * dados do OpenStreetMap, com os resultados ordenados pela proximidade.
 * Uma pesquisa por cadeia, as cinco em paralelo.
 *
 * Antes era o Overpass: os servidores públicos andam sobrecarregados e
 * recusam pedidos vindos da nuvem (502 "at capacity" e 500 nos três
 * espelhos), e a pessoa via sempre "não conseguimos ver as lojas".
 */
const PHOTON = "https://photon.komoot.io/api/";
const CADEIAS = ["Continente", "Pingo Doce", "Auchan", "Lidl", "Aldi"];
const PRAZO_MS = 8000;
const TIPOS = ["Gasóleo", "Gasolina 95"];

const r2 = (n) => Math.round(n * 100) / 100;

async function lojasDaCadeia(nome, lat, lon, sinal) {
  const url = `${PHOTON}?q=${encodeURIComponent(nome)}&lat=${lat}&lon=${lon}&limit=15&osm_tag=shop:supermarket&location_bias_scale=0.1`;
  const r = await fetch(url, { headers: { "User-Agent": "PoupeJa/1.0 (https://xn--poupej-uta.com)" }, signal: sinal });
  if (!r.ok) throw new Error(`Photon ${r.status}`);
  const j = await r.json();
  return (j.features || []).map((f) => {
    const [lo, la] = f.geometry?.coordinates || [];
    const cadeia = cadeiaDe({ name: f.properties?.name, brand: f.properties?.brand });
    if (!cadeia || !Number.isFinite(la) || !Number.isFinite(lo)) return null;
    return { cadeia, nome: f.properties?.name || null, lat: la, lon: lo, id: `${f.properties?.osm_type}${f.properties?.osm_id}` };
  }).filter(Boolean);
}

async function lojasPerto(lat, lon) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PRAZO_MS);
  try {
    // Uma cadeia que falhe não estraga as outras; só falha se falharem todas.
    const res = await Promise.allSettled(CADEIAS.map((c) => lojasDaCadeia(c, lat, lon, ctrl.signal)));
    const ok = res.filter((x) => x.status === "fulfilled");
    if (!ok.length) throw new Error(res.map((x) => x.reason?.message).join(" | "));
    const vistos = new Set();
    return ok.flatMap((x) => x.value).filter((l) => (vistos.has(l.id) ? false : vistos.add(l.id)));
  } finally {
    clearTimeout(t);
  }
}

/*
 * Distâncias reais por estrada (OSRM, router.project-osrm.org).
 *   1. casa → todas as lojas encontradas: escolhe a mais perto de cada
 *      cadeia POR ESTRADA (a mais perto em linha reta pode ficar do outro
 *      lado do rio);
 *   2. matriz completa entre casa e as escolhidas, para a volta da divisão.
 * Se o OSRM falhar, fica a escolha em linha reta e a app estima.
 */
const OSRM = "https://router.project-osrm.org/table/v1/driving/";

async function tabelaOsrm(pontos, extra = "") {
  const coords = pontos.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`${OSRM}${coords}?annotations=distance,duration${extra}`, {
      headers: { "User-Agent": "PoupeJa/1.0 (https://xn--poupej-uta.com)" }, signal: ctrl.signal,
    });
    const j = await r.json();
    if (!r.ok || j.code !== "Ok") throw new Error(`OSRM ${r.status} ${j.code || ""}`);
    return j;
  } finally {
    clearTimeout(t);
  }
}

async function distancias(casa, lojas) {
  let perto = maisPertoPorCadeia(lojas, casa, RAIO_KM * 2);
  let fonte = "estimativa";
  let matriz = null;
  try {
    const cand = lojas.slice(0, 90); // o OSRM público aceita até 100 pontos
    const t1 = await tabelaOsrm([casa, ...cand], "&sources=0");
    const porEstrada = {};
    cand.forEach((l, i) => {
      const m = t1.distances?.[0]?.[i + 1];
      if (!Number.isFinite(m) || m / 1000 > RAIO_KM * 2) return;
      if (!porEstrada[l.cadeia] || m < porEstrada[l.cadeia].m) porEstrada[l.cadeia] = { ...l, m };
    });
    if (Object.keys(porEstrada).length) perto = porEstrada;
    const ids = ["casa", ...Object.keys(perto)];
    const t2 = await tabelaOsrm([casa, ...ids.slice(1).map((c) => perto[c])]);
    matriz = {
      ids,
      km: t2.distances.map((linha) => linha.map((m) => (Number.isFinite(m) ? Math.round(m / 100) / 10 : null))),
      min: t2.durations.map((linha) => linha.map((s) => (Number.isFinite(s) ? Math.round(s / 6) / 10 : null))),
    };
    fonte = "estrada";
  } catch (e) {
    console.warn("lojas-perto: OSRM falhou, fica a estimativa:", e.message);
  }
  const limpo = Object.fromEntries(Object.entries(perto).map(([c, l]) => [c, { cadeia: c, nome: l.nome, lat: l.lat, lon: l.lon }]));
  return { perto: limpo, matriz, fonte };
}

async function precoCombustivel(tipo) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("precos_dgeg_diario")
    .select("dia, media").eq("escopo", "pais").eq("chave", "*").eq("tipo", tipo)
    .order("dia", { ascending: false }).limit(1);
  if (error || !data?.[0]) return null;
  return { tipo, preco: Number(data[0].media), dia: data[0].dia };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido." });
  const lat = r2(parseFloat(req.query.lat));
  const lon = r2(parseFloat(req.query.lon));
  // Portugal continental e ilhas, com folga.
  if (!(lat > 32 && lat < 43 && lon > -32 && lon < -6)) {
    return res.status(400).json({ erro: "Localização fora de Portugal." });
  }
  const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : "Gasóleo";
  if (excedeuLimite(req, "lojas-perto", 20)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a um minuto." });
  }

  const [lojas, combustivel] = await Promise.all([
    lojasPerto(lat, lon).catch((e) => { console.warn("lojas-perto:", e.message); return null; }),
    precoCombustivel(tipo).catch(() => null),
  ]);
  if (!lojas) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ erro: "Não conseguimos ver as lojas perto agora. Tenta daqui a pouco." });
  }
  // As lojas mudam pouco: um dia de cache por zona chega.
  // Sem preço do combustível, cache curta para ele aparecer depressa.
  res.setHeader("Cache-Control", combustivel
    ? "public, s-maxage=86400, stale-while-revalidate=3600"
    : "public, s-maxage=600");
  const { perto, matriz, fonte } = await distancias({ lat, lon }, lojas);
  return res.status(200).json({ lat, lon, perto, matriz, fonte, combustivel });
}
