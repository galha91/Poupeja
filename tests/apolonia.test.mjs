import { test } from "node:test";
import assert from "node:assert/strict";
import { lerCartoesApolonia } from "../lib/supermercados/apolonia.js";

// Dois cartões tal como vêm na pesquisa da Apolónia (um normal, um em promoção).
const cartao = (id, nome, prices) => `<a class="imglink" href="https://www.apolonia.com/pt/catalogo/${id}/x/" title="${nome}"><div class="img-wrap"><img data-src="https://static.apolonia.com/fotos/produtos/${id}.jpg"></div></a><div class="info"><div><a href="https://www.apolonia.com/pt/catalogo/${id}/x/"><span class="name">${nome}&nbsp;</span></a><span class="prices-container">${prices}</span><span class="favourite"></span><span class="unit-equivalent">1 un = 1l</span></div></div>`;
const p = (cls, v, u) => `<span class="${cls}"><span class="amount">${v}</span><span class="currency">€</span> / ${u}</span>`;
const html = "<html>"
  + cartao(656283, "Leite Inteiro Filtrado Cravendale 2L", p("price", "4,99", "un") + p("price-extra", "2,50", "l"))
  + cartao(11, "Leite Meio-Gordo UHT Gresso 1L",
    p("price promocao", "0,79", "un") + `<span class="price original"><span class="line-through"><span class="amount">0,89</span><span class="currency">€</span> / un</span></span>`
    + p("price-extra promocao", "0,79", "l") + `<span class="price-extra original"><span class="line-through"><span class="amount">0,89</span><span class="currency">€</span> / l</span></span>`)
  + cartao(22, "Maçã Gala", p("price", "2,49", "kg"))
  + "</html>";

test("lê preço, €/L e promoção dos cartões da Apolónia", () => {
  const [cravendale, gresso, maca] = lerCartoesApolonia(html);
  assert.deepEqual([cravendale.nome, cravendale.preco, cravendale.precoUnidade, cravendale.unidade, cravendale.precoAntigo], ["Leite Inteiro Filtrado Cravendale 2L", 4.99, 2.5, "l", null]);
  assert.deepEqual([gresso.preco, gresso.precoAntigo, gresso.precoUnidade, gresso.promo], [0.79, 0.89, 0.79, "Promoção"]);
  assert.equal(gresso.url, "https://www.apolonia.com/pt/catalogo/11/x/");
  assert.deepEqual([maca.aoPeso, maca.precoUnidade, maca.unidade], [true, 2.49, "kg"]);
});
