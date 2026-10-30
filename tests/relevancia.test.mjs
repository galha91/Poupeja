import { test } from "node:test";
import assert from "node:assert/strict";
import { palavras, relevancia, classificar, separarProcessados } from "../lib/supermercados/relevancia.js";

/*
 * Nomes e secções reais, tal como as lojas os devolveram (30/10/2026).
 * [pesquisa, nome, secção, loja, relevância esperada]
 */
const CASOS = [
  // Hambúrguer: o pão não é hambúrguer, mesmo arrumado na secção "Pão de Hambúrguer".
  ["hamburguer", "Pão de Hambúrguer Cristallino", "Supermercado/Padaria e Pastelaria/Pão de Hambúrguer e Cachorro", "continente", 1],
  ["hamburguer", "Pão para Hambúrguer", "Pão de Hambúrguer, Hot Dog e Wraps", "pingo-doce", 1],
  ["hamburguer", "Pão Brioche para Hambúrguer", "Pão de Hambúrguer, Hot Dog e Wraps", "pingo-doce", 1],
  ["hamburguer", "Saco Hambúrguer Silicone Roxo Kasa", "Casa e Jardim/Cozinha/Conservação de Alimentos/Caixas de Plástico", "continente", 1],
  ["hamburguer", "Hambúrguer de Porco Continente", "Supermercado/Talho/Pronto a Cozinhar", "continente", 2],
  ["hamburguer", "Hamburgueres de suino isento de glúten auchan 4*100gr", "produtos-frescos/talho/hambúrgueres-e-carne-picada", "auchan", 2],
  ["hamburguer", "Mini Hambúrguer 100% Carne de Bovino Continente", "Supermercado/Congelados/Hambúrgueres e Almôndegas", "continente", 2],
  // Fruta: purés, bolsas e comida de bebé não são fruta.
  ["fruta", "Pack Puré de Fruta Maçã e Pera +6M Blédina", "Supermercado/Mercearia/Alimentação Infantil/Boiões e Saquetas", "continente", 1],
  ["fruta", "Bolsa de Fruta Banana e Maçã", "Bolsas de Fruta", "pingo-doce", 1],
  ["fruta", "Saqueta de fruta auchan baby maçã e manga 90g", "bebé/preparação-e-alimentação-infantil/pacotinhos-fruta-bebé", "auchan", 1],
  ["fruta", "Fruta bledina 100% maçã e banana 4x95g", "bebé/preparação-e-alimentação-infantil/pacotinhos-fruta-bebé", "auchan", 1],
  // Formato à frente só conta se for só formato: "Massa … salada" não é salada.
  ["salada", "Massa laços integrais milaneza especial salada 500g", "alimentação/mercearia/arroz-e-massa/massas-especialidades", "auchan", 1],
  ["salada", "Sandes Saloia com Lombo e Salada Camponesa", "Saladas, Sandes e Wraps", "pingo-doce", 1],
  ["salada", "Salada Iceberg Continente", "Supermercado/Frutas e Legumes/Saladas", "continente", 2],
  ["salada", "CHEF SELECT Salada Ibérica XXL", "Mundos de necessidade/Alimentos e quase alimentos/Refeições prontas/Saladas, fruta para levar", "lidl", 2],
  ["tomate", "Filetes de Cavala em Tomate", "Conservas de Peixe", "pingo-doce", 1],
  ["laranja", "Tablete de Chocolate Negro Excellence com Laranja", "Tabletes de Chocolate", "pingo-doce", 1],
  ["massa esparguete", "Massa Esparguete Milaneza", "Massas", "continente", 2],
  ["peito de frango", "Peito de Frango", "Talho/Frango e Peru", "pingo-doce", 2],
  ["frango", "Almôndegas de Frango Lusiaves", "Supermercado/Talho/Pronto a Cozinhar", "continente", 1],
  ["atum", "Hambúrguer de Atum Bom Petisco", "Supermercado/Congelados/Peixe", "continente", 1],
  ["queijo", "Pão de queijo auchan sem glúten 300g", "alimentação/padaria/pão-de-queijo", "auchan", 1],
  // Marca à frente: decide a secção, quando é a do artigo ("Leite e natas" é de leite).
  ["leite meio gordo", "MIMOSA Leite Meio-gordo", "Mundos de necessidade/Alimentos e quase alimentos/Queijos, laticínios e ovos/Leite e natas", "lidl", 2],
  ["leite meio gordo", "Leite Meio Gordo UHT Infantil +3A Mimosa", "Supermercado/Laticínios e Ovos/Leite", "continente", 2],
  ["iogurte", "MIMOSA Iogurte de Aromas Natural", "Mundos de necessidade/Alimentos e quase alimentos/Queijos, laticínios e ovos/Iogurtes", "lidl", 2],
  ["pudim proteico", "Pudim Proteico Chocolate Danone", "Supermercado/Laticínios e Ovos/Iogurtes e Outros Lácteos/Proteína", "continente", 2],
  ["azeitonas rodelas", "Azeitona Preta Oxidada em Rodelas Continente", "Supermercado/Frutas e Legumes/Tremoços e Azeitonas", "continente", 2],
  ["bolachas de milho", "Bolachas dos Marinheiros Milho e Sementes de Abóbora Cuétara", "Supermercado/Mercearia/Bolachas e Biscoitos/Bolachas e Biscoitos Salgados", "continente", 2],
];

test("relevância com nomes e secções reais das lojas", () => {
  for (const [q, nome, categoria, loja, esperado] of CASOS) {
    assert.equal(classificar({ nome, categoria }, palavras(q), loja), esperado, `«${q}» → ${nome}`);
  }
});

test("comida de bebé conta quando se pede", () => {
  assert.equal(classificar({ nome: "Saqueta de fruta auchan baby maçã e manga 90g", categoria: "bebé/pacotinhos-fruta-bebé" }, palavras("saqueta fruta baby"), "auchan"), 2);
});

test("sem o termo, não tem a ver", () => {
  assert.equal(relevancia("Pão de forma", palavras("hamburguer"), "Padaria"), 0);
});

test("formas processadas saem quando há frescos em duas lojas", () => {
  const ps = [
    { loja: "a", nome: "Morangos", relevancia: 2 }, { loja: "b", nome: "Morangos", relevancia: 2 },
    { loja: "c", nome: "Morangos Congelados", relevancia: 2 },
  ];
  assert.deepEqual(separarProcessados(ps, "morangos").map((p) => p.relevancia), [2, 2, 1]);
  assert.deepEqual(separarProcessados([{ loja: "c", nome: "Morangos Congelados", relevancia: 2 }], "morangos congelados").map((p) => p.relevancia), [2]);
});
