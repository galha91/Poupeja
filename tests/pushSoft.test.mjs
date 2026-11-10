import { test } from "node:test";
import assert from "node:assert/strict";
import { podeMostrar, adiar, ADIAMENTOS_DIAS } from "../lib/pushSoft.js";

const DIA = 24 * 60 * 60 * 1000;
const t0 = Date.UTC(2026, 9, 17);

test("nunca mostrado: pode mostrar", () => {
  assert.equal(podeMostrar({}, t0), true);
  assert.equal(podeMostrar(undefined, t0), true);
});

test("\"agora não\" adia 3, 7 e 14 dias", () => {
  let e = adiar({}, t0);
  assert.equal(e.vezes, 1);
  assert.equal(e.proxima, t0 + 3 * DIA);
  e = adiar(e, t0 + 3 * DIA);
  assert.equal(e.proxima, t0 + 3 * DIA + 7 * DIA);
  e = adiar(e, t0 + 10 * DIA);
  assert.equal(e.proxima, t0 + 10 * DIA + 14 * DIA);
  assert.equal(e.vezes, 3);
});

test("não volta a mostrar antes do prazo, mostra depois", () => {
  const e = adiar({}, t0);
  assert.equal(podeMostrar(e, t0 + 2 * DIA), false);
  assert.equal(podeMostrar(e, t0 + 3 * DIA), true);
});

test("depois de 3 \"agora não\" deixa de insistir", () => {
  let e = {};
  for (let i = 0; i < ADIAMENTOS_DIAS.length; i++) e = adiar(e, t0);
  assert.equal(podeMostrar(e, t0 + 365 * DIA), false);
});

test("convite aos avisos: na primeira visita não aparece", async () => {
  const { jaTemMotivo } = await import("../lib/pushSoft.js");
  assert.equal(jaTemMotivo({ primeiraVisita: "2026-11-10", hoje: "2026-11-10" }), false);
  assert.equal(jaTemMotivo({}), false);
});

test("convite aos avisos: aparece a quem volta, usou a lista ou tem conta", async () => {
  const { jaTemMotivo } = await import("../lib/pushSoft.js");
  assert.equal(jaTemMotivo({ primeiraVisita: "2026-11-09", hoje: "2026-11-10" }), true);
  assert.equal(jaTemMotivo({ primeiraVisita: "2026-11-10", hoje: "2026-11-10", usouLista: true }), true);
  assert.equal(jaTemMotivo({ primeiraVisita: "2026-11-10", hoje: "2026-11-10", comConta: true }), true);
});
