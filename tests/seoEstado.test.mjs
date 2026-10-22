import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoPrazo, slugApoio, prazosDoApoio, apoiosDoPrazo, dataLonga } from "../lib/seoEstado.js";

const irs = { id: "entrega-irs", prazo: { tipo: "anual", periodos: [{ inicio: "04-01", fim: "06-30" }] } };

test("próximo prazo, aberto ou por abrir", () => {
  assert.match(estadoPrazo(irs, "2026-10-22").frase, /Abre a 1 de abril de 2027 e acaba a 30 de junho de 2027/);
  assert.match(estadoPrazo(irs, "2027-06-20").frase, /Está a decorrer: acaba a 30 de junho de 2027 — faltam 10 dias/);
  assert.match(estadoPrazo(irs, "2027-06-30").frase, /Acaba hoje/);
  assert.equal(estadoPrazo({ id: "x", prazo: { tipo: "continuo" } }, "2026-10-22"), null);
});

test("slugs e ligações", () => {
  assert.equal(slugApoio({ id: "imt-isenção-jovem" }), "imt-isencao-jovem");
  const prazos = [{ id: "tarifa-social-energia" }, { id: "prova-escolar" }];
  assert.deepEqual(prazosDoApoio("tarifa-social-gas", prazos).map((p) => p.id), ["tarifa-social-energia"]);
  assert.deepEqual(apoiosDoPrazo("prova-escolar", [{ id: "abono-familia" }]).map((a) => a.id), ["abono-familia"]);
  assert.equal(dataLonga("2027-02-28"), "28 de fevereiro de 2027");
});
