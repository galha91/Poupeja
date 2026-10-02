import { test } from "node:test";
import assert from "node:assert/strict";
import { otimizarCabaz, melhorDivisao, poupancaDaEscolha } from "../lib/cabaz.js";

const LOJAS = ["continente", "pingo-doce", "auchan", "aldi", "lidl"];
const L = (id, custos) => ({ id, nome: id, custos });

test("loja única mais barata e poupança face à mais cara, sobre os mesmos artigos", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1.0, "pingo-doce": 0.9, auchan: 1.1, aldi: 0.8 }),
    L("arroz", { continente: 2.0, "pingo-doce": 2.2, auchan: 1.9, aldi: 2.1 }),
    L("ovos", { continente: 3.0, "pingo-doce": 3.1, auchan: 3.4, aldi: 2.9 }),
  ], LOJAS);
  assert.equal(r.unica.loja, "aldi");
  assert.equal(r.unica.total, 5.8);
  assert.equal(r.maisCara.loja, "auchan");
  assert.equal(r.maisCara.total, 6.4);
  assert.equal(r.poupancaUnica, 0.6);
  assert.deepEqual(r.semPreco, []);
  assert.equal(r.comparaveis.length, 3);
});

test("contas em cêntimos: sem erros de vírgula flutuante", () => {
  const r = otimizarCabaz([
    L("a", { continente: 0.1, auchan: 0.2 }),
    L("b", { continente: 0.2, auchan: 0.1 }),
    L("c", { continente: 0.1, auchan: 0.1 }),
  ], ["continente", "auchan"]);
  assert.equal(r.unica.total, 0.4);
  assert.equal(r.maisCara.total, 0.4);
  assert.equal(r.poupancaUnica, 0);
});

test("artigos sem preço ficam sinalizados e fora das contas", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1, auchan: 1.2 }),
    L("pão", { continente: 2, auchan: 1.5 }),
    L("queijo da serra", {}),
  ], LOJAS);
  assert.deepEqual(r.semPreco.map((l) => l.id), ["queijo da serra"]);
  assert.equal(r.comparaveis.length, 2);
});

test("uma loja não ganha por lhe faltarem artigos (Lidl só com promoções)", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1.0, auchan: 1.1, lidl: 0.5 }),
    L("arroz", { continente: 2.0, auchan: 2.1 }),
    L("ovos", { continente: 3.0, auchan: 2.8 }),
    L("massa", { continente: 1.0, auchan: 1.0 }),
    L("azeite", { continente: 7.0, auchan: 7.5 }),
  ], LOJAS);
  assert.ok(!r.grupo.includes("lidl"), "o Lidl não entra no grupo da loja única");
  assert.equal(r.unica.loja, "continente");
  assert.equal(r.unica.total, 14);
  // Artigos que só algumas lojas têm: dizer quais.
  const leite = r.parciais.find((p) => p.id === "leite");
  assert.deepEqual(leite.lojas, ["continente", "auchan", "lidl"]);
});

test("totais só sobre o que todas as lojas do grupo têm", () => {
  const r = otimizarCabaz([
    L("a", { continente: 1, auchan: 1, aldi: 1 }),
    L("b", { continente: 1, auchan: 1, aldi: 1 }),
    L("c", { continente: 1, auchan: 1, aldi: 1 }),
    L("d", { continente: 1, auchan: 1, aldi: 1 }),
    L("e", { continente: 5, auchan: 9 }), // o Aldi não tem
  ], LOJAS);
  assert.deepEqual(r.grupo.sort(), ["aldi", "auchan", "continente"]);
  assert.equal(r.comparaveis.length, 4);
  assert.equal(r.unica.total, 4);
  assert.deepEqual(r.porLoja.find((p) => p.loja === "aldi").emFalta, ["e"]);
});

test("divisão por 2 lojas: cada artigo na mais barata das duas, e quanto poupa a mais", () => {
  const linhas = [
    L("leite", { continente: 1.0, "pingo-doce": 0.7, auchan: 1.1 }),
    L("arroz", { continente: 1.5, "pingo-doce": 2.2, auchan: 1.9 }),
    L("ovos", { continente: 3.0, "pingo-doce": 2.5, auchan: 3.4 }),
    L("massa", { continente: 0.8, "pingo-doce": 1.2, auchan: 0.9 }),
  ];
  const r = otimizarCabaz(linhas, LOJAS);
  assert.equal(r.unica.loja, "continente"); // 6,30 vs PD 6,60 vs Auchan 7,30
  assert.equal(r.unica.total, 6.3);
  assert.deepEqual(r.divisao.lojas, ["continente", "pingo-doce"]);
  assert.equal(r.divisao.total, 5.5);
  assert.equal(r.divisao.poupancaExtra, 0.8);
  assert.deepEqual(r.divisao.atribuicao, { continente: ["arroz", "massa"], "pingo-doce": ["leite", "ovos"] });
});

test("a divisão pode juntar uma loja com promoções (Lidl) a uma loja completa", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1.0, auchan: 1.1, lidl: 0.6 }),
    L("arroz", { continente: 2.0, auchan: 2.1 }),
    L("ovos", { continente: 3.0, auchan: 3.2 }),
    L("massa", { continente: 1.0, auchan: 1.1 }),
    L("pão", { continente: 1.0, auchan: 1.0 }),
  ], LOJAS);
  assert.deepEqual(r.divisao.lojas, ["continente", "lidl"]);
  assert.equal(r.divisao.poupancaExtra, 0.4);
});

test("sem divisão quando dividir não poupa nada", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1, auchan: 2 }),
    L("arroz", { continente: 1, auchan: 2 }),
  ], ["continente", "auchan"]);
  assert.equal(r.divisao, null);
});

test("melhorDivisao: par que não cobre a lista não conta", () => {
  const d = melhorDivisao([
    L("a", { continente: 1, aldi: 0.9, lidl: 0.5 }),
    L("b", { continente: 1, aldi: 0.9 }),
  ], ["continente", "aldi", "lidl"], { loja: "continente", total: 2 });
  // aldi+lidl (1,40) cobre tudo e ganha a continente+lidl (1,50);
  // um par sem "b" nunca seria considerado.
  assert.deepEqual(d.lojas, ["aldi", "lidl"]);
  assert.equal(d.total, 1.4);
  assert.equal(d.poupancaExtra, 0.6);
  const sóLidl = melhorDivisao([L("a", { lidl: 1 }), L("b", { continente: 1 })], ["lidl", "aldi"], { loja: "lidl", total: 2 });
  assert.equal(sóLidl, null);
});

test("lista vazia ou sem preços nenhuns", () => {
  const r = otimizarCabaz([L("x", {})], LOJAS);
  assert.equal(r.unica, null);
  assert.equal(r.divisao, null);
  assert.equal(r.semPreco.length, 1);
  assert.equal(poupancaDaEscolha(r, "unica"), 0);
});

test("poupança estimada de cada escolha", () => {
  const r = otimizarCabaz([
    L("leite", { continente: 1.0, "pingo-doce": 0.7, auchan: 1.1 }),
    L("arroz", { continente: 1.5, "pingo-doce": 2.2, auchan: 1.9 }),
    L("ovos", { continente: 3.0, "pingo-doce": 2.5, auchan: 3.4 }),
    L("massa", { continente: 0.8, "pingo-doce": 1.2, auchan: 0.9 }),
  ], LOJAS);
  assert.equal(r.maisCara.total, 7.3);
  assert.equal(poupancaDaEscolha(r, "unica"), 1);
  assert.equal(poupancaDaEscolha(r, "divisao"), 1.8);
});
