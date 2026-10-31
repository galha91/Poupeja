/*
 * TEMPORÁRIO (ramo claude/teste-acesso, não é para a main): mede a
 * resposta de páginas fixas da Leroy Merlin e do Bricomarché pedidas a
 * partir do servidor do Vercel. Só URLs que o robots.txt permite (o da
 * Leroy) e sem nada para contornar bloqueios: um pedido normal com o
 * User-Agent do PoupeJá de sempre, e outro a identificar-se como robô.
 */
const ALVOS = {
  "leroy-robots": "https://www.leroymerlin.pt/robots.txt",
  "leroy-categoria-e27": "https://www.leroymerlin.pt/produtos/iluminacao/lampadas/lampadas-led-e27/",
  "leroy-categoria-pilhas": "https://www.leroymerlin.pt/produtos/eletricidade-e-smart-home/pilhas-e-lanternas/pilhas/",
  "leroy-produto": "https://www.leroymerlin.pt/produtos/pack-de-3-lampadas-led-e27-806lm-cor-da-luz-branco-quente-2700k-lexman-86558570.html",
  "brico-robots": "https://www.bricomarche.pt/robots.txt",
  "brico-inicio": "https://www.bricomarche.pt/",
  "brico-produtos": "https://www.bricomarche.pt/produtos/",
};
const AGENTES = {
  browser: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  robo: "PoupejaBot/1.0 (+https://www.xn--poupej-uta.com; comparador de precos)",
};

export default async function handler(req, res) {
  const out = [];
  for (const [nome, url] of Object.entries(ALVOS)) {
    for (const [ag, ua] of Object.entries(AGENTES)) {
      const t0 = Date.now();
      try {
        const r = await fetch(url, { headers: { "User-Agent": ua, "Accept-Language": "pt-PT,pt;q=0.9", Accept: "text/html,*/*" }, signal: AbortSignal.timeout(8000) });
        const txt = await r.text();
        out.push({ nome, ag, status: r.status, bytes: txt.length, dataTms: (txt.match(/class="dataTms"/g) || []).length, servidor: r.headers.get("server"), ms: Date.now() - t0, inicio: txt.slice(0, 120).replace(/\s+/g, " ") });
      } catch (e) {
        out.push({ nome, ag, erro: String(e.message || e).slice(0, 120), ms: Date.now() - t0 });
      }
    }
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ regiao: process.env.VERCEL_REGION || null, out });
}
