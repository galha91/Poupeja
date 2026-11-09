import { Resend } from "resend";
import { enviarEmail, etiqueta } from "../../lib/enviarEmail";
import { bearerValido } from "../../lib/seguranca";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { EMAILS_EXCLUIDOS } from "../../lib/adminAuth";
import { garantirWebhook } from "../../lib/resendWebhook";
import { trafegoProprio, metricas, retencao, emails, saude, lerMetas, DIA } from "../../lib/adminDados";
import { comRegisto } from "../../lib/cronRegisto";
import { avaliarConsumo } from "../../lib/consumoSupabase";

/*
 * Resumo do /admin por email (Vercel Cron, todos os dias de manhã).
 *
 * - Segunda-feira: resumo da semana — visitas, convidados, contas, emails,
 *   metas, o que mais se pesquisou sem resultado, velocidade e erros.
 * - Outros dias: só escreve se alguma coisa parece partida (o contador de
 *   visitas ou o de métricas parou, ou os erros dispararam). Os preços das
 *   lojas já têm o seu próprio aviso (cron-saude-precos).
 */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const n = (v) => (typeof v === "number" ? v.toLocaleString("pt-PT") : "—");
const variacao = (agora, antes) => {
  if (!antes) return "";
  const p = Math.round(((agora - antes) / antes) * 100);
  return ` <span style="color:${p >= 0 ? "#0b6b4f" : "#b4472e"};">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}%</span>`;
};

async function contasNovas(admin) {
  const agora = Date.now();
  let todos = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    todos = todos.concat(data?.users || []);
    if ((data?.users || []).length < 1000) break;
  }
  todos = todos.filter(u => !EMAILS_EXCLUIDOS.has((u.email || "").toLowerCase()) && !u.is_anonymous);
  const idade = (t) => (t ? agora - new Date(t).getTime() : Infinity);
  return { semana: todos.filter(u => idade(u.created_at) < 7 * DIA).length, antes: todos.filter(u => idade(u.created_at) >= 7 * DIA && idade(u.created_at) < 14 * DIA).length };
}

// Coisas partidas, comparando ontem com a média dos 7 dias antes.
function detetarAlertas({ trafego, metr }) {
  const alertas = [];
  const ontemEMedia = (serie) => {
    if (!serie || serie.length < 9) return null;
    const ontem = serie[serie.length - 2].n;
    const antes = serie.slice(-9, -2);
    return { ontem, media: antes.reduce((s, d) => s + d.n, 0) / antes.length };
  };
  const vis = ontemEMedia(trafego?.serie?.map(s => ({ n: s.visitantes })));
  if (vis && vis.ontem === 0 && vis.media >= 5) alertas.push("O contador de visitas registou 0 visitantes ontem (a média era " + Math.round(vis.media) + "). Pode ter parado.");
  const ev = ontemEMedia(metr?.eventosDia);
  if (ev && ev.ontem === 0 && ev.media >= 20) alertas.push("Não chegou nenhuma métrica de uso ontem (média " + Math.round(ev.media) + "). Confirma /api/metrica.");
  const er = ontemEMedia(metr?.erros?.porDia);
  if (er && er.ontem >= 10 && er.ontem > 3 * er.media) alertas.push(`Os erros no browser dispararam: ${er.ontem} ontem (média ${er.media.toFixed(1)}). O mais comum: ${metr.erros.lista[0]?.mensagem || "—"}.`);
  return alertas;
}

