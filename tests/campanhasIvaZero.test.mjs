import { test } from "node:test";
import assert from "node:assert/strict";
import { campanhaAtiva } from "../lib/campanhas.js";

test("campanhas: o Natal acaba a 26 dez e o IVA zero começa a 27", () => {
  assert.equal(campanhaAtiva("2026-12-26")?.href, "/ceia-de-natal");
  const antes = campanhaAtiva("2026-12-27");
  assert.equal(antes?.href, "/iva-zero");
  assert.match(antes.titulo, /vão descer/);
});

test("campanhas: o IVA zero muda de texto a 1 de janeiro e acaba a 31 de março", () => {
  const depois = campanhaAtiva("2027-01-01");
  assert.equal(depois?.id, "iva-zero-2027");
  assert.match(depois.titulo, /chegou/);
  assert.equal(campanhaAtiva("2027-03-31")?.href, "/iva-zero");
  assert.equal(campanhaAtiva("2027-04-01"), null);
});

test("campanhas: o IVA zero não volta no fim de 2027", () => {
  assert.notEqual(campanhaAtiva("2027-12-28")?.href, "/iva-zero");
});
