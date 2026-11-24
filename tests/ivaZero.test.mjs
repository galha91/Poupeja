import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fase, janelaReferencia, mediana, referencias, precosAtuais, classe, comparar, juntarSerie, grupoDe, ivaZeroServe,
  DESCIDA_ESPERADA, INICIO, TODAS_Q, GRUPOS, pctDe,
} from "../lib/ivaZero.js";

const dias = (loja, id, de, n, preco) => Array.from({ length: n }, (_, i) => {
  const d = new Date(`${de}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i);
  return { loja, produto_id: id, dia: d.toISOString().slice(0, 10), preco: typeof preco === "function" ? preco(i) : preco };
});

test("ivaZero: a descida esperada de 6% para 0% é 5,7%", () => {
  assert.equal(DESCIDA_ESPERADA, 5.7);
});

test("ivaZero: fase e janela de referência", () => {
  assert.equal(INICIO, "2027-01-01");
  assert.equal(fase("2026-12-31"), "antes");
  assert.equal(fase("2027-01-01"), "depois");
  // Antes: os últimos 14 dias até hoje.
  assert.deepEqual(janelaReferencia("2026-12-10"), { desde: "2026-11-27", ate: "2026-12-10" });
  // Depois: fica presa aos 14 dias antes de 1 de janeiro, seja que dia for.
  assert.deepEqual(janelaReferencia("2027-02-15"), { desde: "2026-12-18", ate: "2026-12-31" });
  assert.deepEqual(janelaReferencia("2027-01-01"), janelaReferencia("2027-03-31"));
});

test("ivaZero: a mediana ignora a promoção de um dia", () => {
  assert.equal(mediana([1.99, 1.99, 0.99, 1.99, 2.09]), 1.99);
  assert.equal(mediana([1, 2]), 1.5);
  assert.equal(mediana([]), null);
});

test("ivaZero: referência pede 3 dias na janela e ignora os de fora", () => {
  const j = { desde: "2026-12-18", ate: "2026-12-31" };
  const ref = referencias([
    ...dias("continente", "a", "2026-12-18", 14, (i) => (i === 5 ? 0.99 : 1.99)),
    ...dias("continente", "b", "2026-12-30", 2, 3), // só 2 dias: fica de fora
    ...dias("auchan", "c", "2027-01-02", 5, 1), // depois da janela
  ], j);
  assert.deepEqual(ref, { "continente|a": 1.99 });
});

test("ivaZero: o preço atual é o mais recente dos últimos 3 dias", () => {
  const at = precosAtuais([
    { loja: "x", produto_id: "1", dia: "2027-01-08", preco: 2 },
    { loja: "x", produto_id: "1", dia: "2027-01-10", preco: 1.88 },
    { loja: "x", produto_id: "2", dia: "2027-01-05", preco: 9 }, // demasiado antigo
  ], "2027-01-10");
  assert.deepEqual(at, { "x|1": { preco: 1.88, dia: "2027-01-10" } });
});

test("ivaZero: classes de variação", () => {
  assert.equal(classe(-5.7), "desceu");
  assert.equal(classe(-5), "desceu");
  assert.equal(classe(-2), "parte");
  assert.equal(classe(0.4), "igual");
  assert.equal(classe(-0.4), "igual");
  assert.equal(classe(3), "subiu");
});

test("ivaZero: comparar resume por loja e por grupo, com o mesmo produto", () => {
  const produtos = [];
  const ref = {};
  const atuais = {};
  // 24 produtos no Continente que desceram o IVA, 20 no Pingo Doce que não desceram.
  for (let i = 0; i < 24; i++) {
    produtos.push({ loja: "continente", produto_id: `c${i}`, q: "arroz", nome: `Arroz ${i}`, marca: "M" });
    ref[`continente|c${i}`] = 1.06; atuais[`continente|c${i}`] = { preco: 1.0, dia: "2027-01-10" };
  }
  for (let i = 0; i < 20; i++) {
    produtos.push({ loja: "pingo-doce", produto_id: `p${i}`, q: "leite meio gordo", nome: `Leite ${i}`, marca: "M" });
    ref[`pingo-doce|p${i}`] = 1; atuais[`pingo-doce|p${i}`] = { preco: i === 0 ? 1.1 : 1, dia: "2027-01-10" };
  }
  // Produto repetido noutra pesquisa: conta uma vez. Pesquisa fora das categorias: não conta.
  produtos.push({ loja: "continente", produto_id: "c0", q: "arroz agulha", nome: "Arroz 0" });
  produtos.push({ loja: "continente", produto_id: "z", q: "champô", nome: "Champô" });
  ref["continente|z"] = 3; atuais["continente|z"] = { preco: 2, dia: "2027-01-10" };

  const r = comparar(produtos, ref, atuais, (l) => ({ continente: "Continente", "pingo-doce": "Pingo Doce" })[l]);
  assert.equal(r.total.n, 44);
  assert.equal(r.total.desceu, 24);
  assert.equal(r.total.subiu, 1);
  assert.equal(r.porLoja[0].nome, "Continente");
  assert.equal(r.porLoja[0].varMedia, -5.7);
  assert.equal(r.porLoja[1].varMedia, 0.5);
  assert.deepEqual(r.porGrupo.map((g) => g.id), ["arroz-massa", "leite-iogurte"]);
  assert.equal(r.subiram.length, 1);
  assert.equal(r.subiram[0].loja, "Pingo Doce");
  assert.equal(pctDe(r.total.desceu, r.total.n), 55);
});

test("ivaZero: loja com menos de 20 produtos não aparece sozinha", () => {
  const r = comparar([{ loja: "aldi", produto_id: "1", q: "ovos" }], { "aldi|1": 2 }, { "aldi|1": { preco: 2, dia: "2027-01-02" } });
  assert.equal(r.total.n, 1);
  assert.equal(r.porLoja.length, 0);
  assert.equal(comparar([], {}, {}), null);
});

test("ivaZero: a série guarda um ponto por dia", () => {
  const resumo = { total: { n: 10, desceu: 4, varMedia: -3.1 }, porLoja: [{ loja: "auchan", varMedia: -2 }] };
  let s = juntarSerie([], resumo, "2027-01-02");
  s = juntarSerie(s, { ...resumo, total: { ...resumo.total, varMedia: -4 } }, "2027-01-02");
  s = juntarSerie(s, resumo, "2027-01-03");
  assert.equal(s.length, 2);
  assert.equal(s[0].varMedia, -4);
  assert.deepEqual(s[1].lojas, { auchan: -2 });
});

test("ivaZero: categorias sem pesquisas repetidas e em minúsculas", () => {
  assert.equal(new Set(TODAS_Q).size, TODAS_Q.length);
  for (const q of TODAS_Q) assert.equal(q, q.toLowerCase());
  assert.equal(grupoDe("Arroz Carolino"), "arroz-massa");
  assert.equal(grupoDe("champô"), null);
  assert.equal(new Set(GRUPOS.map((g) => g.id)).size, GRUPOS.length);
});

test("ivaZero: a página só fica no Google com dados de há menos de 4 dias", () => {
  const props = { dia: "2027-01-10", resumo: { total: { n: 3 } } };
  assert.equal(ivaZeroServe(props, Date.parse("2027-01-12T12:00:00Z")), true);
  assert.equal(ivaZeroServe(props, Date.parse("2027-01-15T12:00:00Z")), false);
  assert.equal(ivaZeroServe({ ...props, resumo: { total: { n: 0 } } }, Date.parse("2027-01-11T12:00:00Z")), false);
});
