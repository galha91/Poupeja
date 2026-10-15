import { excedeuLimite } from "../../lib/protecao-api";
import { cadeiaDe, RAIO_KM } from "../../lib/rota";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

/*
 * GET /api/lojas-perto?lat=38.71&lon=-9.14&tipo=Gasóleo
 *
 * Supermercados das cadeias comparadas num raio de 15 km (OpenStreetMap,
 * via Overpass) e o preço médio do combustível no país hoje (DGEG, tabela
 * precos_dgeg_diario). Serve o "Compensa ir a dois supermercados?".
 *
 * A posição chega arredondada a 2 casas (~1 km): chega para escolher a
 * loja mais perto, não identifica a casa de ninguém, e faz com que a
 * mesma zona dê o mesmo URL (cache da CDN). Nada é guardado.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter";
const MARCAS = "Continente|Pingo Doce|Auchan|Lidl|Aldi";
const TIPOS = ["Gasóleo", "Gasolina 95"];

const r2 = (n) => Math.round(n * 100) / 100;

async function lojasOsm(lat, lon) {
  const raio = RAIO_KM * 1000;
  const q = `[out:json][timeout:12];(
    nwr["shop"~"supermarket|convenience"]["brand"~"${MARCAS}",i](around:${raio},${lat},${lon});
    nwr["shop"~"supermarket|convenience"]["name"~"${MARCAS}",i](around:${raio},${lat},${lon});
  );out center 300;`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(OVERPASS, {
      method: "POST",
      body: "data=" + encodeURIComponent(q),
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "PoupeJa/1.0 (https://poupejá.com)" },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Overpass ${r.status}`);
    const j = await r.json();
    const vistos = new Set();
    return (j.elements || []).map((e) => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      const cadeia = cadeiaDe(e.tags);
      const id = `${e.type}/${e.id}`;
      if (!cadeia || !Number.isFinite(la) || !Number.isFinite(lo) || vistos.has(id)) return null;
      vistos.add(id);
      return { cadeia, nome: e.tags?.name || null, lat: la, lon: lo };
    }).filter(Boolean);
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
    lojasOsm(lat, lon).catch((e) => { console.warn("lojas-perto:", e.message); return null; }),
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
