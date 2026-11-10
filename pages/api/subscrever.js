import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { emailValido, normalizarEmail, padraoEmail } from "../../lib/subscritores";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const { email, origem, consentimento, convidado } = req.body || {};
  const convidadoId = typeof convidado === "string" && UUID.test(convidado) ? convidado : null;
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
    .ilike("email", padraoEmail(limpo))
    .maybeSingle();

  if (existente) {
    if (existente.cancelado_em) {
      await admin.from("subscritores_folhetos").update({ cancelado_em: null }).eq("id", existente.id);
    }
    return res.status(200).json({ ok: true });
  }

  const { error } = await admin.from("subscritores_folhetos").insert({ email: limpo, origem: origemLimpa, convidado_id: convidadoId });
  if (convidadoId) await admin.from("convidados_site").update({ email_em: new Date().toISOString() }).eq("id", convidadoId).is("email_em", null).then(() => {}, () => {});
  if (error && error.code !== "23505") {
    console.error("subscrever: erro a gravar:", error.message);
    return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
  }
  return res.status(200).json({ ok: true });
}
