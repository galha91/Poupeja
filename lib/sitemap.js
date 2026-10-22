import { LOJAS_SLUGS, RECEITAS_SLUGS } from "./seo-slugs";
import { listarMunicipios, frescuraDosPrecos, marcasCombustivel, DISTRITOS_SLUGS } from "./municipios";
import { TIPOS_PAGINA } from "./combustivelTipo";
import dadosApoios from "../public/apoios.json";
import dadosPrazos from "../data/prazos-estado.json";
import { slugApoio, slugPrazo } from "./seoEstado";
import { resumosRecentes } from "./seoPrecosDados";
import { CATEGORIAS_SEO, LOJAS_SEO, PARES, comComparacao, compararPar, hojeLisboa } from "./seoPrecos";
import { gruposMarca } from "./seoMarcasDados";
import { ofertasProduto, porMarca } from "./seoMarcas";
import { VERIFICADO_GARANTIAS } from "./seoGarantias";
import { VERIFICADO_DEVOLUCOES } from "./seoDevolucoes";
import { VERIFICADO_TARIFA_SOCIAL } from "./seoTarifaSocial";
import { VERIFICADO_IRS } from "./irs";
import { VERIFICADO_SALARIO } from "./salario";
import { VERIFICADO_ABONO } from "./abono";
import { VERIFICADO_DESEMPREGO } from "./desemprego";
import { VERIFICADO_IMT } from "./imt";
import { VERIFICADO_RECIBOS } from "./recibosVerdes";

/*
 * Todas as páginas que entram no sitemap, com o <lastmod> REAL de cada uma
 * (ou nenhum). Fonte única para o sitemap.xml e para o aviso IndexNow.
 *
 * Só entram páginas indexáveis: as de preços sem dados suficientes saem
 * com noindex e também ficam fora daqui.
 */

// Só os concelhos com mais postos entram no mapa: dezenas de páginas parecidas
// de uma vez levam o Google a ignorá-las todas (273 de 280 ficaram por indexar).
// As outras continuam a existir e a ter link a partir de /combustiveis.
export const MAX_CONCELHOS_NO_MAPA = 40;

// O limite do protocolo é 50 000 URLs por ficheiro; acima disso, índice de sitemaps.
export const MAX_URLS_POR_SITEMAP = 50000;

const FIXAS = [
  { path: "/",             changefreq: "daily",   priority: "1.0" },
  { path: "/combustiveis", changefreq: "daily",   priority: "0.9" },
  { path: "/combustiveis/esta-semana", changefreq: "daily", priority: "0.85" },
  { path: "/folhetos",     changefreq: "weekly",  priority: "0.9" },
  { path: "/receitas",     changefreq: "weekly",  priority: "0.9" },
  { path: "/apoios",       changefreq: "monthly", priority: "0.8" },
  { path: "/fontes",       changefreq: "yearly",  priority: "0.4" },
  { path: "/instalar",     changefreq: "monthly", priority: "0.8" },
  { path: "/privacidade",  changefreq: "yearly",  priority: "0.3" },
  ...LOJAS_SLUGS.map(l   => ({ path: `/folhetos/${l.slug}`,  changefreq: "weekly",  priority: "0.8" })),
  ...RECEITAS_SLUGS.map(r => ({ path: `/receitas/${r.slug}`, changefreq: "monthly", priority: "0.7" })),
  // Apoios e prazos: lastmod = quando os dados foram revistos contra a fonte.
  ...(dadosApoios.apoios || []).map(a => ({ path: `/apoios/${slugApoio(a)}`, changefreq: "monthly", priority: "0.7", lastmod: (dadosApoios.atualizado || "").slice(0, 10) || undefined })),
  { path: "/prazos", changefreq: "weekly", priority: "0.75" },
  { path: "/euribor", changefreq: "weekly", priority: "0.85" },
  { path: "/euribor/3-meses", changefreq: "weekly", priority: "0.8" },
  { path: "/euribor/6-meses", changefreq: "weekly", priority: "0.8" },
  { path: "/euribor/12-meses", changefreq: "weekly", priority: "0.8" },
  { path: "/credito-habitacao", changefreq: "weekly", priority: "0.8" },
  { path: "/garantias", changefreq: "monthly", priority: "0.8", lastmod: VERIFICADO_GARANTIAS },
  { path: "/devolucoes", changefreq: "monthly", priority: "0.8", lastmod: VERIFICADO_DEVOLUCOES },
  { path: "/tarifa-social", changefreq: "monthly", priority: "0.85", lastmod: VERIFICADO_TARIFA_SOCIAL },
  { path: "/reduflacao", changefreq: "weekly", priority: "0.8" },
  { path: "/irs", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_IRS },
  { path: "/salario-liquido", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_SALARIO },
  { path: "/abono-de-familia", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_ABONO },
  { path: "/subsidio-desemprego", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_DESEMPREGO },
  { path: "/imt", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_IMT },
  { path: "/recibos-verdes", changefreq: "monthly", priority: "0.9", lastmod: VERIFICADO_RECIBOS },
  { path: "/ferramentas", changefreq: "monthly", priority: "0.7" },
  ...dadosPrazos.prazos.map(p => ({ path: `/prazos/${slugPrazo(p)}`, changefreq: "monthly", priority: "0.7", lastmod: p.verificado })),
];

const maisRecente = (lista) => lista.reduce((m, a) => (a && a > m ? a : m), "") || null;

