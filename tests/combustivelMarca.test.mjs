import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirMarca, listarMarcasCombustivel } from "../lib/combustivelMarca.js";

const postos = [];
for (let i = 0; i < 25; i++) postos.push({ id: `g${i}`, marca: "GALP", nome: `Galp ${i}`, tipoLabel: "Gasóleo", preco: 1.6 + i / 1000, municipio: "Sintra", distrito: i < 10 ? "Lisboa" : "Porto" });
for (let i = 0; i < 22; i++) postos.push({ id: `p${i}`, marca: "Prio", nome: `Prio ${i}`, tipoLabel: "Gasóleo", preco: 1.5 + i / 1000, municipio: "Braga", distrito: "Braga" });
for (let i = 0; i < 3; i++) postos.push({ id: `x${i}`, marca: "Pequena", nome: `P ${i}`, tipoLabel: "Gasóleo", preco: 1.4 });

test("só marcas com postos suficientes", () => {
  assert.deepEqual(listarMarcasCombustivel(postos).map((m) => m.slug), ["galp", "prio"]);
});

test("resumo da marca contra o país e as outras marcas", () => {
  const r = resumirMarca({ slug: "galp", postos, medias: { "Gasóleo": 1.55 } });
  const g = r.tipos[0];
  assert.equal(g.posicao, 2);
  assert.equal(g.deMarcas, 2);
  assert.equal(g.vsPais, 6.2);
  assert.equal(r.baratos[0].nome, "Galp 0");
  assert.equal(r.distritos[0].nome, "Lisboa");
  assert.equal(resumirMarca({ slug: "pequena", postos, medias: {} }), null);
});
