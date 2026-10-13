import { test } from "node:test";
import assert from "node:assert/strict";
import { nomeParaPesquisa, codigoValido, urlOpenFoodFacts } from "../lib/codigoBarras.js";

test("tira marca e quantidade, fica o essencial", () => {
  assert.equal(nomeParaPesquisa({ product_name: "Leite UHT Meio Gordo Mimosa 1 L", brands: "Mimosa" }), "leite uht meio gordo");
  assert.equal(nomeParaPesquisa({ product_name_pt: "Azeite Virgem Extra Gallo 750ml", brands: "Gallo, Victor Guedes" }), "azeite virgem extra");
});

test("prefere o nome em português", () => {
  assert.equal(nomeParaPesquisa({ product_name_pt: "Arroz Agulha", product_name: "Long grain rice" }), "arroz agulha");
});

test("sem nome não pesquisa", () => {
  assert.equal(nomeParaPesquisa({}), null);
  assert.equal(nomeParaPesquisa(null), null);
});

test("só aceita EAN-8, UPC-A (12) e EAN-13", () => {
  assert.ok(codigoValido("5601234567890"));
  assert.ok(codigoValido("12345670"));
  assert.ok(!codigoValido("123"));
  assert.ok(!codigoValido("abc4567890123"));
  assert.match(urlOpenFoodFacts("5601234567890"), /openfoodfacts\.org\/api\/v2\/product\/5601234567890\.json/);
});
