/*
 * Páginas públicas por produto de marca (/produto/<slug>, /marca/<marca>) —
 * as contas, sem base de dados, para se poderem testar à parte.
 *
 * A fonte é a tabela produtos_marca: cada produto de marca nacional que
 * aparece numa pesquisa (da app ou do cron), com o preço desse dia. O mesmo
 * produto tem nomes diferentes em cada cadeia ("Leite Mimosa Meio Gordo 1L"
 * no Continente, "Leite UHT Meio-Gordo Mimosa" no Pingo Doce): junta-se
 * pela marca, pelo tamanho exato da embalagem e pelas palavras do nome.
 * Só com duas cadeias há comparação, e só aí a página vai para o Google.
 */
import { slugify } from "./slug.js";
import { LOJAS_SEO, FRESCO_DIAS } from "./seoPrecos.js";
import { diasAntes, euros } from "./seoFormato.js";

const NOME_LOJA = Object.fromEntries(LOJAS_SEO.map((l) => [l.id, l.nome]));
const ORDEM_LOJA = Object.fromEntries(LOJAS_SEO.map((l, i) => [l.id, i]));

/* Palavras que não distinguem um produto de outro da mesma marca e tamanho. */
const RUIDO = new Set([
  "de", "da", "do", "das", "dos", "e", "com", "sem", "em", "a", "o", "para", "ao", "na", "no",
  "uht", "emb", "embalagem", "pack", "garrafa", "lata", "frasco", "unidade", "unidades", "un", "und", "uni",
  "cx", "caixa", "pet", "saco", "x", "g", "gr", "kg", "ml", "cl", "l", "lt", "litro", "litros",
  "promo", "promocao", "oferta", "formato", "familiar", "poupanca", "economico",
]);

const semAcentos = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const capitalizar = (s) => String(s || "").toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

/* Nome de marca como se mostra: "MIMOSA" → "Mimosa". Marcas curtas em siglas ficam. */
export function nomeMarca(marca) {
  const m = String(marca || "").trim();
  return m.length <= 3 ? m.toUpperCase() : capitalizar(m);
}

/* As palavras que identificam o produto, sem a marca, o tamanho nem o ruído. */
export function palavrasProduto(nome, marca) {
  const da = new Set(semAcentos(marca).split(/[^a-z0-9]+/).filter(Boolean));
  return semAcentos(nome)
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !RUIDO.has(w) && !da.has(w) && !/^\d/.test(w) && w.length > 1)
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/* 1 L, 250 g, 6 L, 12 un */
export function rotuloQtd(qtd, unidade) {
  const q = Number(qtd);
  if (!(q > 0)) return "";
  const n = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
  if (unidade === "kg") return q < 1 ? `${n(q * 1000)} g` : `${n(q)} kg`;
  if (unidade === "l" || unidade === "L") return q < 1 ? `${n(q * 1000)} ml` : `${n(q)} L`;
  return `${n(q)} un`;
}

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 1;
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}

export const SEMELHANCA_MIN = 0.6;

/*
 * Agrupa as linhas de produtos_marca em produtos comparáveis.
 * Mesma marca + mesmo tamanho exato + nomes parecidos (Jaccard ≥ 0,6).
 * O representante (que dá o nome e o endereço) é o produto visto há mais
 * tempo: assim o endereço não muda de um dia para o outro.
 */
