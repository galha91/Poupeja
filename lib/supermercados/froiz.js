import { buscar, extras, lerNumero, arred } from "./comum.js"; // com .js: os testes correm em node sem bundler

/*
 * Froiz. A pesquisa da loja online é a da Empathy, a mesma que o site usa
 * para qualquer visitante: devolve os artigos (nome, embalagem, unidade
 * de medida), mas não o preço. O preço está na página pública de cada
 * produto, que se abre sem código postal. Por isso: pesquisa → os
 * primeiros artigos → a página de cada um, em paralelo e com prazo; os
 * que não chegarem a tempo ficam de fora.
 */

const LOJA = "https://loja.froiz.com";
const PESQUISA = "https://api.empathy.co/search/v1/query/froiz/search";
const N_PAGINAS = 8; // páginas de produto por pesquisa (cada uma pesa ~650 kB)

const UNIDADES = { litro: "l", litros: "l", kilo: "kg", kilogramo: "kg", quilo: "kg", unidade: "un", unidad: "un" };

/* Bloco do preço na página do produto: o riscado (se houver) e o atual. */
export function lerPrecoFroiz(html) {
  const i = html.indexOf('class="product-data"');
  if (i < 0) return null;
  const bloco = (html.slice(i, i + 6000).match(/<div class="price"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
  if (!bloco) return null;
  const antigo = lerNumero((bloco.match(/line-through[^>]*>([^<]+)</) || [])[1]);
  const valores = [...bloco.replace(/<span[^>]*line-through[^>]*>[^<]*<\/span>/, "").matchAll(/(\d+(?:[.,]\d+)?)&nbsp;€/g)].map((m) => lerNumero(m[1]));
  const preco = valores[0];
  if (!(preco > 0)) return null;
  const periodo = (html.slice(i, i + 3000).match(/Promoção válida:\s*([\d-]+)\s*até\s*([\d-]+)/) || []);
  return { preco, precoAntigo: antigo > preco ? antigo : null, periodo: periodo[1] ? `${periodo[1].slice(0, 5).replace("-", "/")} a ${periodo[2].slice(0, 5).replace("-", "/")}` : null };
}

/* Artigo da Empathy + preço da página → o formato comum dos adaptadores. */
export function juntarFroiz(a, p) {
  const aoPeso = !!a.fractional || /\bkg$/i.test(a.name || "");
  const unidade = aoPeso ? "kg" : UNIDADES[String(a.measurementUnit || "").toLowerCase()] || null;
  const ratio = Number(a.measurementUnitRatio) || null;
  return {
    id: String(a.id),
    nome: a.name,
    marca: null,
    quantidade: null,
    aoPeso,
    preco: p.preco,
    precoAntigo: p.precoAntigo,
    precoUnidade: aoPeso ? p.preco : unidade && ratio ? arred(p.preco / ratio) : null,
    unidade: aoPeso || ratio ? unidade : null,
    promo: p.precoAntigo ? a.offerDescription || "Promoção" : null,
    periodo: p.periodo,
    url: `${LOJA}/product/${a.slug}`,
    imagem: a.imageUrl || null,
  };
}

export const froiz = {
  id: "froiz",
  nome: "Froiz",
  async pesquisar(q) {
    const dados = await buscar(`${PESQUISA}?query=${encodeURIComponent(q)}&lang=pt&scope=desktop&rows=${N_PAGINAS}&start=0`, { json: true });
    const artigos = dados?.catalog?.content;
    if (!Array.isArray(artigos)) throw new Error("resposta da Froiz sem lista de artigos");
    // As páginas chegam em paralelo; 5 s chega para a maior parte.
    const comPreco = await extras(artigos.filter((a) => a?.slug).map(async (a) => {
      const p = lerPrecoFroiz(await buscar(`${LOJA}/product/${a.slug}`));
      return p ? juntarFroiz(a, p) : null;
    }), 5000);
    return comPreco;
  },
};
