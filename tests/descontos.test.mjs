import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarDesconto, aplicarDescontos, centimosValidos, normalizarMarca } from "../lib/descontosCombustivel.js";

test("aplica o desconto da marca, sem olhar a maiúsculas", () => {
  const p = aplicarDesconto({ marca: "GALP", preco: 1.749 }, { galp: 10 });
  assert.equal(p.preco, 1.649);
  assert.equal(p.precoAfixado, 1.749);
  assert.equal(p.desconto, 10);
});

test("marca sem desconto fica igual (mesmo objeto)", () => {
  const p = { marca: "Prio", preco: 1.7 };
  assert.equal(aplicarDesconto(p, { galp: 10 }), p);
});

test("o desconto pode mudar quem é o mais barato", () => {
  const lista = aplicarDescontos([{ marca: "Prio", preco: 1.689 }, { marca: "Galp", preco: 1.749 }], { galp: 10 });
  const melhor = lista.reduce((a, b) => (b.preco < a.preco ? b : a));
  assert.equal(melhor.marca, "Galp");
});

test("campo da marca configurável (modo nacional usa 'posto')", () => {
  assert.equal(aplicarDesconto({ posto: "BP", preco: 1.8 }, { bp: 5 }, "posto").preco, 1.75);
});

test("só aceita cêntimos plausíveis", () => {
  assert.equal(centimosValidos("10"), 10);
  assert.equal(centimosValidos("2,5"), 2.5);
  assert.equal(centimosValidos("0"), null);
  assert.equal(centimosValidos("80"), null);
  assert.equal(centimosValidos("abc"), null);
  assert.equal(normalizarMarca("  Galp "), "galp");
});
