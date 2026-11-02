import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { eBot } from "../../lib/visitas";
import { normalizarItem } from "../../lib/metricas";

// Recebe um lote de métricas anónimas do browser (ver lib/analytics.js) e
// soma-as às contagens do dia. Nada aqui identifica quem as mandou.
const MAX_ITENS = 25;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "metrica", 30)) return res.status(429).end();
  if (eBot(req.headers["user-agent"] || "")) return res.status(204).end();

  // sendBeacon manda texto simples; fetch manda JSON. Aceita os dois.
  let corpo = req.body;
  if (typeof corpo === "string") { try { corpo = JSON.parse(corpo); } catch { return res.status(400).end(); } }
  const brutos = Array.isArray(corpo?.itens) ? corpo.itens.slice(0, MAX_ITENS) : [];
  const itens = brutos.map(normalizarItem).filter(Boolean);
  if (!itens.length) return res.status(204).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();
  const { error } = await admin.rpc("registar_metricas", { p_itens: itens });
  return res.status(error ? 500 : 204).end();
}
