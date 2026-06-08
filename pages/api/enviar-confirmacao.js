import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const SECRET = process.env.TOKEN_SECRET || "poupeja-fallback";

function criarToken(dados) {
  const payload = Buffer.from(
    JSON.stringify({ ...dados, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { nome, email, password } = req.body;
  if (!nome || !email || !password)
    return res.status(400).json({ erro: "Dados incompletos." });

  const token = criarToken({ nome, email, password });
  const base = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
  const link = `${base}/confirmar?token=${token}`;

  try {
    await resend.emails.send({
      from: "PoupeJá <noreply@xn--poupej-uta.com>",
      to: email,
      subject: "Confirma a tua conta PoupeJá ✓",
      html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8eaed;">
        <!-- Header verde -->
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b,#059669);padding:40px 32px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-block;line-height:64px;text-align:center;margin-bottom:16px;">
              <span style="font-size:32px;font-weight:900;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">P</span>
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">PoupeJá</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">A tua carteira digital portuguesa</p>
          </td>
        </tr>
        <!-- Corpo -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#64748b;font-weight:600;">Olá, ${nome.split(" ")[0]}!</p>
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:900;color:#0f172a;">Confirma o teu email</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Obrigado por te registares no PoupeJá. Clica no botão abaixo para ativar a tua conta. O link expira em <strong>24 horas</strong>.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${link}"
                 style="display:inline-block;background:linear-gradient(135deg,#064e3b,#059669);color:#ffffff;font-weight:900;font-size:15px;text-decoration:none;padding:16px 32px;border-radius:14px;box-shadow:0 8px 20px -8px rgba(5,150,105,0.5);">
                Confirmar conta →
              </a>
            </div>
            <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px 16px;">
              <p style="margin:0;font-size:12px;color:#166534;line-height:1.5;">
                🔒 Os teus dados ficam guardados apenas no teu dispositivo. O PoupeJá não armazena informação pessoal em servidores.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">
              Se não criaste esta conta, ignora este email.<br>
              © ${new Date().getFullYear()} PoupeJá · <a href="${base}/privacidade" style="color:#059669;">Política de Privacidade</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ erro: "Erro ao enviar email. Tenta novamente." });
  }
}
