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

/* Para as props do Next: só JSON simples. */
export const paraProps = (d) => JSON.parse(JSON.stringify(d));
