import { test } from "node:test";
import assert from "node:assert/strict";
import { lerPaginaEci, proximaPaginaEci, urlPaginaEci, SECOES_ECI } from "../lib/supermercados/eci.js";

// Cartões como vêm numa página de secção do supermercado El Corte Inglés.
const cartao = (id, nome, precos, venda, medida) => `<li id="item-${id}" class="grid-item"><div class="food-product-preview-responsive"><img src="https://sgfm.elcorteingles.es/${id}.jpg" alt=""><div class="food-product-preview-responsive__price"><div><!--[--><div class="food-prices">${precos}</div><div class="food-prices__measurement-unit"><span class="food-prices__measurement-unit__label">(</span> ${medida} <span class="food-prices__measurement-unit__label">)</span></div><!--]--></div></div><a class="food-product-preview-responsive__description" href="https://www.elcorteingles.pt/supermercado/${id}-x/">${nome}</a><span class="food-product-preview-responsive__temporal-description"></span><span class="food-product-preview-responsive__sale_type">${venda}</span><div class="product-badges"></div></div></li>`;
const html = `<div data-lr-total-pages="7"><ul>`
  + cartao("B052020615900097", "Leite Fresco Meio Gordo  Vigor", `<div class="food-prices__price">1,16 €</div>`, `embalagem <span class="lighter-gray">|</span> 1 L`, "1,16 € / Litro")
  + cartao("B052018051000349", "Espirais Milaneza", `<div class="food-prices__offer">0,89 €</div><div class="food-prices__price--original">1,29 €</div>`, `embalagem <span class="lighter-gray">|</span> 500 g`, "1,78 € / Kg")
  + cartao("B052020607400080", "Açúcar Sidul", `<div class="food-prices__price">1,09 €</div>`, `unidade`, "1,09 € / Kg")
  + `</ul></div>`;

test("lê preço, €/L, embalagem e promoção da página de secção", () => {
  const { produtos, totalPaginas } = lerPaginaEci(html);
  assert.equal(totalPaginas, 7);
  assert.equal(produtos.length, 3);
  const [leite, massa, acucar] = produtos;
  assert.deepEqual([leite.id, leite.nome, leite.preco, leite.precoUnidade, leite.unidade, leite.quantidade, leite.precoAntigo],
    ["B052020615900097", "Leite Fresco Meio Gordo Vigor", 1.16, 1.16, "l", "1 L", null]);
  assert.deepEqual([massa.preco, massa.precoAntigo, massa.precoUnidade, massa.unidade, massa.quantidade], [0.89, 1.29, 1.78, "kg", "500 g"]);
  assert.equal(massa.url, "https://www.elcorteingles.pt/supermercado/B052018051000349-x/");
  assert.equal(acucar.quantidade, null);
});

test("página sem grelha não dá produtos", () => {
  assert.deepEqual(lerPaginaEci("<html></html>"), { produtos: [], totalPaginas: null });
});

test("cursor avança página a página e depois secção a secção", () => {
  assert.deepEqual(proximaPaginaEci({ seccao: 0, pagina: 1 }, 7, false), { seccao: 0, pagina: 2, concluido: false });
  assert.deepEqual(proximaPaginaEci({ seccao: 0, pagina: 7 }, 7, false), { seccao: 1, pagina: 1, concluido: false });
  assert.deepEqual(proximaPaginaEci({ seccao: 2, pagina: 3 }, 7, true), { seccao: 3, pagina: 1, concluido: false });
  assert.equal(proximaPaginaEci({ seccao: SECOES_ECI.length - 1, pagina: 1 }, 1, false).concluido, true);
});

test("url das páginas de secção", () => {
  assert.equal(urlPaginaEci("mercearia", 1), "https://www.elcorteingles.pt/supermercado/mercearia/");
  assert.equal(urlPaginaEci("mercearia", 3), "https://www.elcorteingles.pt/supermercado/mercearia/3/");
});
