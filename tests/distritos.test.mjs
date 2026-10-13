import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirDistrito } from "../lib/distritos.js";

const posto = (id, municipio, distrito, tipoLabel, preco) => ({ id, nome: `Posto ${id}`, municipio, distrito, tipoLabel, preco });
const postos = [
  posto(1, "Braga", "Braga", "Gasóleo", 1.55),
  posto(2, "Braga", "Braga", "Gasóleo", 1.65),
  posto(3, "Vila Verde", "Braga", "Gasóleo", 1.50),
  posto(3, "Vila Verde", "Braga", "Gasolina 95", 1.70),
  posto(4, "Porto", "Porto", "Gasóleo", 1.40),
];
const m = (slug, nome, distrito, gasoleo) => ({ slug, nome, distrito, nPostos: 3, baratos: gasoleo == null ? {} : { "Gasóleo": { preco: gasoleo } } });
const lista = [m("braga", "Braga", "Braga", 1.55), m("vila-verde", "Vila Verde", "Braga", 1.50), m("amares", "Amares", "Braga", null), m("porto", "Porto", "Porto", 1.40)];
const medias = { "Gasóleo": 1.60, "Gasolina 95": 1.75 };

test("o mais barato e a média são só do distrito", () => {
  const r = resumirDistrito({ nome: "Braga", postos, lista, medias });
  const g = r.destaques.find(d => d.tipoLabel === "Gasóleo");
  assert.equal(g.preco, 1.50);
  assert.equal(g.municipio, "Vila Verde");
});

test("média contra o país em cêntimos", () => {
  const r = resumirDistrito({ nome: "Braga", postos, lista, medias });
  const g = r.destaques.find(d => d.tipoLabel === "Gasóleo");
  assert.equal(g.vsPais, Math.round(((1.55 + 1.65 + 1.50) / 3 - 1.60) * 100));
});

test("concelhos do distrito por gasóleo, sem preço no fim", () => {
  const r = resumirDistrito({ nome: "Braga", postos, lista, medias });
  assert.deepEqual(r.concelhos.map(c => c.slug), ["vila-verde", "braga", "amares"]);
  assert.equal(r.nPostos, 3);
  assert.equal(r.amplitude.porDeposito, 7.5);
});

test("distrito sem postos não tem página", () => {
  assert.equal(resumirDistrito({ nome: "Beja", postos, lista, medias }), null);
});
