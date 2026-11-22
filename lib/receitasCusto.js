/*
 * Custo por pessoa de cada receita, com os preços de hoje.
 *
 * Na lista de receitas (app e /receitas) cada receita mostrava "€€". Um
 * número ("1,85 €/pessoa") vende mais e é o que se partilha. Calcular isto
 * na página leria o histórico de preços de todo o catálogo a cada pedido
 * (regra 1 do CLAUDE.md), por isso o cron-paginas-marca faz a conta uma
 * vez por dia nos GitHub Actions (lib/receitasCustoGerar) e guarda um
 * mapa pequeno { id: euros } numa linha de paginas_marca. O Início da app
 * e /receitas leem só essa linha.
 *
 * Só entram receitas com 75% ou mais dos ingredientes com preço
 * (custoPorPessoa em lib/seoPrecos): as outras ficam com a faixa € / €€.
 */
export const TIPO = "inicio";
export const SLUG_CUSTOS = "receitas-custo";
// Os preços entram 3 vezes por dia; com mais de 3 dias o mapa já não se mostra.
export const VALIDADE_MS = 3 * 24 * 60 * 60 * 1000;

/* O mapa ainda serve? Devolve { id: euros } ou null. */
export function custosValidos(props, agora = Date.now()) {
  const t = Date.parse(props?.geradoEm || "");
  if (!Number.isFinite(t) || agora - t >= VALIDADE_MS) return null;
  const c = props.custos;
  if (!c || typeof c !== "object") return null;
  const limpo = Object.fromEntries(Object.entries(c).filter(([id, v]) => /^[a-z0-9-]{1,80}$/.test(id) && Number.isFinite(v) && v > 0 && v < 50));
  return Object.keys(limpo).length ? limpo : null;
}

/* "1,85 €" — o mesmo formato em todo o lado. */
export const eurosPP = (v) => `${v.toFixed(2).replace(".", ",")} €`;

/* Lê o mapa. null se não existir, for velho ou o Supabase falhar. */
export async function lerCustosReceitas() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_CUSTOS).maybeSingle();
    if (error) return null;
    return custosValidos(data?.props);
  } catch {
    return null;
  }
}
