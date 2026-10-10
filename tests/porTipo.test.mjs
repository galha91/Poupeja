import { test } from "node:test";
import assert from "node:assert/strict";
import { primeirosPorTipo } from "../lib/porTipo.js";

const p = (tipoLabel, preco) => ({ tipoLabel, preco });
// Gasolina mais barata que gasóleo, tudo misturado e ordenado por preço.
const postos = [
  ...Array.from({ length: 12 }, (_, i) => p("Gasolina 95", 1.9 + i / 100)),
  ...Array.from({ length: 5 }, (_, i) => p("Gasóleo", 2.0 + i / 100)),
  p("GPL Auto", 0.9),
].sort((a, b) => a.preco - b.preco);

test("o gasóleo não perde lugares para a gasolina mais barata", () => {
  const r = primeirosPorTipo(postos, ["Gasóleo", "Gasolina 95"], 10);
  assert.equal(r.filter(x => x.tipoLabel === "Gasóleo").length, 5);
  assert.equal(r.filter(x => x.tipoLabel === "Gasolina 95").length, 10);
});

test("ignora tipos não pedidos e mantém a ordem por preço dentro de cada tipo", () => {
  const r = primeirosPorTipo(postos, ["Gasóleo"], 3);
  assert.deepEqual(r.map(x => x.preco), [2.0, 2.01, 2.02]);
});
