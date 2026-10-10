import { test } from "node:test";
import assert from "node:assert/strict";
import { rankingNoDistrito } from "../lib/rankingDistrito.js";

const m = (slug, distrito, preco) => ({ slug, distrito, baratos: preco == null ? {} : { "Gasóleo": { preco } } });
const lista = [m("a", "Faro", 1.9), m("b", "Faro", 1.8), m("c", "Faro", 2.0), m("d", "Porto", 1.7)];

test("posição entre os concelhos do mesmo distrito", () => {
  assert.deepEqual(rankingNoDistrito(lista[1], lista), { tipo: "Gasóleo", posicao: 1, total: 3, distrito: "Faro" });
  assert.equal(rankingNoDistrito(lista[0], lista).posicao, 2);
  assert.equal(rankingNoDistrito(lista[2], lista).posicao, 3);
});

test("sem ranking quando há menos de 3 concelhos ou sem preço", () => {
  assert.equal(rankingNoDistrito(lista[3], lista), null);
  assert.equal(rankingNoDistrito(m("e", "Faro", null), lista), null);
});
