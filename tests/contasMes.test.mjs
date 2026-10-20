import { test } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };

const { mesChave, mesNome, diaEfetivo, quandoVence, porPagarOrdenadas, resumoMes, marcarPagamento, lerPagamentos } = await import("../lib/contasMes.js");

const dia = (d, m = 9) => new Date(2026, m, d, 12); // outubro de 2026 por omissão
const contas = [
  { id: "renda", nome: "Renda", valor: 650, diaVencimento: 1 },
  { id: "luz", nome: "Eletricidade", valor: 54.3, diaVencimento: 21 },
  { id: "net", nome: "Internet", valor: 40, diaVencimento: 24 },
  { id: "gym", nome: "Ginásio", valor: 30, diaVencimento: 8 },
];

test("chave do mês, com viragem de ano", () => {
  assert.equal(mesChave(dia(20)), "2026-10");
  assert.equal(mesChave(new Date(2026, 11, 15), 1), "2027-01");
  assert.equal(mesChave(new Date(2026, 0, 31), -1), "2025-12");
});

test("dia 31 num mês de 30 dias é o dia 30; fevereiro, 28", () => {
  assert.equal(diaEfetivo(31, new Date(2026, 10, 5)), 30);
  assert.equal(diaEfetivo(31, new Date(2026, 1, 5)), 28);
  assert.equal(diaEfetivo(15, new Date(2026, 1, 5)), 15);
});

test("quando vence", () => {
  const q = (d, hoje) => quandoVence({ diaVencimento: d }, { pago: false, esMesAtual: true, hoje, data: dia(hoje) }).texto;
  assert.equal(q(20, 20), "Vence hoje");
  assert.equal(q(21, 20), "Vence amanhã");
  assert.equal(q(24, 20), "Dia 24 · daqui a 4 dias");
  assert.equal(q(5, 20), "Dia 5 · já passou");
  assert.equal(q(30, 20), "Dia 30");
  // pago ou noutro mês: só o dia
  assert.equal(quandoVence({ diaVencimento: 5 }, { pago: true, esMesAtual: true, hoje: 20 }).texto, "Dia 5");
});

test("por pagar: as esquecidas primeiro, depois as seguintes por dia", () => {
  const pagos = { renda: true };
  assert.deepEqual(porPagarOrdenadas(contas, pagos, dia(20)).map(c => c.id), ["gym", "luz", "net"]);
});

test("resumo do mês", () => {
  const r = resumoMes(contas, { "2026-10": { renda: true, gym: true } }, dia(20));
  assert.equal(r.proxima.id, "luz");
  assert.equal(r.porPagar, 2);
  assert.ok(Math.abs(r.falta - 94.3) < 1e-9);
  assert.equal(r.total, 4);
  // pagamentos de outro mês não contam
  assert.equal(resumoMes(contas, { "2026-09": { luz: true } }, dia(20)).porPagar, 4);
  // tudo pago
  const tudo = Object.fromEntries(contas.map(c => [c.id, true]));
  assert.equal(resumoMes(contas, { "2026-10": tudo }, dia(20)).proxima, null);
  assert.equal(resumoMes([], {}, dia(20)), null);
});

test("dia 31 em novembro é o 30, paga ou por pagar", () => {
  const nov = new Date(2026, 10, 10, 12);
  assert.equal(quandoVence({ diaVencimento: 31 }, { pago: true, esMesAtual: true, hoje: 10, data: nov }).texto, "Dia 30");
  assert.equal(quandoVence({ diaVencimento: 31 }, { pago: false, esMesAtual: false, hoje: 10, data: nov }).texto, "Dia 30");
});

test("conta com valor 0 continua a contar como por pagar", () => {
  const r = resumoMes([{ id: "x", nome: "Teste", valor: 0, diaVencimento: 25 }], {}, dia(20));
  assert.equal(r.porPagar, 1);
  assert.equal(r.falta, 0);
});

test("marcar e desmarcar um pagamento, sobre o que está guardado", () => {
  mem.clear();
  marcarPagamento("2026-10", "luz", true);
  marcarPagamento("2026-10", "net", true);
  marcarPagamento("2026-10", "luz", false);
  assert.deepEqual(lerPagamentos(), { "2026-10": { net: true } });
});

test("nome do mês, com o ano quando não é o de hoje", () => {
  assert.equal(mesNome(dia(20), 0, dia(20)), "outubro");
  assert.equal(mesNome(dia(20), -10, dia(20)), "dezembro 2025");
});
