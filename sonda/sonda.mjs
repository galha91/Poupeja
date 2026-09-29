// Sonda temporária: profundidade de pesquisa e lojas novas.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9", Accept: "text/html,application/json,*/*" };
async function get(url, opt = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opt, headers: { ...H, ...(opt.headers || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const txt = await r.text();
    return { status: r.status, url: r.url, txt, ms: Date.now() - t0, ct: r.headers.get("content-type") };
  } catch (e) { return { status: "ERR " + e.message, txt: "", ms: Date.now() - t0 }; }
}
const log = (...a) => console.log(...a);
const trecho = (s, re, n = 3, w = 220) => { const out = []; let m; const g = new RegExp(re, "gi"); while ((m = g.exec(s)) && out.length < n) out.push(s.slice(Math.max(0, m.index - 60), m.index + w).replace(/\s+/g, " ")); return out; };

const SFCC = {
  continente: ["https://www.continente.pt", "continente", '<div class="product-tile col-product-tile'],
  "pingo-doce": ["https://www.pingodoce.pt", "pingo-doce", '<div class="product-tile-pd'],
  auchan: ["https://www.auchan.pt", "auchan", '<div class="product-tile'],
};
const secao = process.argv[2] || "tudo";
const G = {
  continente: (q, x) => `https://www.continente.pt/on/demandware.store/Sites-continente-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}${x}`,
  pd: (q, x) => `https://www.pingodoce.pt/on/demandware.store/Sites-pingo-doce-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}${x}`,
  auchan: (q, x) => `https://www.auchan.pt/on/demandware.store/Sites-AuchanPT-Site/pt_PT/Search-UpdateGrid?q=${encodeURIComponent(q)}${x}`,
};
const MARCA = { continente: '<div class="product-tile col-product-tile', pd: '<div class="product-tile-pd', auchan: '<div class="product-tile auc-product-tile' };
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
function amostra(id, txt, n = 6) {
  const bocados = txt.split(MARCA[id]).slice(1, n + 1);
  return bocados.map((b) => {
    const d = dec(b);
    const nome = (d.match(/"name":"([^"]+)/) || [])[1] || (d.match(/"item_name":"([^"]+)/) || [])[1];
    const preco = (d.match(/"price":"?([\d.]+)/) || [])[1];
    const pu = (d.match(/pwc-tile--price-secondary[^>]*>([^<]+)/) || d.match(/product-unit[^>]*>([^<]+)/) || d.match(/price-per-unit[^>]*>([^<]+)/) || [])[1];
    return `${(nome || "?").slice(0, 38)} ${preco} [${(pu || "").trim().slice(0, 20)}]`;
  }).join(" | ");
}

if (secao === "tudo" || secao === "fundo") {
  log("\n===== FUNDO SFCC =====");
  for (const id of ["continente", "pd", "auchan"]) {
    const r0 = await get(G[id]("leite", "&start=0&sz=48"));
    const tot = (r0.txt.match(/data-total-count="(\d+)"/) || [])[1];
    log(`\n## ${id} leite: ${r0.status} tiles=${r0.txt.split(MARCA[id]).length - 1} total=${tot}`);
    log("  srules:", [...new Set([...r0.txt.matchAll(/srule=([\w%-]+)/g)].map((m) => m[1]))].join(" | "));
    log("  sort classes:", [...new Set([...r0.txt.matchAll(/<option class="([\w-]+)"[^>]*Search-UpdateGrid/g)].map((m) => m[1]))].join(" | "));
    log("  more:", (r0.txt.match(/data-url="[^"]*start=\d+[^"]*"/) || [""])[0].slice(0, 250));
    for (const start of [0, 36, 48, 96]) {
      const r = await get(G[id]("leite", `&start=${start}&sz=48`));
      log(`  start=${start}: ${r.status} tiles=${r.txt.split(MARCA[id]).length - 1} :: ${amostra(id, r.txt, 3)}`);
    }
    for (const s of ["price-per-capacity-ascending", "price-low-to-high", "price-per-unit-ascending", "unit-price-ascending", "price-asc"]) {
      for (const q of ["leite", "arroz", "azeite"]) {
        const r = await get(G[id](q, `&start=0&sz=48&srule=${s}`));
        log(`  ${s} ${q}: ${r.status} tiles=${r.txt.split(MARCA[id]).length - 1} :: ${amostra(id, r.txt, 5)}`);
      }
    }
    for (const sz of [96, 200]) { const r = await get(G[id]("leite", `&start=0&sz=${sz}`)); log(`  sz=${sz}: ${r.status} tiles=${r.txt.split(MARCA[id]).length - 1} ${r.ms}ms ${r.txt.length}b`); }
  }
}

