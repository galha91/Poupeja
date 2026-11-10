import { getSupabaseAdmin } from "./supabaseAdmin";
import { pesquisarTudo } from "./supermercados";
import { custoPorLoja, termoDePesquisa } from "./comparacao";
import { doCatalogo } from "./catalogoLista";
import { LISTA_ARRANQUE } from "./listasGuardadas";
import { COMPARADAS, nomeCadeia } from "./cobertura";
import { hojeLisboa } from "./seoFormato";
import { TIPO, SLUG, resumirCabaz } from "./cabazInicio";

/*
 * Calcula o cabaz básico do Início (ver lib/cabazInicio) e guarda-o em
 * paginas_marca. Faz as mesmas pesquisas e as mesmas contas que o botão
 * "comparar" da lista (compararArtigos + ResultadoLista), para o número do
 * Início ser o que a pessoa encontra quando toca no cartão.
 *
 * Corre nos GitHub Actions, uma vez por dia. Um resultado que não dê para
 * comparar (lojas em baixo) não apaga o do dia anterior: a validade de 2
 * dias trata de o esconder se a falha durar.
 */
const LOJAS = COMPARADAS.map((c) => c.id);
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

export async function calcularCabazInicio() {
  const linhas = [];
  for (const it of LISTA_ARRANQUE.itens) {
    const q = doCatalogo(it.nome)?.q || termoDePesquisa(it.nome);
    const dados = await pesquisarTudo(q);
    const { custos } = custoPorLoja(dados, it.qty || 1);
    linhas.push({ nome: it.nome, custos: Object.fromEntries(Object.entries(custos).map(([loja, v]) => [loja, v.custo])) });
    await espera(1500); // uma pesquisa de cada vez, sem pressa: são sites de terceiros
  }
  return { linhas, resumo: resumirCabaz(linhas, LOJAS, nomeCadeia) };
}

export async function gerarCabazInicio({ hoje = hojeLisboa() } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");
  const { resumo } = await calcularCabazInicio();
  if (!resumo) return { ok: false, motivo: "sem lojas ou artigos suficientes para comparar" };
  const agoraIso = new Date().toISOString();
  const { error } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG, props: { ...resumo, dia: hoje, geradoEm: agoraIso },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`cabaz: ${error.message}`);
  return { ok: true, loja: resumo.loja, total: resumo.total, poupanca: resumo.poupanca, empate: resumo.empate, artigos: resumo.artigos.length };
}
