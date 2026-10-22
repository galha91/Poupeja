import { test } from "node:test";
import assert from "node:assert/strict";
import { limitesEscalao, escalaoAbono, calcularAbono } from "../lib/abono.js";

test("limites dos escalões iguais aos do Guia Prático", () => {
  assert.deepEqual(limitesEscalao(2025), [3657.5, 7315, 12435.5, 18287.5]);
  assert.deepEqual(limitesEscalao(2024), [3564.82, 7129.64, 12120.36, 17824.1]);
  assert.equal(escalaoAbono(3657.5), 1);
  assert.equal(escalaoAbono(3657.51), 2);
  assert.equal(escalaoAbono(20000), 5);
});

test("uma criança: rendimento a dividir por 2", () => {
  const r = calcularAbono({ rendimentoAnual: 14000, idades: ["mais6"] });
  assert.equal(r.referencia, 7000);
  assert.equal(r.escalao, 2);
  assert.equal(r.total, 75.13);
});

test("4.º escalão não paga acima de 6 anos; 5.º não paga", () => {
  assert.equal(calcularAbono({ rendimentoAnual: 30000, idades: ["mais6"] }).total, 0); // 15000 → 4.º
  assert.equal(calcularAbono({ rendimentoAnual: 30000, idades: ["de3a6"] }).total, 44.77);
  assert.equal(calcularAbono({ rendimentoAnual: 40000, idades: ["ate3"] }).escalao, 5);
});

test("majoração: segundo titular até 36 meses; mais de dois titulares", () => {
  // 2 crianças, rendimento 9000 → referência 3000 → 1.º escalão.
  const dois = calcularAbono({ rendimentoAnual: 9000, idades: ["ate3", "ate3"] });
  assert.equal(dois.total, 446.92); // 2 × 190,98 + 64,96
  const tres = calcularAbono({ rendimentoAnual: 9000, idades: ["ate3", "mais6", "mais6"] });
  // O bebé é o titular mais novo (não é o primeiro): leva a majoração de mais de dois titulares.
  assert.equal(tres.total, Math.round((190.98 + 106.96 + 75.13 * 2) * 100) / 100);
});

test("monoparental: +50%", () => {
  assert.equal(calcularAbono({ rendimentoAnual: 14000, idades: ["mais6"], monoparental: true }).total, 112.7);
});

test("majoração aparece no segundo filho", () => {
  const r = calcularAbono({ rendimentoAnual: 18000, idades: ["ate3", "ate3"] });
  assert.deepEqual(r.criancas.map((c) => c.valor), [161.65, 219.29]);
});
