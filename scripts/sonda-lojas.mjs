// TEMPORÁRIO — Aldi: contexto das chaves Algolia e teste.
const H = { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36", "Accept-Language": "pt-PT" };
const txt = (u) => fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }).then((r) => r.text()).catch(() => "");
const html = await txt("https://www.aldi.pt/resultados-de-pesquisa.html?query=leite");
const buildId = html.match(/"buildId":"([^"]+)"/)?.[1];
const manifest = await txt(`https://www.aldi.pt/_next/static/${buildId}/_buildManifest.js`);
const chunks = [...new Set([...[...html.matchAll(/\/_next\/static\/[^"]+\.js/g)].map((m) => m[0]), ...[...manifest.matchAll(/static\/chunks\/[^"]+\.js/g)].map((m) => "/_next/" + m[0])])];
const ctx = (js, re, n = 400) => [...js.matchAll(re)].slice(0, 6).map((m) => js.slice(Math.max(0, m.index - n), m.index + n).replace(/\s+/g, " "));
let appIds = new Set(), keys = new Set(), indices = new Set();
for (const c of chunks) {
  const js = await txt("https://www.aldi.pt" + c);
  if (!/24064|80595|algolia/i.test(c + js.slice(0, 0)) && !/10266a4d|2a471c92|searchClient|OV=/.test(js)) continue;
  for (const s of ctx(js, /10266a4d1d421a7befa6fbf8fb92eb8f|2a471c92a397d1ebd939311b20e555e0/g, 500)) console.log(`\n[${c.split("/").pop()}] KEY CTX: ${s}`);
  for (const s of ctx(js, /algolia\/(browse|get)/g, 600)) console.log(`\n[${c.split("/").pop()}] ROUTE CTX: ${s}`);
  for (const s of ctx(js, /\.OV\s*=|searchClient/g, 300)) console.log(`\n[${c.split("/").pop()}] CLIENT CTX: ${s}`);
  for (const m of js.matchAll(/["'`]([A-Z0-9]{10})["'`]/g)) appIds.add(m[1]);
  for (const m of js.matchAll(/["'`]([a-f0-9]{32})["'`]/g)) keys.add(m[1]);
  for (const m of js.matchAll(/["'`]((?:prod|production|stage|pt|aldi)[a-zA-Z0-9_\-]{3,60})["'`]/g)) indices.add(m[1]);
}
console.log("\nappIds", [...appIds].slice(0, 40));
console.log("keys", [...keys]);
console.log("indices", [...indices].slice(0, 60));
// Testar combinações plausíveis
for (const app of [...appIds].slice(0, 40)) for (const key of keys) {
  const r = await fetch(`https://${app}-dsn.algolia.net/1/indexes/*/queries`, { method: "POST", headers: { "x-algolia-application-id": app, "x-algolia-api-key": key, "content-type": "application/json" }, body: JSON.stringify({ requests: [{ indexName: "__probe__", params: "query=leite" }] }) }).catch(() => null);
  if (!r) continue;
  const t = await r.text();
  if (r.status !== 403 || !/Invalid Application-ID/i.test(t)) console.log("TEST", app, key.slice(0, 6), r.status, t.slice(0, 200));
}
// Rotas internas do próprio site
for (const u of ["https://www.aldi.pt/api/algolia/browse/pt", "https://www.aldi.pt/api/algolia/browse/pt-PT", "https://www.aldi.pt/api/product/algolia/browse/pt"]) {
  const r = await fetch(u, { headers: H }).catch(() => null);
  console.log("ROTA", u, r?.status, (await r?.text())?.slice(0, 200));
}