/* As páginas de preços (/precos, /comparar) que têm dados para o Google. */
export async function paginasPrecos() {
  const resumos = await resumosRecentes(hojeLisboa());
  const artigos = comComparacao(resumos);
  if (!artigos.length) return [];
  const geral = maisRecente(artigos.map(a => a.atualizado));
  const out = [
    { path: "/precos", changefreq: "daily", priority: "0.9", lastmod: geral },
    { path: "/comparar", changefreq: "daily", priority: "0.85", lastmod: geral },
  ];
  for (const c of CATEGORIAS_SEO) {
    const da = artigos.filter(a => a.categoria === c.slug);
    if (da.length >= 3) out.push({ path: `/precos/categoria/${c.slug}`, changefreq: "daily", priority: "0.75", lastmod: maisRecente(da.map(a => a.atualizado)) });
  }
  for (const l of LOJAS_SEO) {
    const da = artigos.filter(a => a.ofertas.some(o => o.loja === l.id));
    if (da.length >= 10) out.push({ path: `/precos/loja/${l.slug}`, changefreq: "daily", priority: "0.75", lastmod: maisRecente(da.map(a => a.atualizado)) });
  }
  for (const a of artigos) out.push({ path: `/precos/${a.slug}`, changefreq: "daily", priority: "0.7", lastmod: a.atualizado });
  const porSlug = new Map(artigos.map(a => [a.slug, a]));
  for (const p of PARES) {
    const r = compararPar(p, artigos);
    if (r.indexavel) out.push({ path: `/comparar/${p.slug}`, changefreq: "daily", priority: "0.75", lastmod: maisRecente(r.linhas.map(l => porSlug.get(l.slug)?.atualizado)) });
  }
  return out;
}

/* Produtos de marca em ≥ 2 cadeias, as marcas com ≥ 2 desses, e /marcas. */
export async function paginasMarcas() {
  const hoje = hojeLisboa();
  const grupos = await gruposMarca(hoje);
  const out = [];
  const porSlug = new Map();
  for (const g of grupos) {
    const d = ofertasProduto(g, hoje);
    if (d.indexavel) { out.push({ path: `/produto/${g.slug}`, changefreq: "daily", priority: "0.6", lastmod: d.atualizado }); porSlug.set(g.slug, d); }
  }
  const marcas = porMarca(grupos)
    .map((m) => ({ m, ds: m.grupos.map((g) => porSlug.get(g.slug)).filter(Boolean) }))
    .filter(({ ds }) => ds.length >= 2);
  for (const { m, ds } of marcas) out.push({ path: `/marca/${m.slug}`, changefreq: "daily", priority: "0.65", lastmod: maisRecente(ds.map((d) => d.atualizado)) });
  if (marcas.length >= 3) out.push({ path: "/marcas", changefreq: "daily", priority: "0.75", lastmod: maisRecente(out.map((p) => p.lastmod)) });
  return out;
}

export async function todasAsPaginas() {
  // <lastmod> nas páginas de combustível com a data REAL da última consulta
  // à DGEG; nas fixas fica de fora — uma data inventada ("hoje", sempre)
  // ensina o Google a ignorar o campo no site inteiro.
  let lastmod = null;
  try {
    const f = await frescuraDosPrecos();
    const ref = f?.obtidoEm ?? f?.dataPreco;
    if (ref) lastmod = new Date(ref).toISOString().slice(0, 10);
  } catch {}
  // Se a DGEG estiver em baixo, sai o sitemap sem concelhos em vez de sair
  // um sitemap cheio de URLs que respondem 404.
  let concelhos = [];
  try {
    concelhos = (await listarMunicipios()).slice(0, MAX_CONCELHOS_NO_MAPA).map(m => ({
      path: `/combustiveis/${m.slug}`, changefreq: "daily", priority: "0.8", lastmod,
    }));
  } catch {}
  const fixas = FIXAS.map(p => p.path.startsWith("/combustiveis") ? { ...p, lastmod } : p);
  // Os 18 distritos entram todos: são poucos, cada um diferente, e ligam
  // a todos os concelhos — incluindo os que não cabem no mapa.
  const distritos = DISTRITOS_SLUGS.map(d => ({ path: `/combustiveis/distrito/${d.slug}`, changefreq: "daily", priority: "0.85", lastmod }));
  const tipos = lastmod ? TIPOS_PAGINA.map(t => ({ path: `/combustiveis/${t.slug}`, changefreq: "daily", priority: "0.85", lastmod })) : [];
  const marcasComb = lastmod
    ? (await marcasCombustivel().catch(() => [])).map(m => ({ path: `/combustiveis/marca/${m.slug}`, changefreq: "daily", priority: "0.8", lastmod }))
    : [];
  const [precos, marcas] = await Promise.all([paginasPrecos().catch(() => []), paginasMarcas().catch(() => [])]);
  return [...fixas, ...tipos, ...marcasComb, ...distritos, ...concelhos, ...precos, ...marcas];
}

export function xmlUrls(urlSite, paginas) {
  const urls = paginas.map(p => `  <url>
    <loc>${urlSite}${p.path}</loc>${p.lastmod ? `
    <lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function xmlIndice(urlSite, n) {
  const itens = Array.from({ length: n }, (_, i) => `  <sitemap>
    <loc>${urlSite}/sitemaps/${i + 1}</loc>
  </sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${itens}
</sitemapindex>`;
}

export const partes = (paginas, max = MAX_URLS_POR_SITEMAP) => Math.max(1, Math.ceil(paginas.length / max));
export const parte = (paginas, n, max = MAX_URLS_POR_SITEMAP) => paginas.slice((n - 1) * max, n * max);
