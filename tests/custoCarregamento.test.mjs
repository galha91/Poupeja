import { test } from "node:test";
import assert from "node:assert/strict";
import {
  minutosCarregamento, formatarTempo, kwhFornecidos, custoCarregamento, descreverTarifa,
  indexarTarifas, tarifasPerto, tarifaDoConector, IVA,
} from "../lib/custoCarregamento.js";

test("minutos: 20→80% de 60 kWh a 50 kW leva 43 min", () => {
  assert.equal(minutosCarregamento(60, 20, 80, 50, 100), 43);
});

test("minutos: o carro limita a potência do posto", () => {
  // 22 kW no posto, carro aceita 11 kW em AC
  assert.equal(minutosCarregamento(60, 20, 80, 22, 11), minutosCarregamento(60, 20, 80, 11, 11));
});

test("minutos: acima de 80% abranda", () => {
  const ate80 = minutosCarregamento(60, 70, 80, 50, 100);
  const de80 = minutosCarregamento(60, 80, 90, 50, 100);
  assert.ok(de80 > ate80 * 2);
});

test("minutos: sem dados ou intervalo vazio dá null", () => {
  assert.equal(minutosCarregamento(60, 80, 80, 50, 100), null);
  assert.equal(minutosCarregamento(60, 20, 80, 0, 100), null);
  assert.equal(minutosCarregamento(60, 20, 80, 50, null), null);
});

test("formatarTempo", () => {
  assert.equal(formatarTempo(0), "< 1 min");
  assert.equal(formatarTempo(43), "43 min");
  assert.equal(formatarTempo(60), "1h");
  assert.equal(formatarTempo(95), "1h 35min");
});

test("kWh fornecidos contam as perdas", () => {
  assert.equal(kwhFornecidos(50, 20, 80, "DC"), 30 * 1.05);
  assert.equal(kwhFornecidos(50, 20, 80, "AC"), 30 * 1.1);
  assert.equal(kwhFornecidos(50, 80, 20, "AC"), 0);
});

test("custo: soma taxa do posto, energia e IVA", () => {
  const c = custoCarregamento({
    kwh: 30, minutos: 40,
    tarifa: { kwh: 0.25, min: 0.05, sessao: 0.3 },
    energiaKwh: 0.2,
  });
  const posto = 30 * 0.25 + 40 * 0.05 + 0.3; // 9.8
  const energia = 30 * 0.2;                 // 6
  assert.equal(c.posto, Math.round(posto * (1 + IVA) * 100) / 100);
  assert.equal(c.energia, Math.round(energia * (1 + IVA) * 100) / 100);
  assert.equal(c.total, Math.round((posto + energia) * (1 + IVA) * 100) / 100);
});

test("custo: tarifa ao minuto sem tempo não inventa valor", () => {
  assert.equal(custoCarregamento({ kwh: 30, minutos: null, tarifa: { min: 0.05 } }), null);
});

test("custo: tarifa só ao kWh não precisa de tempo", () => {
  const c = custoCarregamento({ kwh: 10, minutos: null, tarifa: { kwh: 0.1 }, energiaKwh: 0 });
  assert.equal(c.total, Math.round(1 * (1 + IVA) * 100) / 100);
});

test("custo: sem tarifa dá null", () => {
  assert.equal(custoCarregamento({ kwh: 10, minutos: 10, tarifa: null }), null);
});

test("posto mais barato a 100 m ganha ao caro", () => {
  const base = { kwh: 30, minutos: 40, energiaKwh: 0.2 };
  const caro = custoCarregamento({ ...base, tarifa: { kwh: 0.35, min: 0.1 } });
  const barato = custoCarregamento({ ...base, tarifa: { kwh: 0.05 } });
  assert.ok(barato.total < caro.total);
});

test("descreverTarifa", () => {
  assert.equal(descreverTarifa({ kwh: 0.25, min: 0.05, sessao: 0.3 }), "0,25 €/kWh · 0,05 €/min · 0,30 €/carreg.");
  assert.equal(descreverTarifa({ kwh: 0, min: 0.025, sessao: 0 }), "0,025 €/min");
  assert.equal(descreverTarifa({ kwh: 0, min: 0, sessao: 0 }), "Sem taxa do posto");
  assert.equal(descreverTarifa(null), null);
});

const POSTOS = [
  [38.7169, -9.1395, "Operador A", [[22, "AC", 0, 0.02, 0.3], [50, "DC", 0.25, 0.05, 0]]],
  [38.7175, -9.14, "Operador B", [[11, "AC", 0.15, 0, 0]]],
  [41.15, -8.61, "Operador C", [[22, "AC", 0.1, 0, 0]]],
];

test("junção: encontra o posto MOBI.E a poucos metros", () => {
  const ind = indexarTarifas(POSTOS);
  const s = tarifasPerto(ind, 38.71693, -9.13955);
  assert.equal(s.operador, "Operador A");
});

test("junção: longe demais não junta", () => {
  const ind = indexarTarifas(POSTOS);
  assert.equal(tarifasPerto(ind, 38.72, -9.13), null);
});

test("junção: funciona na fronteira entre células", () => {
  const ind = indexarTarifas([[38.69999, -9.10001, "X", [[22, "AC", 0.1, 0, 0]]]]);
  assert.equal(tarifasPerto(ind, 38.70001, -9.09999)?.operador, "X");
});

test("junção: dados estragados não rebentam", () => {
  const ind = indexarTarifas([null, [1], ["a", "b", "c", []], ...POSTOS]);
  assert.equal(tarifasPerto(ind, 38.7169, -9.1395).operador, "Operador A");
  assert.equal(tarifasPerto(null, 1, 1), null);
});

test("tarifaDoConector: escolhe pela corrente e potência", () => {
  const s = tarifasPerto(indexarTarifas(POSTOS), 38.7169, -9.1395);
  assert.deepEqual(tarifaDoConector(s, { kw: 50, corrente: "DC" }), { kwh: 0.25, min: 0.05, sessao: 0 });
  assert.deepEqual(tarifaDoConector(s, { kw: 22, corrente: "AC" }), { kwh: 0, min: 0.02, sessao: 0.3 });
  assert.deepEqual(tarifaDoConector(s, { kw: 45 }), { kwh: 0.25, min: 0.05, sessao: 0 });
});

test("tarifaDoConector: corrente sem ponto igual dá null", () => {
  const s = tarifasPerto(indexarTarifas(POSTOS), 38.7175, -9.14);
  assert.equal(tarifaDoConector(s, { kw: 50, corrente: "DC" }), null);
  assert.equal(tarifaDoConector(null, { kw: 50 }), null);
});
