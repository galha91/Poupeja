import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { validarPedido, MAX_ALERTAS_POR_EMAIL } from "../../lib/alertasEmail";
import { padraoEmail } from "../../lib/subscritores";
import { tokenAlerta, tokenAlertaValido } from "../../lib/subscritoresToken";

/*
 * Alertas de preço por email, sem conta (ver lib/alertasEmail.js).
 *   POST              cria ou atualiza o alerta (email + pesquisa) → { id, t }
 *   DELETE ?s=&t=     cancela, a partir da app (apagar o alerta)
 *   GET ?s=&t=        cancela, a partir do link no email
 *   POST ?s=&t=       one-click unsubscribe (RFC 8058) do cliente de email
 */

async function cancelar(admin, id) {
  const { error } = await admin.from("alertas_email").update({ cancelado_em: new Date().toISOString() }).eq("id", id).is("cancelado_em", null);
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

  // Cancelar (link do email, one-click ou a app).
  if (id && t) {
    const valido = tokenAlertaValido(id, t);
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!valido || !admin) return res.status(400).send(pagina("Ligação inválida", "Esta ligação de cancelamento não é válida."));
      const ok = await cancelar(admin, id);
      return ok
        ? res.status(200).send(pagina("Alerta cancelado", "Deixaste de receber avisos por email para esta pesquisa."))
        : res.status(500).send(pagina("Não foi possível cancelar", "Tenta novamente daqui a pouco."));
    }
    if (req.method === "DELETE" || req.method === "POST") {
      if (valido && admin) await cancelar(admin, id);
      return res.status(valido ? 204 : 400).end();
    }
    return res.status(405).end();
  }

  if (req.method !== "POST") return res.status(405).end();
  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
  if (excedeuLimite(req, "alerta-email", 10, 10 * 60_000)) return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });

  const { erro, alerta } = validarPedido(req.body);
  if (erro) return res.status(400).json({ erro });
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível. Tenta mais tarde." });

  // Um alerta ativo por email e pesquisa: atualiza o que existir.
  const { data: ativos } = await admin.from("alertas_email").select("id, q").ilike("email", padraoEmail(alerta.email)).is("cancelado_em", null);
  const existente = (ativos || []).find(a => a.q === alerta.q);
  if (!existente && (ativos || []).length >= MAX_ALERTAS_POR_EMAIL) {
    return res.status(400).json({ erro: `Já tens ${MAX_ALERTAS_POR_EMAIL} alertas neste email. Apaga algum primeiro.` });
  }

  let linha;
  if (existente) {
    const { convidado_id, email, ...mudar } = alerta;
    const { data, error } = await admin.from("alertas_email").update({ ...mudar, ultimo_aviso: null }).eq("id", existente.id).select("id").single();
    if (error) return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." });
    linha = data;
  } else {
    const { data, error } = await admin.from("alertas_email").insert(alerta).select("id").single();
    if (error) { console.error("alerta-email:", error.message); return res.status(500).json({ erro: "Não foi possível guardar. Tenta novamente." }); }
    linha = data;
  }

  // Marco do percurso: este convidado deixou email (só a data; o email
  // fica na tabela do alerta, com o consentimento dado ali).
  if (alerta.convidado_id) {
    await admin.from("convidados_site").update({ email_em: new Date().toISOString() }).eq("id", alerta.convidado_id).is("email_em", null).then(() => {}, () => {});
  }

  return res.status(200).json({ id: linha.id, t: tokenAlerta(linha.id) });
}
