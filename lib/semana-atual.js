/*
 * A semana corrente (segunda–domingo), como CONTEXTO — nunca como
 * "validade" de um folheto.
 *
 * Isto já foi `validade` e era informação falsa. O cálculo é só "a segunda
 * e o domingo desta semana", e essa string era carimbada como período de
 * validade de TODAS as lojas, iguaizinha: a Início mostrava cinco linhas a
 * dizer "31 ago–6 set", e a página /folhetos/continente chegava a afirmar
 * "Válido 31 ago–6 set" — indexado pelo Google — sobre um período que
 * ninguém nos disse.
 *
 * Os folhetos reais não andam todos ao mesmo compasso: o do Continente
 * corre de terça a segunda, o do Lidl de segunda a domingo, e por aí. Nós
 * não temos essa informação em lado nenhum — o public/folhetos.json guarda
 * "22 jun–28 jun" para todas as lojas, uma data fixa de junho que já
 * estava desatualizada. Ou seja: não havia dados reais para mostrar, e a
 * correção anterior trocou uma data velha por uma data inventada.
 *
 * O que sabemos mesmo, e podemos dizer:
 *   semana        — em que semana estamos (contexto de secção, uma vez só)
 *   atualizadoEm  — quando é que nós verificámos os links
 *
 * As datas de cada folheto ficam onde estão: no folheto oficial, a um
 * toque de distância.
 */
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function semanaAtual(data = new Date()) {
  const diaSemana = data.getDay();
  const seg = new Date(data);
  seg.setDate(data.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = d => `${d.getDate()} ${MESES[d.getMonth()]}`;
  return {
    semana: `${fmt(seg)}–${fmt(dom)}`,
    atualizadoEm: data.toISOString().split("T")[0],
  };
}
