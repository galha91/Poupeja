import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { verificarTokenUnsub } from "../../lib/unsubscribeToken";

/*
 * Cancelamento do resumo semanal (one-click).
 *
 * - POST  → chamado automaticamente pelo cliente de email (RFC 8058,
 *           header List-Unsubscribe-Post). Responde 200 sem corpo HTML.
 * - GET   → o utilizador clicou no link; mostra uma página de confirmação.
 *
 * Em ambos os casos define poupeja_prefs.emailSemanal = false para o
 * utilizador, preservando as restantes preferências. Como a tabela é
 * sincronizada por last-write-wins, usamos um timestamp atual para que a
 * app respeite a mudança no próximo arranque.
 */

async function aplicarCancelamento(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, motivo: "config" };

  // Lê prefs atuais para não apagar as outras definições
  let prefs = {};
  try {
    const { data } = await admin
      .from("dados_utilizador")
      .select("valor")
      .eq("user_id", userId)
      .eq("chave", "poupeja_prefs")
      .maybeSingle();
    if (data?.valor) {
      prefs = typeof data.valor === "string" ? JSON.parse(data.valor) : data.valor;
    }
  } catch {}

  if (prefs && prefs.emailSemanal === false) {
    return { ok: true, jaCancelado: true };
  }

  prefs = { ...(prefs || {}), emailSemanal: false };

  try {
    await admin.from("dados_utilizador").upsert(
      {
        user_id: userId,
        chave: "poupeja_prefs",
        valor: prefs,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id,chave" }
    );
    return { ok: true };
  } catch (e) {
    console.error("unsubscribe: erro a gravar pref:", e?.message);
    return { ok: false, motivo: "db" };
  }
}

function paginaHtml({ titulo, mensagem, base }) {
  return `<!DOCTYPE html>
<html lang="pt"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} — PoupeJá</title></head>
<body style="margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:440px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <tr><td style="background:linear-gradient(135deg,#064e3b,#059669);padding:28px;text-align:center;">
        <span style="font-size:20px;font-weight:900;color:#fff;">PoupeJá</span>
      </td></tr>
      <tr><td style="padding:32px 28px;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${titulo}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${mensagem}</p>
        <a href="${base}" style="display:inline-block;background:linear-gradient(135deg,#064e3b,#059669);color:#fff;font-weight:900;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:12px;">Voltar ao PoupeJá →</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const u = req.query.u || req.body?.u;
  const t = req.query.t || req.body?.t;

  // POST one-click: responde sempre 200, sem corpo, conforme RFC 8058.
  if (req.method === "POST") {
    if (verificarTokenUnsub(u, t)) {
      await aplicarCancelamento(u);
    }
    return res.status(200).end();
  }

  // GET: página de confirmação no browser.
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!verificarTokenUnsub(u, t)) {
    return res.status(400).send(
      paginaHtml({
        titulo: "Ligação inválida",
        mensagem:
          "Esta ligação de cancelamento não é válida. Podes gerir o resumo semanal diretamente nas Definições da app.",
        base,
      })
    );
  }

  const r = await aplicarCancelamento(u);
  if (!r.ok) {
    return res.status(500).send(
      paginaHtml({
        titulo: "Não foi possível cancelar",
        mensagem:
          "Ocorreu um erro a processar o pedido. Tenta novamente ou desativa o resumo semanal nas Definições da app.",
        base,
      })
    );
  }

  return res.status(200).send(
    paginaHtml({
      titulo: r.jaCancelado ? "Já estavas cancelado" : "Cancelado com sucesso",
      mensagem: r.jaCancelado
        ? "Já não estavas a receber o resumo semanal por email. Podes reativá-lo quando quiseres nas Definições."
        : "Deixaste de receber o resumo semanal dos folhetos. Podes reativá-lo a qualquer momento nas Definições da app.",
      base,
    })
  );
}
