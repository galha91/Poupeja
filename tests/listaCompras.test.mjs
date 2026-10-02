import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparPorCategoria, adicionar as adicionarSem, alterarQty, retirar, repor, categoriaDe, OUTROS, CATEGORIAS, jaComparados } from "../lib/listaCompras.js";
import { sugerir, doCatalogo, preencherCategorias, CATEGORIAS as DO_CATALOGO } from "../lib/catalogoLista.js";

const adicionar = (itens, nome, id) => adicionarSem(itens, nome, { id, doCatalogo });
import { resumoValido, chaveDaLista, VALIDADE_MS } from "../lib/resumoLista.js";

const it = (id, nome, categoria = "", extra = {}) => ({ id, nome, emoji: "", categoria, qty: 1, feito: false, ...extra });

test("categoria: a do artigo, senão Outros; o catálogo preenche as que faltam", () => {
  assert.deepEqual(CATEGORIAS, DO_CATALOGO);
  assert.equal(categoriaDe(it(1, "Maçãs", "Frutas")), "Frutas");
  assert.equal(categoriaDe(it(3, "Café moído")), OUTROS);
  const l = [it(1, "Maçãs", "Frutas"), it(2, "leite meio gordo"), it(3, "Café moído")]; // 2 veio do Comparar, sem categoria
  const p = preencherCategorias(l);
  assert.equal(p[1].categoria, "Laticínios & Ovos");
  assert.equal(p[2].categoria, "");
  assert.equal(p[0], l[0]);
  assert.equal(preencherCategorias(p), p); // nada a mudar: a mesma lista
});

test("sem catálogo carregado, adicionar guarda o texto tal como está (com maiúscula)", () => {
  const l = adicionarSem([], "leite meio gordo", { id: 1 });
  assert.equal(l[0].nome, "Leite meio gordo");
  assert.equal(l[0].categoria, "");
});

test("agrupar: só há títulos com 2 ou mais categorias", () => {
  const uma = agruparPorCategoria([it(1, "Maçãs", "Frutas"), it(2, "Bananas", "Frutas")]);
  assert.equal(uma.length, 1);
  assert.equal(uma[0].categoria, null);
  assert.deepEqual(agruparPorCategoria([]), []);
});

test("agrupar: ordem do catálogo, Outros no fim, ordem da lista dentro do grupo", () => {
  const g = agruparPorCategoria([
    it(1, "Café moído"), it(2, "Arroz", "Mercearia"), it(3, "Maçãs", "Frutas"), it(4, "Azeite", "Mercearia"),
  ]);
  assert.deepEqual(g.map((x) => x.categoria), ["Frutas", "Mercearia", OUTROS]);
  assert.deepEqual(g[1].itens.map((x) => x.id), [2, 4]);
});

test("adicionar: usa o nome e a categoria do catálogo e soma quantidade se já está por comprar", () => {
  let l = adicionar([], "leite meio gordo", 1);
  assert.equal(l[0].nome, "Leite meio-gordo");
  assert.equal(l[0].categoria, "Laticínios & Ovos");
  assert.deepEqual(Object.keys(l[0]).sort(), ["categoria", "emoji", "feito", "id", "nome", "qty"]);
  l = adicionar(l, "Leite Meio-Gordo", 2);
  assert.equal(l.length, 1);
  assert.equal(l[0].qty, 2);
  l = adicionar(l, "  pilhas  aa ", 3);
  assert.equal(l[0].nome, "Pilhas aa");
  assert.equal(l[0].categoria, "");
  assert.equal(adicionar(l, "   ", 4), l);
});

test("adicionar: um artigo já comprado não conta — entra outra vez por comprar", () => {
  const l = adicionar([it(1, "Arroz", "Mercearia", { feito: true })], "arroz", 2);
  assert.equal(l.length, 2);
  assert.equal(l[0].feito, false);
});

test("quantidade fica entre 1 e 99", () => {
  let l = [it(1, "Ovos")];
  l = alterarQty(l, 1, -1);
  assert.equal(l[0].qty, 1);
  l = alterarQty(l, 1, 200);
  assert.equal(l[0].qty, 99);
});

test("anular remoção: o artigo volta ao mesmo sítio", () => {
  const l = [it(1, "A"), it(2, "B"), it(3, "C")];
  const { itens, removidos } = retirar(l, [2]);
  assert.deepEqual(itens.map((x) => x.id), [1, 3]);
  assert.deepEqual(repor(itens, removidos).map((x) => x.id), [1, 2, 3]);
});

test("anular 'Limpar' (vários) e sem duplicar se a lista mudou entretanto", () => {
  const l = [it(1, "A"), it(2, "B", "", { feito: true }), it(3, "C"), it(4, "D", "", { feito: true })];
  const { itens, removidos } = retirar(l, [2, 4]);
  assert.deepEqual(repor(itens, removidos).map((x) => x.id), [1, 2, 3, 4]);
  // Outra pessoa já repôs o 2 e tirou o 3:
  const mudou = [it(1, "A"), it(2, "B")];
  assert.deepEqual(repor(mudou, removidos).map((x) => x.id), [1, 2, 4]);
});

test("sugestões: começa por > palavra começa por > contém, sem acentos; já comparados à frente", () => {
  const s = sugerir("lei", { comparados: ["leite meio gordo"] }).map((x) => x.nome);
  assert.equal(s[0], "Leite meio-gordo");
  assert.ok(s.includes("Leite gordo"));
  assert.ok(s.indexOf("Leite gordo") < s.indexOf("Pão de leite"));
  assert.ok(sugerir("maca").some((x) => x.nome === "Maçãs"));
  assert.ok(sugerir("lei").length <= 6);
});

test("sugestões sem texto: só o que já se comparou", () => {
  assert.deepEqual(sugerir("", { comparados: ["café moído", "laranjas"] }), [
    { nome: "Café moído", origem: "comparados" }, { nome: "Laranjas", origem: "comparados" },
  ]);
  assert.deepEqual(sugerir(""), []);
});

test("resumo da comparação só vale para a mesma lista e durante um dia", () => {
  const lista = [it(1, "Arroz"), it(2, "Ovos", "", { qty: 2 })];
  const g = { loja: "auchan", total: 10, chave: chaveDaLista(lista), em: 1000 };
  assert.equal(resumoValido(g, [...lista].reverse(), 2000), g);
  assert.equal(resumoValido(g, [it(1, "Arroz"), it(2, "Ovos")], 2000), null); // quantidade mudou
  assert.equal(resumoValido(g, lista, 1000 + VALIDADE_MS), null);
  assert.equal(resumoValido(null, lista, 2000), null);
  assert.equal(resumoValido(g, [], 2000), null);
});

test("Já comparaste, sem catálogo: sem repetidos, com maiúscula", () => {
  assert.deepEqual(jaComparados(["café moído", "Café  moído", "", "laranjas"]), [
    { nome: "Café moído", origem: "comparados" }, { nome: "Laranjas", origem: "comparados" },
  ]);
});
