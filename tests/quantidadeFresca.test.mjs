import { test } from "node:test";
import assert from "node:assert/strict";
import { custoParaQuantidade, comparaPorQuantidade, detalheQuantidade, textoPeso } from "../lib/quantidadeFresca.js";
import { melhoresPorLoja } from "../lib/comparacao.js";

const saco800 = { loja: "auchan", nome: "Maçã golden 800 g", preco: 0.99, precoUnidade: 1.24, unidade: "kg", qtdBase: 0.8, quantidade: "800 g", relevancia: 2 };
const saco15 = { loja: "pingo-doce", nome: "Maçã Gala 1,5 kg", preco: 1.89, precoUnidade: 1.26, unidade: "kg", qtdBase: 1.5, quantidade: "1,5 kg", relevancia: 2 };
const aoPeso = { loja: "continente", nome: "Maçã Fuji", preco: 1.69, precoUnidade: 1.69, unidade: "kg", aoPeso: true, qtdBase: 1, relevancia: 2 };

test("ao peso: €/kg × quantidade", () => {
  assert.equal(custoParaQuantidade(aoPeso, 0.5).custo, 0.85);
  assert.equal(custoParaQuantidade(aoPeso, 2).custo, 3.38);
  assert.equal(custoParaQuantidade(aoPeso, 1).embalagens, null);
});

test("embalagem: conta embalagens inteiras", () => {
  const c = custoParaQuantidade(saco800, 1);
  assert.equal(c.embalagens, 2);
  assert.equal(c.custo, 1.98);
  assert.equal(c.levas, 1.6);
  assert.equal(custoParaQuantidade(saco800, 0.5).embalagens, 1);
  assert.equal(custoParaQuantidade(saco15, 1).custo, 1.89);
});

test("folga: 980 g chega para 1 kg", () => {
  assert.equal(custoParaQuantidade({ ...saco800, qtdBase: 0.98 }, 1).embalagens, 1);
});

test("o vencedor muda com a quantidade", () => {
  const dados = { modo: "unidade", produtos: [saco800, saco15, aoPeso] };
  const por = (kg) => melhoresPorLoja(dados, "2026-11-05", { estrito: true, valor: (p) => custoParaQuantidade(p, kg).custo }).ranking[0].loja;
  assert.equal(melhoresPorLoja(dados, "2026-11-05").ranking[0].loja, "auchan"); // só €/kg
  assert.equal(por(0.5), "continente"); // 0,85 € ao peso
  assert.equal(por(0.8), "auchan"); // 0,99 € um saco
  assert.equal(por(1), "continente"); // 1,69 € vs 1,89 € vs 1,98 €
  assert.equal(por(1.5), "pingo-doce"); // 1,89 €
});

test("só ao kg e fora do modo embalagem", () => {
  assert.equal(comparaPorQuantidade({ modo: "unidade", unidade: "kg", frutaLegume: true }), true);
  assert.equal(comparaPorQuantidade({ modo: "unidade", unidade: "kg", produtos: [aoPeso] }), true);
  assert.equal(comparaPorQuantidade({ modo: "unidade", unidade: "kg", produtos: [saco800] }), false);
  assert.equal(comparaPorQuantidade({ modo: "unidade", unidade: "l", frutaLegume: true }), false);
  assert.equal(comparaPorQuantidade({ modo: "embalagem", unidade: "kg", frutaLegume: true }), false);
});

test("textos", () => {
  assert.equal(textoPeso(0.25), "250 g");
  assert.equal(textoPeso(1.5), "1,5 kg");
  assert.equal(detalheQuantidade(saco800, 1), "2 × 800 g · levas 1,6 kg");
  assert.equal(detalheQuantidade(saco800, 0.8), "800 g");
  assert.equal(detalheQuantidade(aoPeso, 1), "ao peso");
});
