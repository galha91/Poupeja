import { test } from "node:test";
import assert from "node:assert/strict";
import { contribuicaoMensal, calcularRecibosVerdes, BASE_MAXIMA } from "../lib/recibosVerdes.js";
import { coletaDe } from "../lib/irs.js";

/* Exemplos do Guia Prático dos Trabalhadores Independentes (2026). */
test("Guia: 6000 € no trimestre dá 299,60 € por mês", () => {
  assert.equal(contribuicaoMensal(2000), 299.6);
});
test("Guia: sem rendimentos paga o mínimo de 20 €", () => {
  assert.equal(contribuicaoMensal(10), 20);
});
test("Guia: limite de 12 × IAS (6445,56 €)", () => {
  assert.equal(BASE_MAXIMA, 6445.56);
  assert.equal(contribuicaoMensal(20000), 1379.35);
});

test("2000 €/mês, profissional, mais de 2 anos", () => {
  const r = calcularRecibosVerdes({ mensal: 2000 });
  assert.equal(r.anual, 24000);
  assert.equal(r.ss, 3595.2);
  // 24000 × 0,75 = 18000; menos 1195,20 de SS acima de 10% → 16804,80
  assert.equal(r.tributavel, 16804.8);
  assert.equal(r.irs, Math.round(coletaDe(16804.8) * 100) / 100);
  assert.ok(Math.abs(r.irs - 2603.39) < 0.01);
  assert.equal(r.retido, 5520);
  assert.equal(r.acerto, Math.round((r.irs - 5520) * 100) / 100);
  assert.equal(r.liquido, Math.round((24000 - r.ss - r.irs) * 100) / 100);
  assert.equal(r.iva, 5520);
});

test("outros serviços: coeficiente de 0,35 e retenção de 11,5%", () => {
  const r = calcularRecibosVerdes({ mensal: 2000, tipo: "servicos" });
  // 8400 − 1195,20 = 7204,80, mas a regra dos 15% acrescenta 3600 − 4587,09 < 0 → nada
  assert.equal(r.tributavel, 7204.8);
  assert.equal(r.retido, 2760);
});

test("1.º ano: sem Segurança Social e coeficiente a metade", () => {
  const r = calcularRecibosVerdes({ mensal: 1500, inicio: 1 });
  assert.equal(r.ss, 0);
  assert.equal(r.tributavel, 6750); // 18000 × 0,75 × 0,5
  // 15% de 18000 = 2700, abaixo da dedução específica: nada a acrescentar
});

test("2.º ano: coeficiente reduzido em 25%", () => {
  const r = calcularRecibosVerdes({ mensal: 1500, inicio: 2 });
  assert.ok(r.ss > 0);
  assert.equal(r.tributavel, Math.round((18000 * 0.75 * 0.75 - (r.ss - 1800)) * 100) / 100);
});

test("600 €/mês: a SS acima de 10% do rendimento abate à base", () => {
  // SS = 89,88 × 12 = 1078,56; 10% de 7200 = 720; abate 358,56 a 5400
  assert.equal(calcularRecibosVerdes({ mensal: 600 }).tributavel, 5041.44);
});

test("rendimento alto: acrescenta o que faltar para 15% do rendimento", () => {
  // 4000 €/mês → 48000; SS 7190,40; abate 2390,40 a 36000; faltam 7200 − 4800 = 2400
  const r = calcularRecibosVerdes({ mensal: 4000 });
  assert.equal(r.ss, 7190.4);
  assert.equal(r.tributavel, 36009.6);
});

test("isento de IVA até 15 000 € por ano", () => {
  assert.equal(calcularRecibosVerdes({ mensal: 1250 }).iva, 0);
  assert.ok(calcularRecibosVerdes({ mensal: 1251 }).iva > 0);
});

test("sem retenção quando os clientes não retêm", () => {
  assert.equal(calcularRecibosVerdes({ mensal: 2000, retem: false }).retido, 0);
  assert.equal(calcularRecibosVerdes({ mensal: 0 }), null);
});
