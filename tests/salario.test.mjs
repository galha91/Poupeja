import { test } from "node:test";
import assert from "node:assert/strict";
import { TABELAS_RETENCAO, retencaoIRS, salarioLiquido } from "../lib/salario.js";

/* Coluna "Taxa efetiva mensal de retenção no limite do escalão" do Despacho n.º 233-A/2026. */
const OFICIAL = {
  I: [0, 5.3, 7.2, 7.5, 8.1, 13.5, 16.0, 18.8, 23.6, 30.1, 40.9],
  III: [0, 2.2, 3.8, 3.9, 5.8, 8.5, 9.8, 12.3, 14.8, 20.8, 33.2],
};

for (const [t, esperado] of Object.entries(OFICIAL)) {
  test(`tabela ${t}: taxa efetiva no limite de cada linha igual à do Despacho`, () => {
    const situacao = t === "III" ? "casado-unico" : "nao-casado";
    const obtido = TABELAS_RETENCAO[t].slice(0, -1).map((l) => Math.round((retencaoIRS(l.ate, { situacao }) / l.ate) * 1000) / 10);
    assert.deepEqual(obtido, esperado);
  });
}

test("exemplo publicado: 1500 € sem dependentes retém 168,17 €", () => {
  assert.equal(retencaoIRS(1500), 168.17);
});

test("dependentes, 3 ou mais e nunca negativo", () => {
  assert.equal(retencaoIRS(1500, { dependentes: 1 }), 133.88); // tabela II: 168,17 − 34,29
  assert.equal(retencaoIRS(1500, { dependentes: 3 }), 50.3); // 1500 × 23,1% − 193,33 − 3 × 34,29
  assert.equal(retencaoIRS(950, { dependentes: 2 }), 0);
  assert.equal(retencaoIRS(920), 0);
});

test("novembro: metade, menos na última linha", () => {
  assert.equal(retencaoIRS(1500, { novembro: true }), 84.09);
  assert.equal(retencaoIRS(25000, { novembro: true }), retencaoIRS(25000));
});

test("líquido = bruto − 11% − IRS", () => {
  const r = salarioLiquido(1500);
  assert.equal(r.ss, 165);
  assert.equal(r.liquido, 1166.83);
  assert.equal(salarioLiquido(0), null);
});

/* Tabelas IV a VII: coluna oficial (sem dependentes). */
const OFICIAL_DEF = {
  IV: [0, 3.8, 8.5, 20.2, 21.2, 26.6, 38.9],
  V: [0, 1.3, 9.6, 18.8, 25.5, 25.9, 38.4],
  VI: [0, 4.0, 7.4, 12.1, 19.2, 25.7, 26.1, 38.5],
  VII: [0, 7.6, 8.9, 17.6, 34.3],
};
const SITUACAO_DEF = { IV: ["nao-casado", 0], V: ["nao-casado", 1], VI: ["casado-dois", 1], VII: ["casado-unico", 0] };

for (const [t, esperado] of Object.entries(OFICIAL_DEF)) {
  test(`tabela ${t} (deficiência): taxa efetiva no limite igual à do Despacho`, async () => {
    const { tabelaDe } = await import("../lib/salario.js");
    const [situacao, dep] = SITUACAO_DEF[t];
    assert.equal(tabelaDe(situacao, dep, true), t);
    // A coluna oficial é sem dependentes: calcula-se com 0 dependentes na mesma linha.
    const linhas = TABELAS_RETENCAO[t].slice(0, -1);
    const obtido = linhas.map((l) => {
      const r = l.ate * Math.max(0, l.taxa) - l.abater;
      return Math.round((Math.max(0, r) / l.ate) * 1000) / 10;
    });
    assert.deepEqual(obtido, esperado);
  });
}

test("IRS Jovem: taxa do salário todo, só sobre a parte não isenta, com limite mensal", async () => {
  const { IRS_JOVEM_LIMITE_MES } = await import("../lib/salario.js");
  assert.equal(IRS_JOVEM_LIMITE_MES, 2110.15);
  assert.equal(retencaoIRS(1500, { irsJovemAno: 1 }), 0); // 100% isento
  assert.equal(retencaoIRS(1500, { irsJovemAno: 2 }), 42.04); // 168,17 × 25%
  // 4000 € no 1.º ano: isenção limitada a 2110,15 €.
  const total = retencaoIRS(4000);
  assert.equal(retencaoIRS(4000, { irsJovemAno: 1 }), Math.round((total / 4000) * (4000 - 2110.15) * 100) / 100);
});

test("deficiência retém menos", () => {
  assert.equal(retencaoIRS(1500, { deficiencia: true }), 0);
  assert.ok(retencaoIRS(3000, { deficiencia: true }) < retencaoIRS(3000));
});