if (secao === "tudo" || secao === "novas2") {
  log("\n===== NOVAS 2 =====");
  const im = await get("https://www.intermarche.pt/");
  const nd = (im.txt.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) || [])[1] || "";
  log("intermarche NEXT_DATA", nd.length, nd.slice(0, 1500));
  log("intermarche links:", [...new Set([...im.txt.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]))].slice(0, 80).join(" "));
  log("intermarche scripts:", [...im.txt.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]).slice(0, 30).join(" "));
  for (const u of ["https://www.intermarche.pt/api/search?q=leite", "https://www.intermarche.pt/produtos?q=leite", "https://www.intermarche.pt/pesquisa/leite", "https://www.intermarche.pt/rechercheproduits/leite", "https://www.intermarche.pt/catalogo"]) {
    const r = await get(u); log(`  ${u} → ${r.status} ${r.txt.length}b`, r.txt.slice(0, 200).replace(/\s+/g, " "));
  }
  const fr = await get("https://www.froiz.pt/");
  log("\nfroiz links:", [...new Set([...fr.txt.matchAll(/href="(https?:[^"#]+)"/g)].map((m) => m[1]))].filter((u) => !/wp-content|wp-json|fonts|facebook|instagram|linkedin|youtube|twitter/.test(u)).slice(0, 60).join(" "));
  log("froiz vtex:", trecho(fr.txt, "vtex", 4, 200));
  for (const u of ["https://www.froiz.pt/api/catalog_system/pub/products/search?ft=leite", "https://froiz.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=leite", "https://froizpt.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=leite", "https://tienda.froiz.com/api/catalog_system/pub/products/search?ft=leite", "https://loja.froiz.pt/api/catalog_system/pub/products/search?ft=leite"]) {
    const r = await get(u); log(`  ${u} → ${r.status} ${r.txt.length}b`, r.txt.slice(0, 300).replace(/\s+/g, " "));
  }
  const os = await get("https://www.apolonia.com/opensearch.php");
  log("\napolonia opensearch:", os.status, os.txt.slice(0, 800).replace(/\s+/g, " "));
  const tpl = (os.txt.match(/template="([^"]+)"/) || [])[1];
  if (tpl) {
    const u = dec(tpl).replace("{searchTerms}", "leite");
    const r = await get(u);
    log(`  ${u} → ${r.status} ${r.txt.length}b`);
    log("  precos:", trecho(r.txt, "€", 8, 80).join(" ¦ "));
    log("  produto:", trecho(r.txt, "product|produto", 4, 300).join(" ¦ "));
  }
  const cv = await get("https://www.coviran.pt/");
  log("\ncoviran links:", [...new Set([...cv.txt.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]))].slice(0, 60).join(" "));
  log("coviran preco:", trecho(cv.txt, "price|preco|€", 5, 200).join(" ¦ "));
  const sp = await get("https://www.spar.pt/");
  log("\nspar links:", [...new Set([...sp.txt.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]))].slice(0, 40).join(" "));
}

if (secao === "novas3") {
  log("\n===== FROIZ API =====");
  const F = "https://serviciospt.froiz.com";
  const hh = { Accept: "application/json, text/plain, */*", Origin: "https://loja.froiz.com", Referer: "https://loja.froiz.com/" };
  for (const u of [
    "/api/products/slug/59477-filete-de-atum-gallo-em-azeite-virgem-extra-120-g",
    "/api/products/search?q=leite", "/api/products/search?query=leite", "/api/products/search?search=leite", "/api/products/search/leite",
    "/api/products?search=leite", "/api/products?q=leite", "/api/search?q=leite", "/api/search/products?q=leite", "/api/products/find?q=leite",
    "/api/products/autocomplete?q=leite", "/api/categories", "/api/offers",
  ]) {
    const r = await get(F + u, { headers: hh });
    log(`  ${u} → ${r.status} ${r.ct} ${r.txt.length}b ::`, r.txt.slice(0, 700).replace(/\s+/g, " "));
  }
  log("\n===== APOLONIA / SPAR =====");
  for (const u of ["https://www.apolonia.com/pt/procurar/?q=leite", "https://www.apolonia.com/pt/pesquisa/?q=leite", "https://www.spar.pt/produtos/resumo", "https://www.spar.pt/b2b-shopping-artigos/0/", "https://www.spar.pt/loja/resumo"]) {
    const r = await get(u);
    log(`\n## ${u} → ${r.status} ${r.url} ${r.txt.length}b`);
    log("  precos:", trecho(r.txt, "€", 6, 100).join(" ¦ "));
    log("  links:", [...new Set([...r.txt.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]))].filter((x) => /produto|product|artigo|pesquis|procur|search/i.test(x)).slice(0, 25).join(" "));
  }
}
