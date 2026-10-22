import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularIuc, categoriaIuc, coeficienteB } from "../lib/iuc.js";

test("categoria A é até 30/06/2007 e B a partir de 01/07/2007", () => {
  assert.equal(categoriaIuc(2007, 6), "A");
  assert.equal(categoriaIuc(2007, 7), "B");
  assert.equal(categoriaIuc(2003), "A");
  assert.equal(categoriaIuc(2015), "B");
});

test("categoria A: valor por cilindrada e ano", () => {
  assert.equal(calcularIuc({ combustivel: "gasolina", cilindrada: 1400, ano: 2003 }).valor, 62.4);
  assert.equal(calcularIuc({ combustivel: "gasolina", cilindrada: 3600, ano: 1992 }).valor, 263.11);
  assert.equal(calcularIuc({ combustivel: "eletrico", voltagem: 120, ano: 2000 }).valor, 39.95);
});

test("categoria A: gasóleo soma a taxa adicional", () => {
  assert.equal(calcularIuc({ combustivel: "gasoleo", cilindrada: 1800, ano: 1998 }).valor, 46.26); // 39,95 + 6,31
  assert.equal(calcularIuc({ combustivel: "gasoleo", cilindrada: 3200, ano: 1992 }).valor, 96.68); // 83,49 + 13,19
});

test("categoria A: antes de 1981 não paga e abaixo de 10 € não há cobrança", () => {
  assert.equal(calcularIuc({ combustivel: "gasolina", cilindrada: 2000, ano: 1975 }).devido, 0);
  const r = calcularIuc({ combustivel: "gasolina", cilindrada: 900, ano: 1985 });
  assert.equal(r.valor, 8.8);
  assert.equal(r.devido, 0);
});

test("categoria B: (cilindrada + CO2) × coeficiente", () => {
  // Exemplo publicado: (31,77 + 97,63) × 1,15 = 148,81
  assert.equal(calcularIuc({ combustivel: "gasolina", cilindrada: 1199, ano: 2015, co2: 130, norma: "nedc" }).valor, 148.81);
});

test("categoria B: gasóleo soma a taxa adicional depois do coeficiente", () => {
  // (63,74 + 65,15) × 1,15 + 10,07
  assert.equal(calcularIuc({ combustivel: "gasoleo", cilindrada: 1598, ano: 2018, co2: 99, norma: "nedc" }).valor, 158.29);
  // (127,35 + 65,15) × 1,15 + 20,12
  assert.equal(calcularIuc({ combustivel: "gasoleo", cilindrada: 2000, ano: 2020, co2: 120, norma: "nedc" }).valor, 241.5);
});

test("categoria B: taxa adicional de CO2 só de 2017 em diante", () => {
  const novo = calcularIuc({ combustivel: "gasolina", cilindrada: 2997, ano: 2018, co2: 207, norma: "nedc" });
  assert.equal(novo.valor, 781.6); // (435,84 + 212,04 + 31,77) × 1,15
  const antigo = calcularIuc({ combustivel: "gasolina", cilindrada: 2997, ano: 2016, co2: 207, norma: "nedc" });
  assert.equal(antigo.valor, 745.06); // (435,84 + 212,04) × 1,15
});

test("categoria B: coeficiente por ano de matrícula", () => {
  assert.deepEqual([2007, 2008, 2009, 2010, 2024].map(coeficienteB), [1, 1.05, 1.1, 1.15, 1.15]);
  const d = { combustivel: "gasolina", cilindrada: 1000, co2: 100, norma: "nedc" };
  assert.equal(calcularIuc({ ...d, ano: 2007, mes: 9 }).valor, 96.92);
  assert.equal(calcularIuc({ ...d, ano: 2008 }).valor, 101.77);
});

test("escalões de CO2 diferem entre WLTP e NEDC", () => {
  const d = { combustivel: "gasolina", cilindrada: 1000, ano: 2020 };
  assert.equal(calcularIuc({ ...d, co2: 140, norma: "wltp" }).taxaCo2, 65.15);
  assert.equal(calcularIuc({ ...d, co2: 141, norma: "wltp" }).taxaCo2, 97.63);
  assert.equal(calcularIuc({ ...d, co2: 121, norma: "nedc" }).taxaCo2, 97.63);
});

test("elétricos da categoria B estão isentos; faltando dados devolve null", () => {
  assert.equal(calcularIuc({ combustivel: "eletrico", ano: 2022 }).devido, 0);
  assert.equal(calcularIuc({ combustivel: "gasolina", ano: 2020, cilindrada: 1000 }), null);
  assert.equal(calcularIuc({ combustivel: "gasolina", ano: 2020, co2: 100 }), null);
});
