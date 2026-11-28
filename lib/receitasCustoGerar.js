import { getSupabaseAdmin } from "./supabaseAdmin";
import { receitas } from "./receitas/motor";
import { custoReceita, custoPorPessoa, artigoPorNome } from "./seoPrecos";
import { INGREDIENTES } from "./receitas/ingredientes";
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

/*
 * O melhor preço de hoje de cada artigo do dicionário das receitas, em
 * pouco espaço ({ slug: { u, v, l } }). Serve as receitas importadas de
 * vídeos (pages/api/receita-video): a API lê esta linha e faz as contas
 * sem tocar no histórico de preços.
 */
export function mapaPrecosIngredientes(resumos) {
  const precos = {};
  for (const ing of Object.values(INGREDIENTES)) {
    const art = ing.compra ? artigoPorNome(ing.compra) : null;
    const melhor = art ? resumos.get(art.slug)?.ofertas?.[0] : null;
    if (!art || !(melhor?.valor > 0)) continue;
    precos[art.slug] = { u: resumos.get(art.slug).unidade, v: melhor.valor, l: melhor.lojaNome || null };
  }
  return precos;
}

export async function gerarCustosReceitas({ hoje = hojeLisboa() } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");
  const lista = receitas();
  const resumos = await resumosRecentes(hoje);
  const custos = mapaCustos(lista, resumos);
  const precos = mapaPrecosIngredientes(resumos);
  const n = Object.keys(custos).length;
  // Sem preços (lojas em baixo), não apaga o mapa de ontem: a validade trata dele.
  if (!n) return { ok: false, motivo: "nenhuma receita com preços suficientes" };
  const agoraIso = new Date().toISOString();
  const { error } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG_CUSTOS, props: { custos, precos, dia: hoje, geradoEm: agoraIso },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`receitas-custo: ${error.message}`);
  return { ok: true, receitas: n, de: lista.length };
}
