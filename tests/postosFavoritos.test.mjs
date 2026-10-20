import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
};

const {
  chavePosto, guardarFicha, apagarFicha, lerFichas, completarFichas,
  favoritosComFicha, precosDoPosto, escolherDestaque, agruparPedidos, distanciaKm, LS_FAV, LS_FAV_VISTO,
} = await import("../lib/postosFavoritos.js");

const galp = { id: 101, nome: "Galp Benfica", marca: "Galp", municipio: "Lisboa", lat: 38.75, lon: -9.2 };
const linha = (e, tipoLabel, preco) => ({ ...e, tipoLabel, preco, dataPreco: "2026-10-20T00:00:00.000Z" });

beforeEach(() => mem.clear());

test("guardar e apagar a ficha de um favorito", () => {
  guardarFicha(galp);
  const k = chavePosto(galp);
  assert.equal(k, "galp benfica__Lisboa");
  assert.deepEqual(lerFichas()[k], { id: 101, nome: "Galp Benfica", marca: "Galp", municipio: "Lisboa", lat: 38.75, lon: -9.2 });
  apagarFicha(k);
  assert.deepEqual(lerFichas(), {});
});

test("favoritos antigos ganham ficha quando o posto aparece", () => {
  const k = chavePosto(galp);
  mem.set(LS_FAV, JSON.stringify([k]));
  assert.equal(favoritosComFicha().length, 0);
  const mudou = completarFichas([k], [linha(galp, "Gasóleo", 1.6), linha({ ...galp, id: 7, nome: "Outro" }, "Gasóleo", 1.5)]);
  assert.equal(mudou, true);
  assert.equal(favoritosComFicha()[0].id, 101);
  // Segunda vez já não há nada a fazer
  assert.equal(completarFichas([k], [linha(galp, "Gasóleo", 1.6)]), false);
});

test("ficha sem coordenadas não conta", () => {
  guardarFicha({ ...galp, lat: null, lon: null });
  mem.set(LS_FAV, JSON.stringify([chavePosto(galp)]));
  assert.equal(favoritosComFicha().length, 0);
});

test("preços do posto pelo id, um por combustível, do mais barato", () => {
  const ficha = { chave: chavePosto(galp), id: 101 };
  const estacoes = [
    linha(galp, "Gasolina 95", 1.799),
    linha(galp, "Gasóleo", 1.659),
    linha({ ...galp, id: 202 }, "Gasóleo", 1.5),   // outro posto, mesmo nome
    linha(galp, "Gasóleo", 1.669),                   // duplicado: fica o mais barato
  ];
  assert.deepEqual(precosDoPosto(estacoes, ficha).map(p => [p.tipo, p.preco]), [["Gasóleo", 1.659], ["Gasolina 95", 1.799]]);
});

test("sem id, procura pelo nome e concelho", () => {
  const ficha = { chave: chavePosto(galp), id: null };
  const p = precosDoPosto([linha({ ...galp, id: 999 }, "GPL Auto", 0.9)], ficha);
  assert.equal(p[0].tipo, "GPL Auto");
});

test("destaque: o habitual, senão gasóleo, senão o primeiro", () => {
  const precos = [{ tipo: "GPL Auto", preco: 0.9 }, { tipo: "Gasóleo", preco: 1.6 }, { tipo: "Gasolina 95", preco: 1.8 }];
  assert.equal(escolherDestaque(precos, "Gasolina 95").tipo, "Gasolina 95");
  assert.equal(escolherDestaque(precos, "Gasolina 98").tipo, "Gasóleo");
  assert.equal(escolherDestaque([{ tipo: "GPL Auto", preco: 0.9 }], "Gasóleo").tipo, "GPL Auto");
  assert.equal(escolherDestaque([], "Gasóleo"), null);
});

test("GPL das Definições é o GPL Auto da DGEG", () => {
  const precos = [{ tipo: "Gasóleo", preco: 1.6 }, { tipo: "GPL Auto", preco: 0.9 }];
  assert.equal(escolherDestaque(precos, "GPL").tipo, "GPL Auto");
});

test("dois postos com a mesma chave: não se adivinha, mas fica marcado como tentado", () => {
  const k = "galp__Lisboa";
  const a = { id: 1, nome: "", marca: "Galp", municipio: "Lisboa", lat: 38.7, lon: -9.1 };
  const b = { ...a, id: 2, lat: 38.8 };
  const ambos = [linha({ ...a, nome: "Galp" }, "Gasóleo", 1.6), linha({ ...b, nome: "Galp" }, "Gasóleo", 1.7)];
  assert.equal(completarFichas([k], ambos), false);
  assert.deepEqual(lerFichas(), {});
  assert.equal(JSON.parse(mem.get(LS_FAV_VISTO)), true);
});

test("favoritos perto partilham um pedido; longe, não", () => {
  const lisboa1 = { lat: 38.75, lon: -9.2 }, lisboa2 = { lat: 38.76, lon: -9.23 }, porto = { lat: 41.15, lon: -8.61 };
  const g = agruparPedidos([lisboa1, lisboa2, porto]);
  assert.equal(g.length, 2);
  assert.equal(g[0].fichas.length, 2);
  // o raio do grupo apanha os dois postos
  for (const f of g[0].fichas) assert.ok(distanciaKm(g[0], f) <= g[0].raio);
  assert.ok(Math.abs(distanciaKm(lisboa1, porto) - 274) < 5);
});
