import { Resend } from "resend";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { NOME_EVENTO, segredoWebhook } from "../../lib/resendWebhook";

/*
 * Eventos dos emails, enviados pelo Resend (ver lib/resendWebhook.js).
 * Só se guardam contagens por dia e por tipo de email (metricas_dia, tipo
 * "email") — nunca o endereço. Exceção de higiene: um email devolvido de
 * vez ou uma queixa de spam cancela as subscrições desse endereço, para não
 * voltarmos a escrever-lhe.
 */
export const config = { api: { bodyParser: false } };

async function lerCorpo(req) {
  const partes = [];
  for await (const p of req) partes.push(typeof p === "string" ? Buffer.from(p) : p);
  return Buffer.concat(partes).toString("utf8");
}

const TABELAS_EMAIL = ["subscritores_folhetos", "subscritores_combustivel", "alertas_email", "lembretes_compras"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).end();
  const segredo = await segredoWebhook(admin).catch(() => null);
  if (!segredo) return res.status(503).end();

  const corpo = await lerCorpo(req);
  let evento;
  try {
    evento = new Resend(process.env.RESEND_API_KEY || "re_verificar").webhooks.verify({
      payload: corpo,
      headers: { id: req.headers["svix-id"], timestamp: req.headers["svix-timestamp"], signature: req.headers["svix-signature"] },
      webhookSecret: segredo,
    });
  } catch {
    return res.status(401).end();
  }

  const nome = NOME_EVENTO[evento?.type];
  if (!nome) return res.status(204).end();
  const tipo = evento.data?.tags?.tipo || "outro";
  await admin.rpc("registar_metricas", { p_itens: [{ tipo: "email", chave: nome, detalhe: String(tipo).slice(0, 40), valor: 0, bom: false }] }).then(() => {}, () => {});

  const devolvidoDeVez = nome === "devolvido" && /permanent/i.test(evento.data?.bounce?.type || "");
  if (devolvidoDeVez || nome === "queixa") {
    const agora = new Date().toISOString();
    for (const email of evento.data?.to || []) {
      for (const t of TABELAS_EMAIL) {
        await admin.from(t).update({ cancelado_em: agora }).ilike("email", String(email).toLowerCase()).is("cancelado_em", null).then(() => {}, () => {});
      }
    }
  }
  return res.status(204).end();
}
