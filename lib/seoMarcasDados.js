import { getSupabaseAdmin } from "./supabaseAdmin";
import { agrupar } from "./seoMarcas";
import { hojeLisboa, diasAntes } from "./seoFormato";

/*
 * Leituras de produtos_marca para as páginas /produto e /marca (só servidor).
 * Sem Supabase configurado devolve vazio: as páginas saem com 404/noindex.
 */
const PAGINA = 1000;
const TTL_MS = 10 * 60 * 1000;
let memoria = null; // { em, hoje, grupos }

/* Todos os produtos vistos nos últimos 30 dias, já agrupados entre cadeias. */
export async function gruposMarca(hoje = hojeLisboa()) {
  if (memoria && memoria.hoje === hoje && Date.now() - memoria.em < TTL_MS) return memoria.grupos;
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const linhas = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await admin.from("produtos_marca")
      .select("loja, produto_id, q, nome, marca, marca_slug, qtd, unidade, preco, valor, imagem, url, primeiro_dia, ultimo_dia")
      .gte("ultimo_dia", diasAntes(hoje, 30))
      .order("loja").order("produto_id")
      .range(de, de + PAGINA - 1);
    if (error) { console.warn("seo gruposMarca:", error.message); return []; }
    linhas.push(...(data || []));
    if (!data || data.length < PAGINA) break;
  }
  const grupos = agrupar(linhas);
  memoria = { em: Date.now(), hoje, grupos };
  return grupos;
}

/* Preços diários dos produtos de um grupo, 30 dias. */
export async function diasDoGrupo(grupo, hoje = hojeLisboa()) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const ids = [...new Set(grupo.itens.map((l) => l.produto_id))];
  const { data, error } = await admin.from("produtos_marca_dia")
    .select("loja, produto_id, dia, preco")
    .in("produto_id", ids).gte("dia", diasAntes(hoje, 30))
    .order("dia").limit(PAGINA);
  if (error) { console.warn("seo diasDoGrupo:", error.message); return []; }
  return data || [];
}
