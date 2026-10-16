/*
 * Ingredientes das receitas — um dicionário só, partilhado por todas.
 *
 * Cada ingrediente diz:
 *   nome    como aparece na receita
 *   compra  o artigo do catálogo da lista de compras (data/catalogo-lista.js)
 *           que entra na lista e é pesquisado nos supermercados; null = fora
 *           do catálogo (entra na lista pelo nome, sem preço)
 *   u       a unidade em que as receitas o medem ("g", "ml", "un", "lata"…)
 *   g       gramas por unidade (para a nutrição); 0 = não conta (q.b., louro)
 *   n       por 100 g: [kcal, proteína, hidratos, gordura, fibra] — valores
 *           médios de tabelas de composição (cru, ou escorrido nas latas).
 *           Servem para estimar, não para prescrever.
 *   gr      grupos que decidem as dietas: carne, peixe, ovo, lacticinio, gluten
 *   fam     família, para "evitar cebola" apanhar também a cebola roxa
 *   desp    básico da despensa (azeite, sal…): fica fora da lista por omissão
 *   rot     processado em que a receita varia por marca (glúten, lactose):
 *           a app lembra-se de pedir para confirmar o rótulo
 *
 * O teste tests/receitas.test.mjs garante que todos os `compra` existem
 * no catálogo e que todas as receitas só usam ingredientes daqui.
 */

const I = (nome, compra, u, g, n, extra = {}) => ({ nome, compra, u, g, n, gr: [], ...extra });

