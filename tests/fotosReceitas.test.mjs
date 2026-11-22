import { test } from "node:test";
import assert from "node:assert/strict";
import { promptDaFoto, ingredientesVisiveis, ESTILO } from "../lib/receitas/fotoPrompt.js";
import { fotosDe, temFoto, LICENCAS_LIVRES } from "../lib/receitas/fotos.js";
import { receitas } from "../lib/receitas/motor.js";
import MANIFESTO from "../data/fotos-receitas.json";

const todas = receitas();

test("fotografias: o pedido leva o nome, o que se vê no prato e o estilo comum", () => {
  const r = todas.find((x) => x.id === "bacalhau-bras");
  const p = promptDaFoto(r);
  assert.match(p, /bacalhau à Brás/i);
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
  for (const [id, f] of Object.entries(MANIFESTO.fotos)) {
    assert.ok(ids.has(id), id);
    // Uma fotografia real só entra com autor, licença livre e página de origem.
    if (f.fonte !== "ia") assert.ok(f.autor && f.pagina && LICENCAS_LIVRES.test(f.licenca), id);
  }
});

test("fotografias: sem fotografia, nada (fica o emoji)", () => {
  assert.equal(temFoto("receita-que-nao-existe"), false);
  assert.equal(fotosDe("receita-que-nao-existe"), null);
});

/*
 * Orçamento das fotografias (CLAUDE.md, regra 8): cada ficheiro dentro do
 * seu peso máximo e o total abaixo de 60 MB, para não encher o
 * armazenamento dos deploys da Vercel nem gastar transferência à toa.
 */
import { readdirSync, statSync, existsSync } from "node:fs";
const PASTA_FOTOS = new URL("../public/receitas/fotos/", import.meta.url);
const MAX_KB = { "1200.webp": 140, "480.webp": 35, "1x1.webp": 70, "16x9.webp": 90, "og.jpg": 120 };
const MAX_TOTAL_MB = 60;

test("fotografias: cada ficheiro dentro do orçamento e o total abaixo de 60 MB", () => {
  if (!existsSync(PASTA_FOTOS)) return;
  let total = 0;
  for (const f of readdirSync(PASTA_FOTOS)) {
    if (f.startsWith(".")) continue;
    const suf = Object.keys(MAX_KB).find((s) => f.endsWith(`-${s}`));
    assert.ok(suf, `ficheiro inesperado em public/receitas/fotos: ${f}`);
    const kb = statSync(new URL(f, PASTA_FOTOS)).size / 1024;
    assert.ok(kb <= MAX_KB[suf] + 1, `${f}: ${Math.round(kb)} KB (máximo ${MAX_KB[suf]})`);
    total += kb;
  }
  assert.ok(total / 1024 <= MAX_TOTAL_MB, `fotografias: ${Math.round(total / 1024)} MB (máximo ${MAX_TOTAL_MB})`);
});

test("fotografias: cada receita do manifesto tem os 5 ficheiros", () => {
  for (const id of Object.keys(MANIFESTO.fotos)) {
    for (const suf of Object.keys(MAX_KB)) assert.ok(existsSync(new URL(`${id}-${suf}`, PASTA_FOTOS)), `${id}-${suf}`);
  }
});

import { DESCRICOES } from "../lib/receitas/fotoDescricoes.js";
test("fotografias: todas as receitas têm descrição visual, e só receitas que existem", () => {
  const ids = new Set(todas.map((r) => r.id));
  for (const r of todas) assert.ok(DESCRICOES[r.id], `sem descrição: ${r.id}`);
  for (const id of Object.keys(DESCRICOES)) assert.ok(ids.has(id), `descrição de receita que não existe: ${id}`);
});
