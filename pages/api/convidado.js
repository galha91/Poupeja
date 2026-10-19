import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { eBot } from "../../lib/visitas";
import { construirFicha, SECOES, RESPOSTAS } from "../../lib/fichaConvidado";

// Regista aberturas, conversões e o percurso do modo convidado (ver lib/convidado.js).
const MARCOS = ["comparou", "escolheu", "alerta", "pediu_conta"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).end();
  if (excedeuLimite(req, "convidado", 30)) return res.status(429).end();
  // Robôs (pré-visualizações, crawlers) não são pessoas.
  if (eBot(req.headers["user-agent"])) return res.status(204).end();

  const { id, converteu, marco, secao, resposta, chegada } = req.body || {};
  if (typeof id !== "string" || !UUID.test(id)) return res.status(400).end();
  if (marco !== undefined && !MARCOS.includes(marco)) return res.status(400).end();
  if (secao !== undefined && !SECOES.has(secao)) return res.status(400).end();
  if (resposta !== undefined && !RESPOSTAS.has(resposta)) return res.status(400).end();

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();

  // Um marco do percurso (só se o convidado já existe: ver marcar_convidado).
  if (marco) {
    const { error } = await admin.rpc("marcar_convidado", { p_id: id, p_marco: marco });
    return res.status(error ? 500 : 204).end();
  }
  if (secao) {
    const { error } = await admin.rpc("marcar_secao_convidado", { p_id: id, p_secao: secao });
    return res.status(error ? 500 : 204).end();
  }
  if (resposta) {
    const { error } = await admin.rpc("responder_convidado", { p_id: id, p_resposta: resposta });
    return res.status(error ? 500 : 204).end();
  }

  const { error } = await admin.rpc("registar_convidado_ficha", {
    p_id: id,
    p_converteu: converteu === true,
    p_ficha: converteu === true ? null : construirFicha(req.headers, chegada && typeof chegada === "object" ? chegada : {}),
  });
  return res.status(error ? 500 : 204).end();
}
