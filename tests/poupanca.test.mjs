import { test } from "node:test";
import assert from "node:assert/strict";
import { somarPeriodos, juntarRegisto, chaveLista } from "../lib/poupancaListas.js";

// Quinta-feira, 15 de outubro de 2026.
const AGORA = new Date(2026, 9, 15, 12, 0);

test("soma da semana (segunda a domingo) e do mês", () => {
  const r = somarPeriodos([
    { dia: "2026-10-15", valor: 1.1 },
    { dia: "2026-10-12", valor: 2.2 }, // segunda desta semana
    { dia: "2026-10-11", valor: 3.3 }, // domingo da semana passada
    { dia: "2026-09-30", valor: 10 },  // mês passado
  ], AGORA);
  assert.equal(r.semana, 3.3);
  assert.equal(r.mes, 6.6);
  assert.equal(r.total, 16.6);
});

test("ignora valores inválidos e datas futuras", () => {
  const r = somarPeriodos([{ dia: "2026-10-16", valor: 5 }, { dia: "2026-10-14", valor: -1 }, { dia: "2026-10-14" }], AGORA);
  assert.equal(r.semana, 0);
});

test("a mesma lista no mesmo dia conta uma vez (a última escolha)", () => {
  let regs = [];
  regs = juntarRegisto(regs, { dia: "2026-10-15", lista: "abc", valor: 2 });
  regs = juntarRegisto(regs, { dia: "2026-10-15", lista: "abc", valor: 3 });
  regs = juntarRegisto(regs, { dia: "2026-10-15", lista: "xyz", valor: 1 });
  regs = juntarRegisto(regs, { dia: "2026-10-16", lista: "abc", valor: 4 });
  assert.equal(regs.length, 3);
  assert.equal(somarPeriodos(regs, new Date(2026, 9, 16)).semana, 8);
});

test("chave da lista não depende da ordem nem de maiúsculas", () => {
  assert.equal(chaveLista(["Leite", "arroz"]), chaveLista(["Arroz", "leite "]));
  assert.notEqual(chaveLista(["leite"]), chaveLista(["arroz"]));
});
