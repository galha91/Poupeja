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

test("sem nada que seja mesmo o artigo, a soma da lista não usa o parecido", async () => {
  const { eGenerico, exemplosGenerico } = await import("../lib/comparacao.js");
  const dados = { modo: "unidade", produtos: [p("continente", "pao-hamburguer", 3.22, { relevancia: 1 })] };
  assert.deepEqual(custoPorLoja(dados).custos, {});
  // Escolhido à mão, vale.
  const c = custoPorLoja(dados, 2, { loja: "continente", id: "pao-hamburguer" }).custos;
  assert.equal(c.continente.custo, 6.44);
  // O ecrã "Comparar preços" continua a mostrar o parecido quando não há mais nada.
  assert.equal(melhoresPorLoja(dados, HOJE).ranking.length, 1);
  assert.ok(eGenerico("Fruta") && eGenerico("frutas") && eGenerico(" Legumes ") && eGenerico("Carne"));
  assert.ok(!eGenerico("Maçãs") && !eGenerico("Carne picada") && !eGenerico("Fruta da época"));
  assert.match(exemplosGenerico("Fruta"), /maçãs/);
});

test("em cada loja, a versão normal ganha à variante; preços de leitura absurdos saem", async () => {
  const { semAbsurdos } = await import("../lib/comparacao.js");
  const dados = { modo: "unidade", produtos: [
    p("continente", "magra", 7.96, { variante: true }), p("continente", "normal", 8.36),
    p("pingo-doce", "so-magra", 7.5, { variante: true }),
  ] };
  const { melhores } = melhoresPorLoja(dados, HOJE);
  assert.equal(melhores.continente.id, "normal");
  assert.equal(melhores["pingo-doce"].id, "so-magra");
  const cog = ["a", "b", "c", "d"].map((l, i) => p(l, "c" + i, 4 + i)).concat(p("apolonia", "erro", 0.01));
  assert.ok(!semAbsurdos(cog).some((x) => x.id === "erro"));
  // O sal grosso barato a sério fica, ao lado das flores de sal.
  const sal = [p("a", "grosso", 0.29), p("b", "flor", 4.5), p("c", "flor2", 5), p("d", "flor3", 4.8), p("e", "fino", 0.45)];
  assert.equal(semAbsurdos(sal).length, 5);
});

test("palavra geral: as opções para escolher são artigos, não outra palavra geral", async () => {
  const { opcoesGenerico, eGenerico, termoDePesquisa } = await import("../lib/comparacao.js");
  const { doCatalogo } = await import("../lib/catalogoLista.js");
  assert.deepEqual(opcoesGenerico("Pão").slice(0, 3), ["Pão de forma", "Carcaças", "Baguete"]);
  assert.ok(opcoesGenerico("leite").includes("Leite magro"));
  assert.deepEqual(opcoesGenerico("maçãs"), []); // não é geral
  for (const palavra of ["pão", "leite", "queijo", "café", "iogurte", "sumo", "vinho", "refrigerante", "bolachas", "feijão", "couve", "detergente", "carne", "fruta", "peixe", "legumes"]) {
    const ops = opcoesGenerico(palavra);
    assert.ok(ops.length >= 2, `«${palavra}» sem opções`);
    for (const o of ops) {
      assert.ok(!eGenerico(o), `«${palavra}» → «${o}» é outra palavra geral`);
      assert.ok(doCatalogo(o) || termoDePesquisa(o).length > 3, `«${o}» sem termo`);
    }
  }
});
