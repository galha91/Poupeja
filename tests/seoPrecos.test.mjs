import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarArtigo, frasesArtigo, mediaAntes, metaArtigo, escolherTitulo, comComparacao, compararPar, fraseParComparado,
  parPorSlug, PARES, custoReceita, produtoLd, artigoPorSlug, ARTIGOS_SEO, dataCurta, vitoriasPorLoja,
} from "../lib/seoPrecos.js";

const HOJE = "2026-10-21";
const l = (dia, loja, valor, extra = {}) => ({ q: "azeite", dia, loja, unidade: "L", valor, preco: valor * 0.75, produto: `Azeite ${loja}`, ...extra });

test("ofertas de hoje: a linha mais recente de cada cadeia, ordenada", () => {
  const d = montarArtigo([
    l("2026-10-20", "continente", 8.2), l("2026-10-21", "continente", 7.9),
    l("2026-10-21", "lidl", 7.1), l("2026-10-19", "pingo-doce", 8.5),
  ], HOJE);
  assert.equal(d.unidade, "L");
  assert.deepEqual(d.ofertas.map((o) => [o.loja, o.valor]), [["lidl", 7.1], ["continente", 7.9], ["pingo-doce", 8.5]]);
  assert.equal(d.atualizado, "2026-10-21");
  assert.equal(d.indexavel, true);
});

test("preço com mais de 3 dias não conta, e uma cadeia sozinha não é indexável", () => {
  const d = montarArtigo([l("2026-10-10", "continente", 8), l("2026-10-21", "lidl", 7)], HOJE);
  assert.deepEqual(d.ofertas.map((o) => o.loja), ["lidl"]);
  assert.equal(d.indexavel, false);
  assert.equal(montarArtigo([], HOJE).indexavel, false);
});

test("unidades diferentes não se misturam", () => {
  const d = montarArtigo([
    l("2026-10-21", "continente", 2, { unidade: "kg" }), l("2026-10-21", "lidl", 2.5, { unidade: "kg" }),
    l("2026-10-21", "aldi", 0.3, { unidade: "un" }),
  ], HOJE);
  assert.equal(d.unidade, "kg");
  assert.equal(d.ofertas.length, 2);
});

test("lojas que já não comparamos ficam de fora", () => {
  const d = montarArtigo([l("2026-10-21", "elcorteingles", 1), l("2026-10-21", "lidl", 7)], HOJE);
  assert.deepEqual(d.ofertas.map((o) => o.loja), ["lidl"]);
});

test("frases saem dos números e não se repetem entre artigos", () => {
  const linhas = [];
  for (let i = 1; i <= 10; i++) linhas.push(l(`2026-10-${String(10 + i).padStart(2, "0")}`, "continente", 8 + i / 10));
  linhas.push(l("2026-10-21", "lidl", 7.1), l("2026-10-21", "pingo-doce", 9));
  const d = montarArtigo(linhas, HOJE);
  const f = frasesArtigo(artigoPorSlug("azeite"), d);
  assert.match(f[0], /1,90 €\/L mais barato no Lidl/);
  assert.match(f[1], /21%/);
  assert.match(f[2], /mais baixo/);
  // Média dos 10 dias anteriores: 8,55 €/L; hoje 7,10 → 17% abaixo.
  assert.equal(f[3], "Está 17% abaixo da média dos 10 dias anteriores (8,55 €/L).");
  const outro = montarArtigo([l("2026-10-21", "continente", 3), l("2026-10-21", "aldi", 3)], HOJE);
  assert.match(frasesArtigo(artigoPorSlug("azeite"), outro)[0], /empatados/);
});

test("títulos cabem em 60 caracteres", () => {
  for (const a of ARTIGOS_SEO) {
    const d = montarArtigo([l("2026-10-21", "pingo-doce", 7), l("2026-10-21", "continente", 8)], HOJE);
    const m = metaArtigo(a, d);
    assert.ok(m.titulo.length <= 60, m.titulo);
    assert.ok(m.descricao.length <= 160);
  }
  assert.equal(escolherTitulo(["x".repeat(70), "curto"]), "curto");
});

test("slugs dos artigos são únicos", () => {
  assert.equal(new Set(ARTIGOS_SEO.map((a) => a.slug)).size, ARTIGOS_SEO.length);
});

test("comparar duas cadeias", () => {
  const resumos = new Map();
  ARTIGOS_SEO.slice(0, 12).forEach((a, i) => {
    resumos.set(a.slug, montarArtigo([
      { ...l("2026-10-21", "continente", 2 + (i % 3 === 0 ? 1 : 0)), q: a.q },
      { ...l("2026-10-21", "pingo-doce", 2.5), q: a.q },
    ], HOJE));
  });
  const artigos = comComparacao(resumos);
  const { par } = parPorSlug("continente-vs-pingo-doce");
  const r = compararPar(par, artigos);
  assert.equal(r.linhas.length, 12);
  assert.equal(r.ganhaA, 8);
  assert.equal(r.ganhaB, 4);
  assert.equal(r.indexavel, true);
  assert.match(fraseParComparado(par, r), /Continente é mais barato em 8/);
  assert.deepEqual(parPorSlug("pingo-doce-vs-continente").invertido, true);
  assert.equal(parPorSlug("x-vs-y"), null);
  assert.equal(PARES.length, 15);
  assert.equal(vitoriasPorLoja(artigos)[0].id, "continente");
});

