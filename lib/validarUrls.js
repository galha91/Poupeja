// Validação semanal de URLs.
//
// Resultados:
//   partidas → 404/410/timeout  → link genuinamente quebrado para utilizadores
//   avisos   → 403              → site bloqueia o nosso servidor (robot),
//                                  mas a página PODE estar OK para utilizadores.
//                                  Requer verificação manual ou serviço externo
//                                  como UptimeRobot (uptimerobot.com, grátis).

const URLS_PROMOCOES = [
  { nome: "Worten",         url: "https://www.worten.pt/promocoes" },
  { nome: "Parfois",        url: "https://www.parfois.com/pt/sale/" },
  { nome: "Mango",          url: "https://shop.mango.com/pt/pt/l/mulher/promocoes" },
  { nome: "Nike",           url: "https://www.nike.com/pt/en/w/sale-3yaep" },
  { nome: "Adidas",         url: "https://www.adidas.pt/outlet" },
  { nome: "Decathlon",      url: "https://www.decathlon.pt/C-3274473-promocoes" },
  { nome: "Darty",          url: "https://darty.pt/collections/campanhas-promocoes" },
  { nome: "Puma",           url: "https://pt.puma.com/pt/pt/sale" },
  { nome: "Tommy Hilfiger", url: "https://pt.tommy.com/" },
  { nome: "Calvin Klein",   url: "https://www.calvinklein.pt/sale" },
  { nome: "Levi's",         url: "https://www.levi.com/PT/pt_PT/clothing/c/levi_clothing_sale" },
  { nome: "JD Sports",      url: "https://www.jdsports.pt/saldos/" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9",
};

async function checarUrl({ nome, url }) {
  try {
    const r = await fetch(url, {
      method: "HEAD",
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const s = r.status;
    if (s === 404 || s === 410) return { nome, url, status: s, estado: "partida" };
    if (s === 403 || s === 401 || s === 429) return { nome, url, status: s, estado: "aviso" };
    return { nome, url, status: s, estado: "ok" };
  } catch {
    return { nome, url, status: 0, estado: "partida" };
  }
}

export async function validarTodasUrls(folhetos = []) {
  const urlsFolhetos = folhetos.map(f => ({ nome: `Folheto ${f.loja}`, url: f.url }));
  const todas = [...URLS_PROMOCOES, ...urlsFolhetos];
  const resultados = await Promise.all(todas.map(checarUrl));
  const partidas = resultados.filter(r => r.estado === "partida");
  const avisos   = resultados.filter(r => r.estado === "aviso");
  return { resultados, partidas, avisos };
}

export function construirEmailAlerta({ partidas, avisos, base }) {
  const temPartidas = partidas.length > 0;
  const temAvisos   = avisos.length > 0;

  function linhaUrl(p, corBorde) {
    const statusLabel = p.status === 0 ? "timeout / sem resposta" : `HTTP ${p.status}`;
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;border-left:3px solid ${corBorde};padding-left:10px;">${p.nome}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;word-break:break-all;padding-left:13px;">${p.url}</div>
        <div style="font-size:11px;font-weight:700;color:${corBorde};margin-top:2px;padding-left:13px;">${statusLabel}</div>
      </td>
    </tr>`;
  }

  const secaoPartidas = temPartidas ? `
    <p style="margin:0 0 8px;font-size:13px;font-weight:900;color:#dc2626;">🔴 Links quebrados (${partidas.length}) — corrigir imediatamente</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${partidas.map(p => linhaUrl(p, "#dc2626")).join("")}
    </table>` : "";

  const secaoAvisos = temAvisos ? `
    <p style="margin:${temPartidas ? "20px" : "0"} 0 8px;font-size:13px;font-weight:900;color:#d97706;">🟡 Não verificáveis (${avisos.length}) — site bloqueia robots</p>
    <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.5;">
      Estes links devolvem 403 ao nosso servidor (bloqueio de robot). Podem estar OK para utilizadores — verifica manualmente no browser. Para monitorização automática real usa <strong>UptimeRobot</strong> (grátis em uptimerobot.com).
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${avisos.map(p => linhaUrl(p, "#d97706")).join("")}
    </table>` : "";

  const corHeader = temPartidas ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#d97706,#f59e0b)";
  const titulo    = temPartidas
    ? `⚠️ PoupeJá — ${partidas.length} link${partidas.length > 1 ? "s" : ""} quebrado${partidas.length > 1 ? "s" : ""}`
    : `🟡 PoupeJá — ${avisos.length} link${avisos.length > 1 ? "s" : ""} a verificar`;

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:${corHeader};padding:28px 32px;text-align:center;">
            <div style="font-size:18px;font-weight:900;color:#ffffff;">${titulo}</div>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Detetado automaticamente pelo cron semanal · PoupeJá</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            ${secaoPartidas}
            ${secaoAvisos}
            <div style="text-align:center;margin-top:24px;">
              <a href="${base}/lojas" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:12px 28px;border-radius:10px;">
                Abrir secção Lojas →
              </a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = temPartidas
    ? `⚠️ PoupeJá — ${partidas.length} link${partidas.length > 1 ? "s" : ""} quebrado${partidas.length > 1 ? "s" : ""} detetado${partidas.length > 1 ? "s" : ""}`
    : `🟡 PoupeJá — ${avisos.length} link${avisos.length > 1 ? "s" : ""} a verificar manualmente`;

  return { subject, html };
}
