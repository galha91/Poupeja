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

/*
 * Pesquisas livres (o que as pessoas escrevem à mão) — nomes reais, 31/10/2026.
 */
const LIVRES = [
  // Marcas: a marca vem no fim do nome; o tipo de produto decide.
  ["nutella", "Creme para Barrar Chocolate e Avelãs Nutella", "Mel/Nutella e Cremes de Barrar", "continente", 2],
  ["nutella", "Gelado Nutella", "Gelados", "continente", 1],
  ["philadelphia", "Queijo para Barrar Light Philadelphia", "Queijos/Queijo para Barrar", "continente", 2],
  ["philadelphia", "Queijo Cottage Philadelphia", "Queijos Frescos/Cottage", "continente", 1],
  ["special k", "Cereais Special K Classic", "", "pingo-doce", 2],
  ["sagres", "Cerveja com Álcool em Lata Sagres", "Cervejas/Cerveja Tradicional", "continente", 2],
  ["sagres", "Sardinhas em tomate sagres 120 (84)g", "mercearia/conservas/sardinha", "auchan", 1],
  ["heineken", "Cerveja com Álcool Heineken", "Cervejas", "continente", 2],
  ["super bock", "Cerveja com Álcool Super Bock", "Cervejas", "continente", 2],
  ["7up", "Refrigerante com Gás 7up Zero", "Refrigerantes com Gás", "pingo-doce", 2],
  ["monster", "Monster Energy Zero Volta 50cl", "", "apolonia", 2],
  ["monster", "Monstera deliciosa em vaso cerâmica", "plantas-e-flores", "auchan", 1],
  ["ariel", "Detergente Máquina Roupa Cápsulas Ariel", "Limpeza/Roupa", "continente", 2],
  ["ariel", "Disney - Boneca Princesa Ariel", "Brinquedos e Jogos/Bonecas", "continente", 1],
  ["ajax", "Lava Tudo Limão Ajax", "Limpeza/Chão e Superfícies/Lava Tudo", "continente", 2],
  ["ajax", "Ajax Nº 1 - O Gato Está na Maior", "Literatura e Coleções Infantis", "continente", 1],
  ["m&m", "Drageias de Chocolate com Amendoim M&M's", "Snacks de Chocolate", "continente", 2],
  ["m&m", "M&M Gold Edition Baga Espumante Bairrada Bruto Nature", "Champanhe e Espumante", "continente", 1],
  ["nespresso", "Cápsulas de Café Nespresso Clássico", "Cápsulas de Café", "pingo-doce", 2],
  ["nespresso", "Detergente Cápsulas de Limpeza para Máquinas Nespresso HG", "", "apolonia", 1],
  ["cream crackers", "Bolachas Cream Cracker Continente", "Bolachas", "continente", 2],
  ["coca cola", "Absolut and Sprite Cocktail", "Bebidas Espirituosas", "continente", 0],
  ["sprite", "Absolut and Sprite Cocktail", "Bebidas Espirituosas", "continente", 1],
  // Parecidos e imitações.
  ["bifes", "Bifes Soja Protisoja Salutem 250g", "", "apolonia", 1],
  ["leite em pó", "Leite em Pó NAN 4 OptiPro", "Alimentação Infantil", "pingo-doce", 1],
  ["leite em pó", "Leite em Pó Gordo", "Leite em Pó", "pingo-doce", 2],
  ["cebolinho", "Cebolinho Vaso Primeira Folha", "", "apolonia", 1],
  ["algodão", "Algodão Limpa Pratas Duraglit 75g", "", "apolonia", 1],
  ["figos", "Figo com farinha auchan 1 kg", "", "auchan", 1],
];

test("pesquisas livres: marcas, imitações e parecidos", () => {
  for (const [q, nome, categoria, loja, esperado] of LIVRES) {
    assert.equal(classificar({ nome, categoria }, palavras(q), loja, undefined, q), esperado, `«${q}» → ${nome}`);
  }
});

test("palavras soltas e marcas com vários produtos pedem o artigo", async () => {
  const { eGenerico, exemplosGenerico, termoDePesquisa } = await import("../lib/comparacao.js");
  for (const t of ["pão", "Leite", "queijo", "Café", "vinho", "refrigerante", "bolachas", "danone", "Nescafé", "fairy", "carne de vaca", "feijão", "couve", "detergente", "papa"]) {
    assert.ok(eGenerico(t), `«${t}» devia pedir o artigo`);
    assert.ok(exemplosGenerico(t).length > 3);
  }
  for (const t of ["pão de forma", "leite magro", "coca cola", "nutella", "queijo ralado", "café moído", "detergente loiça", "feijão verde", "sagres"]) {
    assert.ok(!eGenerico(t), `«${t}» não devia pedir o artigo`);
  }
  // O que as lojas percebem.
  assert.equal(termoDePesquisa("Yogurte natural"), "iogurte natural");
  assert.equal(termoDePesquisa("hamburger"), "hambúrguer");
  assert.equal(termoDePesquisa("chicletes"), "pastilhas elásticas");
  assert.equal(termoDePesquisa("bifes de vaca"), "bifes de novilho");
  // Abreviaturas só quando são abreviaturas: "máquina" e "embalagem" ficam como estão.
  assert.equal(termoDePesquisa("pastilhas máquina loiça"), "pastilhas máquina loiça");
  assert.equal(termoDePesquisa("Detergente máq. loiça"), "detergente máquina loiça");
  assert.equal(termoDePesquisa("embalagem de ovos"), "embalagem de ovos");
});

