import { test } from "node:test";
import assert from "node:assert/strict";
import { custoAparelho, poupancaVazio, PRECO_KWH, APARELHOS, perguntasConsumoLd, PERGUNTAS_CONSUMO } from "../lib/consumoEletrico.js";

test("preço por omissão: tarifa regulada simples com IVA a 23%", () => {
  assert.equal(PRECO_KWH, 0.2105);
});

test("custo: watts × horas × dias × preço", () => {
  // O exemplo das perguntas: 200 W, 8 h, 30 dias → 48 kWh.
  const r = custoAparelho({ watts: 200, horasDia: 8, diasMes: 30, precoKwh: 0.21 });
  assert.deepEqual(r, { porHora: 0.042, kwhMes: 48, mes: 10.08, ano: 120.96 });
  assert.equal(custoAparelho({ watts: 2000, horasDia: 4 }).kwhMes, 240);
});

test("valores sem sentido não dão resultado", () => {
  assert.equal(custoAparelho({ watts: 0, horasDia: 2 }), null);
  assert.equal(custoAparelho({ watts: 200, horasDia: 25 }), null);
  assert.equal(custoAparelho({ watts: 200, horasDia: 2, diasMes: 40 }), null);
  assert.equal(custoAparelho({ watts: 20000, horasDia: 2 }), null);
  assert.equal(custoAparelho({ watts: 200, horasDia: 2, precoKwh: NaN }), null);
});

test("todos os aparelhos de referência têm custo e ids únicos", () => {
  for (const a of APARELHOS) assert.ok(custoAparelho(a)?.mes > 0, a.id);
  assert.equal(new Set(APARELHOS.map((a) => a.id)).size, APARELHOS.length);
});

test("passar para as horas de vazio", () => {
  // 0,9 kWh × 12 = 10,8 kWh/mês × (0,2045 − 0,1143) × 1,23
  assert.deepEqual(poupancaVazio({ watts: 900, horasDia: 1, diasMes: 12 }), { mes: 1.2, ano: 14.38 });
  assert.equal(poupancaVazio({ watts: 0, horasDia: 1 }), null);
});

test("FAQPage com todas as perguntas", () => {
  assert.equal(perguntasConsumoLd().mainEntity.length, PERGUNTAS_CONSUMO.length);
});
