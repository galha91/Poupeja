import { buscar, extras, lerNumero, lerUnidade, absoluto } from "./comum.js"; // com .js: os testes correm em node sem bundler

/*
 * Apolónia (Algarve). A loja online mostra os preços a qualquer visitante,
 * sem código postal ("comprar sem localização"), e a pesquisa vem já no
 * HTML da página — lê-se como a do Continente. Cada cartão traz o preço
 * da embalagem, o preço por kg/L e, em promoção, o preço riscado.
 */

const BASE = "https://www.apolonia.com";
const PAGINAS = 3; // ~15 artigos por página

const limpar = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// '<span class="amount">2,99</span><span class="currency">€</span> / un' → { valor, unidade }
function preco(bocado) {
  if (!bocado) return null;
  const valor = lerNumero((bocado.match(/class="amount">([^<]+)/) || [])[1]);
  const unidade = lerUnidade((bocado.match(/<\/span>\s*\/\s*([a-zA-Zç]+)/) || [])[1]);
  return valor != null ? { valor, unidade } : null;
}

// O span de cada preço até ao seguinte (ou ao fim do contentor).
function spanDe(prices, classe) {
  const i = prices.search(new RegExp(`class="${classe}[" ]`));
  if (i < 0) return null;
  const resto = prices.slice(i + 10);
  const fim = resto.search(/class="price(?:-extra)?[" ]/);
  return prices.slice(i, fim < 0 ? undefined : i + 10 + fim);
}

export function lerCartoesApolonia(html) {
  return html.split('<a class="imglink"').slice(1).map((c) => {
    const url = (c.match(/href="([^"]+\/catalogo\/\d+\/[^"]+)"/) || [])[1];
    const nome = limpar((c.match(/<span class="name">([\s\S]*?)<\/span>/) || [])[1]);
    const prices = (c.match(/<span class="prices-container">([\s\S]*?)<span class="(?:favourite|unit-equivalent)/) || [])[1] || "";
    if (!url || !nome || !prices) return null;

    const promo = /class="price promocao/.test(prices);
    const atual = preco(spanDe(prices, promo ? "price promocao" : "price"));
    if (!atual) return null;
    const antigo = promo ? preco(spanDe(prices, "price original")) : null;
    const extra = preco(spanDe(prices, promo ? "price-extra promocao" : "price-extra"));
    const aoPeso = atual.unidade === "kg";

    return {
      id: (url.match(/\/catalogo\/(\d+)\//) || [])[1] || url,
      nome,
      marca: null,
      quantidade: null,
      aoPeso,
      preco: atual.valor,
      precoAntigo: antigo && antigo.valor > atual.valor ? antigo.valor : null,
      precoUnidade: aoPeso ? atual.valor : extra?.unidade ? extra.valor : null,
      unidade: aoPeso ? "kg" : extra?.unidade || null,
      promo: promo ? "Promoção" : null,
      url: absoluto(BASE, url),
      imagem: (c.match(/data-src="([^"]+)"/) || [])[1] || null,
    };
  }).filter(Boolean);
}

export const apolonia = {
  id: "apolonia",
  nome: "Apolónia",
  async pesquisar(q) {
    const url = (p) => `${BASE}/pt/procurar/?q=${encodeURIComponent(q)}${p > 1 ? `&p=${p}` : ""}`;
    const primeira = await buscar(url(1));
    if (!/prices-container|resultado|produtos/.test(primeira)) throw new Error("página da Apolónia sem grelha de produtos");
    const outras = await extras(Array.from({ length: PAGINAS - 1 }, (_, i) => buscar(url(i + 2))));
    const vistos = new Set();
    return [primeira, ...outras].flatMap(lerCartoesApolonia).filter((p) => !vistos.has(p.id) && vistos.add(p.id));
  },
};
