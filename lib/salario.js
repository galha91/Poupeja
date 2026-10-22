/*
 * Salário líquido (Continente, 2026) — Segurança Social e retenção na
 * fonte de IRS do trabalho dependente. Fonte única para a página /salario-liquido.
 *
 * Tabelas I, II e III do Despacho n.º 233-A/2026, de 6 de janeiro (Diário
 * da República, 2.ª série), copiadas do PDF oficial a 22/10/2026.
 * Fórmula (n.º 3): R × taxa marginal − parcela a abater − parcela por
 * dependente × n.º de dependentes, nunca abaixo de zero. Com 3 ou mais
 * dependentes a taxa marginal baixa 1 ponto (n.º 5, h).
 *
 * Em novembro de 2026 a retenção sobre o que for pago nesse mês (salário
 * e subsídio de Natal) é metade, exceto na última linha de cada tabela
 * (Despacho n.º 12523-A/2026); em dezembro volta ao normal.
 *
 * Pessoa com deficiência (grau ≥ 60%): tabelas IV a VII do mesmo Despacho.
 * IRS Jovem (art. 12.º-B e 99.º-F, n.º 4, do CIRS): a taxa efetiva da
 * tabela calcula-se sobre o salário todo e aplica-se só à parte não
 * isenta; isenção mensal limitada a 55 × IAS / 14 (n.º 5, g, do Despacho).
 * Pensões, Açores e Madeira não entram aqui.
 */
export const VERIFICADO_SALARIO = "2026-10-22";
export const FONTE_RETENCAO = "https://files.diariodarepublica.pt/2s/2026/01/003000001/0000200010.pdf";
export const TAXA_SS_TRABALHADOR = 0.11;

/*
 * Linha: { ate, taxa, abater } com abater número, ou { fator, base } para
 * as linhas em que a parcela a abater é taxa × fator × (base − R).
 */
const NAO_CASADO = (porDep) => [
  { ate: 920, taxa: 0, abater: 0, dep: 0 },
  { ate: 1042, taxa: 0.125, fator: 2.6, base: 1273.85, dep: porDep },
  { ate: 1108, taxa: 0.157, fator: 1.35, base: 1554.83, dep: porDep },
  { ate: 1154, taxa: 0.157, abater: 94.71, dep: porDep },
  { ate: 1212, taxa: 0.212, abater: 158.18, dep: porDep },
  { ate: 1819, taxa: 0.241, abater: 193.33, dep: porDep },
  { ate: 2119, taxa: 0.311, abater: 320.66, dep: porDep },
  { ate: 2499, taxa: 0.349, abater: 401.19, dep: porDep },
  { ate: 3305, taxa: 0.3836, abater: 487.66, dep: porDep },
  { ate: 5547, taxa: 0.3969, abater: 531.62, dep: porDep },
  { ate: 20221, taxa: 0.4495, abater: 823.4, dep: porDep },
  { ate: Infinity, taxa: 0.4717, abater: 1272.31, dep: porDep },
];

export const TABELAS_RETENCAO = {
  // I — não casado sem dependentes ou casado dois titulares
  I: NAO_CASADO(21.43),
  // II — não casado com um ou mais dependentes
  II: NAO_CASADO(34.29),
  // III — casado, único titular
  III: [
    { ate: 991, taxa: 0, abater: 0, dep: 0 },
    { ate: 1042, taxa: 0.125, fator: 2.6, base: 1372.15, dep: 42.86 },
    { ate: 1108, taxa: 0.125, fator: 1.35, base: 1677.85, dep: 42.86 },
    { ate: 1119, taxa: 0.125, abater: 96.17, dep: 42.86 },
    { ate: 1432, taxa: 0.1272, abater: 98.64, dep: 42.86 },
    { ate: 1962, taxa: 0.157, abater: 141.32, dep: 42.86 },
    { ate: 2240, taxa: 0.1938, abater: 213.53, dep: 42.86 },
    { ate: 2773, taxa: 0.2277, abater: 289.47, dep: 42.86 },
    { ate: 3389, taxa: 0.257, abater: 370.72, dep: 42.86 },
    { ate: 5965, taxa: 0.2881, abater: 476.12, dep: 42.86 },
    { ate: 20265, taxa: 0.3843, abater: 1049.96, dep: 42.86 },
    { ate: Infinity, taxa: 0.4717, abater: 2821.13, dep: 42.86 },
  ],
};

