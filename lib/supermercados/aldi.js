import { buscar, lerQuantidade, arred } from "./comum";

/*
 * O Aldi não vende online, mas o site tem o sortido todo com preços de
 * loja — e a pesquisa do site é um índice Algolia. A aplicação e a chave
 * abaixo são as PÚBLICAS, de só leitura, que o próprio aldi.pt manda para
 * o browser de qualquer visitante (estão no JavaScript da página). Se o
 * Aldi as trocar, a pesquisa desta loja falha e a verificação diária avisa.
 *
 * Preços de loja: cada resultado sai com onde: "loja".
 */

const APP = "EO5090GA91";
const CHAVE = "10266a4d1d421a7befa6fbf8fb92eb8f";
const INDICE = "an_prd_pt_pt_products2";

// "kg" · "l" · "Stck." (peça) → unidade de comparação.
function unidadeBase(escala) {
  const e = String(escala || "").toLowerCase();
  if (/^kg/.test(e)) return { unidade: "kg", fator: 1 };
  if (/^100\s*g/.test(e)) return { unidade: "kg", fator: 10 };
  if (/^l\b|^lt|^litro/.test(e)) return { unidade: "l", fator: 1 };
  if (/^100\s*ml/.test(e)) return { unidade: "l", fator: 10 };
  if (/st|un|pe[çc]a/.test(e)) return { unidade: "un", fator: 1 };
  return null;
}

export const aldi = {
  id: "aldi",
  nome: "Aldi",
  async pesquisar(q) {
    const dados = await buscar(`https://${APP}-dsn.algolia.net/1/indexes/*/queries`, {
      json: true,
      metodo: "POST",
      corpo: JSON.stringify({ requests: [{ indexName: INDICE, params: `query=${encodeURIComponent(q)}&hitsPerPage=100` }] }),
      headers: {
        "x-algolia-application-id": APP,
        "x-algolia-api-key": CHAVE,
        "content-type": "application/json",
        Origin: "https://www.aldi.pt",
        Referer: "https://www.aldi.pt/",
      },
    });
    const hits = dados?.results?.[0]?.hits;
    if (!Array.isArray(hits)) throw new Error("resposta do Aldi sem lista de artigos");

    const agora = Date.now() / 1000;
    return hits.map((h) => {
      if (h.isAvailable === false) return null;
      const atual = h.currentPrice || {};
      const preco = atual.priceValue;
      if (!(preco > 0)) return null;
      const base = atual.basePrice?.[0];
      const u = unidadeBase(base?.basePriceScale);
      let precoUnidade = u && base?.basePriceValue > 0 ? arred(base.basePriceValue * u.fator) : null;
      let unidade = precoUnidade ? u.unidade : null;
      // "1 kg" vendido ao kg: o preço já é o do quilo.
      const aoPeso = /^1\s*kg$/i.test(String(h.salesUnit || "").trim()) && !precoUnidade;
      if (aoPeso) { precoUnidade = preco; unidade = "kg"; }
      if (!precoUnidade) {
        const qtd = lerQuantidade(h.salesUnit);
        if (qtd) { precoUnidade = arred(preco / qtd.qtd); unidade = qtd.unidade; }
      }
      // Promoção em curso: o preço normal é o de antes/depois dela.
      const promo = (h.promotionPrices || []).find((p) => p.validFrom <= agora && (!p.validUntil || p.validUntil >= agora));
      const normal = promo && h.regularPrice?.priceValue > preco ? h.regularPrice.priceValue : null;
      const fim = atual.validUntil > agora ? new Date(atual.validUntil * 1000).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", timeZone: "Europe/Lisbon" }) : null;
      return {
        id: String(h.objectID || h.productSlug || ""),
        nome: String(h.name || "").trim(),
        marca: h.brandName || null,
        quantidade: h.salesUnit || null,
        preco,
        precoAntigo: normal,
        precoUnidade,
        unidade,
        aoPeso,
        rotuloUnidade: base ? `${base.basePriceValue} €/${base.basePriceScale}` : null,
        promo: fim && promo ? `Promoção até ${fim}` : null,
        onde: "loja",
        url: h.productSlug ? `https://www.aldi.pt/produto-detalhe/${h.productSlug}.html` : null,
        imagem: (h.assets || []).find((a) => a.type === "primary")?.url || null,
        categoria: null,
      };
    }).filter(Boolean);
  },
};
