import { parse } from "node-html-parser";
import { buscar, extras, lerNumero, lerPrecoUnidade, lerUnidade, absoluto, partirPorProduto } from "./comum";

/*
 * Apolónia: supermercado do Algarve com loja online que entrega em todo o
 * país (CTT). A pesquisa do site vem já com a grelha no HTML, 15 artigos
 * por página, com preço, preço por kg/L e a equivalência da embalagem
 * ("1 un = 0.25kg"). Vão-se buscar as primeiras páginas em paralelo.
 */

const BASE = "https://www.apolonia.com";
const PAGINAS = 4;
const MARCA = '<div class="product" data-prod=';

// "0.25kg" → "250 g", "1l" → "1 L", "6x1l" → "6x1 L".
function arrumarQuantidade(q) {
  const m = String(q || "").match(/^(\d+x)?(\d+(?:\.\d+)?)\s*(kg|l)$/i);
  if (!m) return q || null;
  const n = parseFloat(m[2]);
  const kg = m[3].toLowerCase() === "kg";
  if (!m[1] && n < 1) return `${Math.round(n * 1000)} ${kg ? "g" : "ml"}`;
  return `${m[1] || ""}${String(n).replace(".", ",")} ${kg ? "kg" : "L"}`;
}

const texto = (el) => (el?.text || "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// "2,55 € / un" → { valor: 2.55, por: "un" }
function lerPreco(el) {
  if (!el) return null;
  const valor = lerNumero(texto(el.querySelector(".amount")));
  const por = lerUnidade(texto(el).split("/")[1]);
  return valor ? { valor, por } : null;
}

export function lerGrelha(html) {
  return partirPorProduto(html, MARCA).map((bocado) => {
    const raiz = parse(bocado);
    const cartao = raiz.querySelector("div.product");
    if (!cartao || /Temporariamente Indispon/i.test(bocado)) return null;
    let info = {};
    try { info = JSON.parse(cartao.getAttribute("data-gtm-info") || "{}"); } catch {}
    const principal = lerPreco(raiz.querySelector(".prices-container .price"));
    if (!principal) return null;
    const extra = lerPrecoUnidade(texto(raiz.querySelector(".prices-container .price-extra")));
    const antigo = lerNumero(texto(raiz.querySelector(".prices-container .old-price, .prices-container .price-old, .prices-container del, .prices-container s")));
    // Fruta, carne e peixe ao peso: o preço grande já é o do kg.
    const aoPeso = principal.por === "kg";
    const unid = aoPeso ? { valor: principal.valor, unidade: "kg" } : extra;
    const link = raiz.querySelector("a.imglink");
    const img = raiz.querySelector("img[data-src]");
    const nome = texto(raiz.querySelector(".name")) || info.name;
    return {
      id: String(cartao.getAttribute("data-prod") || info.id || ""),
      nome,
      marca: info.brand || null,
      quantidade: aoPeso ? null : arrumarQuantidade(texto(raiz.querySelector(".unit-equivalent")).replace(/^1 un = /, "")),
      preco: principal.valor,
      aoPeso,
      precoPeca: null,
      precoAntigo: antigo && antigo > principal.valor ? antigo : null,
      precoUnidade: unid?.valor ?? null,
      unidade: unid?.unidade ?? null,
      rotuloUnidade: texto(raiz.querySelector(".prices-container .price-extra")) || null,
      url: absoluto(BASE, link?.getAttribute("href")),
      imagem: img?.getAttribute("data-src") || null,
      categoria: info.category || null,
    };
  }).filter(Boolean);
}

export const apolonia = {
  id: "apolonia",
  nome: "Apolónia",
  async pesquisar(q) {
    const url = (p) => `${BASE}/pt/procurar/?q=${encodeURIComponent(q)}${p > 1 ? `&p=${p}` : ""}`;
    const primeira = await buscar(url(1));
    const total = Number(primeira.match(/(\d+)\s*produtos?\s*</)?.[1]) || 0;
    const resto = [];
    for (let p = 2; p <= PAGINAS && (p - 1) * 15 < total; p++) resto.push(buscar(url(p)));
    const seguintes = await extras(resto);
    const vistos = new Set();
    return [primeira, ...seguintes].flatMap(lerGrelha).filter((p) => {
      if (vistos.has(p.id)) return false;
      vistos.add(p.id);
      return true;
    });
  },
};
