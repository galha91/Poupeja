import { test } from "node:test";
import assert from "node:assert/strict";
import { agrupar, ofertasProduto, palavrasProduto, rotuloQtd, frasesProduto, metaProduto, produtoMarcaLd, serieProduto, nomeMarca } from "../lib/seoMarcas.js";

const HOJE = "2026-10-21";
const l = (loja, id, nome, preco, extra = {}) => ({
  loja, produto_id: id, q: "leite meio gordo", nome, marca: "MIMOSA", marca_slug: "mimosa",
  qtd: 1, unidade: "l", preco, valor: preco, primeiro_dia: "2026-10-01", ultimo_dia: HOJE, ...extra,
});

test("o mesmo produto em cadeias diferentes fica junto", () => {
  const g = agrupar([
    l("continente", "1", "Leite Mimosa Meio Gordo 1L", 0.95),
    l("pingo-doce", "2", "Leite UHT Meio-Gordo Mimosa", 0.99, { primeiro_dia: "2026-10-05" }),
    l("auchan", "3", "Leite Mimosa Magro 1L", 0.9),
    l("continente", "4", "Leite Mimosa Meio Gordo 6x1L", 5.4, { qtd: 6 }),
  ]);
  assert.equal(g.length, 3);
  const meio = g.find((x) => x.itens.length === 2);
  assert.equal(meio.slug, "leite-mimosa-meio-gordo-1-l");
  assert.equal(meio.marca, "Mimosa");
  const d = ofertasProduto(meio, HOJE);
  assert.deepEqual(d.ofertas.map((o) => o.loja), ["continente", "pingo-doce"]);
  assert.equal(d.indexavel, true);
  assert.match(frasesProduto(meio, d, HOJE)[0], /mais barato no Continente: 0,95 €, menos 0,04 €/);
  assert.ok(metaProduto(meio, d).titulo.length <= 60);
});

test("só uma cadeia, preço velho ou preços incoerentes não vão para o Google", () => {
  const [so] = agrupar([l("continente", "1", "Leite Mimosa Meio Gordo 1L", 0.95)]);
  assert.equal(ofertasProduto(so, HOJE).indexavel, false);
  const [velho] = agrupar([l("continente", "1", "Leite Mimosa Meio Gordo 1L", 0.95), l("lidl", "2", "Leite Mimosa Meio Gordo 1L", 0.9, { ultimo_dia: "2026-10-10" })]);
  assert.equal(ofertasProduto(velho, HOJE).ofertas.length, 1);
  const [doido] = agrupar([l("continente", "1", "Leite Mimosa Meio Gordo 1L", 0.95), l("aldi", "2", "Leite Mimosa Meio Gordo 1L", 3)]);
  assert.equal(ofertasProduto(doido, HOJE).indexavel, false);
});

test("palavras, tamanhos e marcas", () => {
  assert.deepEqual(palavrasProduto("Leite UHT Meio-Gordo Mimosa 1L", "Mimosa"), ["leite", "meio", "gordo"]);
  assert.equal(rotuloQtd(0.25, "kg"), "250 g");
  assert.equal(rotuloQtd(1.5, "l"), "1,5 L");
  assert.equal(rotuloQtd(12, "un"), "12 un");
  assert.equal(nomeMarca("GALLO"), "Gallo");
  assert.equal(nomeMarca("bp"), "BP");
});

test("endereço estável e sem repetidos", () => {
  const g = agrupar([
    l("continente", "1", "Azeite Gallo Virgem Extra 750ml", 6.99, { marca: "Gallo", marca_slug: "gallo", qtd: 0.75 }),
    l("continente", "2", "Azeite Gallo Virgem Extra Clássico 750ml", 7.49, { marca: "Gallo", marca_slug: "gallo", qtd: 0.75, primeiro_dia: "2026-10-02" }),
  ]);
  assert.equal(g.length, 1, "nomes parecidos juntam-se");
  assert.equal(g[0].slug, "azeite-gallo-virgem-extra-750-ml");
});

test("histórico e JSON-LD", () => {
  const [g] = agrupar([l("continente", "1", "Leite Mimosa Meio Gordo 1L", 0.95), l("lidl", "2", "Leite Mimosa Meio Gordo 1L", 0.9)]);
  const s = serieProduto(g, [
    { loja: "continente", produto_id: "1", dia: "2026-10-20", preco: 1 },
    { loja: "lidl", produto_id: "2", dia: "2026-10-20", preco: 0.92 },
    { loja: "lidl", produto_id: "9", dia: "2026-10-20", preco: 0.1 },
  ]);
  assert.deepEqual(s, [{ dia: "2026-10-20", media: 0.92, minimo: 0.92 }]);
  const ld = produtoMarcaLd("https://x.pt", g, ofertasProduto(g, HOJE));
  assert.equal(ld.brand.name, "Mimosa");
  assert.equal(ld.offers.lowPrice, "0.90");
  assert.equal(ld.offers.offerCount, 2);
});
