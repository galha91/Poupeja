import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIAS, ITENS, MAIS_COMUNS, itemPorNome } from "../data/catalogo-lista.js";
import { pesquisarCatalogo, correspondeExato } from "../lib/pesquisaCatalogo.js";

const primeiro = (t) => pesquisarCatalogo(t, ITENS)[0]?.nome;

test("catálogo: tamanho, ids únicos, sem quase-duplicados", () => {
  assert.ok(ITENS.length >= 150 && ITENS.length <= 250, `itens: ${ITENS.length}`);
  assert.ok(CATEGORIAS.length <= 15);
  const ids = ITENS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, "ids repetidos");
  const qs = ITENS.map((i) => i.q);
  assert.equal(new Set(qs).size, qs.length, `termos de pesquisa repetidos: ${qs.filter((q, i) => qs.indexOf(q) !== i)}`);
  assert.ok(MAIS_COMUNS.length >= 10 && MAIS_COMUNS.length <= 20);
  for (const i of ITENS) assert.ok(i.nome && i.cat && i.q, JSON.stringify(i));
});

test("pesquisa sem acentos, singular/plural e com erros leves", () => {
  assert.equal(primeiro("macas"), "Maçãs");
  assert.equal(primeiro("maca"), "Maçãs");
  assert.equal(primeiro("ovo"), "Ovos");
  assert.equal(primeiro("bacalao"), "Bacalhau");
  assert.equal(primeiro("chourico"), "Chouriço");
  assert.equal(primeiro("leite"), "Leite meio-gordo");
  assert.equal(primeiro("papo seco"), "Carcaças");
  assert.equal(primeiro("abacaxi"), "Ananás");
  assert.equal(primeiro("alho"), "Alho");
  assert.equal(primeiro("baca"), "Bacalhau");
  assert.equal(primeiro("racao gato"), "Ração para gato");
});

test("pesquisa curta ou sem resultados", () => {
  assert.deepEqual(pesquisarCatalogo("a", ITENS), []);
  assert.deepEqual(pesquisarCatalogo("xilofone", ITENS), []);
});

test("correspondência exata pelo nome ou sinónimo", () => {
  const b = itemPorNome("bacalhau");
  assert.ok(correspondeExato("Bacalhau", b));
  assert.ok(correspondeExato("bacalhau salgado", b));
  assert.ok(!correspondeExato("bacalhau com natas", b));
  assert.equal(itemPorNome("MACAS")?.nome, "Maçãs");
});
