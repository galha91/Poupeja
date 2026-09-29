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

if (secao === "tudo" || secao === "sfcc") {
  log("\n===== SFCC =====");
  for (const [id, [base, site, marca]] of Object.entries(SFCC)) {
    const show = await get(`${base}/pesquisa/?q=leite`);
    log(`\n## ${id} Search-Show ${show.status} ${show.txt.length}b ${show.ms}ms`);
    log(" srules:", [...new Set([...show.txt.matchAll(/srule=([\w%-]+)/g)].map((m) => m[1]))].join(" | "));
    log(" sort opts:", trecho(show.txt, "option[^>]*data-id=", 8, 160));
    log(" total:", trecho(show.txt, "resultados|produtos encontrados|search-result-count|data-total", 4, 160));
    for (const q of ["leite", "arroz", "iogurte", "detergente roupa", "atum"]) {
      for (const sz of [48, 200]) {
        const r = await get(`${base}/on/demandware.store/Sites-${site}-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}&start=0&sz=${sz}`);
        const n = r.txt.split(marca).length - 1;
        log(`  ${q} sz=${sz}: ${r.status} tiles=${n} ${r.ms}ms`);
      }
    }
  }
}

if (secao === "tudo" || secao === "srule") {
  log("\n===== SRULE =====");
  const cand = ["price-low-to-high", "preco-crescente", "price-asc", "pricelowtohigh", "price_asc", "precio-asc", "price-per-unit-asc", "preco-por-unidade", "PCS_price_asc", "price-lowest", "unit-price-low-to-high", "lowest-price"];
  for (const [id, [base, site, marca]] of Object.entries(SFCC)) {
    for (const s of cand) {
      const r = await get(`${base}/on/demandware.store/Sites-${site}-Site/default/Search-UpdateGrid?q=leite&start=0&sz=12&srule=${s}`);
      const precos = [...r.txt.matchAll(/"price":"?([\d.]+)/g)].map((m) => m[1]).slice(0, 8).join(",");
      const precos2 = [...r.txt.matchAll(/content="([\d.]+)"/g)].map((m) => m[1]).slice(0, 8).join(",");
      log(`  ${id} srule=${s}: ${r.status} ${precos || precos2}`);
    }
  }
}

if (secao === "tudo" || secao === "algolia") {
  log("\n===== ALDI / LIDL =====");
  for (const q of ["leite", "arroz", "iogurte", "queijo", "detergente"]) {
    const r = await get("https://EO5090GA91-dsn.algolia.net/1/indexes/*/queries", { method: "POST", headers: { "x-algolia-application-id": "EO5090GA91", "x-algolia-api-key": "10266a4d1d421a7befa6fbf8fb92eb8f", "content-type": "application/json", Origin: "https://www.aldi.pt", Referer: "https://www.aldi.pt/" }, body: JSON.stringify({ requests: [{ indexName: "an_prd_pt_pt_products2", params: `query=${q}&hitsPerPage=200` }] }) });
    let j = {}; try { j = JSON.parse(r.txt); } catch {}
    const res = j.results?.[0] || {};
    log(`  aldi ${q}: nbHits=${res.nbHits} hits=${res.hits?.length} ${r.status}`);
  }
  for (const q of ["leite", "arroz", "iogurte", "queijo"]) {
    const r = await get(`https://www.lidl.pt/q/api/search?q=${q}&fetchsize=100&offset=0&locale=pt_PT&assortment=PT&version=2.1.0`, { headers: { Accept: "*/*" } });
    let j = {}; try { j = JSON.parse(r.txt); } catch {}
    const tipos = {}; (j.items || []).forEach((i) => { const k = (i.gridbox?.data?.category || i.type || "?") + "|" + (i.gridbox?.data?.price?.price ? "preco" : "sem"); tipos[k] = (tipos[k] || 0) + 1; });
    log(`  lidl ${q}: ${r.status} numFound=${j.numFound} items=${j.items?.length}`, JSON.stringify(tipos).slice(0, 400));
  }
}

if (secao === "tudo" || secao === "novas") {
  log("\n===== LOJAS NOVAS =====");
  const urls = [
    "https://www.intermarche.pt/", "https://www.intermarche.pt/pesquisa?q=leite", "https://lojaonline.intermarche.pt/", "https://www.intermarche.pt/lojas-online",
    "https://www.elcorteingles.pt/supermercado/pesquisar/?term=leite", "https://www.elcorteingles.pt/api/firefly/vuestore/new-search/supermercado/1/?s=leite",
    "https://www.froiz.com/", "https://loja.froiz.com/", "https://www.froiz.pt/", "https://loja.froiz.pt/",
    "https://tienda.mercadona.pt/", "https://tienda.mercadona.pt/api/categories/", "https://www.mercadona.pt/",
    "https://www.minipreco.pt/", "https://www.minipreco.pt/search?text=leite",
    "https://www.apolonia.com/", "https://www.apolonia.com/pt/pesquisa?q=leite",
    "https://www.spar.pt/", "https://www.makro.pt/", "https://www.recheio.pt/", "https://mercadao.pt/", "https://www.coviran.pt/",
  ];
  for (const u of urls) {
    const r = await get(u);
    const titulo = (r.txt.match(/<title[^>]*>([^<]*)/i) || [])[1];
    log(`\n## ${u} → ${r.status} ${r.url || ""} ${r.txt.length}b ${r.ms}ms ct=${r.ct}`);
    log("  title:", titulo?.trim().slice(0, 120));
    const sinais = ["algolia", "demandware", "vtex", "magento", "shopify", "prestashop", "hybris", "occ/v2", "__NEXT_DATA__", "graphql", "elasticsearch", "api/v\\d", "searchspring", "klevu", "doofinder", "empathy", "constructor.io", "bloomreach", "cf-chl", "captcha", "akamai", "datadome", "incapsula", "perimeterx"];
    const achados = sinais.filter((s) => new RegExp(s, "i").test(r.txt));
    log("  sinais:", achados.join(", "));
    for (const s of ["algolia", "doofinder", "empathy", "api/", "search"]) {
      const t = trecho(r.txt, s, 2, 180);
      if (t.length) log(`  [${s}]`, t.join(" ¦ "));
    }
    if (r.txt.length < 600) log("  corpo:", r.txt.replace(/\s+/g, " ").slice(0, 500));
  }
}
