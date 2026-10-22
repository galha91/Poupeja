import { test } from "node:test";
import assert from "node:assert/strict";
import { verificarTarifaSocial, limiteRendimento, perguntasTarifaLd } from "../lib/seoTarifaSocial.js";

test("limite de rendimento: +50% por pessoa sem rendimentos, até 10", () => {
  assert.equal(limiteRendimento(6272.64, 0), 6272.64);
  assert.equal(limiteRendimento(6272.64, 2), 12545.28);
  assert.equal(limiteRendimento(5808, 15), limiteRendimento(5808, 10));
});

test("com RSI tem direito às três", () => {
  const r = verificarTarifaSocial({ prestacoes: ["rsi"] });
  assert.ok(r.luz.tem && r.gas.tem && r.internet.tem);
  assert.equal(r.luz.porque, "prestacao");
});

test("abono: luz e internet sempre, gás só no 1.º escalão", () => {
  const dois = verificarTarifaSocial({ prestacoes: ["abono"], escalaoAbono: 2 });
  assert.equal(dois.luz.tem, true);
  assert.equal(dois.internet.tem, true);
  assert.equal(dois.gas.tem, false);
  assert.equal(dois.gas.porque, "abono-escalao");
  assert.equal(verificarTarifaSocial({ prestacoes: ["abono"], escalaoAbono: 1 }).gas.tem, true);
});

test("pensão social de velhice não dá gás", () => {
  const r = verificarTarifaSocial({ prestacoes: ["velhice"] });
  assert.equal(r.luz.tem, true);
  assert.equal(r.gas.tem, false);
});

test("por rendimento: luz até 6272,64 €, internet até 5808 €, gás nunca", () => {
  const r = verificarTarifaSocial({ rendimento: 6000, semRendimento: 0 });
  assert.equal(r.luz.tem, true);
  assert.equal(r.internet.tem, false);
  assert.equal(r.internet.falta, 192);
  assert.equal(r.gas.tem, false);
  assert.equal(verificarTarifaSocial({ rendimento: 8000, semRendimento: 1 }).internet.tem, true);
  assert.equal(verificarTarifaSocial({}).luz.porque, "falta-rendimento");
});

test("FAQPage", () => {
  assert.equal(perguntasTarifaLd()["@type"], "FAQPage");
});
