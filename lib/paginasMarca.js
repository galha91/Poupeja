import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { ofertasProduto, serieProduto, frasesProduto, metaProduto } from "./seoMarcas.js";
import { ARTIGOS_SEO, normalizarQ } from "./seoPrecos.js";

/*
 * Páginas /produto/[slug] e /marca/[marca] pré-calculadas.
 *
 * Eram o maior gasto de CPU da Vercel (55% das invocações, ~236 ms cada):
 * cada geração descarregava ~16 600 produtos e agrupava-os todos para
 * mostrar um. Agora o GitHub Actions calcula todas uma vez por dia
 * (pages/api/cron-paginas-marca, lib/paginasMarcaGerar) e guarda as props
 * prontas na tabela paginas_marca. A página só lê uma linha.
 *
 * Se a tabela não existir, estiver vazia ou velha (o cron falhou dias
 * seguidos), lerPaginaMarca devolve "sem-cache" e a página volta ao
 * cálculo antigo: nunca fica sem resposta por causa disto.
 */

export const TABELA = "paginas_marca";
// Mais de 3 dias sem gerar: algo correu mal, volta-se ao cálculo em direto.
export const VALIDADE_MS = 3 * 24 * 60 * 60 * 1000;
const SLUG_VALIDO = /^[a-z0-9-]{1,120}$/;

/* Props da página de um produto. Mesmas regras que a página tinha. */
export function propsProduto(g, grupos, dias, resumos, hoje) {
  const dados = ofertasProduto(g, hoje);
  const grupo = { slug: g.slug, nome: g.nome, marca: g.marca, marcaSlug: g.marcaSlug, q: g.q, unidade: g.unidade };

  // O artigo genérico desta pesquisa, se for do catálogo (leite meio gordo, azeite…).
  const art = ARTIGOS_SEO.find((a) => a.q === normalizarQ(g.q));
  const r = art ? resumos.get(art.slug) : null;
  const generico = art ? {
    slug: art.slug, nome: art.nomeCurto,
    vencedor: r?.indexavel ? { lojaNome: r.ofertas[0].lojaNome, valorTxt: `${r.ofertas[0].valor.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${r.unidade && r.unidade !== "embalagem" ? `/${r.unidade}` : ""}` } : null,
  } : null;

  const outros = grupos
    .filter((x) => x.marcaSlug === g.marcaSlug && x.slug !== g.slug)
    .map((x) => ({ x, d: ofertasProduto(x, hoje) }))
    .filter(({ d }) => d.ofertas.length)
    .sort((a, b) => b.d.ofertas.length - a.d.ofertas.length)
    .slice(0, 8)
    .map(({ x, d }) => ({
      slug: x.slug, nome: x.nome, unidade: "embalagem", href: `/produto/${x.slug}`,
      contexto: `${d.ofertas.length} cadeia${d.ofertas.length > 1 ? "s" : ""} · mais barato no ${d.ofertas[0].lojaNome}`,
      vencedor: { lojaNome: d.ofertas[0].lojaNome, valor: d.ofertas[0].preco },
    }));

  return JSON.parse(JSON.stringify({
    grupo, dados, serie: serieProduto(g, dias), frases: frasesProduto(g, dados, hoje), meta: metaProduto(g, dados), generico, outros,
  }));
}

/* Props da página de uma marca, ou null se não tiver produtos com preço. */
export function propsMarca(m, marcas, hoje) {
  const produtos = m.grupos
    .map((g) => ({ g, d: ofertasProduto(g, hoje) }))
    .filter(({ d }) => d.ofertas.length)
    .sort((a, b) => b.d.ofertas.length - a.d.ofertas.length || a.g.nome.localeCompare(b.g.nome, "pt"));
  if (!produtos.length) return null;
  const lojas = [...new Set(produtos.flatMap(({ d }) => d.ofertas.map((o) => o.lojaNome)))];
  return JSON.parse(JSON.stringify({
    marca: { slug: m.slug, nome: m.nome },
    produtos: produtos.map(({ g, d }) => ({
      slug: g.slug, nome: g.nome, href: `/produto/${g.slug}`, unidade: "embalagem", n: d.ofertas.length,
      contexto: `${d.ofertas.length} cadeia${d.ofertas.length > 1 ? "s" : ""} · mais barato no ${d.ofertas[0].lojaNome}`,
      vencedor: { lojaNome: d.ofertas[0].lojaNome, valor: d.ofertas[0].preco },
    })),
    lojas,
    atualizado: produtos.reduce((x, { d }) => (d.atualizado > x ? d.atualizado : x), "") || null,
    indexavel: produtos.filter(({ d }) => d.indexavel).length >= 2,
    outras: marcas.filter((x) => x.slug !== m.slug).slice(0, 12).map((x) => ({ slug: x.slug, nome: x.nome })),
  }));
}

/* Impressão digital de uma linha: só se reescreve o que mudou. */
export function hashLinha(linha) {
  return createHash("sha1").update(JSON.stringify([linha.props, linha.indexavel, linha.atualizado])).digest("hex");
}

export function cacheValida(meta, agora = Date.now()) {
  const t = Date.parse(meta?.props?.geradoEm || "");
  return Number.isFinite(t) && agora - t < VALIDADE_MS;
}

/*
 * { estado: "ok", props } | { estado: "nao-existe" } | { estado: "sem-cache" }
 * "nao-existe" só quando a cache é recente: aí um slug que não está lá não
 * tem página (404), sem gastar CPU a recalcular o catálogo para o confirmar.
 */
export async function lerPaginaMarca(tipo, slug) {
  if (!SLUG_VALIDO.test(String(slug || ""))) return { estado: "nao-existe" };
  const admin = getSupabaseAdmin();
  if (!admin) return { estado: "sem-cache" };
  try {
    const { data, error } = await admin.from(TABELA).select("tipo, slug, props")
      .or(`and(tipo.eq.${tipo},slug.eq.${slug}),and(tipo.eq.meta,slug.eq.estado)`);
    if (error || !data) return { estado: "sem-cache" };
    if (!cacheValida(data.find((l) => l.tipo === "meta"))) return { estado: "sem-cache" };
    const linha = data.find((l) => l.tipo === tipo);
    return linha ? { estado: "ok", props: linha.props } : { estado: "nao-existe" };
  } catch {
    return { estado: "sem-cache" };
  }
}

/* Para o sitemap: produtos e marcas indexáveis, ou null se a cache não servir. */
export async function indexaveisPaginasMarca() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data: meta, error: e1 } = await admin.from(TABELA).select("props").eq("tipo", "meta").eq("slug", "estado").maybeSingle();
    if (e1 || !cacheValida(meta)) return null;
    const linhas = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await admin.from(TABELA).select("tipo, slug, atualizado")
        .in("tipo", ["produto", "marca"]).eq("indexavel", true)
        .order("tipo").order("slug").range(de, de + 999);
      if (error) return null;
      linhas.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return linhas;
  } catch {
    return null;
  }
}
