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

/*
 * Quanto custa o plano da semana, com o custo por pessoa de cada receita.
 * entradas: [{ r: { id }, porcoes }] (entradasDoPlano). Só devolve um valor
 * quando 75% ou mais das receitas têm custo: com menos, o total ficava baixo
 * demais e prometia o que a lista de compras não cumpre.
 */
export function custoDoPlano(entradas, custos) {
  const lista = Array.isArray(entradas) ? entradas : [];
  if (!custos || !lista.length) return null;
  let total = 0, conhecidas = 0;
  for (const { r, porcoes } of lista) {
    const pp = custos[r?.id];
    if (Number.isFinite(pp) && porcoes > 0) { total += pp * porcoes; conhecidas++; }
  }
  if (conhecidas / lista.length < 0.75) return null;
  return { total: Math.round(total * 100) / 100, conhecidas, de: lista.length };
}

/* "1,85 €" — o mesmo formato em todo o lado. */
export const eurosPP = (v) => `${v.toFixed(2).replace(".", ",")} €`;

/*
 * Os preços dos ingredientes (lib/receitasCustoGerar → mapaPrecosIngredientes)
 * no formato que o custoReceita espera: Map slug → { unidade, ofertas }.
 * null se o mapa for velho ou não existir.
 */
export function resumosDosPrecos(props, agora = Date.now()) {
  const t = Date.parse(props?.geradoEm || "");
  if (!Number.isFinite(t) || agora - t >= VALIDADE_MS) return null;
  const p = props?.precos;
  if (!p || typeof p !== "object") return null;
  const m = new Map();
  for (const [slug, d] of Object.entries(p)) {
    if (!/^[a-z0-9-]{1,80}$/.test(slug) || !(Number(d?.v) > 0) || typeof d?.u !== "string") continue;
    m.set(slug, { unidade: d.u, ofertas: [{ valor: Number(d.v), lojaNome: typeof d.l === "string" ? d.l : null }] });
  }
  return m.size ? m : null;
}

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

/* Os preços dos ingredientes, guardados horas em memória (regra 4 do CLAUDE.md). */
let memoriaPrecos = null; // { ate, resumos }
export async function lerPrecosIngredientes() {
  if (memoriaPrecos && memoriaPrecos.ate > Date.now()) return memoriaPrecos.resumos;
  let resumos = null;
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_CUSTOS).maybeSingle();
      if (!error) resumos = resumosDosPrecos(data?.props);
    }
  } catch {}
  memoriaPrecos = { ate: Date.now() + (resumos ? 6 : 0.25) * 3600_000, resumos };
  return resumos;
}
