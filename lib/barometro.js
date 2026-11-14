/*
 * Barómetro PoupeJá: o custo do cabaz básico, semana a semana.
 *
 * É o número que outros podem citar (jornalistas, criadoras, grupos de
 * poupança): quanto custam os mesmos 6 básicos em cada cadeia de âmbito
 * nacional com preços online, e quanto isso mudou desde a semana passada.
 *
 * Não faz contas novas nem vai a loja nenhuma. O cabaz do Início já é
 * calculado todos os dias nos GitHub Actions (lib/cabazInicioGerar); aqui
 * só se guarda o de cada semana numa linha de paginas_marca (tipo "inicio",
 * slug "barometro") e a página /barometro lê essa linha (regra 1 do
 * CLAUDE.md).
 *
 * Duas semanas só se comparam se o cabaz for o mesmo: os mesmos artigos nas
 * mesmas cadeias. Quando uma loja falha e um artigo sai, a página mostra o
 * valor da semana e não diz que subiu nem que desceu.
 */

export const SLUG_BAROMETRO = "barometro";
export const MAX_SEMANAS = 104;
// Sem cabaz novo há mais de 10 dias, a página sai do Google até voltar a ter.
export const VALIDADE_MS = 10 * 24 * 60 * 60 * 1000;

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const cent = (v) => Math.round(v * 100);

/* A segunda-feira da semana de um dia ("2026-11-14" -> "2026-11-09"). */
export function segundaDe(dia) {
  if (!DIA.test(dia || "")) return null;
  const d = new Date(`${dia}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/* O registo de uma semana, a partir do resumo do cabaz do Início. */
export function registoDe(resumo, dia) {
  const semana = segundaDe(dia);
  const lojas = (resumo?.porLoja || []).filter((l) => l?.loja && Number.isFinite(l.total) && l.total > 0);
  if (!semana || lojas.length < 2 || !resumo.artigos?.length) return null;
  const ordenadas = [...lojas].sort((a, b) => a.total - b.total).map((l) => ({ loja: l.loja, nome: l.nome || l.loja, total: l.total }));
  return {
    semana, dia,
    lojas: ordenadas,
    media: cent(ordenadas.reduce((s, l) => s + l.total, 0) / ordenadas.length) / 100,
    artigos: [...resumo.artigos],
    empate: !!resumo.empate,
  };
}

/* Junta o registo ao histórico: um por semana (fica o dia mais recente). */
export function juntarSemana(historico, registo, max = MAX_SEMANAS) {
  const antigas = (Array.isArray(historico) ? historico : []).filter((s) => s?.semana && s.semana !== registo.semana);
  return [...antigas, registo].sort((a, b) => a.semana.localeCompare(b.semana)).slice(-max);
}

const igual = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

/* O mesmo cabaz: os mesmos artigos nas mesmas cadeias. */
export function mesmoCabaz(a, b) {
  if (!a || !b) return false;
  return igual(a.artigos || [], b.artigos || []) && igual((a.lojas || []).map((l) => l.loja), (b.lojas || []).map((l) => l.loja));
}

/*
 * A variação da última semana face à anterior, em euros e em percentagem
 * da média das cadeias. null se não houver semana anterior comparável.
 */
export function variacao(semanas) {
  const lista = Array.isArray(semanas) ? semanas : [];
  const atual = lista[lista.length - 1];
  const anterior = lista[lista.length - 2];
  if (!mesmoCabaz(atual, anterior) || !(anterior.media > 0)) return null;
  const diff = (cent(atual.media) - cent(anterior.media)) / 100;
  return { diff, pct: Math.round((diff / anterior.media) * 1000) / 10, desde: anterior.dia };
}

/* O histórico ainda é atual? (última semana com menos de 10 dias) */
export function barometroServe(props, agora = Date.now()) {
  const ultima = props?.semanas?.[props.semanas.length - 1];
  const t = Date.parse(`${ultima?.dia || ""}T12:00:00Z`);
  return Number.isFinite(t) && agora - t < VALIDADE_MS && ultima.lojas?.length >= 2;
}

/* Lê o histórico. null se não existir ou o Supabase falhar. */
export async function lerBarometro() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", "inicio").eq("slug", SLUG_BAROMETRO).maybeSingle();
    if (error || !Array.isArray(data?.props?.semanas) || !data.props.semanas.length) return null;
    return data.props;
  } catch {
    return null;
  }
}