test("custo da receita só com ingredientes convertíveis", () => {
  const resumos = new Map([
    ["batatas", montarArtigo([{ ...l("2026-10-21", "lidl", 1, { unidade: "kg" }), q: "batatas" }, { ...l("2026-10-21", "aldi", 1.2, { unidade: "kg" }), q: "batatas" }], HOJE)],
    ["cebolas", montarArtigo([{ ...l("2026-10-21", "lidl", 2, { unidade: "kg" }), q: "cebolas" }, { ...l("2026-10-21", "aldi", 2.2, { unidade: "kg" }), q: "cebolas" }], HOJE)],
  ]);
  const c = custoReceita([
    { compra: "Batatas", q: 500, u: "g" },
    { compra: "Cebolas", q: 250, u: "g" },
    { compra: "Azeite", q: 2, u: "colher", despensa: true },
  ], resumos);
  assert.equal(c.total, 1);
  assert.equal(c.comPreco, 2);
  assert.ok(c.ligacoes.some((x) => x.slug === "batatas"));
  assert.equal(custoReceita([{ compra: "Batatas", q: 1, u: "dente" }], resumos).total, null);
});

test("JSON-LD Product com AggregateOffer em euros", () => {
  const d = montarArtigo([l("2026-10-21", "lidl", 7.1), l("2026-10-21", "continente", 7.9)], HOJE);
  const ld = produtoLd("https://x.pt", artigoPorSlug("azeite"), d);
  assert.equal(ld["@type"], "Product");
  assert.equal(ld.offers["@type"], "AggregateOffer");
  assert.equal(ld.offers.priceCurrency, "EUR");
  assert.equal(ld.offers.lowPrice, "5.32");
  assert.equal(ld.offers.highPrice, "5.93");
  assert.equal(ld.offers.offers[0].priceSpecification.referenceQuantity.unitCode, "LTR");
});

test("datas à portuguesa", () => {
  assert.equal(dataCurta("2026-10-21"), "21 out 2026");
  assert.equal(dataCurta("2026-01-05", { ano: false }), "5 jan");
});

test("preços impossíveis ficam de fora", () => {
  const d = montarArtigo([
    l("2026-10-21", "auchan", 0.01, { unidade: "kg", preco: 3.15 }), // seriam 315 kg
    l("2026-10-21", "pingo-doce", 4.25, { unidade: "kg", preco: 0.85 }),
    l("2026-10-21", "continente", 5.98, { unidade: "kg", preco: 2.99 }),
    l("2026-10-21", "aldi", 6.73, { unidade: "kg", preco: 2.69 }),
    l("2026-10-21", "apolonia", 40, { unidade: "kg", preco: 8 }), // > 3× a mediana
  ], HOJE);
  assert.deepEqual(d.ofertas.map((o) => o.loja), ["pingo-doce", "continente", "aldi"]);
  assert.ok(d.serie.every((p) => p.media > 1));
});

test("preços de outro dia não se dizem de hoje", () => {
  const d = montarArtigo([l("2026-10-19", "aldi", 7.1), l("2026-10-19", "continente", 7.9)], HOJE);
  assert.match(frasesArtigo(artigoPorSlug("azeite"), d, HOJE)[0], /^A 19 out é 0,80 €\/L/);
  assert.match(frasesArtigo(artigoPorSlug("azeite"), d, "2026-10-19")[0], /^Hoje/);
});

test("duas cadeias a mais de 3× uma da outra não vão para o Google", () => {
  const d = montarArtigo([l("2026-10-21", "auchan", 9.99, { unidade: "kg", preco: 9.99 }), l("2026-10-21", "continente", 45, { unidade: "kg", preco: 9 })], HOJE);
  assert.equal(d.ofertas.length, 2);
  assert.equal(d.indexavel, false);
});

test("custo da receita com peso médio por unidade e molhos de ervas", () => {
  const kg = (q, v) => montarArtigo([{ ...l("2026-10-21", "lidl", v, { unidade: "kg" }), q }, { ...l("2026-10-21", "aldi", v + 0.1, { unidade: "kg" }), q }], HOJE);
  const resumos = new Map([
    ["cebolas", kg("cebolas", 2)],
    ["alho", kg("alho", 10)],
    ["salsa", montarArtigo([{ ...l("2026-10-21", "lidl", 0.99, { unidade: "embalagem" }), q: "salsa" }, { ...l("2026-10-21", "aldi", 1.2, { unidade: "embalagem" }), q: "salsa" }], HOJE)],
  ]);
  const c = custoReceita([
    { compra: "Cebolas", q: 2, u: "un" },  // 2 × 0,15 kg × 2 €/kg = 0,60
    { compra: "Alho", q: 2, u: "dente" },  // 2 × 0,005 kg × 10 €/kg = 0,10
    { compra: "Salsa", q: 0.5, u: "molho" }, // 0,5 × 0,99 = 0,495
  ], resumos);
  assert.equal(c.comPreco, 3);
  assert.equal(c.total, 1.19); // 1,195 arredondado
});

