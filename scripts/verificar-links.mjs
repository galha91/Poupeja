/*
 * Verifica TODOS os links externos que o utilizador vê no PoupeJá:
 * apoios, folhetos, lojas, promoções e parceiros.
 *
 * Corre no GitHub Actions (workflow "Testar links"), que tem acesso livre à
 * internet. Uso local: `node scripts/verificar-links.mjs`.
 *
 * Um link pode estar "vivo" e mesmo assim estar partido para quem clica:
 *   - 404/410                        → partido
 *   - 200 com "página não encontrada" → partido (soft 404, comum em sites .gov)
 *   - redireccionado para a homepage  → a página específica deixou de existir
 *   - 401/403/429                    → o site bloqueia robôs; ver à mão
 *
 * Só HEAD não chega: há sites que respondem 404/405 a HEAD e servem a
 * página a um GET. Aqui é sempre GET, como um browser.
 */
import fs from "node:fs";

const RAIZ = new URL("..", import.meta.url).pathname;
const ler = (f) => fs.readFileSync(RAIZ + f, "utf8");

/* ── Recolha ─────────────────────────────────────────────────────────── */

function recolher() {
  const itens = [];
  const add = (grupo, nome, url) => url && itens.push({ grupo, nome, url });

  const apoios = JSON.parse(ler("public/apoios.json"));
  for (const a of apoios.apoios) {
    for (const [k, v] of Object.entries(a)) {
      if (typeof v === "string" && /^https?:\/\//.test(v)) add("Apoios", `${a.titulo || a.nome || a.id} (${k})`, v);
    }
  }

  const folhetos = JSON.parse(ler("public/folhetos.json"));
  for (const f of folhetos.folhetos) {
    add("Folhetos", f.loja, f.url);
    if (f.urlFallback) add("Folhetos", `${f.loja} (fallback)`, f.urlFallback);
  }

  // Objectos de uma linha { nome: "...", ... url: "..." } — lojas e promoções.
  const obj = /\{\s*nome:\s*"([^"]+)"[^}]*?\burl:\s*"([^"]+)"(?:[^}]*?\burlFallback:\s*"([^"]+)")?/g;
  for (const [ficheiro, grupo] of [["lib/lojas-data.js", "Promoções"], ["SecaoLojas.jsx", "Lojas"]]) {
    for (const m of ler(ficheiro).matchAll(obj)) {
      add(grupo, m[1], m[2]);
      if (m[3] && m[3] !== m[2]) add(grupo, `${m[1]} (fallback)`, m[3]);
    }
  }

  for (const f of ["SecaoContas.jsx", "SecaoPoupanca.jsx"]) {
    for (const m of ler(f).matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)) add("Parceiros", f, m[1]);
  }

  // Um URL pode aparecer em vários sítios: testa-se uma vez, reporta-se em todos.
  return itens;
}

/* ── Teste ───────────────────────────────────────────────────────────── */

const CABECALHOS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.5",
};

const SOFT_404 = /\b404\b|n[ãa]o (foi )?encontrad|p[áa]gina n[ãa]o existe|page not found|not found|no encontrad|conte[úu]do (j[áa] )?n[ãa]o (est[áa] )?dispon[íi]vel|erro na p[áa]gina/i;

function titulo(html) {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return t.replace(/\s+/g, " ").replace(/&amp;/g, "&").trim().slice(0, 90);
}
function h1(html) {
  return (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
}

async function testar(url) {
  const inicio = Date.now();
  try {
    const r = await fetch(url, { headers: CABECALHOS, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const html = (r.headers.get("content-type") || "").includes("html") ? (await r.text()).slice(0, 400000) : "";
    const pedido = new URL(url);
    const final = new URL(r.url);
    const tit = titulo(html);
    const cab = h1(html);

    let estado = "ok";
    let motivo = "";
    if (r.status === 404 || r.status === 410) { estado = "partido"; motivo = `HTTP ${r.status}`; }
    else if (r.status >= 500) { estado = "partido"; motivo = `HTTP ${r.status} (erro do servidor)`; }
    else if ([401, 403, 429].includes(r.status)) { estado = "bloqueado"; motivo = `HTTP ${r.status} — bloqueia robôs, ver à mão`; }
    else if (r.status >= 400) { estado = "partido"; motivo = `HTTP ${r.status}`; }
    else if (SOFT_404.test(tit) || SOFT_404.test(cab)) { estado = "partido"; motivo = `200 mas diz "${SOFT_404.test(tit) ? tit : cab}"`; }
    else if (pedido.pathname.length > 1 && (final.pathname === "/" || final.pathname === "") && final.hostname.replace(/^www\./, "") === pedido.hostname.replace(/^www\./, "")) {
      estado = "homepage"; motivo = "redirecciona para a página inicial";
    }
    if (final.hostname.replace(/^www\./, "") !== pedido.hostname.replace(/^www\./, "") && estado === "ok") {
      estado = "mudou"; motivo = `agora em ${final.hostname}`;
    }
    return { status: r.status, final: r.url, titulo: tit, estado, motivo, ms: Date.now() - inicio };
  } catch (e) {
    return { status: 0, final: "", titulo: "", estado: "partido", motivo: e.name === "TimeoutError" ? "sem resposta em 25 s" : e.message, ms: Date.now() - inicio };
  }
}

/* ── Execução ────────────────────────────────────────────────────────── */

const itens = recolher();
const unicos = [...new Set(itens.map((i) => i.url))];
const resultados = new Map();
const fila = [...unicos];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (fila.length) { const u = fila.shift(); resultados.set(u, await testar(u)); }
}));

const ICONE = { ok: "✅", mudou: "↪️", homepage: "🏠", bloqueado: "🚧", partido: "❌" };
const ordem = { partido: 0, homepage: 1, mudou: 2, bloqueado: 3, ok: 4 };
const linhas = itens
  .map((i) => ({ ...i, ...resultados.get(i.url) }))
  .sort((a, b) => ordem[a.estado] - ordem[b.estado] || a.grupo.localeCompare(b.grupo));

const contagem = linhas.reduce((c, l) => ((c[l.estado] = (c[l.estado] || 0) + 1), c), {});
let md = `## Links do PoupeJá — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC\n\n`;
md += `${linhas.length} links (${unicos.length} únicos): ` + Object.entries(contagem).map(([k, v]) => `${ICONE[k]} ${v} ${k}`).join(" · ") + "\n\n";
md += "| | grupo | nome | HTTP | título da página | nota | URL |\n|---|---|---|---|---|---|---|\n";
for (const l of linhas) {
  md += `| ${ICONE[l.estado]} | ${l.grupo} | ${l.nome} | ${l.status || "—"} | ${l.titulo.replace(/\|/g, "/")} | ${l.motivo.replace(/\|/g, "/")} | ${l.url}${l.final && l.final !== l.url ? ` → ${l.final}` : ""} |\n`;
}

console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
fs.writeFileSync("resultado-links.json", JSON.stringify(linhas, null, 2));

const maus = linhas.filter((l) => l.estado === "partido" || l.estado === "homepage");
if (process.env.GITHUB_OUTPUT && maus.length) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, "quebrados=" + maus.map((l) => `${l.grupo}: ${l.nome} (${l.motivo})`).join(", ").replace(/"/g, "'") + "\n");
}
