import { Resend } from "resend";
import { enviarEmail, etiqueta } from "../../lib/enviarEmail";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { urlUnsub } from "../../lib/unsubscribeToken";
import { bearerValido } from "../../lib/seguranca";
import { comRegisto } from "../../lib/cronRegisto";
import { lerCabazInicio } from "../../lib/cabazInicio";
import { lerBarometro, variacao } from "../../lib/barometro";
import { lerNatal, natalServe } from "../../lib/natal";
import { construirEmailCabaz } from "../../lib/emailCabaz";

/*
 * Email de quarta-feira, só com o cabaz da semana (lib/emailCabaz).
 * Disparado pelo Vercel Cron (vercel.json), quarta às 07:00 UTC.
 *
 * Vai para as contas com email confirmado que não desligaram os emails
 * (prefs emailSemanal === false ou emailCabaz === false). Os subscritores
 * sem conta aceitaram só o resumo de segunda e não o recebem.
 *
 * Lê três linhas pequenas de paginas_marca (cabaz, barómetro, natal), já
 * calculadas de madrugada nos GitHub Actions. Sem cabaz recente não envia
 * nada: um email com números velhos é pior do que nenhum.
 */
async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(500).json({ erro: "SUPABASE_SERVICE_ROLE_KEY em falta." });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";

  const cabaz = await lerCabazInicio();
  if (!cabaz) {
    console.warn("cron-email-cabaz: sem cabaz recente; nada enviado.");
    return res.status(200).json({ ok: false, motivo: "sem cabaz recente", enviados: 0 });
  }
  const [barometro, natalLinha] = await Promise.all([lerBarometro(), lerNatal()]);
  const v = barometro ? variacao(barometro.semanas) : null;
  const natal = natalLinha && natalServe(natalLinha) ? natalLinha : null;

  // Quem desligou os emails (o resumo de segunda ou só o cabaz).
  const desativados = new Set();
  try {
    const { data } = await admin.from("dados_utilizador").select("user_id, valor").eq("chave", "poupeja_prefs");
    for (const row of data || []) {
      const p = typeof row.valor === "string" ? JSON.parse(row.valor) : row.valor;
      if (p && (p.emailSemanal === false || p.emailCabaz === false)) desativados.add(row.user_id);
    }
  } catch (e) {
    console.error("cron-email-cabaz: erro a ler prefs:", e?.message);
    // Sem saber quem cancelou, não se envia a ninguém.
    return res.status(500).json({ ok: false, erro: "prefs" });
  }

  let enviados = 0, ignorados = 0, falhas = 0, pagina = 1;
  const PER_PAGE = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: PER_PAGE });
    if (error) { console.error("cron-email-cabaz: listUsers:", error.message); break; }
    const users = data?.users || [];
    if (!users.length) break;
    for (const u of users) {
      if (!u.email || u.email_confirmed_at == null || desativados.has(u.id)) { ignorados++; continue; }
      const unsubscribeUrl = urlUnsub(base, u.id, "cabaz");
      const nome = u.user_metadata?.nome || "";
      const { subject, html, text } = construirEmailCabaz({ nome, cabaz, variacao: v, natal, base, unsubscribeUrl });
      try {
        await enviarEmail(resend, {
          tags: etiqueta("cabaz"),
          from: "PoupeJá <noreply@xn--poupej-uta.com>",
          to: u.email,
          replyTo: "ricardogalha1@hotmail.com",
          subject, html, text,
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        });
        enviados++;
      } catch (e) {
        falhas++;
        console.error("cron-email-cabaz: falha de envio:", e?.message);
      }
      await new Promise((r) => setTimeout(r, 120)); // limite do Resend
    }
    if (users.length < PER_PAGE) break;
    pagina++;
  }

  console.log(`cron-email-cabaz: enviados=${enviados} ignorados=${ignorados} falhas=${falhas}`);
  return res.status(200).json({ ok: true, enviados, ignorados, falhas });
}

export default comRegisto("cron-email-cabaz", handler);
