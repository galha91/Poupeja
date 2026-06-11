import fs from "fs";
import path from "path";

/** Lê os folhetos ativos do ficheiro estático. */
export function lerFolhetos() {
  try {
    const filePath = path.join(process.cwd(), "public", "folhetos.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw).folhetos || [];
  } catch {
    return [];
  }
}

/** Constrói o assunto + HTML do email semanal de folhetos. */
export function construirEmailFolhetos({ nome, folhetos, base }) {
  const primeiroNome = (nome || "").split(" ")[0] || "Olá";
  const linhasHtml = folhetos
    .map(
      f => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;font-weight:700;color:#0f172a;">${f.loja}</td>
                <td align="right">
                  <a href="${f.url}"
                     style="display:inline-block;background:#059669;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:6px 14px;border-radius:8px;">
                    Ver folheto →
                  </a>
                </td>
              </tr>
              ${f.validade ? `<tr><td colspan="2" style="font-size:11px;color:#94a3b8;padding-top:2px;">${f.validade}</td></tr>` : ""}
            </table>
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f2;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8eaed;">
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b,#059669);padding:40px 32px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-block;line-height:64px;text-align:center;margin-bottom:16px;">
              <span style="font-size:32px;font-weight:900;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">P</span>
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">PoupeJá</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">A tua carteira digital portuguesa</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#64748b;font-weight:600;">Olá, ${primeiroNome}!</p>
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:900;color:#0f172a;">Os folhetos desta semana</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Aqui estão os folhetos em destaque para esta semana. Clica em cada um para ver as promoções.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${linhasHtml}
            </table>
            <div style="text-align:center;margin-top:28px;">
              <a href="${base}/folhetos"
                 style="display:inline-block;background:linear-gradient(135deg,#064e3b,#059669);color:#ffffff;font-weight:900;font-size:15px;text-decoration:none;padding:16px 32px;border-radius:14px;box-shadow:0 8px 20px -8px rgba(5,150,105,0.5);">
                Ver todos os folhetos →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">
              Recebeste este email porque tens uma conta PoupeJá.<br>
              Para deixar de receber resumos semanais, desativa nas definições da app.<br>
              © ${new Date().getFullYear()} PoupeJá · <a href="${base}/privacidade" style="color:#059669;">Política de Privacidade</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: "📋 Os folhetos desta semana — PoupeJá", html };
}
