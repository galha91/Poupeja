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

/*
 * Três servidores Overpass públicos, ao mesmo tempo: ganha o primeiro que
 * responder. O principal (overpass-api.de) anda muitas vezes sobrecarregado
 * e chegava a passar dos 12 s — o pedido era cancelado e a pessoa via
 * "não conseguimos ver as lojas".
 */
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const PRAZO_MS = 9000;
const TIPOS = ["Gasóleo", "Gasolina 95"];

const r2 = (n) => Math.round(n * 100) / 100;

/*
 * Pesquisa leve: só "supermercados numa caixa", sem expressões regulares
 * sobre nomes (eram elas que tornavam o pedido lento). A marca escolhe-se
 * aqui, com cadeiaDe. Lojas de conveniência só com marca (Pingo Doce & Go,
 * My Auchan, Continente Bom Dia).
 */
function consulta(lat, lon) {
  const dLat = RAIO_KM / 111;
  const dLon = RAIO_KM / (111 * Math.cos((lat * Math.PI) / 180));
  const bbox = [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map((n) => n.toFixed(4)).join(",");
  return `[out:json][timeout:8][bbox:${bbox}];(nwr["shop"="supermarket"];nwr["shop"="convenience"]["brand"];);out tags center qt 1500;`;
}

async function pedir(url, q, sinal) {
  const r = await fetch(url, {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "PoupeJa/1.0 (https://xn--poupej-uta.com)" },
    signal: sinal,
  });
  if (!r.ok) throw new Error(`Overpass ${r.status}`);
  const j = await r.json();
  if (!Array.isArray(j.elements)) throw new Error("Overpass sem elementos");
  return j.elements;
}

async function lojasOsm(lat, lon) {
  const q = consulta(lat, lon);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PRAZO_MS);
  try {
    const elementos = await Promise.any(OVERPASS.map((u) => pedir(u, q, ctrl.signal)));
    const vistos = new Set();
    return elementos.map((e) => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      const cadeia = cadeiaDe(e.tags);
      const id = `${e.type}/${e.id}`;
      if (!cadeia || !Number.isFinite(la) || !Number.isFinite(lo) || vistos.has(id)) return null;
      vistos.add(id);
      return { cadeia, nome: e.tags?.name || null, lat: la, lon: lo };
    }).filter(Boolean);
  } catch (e) {
    // Promise.any falha com AggregateError: mostrar a razão de cada servidor.
    throw new Error(e?.errors ? e.errors.map((x) => x.message).join(" | ") : e.message);
  } finally {
    clearTimeout(t);
    ctrl.abort(); // os que perderam a corrida deixam de esperar
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
