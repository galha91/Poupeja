import { test } from "node:test";
import assert from "node:assert/strict";
import { receitas, receitaPorId } from "../lib/receitas/motor.js";
import {
  COLECOES, GRUPOS_COLECAO, MIN_RECEITAS_COLECAO, colecaoPorSlug, receitasDaColecao, colecoesDaReceita, parecidas,
} from "../lib/receitas/colecoes.js";

test("coleções: slugs únicos, não chocam com receitas, grupo válido", () => {
  const slugs = COLECOES.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const c of COLECOES) {
    assert.match(c.slug, /^[a-z0-9-]+$/);
    assert.equal(receitaPorId(c.slug), null, `/receitas/${c.slug} já é uma receita`);
    assert.ok(GRUPOS_COLECAO.some((g) => g.id === c.grupo), c.slug);
    assert.ok(c.titulo && c.intro && c.curto, c.slug);
    assert.equal(colecaoPorSlug(c.slug), c);
  }
});

test("coleções: cada uma tem receitas suficientes, mais baratas primeiro", () => {
  for (const c of COLECOES) {
    const lista = receitasDaColecao(c);
    assert.ok(lista.length >= MIN_RECEITAS_COLECAO, `${c.slug}: só ${lista.length}`);
    for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].custo <= lista[i].custo, c.slug);
  }
});

test("coleções: o filtro diz a verdade", () => {
  const de = (s) => receitasDaColecao(colecaoPorSlug(s));
  assert.ok(de("vegetarianas").every((r) => r.veg));
  assert.ok(de("veganas").every((r) => r.vegano));
  assert.ok(de("sem-gluten").every((r) => r.dietas.includes("sem-gluten")));
  assert.ok(de("jantares-rapidos").every((r) => r.tempoMin <= 25 && r.tipo === "prato"));
  assert.ok(de("sopas").every((r) => r.tipo === "sopa"));
  assert.ok(de("bacalhau").every((r) => r.ingredientes.some((i) => i.key === "bacalhau")));
  // O chouriço do caldo verde não faz dele uma receita de porco.
  assert.ok(!de("porco").some((r) => r.id === "caldo-verde"));
  assert.ok(!de("frango").some((r) => r.tipo !== "prato"));
});

test("receita: as suas coleções e as parecidas", () => {
  const r = receitaPorId("bacalhau-bras");
  assert.ok(colecoesDaReceita(r).some((c) => c.slug === "bacalhau"));
  const p = parecidas(r);
  assert.equal(p.length, 8);
  assert.ok(!p.some((x) => x.id === r.id));
  assert.ok(p.every((x) => x.tipo === r.tipo));
  assert.equal(p[0].proteina, "peixe");
  // Todas as receitas têm parecidas.
  for (const x of receitas()) assert.ok(parecidas(x).length >= 3, x.id);
});
