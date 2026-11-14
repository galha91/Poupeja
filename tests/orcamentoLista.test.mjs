import { test } from "node:test";
import assert from "node:assert/strict";
import { avaliarOrcamento } from "../lib/orcamentoLista.js";
import { emPromocao } from "../lib/comparacao.js";

test("orçamento: cabe, passa e a escala da barra", () => {
  assert.equal(avaliarOrcamento(0, 40), null);
  assert.equal(avaliarOrcamento(30, 0), null);
  assert.equal(avaliarOrcamento(undefined, 40), null);

  const cabe = avaliarOrcamento(42.09, 60);
  assert.ok(cabe.dentro);
  assert.equal(cabe.diferenca, 17.91);
  assert.equal(cabe.posicaoOrcamento, 100);
  assert.equal(cabe.larguraTotal, 70.2);

  const passa = avaliarOrcamento(50, 40);
  assert.ok(!passa.dentro);
  assert.equal(passa.diferenca, 10);
  assert.equal(passa.larguraTotal, 100);
  assert.equal(passa.posicaoOrcamento, 80);

  // Ao cêntimo: 40,00 € num orçamento de 40 € cabe.
  assert.ok(avaliarOrcamento(40, 40).dentro);
  assert.equal(avaliarOrcamento(40.004, 40).diferenca, 0);
  assert.ok(!avaliarOrcamento(40.01, 40).dentro);
});

test("promoção: preço antigo mais alto ou etiqueta da loja", () => {
  assert.ok(emPromocao({ preco: 1.99, precoAntigo: 2.49 }));
  assert.ok(emPromocao({ preco: 1.99, precoAntigo: null, promo: "Promoção" }));
  assert.ok(!emPromocao({ preco: 1.99, precoAntigo: 1.99 }));
  assert.ok(!emPromocao({ preco: 1.99, precoAntigo: null, promo: null }));
  assert.ok(!emPromocao(null));
});
