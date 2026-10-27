import { getSupabaseAdmin } from "./supabaseAdmin";
import { ARTIGOS_SEO, FRESCO_DIAS, montarArtigo, hojeLisboa, diasAntes } from "./seoPrecos";

/*
 * Leituras do histórico de preços para as páginas públicas (só servidor).
 * Sem Supabase configurado (build local, pré-visualizações) devolve vazio:
 * as páginas saem na mesma, mas com noindex.
 */
const TABELA = "precos_supermercado_historico";
const COLUNAS = "q, dia, loja, unidade, valor, preco, produto";
const PAGINA = 1000; // o máximo que o Supabase devolve de cada vez

/* As linhas de 30 dias de um artigo. */
export async function historicoArtigo(q, hoje = hojeLisboa()) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin.from(TABELA).select(COLUNAS)
    .eq("q", q).gte("dia", diasAntes(hoje, 30)).order("dia", { ascending: true }).limit(PAGINA);
  if (error) { console.warn("seo historicoArtigo:", error.message); return []; }
  return data || [];
}

/*
 * Os preços recentes de todos os artigos do catálogo, de uma vez — para os
 * hubs, o sitemap e as ligações entre páginas. Uma geração de páginas faz
 * isto dezenas de vezes seguidas: fica em memória uns minutos.
 */
const TTL_MS = 10 * 60 * 1000;
let memoria = null; // { em, hoje, resumos }

export async function resumosRecentes(hoje = hojeLisboa()) {
  if (memoria && memoria.hoje === hoje && Date.now() - memoria.em < TTL_MS) return memoria.resumos;
  const admin = getSupabaseAdmin();
  const resumos = new Map();
  if (!admin) return resumos;
  const qs = [...new Set(ARTIGOS_SEO.map((a) => a.q))];
  const linhas = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await admin.from(TABELA).select(COLUNAS)
      .in("q", qs).gte("dia", diasAntes(hoje, FRESCO_DIAS))
      .order("q").order("dia").order("loja")
      .range(de, de + PAGINA - 1);
    if (error) { console.warn("seo resumosRecentes:", error.message); return resumos; }
    linhas.push(...(data || []));
    if (!data || data.length < PAGINA) break;
  }
  const porQ = new Map();
  for (const l of linhas) {
    if (!porQ.has(l.q)) porQ.set(l.q, []);
    porQ.get(l.q).push(l);
  }
  for (const a of ARTIGOS_SEO) resumos.set(a.slug, montarArtigo(porQ.get(a.q) || [], hoje));
  memoria = { em: Date.now(), hoje, resumos };
  return resumos;
}

/*
 * Os 30 dias de todos os artigos, para as boas compras. São dezenas de
 * milhares de linhas: pedem-se aos grupos de artigos (cada grupo cabe em
 * poucas páginas de 1000) e vários grupos ao mesmo tempo.
 */
const GRUPO = 6;
const EM_PARALELO = 6;
let memoria30 = null; // { em, hoje, resumos }

async function linhas30(admin, qs, hoje) {
  const out = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await admin.from(TABELA).select(COLUNAS)
      .in("q", qs).gte("dia", diasAntes(hoje, 30))
      .order("q").order("dia").order("loja")
      .range(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < PAGINA) return out;
  }
}

export async function resumos30Dias(hoje = hojeLisboa()) {
  if (memoria30 && memoria30.hoje === hoje && Date.now() - memoria30.em < TTL_MS) return memoria30.resumos;
  const admin = getSupabaseAdmin();
  const resumos = new Map();
  if (!admin) return resumos;
  const qs = [...new Set(ARTIGOS_SEO.map((a) => a.q))];
  const grupos = [];
  for (let i = 0; i < qs.length; i += GRUPO) grupos.push(qs.slice(i, i + GRUPO));
  const porQ = new Map();
  try {
    for (let i = 0; i < grupos.length; i += EM_PARALELO) {
      const lotes = await Promise.all(grupos.slice(i, i + EM_PARALELO).map((g) => linhas30(admin, g, hoje)));
      for (const l of lotes.flat()) {
        if (!porQ.has(l.q)) porQ.set(l.q, []);
        porQ.get(l.q).push(l);
      }
    }
  } catch (e) {
    console.warn("seo resumos30Dias:", e.message);
    return resumos;
  }
  for (const a of ARTIGOS_SEO) resumos.set(a.slug, montarArtigo(porQ.get(a.q) || [], hoje));
  memoria30 = { em: Date.now(), hoje, resumos };
  return resumos;
}

/* Para as props do Next: só JSON simples. */
export const paraProps = (d) => JSON.parse(JSON.stringify(d));
