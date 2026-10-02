import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirHistorico, avaliarPreco } from "../lib/historicoPrecos.js";

const linhas = [
  { dia: "2026-09-01", loja: "continente", valor: 2.0, produto: "A" },
  { dia: "2026-09-01", loja: "auchan", valor: 1.8, produto: "B" },
  { dia: "2026-09-02", loja: "continente", valor: 1.5, produto: "A" },
  { dia: "2026-09-02", loja: "auchan", valor: 3.0, produto: "B" },
  { dia: "2026-09-03", loja: "continente", valor: 2.4, produto: "A" },
];

test("mínimo e máximo do melhor preço de cada dia", () => {
  const r = resumirHistorico(linhas);
  assert.equal(r.dias, 3);
  assert.deepEqual(r.minimo, { valor: 1.5, dia: "2026-09-02", loja: "continente", produto: "A" });
  // O máximo é o pior "melhor do dia" (2,40), não o da loja mais cara (3,00).
  assert.deepEqual(r.maximo, { valor: 2.4, dia: "2026-09-03" });
});

test("menos de 3 dias não dá resumo", () => {
  assert.equal(resumirHistorico(linhas.slice(0, 3)), null);
  assert.equal(resumirHistorico([]), null);
});

test("avaliar se o preço de hoje é bom", () => {
  const h = { minimo: { valor: 1.5 }, maximo: { valor: 2.4 } };
  assert.equal(avaliarPreco(1.5, h), "minimo");
  assert.equal(avaliarPreco(1.4, h), "minimo");
  assert.equal(avaliarPreco(1.7, h), "bom");
  assert.equal(avaliarPreco(2.0, h), "normal");
  assert.equal(avaliarPreco(2.35, h), "alto");
  assert.equal(avaliarPreco(2.0, { minimo: { valor: 2.0 }, maximo: { valor: 2.0 } }), "minimo");
  assert.equal(avaliarPreco(2.1, { minimo: { valor: 2.0 }, maximo: { valor: 2.0 } }), "normal");
  assert.equal(avaliarPreco(2, null), null);
});
