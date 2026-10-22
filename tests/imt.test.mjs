import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularImt, imtTabela, deducaoSeloJovem, TABELAS_IMT } from "../lib/imt.js";

const C = TABELAS_IMT.continente;

test("tabelas práticas coincidem com a taxa média do art. 17.º no limite de cada escalão", () => {
  // Taxas médias publicadas no art. 17.º, n.º 1, al. a): 0,5379 / 1,7274 / 3,8361 %.
  assert.equal(imtTabela(C.hpp, 145470), 782.48);
  assert.equal(Math.round((imtTabela(C.hpp, 198347) / 198347) * 1e6) / 1e4, 1.7274);
  assert.equal(Math.round((imtTabela(C.hpp, 330539) / 330539) * 1e6) / 1e4, 3.8361);
  // As tabelas jovem e de habitação também não saltam entre escalões.
  assert.equal(imtTabela(C.jovem, 330539), 0);
  assert.equal(imtTabela(C.habitacao, 106346), 1063.46);
  assert.equal(imtTabela(C.habitacao, 145470), 1845.94);
});

test("habitação própria e permanente", () => {
  assert.equal(calcularImt({ valor: 100000 }).imt, 0);
  const r = calcularImt({ valor: 300000 });
  assert.equal(r.imt, 10542.04);
  assert.equal(r.selo, 2400);
  assert.equal(r.total, 12942.04);
  assert.equal(calcularImt({ valor: 700000 }).imt, 42000);
  assert.equal(calcularImt({ valor: 1200000 }).imt, 90000);
});

test("segunda casa, rústico e outros", () => {
  assert.equal(calcularImt({ valor: 300000, destino: "habitacao" }).imt, 11605.5);
  assert.equal(calcularImt({ valor: 50000, destino: "rustico" }).imt, 2500);
  assert.equal(calcularImt({ valor: 200000, destino: "outro" }).imt, 13000);
});

test("IMT Jovem", () => {
  assert.equal(deducaoSeloJovem(), 2644.31);
  const a = calcularImt({ valor: 300000, jovens: 1 });
  assert.equal(a.imt, 0);
  assert.equal(a.selo, 0);
  assert.equal(a.poupancaJovem, 12942.04);
  const b = calcularImt({ valor: 400000, jovens: 1 });
  assert.equal(b.imt, 5556.88);
  assert.equal(b.selo, 555.69);
  // Acima de 660 982 € não há benefício.
  const c = calcularImt({ valor: 700000, jovens: 1 });
  assert.equal(c.imt, 42000);
  assert.equal(c.selo, 5600);
  assert.equal(c.jovemSemBeneficio, true);
  // Só conta para habitação própria e permanente.
  assert.equal(calcularImt({ valor: 300000, destino: "habitacao", jovens: 1 }).imt, 11605.5);
});

test("casal: cada um paga pela sua metade", () => {
  const um = calcularImt({ valor: 300000, compradores: 2, jovens: 1 });
  assert.equal(um.imt, 5271.02);
  assert.equal(um.selo, 1200);
  const dois = calcularImt({ valor: 400000, compradores: 2, jovens: 2 });
  assert.equal(dois.imt, 5556.88);
  assert.equal(dois.selo, 555.68); // 2 × (1600 − 1322,16)
});

test("Açores e Madeira: escalões 25% acima", () => {
  assert.equal(calcularImt({ valor: 130000, regiao: "ilhas" }).imt, 0);
  assert.equal(calcularImt({ valor: 400000, regiao: "ilhas", jovens: 1 }).imt, 0);
  assert.equal(deducaoSeloJovem("ilhas"), 3305.39);
});

test("Imposto do Selo do crédito", () => {
  const r = calcularImt({ valor: 250000, emprestimo: 200000 });
  assert.equal(r.seloCredito, 1200);
  assert.equal(r.total, r.imt + r.selo + 1200);
});
