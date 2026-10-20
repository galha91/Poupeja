/*
 * Contas do crédito habitação (taxa variável, prestação constante — o
 * "método francês" que os bancos portugueses usam).
 *
 * Taxa anual = Euribor + spread. Uma Euribor negativa conta como 0: desde
 * 2018 (Lei 32/2018) o banco não pode baixar a taxa abaixo do spread.
 */

/** Taxa anual em %, com a Euribor negativa a contar como 0. */
export function taxaAnual(euriborPct, spreadPct) {
  return Math.max(Number(euriborPct) || 0, 0) + (Number(spreadPct) || 0);
}

/** Prestação mensal. */
export function prestacao(capital, taxaAnualPct, meses) {
  const n = Math.round(meses);
  if (!(capital > 0) || !(n > 0)) return 0;
  const r = taxaAnualPct / 100 / 12;
  if (r <= 0) return capital / n;
  return capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

/** Meses que faltam para pagar `capital` com a prestação `pmt`. null se nunca acaba. */
export function mesesParaPagar(capital, taxaAnualPct, pmt) {
  if (!(capital > 0)) return 0;
  if (!(pmt > 0)) return null;
  const r = taxaAnualPct / 100 / 12;
  if (r <= 0) return Math.ceil(capital / pmt);
  const x = 1 - (r * capital) / pmt;
  if (x <= 0) return null; // a prestação nem paga os juros
  return Math.ceil(-Math.log(x) / Math.log(1 + r) - 1e-9);
}

/**
 * Simulação completa. `amortizacao` é um pagamento antecipado feito hoje;
 * `modo` diz o que se faz com ele: "prestacao" (baixa a prestação, mesmo
 * prazo) ou "prazo" (mantém a prestação, acaba mais cedo).
 */
export function simular({ capital, spread, euribor, anos, amortizacao = 0, modo = "prestacao" }) {
  const taxa = taxaAnual(euribor, spread);
  const meses = Math.round(anos * 12);
  const amort = Math.min(Math.max(Number(amortizacao) || 0, 0), capital);
  const semAmort = prestacao(capital, taxa, meses);
  const resto = capital - amort;

  let pmt = semAmort, mesesFinal = meses;
  if (amort > 0) {
    if (modo === "prazo") mesesFinal = mesesParaPagar(resto, taxa, semAmort) ?? meses;
    else pmt = prestacao(resto, taxa, meses);
  }
  if (resto <= 0) { pmt = 0; mesesFinal = 0; }

  const juros = Math.max(pmt * mesesFinal - resto, 0);
  const jurosSemAmort = Math.max(semAmort * meses - capital, 0);
  return {
    taxa,
    prestacao: pmt,
    meses: mesesFinal,
    juros,
    poupancaJuros: amort > 0 ? Math.max(jurosSemAmort - juros, 0) : 0,
  };
}
