import { test } from "node:test";
import assert from "node:assert/strict";
import { avaliarVigia, resumoAtual } from "../lib/alertas.js";

const alerta = { referencia: 2.0, promoNaCriacao: false };

test("avisa quando desce da referência", () => {
  assert.deepEqual(avaliarVigia(alerta, { valor: 1.8, promo: false }), { avisar: true, motivo: "desceu", limpar: false });
});

test("não avisa se está igual ou mais caro", () => {
  assert.equal(avaliarVigia(alerta, { valor: 2.0, promo: false }).avisar, false);
  assert.equal(avaliarVigia(alerta, { valor: 2.5, promo: false }).avisar, false);
});

test("avisa quando entra em promoção, mas não se já estava quando começou a vigiar", () => {
  assert.equal(avaliarVigia(alerta, { valor: 2.0, promo: true }).motivo, "promo");
  assert.equal(avaliarVigia(alerta, { valor: 2.0, promo: true }).avisar, true);
  assert.equal(avaliarVigia({ referencia: 2, promoNaCriacao: true }, { valor: 2.0, promo: true }).avisar, false);
});

test("não repete o aviso para o mesmo preço; volta a avisar se descer mais", () => {
  const reg = { valor: 1.8, dia: "2026-10-01" };
  assert.equal(avaliarVigia(alerta, { valor: 1.8, promo: false }, reg).avisar, false);
  assert.equal(avaliarVigia(alerta, { valor: 1.6, promo: false }, reg).avisar, true);
});

test("quando o preço volta a subir, o registo limpa-se", () => {
  const r = avaliarVigia(alerta, { valor: 2.1, promo: false }, { valor: 1.8, dia: "2026-10-01" });
  assert.equal(r.avisar, false);
  assert.equal(r.limpar, true);
});

test("resumoAtual lê o preço certo e a promoção", () => {
  const p = { preco: 3, precoUnidade: 1.5, precoAntigo: 4, lojaNome: "Auchan", nome: "X" };
  assert.deepEqual(resumoAtual(p, "unidade"), { valor: 1.5, promo: true, loja: "Auchan", nome: "X" });
  assert.equal(resumoAtual({ ...p, precoAntigo: null }, "embalagem").valor, 3);
  assert.equal(resumoAtual({ ...p, precoAntigo: null }, "embalagem").promo, false);
});
