import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularDevolucao, perguntasDevolucoesLd, PERGUNTAS_DEVOLUCOES } from "../lib/seoDevolucoes.js";

const HOJE = "2026-10-22";

test("online: 14 dias a contar do dia seguinte à receção", () => {
  const r = calcularDevolucao({ dataRececao: "2026-10-15" }, HOJE);
  assert.equal(r.fim, "2026-10-29");
  assert.equal(r.faltam, 7);
  assert.equal(r.aberto, true);
  assert.equal(calcularDevolucao({ dataRececao: "2026-10-08" }, HOJE).faltam, 0);
  assert.equal(calcularDevolucao({ dataRececao: "2026-10-07" }, HOJE).aberto, false);
});

test("venda em casa: 30 dias; sem informação: mais 12 meses", () => {
  assert.equal(calcularDevolucao({ dataRececao: "2026-10-01", onde: "casa" }, HOJE).fim, "2026-10-31");
  const r = calcularDevolucao({ dataRececao: "2026-01-10", informado: false }, HOJE);
  assert.equal(r.fim, "2027-01-24");
  assert.equal(r.alargado, true);
  assert.equal(r.aberto, true);
});

test("datas inválidas ou futuras não contam", () => {
  assert.equal(calcularDevolucao({ dataRececao: "2026-10-23" }, HOJE), null);
  assert.equal(calcularDevolucao({ dataRececao: "x" }, HOJE), null);
});

test("FAQPage com todas as perguntas", () => {
  const ld = perguntasDevolucoesLd();
  assert.equal(ld.mainEntity.length, PERGUNTAS_DEVOLUCOES.length);
  assert.ok(ld.mainEntity.every((q) => q.name.endsWith("?")));
});
