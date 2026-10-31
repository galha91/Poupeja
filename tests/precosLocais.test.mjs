import { test } from "node:test";
import assert from "node:assert/strict";
import { compactar } from "../lib/precosLocais.js";
import { custoPorLoja } from "../lib/comparacao.js";

const dados = {
  q: "leite", modo: "unidade", nomeUnidade: "L", obtidoEm: "2026-10-01T10:00:00Z",
  lojas: [{ id: "continente", nome: "Continente", ok: true, total: 3 }, { id: "auchan", nome: "Auchan", ok: true, total: 2 }],
  produtos: [
    { loja: "continente", lojaNome: "Continente", nome: "Leite 1L", preco: 0.85, precoUnidade: 0.85, unidade: "l", qtdBase: 1, relevancia: 2, imagem: "x.jpg" },
    { loja: "auchan", lojaNome: "Auchan", nome: "Leite 6x1L", preco: 4.8, precoUnidade: 0.8, unidade: "l", qtdBase: 6, relevancia: 2 },
    { loja: "continente", lojaNome: "Continente", nome: "Leite 6x1L", preco: 5.4, precoUnidade: 0.9, unidade: "l", qtdBase: 6, relevancia: 2 },
    { loja: "continente", lojaNome: "Continente", nome: "Leite com chocolate", preco: 0.5, precoUnidade: 0.5, unidade: "l", relevancia: 1 },
    { loja: "auchan", lojaNome: "Auchan", nome: "Leite em pó", preco: 5, precoUnidade: 10, unidade: "kg", relevancia: 2 },
  ],
};

test("a versão compacta dá o mesmo custo por loja que a resposta inteira", () => {
  const c = compactar(dados);
  assert.equal(c.produtos.length, 2);
  assert.ok(!("imagem" in c.produtos[0]));
  const resumo = (r) => ({ ref: r.referencia, custos: Object.fromEntries(Object.entries(r.custos).map(([k, v]) => [k, [v.custo, v.produto.nome]])) });
  assert.deepEqual(resumo(custoPorLoja(c, 2)), resumo(custoPorLoja(dados, 2)));
});

test("guardado no dispositivo: só o que é mesmo o artigo (sem os parecidos como se fossem)", async () => {
  const { compactar } = await import("../lib/precosLocais.js");
  const p = (loja, nome, rel, extra = {}) => ({ loja, lojaNome: loja, id: nome, nome, preco: 3, precoUnidade: 3, unidade: "kg", relevancia: rel, ...extra });
  // Sem resultado direto: não guarda o «Pão de Hambúrguer» como se fosse hambúrguer.
  assert.deepEqual(compactar({ q: "hambúrguer", modo: "unidade", lojas: [], produtos: [p("continente", "Pão de Hambúrguer", 1)] }).produtos, []);
  // Com resultado direto: guarda-o, e a variante fica marcada.
  const g = compactar({ q: "leite", modo: "unidade", lojas: [], produtos: [p("continente", "Leite Magro", 2, { variante: true }), p("pingo-doce", "Leite", 2)] });
  assert.deepEqual(g.produtos.map((x) => [x.loja, x.variante || false]), [["continente", true], ["pingo-doce", false]]);
});