test("média dos dias anteriores: precisa de 7 dias e não conta hoje", () => {
  const linhas = [];
  for (let i = 1; i <= 7; i++) linhas.push(l(`2026-10-${String(13 + i).padStart(2, "0")}`, "continente", 2));
  const subiu = montarArtigo([...linhas, l(HOJE, "continente", 2.5), l(HOJE, "lidl", 2.6)], HOJE);
  assert.deepEqual(mediaAntes(subiu), { valor: 2, pct: -25, dias: 7 });
  assert.match(frasesArtigo(artigoPorSlug("azeite"), subiu).join(" "), /25% acima da média dos 7 dias anteriores/);
  assert.equal(mediaAntes(montarArtigo([...linhas.slice(1), l(HOJE, "continente", 2.5)], HOJE)), null);
  assert.equal(mediaAntes(montarArtigo([], HOJE)), null);
});

/* ── Boas compras ── */
import { boaCompra, boasCompras } from "../lib/seoPrecos.js";

// 10 dias a ~2,00 €/L no Continente e 2,20 no Lidl; hoje o Continente desce.
const dias30 = (hoje, extra = []) => {
  const out = [];
  for (let i = 10; i >= 1; i--) {
    const dia = new Date(Date.parse(`${HOJE}T12:00:00Z`) - i * 86400000).toISOString().slice(0, 10);
    out.push(l(dia, "continente", i % 2 ? 2.0 : 2.1), l(dia, "lidl", 2.2));
  }
  return [...out, l(HOJE, "continente", hoje), l(HOJE, "lidl", 2.2), ...extra];
};

test("boa compra: no mínimo dos dias anteriores e bem abaixo da média", () => {
  const b = boaCompra(montarArtigo(dias30(1.7), HOJE));
  assert.equal(b.juizo, "minimo");
  assert.equal(b.pct, 17); // média 2,05 → 1,70
  assert.equal(b.dias, 10);
  assert.equal(b.loja, "continente");
});

test("boa compra: o preço de sempre não é boa compra", () => {
  assert.equal(boaCompra(montarArtigo(dias30(2.0), HOJE)), null);
  // No mínimo, mas só 2% abaixo da média: não chega.
  assert.equal(boaCompra(montarArtigo(dias30(2.0 - 0.01), HOJE)), null);
});

test("boa compra: poucos dias de registo não dão juízo", () => {
  const d = montarArtigo([l("2026-10-19", "continente", 2), l("2026-10-20", "continente", 2), l(HOJE, "continente", 1.5), l(HOJE, "lidl", 2.2)], HOJE);
  assert.equal(boaCompra(d), null);
  assert.equal(boaCompra(montarArtigo([], HOJE)), null);
});

test("boas compras: lista ordenada pela maior descida, com o contexto", () => {
  const [a, b] = ARTIGOS_SEO;
  const resumos = new Map([
    [a.slug, montarArtigo(dias30(1.8), HOJE)],
    [b.slug, montarArtigo(dias30(1.6), HOJE)],
  ]);
  const lista = boasCompras(resumos);
  assert.deepEqual(lista.map((x) => x.slug), [b.slug, a.slug]);
  assert.match(lista[0].contexto, /^Continente · 22% abaixo da média de 10 dias · o mais baixo do mês$/);
  assert.equal(lista[0].vencedor.valor, 1.6);
});

test("Lidl: só conta o preço de hoje ou de ontem (preços de folheto)", () => {
  const d = montarArtigo([
    l("2026-10-19", "lidl", 5), l("2026-10-20", "lidl", 5), l("2026-10-21", "continente", 7.9),
    l("2026-10-20", "aldi", 7.5),
  ], "2026-10-22");
  // Lidl visto há 2 dias: fora. Aldi visto há 2 dias: dentro (3 dias).
  assert.deepEqual(d.ofertas.map((o) => o.loja), ["aldi", "continente"]);
});

test("«Hoje» só se os dois preços comparados forem de hoje", () => {
  const d = montarArtigo([l("2026-10-19", "aldi", 7), l(HOJE, "continente", 8)], HOJE);
  assert.match(frasesArtigo(artigoPorSlug("azeite"), d, HOJE)[0], /^A 19 out é/);
  const d2 = montarArtigo([l(HOJE, "aldi", 7), l(HOJE, "continente", 8)], HOJE);
  assert.match(frasesArtigo(artigoPorSlug("azeite"), d2, HOJE)[0], /^Hoje é/);
});
