import fs from "fs";
import path from "path";

const LOJA_COR = {
  "Continente": "#F97316",
  "Pingo Doce": "#16A34A",
  "Lidl": "#2563EB",
  "Aldi": "#E11D48",
  "Intermarché": "#B91C1C",
  "Mercadona": "#006DB7",
  "El Corte Inglés": "#006400",
};

function semanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const fmt = d => `${d.getDate()} ${meses[d.getMonth()]}`;
  return `${fmt(seg)}–${fmt(dom)}`;
}

export function lerFolhetos() {
  try {
    const filePath = path.join(process.cwd(), "public", "folhetos.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw).folhetos || [];
  } catch {
    return [];
  }
}

export function construirEmailFolhetos({ nome, folhetos, base }) {
  const primeiroNome = (nome || "").split(" ")[0] || "Olá";
  const semana = semanaAtual();

  const linhasHtml = folhetos.map(f => {
    const cor = LOJA_COR[f.loja] || "#059669";
    const validade =
      f.validade && f.validade !== "Ver datas no folheto"
        ? f.validade
        : `Válido esta semana · ${semana}`;
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-left:12px;border-left:3px solid ${cor};">
                <div style="font-size:14px;font-weight:700;color:#0f172a;">${f.loja}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${validade}</div>
              </td>
              <td align="right" style="white-space:nowrap;padding-left:12px;">
                <a href="${f.url}"
                   style="display:inline-block;background:${cor};color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:7px 14px;border-radius:8px;">
                  Ver folheto →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join("");

  const previewLojas = folhetos.slice(0, 3).map(f => f.loja).join(", ");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Folhetos desta semana — PoupeJá</title>
  <style>
    :root { color-scheme: light only !important; }
    body { background-color: #f3f4f2 !important; color: #0f172a !important; }
    @media (prefers-color-scheme: dark) {
      body, table, td, div, p, a { background-color: inherit !important; color: inherit !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f2 !important;font-family:'Segoe UI',Arial,sans-serif;color-scheme:light;">

  <!-- Preheader: texto visível na pré-visualização do inbox -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewLojas} e mais — as promoções de ${semana} antes de ires às compras. 🛒
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f2 !important;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:500px;background:#ffffff !important;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Cabeçalho -->
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);padding:36px 32px 28px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:14px;padding:8px 20px;margin-bottom:14px;">
              <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">PoupeJá</span>
            </div>
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:900;line-height:1.2;">🛒 Folhetos desta semana</h1>
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">Válidos ${semana}</p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:28px 28px 8px;">
            <p style="margin:0 0 4px;font-size:16px;color:#0f172a !important;font-weight:700;">Bom dia, ${primeiroNome}! 👋</p>
            <p style="margin:0 0 22px;font-size:14px;color:#64748b !important;line-height:1.6;">
              Esta semana há promoções em <strong>${folhetos.length} supermercados</strong>. Vê antes de ires às compras e poupa mais.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${linhasHtml}
            </table>

            <div style="text-align:center;margin:28px 0 8px;">
              <a href="${base}/folhetos"
                 style="display:inline-block;background:linear-gradient(135deg,#064e3b,#059669);color:#ffffff;font-weight:900;font-size:15px;text-decoration:none;padding:15px 36px;border-radius:14px;box-shadow:0 6px 16px -4px rgba(5,150,105,0.45);">
                Ver todos os folhetos →
              </a>
            </div>
          </td>
        </tr>

        <!-- Dica da semana -->
        <tr>
          <td style="padding:0 28px 24px;">
            <div style="background:#f0fdf4;border-radius:12px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#065f46;line-height:1.6;">
                💡 <strong>Dica da semana:</strong> Compara os preços dos produtos que compras habitualmente entre Continente, Pingo Doce e Lidl — a diferença pode chegar a 20%.
              </p>
            </div>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.8;">
              Recebeste este email porque tens conta no PoupeJá.<br>
              Para cancelar, desativa o resumo semanal nas
              <a href="${base}/definicoes" style="color:#059669;text-decoration:none;font-weight:600;">Definições da app</a>.<br>
              © ${new Date().getFullYear()} PoupeJá ·
              <a href="${base}/privacidade" style="color:#059669;text-decoration:none;">Privacidade</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `🛒 Folhetos ${semana} — PoupeJá`,
    html,
  };
}
