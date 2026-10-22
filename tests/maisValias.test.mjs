import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMaisValia, coeficienteDe, mesesEntre } from "../lib/maisValias.js";
import { coletaDe } from "../lib/irs.js";

test("coeficientes da Portaria 457/2026/1", () => {
  assert.deepEqual([1989, 2005, 2007, 2012, 2015, 2016, 2019, 2021, 2022, 2025].map(coeficienteDe), [3.07, 1.43, 1.35, 1.23, 1.23, 1.22, 1.2, 1.19, 1.08, 1]);
  assert.equal(coeficienteDe(1988), null);
});

test("mais-valia: venda − compra corrigida − despesas (exemplo com o coeficiente de 1,20)", () => {
  // 200 000 − 150 000 × 1,20 − 13 500 = 6500, comprada em 2019
  const r = calcularMaisValia({ venda: 200000, compra: 150000, anoCompra: 2019, mesCompra: 6, mesVenda: 6, despesasCompra: 13500 });
  assert.equal(r.coeficiente, 1.2);
  assert.equal(r.maisValia, 6500);
  assert.equal(r.entraNoIrs, 3250);
});

test("compra de 2005 vendida em 2026: coeficiente 1,43 e despesas somadas", () => {
  const r = calcularMaisValia({ venda: 350000, compra: 150000, anoCompra: 2005, despesasCompra: 7500, obras: 20000 });
  assert.equal(r.aquisicaoCorrigida, 214500);
  assert.equal(r.maisValia, 108000);
  assert.equal(r.entraNoIrs, 54000);
  assert.equal(r.imposto, Math.round(coletaDe(54000) * 100) / 100);
});

test("só há correção monetária se passaram mais de 24 meses", () => {
  assert.equal(mesesEntre(2024, 1, 12), 35);
  assert.equal(mesesEntre(2024, 6, 6), 24);
  const d = { venda: 300000, compra: 250000, anoCompra: 2024 };
  assert.equal(calcularMaisValia({ ...d, mesCompra: 1, mesVenda: 12 }).coeficiente, 1.02); // 35 meses
  assert.equal(calcularMaisValia({ ...d, mesCompra: 6, mesVenda: 6 }).coeficiente, 1); // 24 meses exatos
  assert.equal(calcularMaisValia({ ...d, anoCompra: 2025, mesCompra: 1, mesVenda: 12 }).coeficiente, 1); // 23 meses
});

test("imóveis comprados antes de 1989 não são tributados", () => {
  const r = calcularMaisValia({ venda: 300000, compra: 20000, anoCompra: 1985 });
  assert.equal(r.naoSujeito, true);
  assert.equal(r.imposto, 0);
});

test("perda: sem imposto", () => {
  const r = calcularMaisValia({ venda: 150000, compra: 200000, anoCompra: 2015 });
  assert.ok(r.maisValia < 0);
  assert.equal(r.imposto, 0);
});

test("reinvestimento parcial exclui a parte proporcional", () => {
  // Vende por 400 000 com 100 000 de crédito: reinvestir 300 000 exclui tudo. Reinvestindo 225 000 (75%) de 120 000 de mais-valia:
  const d = { venda: 400000, compra: 280000, anoCompra: 2025, mesCompra: 1, mesVenda: 12, habitacaoPropria: true, divida: 100000 };
  const r = calcularMaisValia({ ...d, reinvestido: 225000 });
  assert.equal(r.maisValia, 120000);
  assert.equal(r.aReinvestir, 300000);
  assert.equal(r.fracaoExcluida, 0.75);
  assert.equal(r.tributavel, 15000); // 50% de 120 000 = 60 000; só 25% fica
  assert.equal(calcularMaisValia({ ...d, reinvestido: 300000 }).tributavel, 0);
  assert.equal(calcularMaisValia({ ...d, reinvestido: 500000 }).imposto, 0);
});

test("reinvestir numa casa própria exige que a vendida fosse a habitação própria", () => {
  const d = { venda: 400000, compra: 280000, anoCompra: 2025, divida: 0, reinvestido: 400000 };
  assert.equal(calcularMaisValia({ ...d, habitacaoPropria: false }).tributavel, 60000);
  // O arrendamento acessível também vale para outras casas.
  assert.equal(calcularMaisValia({ ...d, habitacaoPropria: false, reinvestimento: "arrendamento" }).tributavel, 0);
});

test("o imposto depende dos outros rendimentos (englobamento)", () => {
  const d = { venda: 250000, compra: 150000, anoCompra: 2025 };
  const pobre = calcularMaisValia({ ...d, outrosRendimentos: 12000 }).imposto;
  const rico = calcularMaisValia({ ...d, outrosRendimentos: 80000 }).imposto;
  assert.ok(rico > pobre);
  assert.equal(calcularMaisValia({ ...d }).entraNoIrs, 50000);
});

test("faltam dados: devolve null", () => {
  assert.equal(calcularMaisValia({ venda: 0, compra: 1, anoCompra: 2010 }), null);
  assert.equal(calcularMaisValia({ venda: 100, compra: 1 }), null);
});
