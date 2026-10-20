import { test } from "node:test";
import assert from "node:assert/strict";
import { lerPrecoFroiz, juntarFroiz } from "../lib/supermercados/froiz.js";

const pagina = (precoHtml, promo = "") => `<html><div class="product-data">${promo}<div class="name">X</div><div class="d-flex"><div class="price" data-v-cdb22e28="">${precoHtml}</div></div></div></html>`;

test("preço normal e em promoção na página do produto", () => {
  assert.deepEqual(lerPrecoFroiz(pagina(`<!----> <span class="" data-v-cdb22e28="">\n 0,86&nbsp;€\n </span>`)), { preco: 0.86, precoAntigo: null, periodo: null });
  const promo = lerPrecoFroiz(pagina(
    `<span style="text-decoration:line-through;font-size:0.8rem;">1,05&nbsp;€</span> <span class="text-primary">\n 0,89&nbsp;€\n </span>`,
    `<span class="text-primary">\n Promoção válida: \n 15-10-2026\n até\n 03-11-2026</span>`,
  ));
  assert.deepEqual(promo, { preco: 0.89, precoAntigo: 1.05, periodo: "15/10 a 03/11" });
  assert.equal(lerPrecoFroiz("<html>sem produto</html>"), null);
});

test("€/L a partir da razão da Empathy e artigos ao peso", () => {
  const garrafa = juntarFroiz({ id: 412, name: "Leite Froiz meio-gordo garrafa 1.5 l", slug: "412-x", measurementUnit: "Litro", measurementUnitRatio: 1.5 }, { preco: 1.29, precoAntigo: null, periodo: null });
  assert.deepEqual([garrafa.precoUnidade, garrafa.unidade, garrafa.url], [0.86, "l", "https://loja.froiz.com/product/412-x"]);
  const pa = juntarFroiz({ id: 1, name: "Pá de porco com osso kg", slug: "1-pa", fractional: true }, { preco: 3.99, precoAntigo: 4.49, periodo: null });
  assert.deepEqual([pa.aoPeso, pa.precoUnidade, pa.unidade, pa.promo], [true, 3.99, "kg", "Promoção"]);
});
