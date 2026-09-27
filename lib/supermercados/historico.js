import { getSupabaseAdmin } from "../supabaseAdmin";
import { melhoresPorLoja, valorComparacao } from "../comparacao";

/*
 * Histórico do "Comparar preços": o melhor preço de cada loja, por
 * pesquisa e por dia (tabela precos_supermercado_historico). Serve para
 * dizer "o mais baixo dos últimos 30 dias foi X" — a pergunta seguinte de
 * quem vê um preço: "está mesmo barato, ou é o normal?".
 *
 * Alimentado por cada pesquisa feita na app e por um cron diário com as
 * pesquisas mais comuns, para os artigos habituais terem sempre história.
 */

const TABELA = "precos_supermercado_historico";

function hojeLisboa() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export async function registar(r) {
  const admin = getSupabaseAdmin();
  if (!admin || !r?.produtos?.length) return;
  const { modo, melhores } = melhoresPorLoja(r);
  const dia = hojeLisboa();
  const linhas = Object.values(melhores).map((p) => ({
    q: r.q,
    dia,
    loja: p.loja,
    modo,
    unidade: modo === "embalagem" ? "embalagem" : p.nomeUnidade || p.unidade,
    valor: valorComparacao(p, modo),
    preco: p.preco,
    produto: String(p.nome || "").slice(0, 120),
    atualizado_em: new Date().toISOString(),
  })).filter((l) => l.valor > 0);
  if (!linhas.length) return;
  const { error } = await admin.from(TABELA).upsert(linhas, { onConflict: "q,dia,loja" });
  if (error) console.warn("historico: falhou a gravar:", error.message);
}

/*
 * { minimo: { valor, dia, loja, produto }, dias } dos últimos 30 dias, na
 * mesma unidade de agora (não se compara €/kg de ontem com €/un de hoje).
 * Com menos de 3 dias de dados não há resumo: um "mínimo" de dois dias
 * não diz nada a ninguém.
 */
export async function resumo(q, unidade) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const desde = new Date(Date.now() - 30 * 86400000).toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const { data, error } = await admin
    .from(TABELA)
    .select("dia, loja, valor, produto")
    .eq("q", q)
    .eq("unidade", unidade)
    .gte("dia", desde)
    .order("valor", { ascending: true })
    .limit(200);
  if (error || !data?.length) return null;
  const dias = new Set(data.map((d) => d.dia)).size;
  if (dias < 3) return null;
  const m = data[0];
  return { minimo: { valor: Number(m.valor), dia: m.dia, loja: m.loja, produto: m.produto }, dias };
}
