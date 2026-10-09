import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { emailValido, normalizarEmail } from "../../lib/subscritores";

/*
 * Subscrição do resumo de folhetos SEM conta. Consentimento explícito no
 * formulário; cada email traz link de cancelamento (ver cron-email-semanal
 * e /api/cancelar-subscricao).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, "subscrever", 5, 10 * 60_000)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  const { email, origem, consentimento } = req.body || {};
  if (consentimento !== true) return res.status(400).json({ erro: "Falta aceitar receber o resumo." });
  if (!emailValido(email)) return res.status(400).json({ erro: "Escreve um email válido." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível. Tenta mais tarde." });

  const limpo = normalizarEmail(email);
  const origemLimpa = typeof origem === "string" ? origem.slice(0, 40) : null;

  // Já existe? Reativa se tinha cancelado; não revela ao cliente se existia.
  const { data: existente } = await admin
    .from("subscritores_folhetos")
    .select("id, cancelado_em")
    .ilike("email", limpo)
    .maybeSingle();

  if (existente) {
    if (existente.cancelado_em) {
      await admin.from("subscritores_folhetos").update({ cancelado_em: null }).eq("id", existente.id);
    }
    return res.status(200).json({ ok: true });
  }

  const { error } = await admin.from("subscritores_folhetos").insert({ email: limpo, origem: origemLimpa });
  if (error && error.code !== "23505") {
    console.error("subscrever: erro a gravar:", error.message);
    return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
  }
  return res.status(200).json({ ok: true });
}
