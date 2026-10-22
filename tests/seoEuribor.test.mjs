import { test } from "node:test";
import assert from "node:assert/strict";
import { lerSerieBce, resumirEuribor, prazoPorSlug, nomeMes } from "../lib/seoEuribor.js";

const bce = {
  dataSets: [{ series: { "0:0:0:0:0:0:0": { observations: { 0: [2.5], 1: [2.4512], 2: [2.1], 13: [2.05] } } } }],
  structure: { dimensions: { observation: [{ values: Array.from({ length: 14 }, (_, i) => ({ id: `${2025 + Math.floor((i + 8) / 12)}-${String(((i + 8) % 12) + 1).padStart(2, "0")}` })) }] } },
};

test("lê a série mensal do BCE", () => {
  const s = lerSerieBce(bce);
  assert.deepEqual(s[0], { periodo: "2025-09", valor: 2.5 });
  assert.equal(s[1].valor, 2.451);
  assert.equal(s[s.length - 1].periodo, "2026-10");
  assert.deepEqual(lerSerieBce({}), []);
});

test("resumo com variação e prestação", () => {
  const serie = [{ periodo: "2025-10", valor: 2.2 }, { periodo: "2026-09", valor: 2.1 }, { periodo: "2026-10", valor: 2.05 }];
  const r = resumirEuribor(serie, prazoPorSlug("6-meses"));
  assert.match(r.frases[0], /Euribor a 6 meses ficou em 2,050% em outubro de 2026/);
  assert.match(r.frases[1], /Desceu 0,050% face a setembro de 2026/);
  assert.match(r.frases[2], /150 000 € a 30 anos|150 000 €|150.000 €/);
  assert.match(r.frases[2], /menos do que há um ano/);
  assert.ok(r.prestacao > 600 && r.prestacao < 700);
  assert.equal(nomeMes("2026-01"), "janeiro de 2026");
  assert.equal(resumirEuribor([], prazoPorSlug("3-meses")), null);
});
