import { parse } from "node-html-parser";
import { buscar, lerNumero, lerPrecoUnidade, absoluto, partirPorProduto, capitalizar } from "./comum";

/*
 * Continente, Pingo Doce e Auchan correm todos em Salesforce Commerce Cloud.
 * O Search-UpdateGrid é o pedido que a própria página de pesquisa faz para
 * carregar mais resultados: devolve só a grelha de produtos, sem o resto do
 * site — mais leve para eles e para nós. Os preços são os da loja online,
 * que são os de referência nacional de cada cadeia.
 */

// Resultados por loja. Pesquisas largas ("leite", "queijo", "iogurte")
// têm centenas de artigos, e o mais barato por kg nem sempre vem no topo
// da relevância da loja — com 48 ficavam de fora marcas e formatos (packs
// de 6, 3 L) que eram a melhor compra. O Pingo Doce e o Auchan servem 96
// de uma vez em < 1 s.
const N = 96;
// O Continente ignora o "sz" e serve sempre 35 por página: vão-se buscar
// as seguintes em paralelo, até 3 páginas (~105 artigos).
const PAGINA_CONTINENTE = 35;
const PAGINAS_CONTINENTE = 3;

function jsonAtributo(el, nome) {
  const v = el?.getAttribute(nome);
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

// "LEITE UHT AUCHAN MEIO GORDO 6X1L" → "6x1 L"; "… 250G" → "250 g".
function quantidadeDoNome(nome) {
  // O "(?<![-+\d.,])" ignora pesos de uma gama ("fraldas 2-5kg", "+17kg"):
  // é o peso do bebé, não o da embalagem.
  const m = String(nome).match(/(?<![-+\d.,])(\d+\s*x\s*)?\d+(?:[.,]\d+)?\s*(kg|gr|g|lt|l|cl|ml)\b/i)
    || String(nome).match(/\d+\s*(un|unid|rolos|doses)\b/i);
  return m ? m[0].toLowerCase().replace(/(\d)\s*(kg|gr|g|lt|l|cl|ml|un|unid|rolos|doses)\b/, "$1 $2").replace(/ l$/, " L") : null;
}

// Pingo Doce: "0.05 Kg" → "50 g", "0.75 L" → "750 ml", "12 Un" → "12 un".
function arrumarQuantidade(q) {
  if (!q) return null;
  const m = q.match(/^(\d+(?:[.,]\d+)?)\s*(kg|l)$/i);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    const kg = m[2].toLowerCase() === "kg";
    if (n < 1) return `${Math.round(n * 1000)} ${kg ? "g" : "ml"}`;
    return `${String(n).replace(".", ",")} ${kg ? "kg" : "L"}`;
  }
  return q.replace(/\bUn\b/, "un").replace(/\bDos\b/, "doses");
}

const texto = (el) => (el?.text || "").replace(/\s+/g, " ").trim();

// Cada produto é lido à parte (ver partirPorProduto). As pesquisas correm
// sobre o bocado inteiro e não sobre o elemento do cartão: se o HTML fechar
// o cartão antes do tempo, o preço fica "fora" dele mas continua no bocado.
// Os atributos (data-gtm & c.) vêm do elemento do cartão.
function cartoes(html, marcaInicio, seletor) {
  return partirPorProduto(html, marcaInicio).map((bocado) => {
    const raiz = parse(bocado);
    const cartao = raiz.querySelector(seletor);
    if (!cartao) return null;
    return {
      querySelector: (s) => raiz.querySelector(s),
      getAttribute: (n) => cartao.getAttribute(n),
    };
  }).filter(Boolean);
}

