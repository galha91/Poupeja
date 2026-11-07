import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARTOES_EV, TAR_BT, eVazio, energiaDoCartao, energiaMedia, energiaEscolhida,
  CARTAO_MEDIA, CARTAO_MANUAL, CARTAO_SEM, periodoTri, ativacaoDoCartao,
} from "../lib/cartoesEV.js";

// 15h e 23h em Lisboa (novembro: UTC+0)
const DIA = new Date("2026-11-06T15:00:00Z");
const NOITE = new Date("2026-11-06T23:00:00Z");
const cartao = id => CARTOES_EV.find(c => c.id === id);

test("vazio das 22h às 8h, hora de Lisboa", () => {
  assert.equal(eVazio(DIA), false);
  assert.equal(eVazio(NOITE), true);
  assert.equal(eVazio(new Date("2026-11-06T07:59:00Z")), true);
  assert.equal(eVazio(new Date("2026-11-06T08:00:00Z")), false);
  // verão (UTC+1): 21h30 UTC já são 22h30 em Lisboa
  assert.equal(eVazio(new Date("2026-07-01T21:30:00Z")), true);
});

test("Galp: preço por período, já com TAR", () => {
  assert.equal(energiaDoCartao(cartao("galp"), DIA), 0.2895);
  assert.equal(energiaDoCartao(cartao("galp"), NOITE), 0.2149);
});

test("Iberdrola: preço único, já com TAR", () => {
  assert.equal(energiaDoCartao(cartao("iberdrola"), DIA), 0.2486);
  assert.equal(energiaDoCartao(cartao("iberdrola"), NOITE), 0.2486);
});

test("miio e Via Verde: somam a TAR do período", () => {
  assert.equal(energiaDoCartao(cartao("miio"), DIA), Math.round((0.24 + TAR_BT.foraVazio) * 1e4) / 1e4);
  assert.equal(energiaDoCartao(cartao("viaverde"), NOITE), Math.round((0.148 + TAR_BT.vazio) * 1e4) / 1e4);
});

test("média fica entre o cartão mais barato e o mais caro", () => {
  const vals = CARTOES_EV.map(c => energiaDoCartao(c, DIA));
  const m = energiaMedia(DIA);
  assert.ok(m >= Math.min(...vals) && m <= Math.max(...vals));
});

test("energiaEscolhida: média, cartão, manual e recurso", () => {
  assert.equal(energiaEscolhida(CARTAO_MEDIA, null, DIA), energiaMedia(DIA));
  assert.equal(energiaEscolhida("galp", null, DIA), 0.2895);
  assert.equal(energiaEscolhida(CARTAO_MANUAL, 0.18, DIA), 0.18);
  assert.equal(energiaEscolhida(CARTAO_MANUAL, NaN, DIA), energiaMedia(DIA));
  assert.equal(energiaEscolhida("nao-existe", null, DIA), energiaMedia(DIA));
});

test("todos os cartões têm fonte e data de verificação", () => {
  for (const c of CARTOES_EV) {
    assert.match(c.fonte, /^https:\/\//);
    assert.match(c.verificado, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("sem cartão: sem preço de energia", () => {
  assert.equal(energiaEscolhida(CARTAO_SEM, null, DIA), null);
});

test("tri-horário: vazio, ponta e cheias (inverno e verão)", () => {
  assert.equal(periodoTri(new Date("2026-11-06T23:00:00Z")), "vazio");
  assert.equal(periodoTri(new Date("2026-11-06T09:30:00Z")), "ponta");   // inverno 9h–10h30
  assert.equal(periodoTri(new Date("2026-11-06T15:00:00Z")), "cheias");
  assert.equal(periodoTri(new Date("2026-07-01T10:00:00Z")), "ponta");   // verão 11h em Lisboa
  assert.equal(energiaDoCartao(cartao("factor"), new Date("2026-11-06T09:30:00Z")), 0.3458);
});

test("Prio: soma a TAR do período", () => {
  assert.equal(energiaDoCartao(cartao("prio"), DIA), Math.round((0.1399 + TAR_BT.foraVazio) * 1e4) / 1e4);
});

test("taxa de ativação do próprio cartão", () => {
  assert.equal(ativacaoDoCartao("zunder"), 0.99);
  assert.equal(ativacaoDoCartao("evio"), 0.15);
  assert.equal(ativacaoDoCartao("galp"), 0);
  assert.equal(ativacaoDoCartao("manual"), 0);
});

test("todos os cartões têm um preço calculável agora", () => {
  for (const c of CARTOES_EV) {
    assert.ok(Number.isFinite(energiaDoCartao(c, DIA)), c.id);
    assert.ok(Number.isFinite(energiaDoCartao(c, NOITE)), c.id);
  }
});
