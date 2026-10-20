import { test } from "node:test";
import assert from "node:assert/strict";
import { taxaAnual, prestacao, mesesParaPagar, simular } from "../lib/credito.js";

const perto = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test("Euribor negativa conta como zero", () => {
  assert.equal(taxaAnual(-0.5, 1.2), 1.2);
  perto(taxaAnual(2.922, 1.2), 4.122, 1e-9);
});

test("prestação do método francês", () => {
  // 150 000 € a 4% em 30 anos: 716,12 € (valor de referência das calculadoras)
  perto(prestacao(150000, 4, 360), 716.12);
  // taxa zero: só capital
  perto(prestacao(120000, 0, 240), 500);
  assert.equal(prestacao(0, 4, 360), 0);
});

test("meses para pagar é o inverso da prestação", () => {
  const pmt = prestacao(150000, 4, 360);
  assert.equal(mesesParaPagar(150000, 4, pmt), 360);
  assert.equal(mesesParaPagar(120000, 0, 500), 240);
  // prestação que não chega para os juros
  assert.equal(mesesParaPagar(150000, 4, 400), null);
});

test("amortizar a baixar a prestação mantém o prazo", () => {
  const s = simular({ capital: 150000, spread: 1, euribor: 3, anos: 30, amortizacao: 15000, modo: "prestacao" });
  perto(s.prestacao, prestacao(135000, 4, 360));
  assert.equal(s.meses, 360);
  assert.ok(s.poupancaJuros > 0);
});

test("amortizar a reduzir o prazo mantém a prestação e poupa mais juros", () => {
  const base = { capital: 150000, spread: 1, euribor: 3, anos: 30, amortizacao: 15000 };
  const p = simular({ ...base, modo: "prestacao" });
  const z = simular({ ...base, modo: "prazo" });
  perto(z.prestacao, prestacao(150000, 4, 360));
  assert.ok(z.meses < 360);
  assert.ok(z.poupancaJuros > p.poupancaJuros);
});

test("amortizar tudo zera o crédito", () => {
  const s = simular({ capital: 50000, spread: 1, euribor: 3, anos: 10, amortizacao: 80000 });
  assert.equal(s.prestacao, 0);
  assert.equal(s.meses, 0);
});
