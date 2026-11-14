import { test } from "node:test";
import assert from "node:assert/strict";
import { resumoMaisBarato, frenteAFrente } from "../lib/maisBarato.js";

const L = (loja, total) => ({ loja, nome: { continente: "Continente", "pingo-doce": "Pingo Doce", auchan: "Auchan" }[loja], total });
const sem = (dia, lojas, empate = false) => ({ semana: dia, dia, lojas: [...lojas].sort((x, y) => x.total - y.total), empate, artigos: ["a"] });
const HIST = [
  sem("2026-10-05", [L("continente", 10), L("pingo-doce", 10.5), L("auchan", 11)]),
  sem("2026-10-12", [L("continente", 10.2), L("pingo-doce", 10.1), L("auchan", 11)]),
  sem("2026-10-19", [L("continente", 10), L("pingo-doce", 10.05)], true),
  sem("2026-10-26", [L("continente", 9.9), L("pingo-doce", 10.4), L("auchan", 10.6)]),
];

test("resumo: vitórias sem contar empates, distância entre extremos", () => {
  const r = resumoMaisBarato(HIST);
  assert.equal(r.semanas, 4);
  assert.equal(r.empates, 1);
  assert.deepEqual(r.vitorias.map((v) => [v.loja, v.n]), [["continente", 2], ["pingo-doce", 1]]);
  assert.equal(r.ultima.dia, "2026-10-26");
  assert.deepEqual(r.distancia, { min: 0.05, max: 1 });
  assert.equal(resumoMaisBarato(HIST, 2).semanas, 2);
});

test("resumo: sem dados ou dados partidos", () => {
  assert.equal(resumoMaisBarato([]), null);
  assert.equal(resumoMaisBarato(null), null);
  assert.equal(resumoMaisBarato([sem("2026-10-05", [L("continente", 10)])]), null);
});

test("frente a frente: só as semanas em que as duas têm preço", () => {
  const f = frenteAFrente(HIST, "continente", "pingo-doce");
  assert.equal(f.semanas, 4);
  assert.equal(f.a, 3);
  assert.equal(f.b, 1);
  assert.equal(f.ultima.diff, -0.5);
  const g = frenteAFrente(HIST, "auchan", "pingo-doce");
  assert.equal(g.semanas, 3);
  assert.equal(g.b, 3);
  assert.equal(frenteAFrente(HIST, "lidl", "continente"), null);
});
