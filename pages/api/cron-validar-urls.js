import { Resend } from "resend";
import { lerFolhetos } from "../../lib/emailFolhetos";
import { validarTodasUrls, autoCorrigirUrls, construirEmailAlerta } from "../../lib/validarUrls";
import { bearerValido } from "../../lib/seguranca";

/*
 * Validação DIÁRIA de todas as URLs (promoções + folhetos).
 * Disparado pelo Vercel Cron todos os dias às 8h UTC (ver vercel.json).
 *
 * - 404/timeout → auto-corrige para urlFallback via GitHub API + email ✅
 * - 403 → só alerta à quinta-feira (junto do email semanal), para não
 *   encher a caixa de correio todos os dias com avisos repetidos
 */
export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  }

  const folhetos = lerFolhetos();
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";

  const { partidas, avisos } = await validarTodasUrls(folhetos);

  // Só envia email se houver links genuinamente quebrados (404).
  // Avisos 403 ficam para o relatório semanal de quinta-feira.
  if (partidas.length === 0) {
    console.log(`cron-validar: OK — 0 partidas, ${avisos.length} avisos (403)`);
    return res.status(200).json({ ok: true, partidas: 0, avisos: avisos.length });
  }

  const corrigidas = await autoCorrigirUrls(partidas);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const adminEmail = process.env.ADMIN_EMAIL || "ricardogalha1@hotmail.com";
  const { subject, html } = construirEmailAlerta({ partidas, avisos: [], corrigidas, base });
  try {
    await resend.emails.send({
      from: "PoupeJá <noreply@xn--poupej-uta.com>",
      to: adminEmail,
      subject,
      html,
    });
  } catch (e) {
    console.error("cron-validar: falha no email:", e?.message);
  }

  console.log(`cron-validar: partidas=${partidas.length} auto-corrigidas=${corrigidas.length}`);
  return res.status(200).json({
    ok: true,
    partidas: partidas.length,
    corrigidas: corrigidas.length,
  });
}
