/*
 * Números em português. Em Portugal o separador decimal é a VÍRGULA:
 * "€1.493" lê-se mil quatrocentos e noventa e três, não um euro e meio.
 * As páginas públicas estavam a imprimir toFixed() em cru, que dá ponto.
 */
export function eur(valor, casas = 3) {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return valor.toLocaleString("pt-PT", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}
