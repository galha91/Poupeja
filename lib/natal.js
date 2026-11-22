import { resumirCabaz } from "./cabazInicio.js";
import { registoDe, juntarSemana, variacao } from "./barometro.js";

/*
 * Ceia de Natal: quanto custa a consoada em cada supermercado.
 *
 * Em dezembro, "preço do bacalhau", "bolo-rei" e "ceia de Natal barata"
 * estão entre as pesquisas de compras que mais crescem. A página
 * /ceia-de-natal responde com o mesmo cabaz em cada cadeia, semana a
 * semana até ao Natal: um número que se pode citar.
 *
 * As contas são as do cabaz do Início (resumirCabaz, as mesmas pesquisas
 * do botão "comparar" da lista). O cálculo corre nos GitHub Actions, dentro
 * do cron-paginas-marca, e só na época (EPOCA); a página lê uma linha de
 * paginas_marca (tipo "inicio", slug "natal"). Regra 1 do CLAUDE.md.
 *
 * Este ficheiro tem os artigos, as contas e a leitura; não vai a loja nenhuma.
 */

export const TIPO = "inicio";
export const SLUG_NATAL = "natal";
// Os preços de dezembro mudam todas as semanas: mais de 3 dias, já não serve.
export const VALIDADE_MS = 3 * 24 * 60 * 60 * 1000;
export const PESSOAS = 6;

/*
 * A consoada tradicional, para 6 pessoas. Só artigos do catálogo da lista
 * (data/catalogo-lista.js): são os que as lojas devolvem bem e que o teste
 * confirma que existem. kg = peso a comprar (fica ao preço por kg); sem kg,
 * qtd conta embalagens ou unidades. Sem vinho nem marisco: o preço depende
 * de mais da escolha do que da loja.
 */
export const ARTIGOS_NATAL = [
  { nome: "Bacalhau", kg: 1.5, txt: "1,5 kg", para: "bacalhau com todos" },
  { nome: "Batatas", kg: 2, txt: "2 kg", para: "bacalhau com todos" },
  { nome: "Couve portuguesa", kg: 1, txt: "1 kg", para: "bacalhau com todos" },
  { nome: "Ovos", qtd: 1, txt: "1 dúzia", para: "bacalhau e rabanadas" },
  { nome: "Azeite", qtd: 1, txt: "1 L", para: "tudo" },
  { nome: "Polvo", kg: 1, txt: "1 kg", para: "polvo à lagareiro" },
  { nome: "Leite meio-gordo", qtd: 1, txt: "1 L", para: "rabanadas e arroz-doce" },
  { nome: "Açúcar", qtd: 1, txt: "1 kg", para: "rabanadas e arroz-doce" },
  { nome: "Bolo-rei", qtd: 1, txt: "1 bolo", para: "sobremesa" },
];

/* A página e o cálculo só fazem sentido entre 1 de novembro e o Dia de Reis. */
export function emEpoca(dia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia || "");
  if (!m) return false;
  const mes = Number(m[2]), d = Number(m[3]);
  return mes === 11 || mes === 12 || (mes === 1 && d <= 6);
}

/* O ano do Natal a que um dia pertence (janeiro ainda é o Natal anterior). */
export const anoDoNatal = (dia) => Number(dia.slice(0, 4)) - (dia.slice(5, 7) === "01" ? 1 : 0);

/*
 * linhas: [{ nome, custos: { [loja]: euros } }], pela ordem de ARTIGOS_NATAL.
 * Devolve o resumo do cabaz (resumirCabaz) com o detalhe de cada artigo:
 * onde fica mais barato, só entre as cadeias comparadas.
 */
export function resumirNatal(linhas, lojas, nomeLoja = (id) => id) {
  const resumo = resumirCabaz(linhas, lojas, nomeLoja);
  if (!resumo) return null;
  const grupo = resumo.porLoja.map((p) => p.loja);
  const detalhe = linhas.map((l, i) => {
    const a = ARTIGOS_NATAL.find((x) => x.nome === l.nome) || ARTIGOS_NATAL[i] || {};
    const ofertas = grupo
      .filter((loja) => Number.isFinite(l.custos?.[loja]))
      .map((loja) => ({ loja, nome: nomeLoja(loja), custo: Math.round(l.custos[loja] * 100) / 100 }))
      .sort((x, y) => x.custo - y.custo);
    return { nome: l.nome, txt: a.txt || "", para: a.para || "", melhor: ofertas[0] || null, cara: ofertas.length > 1 ? ofertas[ofertas.length - 1] : null };
  });
  return { ...resumo, detalhe };
}

/* Junta o dia ao histórico semanal (o mesmo formato do Barómetro). */
export function comHistorico(resumo, dia, historico) {
  const registo = registoDe(resumo, dia);
  return registo ? juntarSemana(historico, registo, 12) : (Array.isArray(historico) ? historico : []);
}

/* A variação desde a semana anterior, se o cabaz for o mesmo. */
export const variacaoNatal = (props) => variacao(props?.semanas);

/* O que está guardado ainda serve? */
export function natalServe(props, agora = Date.now()) {
  const t = Date.parse(props?.geradoEm || "");
  return Number.isFinite(t) && agora - t < VALIDADE_MS
    && Array.isArray(props.porLoja) && props.porLoja.length >= 2 && Array.isArray(props.detalhe);
}

/* Lê a linha. null se não existir ou o Supabase falhar (velha também volta: a página decide). */
export async function lerNatal() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_NATAL).maybeSingle();
    if (error || !data?.props?.porLoja) return null;
    return data.props;
  } catch {
    return null;
  }
}
