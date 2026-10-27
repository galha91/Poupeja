import { test } from "node:test";
import assert from "node:assert/strict";
import { guardarLista, usarLista, apagarLista, porNome, validarListas, MAX_LISTAS, MAX_NOME } from "../lib/listasGuardadas.js";

const it = (id, nome, extra = {}) => ({ id, nome, emoji: "", categoria: "Mercearia", qty: 1, feito: false, ...extra });

test("guardar: guarda por comprar e comprados, sem id nem feito, um por nome", () => {
  const l = guardarLista([], "  Semanal ", [it(1, "Arroz carolino", { qty: 2 }), it(2, "Leite meio-gordo", { feito: true, q: "leite" }), it(3, "arroz carolino")], { id: "a", agora: 5 });
  assert.equal(l.length, 1);
  assert.deepEqual(l[0], { id: "a", nome: "Semanal", atualizada: 5, itens: [
    { nome: "Arroz carolino", categoria: "Mercearia", qty: 2 },
    { nome: "Leite meio-gordo", categoria: "Mercearia", qty: 1, q: "leite" },
  ] });
});

test("guardar: sem nome ou sem artigos não faz nada; o mesmo nome atualiza e sobe", () => {
  assert.deepEqual(guardarLista([], "", [it(1, "Ovos")]), []);
  assert.deepEqual(guardarLista([], "Mensal", []), []);
  let l = guardarLista([], "Semanal", [it(1, "Ovos")], { id: "s" });
  l = guardarLista(l, "Mensal", [it(1, "Azeite")], { id: "m" });
  l = guardarLista(l, "semanal", [it(1, "Pão de forma")], { id: "outro" });
  assert.deepEqual(l.map(x => [x.id, x.nome, x.itens[0].nome]), [["s", "semanal", "Pão de forma"], ["m", "Mensal", "Azeite"]]);
  assert.equal(porNome(l, "SEMANAL").id, "s");
  assert.equal(porNome(l, "Festa"), null);
});

test("guardar: limites de listas e de nome", () => {
  let l = [];
  for (let i = 0; i < MAX_LISTAS + 5; i++) l = guardarLista(l, `L${i}`, [it(1, "Ovos")], { id: `id${i}` });
  assert.equal(l.length, MAX_LISTAS);
  assert.equal(l[0].nome, `L${MAX_LISTAS + 4}`);
  assert.equal(guardarLista([], "x".repeat(99), [it(1, "Ovos")])[0].nome.length, MAX_NOME);
});

test("usar: junta o que falta no topo, não duplica e fica com a maior quantidade", () => {
  const lista = { id: "s", nome: "Semanal", itens: [{ nome: "Ovos", categoria: "Laticínios e ovos", qty: 2 }, { nome: "Arroz", categoria: "Mercearia", qty: 1 }, { nome: "Leite", categoria: "", qty: 6, q: "leite" }] };
  const atuais = [it(1, "ovos"), it(2, "Arroz", { qty: 3 }), it(3, "Leite", { feito: true })];
  let n = 0;
  const r = usarLista(atuais, lista, { novoId: () => `n${++n}` });
  assert.equal(r.novos, 1);
  assert.deepEqual(r.itens.map(x => [x.id, x.nome, x.qty, x.feito]), [["n1", "Leite", 6, false], [1, "ovos", 2, false], [2, "Arroz", 3, false], [3, "Leite", 1, true]]);
  assert.equal(r.itens[0].q, "leite");
  // Lista vazia: entra tudo, pela ordem guardada.
  assert.deepEqual(usarLista([], lista, { novoId: i => i }).itens.map(x => x.nome), ["Ovos", "Arroz", "Leite"]);
});

test("apagar e validar", () => {
  assert.deepEqual(apagarLista([{ id: "a" }, { id: "b" }], "a"), [{ id: "b" }]);
  assert.deepEqual(validarListas(null), []);
  assert.deepEqual(validarListas([{ id: "a", nome: "X", itens: [] }, { id: "b", nome: " ", itens: [] }, { nome: "Y", itens: [] }, 3]).map(l => l.id), ["a"]);
});
