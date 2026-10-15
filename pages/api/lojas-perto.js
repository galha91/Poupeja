import { excedeuLimite } from "../../lib/protecao-api";
import { cadeiaDe } from "../../lib/rota";
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
  const url = `${PHOTON}?q=${encodeURIComponent(nome)}&lat=${lat}&lon=${lon}&limit=10&osm_tag=shop:supermarket&location_bias_scale=0.1`;
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
  return res.status(200).json({ lat, lon, lojas, combustivel });
}
