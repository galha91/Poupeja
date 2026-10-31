import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { lerLeroy, unidadesNoPack } from "../lib/casa/leroy.js";
import { lerIkea } from "../lib/casa/ikea.js";
import { completarUnidade, lerQuantidade } from "../lib/supermercados/comum.js";
import { palavras, classificar } from "../lib/supermercados/relevancia.js";

// Respostas reais de 31/10/2026 (pesquisa "lampada led e27"), cortadas ao essencial.
const html = fs.readFileSync(new URL("./fixtures/casa/leroy-lampada.html", import.meta.url), "utf8");
const json = JSON.parse(fs.readFileSync(new URL("./fixtures/casa/ikea-lampada.json", import.meta.url), "utf8"));

test("Leroy Merlin: lê o JSON da pesquisa, com pack e imagem", () => {
  const p = lerLeroy(html);
  const pack = p.find((x) => x.id === "86558570");
  assert.equal(pack.nome, "Pack de 3 Lâmpadas LED E27 806lm cor da luz branco quente 2700K Lexman");
  assert.equal(pack.preco, 4.49);
  assert.equal(pack.quantidade, "3 un");
  assert.equal(pack.marca, "Lexman");
  assert.match(pack.url, /^https:\/\/www\.leroymerlin\.pt\/produtos\/.+86558570\.html$/);
  assert.match(pack.imagem, /media\.adeo\.com/);
  // Preço com desconto: o antigo fica como precoAntigo.
  const r7s = p.find((x) => x.id === "86549750");
  assert.equal(r7s.preco, 4.98);
  assert.equal(r7s.precoAntigo, 10.99);
});

test("Leroy Merlin: o marketplace (vendedores de fora) fica de fora", () => {
  const p = lerLeroy(html);
  assert.ok(!p.some((x) => x.id === "85652164")); // 7house_store, 3P
  assert.ok(p.length >= 10);
});

test("Leroy Merlin: página sem o JSON é avaria, não zero produtos", () => {
  assert.throws(() => lerLeroy("<html><body>Erro</body></html>"), /sem lista de produtos/);
});

test("unidades no pack", () => {
  assert.equal(unidadesNoPack("Pack de 3 Lâmpadas LED E27"), 3);
  assert.equal(unidadesNoPack("Conjunto 4 parafusos"), 4);
  assert.equal(unidadesNoPack("Silicone sanitário 280 ml"), 1);
  assert.equal(unidadesNoPack("Lâmpada LED E27 806lm"), 1);
});

test("IKEA: preço aos pares é o preço do conjunto", () => {
  const p = lerIkea(json);
  const par = p.find((x) => x.id === "50591482");
  assert.equal(par.nome, "Lâmpada LED E27 470 lúmenes SOLHETTA, globo branco opala");
  assert.equal(par.preco, 1.5);
  assert.equal(par.quantidade, "2 un");
  assert.deepEqual(completarUnidade(par), { ...par, precoUnidade: 0.75, unidade: "un" });
  assert.throws(() => lerIkea({}), /sem lista de produtos/);
});

test("«470 lúmenes» não são 470 litros", () => {
  assert.equal(lerQuantidade("Lâmpada LED E27 470 lúmenes"), null);
  assert.deepEqual(lerQuantidade("Tinta branca 15 L"), { qtd: 15, unidade: "l" });
  assert.deepEqual(lerQuantidade("Silicone 280 ml"), { qtd: 0.28, unidade: "l" });
  const p = lerIkea(json).find((x) => x.id === "80591447");
  assert.equal(completarUnidade(p).precoUnidade, 2.99);
  assert.equal(completarUnidade(p).unidade, "un");
});

test("as lâmpadas das duas lojas contam como o artigo procurado", () => {
  const q = "lampada led e27", termos = palavras(q);
  for (const [loja, p] of [["leroy-merlin", lerLeroy(html)[0]], ["ikea", lerIkea(json)[0]]]) {
    assert.equal(classificar(p, termos, loja, "unidade", q), 2, p.nome);
  }
});
