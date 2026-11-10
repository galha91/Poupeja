import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { validarLembrete, limparItens, diaValido } from "../../lib/lembreteCompras";
import { padraoEmail } from "../../lib/subscritores";
import { tokenLembrete, tokenLembreteValido } from "../../lib/subscritoresToken";

/*
 * Lembrete do dia das compras por email, sem conta (lib/lembreteCompras.js).
 *   POST              cria (ou substitui) o lembrete deste email → { id, t }
 *   PUT ?s=&t=        atualiza a lista e/ou o dia (a app, quando a lista muda)
 *   DELETE ?s=&t=     cancela, a partir da app
 *   GET ?s=&t=        cancela, a partir do link do email
 *   POST ?s=&t=       one-click unsubscribe (RFC 8058)
 */

async function cancelar(admin, id) {
  const { error } = await admin.from("lembretes_compras").update({ cancelado_em: new Date().toISOString() }).eq("id", id).is("cancelado_em", null);
  return !error;
}

function pagina(titulo, mensagem) {
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titulo} — PoupeJá</title></head>
<body style="margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#f6f5f0;"><div style="max-width:440px;margin:48px auto;background:#fff;border-radius:20px;padding:32px 28px;text-align:center;">
<h1 style="margin:0 0 12px;font-size:20px;color:#14231c;">${titulo}</h1><p style="margin:0 0 24px;font-size:14px;color:#5c6b62;line-height:1.6;">${mensagem}</p>
<a href="${base}" style="display:inline-block;background:#0b6b4f;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:12px;">Voltar ao PoupeJá</a></div></body></html>`;
}

export default async function handler(req, res) {
  const admin = getSupabaseAdmin();
  const id = req.query.s || req.body?.s;
  const t = req.query.t || req.body?.t;

  if (id && t) {
    const valido = tokenLembreteValido(id, t);
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!valido || !admin) return res.status(400).send(pagina("Ligação inválida", "Esta ligação de cancelamento não é válida."));
      return (await cancelar(admin, id))
        ? res.status(200).send(pagina("Lembrete cancelado", "Deixaste de receber o lembrete do dia das compras."))
        : res.status(500).send(pagina("Não foi possível cancelar", "Tenta novamente daqui a pouco."));
    }
    if (!valido || !admin) return res.status(400).end();
    if (req.method === "PUT") {
      if (excedeuLimite(req, "lembrete-put", 30)) return res.status(429).end();
      const mudar = {};
      if (Array.isArray(req.body?.itens)) mudar.itens = limparItens(req.body.itens);
      if (req.body?.dia !== undefined && diaValido(req.body.dia)) mudar.dia = Number(req.body.dia);
      if (!Object.keys(mudar).length) return res.status(400).end();
      const { error } = await admin.from("lembretes_compras").update(mudar).eq("id", id).is("cancelado_em", null);
      return res.status(error ? 500 : 204).end();
    }
    if (req.method === "DELETE" || req.method === "POST") {
      await cancelar(admin, id);
      return res.status(204).end();
    }
    return res.status(405).end();
  }

  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, "lembrete-compras", 5, 10 * 60_000)) return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  const { erro, lembrete } = validarLembrete(req.body);
  if (erro) return res.status(400).json({ erro });
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível. Tenta mais tarde." });

  // Um lembrete ativo por email: o novo substitui o anterior.
  const { data: existente } = await admin.from("lembretes_compras").select("id").ilike("email", padraoEmail(lembrete.email)).is("cancelado_em", null).maybeSingle();
  let linha;
  if (existente) {
    const { email, convidado_id, ...mudar } = lembrete;
    const { data, error } = await admin.from("lembretes_compras").update(mudar).eq("id", existente.id).select("id").single();
    if (error) return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
    linha = data;
  } else {
    const { data, error } = await admin.from("lembretes_compras").insert(lembrete).select("id").single();
    if (error) { console.error("lembrete-compras:", error.message); return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." }); }
    linha = data;
  }
  if (lembrete.convidado_id) {
    await admin.from("convidados_site").update({ email_em: new Date().toISOString() }).eq("id", lembrete.convidado_id).is("email_em", null).then(() => {}, () => {});
  }
  return res.status(200).json({ id: linha.id, t: tokenLembrete(linha.id) });
}
