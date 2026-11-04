import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcularCabaz, escolherArtigos, legenda } from "../scripts/cabaz/calcular.mjs";

const config = JSON.parse(fs.readFileSync(new URL("../data/cabazes-social.json", import.meta.url)));

// Preço de 1 por unidade em todas as lojas, exceto onde se diz.
function linhas(tema, ajustes = {}) {
  const out = [];
  for (const a of config.temas[tema].artigos) for (const l of config.lojas) out.push({ q: a.q, loja: l, valor: ajustes[`${a.q}|${l}`] ?? 1, dia: "2026-11-04" });
  return out;
}

test("os temas só têm artigos com q único e qtd positiva", () => {
  for (const [id, t] of Object.entries(config.temas)) {
    const qs = t.artigos.map((a) => a.q);
    assert.equal(new Set(qs).size, qs.length, `q repetido em ${id}`);
    assert.ok(qs.length >= 12, `${id} precisa de pelo menos 12 artigos para variar`);
    assert.ok(t.artigos.every((a) => a.qtd > 0 && a.nome && a.rotulo), id);
  }
});

test("cabaz: 10 artigos, totais e poupança certos", () => {
  const ajustes = {};
  for (const a of config.temas.despensa.artigos) { ajustes[`${a.q}|auchan`] = 2; }
  const c = calcularCabaz({ tema: "despensa", config, linhas: linhas("despensa", ajustes) });
  assert.equal(c.itens.length, 10);
  assert.equal(c.maisCara, "auchan");
  assert.notEqual(c.maisBarata, "auchan");
  const soma = c.itens.reduce((s, i) => s + i.custos.continente, 0);
  assert.ok(Math.abs(c.totais.continente - soma) < 0.02);
  assert.ok(c.poupanca > 0 && c.poupancaPct > 0);
  assert.match(legenda(c), /Cabaz "Despensa"/);
});

test("artigos que saíram há mais tempo têm prioridade", () => {
  const usados = {};
  const artigos = config.temas.despensa.artigos;
  ["2026-11-02", "2026-11-03", "2026-11-04"].forEach((d, k) => (usados[artigos[k].q] = d));
  const { escolhidos } = escolherArtigos(artigos, linhas("despensa"), config.lojas, usados);
  assert.equal(escolhidos.length, 10);
  // 12 artigos, 10 lugares: ficam de fora os 2 usados mais recentemente.
  for (const a of artigos.slice(1, 3)) assert.ok(!escolhidos.some((e) => e.q === a.q), "recentes ficam de fora");
  assert.ok(escolhidos.some((e) => e.q === artigos[0].q));
});

test("artigo sem preço numa loja ou com preços incomparáveis sai do cabaz", () => {
  const artigos = config.temas.despensa.artigos;
  const l = linhas("despensa", { [`${artigos[0].q}|auchan`]: 10 }).filter((x) => !(x.q === artigos[1].q && x.loja === "lidl"));
  const semUm = l.filter((x) => !(x.q === artigos[2].q && x.loja === "continente"));
  const { escolhidos } = escolherArtigos(artigos, semUm, config.lojas, {});
  assert.ok(!escolhidos.some((e) => e.q === artigos[0].q), "razão >3x");
  assert.ok(!escolhidos.some((e) => e.q === artigos[2].q), "falta uma loja");
});

test("falha se não há artigos comparáveis suficientes", () => {
  const l = linhas("despensa").filter((x) => x.q !== "arroz" && x.q !== "farinha" && x.q !== "azeite");
  assert.throws(() => calcularCabaz({ tema: "despensa", config, linhas: l }), /comparáveis/);
});