export const INGREDIENTES = {
  // ── Legumes, ervas e fruta
  "batata":         I("Batata", "Batatas", "g", 1, [77, 2, 17, 0.1, 2.2]),
  "batata-doce":    I("Batata-doce", "Batata-doce", "g", 1, [86, 1.6, 20, 0.1, 3]),
  "cebola":         I("Cebola", "Cebolas", "un", 110, [40, 1.1, 9, 0.1, 1.7]),
  "cebola-roxa":    I("Cebola roxa", "Cebola roxa", "un", 110, [40, 1.1, 9, 0.1, 1.7], { fam: "cebola" }),
  "alho":           I("Alho", "Alho", "dente", 5, [149, 6.4, 33, 0.5, 2.1]),
  "cenoura":        I("Cenoura", "Cenouras", "un", 80, [41, 0.9, 10, 0.2, 2.8]),
  "curgete":        I("Curgete", "Curgete", "un", 250, [17, 1.2, 3.1, 0.3, 1]),
  "tomate":         I("Tomate", "Tomate", "un", 120, [18, 0.9, 3.9, 0.2, 1.2]),
  "pimento":        I("Pimento", "Pimentos", "un", 150, [26, 1, 6, 0.3, 2]),
  "pepino":         I("Pepino", "Pepino", "un", 300, [15, 0.7, 3.6, 0.1, 0.5]),
  "couve-galega":   I("Couve galega (caldo verde)", "Couve galega", "g", 1, [35, 2.9, 5.6, 0.7, 3.6], { fam: "couve" }),
  "couve":          I("Couve portuguesa", "Couve portuguesa", "g", 1, [27, 2, 5, 0.3, 2.5]),
  "espinafres":     I("Espinafres", "Espinafres", "g", 1, [23, 2.9, 3.6, 0.4, 2.2]),
  "grelos":         I("Grelos", "Grelos", "g", 1, [22, 3.2, 2.9, 0.5, 2.7]),
  "alface":         I("Alface", "Alface", "un", 300, [15, 1.4, 2.9, 0.2, 1.3]),
  "brocolos":       I("Brócolos", "Brócolos", "g", 1, [34, 2.8, 7, 0.4, 2.6]),
  "feijao-verde":   I("Feijão-verde", "Feijão-verde", "g", 1, [31, 1.8, 7, 0.2, 2.7]),
  "cogumelos":      I("Cogumelos", "Cogumelos", "g", 1, [22, 3.1, 3.3, 0.3, 1]),
  "abobora":        I("Abóbora", "Abóbora", "g", 1, [26, 1, 6.5, 0.1, 0.5]),
  "ervilhas":       I("Ervilhas congeladas", "Ervilhas congeladas", "g", 1, [81, 5.4, 14, 0.4, 5]),
  "limao":          I("Limão", "Limões", "un", 100, [29, 1.1, 9, 0.3, 2.8]),
  "abacate":        I("Abacate", "Abacate", "un", 150, [160, 2, 2, 15, 7]),
  "banana":         I("Banana", "Bananas", "un", 120, [89, 1.1, 20, 0.3, 2.6]),
  "maca":           I("Maçã", "Maçãs", "un", 150, [52, 0.3, 12, 0.2, 2.4]),
  "pera":           I("Pera", "Peras", "un", 160, [57, 0.4, 13, 0.1, 3.1]),
  "laranja":        I("Laranja", "Laranjas", "un", 150, [47, 0.9, 10, 0.1, 2.4]),
  "kiwi":           I("Kiwi", "Kiwis", "un", 75, [61, 1.1, 12, 0.5, 3]),
  "morangos":       I("Morangos", "Morangos", "g", 1, [32, 0.7, 6, 0.3, 2]),
  "mirtilos":       I("Mirtilos", "Mirtilos", "g", 1, [57, 0.7, 12, 0.3, 2.4]),
  "salsa":          I("Salsa", "Salsa", "molho", 30, [36, 3, 6, 0.8, 3.3]),
  "coentros":       I("Coentros", "Coentros", "molho", 30, [23, 2, 4, 0.5, 2.8]),
  "hortela":        I("Hortelã", "Hortelã", "molho", 30, [44, 3.3, 8, 0.7, 6.8]),

  // ── Talho e charcutaria
  // Coxas: valores por 100 g COM osso (cerca de 70% é comestível).
  "coxas-frango":   I("Coxas de frango", "Coxas de frango", "g", 1, [150, 13, 0, 11, 0], { gr: ["carne"], fam: "frango" }),
  "peito-frango":   I("Peito de frango", "Peito de frango", "g", 1, [110, 23, 0, 1.5, 0], { gr: ["carne"], fam: "frango" }),
  "carne-picada":   I("Carne picada", "Carne picada", "g", 1, [230, 18, 0, 17, 0], { gr: ["carne"] }),
  "febras":         I("Febras de porco", "Febras de porco", "g", 1, [150, 21, 0, 7, 0], { gr: ["carne"], fam: "porco" }),
  "bifes-vaca":     I("Bifes de vaca", "Bifes de vaca", "g", 1, [130, 22, 0, 4.5, 0], { gr: ["carne"] }),
  "entremeada":     I("Entremeada", "Entremeada", "g", 1, [390, 14, 0, 37, 0], { gr: ["carne"], fam: "porco" }),
  "carne-estufar":  I("Carne de vaca para estufar", "Carne para estufar", "g", 1, [150, 21, 0, 7, 0], { gr: ["carne"] }),
  "chourico":       I("Chouriço", "Chouriço", "un", 200, [380, 22, 2, 32, 0], { gr: ["carne"], fam: "porco", rot: true }),
  "salsichas":      I("Salsichas", "Salsichas em lata", "lata", 160, [230, 11, 3, 19, 0], { gr: ["carne"], rot: true }),
  "fiambre":        I("Fiambre", "Fiambre", "emb.", 150, [110, 17, 1.5, 4, 0], { gr: ["carne"], fam: "porco", rot: true }),
  "hamburgueres":   I("Hambúrgueres", "Hambúrgueres", "un", 100, [230, 17, 1, 17, 0], { gr: ["carne"], rot: true }),

  // ── Peixe
  "atum":           I("Atum", "Atum em lata", "lata", 80, [190, 26, 0, 9, 0], { gr: ["peixe"] }),
  "pescada":        I("Pescada (postas)", "Pescada", "g", 1, [75, 16, 0, 1, 0], { gr: ["peixe"], fam: "pescada" }),
  "filetes-pescada":I("Filetes de pescada", "Filetes de pescada", "g", 1, [75, 16, 0, 1, 0], { gr: ["peixe"], fam: "pescada" }),
  "bacalhau":       I("Bacalhau demolhado", "Bacalhau demolhado", "g", 1, [80, 18, 0, 0.7, 0], { gr: ["peixe"] }),
  "salmao":         I("Salmão", "Salmão", "g", 1, [200, 20, 0, 13, 0], { gr: ["peixe"] }),
  "douradinhos":    I("Douradinhos", "Douradinhos", "g", 1, [210, 12, 18, 10, 1], { gr: ["peixe", "gluten"], rot: true }),

  // ── Ovos e laticínios
  "ovo":            I("Ovos", "Ovos", "un", 55, [143, 12.6, 0.7, 9.5, 0], { gr: ["ovo"] }),
  // Gemas e claras: compram-se ovos, mas a nutrição é só da parte usada.
  "gema":           I("Gemas de ovo", "Ovos", "un", 17, [322, 16, 3.6, 27, 0], { gr: ["ovo"], fam: "ovo" }),
  "clara":          I("Claras de ovo", "Ovos", "un", 33, [52, 11, 0.7, 0.2, 0], { gr: ["ovo"], fam: "ovo" }),
  "queijo-ralado":  I("Queijo ralado", "Queijo ralado", "g", 1, [400, 28, 1, 31, 0], { gr: ["lacticinio"], fam: "queijo" }),
  "mozarela":       I("Mozarela", "Mozarela", "un", 125, [250, 18, 2, 19, 0], { gr: ["lacticinio"], fam: "queijo" }),
  "leite":          I("Leite", "Leite meio-gordo", "ml", 1.03, [47, 3.3, 4.8, 1.6, 0], { gr: ["lacticinio"] }),
  "natas":          I("Natas", "Natas", "ml", 1, [190, 2.5, 4, 18, 0], { gr: ["lacticinio"] }),
  "manteiga":       I("Manteiga", "Manteiga", "g", 1, [740, 0.7, 0.6, 82, 0], { gr: ["lacticinio"] }),
  "iogurte-grego":  I("Iogurte grego", "Iogurte grego", "un", 120, [130, 5, 4, 10, 0], { gr: ["lacticinio"], fam: "iogurte" }),
  "queijo-fresco":  I("Queijo fresco", "Queijo fresco", "un", 200, [160, 11, 3, 12, 0], { gr: ["lacticinio"], fam: "queijo" }),
  "bebida-vegetal": I("Bebida vegetal (aveia, soja…)", "Bebida vegetal", "ml", 1, [45, 1, 7, 1.5, 0.8], { rot: true }),
  "iogurte":        I("Iogurte natural", "Iogurte natural", "un", 125, [65, 4, 5, 3.3, 0], { gr: ["lacticinio"], fam: "iogurte" }),
  "queijo-flamengo":I("Queijo flamengo", "Queijo flamengo", "fatia", 20, [350, 25, 0, 27, 0], { gr: ["lacticinio"], fam: "queijo" }),

  // ── Leguminosas
  "feijao":         I("Feijão cozido", "Feijão cozido", "lata", 250, [100, 7, 14, 0.5, 6], { leg: true, fam: "feijao" }),
  "grao":           I("Grão cozido", "Grão cozido", "lata", 250, [140, 7.5, 18, 2.5, 6], { leg: true }),
  "lentilhas":      I("Lentilhas secas", "Lentilhas", "g", 1, [350, 24, 49, 1.1, 11], { leg: true }),
  "feijao-frade":   I("Feijão-frade seco", "Feijão-frade", "g", 1, [336, 23, 49, 1.3, 11], { leg: true, fam: "feijao" }),

  // ── Arroz, massa e pão
  "arroz":          I("Arroz", "Arroz carolino", "g", 1, [350, 7, 78, 0.6, 1.3]),
  "esparguete":     I("Esparguete", "Massa esparguete", "g", 1, [355, 12.5, 71, 1.5, 3], { gr: ["gluten"], fam: "massa" }),
  "massa":          I("Massa curta (penne, espiral)", "Massa penne", "g", 1, [355, 12.5, 71, 1.5, 3], { gr: ["gluten"], fam: "massa" }),
  "macarrao":       I("Macarrão", "Macarrão", "g", 1, [355, 12.5, 71, 1.5, 3], { gr: ["gluten"], fam: "massa" }),
  "massinhas":      I("Massinhas para sopa", "Massinhas para sopa", "g", 1, [355, 12.5, 71, 1.5, 3], { gr: ["gluten"], fam: "massa" }),
  "pao":            I("Carcaças", "Carcaças", "un", 60, [265, 9, 50, 3, 2.7], { gr: ["gluten"], fam: "pao" }),
  "baguete":        I("Baguete", "Baguete", "un", 250, [270, 9, 55, 1.5, 2.7], { gr: ["gluten"], fam: "pao" }),
  "pao-ralado":     I("Pão ralado", "Pão ralado", "g", 1, [395, 13, 72, 5, 4.5], { gr: ["gluten"], fam: "pao" }),
  "pao-forma":      I("Pão de forma", "Pão de forma", "fatia", 25, [265, 8, 49, 3.5, 3], { gr: ["gluten"], fam: "pao" }),
  "farinha":        I("Farinha de trigo", "Farinha", "g", 1, [364, 10, 76, 1, 2.7], { gr: ["gluten"] }),
  // Aveia: só é segura para celíacos quando certificada — tratamos como tendo glúten.
  "aveia":          I("Flocos de aveia", "Flocos de aveia", "g", 1, [375, 13, 58, 7, 10], { gr: ["gluten"] }),
  "bolacha-maria":  I("Bolacha Maria", "Bolacha Maria", "g", 1, [440, 7, 73, 13, 2.5], { gr: ["gluten"] }),
  "aletria":        I("Aletria", null, "g", 1, [355, 12.5, 71, 1.5, 3], { gr: ["gluten"], fam: "massa" }),
  "cuscuz":         I("Cuscuz", null, "g", 1, [376, 13, 72, 0.6, 5], { gr: ["gluten"], fam: "massa" }),

  // ── Mercearia e conservas
  "polpa":          I("Polpa de tomate", "Polpa de tomate", "emb.", 400, [32, 1.5, 5, 0.2, 1.5]),
  "milho":          I("Milho doce", "Milho doce", "lata", 140, [86, 3, 17, 1.2, 2.4]),
  "azeitonas":      I("Azeitonas", "Azeitonas", "g", 1, [145, 1, 4, 15, 3.3]),
  "batata-palha":   I("Batata palha", null, "g", 1, [540, 6, 50, 35, 4.5], { rot: true }),
  "vinho-branco":   I("Vinho branco", "Vinho branco", "ml", 1, [20, 0.1, 2.6, 0, 0]),
  "caril":          I("Caril em pó", null, "c. chá", 2, [325, 13, 58, 14, 33], { rot: true }),
  "oleo":           I("Óleo (o que fica nos fritos)", "Óleo", "c. sopa", 13, [884, 0, 0, 100, 0]),
  // Vinhos: valores depois de cozinhar — quase todo o álcool (e as calorias dele) evapora.
  "vinho-tinto":    I("Vinho tinto", "Vinho tinto", "ml", 1, [20, 0.1, 2.6, 0, 0]),
  "mel":            I("Mel", "Mel", "c. sopa", 21, [304, 0.3, 82, 0, 0], { gr: ["mel"] }),
  "compota":        I("Compota", "Compota", "c. sopa", 20, [250, 0.4, 62, 0.1, 1]),
  "chocolate":      I("Chocolate de culinária", "Chocolate", "g", 1, [540, 6, 46, 33, 7], { rot: true }),
  "cacau":          I("Cacau em pó", "Chocolate em pó", "c. sopa", 8, [228, 20, 21, 14, 37], { rot: true }),
  "frutos-secos":   I("Frutos secos (nozes, amêndoas)", "Frutos secos", "g", 1, [620, 18, 12, 55, 8], { fam: "frutos-secos" }),
  "fermento-po":    I("Fermento em pó", "Fermento", "c. chá", 4, [53, 0, 28, 0, 0], { rot: true }),
  "fermento-padeiro": I("Fermento de padeiro seco", null, "saqueta", 7, [325, 40, 13, 7.6, 27]),
  "cafe":           I("Café forte", "Café moído", "ml", 1, [2, 0.1, 0, 0, 0]),

  // ── Despensa: quase toda a gente tem
  "azeite":         I("Azeite", "Azeite", "c. sopa", 13, [884, 0, 0, 100, 0], { desp: true }),
  "vinagre":        I("Vinagre", "Vinagre", "c. sopa", 15, [18, 0, 0, 0, 0], { desp: true }),
  "sal":            I("Sal", "Sal", "q.b.", 0, null, { desp: true }),
  "pimenta":        I("Pimenta", "Pimenta", "q.b.", 0, null, { desp: true }),
  "colorau":        I("Colorau", "Colorau", "c. chá", 2, [282, 14, 54, 13, 35], { desp: true }),
  "acucar":         I("Açúcar", "Açúcar", "g", 1, [400, 0, 100, 0, 0], { desp: true }),
  "canela":         I("Canela", "Canela", "c. chá", 2.5, [247, 4, 27, 1.2, 53], { desp: true }),
  "cominhos":       I("Cominhos", null, "c. chá", 2, [375, 18, 44, 22, 11], { desp: true }),
  "louro":          I("Louro", "Louro", "folha", 0, null, { desp: true }),
  "oregaos":        I("Orégãos", "Orégãos", "q.b.", 0, null, { desp: true }),
};

/* Os que aparecem como atalho em "Ingredientes a evitar". */
export const EVITAR_POPULARES = [
  "cebola", "alho", "ovo", "leite", "cogumelos", "tomate", "pimento", "coentros",
  "atum", "bacalhau", "salmao", "chourico", "carne-picada", "grao", "feijao", "brocolos",
];
