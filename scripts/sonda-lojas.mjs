// TEMPORÁRIO — Aldi: encontrar a configuração pública do Algolia e testar.
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" };
const txt = (u) => fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }).then((r) => r.text()).catch((e) => "");

const html = await txt("https://www.aldi.pt/resultados-de-pesquisa.html?query=leite");
const buildId = html.match(/"buildId":"([^"]+)"/)?.[1];
console.log("buildId", buildId);
let chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"]+\.js/g)].map((m) => m[0]))];
const manifest = await txt(`https://www.aldi.pt/_next/static/${buildId}/_buildManifest.js`);
chunks = [...new Set([...chunks, ...[...manifest.matchAll(/static\/chunks\/[^"]+\.js/g)].map((m) => "/_next/" + m[0])])];
console.log("chunks", chunks.length);
const achados = new Map();
for (const c of chunks) {
  const js = await txt("https://www.aldi.pt" + c);
  for (const re of [/algolia[^\n]{0,200}/gi, /[A-Z0-9]{10}-dsn\.algolia\.net/g, /appId:?\s*["'][A-Z0-9]{8,12}["']/g, /["'][a-f0-9]{32}["']/g, /indexName:?\s*["'][^"']+["']/g, /["'](prod|production|pt)_[a-z0-9_]{3,60}["']/gi, /NEXT_PUBLIC_[A-Z_]+/g]) {
    for (const m of js.matchAll(re)) {
      const k = m[0].slice(0, 220);
      if (!achados.has(k)) achados.set(k, c);
    }
  }
}
for (const [k, c] of achados) if (!/doc\/api-reference|building-search-ui/.test(k)) console.log(c.split("/").pop(), "::", k);
