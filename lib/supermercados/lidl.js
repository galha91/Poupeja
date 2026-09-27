import { buscar, lerPrecoUnidade, absoluto } from "./comum";

/*
 * O Lidl não vende mercearia online, mas a pesquisa do site devolve os
 * artigos em destaque nas lojas (folheto da semana e da próxima), com
 * preço, embalagem e €/kg. São preços de LOJA e com datas — por isso cada
 * resultado leva "onde: loja" e o período, para a app não os confundir
 * com um preço de sempre.
 */

const BASE = "https://www.lidl.pt";

function dataCurta(segundos) {
  if (!segundos) return null;
  return new Date(segundos * 1000).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", timeZone: "Europe/Lisbon" });
}

export const lidl = {
  id: "lidl",
  nome: "Lidl",
  async pesquisar(q) {
    const url = `${BASE}/q/api/search?q=${encodeURIComponent(q)}&assortment=PT&locale=pt_PT&version=v2.0.0&fetchsize=24`;
    const dados = await buscar(url, { json: true });
    // Sem a lista "items" é porque a resposta mudou de formato — isso é
    // uma avaria, não "zero promoções" (e a verificação diária tem de a ver).
    if (!Array.isArray(dados?.items)) throw new Error("resposta do Lidl sem lista de artigos");
    return dados.items.map((it) => {
      const d = it.gridbox?.data || {};
      let p = d.price || {};
      let comLidlPlus = false;
      // Alguns artigos só têm preço com a app Lidl Plus.
      if (p.price == null && d.lidlPlus?.[0]?.price?.price != null) {
        p = d.lidlPlus[0].price;
        comLidlPlus = true;
      }
      if (p.price == null) return null;
      const unid = lerPrecoUnidade(p.basePrice?.text);
      const inicio = dataCurta(d.storeStartDate);
      const fim = dataCurta(d.storeEndDate);
      return {
        id: String(d.productId || it.code || ""),
        nome: d.fullTitle || d.title,
        marca: d.brand?.showBrand ? d.brand.name : null,
        quantidade: p.packaging?.text || null,
        preco: p.price,
        precoAntigo: p.oldPrice || p.discount?.deletedPrice || null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        rotuloUnidade: p.basePrice?.text || null,
        promo: comLidlPlus ? "Com Lidl Plus" : null,
        onde: "loja",
        periodo: inicio && fim ? `${inicio} a ${fim}` : null,
        url: absoluto(BASE, d.canonicalUrl),
        imagem: d.image || null,
        categoria: d.keyfacts?.wonCategoryPrimary || null,
      };
    }).filter(Boolean);
  },
};
