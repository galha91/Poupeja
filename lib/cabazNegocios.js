import { otimizarCabaz } from "./cabaz.js";

/*
 * O cabaz de exemplo da página /negocios (PoupeJá Negócios): o que um café
 * ou restaurante pequeno compra numa semana, somado em cada supermercado.
 *
 * Os preços já estão em precos_supermercado_historico (o histórico diário);
 * aqui não se vai a nenhuma loja. A conta corre uma vez por dia nos GitHub
 * Actions (lib/cabazNegociosGerar, dentro do cron-paginas-marca) e fica numa
 * linha de paginas_marca (tipo "inicio", slug "cabaz-negocios"). A página lê
 * só essa linha, no getStaticProps.
 *
 * Este ficheiro tem as contas e a leitura. As regras de honestidade são as
 * dos cabazes das redes (scripts/cabaz/calcular.mjs), mais apertadas:
 *   - um artigo só entra se todas as lojas o tiverem;
 *   - se o preço mais alto for mais de 2x o mais baixo, a pesquisa apanhou
 *     produtos diferentes e o artigo sai;
 *   - o vencedor só é declarado se ganhar por 3% ou mais e não depender de
 *     um artigo só.
 */

export const TIPO = "inicio";
export const SLUG = "cabaz-negocios";
// Preços com mais de 3 dias não entram na conta.
export const FRESCO_DIAS = 3;
// Gerado há mais de 3 dias: a página deixa de mostrar a tabela.
export const VALIDADE_MS = 3 * 24 * 60 * 60 * 1000;
export const RAZAO_MAXIMA = 2;
export const MIN_ARTIGOS = 8;
export const MARGEM_EMPATE = 0.03;

const cent = (v) => Math.round(v * 100);
const arredondar = (v) => cent(v) / 100;

/*
 * config: data/cabaz-negocios.json. linhas: [{ q, loja, valor, dia }], já
 * filtradas aos últimos dias; fica o dia mais recente de cada q e loja.
 * Devolve o cabaz pronto para a página, ou null se não der para comparar.
 */
export function montarCabazNegocios(config, linhas, nomeLoja = (id) => id) {
  const lojas = config.lojas;
  const ultimo = {};
  for (const l of linhas) {
    if (!lojas.includes(l.loja) || !(Number(l.valor) > 0)) continue;
    const chave = `${l.q}|${l.loja}`;
    const dia = String(l.dia).slice(0, 10);
    if (!ultimo[chave] || dia > ultimo[chave].dia) ultimo[chave] = { valor: Number(l.valor), dia };
  }

  const itens = [];
  let dia = null;
  for (const a of config.artigos) {
    const precos = lojas.map((s) => ultimo[`${a.q}|${s}`]);
    if (precos.some((p) => !p)) continue;
    const valores = precos.map((p) => p.valor);
    if (Math.max(...valores) / Math.min(...valores) > RAZAO_MAXIMA) continue;
    for (const p of precos) if (!dia || p.dia < dia) dia = p.dia;
    itens.push({
      id: a.q, nome: a.nome, rotulo: a.rotulo,
      custos: Object.fromEntries(lojas.map((s, i) => [s, arredondar(valores[i] * a.qtd)])),
    });
  }
  if (itens.length < MIN_ARTIGOS) return null;

  const r = otimizarCabaz(itens, lojas);
  if (!r.unica || !r.maisCara || r.porLoja.length < 2 || !(r.poupancaUnica > 0)) return null;

  const total = (loja, sem = null) => itens.reduce((s, i) => s + (i === sem ? 0 : cent(i.custos[loja])), 0);
  const vencedorSem = (sem) => [...lojas].sort((a, b) => total(a, sem) - total(b, sem) || lojas.indexOf(a) - lojas.indexOf(b))[0];
  const robusto = itens.every((i) => vencedorSem(i) === r.unica.loja);
  const segundo = r.porLoja[1];
  const empate = !robusto || (cent(segundo.total) - cent(r.unica.total)) / cent(r.unica.total) < MARGEM_EMPATE;

  // Quem compra tudo numa loja qualquer paga, em média, isto.
  const media = arredondar(r.porLoja.reduce((s, p) => s + p.total, 0) / r.porLoja.length);
  const melhor = r.divisao ? r.divisao.total : r.unica.total;

  return {
    dia,
    lojas: r.porLoja.map((p) => ({ loja: p.loja, nome: nomeLoja(p.loja), total: p.total })),
    itens: itens.map((i) => {
      // Só se destaca uma loja se for a única mais barata; num empate, nenhuma.
      const minimo = Math.min(...lojas.map((s) => cent(i.custos[s])));
      const baratas = lojas.filter((s) => cent(i.custos[s]) === minimo);
      return { nome: i.nome, rotulo: i.rotulo, custos: i.custos, barata: baratas.length === 1 ? baratas[0] : null };
    }),
    barata: { loja: r.unica.loja, nome: nomeLoja(r.unica.loja), total: r.unica.total },
    cara: { loja: r.maisCara.loja, nome: nomeLoja(r.maisCara.loja), total: r.maisCara.total },
    empate,
    poupancaSemana: r.poupancaUnica,
    divisao: r.divisao ? {
      lojas: r.divisao.lojas.map((s) => ({ loja: s, nome: nomeLoja(s), artigos: r.divisao.atribuicao[s].length })),
      total: r.divisao.total,
      poupancaExtra: r.divisao.poupancaExtra,
    } : null,
    media,
    // Estimativas: a diferença entre a média das lojas e a melhor opção.
    poupancaMediaSemana: arredondar(Math.max(0, media - melhor)),
    poupancaMediaMes: arredondar(Math.max(0, media - melhor) * 52 / 12),
  };
}

/* O que está guardado ainda serve? */
export function cabazNegociosServe(props, agora = Date.now()) {
  const t = Date.parse(props?.geradoEm || "");
  return Number.isFinite(t) && agora - t < VALIDADE_MS
    && Array.isArray(props.itens) && props.itens.length >= MIN_ARTIGOS
    && Array.isArray(props.lojas) && props.lojas.length >= 2 && !!props.barata?.nome;
}

/* Lê a linha do cabaz. null se não existir, for velha ou o Supabase falhar. */
export async function lerCabazNegocios() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG).maybeSingle();
    if (error || !cabazNegociosServe(data?.props)) return null;
    return data.props;
  } catch {
    return null;
  }
}

/* ── Lista de espera ── */

export const TIPOS_NEGOCIO = [
  { id: "cafe", nome: "Café ou snack-bar" },
  { id: "restaurante", nome: "Restaurante" },
  { id: "pastelaria", nome: "Pastelaria ou padaria" },
  { id: "takeaway", nome: "Take-away" },
  { id: "alojamento", nome: "Alojamento" },
  { id: "ipss", nome: "IPSS, creche ou lar" },
  { id: "outro", nome: "Outro" },
];

// O que a pessoa pagaria por mês: a pergunta que decide se o produto avança.
export const DISPOSICOES = [
  { id: "gratis", nome: "Só se for grátis" },
  { id: "ate-10", nome: "Até 10 € por mês" },
  { id: "10-20", nome: "Entre 10 € e 20 € por mês" },
  { id: "mais-20", nome: "Mais de 20 € por mês" },
];

export const tipoNegocioValido = (id) => TIPOS_NEGOCIO.some((t) => t.id === id);
export const disposicaoValida = (id) => DISPOSICOES.some((d) => d.id === id);
