// URLs verificadas semanalmente pelo cron.
// 403 = OK (site bloqueia bots mas a página existe).
// 404 / timeout / rede = PARTIDA.

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
  { nome: "JD Sports",      url: "https://www.jdsports.pt/promocoes/" },
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
    // 403 = bot bloqueado mas a página existe → OK
    const ok = r.status !== 404 && r.status !== 410 && r.status !== 0;
    return { nome, url, status: r.status, ok };
  } catch {
    return { nome, url, status: 0, ok: false };
  }
}

export async function validarTodasUrls(folhetos = []) {
  const urlsFolhetos = folhetos.map(f => ({ nome: `Folheto ${f.loja}`, url: f.url }));
  const todas = [...URLS_PROMOCOES, ...urlsFolhetos];

  const resultados = await Promise.all(todas.map(checarUrl));
  const partidas = resultados.filter(r => !r.ok);
  return { resultados, partidas };
}

export function construirEmailAlerta({ partidas, base }) {
  const linhas = partidas.map(p => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #fee2e2;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;">${p.nome}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;word-break:break-all;">${p.url}</div>
        <div style="font-size:11px;color:#ef4444;margin-top:2px;">HTTP ${p.status || "timeout/rede"}</div>
      </td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Alerta URLs partidas — PoupeJá</title></head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:28px 32px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#ffffff;">⚠️ PoupeJá — Links partidos</div>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${partidas.length} URL${partidas.length > 1 ? "s" : ""} ${partidas.length > 1 ? "precisam" : "precisa"} de ser corrigida${partidas.length > 1 ? "s" : ""}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">${linhas}</table>
            <div style="text-align:center;margin-top:24px;">
              <a href="${base}/lojas" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;">
                Corrigir na app →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 28px 20px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
              Detetado automaticamente pelo cron semanal · PoupeJá
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `⚠️ PoupeJá — ${partidas.length} link${partidas.length > 1 ? "s" : ""} partido${partidas.length > 1 ? "s" : ""} detetado${partidas.length > 1 ? "s" : ""}`,
    html,
  };
}
