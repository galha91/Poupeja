import { test } from "node:test";
import assert from "node:assert/strict";
import { nomeBase, textoQtd, armadilhasEmbalagem, detetarReduflacao } from "../lib/reduflacao.js";

const p = (id, nome, qtdBase, precoUnidade, extra = {}) => ({
  loja: "continente", id, nome, qtdBase, precoUnidade, unidade: "kg", preco: precoUnidade * qtdBase, marca: "Caçarola", ...extra,
});

test("nome sem a embalagem", () => {
  assert.equal(nomeBase("Arroz Carolino Família 5 kg"), "arroz carolino");
  assert.equal(nomeBase("Arroz Carolino 1kg"), "arroz carolino");
  assert.equal(nomeBase("Leite Meio Gordo emb. 6 x 1 lt"), "leite meio gordo");
  assert.equal(nomeBase("Bolachas Maria 3x200g"), "bolachas maria");
});

test("quantidade legível", () => {
  assert.equal(textoQtd(0.9, "kg"), "900 g");
  assert.equal(textoQtd(5, "kg"), "5 kg");
  assert.equal(textoQtd(1.5, "l"), "1,5 L");
  assert.equal(textoQtd(0.75, "l"), "750 ml");
  assert.equal(textoQtd(12, "un"), "12 un");
});

test("embalagem família mais cara ao kg é assinalada", () => {
  const r = armadilhasEmbalagem([
    p("a", "Arroz Carolino 1 kg", 1, 1.2),
    p("b", "Arroz Carolino Família 5 kg", 5, 1.35),
  ]);
  const aviso = r.get("continente|b");
  assert.equal(aviso.tipo, "familia");
  assert.equal(aviso.pct, 13);
  assert.equal(aviso.alternativa.qtd, "1 kg");
  assert.equal(r.has("continente|a"), false);
});

test("embalagem grande mais barata não é assinalada", () => {
  const r = armadilhasEmbalagem([
    p("a", "Arroz Carolino 1 kg", 1, 1.2),
    p("b", "Arroz Carolino 5 kg", 5, 1.0),
  ]);
  assert.equal(r.size, 0);
});

test("diferença pequena (arredondamento) não conta", () => {
  const r = armadilhasEmbalagem([p("a", "Arroz 1 kg", 1, 1.0), p("b", "Arroz 5 kg", 5, 1.02)]);
  assert.equal(r.size, 0);
});

test("lojas, marcas e unidades diferentes não se misturam", () => {
  const r = armadilhasEmbalagem([
    p("a", "Arroz Carolino 1 kg", 1, 1.0),
    p("b", "Arroz Carolino 5 kg", 5, 2.0, { loja: "auchan" }),
    p("c", "Arroz Carolino 5 kg", 5, 2.0, { marca: "Cigala" }),
    p("d", "Arroz Carolino 5 kg", 5, 2.0, { unidade: "un" }),
    p("e", "Arroz Carolino 5 kg", 5, 2.0, { aoPeso: true }),
  ]);
  assert.equal(r.size, 0);
});

test("reduflação: encolheu e o preço ao kg subiu", () => {
  const r = detetarReduflacao([
    { qtd: 1, unidade: "kg", preco: 2.49, ultimo_dia: "2026-05-01" },
    { qtd: 0.9, unidade: "kg", preco: 2.49, ultimo_dia: "2026-10-10" },
  ]);
  assert.equal(r.tipo, "encolheu");
  assert.equal(r.pct, 11);
  assert.equal(r.antes.qtd, "1 kg");
  assert.equal(r.agora.qtd, "900 g");
});

test("encolheu mas o preço desceu na mesma proporção: sem aviso", () => {
  assert.equal(detetarReduflacao([
    { qtd: 1, unidade: "kg", preco: 2.5, ultimo_dia: "2026-05-01" },
    { qtd: 0.9, unidade: "kg", preco: 2.25, ultimo_dia: "2026-10-10" },
  ]), null);
});

test("cresceu (o contrário) não é reduflação", () => {
  assert.equal(detetarReduflacao([
    { qtd: 0.9, unidade: "kg", preco: 2.49, ultimo_dia: "2026-05-01" },
    { qtd: 1, unidade: "kg", preco: 2.49, ultimo_dia: "2026-10-10" },
  ]), null);
});

test("um só tamanho ou dados em falta: sem aviso", () => {
  assert.equal(detetarReduflacao([{ qtd: 1, unidade: "kg", preco: 2, ultimo_dia: "2026-10-10" }]), null);
  assert.equal(detetarReduflacao([]), null);
});
