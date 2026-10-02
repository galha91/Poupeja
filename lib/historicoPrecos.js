/*
 * Histórico de preços — as contas, sem base de dados (testáveis à parte).
 *
 * A tabela guarda o melhor preço de CADA loja por dia. Para dizer "esteve
 * entre X e Y" interessa o melhor preço de cada dia (o que alguém atento
 * pagaria), não o da loja mais cara: por isso agrupa-se primeiro por dia.
 */

/**
 * @param linhas [{ dia, loja, valor, produto }]
 * @returns { minimo: { valor, dia, loja, produto }, maximo: { valor, dia }, dias } | null
 */
export function resumirHistorico(linhas, { minDias = 3 } = {}) {
  const porDia = new Map();
  for (const l of linhas || []) {
    const v = Number(l.valor);
    if (!l?.dia || !(v > 0)) continue;
    const atual = porDia.get(l.dia);
    if (!atual || v < atual.valor) porDia.set(l.dia, { ...l, valor: v });
  }
  // Com menos de 3 dias, um "mínimo" não diz nada a ninguém.
  if (porDia.size < minDias) return null;
  const dias = [...porDia.values()];
  const min = dias.reduce((a, b) => (b.valor < a.valor || (b.valor === a.valor && b.dia > a.dia) ? b : a));
  const max = dias.reduce((a, b) => (b.valor > a.valor ? b : a));
  return {
    minimo: { valor: min.valor, dia: min.dia, loja: min.loja, produto: min.produto },
    maximo: { valor: max.valor, dia: max.dia },
    dias: porDia.size,
  };
}

/*
 * Esta promoção é boa? Compara o preço de hoje com o intervalo dos
 * últimos 30 dias.
 *   "minimo" — igual ou abaixo do mais baixo
 *   "bom"    — no terço de baixo do intervalo
 *   "alto"   — perto do máximo
 *   "normal" — o resto (ou um intervalo sem variação)
 */
export function avaliarPreco(atual, historico) {
  const min = historico?.minimo?.valor;
  const max = historico?.maximo?.valor;
  if (!(atual > 0) || !(min > 0)) return null;
  if (atual <= min + 0.005) return "minimo";
  if (!(max > min + 0.01)) return "normal";
  const pos = (atual - min) / (max - min);
  if (pos <= 1 / 3) return "bom";
  if (pos >= 0.8) return "alto";
  return "normal";
}
