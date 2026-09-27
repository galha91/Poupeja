import { parse } from "node-html-parser";
import { buscar, lerNumero, lerPrecoUnidade, absoluto } from "./comum";

/*
 * Continente, Pingo Doce e Auchan correm todos em Salesforce Commerce Cloud.
 * O Search-UpdateGrid é o pedido que a própria página de pesquisa faz para
 * carregar mais resultados: devolve só a grelha de produtos, sem o resto do
 * site — mais leve para eles e para nós. Os preços são os da loja online,
 * que são os de referência nacional de cada cadeia.
 */

const N = 24; // resultados por loja: chega para o mais barato aparecer

function jsonAtributo(el, nome) {
  const v = el?.getAttribute(nome);
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

const texto = (el) => (el?.text || "").replace(/\s+/g, " ").trim();

/* ── Continente ── */
export const continente = {
  id: "continente",
  nome: "Continente",
  async pesquisar(q) {
    const base = "https://www.continente.pt";
    const html = await buscar(`${base}/on/demandware.store/Sites-continente-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}&start=0&sz=${N}`);
    return parse(html).querySelectorAll(".product-tile").map((t) => {
      const info = jsonAtributo(t, "data-product-tile-impression") || {};
      const link = t.querySelector(".ct-pdp-link a") || t.querySelector("a.image-link");
      const unid = lerPrecoUnidade(texto(t.querySelector(".pwc-tile--price-secondary")));
      const antigo = t.querySelector(".prices-wrapper .list:not(.d-none)");
      const img = t.querySelector("img.ct-tile-image");
      return {
        id: String(info.id || ""),
        nome: texto(t.querySelector(".pwc-tile--description")) || info.name,
        marca: info.brand || null,
        quantidade: texto(t.querySelector(".pwc-tile--quantity")) || null,
        preco: lerNumero(info.price),
        precoAntigo: antigo ? lerNumero(texto(antigo).replace(/pvpr/i, "")) : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        url: absoluto(base, link?.getAttribute("href")),
        imagem: img?.getAttribute("data-src") || img?.getAttribute("src") || null,
        categoria: info.category || null,
      };
    });
  },
};

/* ── Pingo Doce ── */
export const pingoDoce = {
  id: "pingo-doce",
  nome: "Pingo Doce",
  async pesquisar(q) {
    const base = "https://www.pingodoce.pt";
    const html = await buscar(`${base}/on/demandware.store/Sites-pingo-doce-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}&start=0&sz=${N}`);
    return parse(html).querySelectorAll(".product-tile-pd").map((t) => {
      const gtm = jsonAtributo(t, "data-gtm-info")?.items?.[0] || {};
      const link = t.querySelector(".product-name-link a");
      const vendaEl = t.querySelector(".product-price .sales");
      const venda = texto(vendaEl);
      const preco = lerNumero(vendaEl?.querySelector(".value")?.getAttribute("content")) ?? lerNumero(gtm.price);
      const antigo = lerNumero(t.querySelector(".product-price .strike-through .value")?.getAttribute("content"));
      // Fruta e afins: o preço afixado JÁ é por kg ("1,49 €/Kg").
      // Embalados: "1 L | 0,85 €/L" na linha da quantidade.
      const linhaUnid = texto(t.querySelector(".product-unit"));
      const [quantidade, porUnid] = linhaUnid.split("|").map((s) => s.trim());
      let unid = lerPrecoUnidade(porUnid);
      if (!unid && /\/\s*kg/i.test(venda)) unid = { valor: preco, unidade: "kg" };
      const img = t.querySelector("img.product-tile-component-image");
      return {
        id: String(gtm.item_id || t.getAttribute("data-pid") || ""),
        nome: texto(link) || gtm.item_name,
        marca: texto(t.querySelector(".product-brand-name")) || gtm.item_brand || null,
        quantidade: quantidade || null,
        preco,
        precoAntigo: antigo && antigo > preco ? antigo : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        promo: texto(t.querySelector(".promo-message")) || null,
        url: absoluto(base, link?.getAttribute("href")),
        imagem: img?.getAttribute("src") || null,
        categoria: gtm.item_category || null,
      };
    });
  },
};

/* ── Auchan ── */
export const auchan = {
  id: "auchan",
  nome: "Auchan",
  async pesquisar(q) {
    const base = "https://www.auchan.pt";
    const html = await buscar(`${base}/on/demandware.store/Sites-AuchanPT-Site/pt_PT/Search-UpdateGrid?q=${encodeURIComponent(q)}&start=0&sz=${N}`);
    return parse(html).querySelectorAll(".auc-product-tile").map((t) => {
      const gtm = jsonAtributo(t, "data-gtm") || {};
      const urls = jsonAtributo(t, "data-urls") || {};
      const vendaEl = t.querySelector(".auc-product-tile__prices .sales") || t.querySelector(".sales");
      const preco = lerNumero(vendaEl?.querySelector(".value")?.getAttribute("content")) ?? lerNumero(gtm.price);
      const antigo = lerNumero(t.querySelector(".strike-through .value")?.getAttribute("content"));
      // Fruta ao peso: o preço grande é por kg ("1,69 € /Kg") e o
      // "por unidade" é o de UMA peça — o que interessa é o por kg.
      let unid = /\/\s*kg/i.test(texto(vendaEl))
        ? { valor: preco, unidade: "kg" }
        : lerPrecoUnidade(texto(t.querySelector(".auc-measures--price-per-unit")));
      const img = t.querySelector(".auc-product-tile__image-container img");
      const nome = texto(t.querySelector(".pdp-link a")) || gtm.name || "";
      return {
        id: String(gtm.id || t.getAttribute("data-pid") || ""),
        // A Auchan escreve tudo em minúsculas; capitalizar só a 1.ª letra.
        nome: nome.charAt(0).toUpperCase() + nome.slice(1),
        marca: gtm.brand || null,
        quantidade: null,
        preco,
        precoAntigo: antigo && antigo > preco ? antigo : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        url: urls.absoluteProductUrl || absoluto(base, t.querySelector(".pdp-link a")?.getAttribute("href")),
        imagem: img?.getAttribute("data-src") || img?.getAttribute("src") || null,
        categoria: gtm.category || null,
      };
    });
  },
};
