import { test } from "node:test";
import assert from "node:assert/strict";
import { ARTIGOS_NATAL, emEpoca, anoDoNatal, resumirNatal, comHistorico, natalServe, variacaoNatal } from "../lib/natal.js";
import { doCatalogo } from "../lib/catalogoLista.js";

const LOJAS = ["continente", "pingo-doce", "auchan"];
const nome = (id) => ({ continente: "Continente", "pingo-doce": "Pingo Doce", auchan: "Auchan" }[id] || id);
const linhas = (f = 1) => ARTIGOS_NATAL.map((a, i) => ({
  nome: a.nome,
  custos: { continente: (10 + i) * f, "pingo-doce": (11 + i) * f, auchan: (12 + i) * f },
}));

test("natal: todos os artigos existem no catálogo da lista", () => {
  for (const a of ARTIGOS_NATAL) assert.ok(doCatalogo(a.nome), a.nome);
  for (const a of ARTIGOS_NATAL) assert.ok(a.kg > 0 || a.qtd > 0, a.nome);
});

test("natal: a época vai de novembro ao Dia de Reis", () => {
  assert.equal(emEpoca("2026-10-31"), false);
  assert.equal(emEpoca("2026-11-01"), true);
  assert.equal(emEpoca("2026-12-24"), true);
  assert.equal(emEpoca("2027-01-06"), true);
  assert.equal(emEpoca("2027-01-07"), false);
  assert.equal(emEpoca("ontem"), false);
  assert.equal(anoDoNatal("2027-01-03"), 2026);
  assert.equal(anoDoNatal("2026-12-01"), 2026);
});

test("natal: resumo com o detalhe de cada artigo, só nas cadeias comparadas", () => {
  const r = resumirNatal(linhas(), LOJAS, nome);
  assert.equal(r.loja, "continente");
  assert.equal(r.empate, false);
  assert.equal(r.detalhe.length, ARTIGOS_NATAL.length);
  assert.equal(r.detalhe[0].melhor.loja, "continente");
  assert.equal(r.detalhe[0].cara.loja, "auchan");
  assert.equal(r.detalhe[0].txt, ARTIGOS_NATAL[0].txt);
});

test("natal: sem lojas suficientes não há resumo", () => {
  const so1 = ARTIGOS_NATAL.map((a) => ({ nome: a.nome, custos: { continente: 5 } }));
  assert.equal(resumirNatal(so1, LOJAS, nome), null);
});

test("natal: histórico semanal e variação", () => {
  const s1 = comHistorico(resumirNatal(linhas(1), LOJAS, nome), "2026-11-20", []);
  const s2 = comHistorico(resumirNatal(linhas(1.1), LOJAS, nome), "2026-11-27", s1);
  assert.equal(s2.length, 2);
  const v = variacaoNatal({ semanas: s2 });
  assert.ok(v.diff > 0);
  assert.equal(v.desde, "2026-11-20");
});

test("natal: só serve o que tem menos de 3 dias", () => {
  const r = { ...resumirNatal(linhas(), LOJAS, nome), geradoEm: new Date().toISOString() };
  assert.equal(natalServe(r), true);
  assert.equal(natalServe({ ...r, geradoEm: new Date(Date.now() - 4 * 864e5).toISOString() }), false);
  assert.equal(natalServe(null), false);
});
