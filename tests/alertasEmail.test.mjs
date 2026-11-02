import { test } from "node:test";
import assert from "node:assert/strict";
import { validarPedido, decidirAviso } from "../lib/alertasEmail.js";

const base = { email: " Ana@Mail.PT ", q: "Azeite", alvo: "4.5", unidade: "l", modo: "unidade", valorAtual: 5.2, consentimento: true, convidado: "123e4567-e89b-12d3-a456-426614174000" };

test("pedido: valida e normaliza", () => {
  const { alerta } = validarPedido(base);
  assert.equal(alerta.email, "ana@mail.pt");
  assert.equal(alerta.q, "azeite");
  assert.equal(alerta.alvo, 4.5);
  assert.equal(alerta.tipo, "alvo");
  assert.equal(alerta.convidado_id, base.convidado);
});

test("pedido: recusa sem consentimento, email mau ou alvo inválido", () => {
  assert.ok(validarPedido({ ...base, consentimento: false }).erro);
  assert.ok(validarPedido({ ...base, email: "x@" }).erro);
  assert.ok(validarPedido({ ...base, alvo: 0 }).erro);
  assert.ok(validarPedido({ ...base, unidade: "<script>" }).erro);
  assert.equal(validarPedido({ ...base, convidado: "lixo" }).alerta.convidado_id, null);
});

test("pedido: vigiar não precisa de alvo", () => {
  const { alerta } = validarPedido({ ...base, tipo: "vigiar", alvo: undefined, promo: true });
  assert.equal(alerta.tipo, "vigiar");
  assert.equal(alerta.alvo, null);
  assert.equal(alerta.promo_na_criacao, true);
});

test("alvo: avisa abaixo do alvo, com 3 dias de pausa", () => {
  const a = { tipo: "alvo", alvo: 4.5, unidade: "l" };
  assert.equal(decidirAviso(a, { valor: 4.4, unidade: "l" }, "2026-11-10").avisar, true);
  assert.equal(decidirAviso(a, { valor: 4.6, unidade: "l" }, "2026-11-10").avisar, false);
  assert.equal(decidirAviso(a, { valor: 4.4, unidade: "kg" }, "2026-11-10").avisar, false);
  assert.equal(decidirAviso({ ...a, ultimo_aviso: { dia: "2026-11-09" } }, { valor: 4.4, unidade: "l" }, "2026-11-10").avisar, false);
  assert.equal(decidirAviso({ ...a, ultimo_aviso: { dia: "2026-11-07" } }, { valor: 4.4, unidade: "l" }, "2026-11-10").avisar, true);
});

test("vigiar: avisa uma vez por descida e limpa quando sobe", () => {
  const a = { tipo: "vigiar", referencia: 5, unidade: "l", promo_na_criacao: false };
  const d1 = decidirAviso(a, { valor: 4.5, unidade: "l", promo: false }, "2026-11-10");
  assert.equal(d1.avisar, true);
  assert.equal(decidirAviso({ ...a, ultimo_aviso: d1.registo }, { valor: 4.5, unidade: "l" }, "2026-11-11").avisar, false);
  assert.equal(decidirAviso({ ...a, ultimo_aviso: d1.registo }, { valor: 5.2, unidade: "l" }, "2026-11-12").registo, null);
});

test("aparecer: pedido sem preço; avisa quando há resultado e termina", () => {
  const { alerta } = validarPedido({ email: "ana@mail.pt", q: "Tofu Fumado", consentimento: true, tipo: "aparecer" });
  assert.equal(alerta.tipo, "aparecer");
  assert.equal(alerta.q, "tofu fumado");
  assert.equal(alerta.referencia, 0);
  assert.equal(decidirAviso(alerta, undefined, "2026-11-10").avisar, false);
  const d = decidirAviso(alerta, { valor: 3.2, unidade: "kg" }, "2026-11-10");
  assert.equal(d.avisar, true);
  assert.equal(d.motivo, "apareceu");
  assert.equal(d.terminar, true);
});
