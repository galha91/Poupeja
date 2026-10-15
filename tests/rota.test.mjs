import { test } from "node:test";
import assert from "node:assert/strict";
import { km, cadeiaDe, maisPertoPorCadeia, kmVolta, avaliarDeslocacao, FATOR_ESTRADA } from "../lib/rota.js";

// ~1,11 km por 0,01° de latitude.
const casa = { lat: 38.7, lon: -9.14 };
const norte = (dLat, extra = {}) => ({ lat: casa.lat + dLat, lon: casa.lon, ...extra });

test("distância em linha reta", () => {
  assert.ok(Math.abs(km(casa, norte(0.01)) - 1.11) < 0.01);
});

test("cadeia a partir das etiquetas do OSM", () => {
  assert.equal(cadeiaDe({ brand: "Continente", name: "Continente Bom Dia Alvalade" }), "continente");
  assert.equal(cadeiaDe({ name: "Pingo Doce Benfica" }), "pingo-doce");
  assert.equal(cadeiaDe({ brand: "My Auchan" }), "auchan");
  assert.equal(cadeiaDe({ brand: "Lidl" }), "lidl");
  assert.equal(cadeiaDe({ name: "ALDI" }), "aldi");
  assert.equal(cadeiaDe({ name: "Mercearia do Zé" }), null);
});

test("a loja mais perto de cada cadeia, dentro do raio", () => {
  const r = maisPertoPorCadeia([
    norte(0.05, { cadeia: "lidl", nome: "Lidl longe" }),
    norte(0.01, { cadeia: "lidl", nome: "Lidl perto" }),
    norte(0.5, { cadeia: "aldi", nome: "Aldi a 55 km" }),
  ], casa);
  assert.equal(r.lidl.nome, "Lidl perto");
  assert.equal(r.aldi, undefined);
});

test("volta casa → loja → casa", () => {
  const d = kmVolta(casa, [norte(0.01)]);
  assert.ok(Math.abs(d - 2 * 1.11 * FATOR_ESTRADA) < 0.02);
});

const perto = { continente: norte(0.01), lidl: norte(0.02), aldi: norte(0.1) };

test("compensa: poupança maior do que o combustível a mais", () => {
  const r = avaliarDeslocacao({
    pos: casa, perto, consumo: 6, precoLitro: 1.6,
    unica: { loja: "continente", total: 50 },
    divisao: { lojas: ["continente", "lidl"], total: 45 },
  });
  assert.equal(r.compensa, true);
  assert.equal(r.poupancaCompras, 5);
  assert.ok(r.combustivelExtra > 0 && r.combustivelExtra < 1);
  assert.ok(r.saldo > 4);
  assert.ok(r.minutosExtra >= 10);
});

test("não compensa: poupar 1 € com a outra loja a 11 km", () => {
  const r = avaliarDeslocacao({
    pos: casa, perto, consumo: 7, precoLitro: 1.7,
    unica: { loja: "continente", total: 50 },
    divisao: { lojas: ["continente", "aldi"], total: 49 },
  });
  assert.equal(r.compensa, false);
  assert.ok(r.saldo < 0);
});

test("sem a loja perto, diz qual falta em vez de inventar", () => {
  const r = avaliarDeslocacao({
    pos: casa, perto: { continente: norte(0.01) }, precoLitro: 1.6,
    unica: { loja: "continente", total: 50 },
    divisao: { lojas: ["continente", "auchan"], total: 45 },
  });
  assert.deepEqual(r.faltam, ["auchan"]);
});

test("dados em falta: null", () => {
  assert.equal(avaliarDeslocacao({ pos: casa, perto, precoLitro: 0, unica: { loja: "lidl", total: 1 }, divisao: { lojas: ["lidl"], total: 1 } }), null);
});

test("cada loja com o combustível: a mais perto pode ganhar", async () => {
  const { lojasComDeslocacao } = await import("../lib/rota.js");
  const r = lojasComDeslocacao({
    pos: casa, consumo: 7, precoLitro: 1.7,
    perto: { continente: norte(0.1), auchan: norte(0.01) },
    porLoja: [{ loja: "continente", total: 18.01 }, { loja: "auchan", total: 18.51 }, { loja: "lidl", total: 17 }],
  });
  assert.equal(r.lojas[0].loja, "auchan"); // 0,50 € mais cara, mas a 1 km em vez de 11
  assert.ok(r.lojas[1].combustivel > 2);
  assert.deepEqual(r.faltam, ["lidl"]);
});
