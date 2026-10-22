import { test } from "node:test";
import assert from "node:assert/strict";
import { rendaAtualizada, calcularAtualizacao, COEFICIENTES, COEFICIENTE_2027 } from "../lib/rendas.js";

test("coeficiente de 2027 do Aviso do INE e a tabela do Portal da Habitação", () => {
  assert.equal(COEFICIENTE_2027, 1.0256);
  assert.equal(COEFICIENTES[2027], 1.0256);
  assert.equal(COEFICIENTES[2026], 1.0224);
  assert.equal(COEFICIENTES[2024], 1.0694);
});

test("renda atualizada: renda × 1,0256, ao cêntimo", () => {
  assert.equal(rendaAtualizada(750), 769.2); // exemplo publicado
  assert.equal(rendaAtualizada(1000), 1025.6);
  assert.equal(rendaAtualizada(480.5), 492.8);
});

test("aumento por mês e por ano", () => {
  const r = calcularAtualizacao({ renda: 800 });
  assert.equal(r.nova, 820.48);
  assert.equal(r.aumentoMensal, 20.48);
  assert.equal(r.aumentoAnual, 245.76);
  assert.equal(r.data, null);
});

test("a atualização vale no aniversário do contrato e a carta tem de chegar 30 dias antes", () => {
  const r = calcularAtualizacao({ renda: 750, inicio: "2026-02-01" });
  assert.equal(r.efeito, "2027-02-01");
  assert.equal(r.comunicarAte, "2027-01-02");
  const b = calcularAtualizacao({ renda: 750, inicio: "2020-06-15" });
  assert.equal(b.efeito, "2027-06-15");
  assert.equal(b.comunicarAte, "2027-05-16");
});

test("29 de fevereiro cai a 28 em 2027", () => {
  const r = calcularAtualizacao({ renda: 600, inicio: "2024-02-29" });
  assert.equal(r.efeito, "2027-02-28");
});

test("contratos que começam em 2027 só se atualizam em 2028", () => {
  const r = calcularAtualizacao({ renda: 700, inicio: "2027-03-10" });
  assert.equal(r.data, "adiada");
});

test("renda inválida devolve null", () => {
  assert.equal(calcularAtualizacao({ renda: 0 }), null);
});
