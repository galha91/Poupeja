import { getSupabaseAdmin } from "./supabaseAdmin";
import { pesquisarTudo } from "./supermercados";
import { custoPorLoja, termoDePesquisa } from "./comparacao";
import { doCatalogo } from "./catalogoLista";
import { COMPARADAS, nomeCadeia } from "./cobertura";
import { hojeLisboa } from "./seoFormato";
import { lojasDoInicio } from "./cabazInicio";
import { TIPO, SLUG_NATAL, ARTIGOS_NATAL, emEpoca, resumirNatal, comHistorico } from "./natal";

/*
 * Calcula o cabaz da Ceia de Natal (lib/natal) e guarda-o em paginas_marca.
 * Corre nos GitHub Actions, dentro do cron-paginas-marca, uma vez por dia
 * e só na época: fora dela não faz nenhuma pesquisa. São 9 pesquisas, uma
 * de cada vez, como no cabaz do Início.
 *
 * Um dia sem lojas suficientes não apaga o anterior: a página trata da
 * validade.
 */
const LOJAS = lojasDoInicio(COMPARADAS.map((c) => c.id));
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

export async function gerarCabazNatal({ hoje = hojeLisboa() } = {}) {
  if (!emEpoca(hoje)) return { ok: true, motivo: "fora da época" };
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase não configurado.");

  const linhas = [];
  for (const a of ARTIGOS_NATAL) {
    const q = doCatalogo(a.nome)?.q || termoDePesquisa(a.nome);
    const dados = await pesquisarTudo(q);
    const { custos } = custoPorLoja(dados, a.qtd || 1, null, { kg: a.kg || null });
    linhas.push({ nome: a.nome, custos: Object.fromEntries(Object.entries(custos).map(([loja, v]) => [loja, v.custo])) });
    await espera(1500); // sites de terceiros: sem pressa
  }
  const resumo = resumirNatal(linhas, LOJAS, nomeCadeia);
  if (!resumo) return { ok: false, motivo: "sem lojas ou artigos suficientes para comparar" };

  const { data, error: e1 } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_NATAL).maybeSingle();
  if (e1) throw new Error(e1.message);
  // O histórico é só deste Natal: o do ano passado não se mistura.
  const antes = (data?.props?.semanas || []).filter((s) => s.dia >= `${hoje.slice(0, 4) - (hoje.slice(5, 7) === "01" ? 1 : 0)}-11-01`);
  const semanas = comHistorico(resumo, hoje, antes);

  const agoraIso = new Date().toISOString();
  const { error } = await admin.from("paginas_marca").upsert({
    tipo: TIPO, slug: SLUG_NATAL, props: { ...resumo, semanas, dia: hoje, geradoEm: agoraIso },
    indexavel: false, atualizado: hoje, hash: "-", gerado_em: agoraIso,
  }, { onConflict: "tipo,slug" });
  if (error) throw new Error(`natal: ${error.message}`);
  return { ok: true, loja: resumo.loja, total: resumo.total, poupanca: resumo.poupanca, empate: resumo.empate, artigos: resumo.artigos.length };
}
