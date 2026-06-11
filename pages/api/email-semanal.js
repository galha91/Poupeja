import { Resend } from "resend";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { lerFolhetos, construirEmailFolhetos } from "../../lib/emailFolhetos";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!origemValida(req)) {
    return res.status(403).json({ erro: "Origem não autorizada." });
  }
  // Email é mais sensível a abuso (spam com o nosso domínio) — limite apertado
  if (excedeuLimite(req, "email-semanal", 2, 5 * 60_000)) {
    return res.status(429).json({ erro: "Já pediste o resumo há pouco. Aguarda uns minutos." });
  }

  const { email, nome } = req.body;
  if (!email || !nome) return res.status(400).json({ erro: "Dados incompletos." });

  const folhetos = lerFolhetos();
  if (!folhetos.length) return res.status(500).json({ erro: "Erro ao ler folhetos." });

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const { subject, html } = construirEmailFolhetos({ nome, folhetos, base });

  try {
    await resend.emails.send({
      from: "PoupeJá <noreply@xn--poupej-uta.com>",
      to: email,
      subject,
      html,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ erro: "Erro ao enviar email. Tenta novamente." });
  }
}
