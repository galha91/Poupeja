import { test } from "node:test";
import assert from "node:assert/strict";
import { promptDaFoto, ingredientesVisiveis, ESTILO } from "../lib/receitas/fotoPrompt.js";
import { fotosDe, temFoto } from "../lib/receitas/fotos.js";
import { receitas } from "../lib/receitas/motor.js";
import MANIFESTO from "../data/fotos-receitas.json";

const todas = receitas();

test("fotografias: o pedido leva o nome, o que se vê no prato e o estilo comum", () => {
  const r = todas.find((x) => x.id === "bacalhau-bras");
  const p = promptDaFoto(r);
  assert.match(p, /Bacalhau à Brás/);
  assert.match(p, /bacalhau/);
  assert.ok(p.endsWith(ESTILO));
  // Sal, azeite e o resto da despensa não aparecem como ingredientes visíveis.
  assert.ok(!ingredientesVisiveis(r).some((n) => /^(sal|azeite)$/.test(n)));
});

test("fotografias: todas as receitas têm pedido", () => {
  for (const r of todas) assert.ok(promptDaFoto(r).length > ESTILO.length, r.id);
});

test("fotografias: o manifesto só tem receitas que existem", () => {
  const ids = new Set(todas.map((r) => r.id));
  for (const id of MANIFESTO.ids) assert.ok(ids.has(id), id);
});

test("fotografias: sem fotografia, nada (fica o emoji)", () => {
  assert.equal(temFoto("receita-que-nao-existe"), false);
  assert.equal(fotosDe("receita-que-nao-existe"), null);
});
