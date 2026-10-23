import { test } from "node:test";
import assert from "node:assert/strict";
import { ordemDoDia, filaDoDia, rodar, POR_DIA, RESTO_POR_PARTE, PARTES } from "../lib/filaHistorico.js";

const populares = Array.from({ length: 38 }, (_, i) => `a${i}`);
const resto = Array.from({ length: 195 }, (_, i) => `r${i}`);
const dia = (d) => new Date(Date.UTC(2026, 9, 13 + d, 7, 15));

test("a lista roda de dia para dia e não perde nem repete artigos", () => {
  const d1 = ordemDoDia(populares, dia(0));
  const d2 = ordemDoDia(populares, dia(1));
  assert.notEqual(d1[0], d2[0]);
  assert.deepEqual([...d1].sort(), [...populares].sort());
});

test("em 4 dias seguidos, os primeiros 12 de cada dia cobrem a lista toda", () => {
  const vistos = new Set();
  for (let d = 0; d < 4; d++) ordemDoDia(populares, dia(d)).slice(0, POR_DIA).forEach((a) => vistos.add(a));
  assert.equal(vistos.size, 38);
});

test("rodar nunca perde nem repete artigos, mesmo com passos grandes ou negativos", () => {
  for (const passo of [0, 1, 194, 195, 1000, -3]) assert.deepEqual([...rodar(resto, passo)].sort(), [...resto].sort());
  assert.deepEqual(rodar([], 5), []);
});

test("a parte 1 leva os populares todos os dias, a parte 2 só o resto", () => {
  const p1 = filaDoDia({ populares, resto }, dia(0), 1);
  const p2 = filaDoDia({ populares, resto }, dia(0), 2);
  assert.equal(p1.length, populares.length + resto.length);
  assert.deepEqual(new Set(p1.slice(0, populares.length)), new Set(populares));
  assert.equal(p2.length, resto.length);
  assert.ok(p2.every((a) => a.startsWith("r")));
});

test("a parte 2 começa onde a parte 1 garante ter chegado", () => {
  const p1 = filaDoDia({ populares, resto }, dia(2), 1).slice(populares.length);
  const p2 = filaDoDia({ populares, resto }, dia(2), 2);
  assert.equal(p2[0], p1[RESTO_POR_PARTE]);
});

test("cada artigo do resto volta a ter preços em 3 dias seguidos, só com a parte garantida de cada execução", () => {
  for (let inicio = 0; inicio < 10; inicio++) {
    const vistos = new Set();
    for (let d = inicio; d < inicio + 3; d++) {
      for (const parte of [1, 2]) {
        const fila = filaDoDia({ populares, resto }, dia(d), parte);
        const tail = parte === 1 ? fila.slice(populares.length) : fila;
        tail.slice(0, RESTO_POR_PARTE).forEach((a) => vistos.add(a));
      }
    }
    assert.equal(vistos.size, resto.length, `dias ${inicio}..${inicio + 2}`);
  }
  assert.equal(PARTES, 2);
});

test("com só uma execução por dia a cobertura seria de mais de 3 dias (por isso há duas)", () => {
  const vistos = new Set();
  for (let d = 0; d < 3; d++) filaDoDia({ populares, resto }, dia(d), 1).slice(populares.length, populares.length + RESTO_POR_PARTE).forEach((a) => vistos.add(a));
  assert.ok(vistos.size < resto.length);
});
