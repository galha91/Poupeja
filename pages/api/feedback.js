import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { limparTexto } from "../../lib/metricas";

// "Isto foi útil?" (FoiUtil.jsx). Sem id de pessoa: contexto, resposta e,
// se a pessoa escrever, uma frase curta (sem emails nem números longos).
const CONTEXTOS = new Set(["lista", "comparar"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "feedback", 6, 10 * 60_000)) return res.status(429).end();
  const { contexto, util, texto } = req.body || {};
  if (!CONTEXTOS.has(contexto) || typeof util !== "boolean") return res.status(400).end();
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();
  const frase = limparTexto(texto || "", 280) || null;
  const { error } = await admin.from("feedback_app").insert({ contexto, util, texto: frase });
  return res.status(error ? 500 : 204).end();
}
