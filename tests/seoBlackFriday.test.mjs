import { test } from "node:test";
import assert from "node:assert/strict";
import { verificarDesconto, diaBlackFriday, perguntasBlackFridayLd, PERGUNTAS_BLACK_FRIDAY } from "../lib/seoBlackFriday.js";

test("Black Friday: a última sexta-feira de novembro", () => {
  assert.equal(diaBlackFriday(2026), "2026-11-27");
  assert.equal(diaBlackFriday(2025), "2025-11-28");
  assert.equal(diaBlackFriday(2024), "2024-11-29");
});

test("desconto real: o riscado é o mínimo dos 30 dias", () => {
  const r = verificarDesconto({ agora: 70, riscado: 100 });
  assert.equal(r.estado, "real");
  assert.equal(r.anunciado, 30);
  assert.equal(r.real, 30);
  assert.equal(r.poupancaReal, 30);
  // O mínimo visto igual ao riscado não muda nada.
  assert.equal(verificarDesconto({ agora: 70, riscado: 100, minimo30: 100 }).estado, "real");
  // E um "mínimo" acima do riscado também não.
  assert.equal(verificarDesconto({ agora: 70, riscado: 100, minimo30: 120 }).real, 30);
});

test("desconto inflacionado: já esteve mais barato no último mês", () => {
  const r = verificarDesconto({ agora: 79, riscado: 131.67, minimo30: 80 });
  assert.equal(r.estado, "inflacionado");
  assert.equal(r.anunciado, 40);
  assert.equal(r.real, 1);
  assert.equal(r.poupancaReal, 1);
  assert.equal(r.referencia, 80);
});

test("desconto falso e preços sem sentido", () => {
  assert.equal(verificarDesconto({ agora: 79, riscado: 120, minimo30: 75 }).estado, "falso");
  assert.equal(verificarDesconto({ agora: 79, riscado: 120, minimo30: 79 }).estado, "falso");
  assert.equal(verificarDesconto({ agora: 100, riscado: 90 }).estado, "sem-desconto");
  assert.equal(verificarDesconto({ agora: null, riscado: 90 }), null);
  assert.equal(verificarDesconto({ agora: 10, riscado: 0 }), null);
  // Campo do mínimo vazio = não sabe.
  assert.equal(verificarDesconto({ agora: 70, riscado: 100, minimo30: "" }).estado, "real");
});

test("FAQPage com todas as perguntas", () => {
  const ld = perguntasBlackFridayLd();
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, PERGUNTAS_BLACK_FRIDAY.length);
});
