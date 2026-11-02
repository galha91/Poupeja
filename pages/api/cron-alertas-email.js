import { Resend } from "resend";
import { enviarEmail, etiqueta } from "../../lib/enviarEmail";
import { bearerValido } from "../../lib/seguranca";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { precosDosAlertas } from "../../lib/precosAlertas";
import { decidirAviso } from "../../lib/alertasEmail";
import { urlCancelarAlerta } from "../../lib/subscritoresToken";
import { eur } from "../../lib/formato";
import { comRegisto } from "../../lib/cronRegisto";

/*
 * Alertas de preço por email (Vercel Cron, diário, depois do cron-avisos).
 * Lê os alertas ativos, procura uma vez o preço de cada pesquisa e manda a
 * cada email UM só email com os alertas que dispararam hoje. Sem nada a
 * dizer, não escreve.
 */

const MAX_PESQUISAS = 30; // cabe nos 60 s da função (2 de cada vez, com pausa)
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const porUnid = (u) => (u === "embalagem" ? "" : `/${u}`);

function construirEmail(itens, base) {
  const linhas = itens.map(({ alerta: a, atual, motivo }) => {
    const titulo = motivo === "promo" ? `${cap(a.q)} em promoção` : `${cap(a.q)} a ${eur(atual.valor, 2)} €${porUnid(atual.unidade)}`;
    const detalhe = motivo === "alvo"
      ? `Abaixo do teu alvo de ${eur(Number(a.alvo), 2)} €${porUnid(a.unidade)}`
      : motivo === "desceu" ? `Estava a ${eur(Number(a.referencia), 2)} €${porUnid(a.unidade)} quando começaste a vigiar` : `A ${eur(atual.valor, 2)} €${porUnid(atual.unidade)}`;
    const abrir = `${base}/?atalho=mercados&q=${encodeURIComponent(a.q)}&o=email-alerta`;
    return `<tr><td style="padding:14px 0;border-top:1px solid #eee;">
      <div style="font-size:16px;font-weight:600;color:#14231c;">🛒 ${esc(titulo)}</div>
      <div style="font-size:13px;color:#5c6b62;margin-top:3px;">${esc(detalhe)} · no ${esc(atual.loja)} — ${esc(atual.nome)}</div>
      <div style="margin-top:8px;font-size:13px;"><a href="${abrir}" style="color:#0b6b4f;font-weight:600;">Ver no PoupeJá</a>
        <span style="color:#cfccbf;"> · </span><a href="${urlCancelarAlerta(base, a.id)}" style="color:#636d66;">Deixar de avisar</a></div>
    </td></tr>`;
  }).join("");
  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#f6f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;">
    <tr><td>
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#636d66;">Alerta de preço</div>
      <h1 style="font-size:20px;margin:6px 0 4px;color:#14231c;">${itens.length === 1 ? "Baixou o preço que estavas a vigiar" : `Baixaram ${itens.length} preços que estavas a vigiar`}</h1>
      <p style="font-size:14px;color:#5c6b62;margin:0 0 8px;">Verificámos hoje nos supermercados que comparamos.</p>
    </td></tr>
    ${linhas}
    <tr><td style="padding-top:16px;font-size:12px;color:#636d66;">Recebes este email porque pediste um alerta de preço no PoupeJá. Os preços podem mudar ao longo do dia.</td></tr>
  </table></body></html>`;
  const primeiro = itens[0];
  const subject = itens.length === 1
    ? `🛒 ${cap(primeiro.alerta.q)}: ${primeiro.motivo === "promo" ? "em promoção" : `${eur(primeiro.atual.valor, 2)} €${porUnid(primeiro.atual.unidade)}`}`
    : `🛒 ${itens.length} alertas de preço: ${itens.slice(0, 3).map(i => i.alerta.q).join(", ")}`;
  return { subject, html };
}

async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) return res.status(401).json({ erro: "Não autorizado." });
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Sem Supabase." });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ enviados: 0, motivo: "Sem RESEND_API_KEY." });

  const { data: alertas, error } = await admin.from("alertas_email")
    .select("id, email, q, tipo, alvo, referencia, unidade, modo, promo_na_criacao, ultimo_aviso, avisos")
    .is("cancelado_em", null).limit(5000);
  if (error) return res.status(500).json({ erro: error.message });
  if (!alertas?.length) return res.status(200).json({ alertas: 0, enviados: 0 });

  // As pesquisas mais pedidas primeiro, se houver mais do que o limite.
  const contagem = {};
  for (const a of alertas) contagem[a.q] = (contagem[a.q] || 0) + 1;
  const qs = Object.keys(contagem).sort((x, y) => contagem[y] - contagem[x]);
  const precos = await precosDosAlertas(qs, MAX_PESQUISAS);
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

  const porEmail = {};
  const atualizar = [];
  for (const a of alertas) {
    const atual = precos[a.q];
    const d = decidirAviso(a, atual, hoje);
    if (d.avisar) {
      (porEmail[a.email] ||= []).push({ alerta: a, atual, motivo: d.motivo });
      atualizar.push({ id: a.id, ultimo_aviso: d.registo, avisos: (a.avisos || 0) + 1 });
    } else if (d.registo === null && a.ultimo_aviso) {
      atualizar.push({ id: a.id, ultimo_aviso: null });
    }
  }

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const resend = new Resend(process.env.RESEND_API_KEY);
  let enviados = 0;
  const falhados = new Set();
  for (const [email, itens] of Object.entries(porEmail)) {
    const { subject, html } = construirEmail(itens, base);
    try {
      await enviarEmail(resend, { tags: etiqueta("alerta_preco"),
        from: "PoupeJá <noreply@xn--poupej-uta.com>", to: email, subject, html,
        headers: itens.length === 1 ? { "List-Unsubscribe": `<${urlCancelarAlerta(base, itens[0].alerta.id)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
      });
      enviados++;
    } catch (e) {
      console.error("cron-alertas-email:", e?.message);
      for (const i of itens) falhados.add(i.alerta.id);
    }
  }
  // Só se marca como avisado o que saiu mesmo.
  for (const u of atualizar) {
    if (falhados.has(u.id)) continue;
    const { id, ...campos } = u;
    await admin.from("alertas_email").update(campos).eq("id", id).then(() => {}, () => {});
  }
  return res.status(200).json({ alertas: alertas.length, pesquisas: Object.keys(precos).length, emails: Object.keys(porEmail).length, enviados });
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-alertas-email", handler);
