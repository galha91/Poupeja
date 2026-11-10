import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { montarCabazNegocios, cabazNegociosServe, VALIDADE_MS, MIN_ARTIGOS, TIPO, SLUG, tipoNegocioValido, disposicaoValida } from "../lib/cabazNegocios.js";
import { TIPO as TIPO_INICIO, SLUG as SLUG_INICIO } from "../lib/cabazInicio.js";

const LOJAS = ["continente", "pingo-doce", "auchan"];
const nomes = { continente: "Continente", "pingo-doce": "Pingo Doce", auchan: "Auchan" };
const nome = (id) => nomes[id] || id;
const artigos = ["a", "b", "c", "d", "e", "f", "g", "h"].map((q) => ({ q, nome: q.toUpperCase(), qtd: 10, rotulo: "10 kg" }));
const config = { lojas: LOJAS, artigos };
// Continente 1,00, Pingo Doce 1,10, Auchan 1,20 por kg em todos os artigos.
const precos = (extra = {}) => artigos.flatMap((a) => LOJAS.map((loja, i) => ({ q: a.q, loja, valor: 1 + i * 0.1, dia: "2026-11-10", ...(extra[`${a.q}|${loja}`] || {}) })));

test("cabaz negócios: totais por loja, da mais barata para a mais cara", () => {
  const c = montarCabazNegocios(config, precos(), nome);
  assert.deepEqual(c.lojas, [
    { loja: "continente", nome: "Continente", total: 80 },
    { loja: "pingo-doce", nome: "Pingo Doce", total: 88 },
    { loja: "auchan", nome: "Auchan", total: 96 },
  ]);
  assert.equal(c.barata.loja, "continente");
  assert.equal(c.cara.loja, "auchan");
  assert.equal(c.poupancaSemana, 16);
  assert.equal(c.empate, false);
  assert.equal(c.divisao, null);
  assert.equal(c.media, 88);
  assert.equal(c.poupancaMediaSemana, 8);
  assert.equal(c.poupancaMediaMes, 34.67);
  assert.equal(c.dia, "2026-11-10");
  assert.equal(c.itens[0].barata, "continente");
});

test("cabaz negócios: artigo que falta numa loja ou com preços díspares sai", () => {
  const linhas = precos({ "a|auchan": { valor: 0 }, "b|auchan": { valor: 2.5 } });
  const semA = { lojas: LOJAS, artigos: [...artigos, { q: "i", nome: "I", qtd: 10, rotulo: "10 kg" }, { q: "j", nome: "J", qtd: 10, rotulo: "10 kg" }] };
  const todas = [...linhas, ...["i", "j"].flatMap((q) => LOJAS.map((loja) => ({ q, loja, valor: 1, dia: "2026-11-10" })))];
  const c = montarCabazNegocios(semA, todas, nome);
  assert.deepEqual(c.itens.map((i) => i.nome), ["C", "D", "E", "F", "G", "H", "I", "J"]);
});

test("cabaz negócios: fica o preço do dia mais recente e a data é a do mais antigo usado", () => {
  const linhas = [...precos({ "a|continente": { dia: "2026-11-09" } }), { q: "b", loja: "continente", valor: 9, dia: "2026-11-08" }];
  const c = montarCabazNegocios(config, linhas, nome);
  assert.equal(c.itens.find((i) => i.nome === "B").custos.continente, 10);
  assert.equal(c.dia, "2026-11-09");
});

test("cabaz negócios: dividir por duas lojas quando compensa", () => {
  // Metade dos artigos é mais barata no Auchan.
  const extra = Object.fromEntries(["e", "f", "g", "h"].map((q) => [`${q}|auchan`, { valor: 0.8 }]));
  const c = montarCabazNegocios(config, precos(extra), nome);
  assert.deepEqual(c.divisao.lojas.map((l) => l.loja), ["continente", "auchan"]);
  assert.equal(c.divisao.total, 72);
  assert.equal(c.divisao.poupancaExtra, 8);
  assert.equal(c.poupancaMediaSemana, 10.67);
});

test("cabaz negócios: artigo ao mesmo preço em duas lojas não destaca nenhuma", () => {
  const c = montarCabazNegocios(config, precos({ "a|pingo-doce": { valor: 1 } }), nome);
  assert.equal(c.itens[0].barata, null);
  assert.equal(c.itens[1].barata, "continente");
});

test("cabaz negócios: vitória por menos de 3% é empate", () => {
  const extra = Object.fromEntries(artigos.map((a) => [`${a.q}|pingo-doce`, { valor: 1.01 }]));
  assert.equal(montarCabazNegocios(config, precos(extra), nome).empate, true);
});

test("cabaz negócios: com poucos artigos comparáveis não há cabaz", () => {
  assert.equal(montarCabazNegocios({ lojas: LOJAS, artigos: artigos.slice(0, MIN_ARTIGOS - 1) }, precos(), nome), null);
  assert.equal(montarCabazNegocios(config, [], nome), null);
});

test("cabaz negócios: com mais de 3 dias deixa de servir", () => {
  const c = { ...montarCabazNegocios(config, precos(), nome), geradoEm: new Date(1e12).toISOString() };
  assert.equal(cabazNegociosServe(c, 1e12 + VALIDADE_MS - 1), true);
  assert.equal(cabazNegociosServe(c, 1e12 + VALIDADE_MS + 1), false);
  assert.equal(cabazNegociosServe(null), false);
  assert.equal(cabazNegociosServe({ geradoEm: new Date(1e12).toISOString() }, 1e12), false);
});

test("cabaz negócios: não escreve por cima da linha do cabaz do Início", () => {
  assert.equal(TIPO, TIPO_INICIO);
  assert.notEqual(SLUG, SLUG_INICIO);
});

test("cabaz negócios: o ficheiro de artigos está bem formado", () => {
  const cfg = JSON.parse(readFileSync(new URL("../data/cabaz-negocios.json", import.meta.url)));
  assert.ok(cfg.lojas.length >= 2);
  assert.ok(cfg.artigos.length >= MIN_ARTIGOS);
  assert.equal(new Set(cfg.artigos.map((a) => a.q)).size, cfg.artigos.length);
  for (const a of cfg.artigos) assert.ok(a.q && a.nome && a.rotulo && a.qtd > 0, a.q);
});

test("lista de espera: só aceita os tipos e as faixas conhecidas", () => {
  assert.equal(tipoNegocioValido("cafe"), true);
  assert.equal(tipoNegocioValido("banco"), false);
  assert.equal(disposicaoValida("10-20"), true);
  assert.equal(disposicaoValida("1000"), false);
  assert.equal(disposicaoValida(undefined), false);
});
