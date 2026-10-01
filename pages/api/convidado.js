import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";

// Regista aberturas e conversões do modo convidado (ver lib/convidado.js).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "convidado", 20)) return res.status(429).end();

  const { id, converteu } = req.body || {};
  if (typeof id !== "string" || !UUID.test(id)) return res.status(400).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();

  const { error } = await admin.rpc("registar_convidado", { p_id: id, p_converteu: converteu === true });
  return res.status(error ? 500 : 204).end();
}
