import { test } from "node:test";
import assert from "node:assert/strict";
import { quantidadeNaLista } from "../lib/receitas/paraLista.js";
import { doCatalogo } from "../lib/catalogoLista.js";

const q = (key, qn, u, compra) => quantidadeNaLista({ key, q: qn, u }, doCatalogo(compra));

test("receita para a lista: a quantidade da receita, arredondada para cima", () => {
  assert.deepEqual(q("bacalhau", 600, "g", "Bacalhau demolhado"), { qty: 1 });
  assert.deepEqual(q("bacalhau", 1500, "g", "Bacalhau demolhado"), { qty: 2 });
  assert.deepEqual(q("ovo", 9, "un", "Ovos"), { qty: 1 });
  assert.deepEqual(q("ovo", 13, "un", "Ovos"), { qty: 2 });
  assert.deepEqual(q("batata", 600, "g", "Batatas"), { kg: 0.75 });
  assert.deepEqual(q("batata", 2000, "g", "Batatas"), { kg: 2 });
  // Cebolas à unidade: peso médio do ingrediente (110 g) × 3 = 330 g.
  assert.deepEqual(q("cebola", 3, "un", "Cebolas"), { kg: 0.5 });
  assert.deepEqual(q("leite", 1500, "ml", "Leite meio-gordo"), { qty: 2 });
  assert.deepEqual(q("salsa", 0.75, "molho", "Salsa"), { qty: 1 });
});

test("receita para a lista: sem conversão possível fica 1", () => {
  assert.deepEqual(quantidadeNaLista({ key: "x", q: 2, u: "c. sopa" }, { un: "L" }), { qty: 1 });
  assert.deepEqual(quantidadeNaLista({ key: "x", q: 1, u: "q.b." }, null), { qty: 1 });
});
