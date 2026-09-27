/*
 * Peças comuns aos adaptadores de cada supermercado: ir buscar a página,
 * ler preços escritos à portuguesa e pôr tudo na mesma unidade (€/kg, €/L,
 * €/un) — sem isso, "2,97 €" contra "1,49 €" não diz qual é mais barato.
 */

const TIMEOUT_MS = 7000;

// Um browser normal. Os sites respondem o mesmo HTML a qualquer visitante;
// só não gostam de clientes que não se identificam.
const CABECALHOS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  "Accept-Language": "pt-PT,pt;q=0.9",
};

export async function buscar(url, { json = false, headers = {} } = {}) {
  const r = await fetch(url, {
    // O Lidl recusa (406) "application/json": a API dele fala um tipo
    // próprio. "*/*" serve a todos.
    headers: { ...CABECALHOS, Accept: json ? "*/*" : "text/html", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return json ? r.json() : r.text();
}

/** "2,97€" · "1.69" · "0,99€/kg" → número. */
export function lerNumero(txt) {
  if (txt == null) return null;
  if (typeof txt === "number") return Number.isFinite(txt) ? txt : null;
  const m = String(txt).replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/*
 * "kg" · "Kg" · "lt" · "L" · "un" · "dos" · "doz" → kg | l | un | dose | dz.
 *
 * "dose" fica à parte (detergentes: o que interessa é o preço por
 * lavagem, e as lojas afixam-no assim). "dz" é a dúzia do Continente nos
 * ovos — convertida para preço por ovo em lerPrecoUnidade, que é como o
 * Pingo Doce e a Auchan a mostram.
 */
export function lerUnidade(txt) {
  const t = String(txt || "").toLowerCase();
  if (/\bkg\b|quilo/.test(t)) return "kg";
  if (/\b(l|lt|litro|litros)\b/.test(t)) return "l";
  if (/\b(dos|dose|doses|lavagem|lavagens)\b/.test(t)) return "dose";
  if (/\b(doz|dz|dúzia|duzia)\b/.test(t)) return "dz";
  if (/\b(un|unid|unidade|uni|rolo|rolos|saqueta|saquetas|cápsula|cápsulas|capsula|capsulas)\b/.test(t)) return "un";
  return null;
}

/** "0,99€/kg" · "0.85 €/Lt" · "1 kg = 13,30" → { valor, unidade }. */
export function lerPrecoUnidade(txt) {
  if (!txt) return null;
  const t = String(txt);
  // Formato Lidl: "1 kg = 13,30" / "1 L = 0,83"
  const igual = t.match(/(\d+(?:[.,]\d+)?)?\s*(kg|l|g|ml)\b[^=]*=\s*(\d+(?:[.,]\d+)?)/i);
  if (igual) {
    const qtd = igual[1] ? parseFloat(igual[1].replace(",", ".")) : 1;
    let unidade = igual[2].toLowerCase();
    let valor = parseFloat(igual[3].replace(",", ".")) / qtd;
    if (unidade === "g") { unidade = "kg"; valor *= 1000; }
    if (unidade === "ml") { unidade = "l"; valor *= 1000; }
    return { valor: arred(valor), unidade };
  }
  const [antes, depois] = t.split("/");
  if (depois === undefined) return null;
  const valor = lerNumero(antes);
  const unidade = lerUnidade(depois);
  if (valor == null || !unidade) return null;
  if (unidade === "dz") return { valor: arred(valor / 12), unidade: "un" };
  return { valor, unidade };
}

/*
 * Quantidade total de uma embalagem, na unidade base. Serve para calcular
 * o preço por unidade quando a loja não o mostra.
 *   "emb. 6 x 1 lt"   → { qtd: 6, unidade: "l" }
 *   "emb. 12 un"      → { qtd: 12, unidade: "un" }   (ovos, rolos, cápsulas…)
 *   "emb. 12 + 4 un"  → { qtd: 16, unidade: "un" }
 *   "76 Dos"          → { qtd: 76, unidade: "dose" }
 * Peso e volume ganham à contagem: "8 un 400 g" compara-se ao kg.
 */
export function lerQuantidade(txt) {
  const t = String(txt || "").toLowerCase().replace(/(\d),(\d)/g, "$1.$2");
  // Sem pesos de uma gama ("fraldas 2-5kg"): esse é o peso do bebé.
  const m = t.match(/(?<![-+\d.])(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*(kg|g|gr|l|lt|cl|ml)\b/);
  if (m) {
    const vezes = m[1] ? parseInt(m[1], 10) : 1;
    let qtd = parseFloat(m[2]) * vezes;
    let unidade = m[3];
    if (unidade === "g" || unidade === "gr") { qtd /= 1000; unidade = "kg"; }
    else if (unidade === "ml") { qtd /= 1000; unidade = "l"; }
    else if (unidade === "cl") { qtd /= 100; unidade = "l"; }
    else if (unidade === "lt") unidade = "l";
    return qtd > 0 ? { qtd, unidade } : null;
  }
  const c = t.match(/(\d+)(?:\s*\+\s*(\d+))?\s*(un|unid|unidades|rolos?|doses?|dos|saquetas?|c[áa]psulas?|pastilhas?|ovos)\b/);
  if (c) {
    const qtd = parseInt(c[1], 10) + (c[2] ? parseInt(c[2], 10) : 0);
    return qtd > 0 ? { qtd, unidade: /^dos/.test(c[3]) ? "dose" : "un" } : null;
  }
  if (/\bdúzia|\bduzia/.test(t)) {
    const n = t.match(/(\d+(?:\.\d+)?|meia|1\/2)\s*d[úu]zias?/);
    const d = !n ? 1 : n[1] === "meia" || n[1] === "1/2" ? 0.5 : parseFloat(n[1]);
    return { qtd: d * 12, unidade: "un" };
  }
  return null;
}

export function arred(n) {
  return Math.round(n * 100) / 100;
}

/*
 * Garante o preço por unidade. Usa o da loja quando existe (é o que ela
 * afixa na prateleira) e só calcula a partir da embalagem quando falta.
 */
export function completarUnidade(p) {
  if (p.precoUnidade && p.unidade) return p;
  const q = lerQuantidade(p.quantidade) || lerQuantidade(p.nome);
  if (q && p.preco) return { ...p, precoUnidade: arred(p.preco / q.qtd), unidade: q.unidade };
  return { ...p, precoUnidade: p.preco ?? null, unidade: "un" };
}

/*
 * Parte o HTML da grelha num bocado por produto, a começar em cada
 * ocorrência da classe do cartão. O HTML destas grelhas nem sempre fecha
 * as tags como deve (o da Auchan não fecha): lido de uma vez, o parser
 * fechava o cartão a meio e perdia o nome e o preço. Cada bocado é lido à
 * parte, e um erro num produto não estraga os outros.
 */
export function partirPorProduto(html, marcaInicio) {
  const partes = html.split(marcaInicio);
  partes.shift(); // o que vem antes do primeiro produto
  return partes.map((p) => `<div class="${marcaInicio.replace(/^<div class="/, "")}${p}`);
}

/* "LARANJA AUCHAN KG" → "Laranja auchan kg". Só mexe no que vem todo em
   maiúsculas, que se lê como um grito numa lista. */
export function capitalizar(nome) {
  const t = String(nome || "").trim();
  if (!t || t !== t.toUpperCase()) return t.charAt(0).toUpperCase() + t.slice(1);
  const m = t.toLowerCase();
  return m.charAt(0).toUpperCase() + m.slice(1);
}

export function absoluto(base, href) {
  if (!href) return null;
  try { return new URL(href, base).toString(); } catch { return null; }
}
