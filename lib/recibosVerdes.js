/*
 * Recibos verdes (trabalhador independente, 2026): quanto sobra do que
 * faturas, depois da Segurança Social e do IRS. Fonte única para a página
 * pública /recibos-verdes. Confirmado a 22/10/2026.
 *
 * Segurança Social (Guia Prático "Novo Regime dos Trabalhadores
 * Independentes", jan. 2026): rendimento relevante = 70% dos serviços; base
 * mensal = rendimento relevante do trimestre ÷ 3, no máximo 12 × IAS
 * (6445,56 €); taxa de 21,4%; contribuição mínima de 20 € por mês. Sem
 * contribuições nos primeiros 12 meses de atividade.
 *
 * IRS, regime simplificado (CIRS art. 31.º): coeficiente de 0,75 nas
 * profissões da tabela do art. 151.º e de 0,35 nos outros serviços,
 * reduzido em 50% no ano de início e em 25% no seguinte. Deduz-se a parte
 * das contribuições que excede 10% do rendimento (n.º 2) e acresce o que
 * faltar para 15% do rendimento em despesas, onde conta a dedução
 * específica de 4587,09 € ou as contribuições, o que for maior (n.º 13).
 *
 * Retenção na fonte (art. 101.º): 23% nas profissões do art. 151.º e
 * 11,5% nos outros serviços, quando o cliente tem contabilidade
 * organizada. Dispensa abaixo de 15 000 € por ano (art. 101.º-B).
 * IVA: isento até 15 000 € por ano (art. 53.º do CIVA); acima, 23%.
 */
import { coletaDe, DEDUCAO_ESPECIFICA, IAS_2026 } from "./irs.js";

export const VERIFICADO_RECIBOS = "2026-10-22";
export const FONTE_GUIA_TI = "https://www.seg-social.pt/ptss/pssd/documento/cmc1xyfxz00dekl2ynxz676sw";
export const FONTE_ART31 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs31.aspx";
export const FONTE_ART101 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs101.aspx";
export const FONTE_ART101B = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs101b.aspx";
export const FONTE_ART53 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/artigo-53-o-do-civa.aspx";

export const TAXA_SS = 0.214;
export const PCT_RENDIMENTO_RELEVANTE = 0.7;
export const BASE_MAXIMA = Math.round(12 * IAS_2026 * 100) / 100; // 6445,56 €
export const CONTRIBUICAO_MINIMA = 20;
export const LIMITE_ISENCAO = 15000;
export const TAXA_IVA = 0.23;

export const TIPOS = {
  profissional: { nome: "Profissão da tabela do art. 151.º (consultor, designer, advogado…)", coeficiente: 0.75, retencao: 0.23 },
  servicos: { nome: "Outros serviços", coeficiente: 0.35, retencao: 0.115 },
};

const cent = (v) => Math.round(v * 100 + 1e-6) / 100;

/** Contribuição mensal à Segurança Social para um rendimento mensal (sem IVA). */
export function contribuicaoMensal(mensal) {
  const base = Math.min(PCT_RENDIMENTO_RELEVANTE * mensal, BASE_MAXIMA);
  return cent(Math.max(CONTRIBUICAO_MINIMA, base * TAXA_SS));
}

/*
 * mensal: o que faturas por mês, sem IVA (média do ano).
 * tipo: "profissional" | "servicos". inicio: 0 = mais de 2 anos de
 * atividade, 2 = 2.º ano, 1 = 1.º ano. retem: os clientes retêm IRS.
 */
export function calcularRecibosVerdes({ mensal, tipo = "profissional", inicio = 0, retem = true }) {
  const m = Number(mensal);
  if (!(m > 0)) return null;
  const t = TIPOS[tipo] || TIPOS.profissional;
  const R = cent(m * 12);

  const ss = inicio === 1 ? 0 : cent(contribuicaoMensal(m) * 12);

  const coef = t.coeficiente * (inicio === 1 ? 0.5 : inicio === 2 ? 0.75 : 1);
  let tributavel = R * coef;
  const dedSS = Math.min(Math.max(0, ss - 0.1 * R), tributavel);
  tributavel -= dedSS;
  const ssPorDeduzir = ss - dedSS;
  const acrescimo = Math.max(0, 0.15 * R - Math.max(DEDUCAO_ESPECIFICA, ssPorDeduzir));
  tributavel = cent(tributavel + acrescimo);
  const irs = cent(coletaDe(tributavel));

  const retido = retem ? cent(R * t.retencao) : 0;
  const iva = R > LIMITE_ISENCAO ? cent(R * TAXA_IVA) : 0;
  const liquido = cent(R - ss - irs);
  return {
    anual: R, ss, irs, tributavel, retido, iva, liquido,
    acerto: cent(irs - retido), // positivo = a pagar no IRS; negativo = reembolso
    liquidoMes: cent(liquido / 12),
    ssMes: cent(ss / 12),
    irsMes: cent(irs / 12),
    retidoMes: cent(retido / 12),
    guardarMes: cent((ss + irs) / 12),
    percentagem: cent(((ss + irs) / R) * 100),
  };
}
