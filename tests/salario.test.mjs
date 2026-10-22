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
