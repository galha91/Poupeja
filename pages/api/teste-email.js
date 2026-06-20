import { Resend } from "resend";
import { lerFolhetos, construirEmailFolhetos } from "../../lib/emailFolhetos";

export default async function handler(req, res) {
  if (req.query.secret !== "poupeja-teste-2026") {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const email = req.query.email || "ricardogalha1@hotmail.com";

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ erro: "RESEND_API_KEY em falta." });
  }

  const folhetos = lerFolhetos();
  if (!folhetos.length) {
    return res.status(500).json({ erro: "Sem folhetos." });
  }

  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const { subject, html } = construirEmailFolhetos({ nome: email.split("@")[0], folhetos, base });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "PoupeJá <noreply@xn--poupej-uta.com>",
      to: email,
      subject,
      html,
    });
    return res.status(200).json({ ok: true, id: result.data?.id, subject });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
}
