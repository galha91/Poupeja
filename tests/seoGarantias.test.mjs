import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularGarantia, perguntasLd, PERGUNTAS_GARANTIAS } from "../lib/seoGarantias.js";

const HOJE = "2026-10-22";

test("bem novo: 3 anos, presunção de 2 e rejeição de 30 dias", () => {
  const r = calcularGarantia({ dataCompra: "2026-10-01" }, HOJE);
  assert.equal(r.fim, "2029-10-01");
  assert.equal(r.fimPresuncao, "2028-10-01");
  assert.equal(r.fimRejeicao, "2026-10-31");
  assert.equal(r.rejeicao, true);
  assert.equal(r.valida, true);
  assert.equal(r.meses, 36);
});

test("usado com redução: 18 meses e presunção de 1 ano", () => {
  const r = calcularGarantia({ dataCompra: "2025-06-15", estado: "usado-18" }, HOJE);
  assert.equal(r.fim, "2026-12-15");
  assert.equal(r.fimPresuncao, "2026-06-15");
  assert.equal(r.presuncao, false);
  assert.equal(calcularGarantia({ dataCompra: "2025-06-15", estado: "usado" }, HOJE).fim, "2028-06-15");
});

test("cada reparação soma 6 meses, até 4", () => {
  assert.equal(calcularGarantia({ dataCompra: "2023-03-31", reparacoes: 1 }, HOJE).fim, "2026-09-30");
  assert.equal(calcularGarantia({ dataCompra: "2023-03-31", reparacoes: 9 }, HOJE).meses, 60);
});

test("antes de 2022 vale o regime antigo; datas inválidas ou futuras não", () => {
  const r = calcularGarantia({ dataCompra: "2021-12-20", reparacoes: 2 }, HOJE);
  assert.equal(r.antigo, true);
  assert.equal(r.fim, "2023-12-20");
  assert.equal(r.valida, false);
  assert.equal(r.rejeicao, false);
  assert.equal(calcularGarantia({ dataCompra: "2026-11-01" }, HOJE), null);
  assert.equal(calcularGarantia({ dataCompra: "" }, HOJE), null);
});

test("FAQPage com todas as perguntas", () => {
  const ld = perguntasLd();
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, PERGUNTAS_GARANTIAS.length);
  assert.ok(ld.mainEntity.every((q) => q.name.endsWith("?") && q.acceptedAnswer.text.length > 40));
});
