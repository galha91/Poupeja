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
  // Auditoria de todo o catálogo (30/10/2026).
  ["fermento", "Farinha de Trigo Tipo 55 sem Fermento", "Farinhas", "pingo-doce", 0],
  ["água com gás", "Água caldas de penacova sem gas 1.5l (sdr)", "bebidas/águas", "auchan", 0],
  ["água com gás", "Água com Gás Continente", "Bebidas/Água/Água com Gás", "continente", 2],
  ["água", "Água com Gás", "Águas", "aldi", 1],
  ["choco", "Chocolate de Leite dos Alpes", "Chocolates", "aldi", 1],
  ["choco", "Choco Fresco", "Peixaria", "pingo-doce", 2],
  ["leite gordo", "Leite Meio Gordo UHT", "Leite", "pingo-doce", 1],
  ["leite gordo", "Leite uht gresso m/gordo pack poupança 8 x1l", "leite", "auchan", 1],
  ["leite gordo", "Leite UHT Gordo Mimosa", "Leite", "continente", 2],
  ["leite meio gordo", "Leite UHT Magro", "Leite", "pingo-doce", 0],
  ["leite magro", "Leite UHT Meio Gordo Magro Sabor", "Leite", "pingo-doce", 1],
  ["alho francês", "Alho Francês Continente", "Frutas e Legumes/Legumes/Cebola e Alho", "continente", 2],
  ["alho", "Alho Francês Continente", "Frutas e Legumes/Legumes/Cebola e Alho", "continente", 1],
  ["sal", "Sal auchan máquina loiça 2kg", "limpeza", "auchan", 1],
  ["vinagre", "Vinagre de Limpeza Limão", "Limpeza", "pingo-doce", 1],
  ["bacalhau", "Bacalhau à Gomes de Sá Cozinha Continente", "Refeições", "continente", 1],
  ["bacalhau", "Bacalhau Espiritual", "Pratos Prontos", "pingo-doce", 1],
  ["bacalhau", "Bacalhau Corrente 1ª da Noruega", "Bacalhau", "pingo-doce", 2],
  ["salmão", "Salmão cabeça 2kg a 3kg", "peixaria", "auchan", 1],
  ["natas", "Alternativa à Nata para Culinária", "Natas", "pingo-doce", 1],
  ["fraldas", "Fraldas Incontinência L Continente", "Higiene", "continente", 1],
  ["areia gato", "Caixa de Areia para Gato Fechada Cinza 45x35x32 cm Jomafe", "Animais/Gato/Caixas de Areia e Acessórios", "continente", 1],
  ["areia gato", "Pá para Areia de Gato Continente", "Animais/Gato/Caixas de Areia e Acessórios", "continente", 1],
  ["areia gato", "Areia para Gato É Continente", "Animais/Gato/Areia", "continente", 2],
  ["cavala", "Filetes de Cavala em Azeite", "Conservas", "pingo-doce", 1],
  ["batatas", "Batatas Waffles Birds Eye 10un = 567g", "", "apolonia", 1],
  ["laranjas", "Laranjas de Sevilha Cortadas Ma Made Robertson`s 850g", "", "apolonia", 1],
  ["coca cola", "Refrigerante com Gás Cola Zero Coca-Cola", "Bebidas/Refrigerantes/Refrigerantes com Gás", "continente", 2],
  ["coca cola", "Coca-Cola Original Volta 1,5L", "", "apolonia", 2],
  ["laranja", "Refrigerante de Laranja com Gás", "Refrigerantes", "continente", 1],
];

test("relevância com nomes e secções reais das lojas", () => {
  for (const [q, nome, categoria, loja, esperado] of CASOS) {
    assert.equal(classificar({ nome, categoria }, palavras(q), loja, undefined, q), esperado, `«${q}» → ${nome}`);
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

test("formas processadas: calda, em pó (com acento), frito, peso escorrido", async () => {
  const { separarProcessados } = await import("../lib/supermercados/relevancia.js");
  const ps = [
    { loja: "continente", nome: "Pêssego \"Roer\" Amarelo Continente", relevancia: 2 },
    { loja: "apolonia", nome: "Pêssego em Metades Calda Ferbar 825g", relevancia: 2 },
  ];
  assert.deepEqual(separarProcessados(ps, "pêssegos").map((p) => p.relevancia), [2, 1]);
  const acucar = [
    { loja: "a", nome: "Açúcar Branco", relevancia: 2 }, { loja: "b", nome: "Açúcar Branco", relevancia: 2 },
    { loja: "aldi", nome: "Açúcar em Pó", relevancia: 2 },
  ];
  assert.equal(separarProcessados(acucar, "açúcar")[2].relevancia, 1);
  const cog = [{ loja: "a", nome: "Cogumelos Brancos", relevancia: 2 }, { loja: "b", nome: "Cogumelos laminados auchan 800(460)g", relevancia: 2 }];
  assert.equal(separarProcessados(cog, "cogumelos")[1].relevancia, 1);
  // Milho doce: a lata é o normal; uma loja com espiga fresca não as tira.
  const milho = [{ loja: "a", nome: "Milho Doce Espiga", relevancia: 2 }, ...["b", "c", "d"].map((l) => ({ loja: l, nome: "Milho Doce em Lata", relevancia: 2 }))];
  assert.ok(separarProcessados(milho, "milho doce").every((p) => p.relevancia === 2));
});

test("variantes: magra, light, sabores… só se a loja não tiver a normal", async () => {
  const { eVariante } = await import("../lib/supermercados/relevancia.js");
  assert.ok(eVariante("Manteiga Magra Continente", "manteiga"));
  assert.ok(eVariante("Iogurte Grego Ligeiro Natural", "iogurte grego"));
  assert.ok(eVariante("Croissant de Chocolate Mars", "croissants"));
  assert.ok(!eVariante("Manteiga com Sal", "manteiga"));
  assert.ok(!eVariante("Leite Magro Gresso 1L", "leite magro"));
  assert.ok(!eVariante("Chocolate em Pó", "chocolate em pó"));
});

test("preço com ponto dos milhares e vírgula decimal (Apolónia)", async () => {
  const { lerNumero } = await import("../lib/supermercados/comum.js");
  assert.equal(lerNumero("5.995,00"), 5995);
  assert.equal(lerNumero("2,99"), 2.99);
  assert.equal(lerNumero("1.49"), 1.49);
});
