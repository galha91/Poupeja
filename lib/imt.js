/*
 * IMT e Imposto do Selo na compra de casa (2026). Fonte única para a
 * página pública /imt.
 *
 * Tabelas práticas da AT para 2026 (Ofício-Circulado n.º 40129/2026, de
 * 6 de janeiro), que aplicam o art. 17.º do CIMT na redação da Lei
 * 73-A/2025: IMT = valor × taxa marginal − parcela a abater; nos dois
 * últimos escalões há taxa única sobre todo o valor. Nos Açores e na
 * Madeira os escalões são 25% mais altos (Lei 21/90). Confirmado a
 * 22/10/2026.
 *
 * IMT Jovem (art. 9.º, n.os 2 a 5, e art. 17.º, n.º 1, al. b) do CIMT;
 * art. 7.º-A do CIS): até 35 anos, primeira casa para habitação própria
 * e permanente. Isento até ao 1.º escalão da tabela jovem; até ao fim
 * do 8% paga só sobre o excesso; acima disso não há benefício. No
 * Imposto do Selo deduz-se até 0,8% do limite do 1.º escalão. Num casal,
 * cada um é avaliado pela sua metade (art. 9.º, n.º 4), com a taxa do
 * valor total (art. 17.º, n.º 6, al. b)).
 *
 * Imposto do Selo: 0,8% do valor da compra (verba 1.1 da TGIS) e 0,6% do
 * empréstimo a 5 anos ou mais (verba 17.1.3).
 */
export const VERIFICADO_IMT = "2026-10-22";
export const FONTE_TABELAS_IMT = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Oficio_circulado_40129_2026.pdf";
export const FONTE_ART17 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimt/Pages/cimt17.aspx";
export const FONTE_IMT_JOVEM = "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/IMT_Jovem/Pages/default.aspx";

export const TAXA_SELO_COMPRA = 0.008;
export const TAXA_SELO_CREDITO = 0.006;
export const TAXA_RUSTICO = 0.05;
export const TAXA_OUTROS = 0.065;

/* { ate, taxa, abater } ou { ate, taxa, unica: true } (taxa sobre todo o valor). */
export const TABELAS_IMT = {
  continente: {
    hpp: [
      { ate: 106346, taxa: 0, abater: 0 },
      { ate: 145470, taxa: 0.02, abater: 2126.92 },
      { ate: 198347, taxa: 0.05, abater: 6491.02 },
      { ate: 330539, taxa: 0.07, abater: 10457.96 },
      { ate: 660982, taxa: 0.08, abater: 13763.35 },
      { ate: 1150853, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
    jovem: [
      { ate: 330539, taxa: 0, abater: 0 },
      { ate: 660982, taxa: 0.08, abater: 26443.12 },
      { ate: 1150853, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
    habitacao: [
      { ate: 106346, taxa: 0.01, abater: 0 },
      { ate: 145470, taxa: 0.02, abater: 1063.46 },
      { ate: 198347, taxa: 0.05, abater: 5427.56 },
      { ate: 330539, taxa: 0.07, abater: 9394.5 },
      { ate: 633931, taxa: 0.08, abater: 12699.89 },
      { ate: 1150853, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
  },
  ilhas: {
    hpp: [
      { ate: 132933, taxa: 0, abater: 0 },
      { ate: 181838, taxa: 0.02, abater: 2658.66 },
      { ate: 247934, taxa: 0.05, abater: 8113.8 },
      { ate: 413174, taxa: 0.07, abater: 13072.48 },
      { ate: 826228, taxa: 0.08, abater: 17204.22 },
      { ate: 1438566, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
    jovem: [
      { ate: 413174, taxa: 0, abater: 0 },
      { ate: 826228, taxa: 0.08, abater: 33053.92 },
      { ate: 1438566, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
    habitacao: [
      { ate: 132933, taxa: 0.01, abater: 0 },
      { ate: 181838, taxa: 0.02, abater: 1329.33 },
      { ate: 247934, taxa: 0.05, abater: 6784.47 },
      { ate: 413174, taxa: 0.07, abater: 11743.15 },
      { ate: 792414, taxa: 0.08, abater: 15874.89 },
      { ate: 1438566, taxa: 0.06, unica: true },
      { ate: Infinity, taxa: 0.075, unica: true },
    ],
  },
};

const cent = (v) => Math.round(v * 100 + 1e-6) / 100;

/** IMT de uma tabela sobre o valor total. */
export function imtTabela(tabela, valor) {
  const l = tabela.find((x) => valor <= x.ate);
  return cent(Math.max(0, l.unica ? valor * l.taxa : valor * l.taxa - l.abater));
}

/* Até onde há benefício jovem: fim do escalão de 8% da tabela jovem. */
const limiteJovem = (regiao) => TABELAS_IMT[regiao].jovem[1].ate;
/* Dedução máxima no Imposto do Selo: 0,8% do 1.º escalão da tabela jovem (2644,31 € no continente). */
export const deducaoSeloJovem = (regiao = "continente") => cent(TABELAS_IMT[regiao].jovem[0].ate * TAXA_SELO_COMPRA);

/*
 * valor: o maior entre o preço e o valor patrimonial (VPT).
 * destino: "hpp" (habitação própria e permanente) | "habitacao" (segunda
 * casa, arrendar) | "rustico" | "outro" (loja, terreno para construção…).
 * compradores: 1 ou 2, em partes iguais. jovens: quantos deles podem usar
 * o IMT Jovem (só conta em "hpp"). emprestimo: valor do crédito, se houver.
 */
export function calcularImt({ valor, destino = "hpp", regiao = "continente", compradores = 1, jovens = 0, emprestimo = 0 }) {
  const v = Number(valor);
  if (!(v > 0)) return null;
  const n = Math.max(1, compradores);
  const nj = destino === "hpp" ? Math.min(Math.max(0, jovens), n) : 0;
  const t = TABELAS_IMT[regiao] || TABELAS_IMT.continente;

  let imtNormal;
  if (destino === "rustico") imtNormal = cent(v * TAXA_RUSTICO);
  else if (destino === "outro") imtNormal = cent(v * TAXA_OUTROS);
  else imtNormal = imtTabela(destino === "hpp" ? t.hpp : t.habitacao, v);
  const imtJovem = imtTabela(t.jovem, v);

  // Cada comprador declara a sua parte; a taxa é a do valor total.
  const jovemConta = nj > 0 && v <= limiteJovem(regiao);
  const seloParte = cent((v * TAXA_SELO_COMPRA) / n);
  const deducao = cent(deducaoSeloJovem(regiao) / n);
  let imt = 0;
  let selo = 0;
  for (let i = 0; i < n; i++) {
    const jovem = jovemConta && i < nj;
    imt += cent((jovem ? imtJovem : imtNormal) / n);
    selo += jovem ? Math.max(0, cent(seloParte - deducao)) : seloParte;
  }
  imt = cent(imt);
  selo = cent(selo);
  const seloCredito = emprestimo > 0 ? cent(emprestimo * TAXA_SELO_CREDITO) : 0;
  const semJovem = cent(imtNormal + v * TAXA_SELO_COMPRA);
  return {
    valor: v,
    imt,
    selo,
    seloCredito,
    total: cent(imt + selo + seloCredito),
    poupancaJovem: nj > 0 ? cent(semJovem - imt - selo) : 0,
    jovemSemBeneficio: nj > 0 && !jovemConta,
  };
}