export function agrupar(linhas) {
  const limpas = (linhas || [])
    .map((l) => ({ ...l, preco: Number(l.preco), valor: l.valor != null ? Number(l.valor) : null, qtd: l.qtd != null ? Number(l.qtd) : null }))
    .filter((l) => l.loja && NOME_LOJA[l.loja] && l.marca_slug && l.preco > 0 && l.qtd > 0)
    .sort((a, b) => String(a.primeiro_dia).localeCompare(String(b.primeiro_dia)) || ORDEM_LOJA[a.loja] - ORDEM_LOJA[b.loja] || String(a.produto_id).localeCompare(String(b.produto_id)));
  const baldes = new Map();
  for (const l of limpas) {
    const k = `${l.marca_slug}|${l.unidade}|${Math.round(l.qtd * 1000)}`;
    if (!baldes.has(k)) baldes.set(k, []);
    baldes.get(k).push({ ...l, palavras: palavrasProduto(l.nome, l.marca) });
  }
  const grupos = [];
  for (const lista of baldes.values()) {
    const locais = [];
    for (const l of lista) {
      const g = locais.find((x) => jaccard(x.palavras, l.palavras) >= SEMELHANCA_MIN);
      if (g) g.itens.push(l);
      else locais.push({ palavras: l.palavras, itens: [l] });
    }
    grupos.push(...locais);
  }
  // Endereços: do representante; se dois coincidirem, o segundo leva sufixo.
  const usados = new Map();
  return grupos.map((g) => {
    const r = g.itens[0];
    const marca = nomeMarca(r.marca);
    const qtdTxt = rotuloQtd(r.qtd, r.unidade);
    const baseNome = String(r.nome).replace(/\s+\d+([.,]\d+)?\s*(x\s*\d+([.,]\d+)?\s*)?(kg|g|gr|ml|cl|l|lt|un|unid)\b.*$/i, "").trim();
    const temMarca = semAcentos(baseNome).includes(semAcentos(r.marca));
    const nome = `${capitalizar(baseNome)}${temMarca ? "" : ` ${marca}`} ${qtdTxt}`.replace(/\s+/g, " ").trim();
    let slug = slugify(nome).slice(0, 90).replace(/-+$/, "");
    const n = (usados.get(slug) || 0) + 1;
    usados.set(slug, n);
    if (n > 1) slug = `${slug}-${n}`;
    return { slug, nome, marca, marcaSlug: r.marca_slug, q: r.q, qtd: r.qtd, unidade: r.unidade, itens: g.itens };
  });
}

/*
 * As ofertas de hoje de um produto: a linha mais barata de cada cadeia
 * vista nos últimos 3 dias. Mesmo tamanho em todas, por isso compara-se o
 * preço da embalagem.
 */
export function ofertasProduto(grupo, hoje) {
  const limite = diasAntes(hoje, FRESCO_DIAS);
  const porLoja = new Map();
  for (const l of grupo.itens) {
    if (String(l.ultimo_dia) < limite) continue;
    const a = porLoja.get(l.loja);
    if (!a || l.preco < a.preco) porLoja.set(l.loja, l);
  }
  const ofertas = [...porLoja.values()]
    .sort((a, b) => a.preco - b.preco || ORDEM_LOJA[a.loja] - ORDEM_LOJA[b.loja])
    .map((l) => ({ loja: l.loja, lojaNome: NOME_LOJA[l.loja], preco: l.preco, valor: l.valor, produto: l.nome, dia: String(l.ultimo_dia), url: l.url || null, imagem: l.imagem || null }));
  const atualizado = ofertas.reduce((m, o) => (o.dia > m ? o.dia : m), "") || null;
  // Uma cadeia a mais do dobro de outra no MESMO produto e tamanho é quase
  // sempre um agrupamento errado: fica fora do Google.
  const coerente = ofertas.length < 2 || ofertas[ofertas.length - 1].preco <= ofertas[0].preco * 2;
  return { ofertas, atualizado, indexavel: ofertas.length >= 2 && coerente };
}

/* Série do melhor preço de cada dia (produtos_marca_dia dos produtos do grupo). */
export function serieProduto(grupo, dias) {
  const ids = new Set(grupo.itens.map((l) => `${l.loja}|${l.produto_id}`));
  const porDia = new Map();
  for (const d of dias || []) {
    if (!ids.has(`${d.loja}|${d.produto_id}`)) continue;
    const v = Number(d.preco);
    if (!(v > 0)) continue;
    if (!porDia.has(d.dia) || v < porDia.get(d.dia)) porDia.set(d.dia, v);
  }
  return [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, v]) => ({ dia, media: v, minimo: v }));
}

