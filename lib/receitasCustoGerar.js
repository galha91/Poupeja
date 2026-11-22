import { getSupabaseAdmin } from "./supabaseAdmin";
import { receitas } from "./receitas/motor";
import { custoReceita, custoPorPessoa } from "./seoPrecos";
import { resumosRecentes } from "./seoPrecosDados";
import { hojeLisboa } from "./seoFormato";
import { TIPO, SLUG_CUSTOS } from "./receitasCusto";

/*
 * Calcula o custo por pessoa de todas as receitas (lib/receitasCusto) e
 * guarda o mapa numa linha de paginas_marca. Corre nos GitHub Actions,
 * dentro do cron-paginas-marca. Uma leitura dos preços recentes (a mesma
 * que as páginas de receita já fazem) e uma escrita.
 */
export function mapaCustos(lista, resumos) {
  const custos = {};
  for (const r of lista) {
    const pp = custoPorPessoa(custoReceita(r.ingredientes, resumos), r.porcoes);
    if (pp) custos[r.id] = pp;
  }
  return custos;
}

export async function gerarCustosReceitas({ hoje = hojeLisboa() } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");
  const lista = receitas();
  const custos = mapaCustos(lista, await resumosRecentes(hoje));
  const n = Object.keys(custos).length;
  // Sem preços (lojas em baixo), não apaga o mapa de ontem: a validade trata dele.
  if (!n) return { ok: false, motivo: "nenhuma receita com preços suficientes" };
  const agoraIso = new Date().toISOString();
  const { error } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG_CUSTOS, props: { custos, dia: hoje, geradoEm: agoraIso },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`receitas-custo: ${error.message}`);
  return { ok: true, receitas: n, de: lista.length };
}