// Tabelas IV a VII — titular com deficiência.
Object.assign(TABELAS_RETENCAO, {
  // IV — não casado ou casado dois titulares, sem dependentes
  IV: [
    { ate: 1694, taxa: 0, abater: 0, dep: 0 },
    { ate: 2063, taxa: 0.212, abater: 359.13, dep: 0 },
    { ate: 2492, taxa: 0.311, abater: 563.37, dep: 0 },
    { ate: 4487, taxa: 0.349, abater: 658.07, dep: 0 },
    { ate: 4753, taxa: 0.3836, abater: 813.33, dep: 0 },
    { ate: 6687, taxa: 0.3969, abater: 876.55, dep: 0 },
    { ate: 20468, taxa: 0.4495, abater: 1228.29, dep: 0 },
    { ate: Infinity, taxa: 0.4717, abater: 1682.68, dep: 0 },
  ],
  // V — não casado, com um ou mais dependentes
  V: [
    { ate: 1938, taxa: 0, abater: 0, dep: 0 },
    { ate: 2063, taxa: 0.2132, abater: 413.19, dep: 42.86 },
    { ate: 2854, taxa: 0.311, abater: 614.96, dep: 42.86 },
    { ate: 4504, taxa: 0.349, abater: 723.42, dep: 42.86 },
    { ate: 6826, taxa: 0.3836, abater: 879.26, dep: 42.86 },
    { ate: 7048, taxa: 0.3969, abater: 970.05, dep: 42.86 },
    { ate: 20468, taxa: 0.4495, abater: 1340.78, dep: 42.86 },
    { ate: Infinity, taxa: 0.4717, abater: 1795.17, dep: 42.86 },
  ],
  // VI — casado dois titulares, com um ou mais dependentes
  VI: [
    { ate: 1668, taxa: 0, abater: 0, dep: 0 },
    { ate: 2068, taxa: 0.2049, abater: 341.78, dep: 21.43 },
    { ate: 2497, taxa: 0.241, abater: 416.44, dep: 21.43 },
    { ate: 3107, taxa: 0.311, abater: 591.23, dep: 21.43 },
    { ate: 4504, taxa: 0.349, abater: 709.3, dep: 21.43 },
    { ate: 6826, taxa: 0.3836, abater: 865.14, dep: 21.43 },
    { ate: 7048, taxa: 0.3969, abater: 955.93, dep: 21.43 },
    { ate: 20468, taxa: 0.4495, abater: 1326.66, dep: 21.43 },
    { ate: Infinity, taxa: 0.4717, abater: 1781.05, dep: 21.43 },
  ],
  // VII — casado, único titular
  VII: [
    { ate: 2325, taxa: 0, abater: 0, dep: 0 },
    { ate: 3494, taxa: 0.2277, abater: 529.41, dep: 42.86 },
    { ate: 3761, taxa: 0.257, abater: 631.79, dep: 42.86 },
    { ate: 6687, taxa: 0.2881, abater: 748.76, dep: 42.86 },
    { ate: 20468, taxa: 0.4244, abater: 1660.2, dep: 42.86 },
    { ate: Infinity, taxa: 0.4717, abater: 2628.34, dep: 42.86 },
  ],
});

// IRS Jovem: % isenta por ano de rendimentos (art. 12.º-B, n.º 5) e limite mensal.
const IAS_2026 = 537.13;
export const IRS_JOVEM_PCT = [0, 1, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25, 0.25, 0.25];
export const IRS_JOVEM_LIMITE_MES = Math.round((55 * IAS_2026 / 14) * 100) / 100; // 2110,15 €

/* situacao: "nao-casado" | "casado-dois" | "casado-unico" */
export function tabelaDe(situacao, dependentes, deficiencia = false) {
  if (deficiencia) {
    if (situacao === "casado-unico") return "VII";
    if (dependentes > 0) return situacao === "casado-dois" ? "VI" : "V";
    return "IV";
  }
  if (situacao === "casado-unico") return "III";
  if (situacao === "nao-casado" && dependentes > 0) return "II";
  return "I";
}

const cent = (v) => Math.round(v * 100) / 100;

/** Retenção mensal de IRS sobre uma remuneração mensal R. */
export function retencaoIRS(R, { situacao = "nao-casado", dependentes = 0, novembro = false, deficiencia = false, irsJovemAno = 0 } = {}) {
  if (!(R > 0)) return 0;
  const n = Math.max(0, Math.min(10, Math.round(Number(dependentes) || 0)));
  const tabela = TABELAS_RETENCAO[tabelaDe(situacao, n, deficiencia)];
  const i = tabela.findIndex((l) => R <= l.ate);
  const linha = tabela[i];
  const taxa = Math.max(0, linha.taxa - (n >= 3 && linha.taxa > 0 ? 0.01 : 0));
  const abater = linha.fator ? linha.taxa * linha.fator * (linha.base - R) : linha.abater;
  let ret = Math.max(0, R * taxa - abater - linha.dep * n);
  // IRS Jovem: a taxa efetiva do salário todo só sobre a parte não isenta.
  const pct = IRS_JOVEM_PCT[Math.round(Number(irsJovemAno) || 0)] || 0;
  if (pct > 0) {
    const isento = Math.min(R * pct, IRS_JOVEM_LIMITE_MES);
    ret = (ret / R) * (R - isento);
  }
  // Novembro de 2026: metade, menos na última linha (acima do penúltimo escalão).
  if (novembro && i < tabela.length - 1) ret /= 2;
  return cent(ret);
}

/** Do bruto mensal ao líquido. */
export function salarioLiquido(bruto, opcoes = {}) {
  const b = Number(bruto);
  if (!(b > 0)) return null;
  const ss = cent(b * TAXA_SS_TRABALHADOR);
  const irs = retencaoIRS(b, opcoes);
  const liquido = cent(b - ss - irs);
  return { bruto: b, ss, irs, liquido, taxaIrs: irs / b, tabela: tabelaDe(opcoes.situacao || "nao-casado", Number(opcoes.dependentes) || 0, !!opcoes.deficiencia) };
}