export function frasesProduto(grupo, dados, hoje) {
  const { ofertas, atualizado } = dados;
  const out = [];
  const quando = !hoje || atualizado === hoje ? "Hoje" : `A ${String(atualizado).slice(8, 10).replace(/^0/, "")}/${String(atualizado).slice(5, 7)}`;
  if (ofertas.length >= 2) {
    const [a, b] = ofertas;
    const dif = Math.round((b.preco - a.preco) * 100) / 100;
    out.push(dif >= 0.01
      ? `${quando}, o ${grupo.nome} está mais barato no ${a.lojaNome}: ${euros(a.preco)} €, menos ${euros(dif)} € do que no ${b.lojaNome}.`
      : `${quando}, o ${grupo.nome} custa o mesmo no ${a.lojaNome} e no ${b.lojaNome}: ${euros(a.preco)} €.`);
    const z = ofertas[ofertas.length - 1];
    if (ofertas.length >= 3 && z.preco - a.preco >= 0.05) out.push(`No ${z.lojaNome}, o mais caro, custa ${euros(z.preco)} €.`);
  } else if (ofertas.length === 1) {
    out.push(`${quando}, só encontrámos o ${grupo.nome} à venda online no ${ofertas[0].lojaNome}, a ${euros(ofertas[0].preco)} €.`);
  }
  return out;
}

export function metaProduto(grupo, dados) {
  const [a, b] = dados.ofertas;
  const base = `Preço ${grupo.nome} hoje`;
  const opcoes = [
    a && b ? `${base}: ${a.lojaNome} vs ${b.lojaNome} | PoupeJá` : null,
    a && b ? `${base}: ${a.lojaNome} vs ${b.lojaNome}` : null,
    `${base} | PoupeJá`,
    base,
  ].filter(Boolean);
  const titulo = opcoes.find((t) => t.length <= 60) || base.slice(0, 60);
  const descricao = a
    ? `${grupo.nome} desde ${euros(a.preco)} € no ${a.lojaNome}${b ? `. Comparamos ${dados.ofertas.map((o) => o.lojaNome).join(", ")}` : ""}, com histórico de preço. Grátis.`
    : `Preço do ${grupo.nome} nos supermercados com preços online, comparado todos os dias. Grátis na app PoupeJá.`;
  return { titulo, descricao };
}

/* Product com Brand e AggregateOffer (mesmo tamanho em todas as ofertas). */
export function produtoMarcaLd(urlSite, grupo, dados) {
  if (!dados.ofertas.length) return null;
  const precos = dados.ofertas.map((o) => o.preco);
  const imagem = dados.ofertas.find((o) => o.imagem)?.imagem;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: grupo.nome,
    brand: { "@type": "Brand", name: grupo.marca },
    ...(imagem ? { image: [imagem] } : {}),
    url: `${urlSite}/produto/${grupo.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...precos).toFixed(2),
      highPrice: Math.max(...precos).toFixed(2),
      offerCount: dados.ofertas.length,
      offers: dados.ofertas.map((o) => ({
        "@type": "Offer",
        price: o.preco.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: o.lojaNome },
        ...(o.url ? { url: o.url } : {}),
      })),
    },
  };
}

/* Marcas com produtos, cada uma com os seus grupos. */
export function porMarca(grupos) {
  const m = new Map();
  for (const g of grupos) {
    if (!m.has(g.marcaSlug)) m.set(g.marcaSlug, { slug: g.marcaSlug, nome: g.marca, grupos: [] });
    m.get(g.marcaSlug).grupos.push(g);
  }
  return [...m.values()].sort((a, b) => b.grupos.length - a.grupos.length || a.nome.localeCompare(b.nome, "pt"));
}
