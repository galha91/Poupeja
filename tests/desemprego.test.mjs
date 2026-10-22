import { test } from "node:test";
import assert from "node:assert/strict";
import { valorSubsidio, duracaoSubsidio } from "../lib/desemprego.js";

/* Exemplos da secção L do Guia Prático (2026). */
test("Guia, exemplo 1: VLRR abaixo do IAS recebe a VLRR", () => {
  assert.equal(valorSubsidio({ rr: 350 }).valor, 311.5);
});
test("Guia, exemplo 2", () => {
  assert.equal(valorSubsidio({ rr: 583.33 }).valor, 519.16);
});
test("Guia, exemplo 3: sobe ao IAS", () => {
  assert.equal(valorSubsidio({ rr: 641.67 }).valor, 537.13);
});
test("Guia, exemplo 4: RR acima do salário mínimo sobe a 1,15 IAS", () => {
  assert.equal(valorSubsidio({ rr: 921.67 }).valor, 617.7);
});
test("Guia, exemplo 5: 75% do líquido (IRS de 14,1%)", () => {
  const r = valorSubsidio({ rr: 1948.33, taxaIrs: 0.141 });
  assert.equal(r.vlrr, 1459.3);
  assert.equal(r.valor, 1094.48);
});
test("Guia, exemplo 6: máximo de 2,5 IAS", () => {
  const r = valorSubsidio({ rr: 2800, taxaIrs: 0.192 });
  assert.equal(r.vlrr, 1954.4);
  assert.equal(r.valor, 1342.83); // 75% do líquido = 1465,80, acima do máximo de 2,5 IAS
});
test("acréscimo de 10%", () => {
  assert.equal(valorSubsidio({ rr: 921.67, acrescimo: true }).valor, 679.47);
});
test("duração pelo Quadro I, com acréscimo por cada 5 anos nos últimos 20", () => {
  assert.equal(duracaoSubsidio({ idade: 28, meses: 14 }).dias, 150);
  assert.equal(duracaoSubsidio({ idade: 35, meses: 30, anos20: 10 }).dias, 420 + 60);
  assert.equal(duracaoSubsidio({ idade: 45, meses: 20, anos20: 20 }).dias, 360 + 180);
  assert.equal(duracaoSubsidio({ idade: 55, meses: 300, anos20: 20 }).dias, 540 + 240);
  assert.equal(duracaoSubsidio({ idade: 40, meses: 11 }), null);
});
