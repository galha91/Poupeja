import { test } from "node:test";
import assert from "node:assert/strict";
import { agrupar, porMarca } from "../lib/seoMarcas.js";
import { propsProduto, propsMarca, hashLinha, cacheValida, lerPaginaMarca, VALIDADE_MS } from "../lib/paginasMarca.js";

const hoje = "2026-11-08";
const linha = (loja, id, nome, preco, marca = "Mimosa") => ({
  loja, produto_id: id, q: "leite meio gordo", nome, marca, marca_slug: marca.toLowerCase(), qtd: 1, unidade: "l",
  preco, valor: preco, imagem: null, url: null, primeiro_dia: "2026-10-01", ultimo_dia: hoje,
});
const grupos = agrupar([
  linha("continente", "c1", "Leite Meio Gordo Mimosa 1L", 0.99),
  linha("pingo-doce", "p1", "Leite Meio Gordo Mimosa 1 L", 0.95),
  linha("auchan", "a1", "Leite Magro Mimosa 1L", 0.9),
]);

test("páginas de marca pré-calculadas: produto com ofertas, série e outros da marca", () => {
  const g = grupos.find((x) => x.itens.length === 2);
  const dias = [{ loja: "continente", produto_id: "c1", dia: "2026-11-07", preco: 1.05 }, { loja: "pingo-doce", produto_id: "p1", dia: "2026-11-08", preco: 0.95 }];
  const p = propsProduto(g, grupos, dias, new Map(), hoje);
  assert.equal(p.grupo.slug, g.slug);
  assert.equal(p.dados.ofertas.length, 2);
  assert.equal(p.dados.ofertas[0].preco, 0.95, "a oferta mais barata primeiro");
  assert.equal(p.serie.length, 2);
  assert.ok(p.outros.every((o) => o.slug !== g.slug));
  assert.deepEqual(JSON.parse(JSON.stringify(p)), p, "props serializáveis");
});

test("páginas de marca pré-calculadas: marca com produtos, ou null sem preços", () => {
  const marcas = porMarca(grupos);
  const m = propsMarca(marcas[0], marcas, hoje);
  assert.equal(m.marca.slug, "mimosa");
  assert.ok(m.produtos.length >= 1);
  const semPrecos = { slug: "x", nome: "X", grupos: [] };
  assert.equal(propsMarca(semPrecos, marcas, hoje), null);
});

test("páginas de marca pré-calculadas: o hash só muda quando a página muda", () => {
  const a = { props: { x: 1 }, indexavel: true, atualizado: hoje };
  assert.equal(hashLinha(a), hashLinha({ ...a, props: { x: 1 } }));
  assert.notEqual(hashLinha(a), hashLinha({ ...a, indexavel: false }));
});

test("páginas de marca pré-calculadas: cache velha ou sem selo não serve", async () => {
  const agora = Date.parse("2026-11-08T12:00:00Z");
  assert.equal(cacheValida({ props: { geradoEm: "2026-11-08T00:40:00Z" } }, agora), true);
  assert.equal(cacheValida({ props: { geradoEm: new Date(agora - VALIDADE_MS - 1).toISOString() } }, agora), false);
  assert.equal(cacheValida(undefined, agora), false);
  // Slug inválido nem chega à base de dados.
  assert.deepEqual(await lerPaginaMarca("produto", "../x"), { estado: "nao-existe" });
});
