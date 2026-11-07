import { test } from "node:test";
import assert from "node:assert/strict";
import { segundosCacheCombustivel, MAX_S, cabecalhoCacheCombustivel } from "../lib/cacheCombustivel.js";

const t = (iso) => segundosCacheCombustivel(new Date(iso));

test("cache dos combustíveis: 2 h a meio do dia", () => {
  assert.equal(t("2026-11-07T14:00:00Z"), MAX_S);
});

test("cache dos combustíveis: nunca passa a meia-noite", () => {
  assert.equal(t("2026-11-07T23:30:00Z"), 1800); // inverno: Lisboa = UTC
  assert.equal(t("2026-07-07T22:30:00Z"), 1800); // verão: meia-noite de Lisboa às 23:00 UTC
});

test("cache dos combustíveis: nunca passa a chegada dos preços novos", () => {
  assert.equal(t("2026-11-07T05:00:00Z"), 3600);
});

test("cache dos combustíveis: 30 min enquanto os preços do dia podem chegar", () => {
  assert.equal(t("2026-11-07T06:00:00Z"), 1800);
  assert.equal(t("2026-11-07T07:14:00Z"), 1800);
  assert.equal(t("2026-11-07T07:15:00Z"), MAX_S);
});

test("cache dos combustíveis: nunca menos de 1 minuto", () => {
  assert.equal(t("2026-11-07T23:59:59Z"), 60);
  assert.equal(cabecalhoCacheCombustivel(new Date("2026-11-07T14:00:00Z")), `public, s-maxage=${MAX_S}`);
});
