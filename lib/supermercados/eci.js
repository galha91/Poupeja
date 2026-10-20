import { lerNumero, lerPrecoUnidade, absoluto } from "./comum.js"; // com .js: os testes correm em node sem bundler

/*
 * El Corte Inglés — supermercado online.
 *
 * A pesquisa do site carrega os resultados no browser, por uma API que o
 * robots.txt deles proíbe (/api e /*\/search). As páginas de secção e de
 * categoria (/supermercado/…) são permitidas e trazem tudo no HTML: 24
 * artigos por página, com preço, €/kg ou €/L, promoção e embalagem. Por
 * isso o catálogo é lido de noite, secção a secção (ver
 * /api/cron-catalogo-eci), e a pesquisa do PoupeJá procura na cópia
 * guardada (tabela catalogo_precos) — não no site, no momento.
 */

export const BASE_ECI = "https://www.elcorteingles.pt";

// As secções do supermercado. Cada uma lista todos os artigos das suas
// categorias; um artigo em duas secções fica uma vez (chave = id).
export const SECOES_ECI = [
  "frescos", "mercearia", "lacticinios-e-ovos", "bebidas", "congelados", "pratos-preparados",
  "limpeza-e-menage", "cuidado-pessoal", "bebe", "animais", "nutricao-e-bem-estar",
];

export const urlPaginaEci = (seccao, n) => `${BASE_ECI}/supermercado/${seccao}/${n > 1 ? `${n}/` : ""}`;

const texto = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim();
// O conteúdo de um elemento pela classe. Alguns trazem spans lá dentro
// ("embalagem <span>|</span> 1 L"), por isso aceita-os antes do fecho.
const campo = (html, classe, tag = "(?:div|span)") =>
  (html.match(new RegExp(`class="${classe}"[^>]*>((?:[^<]|<span[^>]*>[^<]*</span>)*)</${tag}>`)) || [])[1];

/* Uma página de secção → { produtos, totalPaginas }. */
export function lerPaginaEci(html) {
  const totalPaginas = Number((html.match(/data-lr-total-pages="(\d+)"/) || [])[1]) || null;
  const produtos = html.split('<li id="item-').slice(1).map((c) => {
    const link = c.match(/class="food-product-preview-responsive__description" href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!link) return null;
    const id = (link[1].match(/\/supermercado\/(B?\d{8,})/) || [])[1];
    const oferta = lerNumero(texto(campo(c, "food-prices__offer")));
    const normal = lerNumero(texto(campo(c, "food-prices__price")));
    const original = lerNumero(texto(campo(c, "food-prices__price--original")));
    const preco = oferta ?? normal;
    if (!id || !(preco > 0)) return null;
    const venda = texto(campo(c, "food-product-preview-responsive__sale_type"));
    const unid = lerPrecoUnidade(texto(campo(c, "food-prices__measurement-unit")).replace(/[()]/g, ""));
    const aoPeso = /\bpeso\b|granel/i.test(venda);
    return {
      id,
      nome: texto(link[2]),
      preco,
      precoAntigo: original > preco ? original : null,
      precoUnidade: unid?.valor ?? null,
      unidade: unid?.unidade ?? null,
      quantidade: venda.includes("|") ? venda.split("|").pop().trim() : null,
      aoPeso,
      url: absoluto(BASE_ECI, link[1]),
      imagem: (c.match(/<img src="([^"]+)"/) || [])[1] || null,
    };
  }).filter(Boolean);
  return { produtos, totalPaginas };
}

/*
 * Onde continuar depois de ler uma página: a seguinte da mesma secção ou a
 * primeira da secção seguinte. Sem mais secções → concluido.
 */
export function proximaPaginaEci({ seccao, pagina }, totalPaginas, vazia) {
  if (!vazia && totalPaginas && pagina < totalPaginas) return { seccao, pagina: pagina + 1, concluido: false };
  const seguinte = seccao + 1;
  return { seccao: seguinte, pagina: 1, concluido: seguinte >= SECOES_ECI.length };
}
