/*
 * Código de barras → nome para pesquisar no comparador.
 *
 * As lojas online não pesquisam por código de barras, mas pesquisam por
 * nome. O código traduz-se no nome do produto pela Open Food Facts (base
 * aberta e gratuita, chamada a partir do browser; só o código lá chega).
 * O nome de lá é comprido ("Leite UHT Meio Gordo Mimosa 1 L") e a nossa
 * pesquisa funciona melhor com o essencial ("leite uht meio gordo"): por
 * isso tira-se a marca, as quantidades e o excesso de palavras.
 */
export const FORMATOS = ["ean_13", "ean_8", "upc_a", "upc_e"];

export function codigoValido(c) {
  return /^\d{8}$|^\d{12,13}$/.test(String(c || ""));
}

export function urlOpenFoodFacts(codigo) {
  return `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=product_name_pt,product_name,generic_name_pt,brands`;
}

const MAX_PALAVRAS = 4;

/* O que se pesquisa a partir da resposta da Open Food Facts. null se não houver nome. */
export function nomeParaPesquisa(produto) {
  const bruto = produto?.product_name_pt || produto?.product_name || produto?.generic_name_pt || "";
  if (!bruto.trim()) return null;
  const marcas = String(produto?.brands || "").split(",").map(m => m.trim().toLowerCase()).filter(Boolean);
  let t = bruto.toLowerCase()
    .replace(/\d+([.,]\d+)?\s*(x\s*\d+([.,]\d+)?\s*)?(kg|g|gr|mg|l|lt|cl|ml|un|uni|unid)\b\.?/g, " ") // quantidades
    .replace(/[^\p{L}\p{N}\s-]/gu, " ");
  for (const m of marcas) t = t.split(m).join(" ");
  const palavras = t.split(/\s+/).filter(p => p.length > 1).slice(0, MAX_PALAVRAS);
  return palavras.length ? palavras.join(" ") : null;
}
