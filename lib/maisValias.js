/*
 * Mais-valias na venda de casa (vendas realizadas em 2026). Fonte única
 * para a página pública /mais-valias. Confirmado a 22/10/2026.
 *
 * CIRS: o ganho é o valor de realização menos o valor de aquisição
 * corrigido e menos as despesas (art. 10.º, 50.º e 51.º); só 50% entra no
 * IRS, englobado com os outros rendimentos (art. 43.º). Coeficientes de
 * correção: Portaria 457/2026/1, de 15 de outubro, só se passaram mais de
 * 24 meses entre a compra e a venda.
 *
 * Exclusões (art. 10.º, na redação do DL 97/2026): reinvestir o valor da
 * venda, sem a dívida do crédito, em outra habitação própria e permanente
 * (24 meses antes a 36 depois) ou, nas vendas de 2026 a 2029, em imóveis
 * para arrendamento acessível; ou, a partir dos 65 anos ou na reforma, em
 * seguro, fundo de pensões, certificado de capitalização ou PEPP nos seis
 * meses seguintes. Reinvestir só uma parte exclui a parte proporcional.
 * Imóveis comprados antes de 1989 não são tributados (art. 5.º do DL
 * 442-A/88, regime transitório).
 */
import { coletaDe, DEDUCAO_ESPECIFICA } from "./irs.js";

export const VERIFICADO_MAIS_VALIAS = "2026-10-22";
export const ANO_VENDA = 2026;
export const FONTE_PORTARIA_COEF = "https://diariodarepublica.pt/dr/detalhe/portaria/457-2026-1180341125";
export const FONTE_ART10_CIRS = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs10.aspx";
export const FONTE_DL_97_2026 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/diplomas_legislativos/Documents/decreto-lei-97-2026.pdf";

export const PERCENTAGEM_TRIBUTAVEL = 0.5;
export const ANO_REGIME_TRANSITORIO = 1989;

/* Coeficientes de desvalorização da moeda para alienações em 2026, por ano de aquisição. */
const POR_ANO = {
  1989: 3.07, 1990: 2.75, 1991: 2.43, 1992: 2.23, 1993: 2.05, 1994: 1.96, 1995: 1.88, 1996: 1.84,
  1997: 1.81, 1998: 1.76, 1999: 1.74, 2000: 1.71, 2001: 1.58, 2002: 1.52, 2003: 1.48, 2004: 1.46,
  2005: 1.43, 2006: 1.37, 2007: 1.35, 2008: 1.31, 2009: 1.33, 2010: 1.31, 2011: 1.27,
  2016: 1.22, 2017: 1.21, 2021: 1.19, 2022: 1.08, 2023: 1.04, 2024: 1.02, 2025: 1.0,
};
for (const a of [2012, 2013, 2014, 2015]) POR_ANO[a] = 1.23;
for (const a of [2018, 2019, 2020]) POR_ANO[a] = 1.2;
export const COEFICIENTES_2026 = POR_ANO;

/** Coeficiente do ano de aquisição, ou null se o ano não tem (antes de 1989 ou depois de 2025). */
export const coeficienteDe = (ano) => POR_ANO[ano] ?? null;

const cent = (v) => Math.round(v * 100 + 1e-6) / 100;

/** Meses entre a compra e a venda de 2026. */
export const mesesEntre = (anoCompra, mesCompra, mesVenda) => (ANO_VENDA - anoCompra) * 12 + (mesVenda - mesCompra);

/*
 * venda, compra: valores da escritura (ou o valor patrimonial, se maior).
 * despesasCompra: IMT, selo, escritura e registo. obras: valorização dos
 * últimos 12 anos. despesasVenda: comissão de mediação e certificados.
 * reinvestimento: "hpp" | "arrendamento" | "poupanca" (65+), com o valor
 * reinvestido; divida: capital do crédito da compra, pago com a venda.
 * habitacaoPropria: era a habitação própria e permanente nos 12 meses
 * anteriores. outrosRendimentos: rendimento bruto anual de outras fontes,
 * para o escalão do IRS.
 */
export function calcularMaisValia({
  venda, compra, anoCompra, mesCompra = 1, mesVenda = 12,
  despesasCompra = 0, obras = 0, despesasVenda = 0,
  habitacaoPropria = false, reinvestimento = "hpp", reinvestido = 0, divida = 0,
  outrosRendimentos = 0,
}) {
  const V = Number(venda);
  const C = Number(compra);
  const ano = Number(anoCompra);
  if (!(V > 0) || !(C >= 0) || !Number.isFinite(ano) || ano < 1900) return null;
  if (ano < ANO_REGIME_TRANSITORIO) return { naoSujeito: true, imposto: 0, maisValia: 0, tributavel: 0 };

  const meses = mesesEntre(ano, Number(mesCompra), Number(mesVenda));
  const coeficiente = meses > 24 ? coeficienteDe(ano) ?? 1 : 1;
  const aquisicaoCorrigida = cent(C * coeficiente);
  const despesas = cent(Number(despesasCompra) + Number(obras) + Number(despesasVenda));
  const maisValia = cent(V - aquisicaoCorrigida - despesas);
  if (maisValia <= 0) {
    return { naoSujeito: false, coeficiente, aquisicaoCorrigida, despesas, maisValia, entraNoIrs: 0, excluido: 0, tributavel: 0, imposto: 0, aReinvestir: 0, fracaoExcluida: 0 };
  }

  const entraNoIrs = cent(maisValia * PERCENTAGEM_TRIBUTAVEL);
  const aReinvestir = Math.max(0, cent(V - Number(divida)));
  const elegivel = reinvestimento === "arrendamento" || habitacaoPropria;
  const fracaoExcluida = elegivel && aReinvestir > 0 ? Math.min(1, Number(reinvestido) / aReinvestir) : 0;
  const tributavel = cent(entraNoIrs * (1 - fracaoExcluida));
  const base = Math.max(0, Number(outrosRendimentos) - DEDUCAO_ESPECIFICA);
  const imposto = cent(coletaDe(base + tributavel) - coletaDe(base));
  return {
    naoSujeito: false, coeficiente, aquisicaoCorrigida, despesas, maisValia, entraNoIrs,
    aReinvestir, fracaoExcluida, excluido: cent(entraNoIrs - tributavel), tributavel, imposto,
    elegivelReinvestimento: elegivel,
  };
}
