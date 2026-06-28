import { Resend } from "resend";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { lerFolhetos, construirEmailFolhetos } from "../../lib/emailFolhetos";
import { validarTodasUrls, autoCorrigirUrls, construirEmailAlerta } from "../../lib/validarUrls";
import { urlUnsub } from "../../lib/unsubscribeToken";
import { bearerValido } from "../../lib/seguranca";

/*
 * Envio AUTOMÁTICO do email semanal a todos os utilizadores que não
 * desativaram o resumo. Disparado pelo Vercel Cron (ver vercel.json).
 *
 * Protegido por CRON_SECRET: o Vercel envia o header
 * "Authorization: Bearer <CRON_SECRET>" automaticamente.
 *
 * Requer env vars: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET.
 */
export default async function handler(req, res) {
  // 1. Autenticação do cron
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(500).json({ erro: "SUPABASE_SERVICE_ROLE_KEY em falta." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const folhetos = lerFolhetos();
  if (!folhetos.length) {
    return res.status(500).json({ erro: "Sem folhetos para enviar." });
  }
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";

  // 2. Quem desativou o resumo (pref emailSemanal === false)
  const desativados = new Set();
  try {
    const { data: prefsRows } = await admin
      .from("dados_utilizador")
      .select("user_id, valor")
      .eq("chave", "poupeja_prefs");
    for (const row of prefsRows || []) {
      const v = typeof row.valor === "string" ? JSON.parse(row.valor) : row.valor;
      if (v && v.emailSemanal === false) desativados.add(row.user_id);
    }
  } catch (e) {
    console.error("cron-email: erro a ler prefs:", e);
  }

  // 3. Listar utilizadores (paginado) e enviar
  let enviados = 0, ignorados = 0, falhas = 0, pagina = 1;
  const PER_PAGE = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: PER_PAGE });
    if (error) {
      console.error("cron-email: listUsers erro:", error);
      break;
    }
    const users = data?.users || [];
    if (!users.length) break;

    for (const u of users) {
      if (!u.email || u.email_confirmed_at == null) { ignorados++; continue; }
      if (desativados.has(u.id)) { ignorados++; continue; }

      const nome = u.user_metadata?.nome || u.email.split("@")[0];
      const unsubscribeUrl = urlUnsub(base, u.id);
      const { subject, html, text } = construirEmailFolhetos({ nome, folhetos, base, unsubscribeUrl });
      try {
        await resend.emails.send({
          from: "PoupeJá <noreply@xn--poupej-uta.com>",
          to: u.email,
          replyTo: "ricardogalha1@hotmail.com",
          subject,
          html,
          text,
          headers: {
            // One-click unsubscribe (RFC 8058) — exigido pelo Gmail/Outlook
            // para remetentes em massa e reduz fortemente a marcação como spam.
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        enviados++;
      } catch (e) {
        falhas++;
        // Não registar o email do utilizador nos logs (privacidade).
        console.error("cron-email: falha de envio:", e?.message);
      }
      // Pausa curta para respeitar o rate limit do Resend
      await new Promise(r => setTimeout(r, 120));
    }

    if (users.length < PER_PAGE) break;
    pagina++;
  }

  console.log(`cron-email: enviados=${enviados} ignorados=${ignorados} falhas=${falhas}`);

  // 4. Validar todas as URLs de promoções + folhetos
  try {
    const { partidas, avisos } = await validarTodasUrls(folhetos);
    // Tenta auto-corrigir 404s via GitHub API (requer GITHUB_TOKEN)
    const corrigidas = partidas.length > 0 ? await autoCorrigirUrls(partidas) : [];
    if (partidas.length > 0 || avisos.length > 0) {
      const adminEmail = process.env.ADMIN_EMAIL || "ricardogalha1@hotmail.com";
      const { subject, html } = construirEmailAlerta({ partidas, avisos, corrigidas, base });
      await resend.emails.send({
        from: "PoupeJá <noreply@xn--poupej-uta.com>",
        to: adminEmail,
        subject,
        html,
      });
      console.log(`cron-email: alerta — partidas=${partidas.length} avisos=${avisos.length} auto-corrigidas=${corrigidas.length}`);
    } else {
      console.log("cron-email: todas as URLs OK");
    }
  } catch (e) {
    console.error("cron-email: erro na validação de URLs:", e?.message);
  }

  return res.status(200).json({ ok: true, enviados, ignorados, falhas });
}
