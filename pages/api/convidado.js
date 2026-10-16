import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";

// Regista aberturas e conversões do modo convidado (ver lib/convidado.js).
const MARCOS = ["comparou", "escolheu", "alerta", "pediu_conta"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "convidado", 20)) return res.status(429).end();

  const { id, converteu, marco } = req.body || {};
  if (typeof id !== "string" || !UUID.test(id)) return res.status(400).end();
  if (marco !== undefined && !MARCOS.includes(marco)) return res.status(400).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();

  // Um marco do percurso (só se o convidado já existe: ver marcar_convidado).
  if (marco) {
    const { error } = await admin.rpc("marcar_convidado", { p_id: id, p_marco: marco });
    return res.status(error ? 500 : 204).end();
  }

  const { error } = await admin.rpc("registar_convidado", { p_id: id, p_converteu: converteu === true });
  return res.status(error ? 500 : 204).end();
}
