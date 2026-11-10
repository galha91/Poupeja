import { Resend } from "resend";
import { enviarEmail, etiqueta } from "../../lib/enviarEmail";
import { origemValida, excedeuLimite, excedeuLimiteDe } from "../../lib/protecao-api";
import { lerFolhetos, construirEmailFolhetos } from "../../lib/emailFolhetos";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

/*
 * "Enviar-me o resumo agora" (Definições). Só para quem tem sessão, e só
 * para o email DESSA conta.
 *
 * Antes, o email e o nome vinham no corpo do pedido e não havia login:
 * qualquer pessoa podia mandar emails do nosso domínio para qualquer
 * endereço, com um "nome" à escolha dentro do HTML. Isso é um relé de spam
 * e phishing com a nossa marca, e queima a reputação do domínio no Resend.
 * Agora o destinatário sai do token da sessão, nunca do pedido.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();

  if (!origemValida(req)) {
    return res.status(403).json({ erro: "Origem não autorizada." });
  }
  // Email é mais sensível a abuso (spam com o nosso domínio) — limite apertado
  if (excedeuLimite(req, "email-semanal", 2, 5 * 60_000)) {
    return res.status(429).json({ erro: "Já pediste o resumo há pouco. Aguarda uns minutos." });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível." });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ erro: "Inicia sessão para receber o resumo." });
  const { data, error } = await admin.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email) return res.status(401).json({ erro: "Sessão inválida." });

  // Também por conta, não só por IP: trocar de rede não dá mais envios.
  if (excedeuLimiteDe(`email-semanal-conta:${user.id}`, 3, 60 * 60_000)) {
    return res.status(429).json({ erro: "Já pediste o resumo há pouco. Aguarda uns minutos." });
  }

  const email = user.email;
  const nome = String(user.user_metadata?.nome || email.split("@")[0]).slice(0, 60);

  const folhetos = lerFolhetos();
  if (!folhetos.length) return res.status(500).json({ erro: "Erro ao ler folhetos." });

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const { subject, html, text } = construirEmailFolhetos({ nome, folhetos, base });

  try {
    await enviarEmail(resend, { tags: etiqueta("folhetos_conta"),
      from: "PoupeJá <noreply@xn--poupej-uta.com>",
      to: email,
      replyTo: "ricardogalha1@hotmail.com",
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${base}/definicoes>`,
      },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ erro: "Erro ao enviar email. Tenta novamente." });
  }
}
