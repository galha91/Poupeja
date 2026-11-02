import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarItem, termoPesquisa, paginaMetrica, limparTexto, detalheEvento } from "../lib/metricas.js";

test("eventos: nome válido e detalhe curto", () => {
  assert.deepEqual(normalizarItem({ tipo: "evento", chave: "share", detalhe: "lista" }), { tipo: "evento", chave: "share", detalhe: "lista", valor: 0, bom: false });
  assert.equal(normalizarItem({ tipo: "evento", chave: "Share!" }), null);
  assert.equal(normalizarItem({ tipo: "outro", chave: "share" }), null);
  assert.equal(normalizarItem(null), null);
});

test("detalhe do evento: primeiro parâmetro conhecido, nunca valores", () => {
  assert.equal(detalheEvento({ screen_name: "comparar", q: "leite" }), "comparar");
  assert.equal(detalheEvento({ ok: true }), "");
  assert.equal(detalheEvento({ origem: "seo", tipo: "preco" }), "preco");
  assert.equal(detalheEvento(undefined), "");
});

test("pesquisas: normaliza e recusa números longos", () => {
  assert.equal(termoPesquisa("  Leite  Meio-Gordo! "), "leite meio gordo");
  assert.equal(termoPesquisa("5601234567890"), "");
  assert.equal(termoPesquisa("a"), "");
  assert.equal(termoPesquisa("x".repeat(80)).length, 40);
  assert.equal(normalizarItem({ tipo: "pesquisa_vazia", chave: "Açaí" }).chave, "açaí");
});

test("páginas: sem query nem ids", () => {
  assert.equal(paginaMetrica("/lista/a1b2c3d4e5?x=1"), "/lista/…");
  assert.equal(paginaMetrica("/lista/[id]"), "/lista/[id]");
  assert.equal(paginaMetrica("/Combustiveis/"), "/combustiveis");
  assert.equal(paginaMetrica("https://x.com/a"), "");
});

test("erros: tira emails e números longos", () => {
  assert.equal(limparTexto("falhou para ana@x.pt no 912345678"), "falhou para … no …");
  const e = normalizarItem({ tipo: "erro", chave: "/", detalhe: "TypeError: x is undefined" });
  assert.equal(e.detalhe, "TypeError: x is undefined");
  assert.equal(normalizarItem({ tipo: "erro", chave: "/", detalhe: "" }), null);
});

test("vitais: só métricas conhecidas, com limite de bom", () => {
  assert.deepEqual(normalizarItem({ tipo: "vital", chave: "LCP", valor: 1800.4, detalhe: "/" }), { tipo: "vital", chave: "LCP", detalhe: "/", valor: 1800.4, bom: true });
  assert.equal(normalizarItem({ tipo: "vital", chave: "INP", valor: 450, detalhe: "/" }).bom, false);
  assert.equal(normalizarItem({ tipo: "vital", chave: "XYZ", valor: 1, detalhe: "/" }), null);
  assert.equal(normalizarItem({ tipo: "vital", chave: "LCP", valor: -1, detalhe: "/" }), null);
  assert.equal(normalizarItem({ tipo: "vital", chave: "CLS", valor: "abc", detalhe: "/" }), null);
});
