import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { emailValido, normalizarEmail, slugConcelhoValido } from "../../lib/subscritores";
import { encontrarMunicipio } from "../../lib/municipios";

/*
 * Subscrição do email semanal de combustível de um concelho, sem conta.
 * Consentimento explícito; cada email traz link de cancelamento.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, "subscrever-combustivel", 5, 10 * 60_000)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  const { email, concelho, consentimento, alerta } = req.body || {};
  const alertaSubidas = alerta === true; // segundo consentimento, opcional
  if (consentimento !== true) return res.status(400).json({ erro: "Falta aceitar receber o email." });
  if (!emailValido(email)) return res.status(400).json({ erro: "Escreve um email válido." });
  if (!slugConcelhoValido(concelho)) return res.status(400).json({ erro: "Concelho inválido." });

  // Só concelhos que têm página (os mesmos que têm dados da DGEG).
  const municipio = await encontrarMunicipio(concelho).catch(() => null);
  if (!municipio) return res.status(400).json({ erro: "Concelho não encontrado." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível. Tenta mais tarde." });

  const limpo = normalizarEmail(email);
  const { data: existente } = await admin
    .from("subscritores_combustivel")
    .select("id, cancelado_em")
    .ilike("email", limpo)
    .eq("concelho", concelho)
    .maybeSingle();

  if (existente) {
    const mudar = {};
    if (existente.cancelado_em) mudar.cancelado_em = null;
    if (alertaSubidas) mudar.alerta_subidas = true; // desmarcar aqui não desliga: isso faz-se no email
    if (Object.keys(mudar).length) {
      await admin.from("subscritores_combustivel").update(mudar).eq("id", existente.id);
    }
    return res.status(200).json({ ok: true, concelho: municipio.nome });
  }

  const { error } = await admin.from("subscritores_combustivel").insert({ email: limpo, concelho, alerta_subidas: alertaSubidas });
  if (error && error.code !== "23505") {
    console.error("subscrever-combustivel: erro a gravar:", error.message);
    return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
  }
  return res.status(200).json({ ok: true, concelho: municipio.nome });
}
