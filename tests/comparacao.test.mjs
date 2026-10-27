import { test } from "node:test";
import assert from "node:assert/strict";
import { valeHoje, melhoresPorLoja, custoPorLoja, alternativas } from "../lib/comparacao.js";

const HOJE = "2026-10-27";
const p = (loja, id, precoUnidade, extra = {}) => ({ loja, id, nome: id, preco: precoUnidade, precoUnidade, unidade: "kg", relevancia: 2, ...extra });

test("vale hoje: promoção a decorrer, futura, acabada e só com cartão", () => {
  assert.equal(valeHoje(p("lidl", "a", 1), HOJE), true);
  assert.equal(valeHoje(p("lidl", "a", 1, { validoDe: "2026-10-27", validoAte: "2026-11-02" }), HOJE), true);
  assert.equal(valeHoje(p("lidl", "a", 1, { validoDe: "2026-11-03", validoAte: "2026-11-09" }), HOJE), false);
  assert.equal(valeHoje(p("lidl", "a", 1, { validoDe: "2026-10-20", validoAte: "2026-10-26" }), HOJE), false);
  assert.equal(valeHoje(p("lidl", "a", 1, { soComCartao: true }), HOJE), false);
});

test("o folheto da próxima semana não ganha a comparação de hoje", () => {
  const dados = { modo: "unidade", produtos: [
    p("lidl", "futuro", 0.99, { validoDe: "2026-11-03", validoAte: "2026-11-09" }),
    p("lidl", "plus", 1.09, { soComCartao: true }),
    p("lidl", "agora", 1.49, { validoDe: "2026-10-27", validoAte: "2026-11-02" }),
    p("continente", "c", 1.29),
  ] };
  const { ranking, melhores } = melhoresPorLoja(dados, HOJE);
  assert.deepEqual(ranking.map((x) => x.id), ["c", "agora"]);
  assert.equal(melhores.lidl.id, "agora");
});

test("sem nenhum preço válido numa loja, a loja sai da comparação", () => {
  const dados = { modo: "unidade", produtos: [p("lidl", "futuro", 0.99, { validoDe: "2026-11-03" }), p("aldi", "a", 1.2)] };
  assert.deepEqual(melhoresPorLoja(dados, HOJE).ranking.map((x) => x.loja), ["aldi"]);
});

test("um produto escolhido que já não vale hoje não entra na soma da lista", () => {
  const dados = { modo: "unidade", produtos: [p("lidl", "plus", 0.5, { soComCartao: true }), p("lidl", "n", 1.5), p("aldi", "a", 1)] };
  const r = custoPorLoja(dados, 1, { loja: "lidl", id: "plus" });
  assert.equal(r.custos.lidl.produto.id, "n");
  assert.ok(!alternativas({ ...dados, produtos: dados.produtos.map((x) => ({ ...x, relevancia: 1 })) }).some((x) => x.id === "plus"));
});
