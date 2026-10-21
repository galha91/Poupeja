import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirTipo } from "../lib/combustivelTipo.js";

const postos = Array.from({ length: 12 }, (_, i) => ({
  tipoLabel: "Gasóleo", preco: 1.5 + i / 100, nome: `Posto ${i}`, marca: "X",
  municipio: i < 6 ? "Sintra" : "Braga", distrito: i < 6 ? "Lisboa" : "Braga",
}));
const lista = [
  { slug: "sintra", nome: "Sintra", distrito: "Lisboa", baratos: { "Gasóleo": { preco: 1.5 } } },
  { slug: "braga", nome: "Braga", distrito: "Braga", baratos: { "Gasóleo": { preco: 1.56 } } },
];

test("resumo nacional de um combustível", () => {
  const r = resumirTipo({ tipo: "Gasóleo", postos, lista, medias: { "Gasóleo": 1.6 } });
  assert.equal(r.minimo, 1.5);
  assert.equal(r.baratos[0].nome, "Posto 0");
  assert.deepEqual(r.distritos.map(d => d.nome), ["Lisboa", "Braga"]);
  assert.deepEqual(r.concelhos.map(c => c.slug), ["sintra", "braga"]);
  assert.equal(r.porDeposito, 5);
});

test("com poucos postos não há página", () => {
  assert.equal(resumirTipo({ tipo: "GPL Auto", postos, lista, medias: {} }), null);
});
