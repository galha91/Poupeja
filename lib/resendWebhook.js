import { Resend } from "resend";

/*
 * Estatísticas dos emails (entregues, abertos, cliques, devolvidos, queixas).
 *
 * O Resend avisa-nos por webhook (pages/api/resend-webhook.js). O webhook
 * cria-se sozinho: a primeira vez que o /admin abre (ou o resumo diário
 * corre) sem ele, usa-se a RESEND_API_KEY para o criar e guarda-se o
 * segredo de assinatura em admin_config ("resend_webhook"). Nada a fazer à mão.
 */

export const EVENTOS = ["email.delivered", "email.opened", "email.clicked", "email.bounced", "email.complained", "email.failed", "email.delivery_delayed"];
export const NOME_EVENTO = {
  "email.delivered": "entregue", "email.opened": "aberto", "email.clicked": "clique", "email.bounced": "devolvido",
  "email.complained": "queixa", "email.failed": "falhou", "email.delivery_delayed": "atrasado",
};

const base = () => process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
export const urlWebhook = () => `${base()}/api/resend-webhook`;

let cache = null;
export async function segredoWebhook(admin) {
  if (process.env.RESEND_WEBHOOK_SECRET) return process.env.RESEND_WEBHOOK_SECRET;
  if (cache) return cache;
  const { data } = await admin.from("admin_config").select("valor").eq("chave", "resend_webhook").maybeSingle();
  cache = data?.valor?.segredo || null;
  return cache;
}

// Liga o rastreio de aberturas e cliques no domínio de envio (decisão do
// dono, 2 nov 2026; a política de privacidade explica-o).
const DOMINIO = "xn--poupej-uta.com";
async function ligarRastreio(resend) {
  const lista = await resend.domains.list();
  if (lista.error) throw new Error(lista.error.message);
  const dominio = (lista.data?.data || []).find((d) => d.name === DOMINIO || d.name === "poupejá.com");
  if (!dominio) throw new Error(`domínio ${DOMINIO} não encontrado no Resend`);
  const r = await resend.domains.update({ id: dominio.id, openTracking: true, clickTracking: true });
  if (r.error) throw new Error(r.error.message);
}

// Garante que o webhook existe (e o rastreio ligado). Devolve { estado: "ligado" | "sem-chave" | "erro", erro? }.
export async function garantirWebhook(admin) {
  if (!process.env.RESEND_API_KEY) return { estado: "sem-chave" };
  const { data: guardado } = await admin.from("admin_config").select("valor").eq("chave", "resend_webhook").maybeSingle();
  if (guardado?.valor?.segredo && guardado.valor.rastreio) return { estado: "ligado" };
  if (guardado?.valor?.segredo) {
    try {
      await ligarRastreio(new Resend(process.env.RESEND_API_KEY));
      await admin.from("admin_config").update({ valor: { ...guardado.valor, rastreio: true }, atualizado_em: new Date().toISOString() }).eq("chave", "resend_webhook");
      return { estado: "ligado" };
    } catch (e) {
      return { estado: "ligado", aviso: `rastreio: ${String(e.message || e).slice(0, 150)}` };
    }
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const destino = urlWebhook();
    const lista = await resend.webhooks.list();
    if (lista.error) throw new Error(lista.error.message);
    const existente = (lista.data?.data || []).find((w) => w.endpoint === destino);
    let id, segredo;
    if (existente) {
      const um = await resend.webhooks.get(existente.id);
      if (um.error) throw new Error(um.error.message);
      ({ id, signing_secret: segredo } = um.data);
    } else {
      const novo = await resend.webhooks.create({ endpoint: destino, events: EVENTOS });
      if (novo.error) throw new Error(novo.error.message);
      ({ id, signing_secret: segredo } = novo.data);
    }
    let rastreio = false;
    try { await ligarRastreio(resend); rastreio = true; } catch (_) {}
    await admin.from("admin_config").upsert({ chave: "resend_webhook", valor: { id, segredo, endpoint: destino, rastreio, criado: new Date().toISOString() }, atualizado_em: new Date().toISOString() });
    cache = segredo;
    return { estado: "ligado" };
  } catch (e) {
    return { estado: "erro", erro: String(e.message || e).slice(0, 200) };
  }
}
