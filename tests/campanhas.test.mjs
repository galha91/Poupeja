import { test } from "node:test";
import assert from "node:assert/strict";
import { campanhaAtiva, hojeEmLisboa } from "../lib/campanhas.js";
import { custoDoPlano } from "../lib/receitasCusto.js";
import { construirEmailFolhetos } from "../lib/emailFolhetos.js";
import { colecaoPorSlug, receitasDaColecao } from "../lib/receitas/colecoes.js";

test("campanhas: Black Friday 2026 é a 27 nov; a campanha cobre os 7 dias antes", () => {
  assert.equal(campanhaAtiva("2026-11-19"), null);
  assert.equal(campanhaAtiva("2026-11-20").id, "black-friday-2026");
  assert.equal(campanhaAtiva("2026-11-27").href, "/black-friday");
});

test("campanhas: depois da Black Friday vem a ceia de Natal, até 26 dez", () => {
  assert.equal(campanhaAtiva("2026-11-28").id, "natal-2026");
  assert.equal(campanhaAtiva("2026-12-24").href, "/ceia-de-natal");
  assert.equal(campanhaAtiva("2026-12-26").id, "natal-2026");
  // A seguir ao Natal vem o IVA zero (27 dez a 31 mar), e depois nada.
  assert.equal(campanhaAtiva("2026-12-27").id, "iva-zero-2027");
  assert.equal(campanhaAtiva("2027-03-31").href, "/iva-zero");
  assert.equal(campanhaAtiva("2027-04-01"), null);
  assert.equal(campanhaAtiva("ontem"), null);
});

test("campanhas: o dia de hoje é o de Lisboa", () => {
  assert.equal(hojeEmLisboa(new Date("2026-06-30T23:30:00Z")), "2026-07-01");
  assert.match(hojeEmLisboa(), /^\d{4}-\d{2}-\d{2}$/);
});

test("email semanal: o bloco da campanha só aparece quando há campanha", () => {
  const folhetos = [{ loja: "Continente", url: "https://exemplo.pt/f" }];
  const base = "https://exemplo.pt";
  const com = construirEmailFolhetos({ nome: "Ana", folhetos, base, campanha: campanhaAtiva("2026-11-30") });
  assert.match(com.html, /ceia de Natal/);
  assert.match(com.html, /ceia-de-natal\?o=email-natal-2026/);
  assert.match(com.text, /ceia-de-natal\?o=email-natal-2026/);
  const sem = construirEmailFolhetos({ nome: "Ana", folhetos, base });
  assert.doesNotMatch(sem.html, /Esta semana<\/p>/);
});

test("plano: o custo soma custo por pessoa × doses, e só com 75% das receitas com custo", () => {
  const custos = { a: 1, b: 2, c: 3 };
  const e = (id, porcoes) => ({ r: { id }, porcoes });
  assert.deepEqual(custoDoPlano([e("a", 4), e("b", 2)], custos), { total: 8, conhecidas: 2, de: 2 });
  // 3 de 4 conhecidas: serve (75%).
  assert.equal(custoDoPlano([e("a", 4), e("b", 4), e("c", 4), e("x", 4)], custos).conhecidas, 3);
  // 1 de 2: não serve.
  assert.equal(custoDoPlano([e("a", 4), e("x", 4)], custos), null);
  assert.equal(custoDoPlano([], custos), null);
  assert.equal(custoDoPlano([e("a", 4)], null), null);
});

test("coleção de Natal: tem a ligação para a ceia e receitas de consoada", () => {
  const c = colecaoPorSlug("natal");
  assert.equal(c.ligacao.href, "/ceia-de-natal");
  const ids = receitasDaColecao(c).map((r) => r.id);
  for (const id of ["bacalhau-gomes-sa", "bacalhau-bras", "rabanadas", "arroz-doce", "aletria"]) assert.ok(ids.includes(id), id);
});
