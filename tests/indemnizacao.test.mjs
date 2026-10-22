import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularCompensacao, mesesEntre } from "../lib/indemnizacao.js";

const ts = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };

test("meses entre datas, com o último dia incluído", () => {
  assert.equal(mesesEntre(ts("2010-10-01"), ts("2012-11-01")), 25);
  assert.equal(mesesEntre(ts("2014-01-01"), ts("2023-01-01")), 108);
  assert.equal(mesesEntre(ts("2020-01-01"), ts("2020-01-16")), 0.5);
});

/* Exemplos do artigo do Doutor Finanças sobre as regras do regime transitório (RMMG de 2022). */
test("contrato de 01/10/2010 despedido a 31/12/2022: 30 dias, 20 dias e 12 dias", () => {
  const r = calcularCompensacao({ retribuicao: 1950, inicio: "2010-10-01", fim: "2022-12-31", rmmg: 705 });
  assert.deepEqual(r.partes.map((p) => [p.dias, p.meses]), [[30, 25], [20, 11], [12, 111]]);
  assert.equal(r.total, 12469.17);
});

test("contrato de 01/01/2014 despedido a 31/12/2022: 12 dias × 108 meses", () => {
  const r = calcularCompensacao({ retribuicao: 1950, inicio: "2014-01-01", fim: "2022-12-31", rmmg: 705 });
  assert.equal(r.total, 7020);
});

test("contrato de 01/01/2015 despedido a 31/05/2023: 12 dias até abril e 14 dias a partir de maio de 2023", () => {
  const r = calcularCompensacao({ retribuicao: 3000, inicio: "2015-01-01", fim: "2023-05-31", rmmg: 760 });
  assert.deepEqual(r.partes.map((p) => [p.dias, p.meses]), [[12, 100], [14, 1]]);
  assert.equal(r.total, 10116.67);
});

test("contrato de 01/09/2016 despedido a 31/07/2023", () => {
  const r = calcularCompensacao({ retribuicao: 2500, inicio: "2016-09-01", fim: "2023-07-31", rmmg: 760 });
  assert.equal(r.total, 6958.33);
});

test("a parcela mais antiga que já passa o limite fica sozinha (mesmo acima do teto)", () => {
  // Retribuição acima de 20 × RMMG: a parcela antiga usa a retribuição inteira.
  const a = calcularCompensacao({ retribuicao: 15000, inicio: "2000-01-01", fim: "2022-12-31", rmmg: 705 });
  assert.equal(a.partes.length, 1);
  assert.equal(a.total, 192500);
  const b = calcularCompensacao({ retribuicao: 2500, inicio: "2000-09-01", fim: "2023-07-31", rmmg: 760 });
  assert.equal(b.partes.length, 1);
  assert.equal(b.total, 30416.67);
});

test("o total não passa de 12 retribuições quando as parcelas somam mais", () => {
  // 2005 → 2026 com 3000 €: a parcela de 30 dias já dá 7 anos e 10 meses e passa de 12 retribuições? 235 dias = 7,8 meses < 12
  const r = calcularCompensacao({ retribuicao: 3000, inicio: "2005-01-01", fim: "2022-12-31", rmmg: 705 });
  assert.equal(r.total, 36000);
  assert.equal(r.limitado, true);
});

test("nos contratos anteriores a 1/11/2011 o mínimo é de três retribuições; nos outros não há mínimo", () => {
  const antigo = calcularCompensacao({ retribuicao: 1200, inicio: "2010-01-01", fim: "2011-06-30" });
  assert.equal(antigo.total, 3600);
  assert.equal(antigo.subminimo, true);
  const novo = calcularCompensacao({ retribuicao: 1200, inicio: "2025-01-01", fim: "2026-06-30" });
  assert.equal(novo.total, 840); // 14 dias × 1,5 anos
  assert.equal(novo.subminimo, false);
});

test("retribuição acima de 20 × RMMG é limitada (2026: 18 400 €)", () => {
  const r = calcularCompensacao({ retribuicao: 30000, inicio: "2020-01-01", fim: "2026-12-31" });
  assert.equal(r.retribuicaoLimitada, 18400);
  assert.equal(r.teto, 220800); // 240 × 920
});

test("contrato a termo: 24 dias por ano desde 2023 (exemplo do guia: 800 € e 2 anos dão 1280 €)", () => {
  const r = calcularCompensacao({ tipo: "termo", retribuicao: 800, inicio: "2023-06-01", fim: "2025-05-31" });
  assert.equal(r.total, 1280);
  assert.deepEqual(r.partes.map((p) => [p.dias, p.meses]), [[24, 24]]);
});

test("contrato a termo anterior a 2013 fica fora do âmbito", () => {
  assert.equal(calcularCompensacao({ tipo: "termo", retribuicao: 800, inicio: "2012-01-01", fim: "2013-01-01" }).foraDoAmbito, true);
});

test("justa causa do trabalhador: de 15 a 45 dias por ano, mínimo de três meses", () => {
  const r = calcularCompensacao({ tipo: "justa-causa", retribuicao: 1500, inicio: "2016-01-01", fim: "2025-12-31" });
  assert.equal(r.minimoLegal, 7500); // 15 × 50 × 10
  assert.equal(r.maximoLegal, 22500); // 45 × 50 × 10
});

test("faltam dados ou datas trocadas: devolve null", () => {
  assert.equal(calcularCompensacao({ retribuicao: 0, inicio: "2020-01-01", fim: "2021-01-01" }), null);
  assert.equal(calcularCompensacao({ retribuicao: 1000, inicio: "2021-01-01", fim: "2020-01-01" }), null);
});
