import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { emailValido, normalizarEmail } from "../../lib/subscritores";
import { tipoNegocioValido, disposicaoValida } from "../../lib/cabazNegocios";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
 * Lista de espera do PoupeJá Negócios (página /negocios), sem conta.
 * Consentimento explícito no formulário. Guarda o email, o tipo de negócio
 * e quanto a pessoa disse que pagaria por mês. Quem volta a preencher
 * atualiza a resposta; a API não revela se o email já existia.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, "negocios", 5, 10 * 60_000)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  const { email, tipo, pagaria, origem, consentimento, convidado } = req.body || {};
  if (consentimento !== true) return res.status(400).json({ erro: "Falta aceitar seres avisado por email." });
  if (!emailValido(email)) return res.status(400).json({ erro: "Escreve um email válido." });
  if (!tipoNegocioValido(tipo)) return res.status(400).json({ erro: "Escolhe o tipo de negócio." });
  if (!disposicaoValida(pagaria)) return res.status(400).json({ erro: "Diz-nos quanto pagarias." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível. Tenta mais tarde." });

  const limpo = normalizarEmail(email);
  const linha = {
    tipo, pagaria,
    origem: typeof origem === "string" ? origem.slice(0, 40) : null,
    convidado_id: typeof convidado === "string" && UUID.test(convidado) ? convidado : null,
    cancelado_em: null,
  };

  const { data: existente } = await admin.from("interesse_negocios").select("id").ilike("email", limpo).maybeSingle();
  const { error } = existente
    ? await admin.from("interesse_negocios").update(linha).eq("id", existente.id)
    : await admin.from("interesse_negocios").insert({ email: limpo, ...linha });
  if (error && error.code !== "23505") {
    console.error("negocios-interesse: erro a gravar:", error.message);
    return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
  }
  return res.status(200).json({ ok: true });
}
