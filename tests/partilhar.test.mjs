import test from "node:test";
import assert from "node:assert/strict";
import { textoResultadoLista } from "../lib/partilhar.js";

test("resultado da lista: loja, total e diferença para a mais cara", () => {
  const t = textoResultadoLista({ artigos: 12, loja: "Lidl", total: 23.4, poupanca: 4.1, lojaCara: "Continente" });
  assert.match(t, /12 artigos: no Lidl ficam a 23,40 €, menos 4,10 € do que no Continente\./);
});

test("resultado da lista: sem diferença que se veja, não a inventa", () => {
  const t = textoResultadoLista({ artigos: 1, loja: "Aldi", total: 2, poupanca: 0.2, lojaCara: "Continente" });
  assert.match(t, /1 artigo: no Aldi fica a 2,00 €\./);
  assert.doesNotMatch(t, /menos/);
});

test("resultado da lista: uma só loja com preços", () => {
  assert.doesNotMatch(textoResultadoLista({ artigos: 3, loja: "Lidl", total: 5, poupanca: 0, lojaCara: "" }), /menos/);
});