function construirResumo({ trafego, metr, ret, mails, lojas, metas, contas, alertas, base }) {
  const linha = (rotulo, valor, extra = "") => `<tr><td style="padding:6px 0;color:#5c6b62;font-size:14px;">${rotulo}</td><td style="padding:6px 0;text-align:right;font-size:15px;font-weight:600;color:#14231c;">${valor}${extra}</td></tr>`;
  const meta = (k, v) => (metas?.[k] ? ` <span style="color:#636d66;font-weight:400;">/ meta ${n(metas[k])} (${Math.round((v / metas[k]) * 100)}%)</span>` : "");
  const visit = trafego?.periodo?.visitantes ?? 0;
  const conv = ret?.novos ?? 0;
  const mailsNovos = mails?.novos ?? 0;
  const falhas = (lojas || []).filter(l => !l.ok);
  const lcp = metr?.vitais?.find(v => v.nome === "LCP");
  const vazias = metr?.pesquisas?.semResultado?.slice(0, 5).map(t => `«${esc(t.termo)}» (${t.n})`).join(", ");
  const origens = (trafego?.origens || []).filter(o => o.origem !== "interno").slice(0, 3).map(o => `${esc(o.origem)} ${n(o.n)}`).join(" · ");

  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#f6f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;">
    <tr><td>
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#636d66;">Resumo semanal do PoupeJá</div>
      <h1 style="font-size:20px;margin:6px 0 12px;color:#14231c;">A semana em números</h1>
      ${alertas.length ? `<div style="background:#f7ece8;border-radius:10px;padding:10px 12px;margin-bottom:12px;color:#8f3320;font-size:14px;">${alertas.map(esc).join("<br>")}</div>` : ""}
      <table width="100%">
        ${linha("Visitantes", n(visit), variacao(visit, trafego?.anterior?.visitantes) + meta("visitantes", visit))}
        ${linha("Convidados novos", n(conv), variacao(conv, ret?.novosAntes) + meta("convidados", conv))}
        ${contas ? linha("Contas novas", n(contas.semana), variacao(contas.semana, contas.antes) + meta("contas", contas.semana)) : ""}
        ${linha("Emails novos (sem conta)", n(mailsNovos), variacao(mailsNovos, mails?.novosAntes) + meta("emails", mailsNovos))}
        ${linha("Convidados ativos (7 dias)", n(ret?.ativos7))}
        ${metr?.pesquisas?.total ? linha("Pesquisas de produtos", n(metr.pesquisas.total), ` <span style="color:#636d66;font-weight:400;">${Math.round((metr.pesquisas.vazias / metr.pesquisas.total) * 100)}% sem resultado</span>`) : ""}
        ${lcp?.n ? linha("Páginas rápidas (LCP)", `${Math.round(lcp.bons * 100)}%`) : ""}
        ${metr ? linha("Erros no browser", n(metr.erros.total), variacao(metr.erros.total, metr.erros.antes)) : ""}
        ${lojas?.length ? linha("Preços das lojas", falhas.length ? `<span style="color:#b4472e;">${falhas.map(f => esc(f.nome)).join(", ")} em falha</span>` : "todas a funcionar") : ""}
      </table>
      ${origens ? `<p style="font-size:13px;color:#5c6b62;margin:14px 0 0;">De onde vieram: ${origens}</p>` : ""}
      ${vazias ? `<p style="font-size:13px;color:#5c6b62;margin:8px 0 0;">Pesquisas sem resultado: ${vazias}</p>` : ""}
      <p style="margin:18px 0 0;"><a href="${base}/admin" style="color:#0b6b4f;font-weight:600;font-size:14px;">Abrir o painel →</a></p>
    </td></tr>
  </table></body></html>`;
  return { subject: `📊 PoupeJá: ${n(visit)} visitantes, ${n(conv)} convidados novos esta semana`, html };
}

async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Sem Supabase." });

  const segunda = new Date().toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/Lisbon" }) === "Monday" || req.query.forcar === "1";
  const seguro = (p) => p.catch(() => null);
  const [trafego, metr] = await Promise.all([seguro(trafegoProprio(admin, 7)), seguro(metricas(admin, 7))]);
  const alertas = detetarAlertas({ trafego, metr });
  // Tráfego do Supabase (lib/consumoSupabase): aviso antes de passar o plano grátis.
  try {
    const ontem = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const { data } = await admin.from("consumo_supabase").select("dia, tabela, bytes").gte("dia", desde);
    alertas.push(...avaliarConsumo(data, ontem));
  } catch (_) {}
  await garantirWebhook(admin).catch(() => null); // estatísticas dos emails (uma vez)

  if (!segunda && !alertas.length) return res.status(200).json({ enviado: false, alertas });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ enviado: false, alertas, motivo: "Sem RESEND_API_KEY." });

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const para = process.env.ADMIN_EMAIL_RESUMO || process.env.ADMIN_EMAIL || "ricardogalha1@hotmail.com";
  let mensagem;
  if (segunda) {
    const [ret, mails, lojas, metas, contas] = await Promise.all([
      seguro(retencao(admin, 7)), seguro(emails(admin, 7)), seguro(saude(admin)), seguro(lerMetas(admin)), seguro(contasNovas(admin)),
    ]);
    mensagem = construirResumo({ trafego, metr, ret, mails, lojas, metas, contas, alertas, base });
  } else {
    mensagem = {
      subject: `⚠️ PoupeJá: ${alertas.length === 1 ? "uma coisa parece partida" : `${alertas.length} coisas parecem partidas`}`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#14231c;">${alertas.map(a => `<p>${esc(a)}</p>`).join("")}<p><a href="${base}/admin" style="color:#0b6b4f;">Abrir o painel →</a></p></div>`,
    };
  }
  try {
    await enviarEmail(new Resend(process.env.RESEND_API_KEY), { tags: etiqueta("admin"), from: "PoupeJá <noreply@xn--poupej-uta.com>", to: para, ...mensagem });
    return res.status(200).json({ enviado: true, resumo: segunda, alertas });
  } catch (e) {
    console.error("cron-resumo-admin:", e?.message);
    return res.status(500).json({ enviado: false, erro: e?.message });
  }
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-resumo-admin", handler);