/* ── Continente ── */
export const continente = {
  id: "continente",
  nome: "Continente",
  async pesquisar(q) {
    const base = "https://www.continente.pt";
    const pagina = (inicio) => buscar(`${base}/on/demandware.store/Sites-continente-Site/default/Search-UpdateGrid?q=${encodeURIComponent(q)}&start=${inicio}&sz=${PAGINA_CONTINENTE}`);
    const primeira = await pagina(0);
    const total = Number(primeira.match(/data-total-count="(\d+)"/)?.[1]) || 0;
    const resto = [];
    for (let i = 1; i < PAGINAS_CONTINENTE && i * PAGINA_CONTINENTE < total; i++) resto.push(pagina(i * PAGINA_CONTINENTE));
    // Uma página seguinte que falhe não estraga a primeira.
    const seguintes = (await Promise.allSettled(resto)).filter((r) => r.status === "fulfilled").map((r) => r.value);
    const marca = '<div class="product-tile col-product-tile';
    const vistos = new Set();
    return [primeira, ...seguintes].flatMap((html) => cartoes(html, marca, ".product-tile")).filter((t) => {
      const id = jsonAtributo(t, "data-product-tile-impression")?.id;
      if (!id) return true;
      if (vistos.has(id)) return false;
      vistos.add(id);
      return true;
    }).map((t) => {
      const info = jsonAtributo(t, "data-product-tile-impression") || {};
      const link = t.querySelector(".ct-pdp-link a") || t.querySelector("a.image-link");
      const rotulo = texto(t.querySelector(".pwc-tile--price-secondary"));
      const quantidade = texto(t.querySelector(".pwc-tile--quantity"));
      let unid = lerPrecoUnidade(rotulo);
      // Vendido ao peso ("Quant. Mínima = 400 g", "emb. 680 gr (aprox.)"):
      // o preço grande é o do kg e o "€/un" ao lado é o de uma peça ou
      // embalagem. Lido ao contrário, uma melancia a 1,29 €/kg saía 7,40 €/un.
      const aoPeso = unid?.unidade === "un" && /quant\.?\s*m[ií]nima|aprox/i.test(quantidade);
      const precoPeca = aoPeso ? unid.valor : null;
      if (aoPeso) unid = { valor: lerNumero(info.price), unidade: "kg" };
      const antigo = t.querySelector(".prices-wrapper .list:not(.d-none)");
      const img = t.querySelector("img.ct-tile-image");
      return {
        id: String(info.id || ""),
        nome: capitalizar(texto(t.querySelector(".pwc-tile--description")) || info.name),
        marca: info.brand || null,
        quantidade: aoPeso ? null : quantidade || null,
        preco: lerNumero(info.price),
        aoPeso,
        precoPeca,
        precoAntigo: antigo ? lerNumero(texto(antigo).replace(/pvpr/i, "")) : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        rotuloUnidade: rotulo || null,
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
    return cartoes(html, '<div class="product-tile-pd', ".product-tile-pd").map((t) => {
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
      // Fruta, talho, peixe: o preço afixado é o do kg e a "quantidade"
      // é o peso médio de uma peça (0,28 kg numa laranja).
      const aoPeso = !unid && /\/\s*kg/i.test(venda);
      if (aoPeso) unid = { valor: preco, unidade: "kg" };
      const pesoPeca = aoPeso ? lerNumero(quantidade) : null;
      const img = t.querySelector("img.product-tile-component-image");
      return {
        id: String(gtm.item_id || t.getAttribute("data-pid") || ""),
        nome: capitalizar(texto(link) || gtm.item_name),
        marca: texto(t.querySelector(".product-brand-name")) || gtm.item_brand || null,
        quantidade: aoPeso ? null : arrumarQuantidade(quantidade),
        preco,
        aoPeso,
        precoPeca: pesoPeca ? Math.round(preco * pesoPeca * 100) / 100 : null,
        precoAntigo: antigo && antigo > preco ? antigo : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        rotuloUnidade: porUnid || venda || null,
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
    return cartoes(html, '<div class="product-tile auc-product-tile', ".auc-product-tile").map((t) => {
      const gtm = jsonAtributo(t, "data-gtm") || {};
      const urls = jsonAtributo(t, "data-urls") || {};
      const vendaEl = t.querySelector(".auc-product-tile__prices .sales") || t.querySelector(".sales");
      const preco = lerNumero(vendaEl?.querySelector(".value")?.getAttribute("content")) ?? lerNumero(gtm.price);
      const antigo = lerNumero(t.querySelector(".strike-through .value")?.getAttribute("content"));
      // Fruta ao peso: o preço grande é por kg ("1,69 € /Kg") e o
      // "por unidade" é o de UMA peça — o que interessa é o por kg.
      const rotulo = texto(t.querySelector(".auc-measures--price-per-unit"));
      const aoPeso = /\/\s*kg/i.test(texto(vendaEl));
      // Ao peso, o "por unidade" ao lado é o de uma peça ou embalagem.
      const unid = aoPeso ? { valor: preco, unidade: "kg" } : lerPrecoUnidade(rotulo);
      const img = t.querySelector(".auc-product-tile__image-container img");
      return {
        id: String(gtm.id || t.getAttribute("data-pid") || ""),
        // A Auchan escreve os nomes em minúsculas ou em maiúsculas.
        nome: capitalizar(texto(t.querySelector(".pdp-link a")) || gtm.name),
        marca: gtm.brand || null,
        // A Auchan põe a embalagem no nome ("… 6x1l", "… 250g").
        quantidade: aoPeso ? null : quantidadeDoNome(gtm.name || ""),
        preco,
        aoPeso,
        precoPeca: aoPeso ? lerNumero(rotulo) : null,
        precoAntigo: antigo && antigo > preco ? antigo : null,
        precoUnidade: unid?.valor ?? null,
        unidade: unid?.unidade ?? null,
        rotuloUnidade: [rotulo, texto(vendaEl)].filter(Boolean).join(" | ") || null,
        url: urls.absoluteProductUrl || absoluto(base, t.querySelector(".pdp-link a")?.getAttribute("href")),
        imagem: img?.getAttribute("data-src") || img?.getAttribute("src") || null,
        categoria: gtm.category || null,
      };
    });
  },
};
