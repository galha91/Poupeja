/*
 * TEMPORÁRIO (ramo claude/teste-acesso, não é para a main): mede a
 * resposta do Maxmat a pedidos feitos pelo servidor do Vercel. Só páginas
 * que o robots.txt do Maxmat permite, com 1 s entre pedidos (o
 * «Crawl-delay: 1» deles) e o User-Agent de sempre do PoupeJá.
 */
const ALVOS = {
  "maxmat-robots": "https://www.maxmat.pt/robots.txt",
  "maxmat-led": "https://www.maxmat.pt/pt/produtos/iluminacao/lampadas/lampadas-led_1244-416.html",
  "maxmat-led-p2": "https://www.maxmat.pt/pt/produtos/iluminacao/lampadas/lampadas-led_1244-416.html?page=2",
  "maxmat-tintas": "https://www.maxmat.pt/pt/produtos/tintas-drogaria-e-limpeza/tintas-paredes-interiores-e-tetos/mate_1525-416.html",
  "maxmat-pilhas": "https://www.maxmat.pt/pt/produtos/eletricidade-e-smart-home/pilhas-e-lanternas/pilhas_1186-416.html",
};
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

export default async function handler(req, res) {
  const out = [];
  for (const [nome, url] of Object.entries(ALVOS)) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9", Accept: "text/html,*/*" }, signal: AbortSignal.timeout(8000) });
      const txt = await r.text();
      const cartoes = txt.split('<article class="product product-item').length - 1;
      const nomes = [...txt.matchAll(/<p class="name">([^<]+)<\/p>[\s\S]{0,300}?<p class="current">\s*([^<]+?)\s*<\/p>/g)].slice(0, 4).map((m) => `${m[1]} | ${m[2]}`);
      out.push({ nome, status: r.status, bytes: txt.length, cartoes, nomes, servidor: r.headers.get("server"), ms: Date.now() - t0 });
    } catch (e) {
      out.push({ nome, erro: String(e.message || e).slice(0, 120), ms: Date.now() - t0 });
    }
    await espera(1000);
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ regiao: process.env.VERCEL_REGION || null, out });
}
