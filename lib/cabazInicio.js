import { otimizarCabaz } from "./cabaz.js";

/*
 * O cabaz básico do Início, já respondido.
 *
 * Dos primeiros 705 convidados, 91% saíram sem ver um único preço: o
 * Início perguntava "por onde queres começar?" e a resposta ficava a um
 * toque e uma espera de distância. Agora quem chega pela primeira vez vê
 * logo onde ficam mais baratos os 6 básicos (a LISTA_ARRANQUE).
 *
 * O cálculo (6 pesquisas a todas as lojas) corre uma vez por dia nos
 * GitHub Actions (lib/cabazInicioGerar, dentro do cron-paginas-marca) e
 * fica numa linha da tabela paginas_marca (tipo "inicio", slug "cabaz").
 * A página inicial lê só essa linha, no getStaticProps (ISR de 6 h).
 *
 * Este ficheiro tem as contas e a leitura; não vai a nenhuma loja.
 */

export const TIPO = "inicio";
export const SLUG = "cabaz";
// Os preços mudam várias vezes por semana: com mais de 2 dias não se mostra.
export const VALIDADE_MS = 2 * 24 * 60 * 60 * 1000;
// Menos do que isto em comum entre as lojas e o "cabaz" já não é o cabaz.
export const MIN_ARTIGOS = 4;
// O vencedor só é declarado se ganhar por 3% ou mais (a mesma regra dos
// cabazes das redes sociais, scripts/cabaz/calcular.mjs).
export const MARGEM_EMPATE = 0.03;

// Cadeias que só existem numa região ficam fora do cartão: a 11 nov a
// Apolónia (só no Algarve, e cara) fazia a diferença parecer 5,42 € num
// cabaz de 9,50 €. O número do Início tem de valer para o país todo. Na
// lista de compras continuam a ser comparadas.
export const SO_REGIONAIS = ["apolonia"];
export const lojasDoInicio = (ids) => ids.filter((id) => !SO_REGIONAIS.includes(id));

const cent = (v) => Math.round(v * 100);

/*
 * linhas: [{ nome, custos: { [loja]: euros } }] (o custo de cada artigo em
 * cada loja, na mesma quantidade: custoPorLoja de lib/comparacao).
 * Devolve o resumo para o cartão, ou null se não der para comparar.
 */
export function resumirCabaz(linhas, lojas, nomeLoja = (id) => id) {
  const comId = linhas.map((l, i) => ({ id: String(i), nome: l.nome, custos: l.custos || {} }));
  const r = otimizarCabaz(comId, lojas);
  if (!r.unica || !r.maisCara || r.grupo.length < 2 || r.comparaveis.length < MIN_ARTIGOS) return null;
  if (!(r.poupancaUnica > 0)) return null;

  const comparaveis = comId.filter((l) => r.comparaveis.includes(l.id));
  const total = (loja, sem = null) => comparaveis.reduce((s, l) => s + (l === sem ? 0 : cent(l.custos[loja])), 0);
  const vencedorSem = (sem) => [...r.grupo].sort((a, b) => total(a, sem) - total(b, sem) || lojas.indexOf(a) - lojas.indexOf(b))[0];
  // Frágil: o vencedor muda ao tirar um artigo, ou ganha por quase nada.
  const robusto = comparaveis.every((l) => vencedorSem(l) === r.unica.loja);
  const segundo = r.porLoja[1];
  const empate = !robusto || !segundo || (cent(segundo.total) - cent(r.unica.total)) / cent(r.unica.total) < MARGEM_EMPATE;

  return {
    loja: r.unica.loja, nome: nomeLoja(r.unica.loja), total: r.unica.total,
    cara: { loja: r.maisCara.loja, nome: nomeLoja(r.maisCara.loja), total: r.maisCara.total },
    poupanca: r.poupancaUnica,
    empate,
    lojas: r.grupo.length,
    artigos: comparaveis.map((l) => l.nome),
  };
}

/* O que está guardado ainda serve? (gerado há menos de 2 dias, e completo) */
export function cabazServe(props, agora = Date.now()) {
  const t = Date.parse(props?.geradoEm || "");
  return Number.isFinite(t) && agora - t < VALIDADE_MS
    && Number.isFinite(props.total) && Number.isFinite(props.cara?.total) && !!props.nome;
}

/* Lê a linha do cabaz. null se não existir, for velha ou o Supabase falhar. */
export async function lerCabazInicio() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG).maybeSingle();
    if (error || !cabazServe(data?.props)) return null;
    return data.props;
  } catch {
    return null;
  }
}
