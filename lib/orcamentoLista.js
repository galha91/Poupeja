/*
 * O total real de uma lista comparada, posto ao lado do orçamento da
 * pessoa: cabe ou não cabe, por quanto, e as medidas para desenhar a
 * barra (o total e a marca do orçamento na mesma escala). Sem React nem rede.
 */

const cent = (v) => Math.round(v * 100);

/**
 * @returns null sem números válidos, ou
 *   { dentro, diferenca, larguraTotal, posicaoOrcamento }
 *   diferenca: quanto sobra (dentro) ou quanto passa (fora), em euros;
 *   larguraTotal e posicaoOrcamento: 0 a 100, na mesma escala.
 */
export function avaliarOrcamento(total, orcamento) {
  if (!(total > 0) || !(orcamento > 0)) return null;
  const t = cent(total);
  const o = cent(orcamento);
  const escala = Math.max(t, o);
  return {
    dentro: t <= o,
    diferenca: Math.abs(o - t) / 100,
    larguraTotal: Math.round((t / escala) * 1000) / 10,
    posicaoOrcamento: Math.round((o / escala) * 1000) / 10,
  };
}
