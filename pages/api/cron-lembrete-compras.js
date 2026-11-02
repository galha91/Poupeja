import { Resend } from "resend";
import { bearerValido } from "../../lib/seguranca";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { diaDaSemanaLisboa, DIAS } from "../../lib/lembreteCompras";
import { urlCancelarLembrete } from "../../lib/subscritoresToken";
import { comRegisto } from "../../lib/cronRegisto";

/*
 * Lembrete do dia das compras (Vercel Cron, todas as manhãs). Escreve só a
 * quem escolheu o dia de hoje, uma vez por dia, com a lista que tem e um
 * botão para ver onde fica mais barata. Envia em lotes de 100 (Resend batch).
 */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function emailLembrete(l, base) {
  const abrir = `${base}/?atalho=lista&o=email-lembrete`;
  const itens = Array.isArray(l.itens) ? l.itens : [];
  const lista = itens.length
    ? `<ul style="margin:12px 0 0;padding-left:18px;color:#2c3b33;font-size:14px;line-height:1.7;">${itens.slice(0, 12).map(i => `<li>${esc(i)}</li>`).join("")}${itens.length > 12 ? `<li style="color:#636d66;">e mais ${itens.length - 12}</li>` : ""}</ul>`
    : `<p style="font-size:14px;color:#5c6b62;margin:12px 0 0;">A tua lista está vazia — junta o que precisas e vê onde fica mais barato.</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#f6f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;"><tr><td>
    <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#636d66;">Dia de compras</div>
    <h1 style="font-size:21px;margin:6px 0 4px;color:#14231c;">Antes de saíres, vê onde fica mais barato</h1>
    <p style="font-size:14px;color:#5c6b62;margin:0;">${itens.length ? `A tua lista tem ${itens.length} ${itens.length === 1 ? "artigo" : "artigos"}:` : ""}</p>
    ${lista}
    <p style="margin:20px 0 0;"><a href="${abrir}" style="display:inline-block;background:#0b6b4f;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 24px;border-radius:12px;">Comparar a minha lista</a></p>
    <p style="font-size:12px;color:#636d66;margin:22px 0 0;">Recebes este lembrete à ${DIAS[l.dia - 1]} porque o pediste no PoupeJá. <a href="${urlCancelarLembrete(base, l.id)}" style="color:#636d66;">Cancelar</a></p>
  </td></tr></table></body></html>`;
  return { subject: itens.length ? `🛒 Dia de compras: ${itens.length} ${itens.length === 1 ? "artigo" : "artigos"} na tua lista` : "🛒 Dia de compras", html };
}

async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) return res.status(401).json({ erro: "Não autorizado." });
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Sem Supabase." });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ enviados: 0, motivo: "Sem RESEND_API_KEY." });

  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const { data, error } = await admin.from("lembretes_compras").select("id, email, dia, itens, envios, ultimo_envio")
    .eq("dia", diaDaSemanaLisboa()).is("cancelado_em", null).or(`ultimo_envio.is.null,ultimo_envio.lt.${hoje}`).limit(1000);
  if (error) return res.status(500).json({ erro: error.message });

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const resend = new Resend(process.env.RESEND_API_KEY);
  let enviados = 0;
  for (let i = 0; i < (data || []).length; i += 100) {
    const lote = data.slice(i, i + 100);
    const { error: e } = await resend.batch.send(lote.map(l => ({
      from: "PoupeJá <noreply@xn--poupej-uta.com>", to: l.email, ...emailLembrete(l, base),
      headers: { "List-Unsubscribe": `<${urlCancelarLembrete(base, l.id)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    })));
    if (e) { console.error("cron-lembrete-compras:", e.message); continue; }
    enviados += lote.length;
    await Promise.all(lote.map(l => admin.from("lembretes_compras").update({ ultimo_envio: hoje, envios: (l.envios || 0) + 1 }).eq("id", l.id).then(() => {}, () => {})));
  }
  return res.status(200).json({ lembretes: data?.length || 0, enviados });
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-lembrete-compras", handler);
