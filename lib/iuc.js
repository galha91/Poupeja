/*
 * IUC 2026 para automóveis ligeiros de passageiros. Fonte única para a
 * página pública /iuc. Confirmado a 22/10/2026.
 *
 * Tabelas do Código do IUC (Lei 22-A/2007, art. 9.º e 10.º) com os valores
 * de 2026, iguais aos de 2024 e 2025 (Lei 73-A/2025 não os atualiza), como
 * publica o ACP e confirma uma segunda fonte. Os coeficientes por ano de
 * matrícula vêm do texto do art. 10.º no Portal das Finanças.
 *
 *   - Categoria A (até 30/06/2007): valor por cilindrada, combustível e
 *     ano da matrícula. Antes de 1981 não paga. Gasóleo soma uma taxa
 *     adicional por escalão.
 *   - Categoria B (a partir de 01/07/2007): (cilindrada + CO2) × coeficiente
 *     do ano da matrícula; gasóleo soma uma taxa adicional por cilindrada;
 *     matrícula de 2017 em diante soma uma taxa adicional de CO2 nos dois
 *     escalões mais altos. Elétricos puros estão isentos.
 *   - Abaixo de 10 € não há pagamento (art. 16.º, n.º 6).
 */
export const VERIFICADO_IUC = "2026-10-22";
export const FONTE_TABELAS_IUC = "https://www.acp.pt/veiculos/fiscalidade/imposto-unico-de-circulacao";
export const FONTE_ART9_IUC = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/iuc/Pages/iuc9.aspx";
export const FONTE_ART10_IUC = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/iuc/Pages/iuc10.aspx";
export const FONTE_DL_161_2026 = "https://diariodarepublica.pt/dr/detalhe/decreto-lei/161-2026-1154275218";

export const MINIMO_COBRANCA = 10;

/* Categoria A: linhas = escalões 1 a 6; colunas = ano da matrícula. */
const VALORES_A = {
  pos1995: [19.9, 39.95, 62.4, 158.31, 287.49, 512.23],
  de1990: [12.55, 22.45, 34.87, 83.49, 156.54, 263.11],
  de1981: [8.8, 12.55, 17.49, 36.09, 79.72, 120.9],
};
const ADICIONAL_GASOLEO_A = {
  pos1995: [3.14, 6.31, 9.86, 25.01],
  de1990: [1.98, 3.55, 5.51, 13.19],
  de1981: [1.39, 1.98, 2.76, 5.7],
};
const LIMITES_GASOLINA_A = [1000, 1300, 1750, 2600, 3500, Infinity];
const LIMITES_GASOLEO_A = [1500, 2000, 3000, Infinity];

/* Categoria B. */
const LIMITES_CILINDRADA_B = [1250, 1750, 2500, Infinity];
const TAXA_CILINDRADA_B = [31.77, 63.74, 127.35, 435.84];
const LIMITES_CO2 = { nedc: [120, 180, 250, Infinity], wltp: [140, 205, 260, Infinity] };
const TAXA_CO2_B = [65.15, 97.63, 212.04, 363.25];
const ADICIONAL_CO2_2017 = [0, 0, 31.77, 63.74];
const ADICIONAL_GASOLEO_B = [5.02, 10.07, 20.12, 68.85];
export const COEFICIENTES_B = { 2007: 1, 2008: 1.05, 2009: 1.1 }; // 2010 e seguintes: 1,15
export const coeficienteB = (ano) => COEFICIENTES_B[ano] ?? 1.15;

const cent = (v) => Math.round(v * 100 + 1e-6) / 100;
const escalao = (limites, v) => limites.findIndex((l) => v <= l);

/** Categoria do Código do IUC: A até 30/06/2007, B a partir de 01/07/2007. */
export const categoriaIuc = (ano, mes = 7) => (ano < 2007 || (ano === 2007 && mes <= 6) ? "A" : "B");

/*
 * combustivel: "gasolina" | "gasoleo" | "eletrico". ano e mes: primeira
 * matrícula (o mês só conta em 2007). cilindrada em cm³; voltagem (só
 * elétricos da categoria A); co2 em g/km e norma "wltp" | "nedc" (só B).
 * devolve null se faltar um dado.
 */
export function calcularIuc({ combustivel, cilindrada, ano, mes = 7, co2, norma = "wltp", voltagem }) {
  const a = Number(ano);
  if (!Number.isFinite(a) || a < 1900) return null;
  const cat = categoriaIuc(a, Number(mes));

  if (cat === "A") {
    if (a < 1981) return { categoria: "A", valor: 0, devido: 0, motivo: "Carros matriculados antes de 1981 não pagam IUC." };
    const col = a >= 1996 ? "pos1995" : a >= 1990 ? "de1990" : "de1981";
    let base;
    let adicional = 0;
    if (combustivel === "eletrico") {
      const v = Number(voltagem);
      if (!(v > 0)) return null;
      base = VALORES_A[col][v <= 100 ? 0 : 1];
    } else {
      const c = Number(cilindrada);
      if (!(c > 0)) return null;
      if (combustivel === "gasoleo") {
        const i = escalao(LIMITES_GASOLEO_A, c);
        base = VALORES_A[col][i];
        adicional = ADICIONAL_GASOLEO_A[col][i];
      } else {
        base = VALORES_A[col][escalao(LIMITES_GASOLINA_A, c)];
      }
    }
    const valor = cent(base + adicional);
    return { categoria: "A", base, adicional, valor, devido: valor < MINIMO_COBRANCA ? 0 : valor };
  }

  if (combustivel === "eletrico") {
    return { categoria: "B", valor: 0, devido: 0, motivo: "Os carros 100% elétricos estão isentos de IUC." };
  }
  const c = Number(cilindrada);
  const g = Number(co2);
  if (!(c > 0) || !(g >= 0) || co2 === "" || co2 == null) return null;
  const taxaCilindrada = TAXA_CILINDRADA_B[escalao(LIMITES_CILINDRADA_B, c)];
  const iCo2 = escalao(LIMITES_CO2[norma] || LIMITES_CO2.wltp, g);
  const taxaCo2 = TAXA_CO2_B[iCo2];
  const adicionalCo2 = a >= 2017 ? ADICIONAL_CO2_2017[iCo2] : 0;
  const coeficiente = coeficienteB(a);
  const adicionalGasoleo = combustivel === "gasoleo" ? ADICIONAL_GASOLEO_B[escalao(LIMITES_CILINDRADA_B, c)] : 0;
  const valor = cent((taxaCilindrada + taxaCo2 + adicionalCo2) * coeficiente + adicionalGasoleo);
  return {
    categoria: "B", taxaCilindrada, taxaCo2, adicionalCo2, coeficiente, adicionalGasoleo,
    valor, devido: valor < MINIMO_COBRANCA ? 0 : valor,
  };
}
