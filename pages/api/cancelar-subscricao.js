import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { tokenSubValido } from "../../lib/subscritoresToken";

/* Cancelamento do resumo de folhetos para quem subscreveu sem conta.
   POST = one-click (RFC 8058); GET = clicou no link do email. */

async function cancelar(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { error } = await admin
    .from("subscritores_folhetos")
    .update({ cancelado_em: new Date().toISOString() })
    .eq("id", id)
    .is("cancelado_em", null);
  return !error;
}

function pagina(titulo, mensagem) {
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo} — PoupeJá</title></head>
<body style="margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f2;"><div style="max-width:440px;margin:48px auto;background:#fff;border-radius:20px;padding:32px 28px;text-align:center;">
<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${titulo}</h1><p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${mensagem}</p>
<a href="${base}" style="display:inline-block;background:#0b6b4f;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:12px;">Voltar ao PoupeJá</a></div></body></html>`;
}

export default async function handler(req, res) {
  const id = req.query.s || req.body?.s;
  const t = req.query.t || req.body?.t;
  const valido = tokenSubValido(id, t);

  if (req.method === "POST") {
    if (valido) await cancelar(id);
    return res.status(200).end();
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!valido) {
    return res.status(400).send(pagina("Ligação inválida", "Esta ligação de cancelamento não é válida."));
  }
  const ok = await cancelar(id);
  if (!ok) return res.status(500).send(pagina("Não foi possível cancelar", "Tenta novamente daqui a pouco."));
  return res.status(200).send(pagina("Cancelado", "Deixaste de receber o resumo semanal dos folhetos."));
}
