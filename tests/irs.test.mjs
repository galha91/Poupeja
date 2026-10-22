import { test } from "node:test";
import assert from "node:assert/strict";
import { ESCALOES_IRS, DEDUCAO_ESPECIFICA, escalaoDe, coletaDe, taxaMediaNoLimite } from "../lib/irs.js";

test("tabela do art. 68.º (OE 2026): 9 escalões, taxas médias como na lei", () => {
  assert.equal(ESCALOES_IRS.length, 9);
  // Coluna B do art. 68.º (taxa média no limite de cada escalão).
  const medias = ESCALOES_IRS.slice(0, 8).map((e) => Math.round(taxaMediaNoLimite(e) * 100000) / 1000);
  assert.deepEqual(medias, [12.5, 13.579, 15.823, 17.705, 20.579, 25.13, 26.472, 34.856]);
  assert.equal(DEDUCAO_ESPECIFICA, 4587.09);
});

test("escalão e coleta contínuos nos limites", () => {
  assert.equal(escalaoDe(8342).numero, 1);
  assert.equal(escalaoDe(8342.01).numero, 2);
  assert.equal(escalaoDe(1e6).numero, 9);
  for (const e of ESCALOES_IRS.slice(0, 8)) {
    assert.ok(Math.abs(coletaDe(e.ate) - coletaDe(e.ate + 0.01)) < 0.01, `salto em ${e.ate}`);
  }
  assert.equal(coletaDe(0), 0);
});
