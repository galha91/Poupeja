import { test } from "node:test";
import assert from "node:assert/strict";
import { idadeDoPreco } from "../lib/frescura.js";

const agora = Date.parse("2026-10-11T15:00:00Z");
const dia = d => Date.parse(`2026-10-${d}T10:00:00Z`);

test("hoje e ontem", () => {
  assert.deepEqual(idadeDoPreco(dia("11"), agora), { dias: 0, texto: "preço de hoje", velho: false });
  assert.equal(idadeDoPreco(dia("10"), agora).texto, "preço de ontem");
});

test("a partir de 3 dias é velho e mostra a data", () => {
  const r = idadeDoPreco(dia("05"), agora);
  assert.equal(r.dias, 6);
  assert.equal(r.velho, true);
  assert.equal(r.texto, "preço de 5/10");
  assert.equal(idadeDoPreco(dia("08"), agora).velho, true);
  assert.equal(idadeDoPreco(dia("09"), agora).velho, false);
});

test("sem data não inventa nada", () => {
  assert.equal(idadeDoPreco(null, agora), null);
  assert.equal(idadeDoPreco(undefined, agora), null);
  assert.equal(idadeDoPreco(NaN, agora), null);
});

test("conta dias de calendário em Lisboa, não blocos de 24 horas", () => {
  // 22:30Z de dia 10 = 23:30 em Lisboa (hora de verão); 23:30Z = 00:30 de dia 11.
  assert.equal(idadeDoPreco(Date.parse("2026-10-10T22:30:00Z"), Date.parse("2026-10-10T23:30:00Z")).dias, 1);
  // Mesmo dia de Lisboa, horas diferentes.
  assert.equal(idadeDoPreco(Date.parse("2026-10-11T08:00:00Z"), Date.parse("2026-10-11T19:00:00Z")).dias, 0);
});
