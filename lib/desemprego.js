/*
 * Subsídio de desemprego (2026) — valor mensal e duração. Fonte única para
 * a página pública /subsidio-desemprego.
 *
 * Guia Prático "Subsídio de Desemprego" da Segurança Social (2026),
 * confirmado a 22/10/2026:
 *   - remuneração de referência (RR) = salários dos 12 meses (com
 *     subsídios de férias e de Natal) ÷ 12; para quem ganha sempre o
 *     mesmo, salário × 14 ÷ 12;
 *   - subsídio = 65% da RR, com os limites da secção L, por esta ordem:
 *     não passa de 75% da RR líquida (VLRR) nem de 2,5 × IAS; não fica
 *     abaixo do IAS (1,15 × IAS se a RR for pelo menos o salário mínimo),
 *     exceto se a VLRR for inferior ao IAS, caso em que recebe a VLRR;
 *     nunca passa da VLRR;
 *   - VLRR = RR − 11% − IRS (a Segurança Social usa a tabela de retenção
 *     em vigor; aqui, a de 2026);
 *   - +10% com o cônjuge também desempregado e filhos a cargo, ou família
 *     monoparental;
 *   - duração: Quadro I do Guia (idade e meses de descontos), mais um
 *     acréscimo por cada 5 anos de descontos nos últimos 20.
 */
import { retencaoIRS } from "./salario.js";

export const VERIFICADO_DESEMPREGO = "2026-10-22";
export const FONTE_GUIA_DESEMPREGO = "https://www.seg-social.pt/ptss/pssd/documento/cmc0debv9008agw2ys1kly9so";
export const IAS = 537.13;
export const SALARIO_MINIMO = 920;

// Meio cêntimo arredonda para cima, como no Guia (1459,30 × 0,75 = 1094,475 → 1094,48).
const cent = (v) => Math.round(v * 100 + 1e-6) / 100;

/*
 * rr: remuneração de referência mensal. taxaIrs: força uma taxa efetiva
 * de IRS (os exemplos do Guia usam a tabela de dezembro de 2025); sem
 * ela, usa a retenção de 2026 sobre a RR.
 */
export function valorSubsidio({ rr, situacao = "nao-casado", dependentes = 0, acrescimo = false, taxaIrs = null }) {
  const R = Number(rr);
  if (!(R > 0)) return null;
  const irs = taxaIrs != null ? cent(R * taxaIrs) : retencaoIRS(R, { situacao, dependentes });
  const vlrr = cent(R - cent(R * 0.11) - irs);
  const bruto = cent(R * 0.65);
  let valor = Math.min(bruto, cent(vlrr * 0.75), cent(2.5 * IAS));
  const piso = vlrr < IAS ? vlrr : R >= SALARIO_MINIMO ? cent(1.15 * IAS) : IAS;
  valor = Math.min(Math.max(valor, piso), vlrr);
  let limite = "65% da remuneração";
  if (valor === vlrr) limite = "remuneração líquida";
  else if (valor === piso && valor > bruto) limite = piso === IAS ? "mínimo (IAS)" : "mínimo (1,15 × IAS)";
  else if (valor === cent(2.5 * IAS)) limite = "máximo (2,5 × IAS)";
  else if (valor === cent(vlrr * 0.75)) limite = "75% do líquido";
  if (acrescimo) valor = cent(valor * 1.1);
  return { rr: R, bruto, vlrr, valor, limite };
}

/* Quadro I: [idade mínima, [até 15 meses, 15 a 24, 24 ou mais], acréscimo por 5 anos]. */
const QUADRO = [
  [50, [270, 480, 540], 60],
  [40, [210, 360, 540], 45],
  [30, [180, 330, 420], 30],
  [0, [150, 210, 330], 30],
];

/*
 * idade em anos; meses: meses com descontos (o Guia conta o registo de
 * remunerações); anos20: anos com descontos nos últimos 20.
 * Devolve null se não cumpre o prazo de garantia (12 meses de descontos).
 */
export function duracaoSubsidio({ idade, meses, anos20 = 0 }) {
  const m = Number(meses);
  if (!(m >= 12)) return null;
  const [, dias, porCinco] = QUADRO.find(([min]) => Number(idade) >= min);
  const base = m < 15 ? dias[0] : m < 24 ? dias[1] : dias[2];
  const extra = Math.floor(Math.min(Number(anos20) || 0, 20) / 5) * porCinco;
  return { base, extra, dias: base + extra, meses: Math.round(((base + extra) / 30) * 10) / 10 };
}
