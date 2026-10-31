import { buscar } from "../supermercados/comum.js";

/*
 * IKEA. O site pesquisa numa API própria que devolve JSON com o preço de
 * venda (salesPrice.numeral). Alguns artigos vendem-se aos pares: o preço
 * vem com priceUnit "2 unidades" — é o preço do conjunto, não de cada um.
 *
 * Os produtos são só da IKEA: não aparecem noutras lojas. Comparam-se
 * pelo tipo de artigo (uma lâmpada E27 com outra), não pelo produto.
 */

const API = "https://sik.search.blue.cdtapps.com/pt/pt/search-result-page";

export function lerIkea(dados) {
  const itens = dados?.searchResultPage?.products?.main?.items;
  if (!Array.isArray(itens)) throw new Error("resposta da IKEA sem lista de produtos");
  return itens.map((it) => {
    const p = it?.product;
    const sp = p?.salesPrice;
    if (!p || !(sp?.numeral > 0)) return null;
    const pares = String(sp.priceUnit || "").match(/(\d+)\s*unidades?/i);
    const n = pares ? parseInt(pares[1], 10) : 1;
    // Preço só para sócios IKEA Family: não é o preço de toda a gente.
    const soFamily = /FAMILY/i.test(JSON.stringify([sp.tag, sp.tags, sp.tagWithText]));
    return {
      id: String(p.itemNo || p.id || ""),
      // O tipo primeiro ("Lâmpada LED E27 … SOLHETTA"): o artigo que se
      // procura vem à frente, como nas outras lojas, e o motor reconhece-o.
      nome: [p.typeName, p.name].filter(Boolean).join(" ") + (p.validDesignText ? `, ${p.validDesignText}` : ""),
      marca: "IKEA",
      quantidade: n > 1 ? `${n} un` : null,
      preco: sp.numeral,
      precoAntigo: null,
      url: p.pipUrl || null,
      imagem: p.mainImageUrl || null,
      categoria: null,
      onde: p.onlineSellable === false ? "loja" : "online",
      ...(soFamily ? { soComCartao: true, promo: "Com IKEA Family" } : {}),
    };
  }).filter(Boolean);
}

export const ikea = {
  id: "ikea",
  nome: "IKEA",
  async pesquisar(q) {
    const dados = await buscar(`${API}?q=${encodeURIComponent(q)}&size=48&types=PRODUCT`, { json: true });
    return lerIkea(dados);
  },
};