test("cerejas em licor não são cerejas", async () => {
  const { separarProcessados } = await import("../lib/supermercados/relevancia.js");
  const ps = [{ loja: "auchan", nome: "Cereja nacional caixa 2 kg", relevancia: 2 }, { loja: "apolonia", nome: "Cerejas Pretas Luxardo Kirsch Opies 460g", relevancia: 2 },
    { loja: "continente", nome: "Cereja Continente", relevancia: 2 }];
  assert.deepEqual(separarProcessados(ps, "cerejas").map((p) => p.relevancia), [2, 1, 2]);
});

test("embalagens pequenas: o preço «por 100» com a etiqueta «€/kg» corrige-se", async () => {
  const { corrigirPrecoPorCem } = await import("../lib/supermercados/comum.js");
  // Casos reais de 31/10/2026: o rótulo da loja vinha 10× abaixo do real.
  assert.equal(corrigirPrecoPorCem(2.69, 2.99, { qtd: 0.09, unidade: "kg" }), 29.89);   // M&M's 90 g (Auchan)
  assert.equal(corrigirPrecoPorCem(1.98, 2.64, { qtd: 0.075, unidade: "l" }), 26.4);    // pasta de dentes 75 ml (Continente)
  assert.equal(corrigirPrecoPorCem(1.29, 2.69, { qtd: 0.048, unidade: "kg" }), 26.88);  // croissant 48 g (Continente)
  // O que está certo fica como está.
  assert.equal(corrigirPrecoPorCem(1.99, 13.27, { qtd: 0.15, unidade: "kg" }), 13.27);  // 150 g
  assert.equal(corrigirPrecoPorCem(8.2, 20.5, { qtd: 0.4, unidade: "kg" }), 20.5);
  assert.equal(corrigirPrecoPorCem(1.09, 10.38, { qtd: 0.23, unidade: "kg" }), 10.38);  // «230(105) g»: a loja usa o peso escorrido
  assert.equal(corrigirPrecoPorCem(4.29, 4.29, { qtd: 12, unidade: "un" }), 4.29);      // unidades não
  assert.equal(corrigirPrecoPorCem(0, 2.99, { qtd: 0.09, unidade: "kg" }), 2.99);
  assert.equal(corrigirPrecoPorCem(2.69, 2.99, null), 2.99);
});

test("nutella & go, bebida láctea e multipacks de ml são variantes; batatas fritas pede o artigo", async () => {
  const { eVariante } = await import("../lib/supermercados/relevancia.js");
  const { eGenerico } = await import("../lib/comparacao.js");
  assert.ok(eVariante("Bebida Láctea Cappuccino de Aveia", "bebida de aveia"));
  assert.ok(eVariante("Gelado Fizz Limão Olá 6x60ml", "gelado"));
  assert.equal(classificar({ nome: "Creme Nutella & Go Breadsticks 52g", categoria: "" }, palavras("nutella"), "apolonia", undefined, "nutella"), 1);
  assert.ok(eGenerico("batatas fritas") && !eGenerico("batatas fritas lisas"));
});

test("tamanho impossível na ficha da loja: a pasta de dentes de «750 ml» é de 75 ml", async () => {
  const { corrigirTamanho, corrigirPrecoPorCem } = await import("../lib/supermercados/comum.js");
  const pasta = "Pasta de Dentes Branqueadora Gengivas+Hálito e Sensibilidade Pastas de Dentes";
  assert.deepEqual(corrigirTamanho(pasta, { qtd: 0.75, unidade: "l" }), { qtd: 0.075, unidade: "l" });
  // O que é possível fica: pasta de 75 ml e de 125 ml; champô de 750 ml; elixir de 500 ml.
  assert.deepEqual(corrigirTamanho(pasta, { qtd: 0.075, unidade: "l" }), { qtd: 0.075, unidade: "l" });
  assert.deepEqual(corrigirTamanho("Pasta de dentes família 125 ml", { qtd: 0.125, unidade: "l" }), { qtd: 0.125, unidade: "l" });
  assert.deepEqual(corrigirTamanho("Champô Hidratante", { qtd: 0.75, unidade: "l" }), { qtd: 0.75, unidade: "l" });
  assert.deepEqual(corrigirTamanho("Elixir Listerine", { qtd: 0.5, unidade: "l" }), { qtd: 0.5, unidade: "l" });
  // 5,34 € por 75 ml = 71,20 €/L (e não os 7,12 € que a ficha dava).
  assert.equal(Math.round((5.34 / 0.075) * 100) / 100, 71.2);
  // Rótulo impossível («0,01 €/kg» em 300 g a 3,99 €): vale o calculado.
  assert.equal(corrigirPrecoPorCem(3.99, 0.01, { qtd: 0.3, unidade: "kg" }), 13.3);
  assert.equal(corrigirPrecoPorCem(2.99, 0.01, { qtd: 0.2, unidade: "kg" }), 14.95);
  assert.equal(corrigirPrecoPorCem(0.8, 0.16, { qtd: 5, unidade: "l" }), 0.16); // água a 0,16 €/L é verdade
});
