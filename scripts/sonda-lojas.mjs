// TEMPORÁRIO — investigação de fontes de preços. Corre no GitHub Actions.
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9", Accept: "text/html,application/json;q=0.9,*/*;q=0.8" };

async function ver(url, { extrair = [], headers = {}, mostrar = 0, metodo = "GET", corpo } = {}) {
  try {
    const r = await fetch(url, { method: metodo, body: corpo, headers: { ...H, ...headers }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    console.log(`\n>> ${metodo} ${url}\n   ${r.status} ${r.headers.get("content-type")} len=${t.length} final=${r.url}`);
    for (const [nome, re] of extrair) {
      const ms = [...new Set([...t.matchAll(re)].map((m) => m[0]))].slice(0, 25);
      console.log(`   [${nome}] ${ms.length ? ms.join("\n      ") : "—"}`);
    }
    if (mostrar) console.log("   CORPO:", t.slice(0, mostrar).replace(/\s+/g, " "));
    return t;
  } catch (e) { console.log(`\n>> ${url}\n   ERRO ${e.message}`); return ""; }
}

const API = /https?:\/\/[a-z0-9.-]+\/[^"'\s)]*(api|search|pesquis|graphql|product|algolia)[^"'\s)]{0,120}/gi;
const API_REL = /["'`](\/[a-z0-9_\-/]*(api|search|pesquis|graphql|product)[a-z0-9_\-/{}.:?=&]*)["'`]/gi;

console.log("\n########## ALDI");
const aldi = await ver("https://www.aldi.pt/resultados-de-pesquisa.html?query=leite", { extrair: [["tiles", /product-tile[^"]{0,40}/g], ["preço", /\d+\.\d{2}<\/span>/g], ["chunks", /\/_next\/static\/chunks\/[^"]+\.js/g]] });
const chunks = [...new Set([...aldi.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]))];
for (const c of chunks) {
  const js = await fetch("https://www.aldi.pt" + c, { headers: H }).then((r) => r.text()).catch(() => "");
  const achados = [...new Set([...js.matchAll(API), ...js.matchAll(API_REL)].map((m) => m[1] && m[0].startsWith('"') ? m[1] : m[0]))].filter((x) => !/\.(png|svg|jpg|css)/.test(x));
  if (achados.length) console.log(`   ${c}:\n      ${achados.slice(0, 30).join("\n      ")}`);
}
await ver("https://www.aldi.pt/produto-detalhe/leite-meio-gordo-70175910.html", { extrair: [["preço", /"price[^,}]{0,60}/gi], ["ld+json", /application\/ld\+json[^<]{0,400}/g]] });
await ver("https://www.aldi.pt/categoria-de-produtos.html", { extrair: [["categorias", /\/categoria-de-produtos\/[a-z0-9\-/]+\.html/g], ["produto-detalhe", /produto-detalhe\/[^"]+/g]] });

console.log("\n########## EL CORTE INGLÉS");
for (const u of [
  "https://www.elcorteingles.pt/supermercado/pesquisar/?term=laranja",
  "https://www.elcorteingles.pt/supermercado/pesquisar/laranja/",
  "https://www.elcorteingles.pt/supermercado/search/?term=laranja",
  "https://www.elcorteingles.pt/supermercado/frescos/frutas-e-legumes/frutas/",
  "https://www.elcorteingles.pt/api/firefly/vuestore/pdp/supermercado/",
]) await ver(u, { extrair: [["preços", /\d+,\d{2} €(\s*\/\s*\w+)?/g], ["apis", API], ["json-produto", /data-(json|product|synth)="[^"]{0,200}/g]] });

console.log("\n########## INTERMARCHÉ");
const im = await ver("https://www.intermarche.pt/", { extrair: [["apis", API], ["next", /__NEXT_DATA__/g], ["lojas", /\/lojas\/[a-z0-9\-/]+/g]] });
await ver("https://www.intermarche.pt/lojas/", { extrair: [["lojas", /\/lojas\/[a-z0-9\-]+\/?/g], ["apis", API]] });
const imChunks = [...new Set([...im.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]))].slice(0, 40);
for (const c of imChunks) {
  const js = await fetch("https://www.intermarche.pt" + c, { headers: H }).then((r) => r.text()).catch(() => "");
  const achados = [...new Set([...js.matchAll(API)].map((m) => m[0]))].filter((x) => !/\.(png|svg|jpg|css)/.test(x));
  if (achados.length) console.log(`   ${c}:\n      ${achados.slice(0, 20).join("\n      ")}`);
}

console.log("\n########## FROIZ");
const fr = await ver("https://loja.froiz.com/", { extrair: [["scripts", /src="[^"]+\.js"/g], ["apis", API]] });
for (const s of [...new Set([...fr.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]))].slice(0, 8)) {
  const url = s.startsWith("http") ? s : "https://loja.froiz.com" + (s.startsWith("/") ? s : "/" + s);
  const js = await fetch(url, { headers: H }).then((r) => r.text()).catch(() => "");
  const achados = [...new Set([...js.matchAll(API), ...js.matchAll(/https?:\/\/[a-z0-9.-]*froiz[a-z0-9.-]*[^"'\s]{0,80}/gi)].map((m) => m[0]))];
  console.log(`   ${url} len=${js.length}:\n      ${achados.slice(0, 25).join("\n      ")}`);
}

console.log("\n########## OUTROS");
await ver("https://tienda.mercadona.pt/api/categories/", { mostrar: 300 });
await ver("https://www.mercadona.pt/", { extrair: [["tienda", /tienda[^"]{0,60}/g]] });
await ver("https://www.e-leclerc.pt/", { extrair: [["loja online", /loja[- ]online[^"<]{0,60}|compras online[^"<]{0,60}/gi], ["apis", API]] });
await ver("https://www.apolonia.com/pt/pesquisa?q=laranja", { extrair: [["preços", /\d+,\d{2}\s*€[^<]{0,20}/g]] });
await ver("https://www.continente.pt/on/demandware.store/Sites-continente-Site/default/SearchServices-GetSuggestions?q=lara", { mostrar: 600 });
await ver("https://www.continente.pt/on/demandware.store/Sites-continente-Site/default/Search-UpdateGrid?q=bolachas&start=0&sz=96", { extrair: [["tiles", /product-tile col-product-tile/g]] });
await ver("https://www.pingodoce.pt/on/demandware.store/Sites-pingo-doce-Site/default/SearchServices-GetSuggestions?q=lara", { mostrar: 600 });
await ver("https://www.auchan.pt/on/demandware.store/Sites-AuchanPT-Site/pt_PT/SearchServices-GetSuggestions?q=lara", { mostrar: 600 });
