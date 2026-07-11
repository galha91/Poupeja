/*
 * Ementas económicas — receitas portuguesas baratas, curadas à mão.
 * Quantidades para 4 pessoas. custo: 1 = € (muito barato), 2 = €€.
 * Mostramos FAIXAS de custo e nunca totais ao cêntimo — os preços variam
 * por loja e época, e não inventamos números.
 * Ingredientes com { despensa: true } são básicos que quase toda a gente
 * tem (azeite, sal…) — ficam de fora do "adicionar à lista" por defeito.
 */

export const EMENTAS = [
  {
    id: "sopa-legumes", nome: "Sopa de legumes da avó", emoji: "🥣",
    custo: 1, tempoMin: 35, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Batata", qtd: "500 g" },
      { nome: "Cenoura", qtd: "3 un" },
      { nome: "Courgette", qtd: "1 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Couve ou espinafres", qtd: "200 g" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
      { nome: "Sal", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze a batata, a cenoura, a courgette e a cebola em água com sal (20 min).",
      "Tritura tudo com a varinha até ficar cremoso.",
      "Junta a couve às tiras e deixa ferver 8-10 min.",
      "Tempera com um fio de azeite no fim.",
    ],
  },
  {
    id: "caldo-verde", nome: "Caldo verde", emoji: "🍲",
    custo: 1, tempoMin: 35, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Batata", qtd: "600 g" },
      { nome: "Couve galega", qtd: "300 g" },
      { nome: "Chouriço", qtd: "1/2 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
      { nome: "Sal", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze a batata com a cebola e o alho; tritura no próprio caldo.",
      "Junta a couve cortada fininha e ferve 5 min destapado.",
      "Adiciona o chouriço às rodelas e deixa apurar 5 min.",
      "Serve com um fio de azeite.",
    ],
  },
  {
    id: "sopa-feijao", nome: "Sopa de feijão com massa", emoji: "🫘",
    custo: 1, tempoMin: 30, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Feijão cozido", qtd: "1 lata (400 g)" },
      { nome: "Massa cotovelinhos", qtd: "150 g" },
      { nome: "Cenoura", qtd: "2 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Couve lombarda", qtd: "150 g" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
      { nome: "Sal", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Refoga a cebola no azeite; junta a cenoura em cubos e água (1,5 L).",
      "Tritura metade do feijão com um pouco do caldo e junta à panela.",
      "Adiciona a massa, a couve e o resto do feijão; coze 10-12 min.",
      "Retifica o sal e serve.",
    ],
  },
  {
    id: "canja", nome: "Canja de galinha", emoji: "🐔",
    custo: 1, tempoMin: 40, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Perna de frango", qtd: "2 un" },
      { nome: "Massa pevide", qtd: "120 g" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Cenoura", qtd: "1 un" },
      { nome: "Hortelã", qtd: "1 raminho" },
      { nome: "Sal", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze as pernas de frango com a cebola e a cenoura (25 min).",
      "Retira o frango, desfia e coa o caldo.",
      "Coze a massa pevide no caldo (8 min) e devolve o frango desfiado.",
      "Serve com hortelã.",
    ],
  },
  {
    id: "esparguete-atum", nome: "Esparguete com atum", emoji: "🍝",
    custo: 1, tempoMin: 20, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Esparguete", qtd: "400 g" },
      { nome: "Atum", qtd: "2 latas" },
      { nome: "Tomate pelado", qtd: "1 lata (400 g)" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
      { nome: "Sal e pimenta", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze o esparguete em água com sal.",
      "Refoga a cebola e o alho; junta o tomate e apura 8 min.",
      "Adiciona o atum escorrido ao molho e envolve.",
      "Mistura a massa no molho e serve.",
    ],
  },
  {
    id: "massa-lavrador", nome: "Massa à lavrador", emoji: "🌾",
    custo: 1, tempoMin: 30, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Massa macarronete", qtd: "300 g" },
      { nome: "Feijão vermelho", qtd: "1 lata (400 g)" },
      { nome: "Couve lombarda", qtd: "200 g" },
      { nome: "Chouriço", qtd: "1/2 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga cebola, alho e chouriço às rodelas no azeite.",
      "Junta 1,2 L de água, a couve às tiras e deixa levantar fervura.",
      "Adiciona a massa e coze 10 min; junta o feijão nos últimos 5.",
      "Deve ficar caldoso — retifica sal e serve.",
    ],
  },
  {
    id: "esparguete-alho", nome: "Esparguete alho e azeite com ovo", emoji: "🍳",
    custo: 1, tempoMin: 15, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Esparguete", qtd: "400 g" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Alho", qtd: "4 dentes" },
      { nome: "Salsa", qtd: "1 molho" },
      { nome: "Azeite", qtd: "4 c. sopa", despensa: true },
      { nome: "Sal e pimenta", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze o esparguete; guarda uma chávena da água.",
      "Doura o alho laminado no azeite em lume brando.",
      "Envolve a massa no azeite com um pouco da água de cozedura.",
      "Serve com ovo estrelado por cima e salsa picada.",
    ],
  },
  {
    id: "macarrao-salsicha", nome: "Macarrão com salsichas", emoji: "🌭",
    custo: 1, tempoMin: 20, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Macarrão", qtd: "350 g" },
      { nome: "Salsichas", qtd: "1 lata (8 un)" },
      { nome: "Tomate pelado", qtd: "1 lata (400 g)" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Queijo ralado", qtd: "50 g" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Coze o macarrão em água com sal.",
      "Refoga a cebola, junta o tomate e apura; adiciona as salsichas às rodelas.",
      "Envolve a massa no molho.",
      "Polvilha com queijo ralado antes de servir.",
    ],
  },
  {
    id: "arroz-atum", nome: "Arroz de atum malandrinho", emoji: "🍚",
    custo: 1, tempoMin: 25, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Atum", qtd: "2 latas" },
      { nome: "Tomate maduro", qtd: "2 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Salsa", qtd: "q.b." },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga a cebola e o alho; junta o tomate picado e apura 5 min.",
      "Adiciona 750 ml de água a ferver e o arroz; coze 12 min.",
      "Envolve o atum escorrido e deixa 2 min.",
      "Serve malandrinho, com salsa picada.",
    ],
  },
  {
    id: "arroz-feijao-ovo", nome: "Arroz de feijão com ovo estrelado", emoji: "🥚",
    custo: 1, tempoMin: 25, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Feijão encarnado", qtd: "1 lata (400 g)" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga a cebola e o alho; junta o feijão com metade da calda da lata.",
      "Adiciona o arroz e 700 ml de água a ferver; coze 12 min.",
      "Estrela os ovos.",
      "Serve o arroz com o ovo por cima.",
    ],
  },
  {
    id: "arroz-salsichas", nome: "Arroz de salsichas", emoji: "🍛",
    custo: 1, tempoMin: 25, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Salsichas", qtd: "1 lata (8 un)" },
      { nome: "Ervilhas congeladas", qtd: "200 g" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Concentrado de tomate", qtd: "1 c. sopa" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga a cebola; junta o concentrado de tomate e as ervilhas.",
      "Adiciona o arroz e 750 ml de água; coze 12 min.",
      "Junta as salsichas às rodelas nos últimos 5 min.",
      "Deixa repousar 2 min e serve.",
    ],
  },
  {
    id: "jardineira-frango", nome: "Jardineira de frango", emoji: "🥘",
    custo: 1, tempoMin: 45, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Perna de frango", qtd: "4 un" },
      { nome: "Batata", qtd: "600 g" },
      { nome: "Cenoura", qtd: "3 un" },
      { nome: "Ervilhas congeladas", qtd: "200 g" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Tomate pelado", qtd: "1/2 lata" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Aloura o frango com a cebola no azeite.",
      "Junta o tomate, as cenouras às rodelas e água até meio; estufa 15 min.",
      "Adiciona as batatas em cubos e as ervilhas; coze mais 20 min.",
      "Retifica temperos e serve.",
    ],
  },
  {
    id: "frango-forno", nome: "Frango assado com batatas", emoji: "🍗",
    custo: 1, tempoMin: 60, airfryer: true, veg: false,
    ingredientes: [
      { nome: "Frango inteiro ou pernas", qtd: "1,2 kg" },
      { nome: "Batata", qtd: "800 g" },
      { nome: "Alho", qtd: "4 dentes" },
      { nome: "Limão", qtd: "1 un" },
      { nome: "Colorau", qtd: "1 c. chá", despensa: true },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
    ],
    passos: [
      "Tempera o frango com alho esmagado, colorau, limão, sal e azeite (30 min a marinar se der).",
      "Forno: 200 °C, 50-60 min com as batatas em gomos à volta. Air fryer: 25-30 min a 180 °C (pernas), batatas à parte 20 min.",
      "Vira a meio e rega com o molho.",
      "Serve com salada.",
    ],
  },
  {
    id: "frango-estufado", nome: "Frango estufado com massa", emoji: "🍖",
    custo: 1, tempoMin: 40, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Perna de frango", qtd: "4 un" },
      { nome: "Massa espiral", qtd: "300 g" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Tomate pelado", qtd: "1 lata (400 g)" },
      { nome: "Louro", qtd: "1 folha", despensa: true },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Aloura o frango com a cebola e o louro.",
      "Junta o tomate e 400 ml de água; estufa 25 min.",
      "Coze a massa à parte e envolve no molho.",
      "Serve o frango sobre a massa.",
    ],
  },
  {
    id: "empadao-carne", nome: "Empadão de carne picada", emoji: "🥧",
    custo: 2, tempoMin: 55, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Carne picada (vaca/porco)", qtd: "500 g" },
      { nome: "Batata", qtd: "1 kg" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Cenoura", qtd: "1 un" },
      { nome: "Concentrado de tomate", qtd: "1 c. sopa" },
      { nome: "Leite", qtd: "100 ml" },
      { nome: "Manteiga", qtd: "30 g" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Coze as batatas e faz puré com o leite e a manteiga.",
      "Refoga cebola e cenoura ralada; junta a carne e o concentrado, apura 10 min.",
      "Monta: carne no fundo, puré por cima; risca com um garfo.",
      "Forno 200 °C até dourar (15-20 min).",
    ],
  },
  {
    id: "almondegas", nome: "Almôndegas em molho de tomate", emoji: "🧆",
    custo: 2, tempoMin: 35, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Carne picada", qtd: "500 g" },
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Tomate pelado", qtd: "1 lata (400 g)" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Ovo", qtd: "1 un" },
      { nome: "Pão ralado", qtd: "3 c. sopa" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Mistura a carne com o ovo, o pão ralado, sal e pimenta; molda bolinhas.",
      "Refoga a cebola, junta o tomate e deixa apurar.",
      "Coze as almôndegas no molho, tapadas, 15 min.",
      "Serve com arroz branco.",
    ],
  },
  {
    id: "bifanas", nome: "Bifanas de porco no pão", emoji: "🥖",
    custo: 2, tempoMin: 25, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Bifanas de porco", qtd: "600 g" },
      { nome: "Papo-secos", qtd: "4 un" },
      { nome: "Alho", qtd: "4 dentes" },
      { nome: "Vinho branco", qtd: "100 ml" },
      { nome: "Colorau", qtd: "1 c. chá", despensa: true },
      { nome: "Louro", qtd: "1 folha", despensa: true },
      { nome: "Banha ou azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Tempera as bifanas com alho, colorau, louro e vinho branco (30 min).",
      "Frita em lume forte na banha/azeite, pouco tempo de cada lado.",
      "Deixa o molho apurar e volta a passar as bifanas por ele.",
      "Serve no papo-seco com o molho.",
    ],
  },
  {
    id: "pescada-cozida", nome: "Pescada cozida com todos", emoji: "🐟",
    custo: 2, tempoMin: 30, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Postas de pescada (congelada)", qtd: "4 un" },
      { nome: "Batata", qtd: "600 g" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Couve portuguesa", qtd: "1/2 un" },
      { nome: "Azeite", qtd: "4 c. sopa", despensa: true },
      { nome: "Vinagre", qtd: "1 c. sopa", despensa: true },
    ],
    passos: [
      "Coze as batatas e a couve; a meio, junta os ovos (10 min) e a pescada (8 min).",
      "Escorre tudo bem.",
      "Rega com azeite e vinagre (ou azeite e alho aquecido).",
      "Serve tudo no mesmo prato, à moda antiga.",
    ],
  },
  {
    id: "filetes-airfryer", nome: "Filetes de pescada crocantes", emoji: "🍤",
    custo: 2, tempoMin: 25, airfryer: true, veg: false,
    ingredientes: [
      { nome: "Filetes de pescada (congelados)", qtd: "600 g" },
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Ovo", qtd: "2 un" },
      { nome: "Pão ralado", qtd: "100 g" },
      { nome: "Limão", qtd: "1 un" },
      { nome: "Azeite", qtd: "1 c. sopa", despensa: true },
    ],
    passos: [
      "Passa os filetes descongelados por ovo batido e pão ralado.",
      "Air fryer: 200 °C, 12-14 min, virando a meio, com um fio de azeite. (Sem air fryer: frita ou forno 220 °C.)",
      "Coze o arroz.",
      "Serve com limão e arroz — pica um tomate por cima se tiveres.",
    ],
  },
  {
    id: "bacalhau-bras", nome: "Bacalhau à Brás", emoji: "🐠",
    custo: 2, tempoMin: 30, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Bacalhau desfiado (congelado)", qtd: "400 g" },
      { nome: "Batata palha", qtd: "150 g" },
      { nome: "Ovos", qtd: "6 un" },
      { nome: "Cebola", qtd: "2 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Salsa e azeitonas", qtd: "q.b." },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga a cebola às meias-luas com o alho até ficar macia.",
      "Junta o bacalhau desfiado e deixa cozinhar 5 min.",
      "Adiciona a batata palha e os ovos batidos; envolve em lume brando até cremoso.",
      "Serve com salsa picada e azeitonas.",
    ],
  },
  {
    id: "omelete-legumes", nome: "Omelete de legumes com salada", emoji: "🥗",
    custo: 1, tempoMin: 15, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Ovos", qtd: "8 un" },
      { nome: "Courgette", qtd: "1 un" },
      { nome: "Pimento", qtd: "1 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alface", qtd: "1 un" },
      { nome: "Queijo ralado", qtd: "50 g" },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Salteia a cebola, o pimento e a courgette em cubos pequenos.",
      "Bate os ovos, junta os legumes e o queijo.",
      "Cozinha a omelete em lume médio-baixo, dobra ao meio.",
      "Serve com salada de alface.",
    ],
  },
  {
    id: "tortilha", nome: "Tortilha de batata", emoji: "🫓",
    custo: 1, tempoMin: 35, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Batata", qtd: "600 g" },
      { nome: "Ovos", qtd: "6 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Azeite", qtd: "4 c. sopa", despensa: true },
      { nome: "Sal", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Frita a batata às rodelas finas com a cebola em azeite, em lume médio, até macia.",
      "Escorre e envolve nos ovos batidos com sal; deixa repousar 5 min.",
      "Cozinha na frigideira em lume brando; vira com ajuda de um prato.",
      "Serve morna com salada.",
    ],
  },
  {
    id: "grao-espinafres", nome: "Grão com espinafres e ovo escalfado", emoji: "🌿",
    custo: 1, tempoMin: 20, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Grão cozido", qtd: "2 latas (800 g)" },
      { nome: "Espinafres", qtd: "300 g" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Alho", qtd: "3 dentes" },
      { nome: "Colorau", qtd: "1 c. chá", despensa: true },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
    ],
    passos: [
      "Doura o alho no azeite com o colorau.",
      "Junta o grão escorrido e os espinafres; salteia até murcharem.",
      "Escalfa os ovos em água com um fio de vinagre (3 min).",
      "Serve o grão com o ovo por cima.",
    ],
  },
  {
    id: "salada-grao-atum", nome: "Salada de grão com atum", emoji: "🥙",
    custo: 1, tempoMin: 15, airfryer: false, veg: false,
    ingredientes: [
      { nome: "Grão cozido", qtd: "2 latas (800 g)" },
      { nome: "Atum", qtd: "2 latas" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Cebola roxa", qtd: "1 un" },
      { nome: "Pimento", qtd: "1 un" },
      { nome: "Salsa", qtd: "1 molho" },
      { nome: "Azeite e vinagre", qtd: "q.b.", despensa: true },
    ],
    passos: [
      "Coze os ovos (10 min).",
      "Mistura o grão escorrido, o atum, a cebola e o pimento picados.",
      "Tempera com azeite, vinagre, sal e salsa.",
      "Junta os ovos em quartos por cima. Fresca e pronta em minutos.",
    ],
  },
  {
    id: "lentilhas", nome: "Lentilhas estufadas com arroz", emoji: "🍲",
    custo: 1, tempoMin: 35, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Lentilhas secas", qtd: "300 g" },
      { nome: "Arroz agulha", qtd: "200 g" },
      { nome: "Cenoura", qtd: "2 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Tomate pelado", qtd: "1/2 lata" },
      { nome: "Cominhos", qtd: "1 c. chá", despensa: true },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Refoga a cebola; junta a cenoura, o tomate e os cominhos.",
      "Adiciona as lentilhas e 900 ml de água; coze 25 min.",
      "Coze o arroz à parte.",
      "Serve as lentilhas sobre o arroz.",
    ],
  },
  {
    id: "legumes-airfryer", nome: "Legumes assados com ovo (air fryer)", emoji: "🍆",
    custo: 1, tempoMin: 30, airfryer: true, veg: true,
    ingredientes: [
      { nome: "Batata doce", qtd: "500 g" },
      { nome: "Courgette", qtd: "1 un" },
      { nome: "Pimento", qtd: "2 un" },
      { nome: "Cebola roxa", qtd: "1 un" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Orégãos", qtd: "q.b.", despensa: true },
      { nome: "Azeite", qtd: "2 c. sopa", despensa: true },
    ],
    passos: [
      "Corta os legumes em pedaços regulares e envolve em azeite, sal e orégãos.",
      "Air fryer: 190 °C, 18-20 min, abanando a meio. (Forno: 200 °C, 30 min.)",
      "Estrela ou escalfa os ovos.",
      "Serve os legumes com o ovo por cima.",
    ],
  },
  {
    id: "arroz-grelos", nome: "Arroz de grelos com ovo", emoji: "🥬",
    custo: 1, tempoMin: 25, airfryer: false, veg: true,
    ingredientes: [
      { nome: "Arroz agulha", qtd: "300 g" },
      { nome: "Grelos", qtd: "1 molho" },
      { nome: "Ovos", qtd: "4 un" },
      { nome: "Cebola", qtd: "1 un" },
      { nome: "Alho", qtd: "2 dentes" },
      { nome: "Azeite", qtd: "3 c. sopa", despensa: true },
    ],
    passos: [
      "Escalda os grelos 3 min e escorre.",
      "Refoga a cebola e o alho; junta os grelos e o arroz.",
      "Adiciona 750 ml de água a ferver e coze 12 min.",
      "Serve com ovo estrelado.",
    ],
  },
];

/* Sugestão da semana — determinística (muda toda a segunda-feira). */
export function sugestaoDaSemana(data = new Date()) {
  const inicio = new Date(data.getFullYear(), 0, 1);
  const semana = Math.floor((data - inicio) / (7 * 86400000));
  return EMENTAS[semana % EMENTAS.length];
}

/* Emoji por ingrediente, para a lista de compras. */
const EMOJI_ING = [
  ["frango", "🍗"], ["carne", "🥩"], ["bifana", "🥩"], ["chouriço", "🌭"], ["salsicha", "🌭"],
  ["atum", "🐟"], ["pescada", "🐟"], ["bacalhau", "🐟"],
  ["ovo", "🥚"], ["queijo", "🧀"], ["leite", "🥛"], ["manteiga", "🧈"],
  ["batata doce", "🍠"], ["batata", "🥔"], ["cebola", "🧅"], ["alho", "🧄"], ["cenoura", "🥕"],
  ["tomate", "🍅"], ["pimento", "🫑"], ["courgette", "🥒"], ["pepino", "🥒"],
  ["couve", "🥬"], ["espinafre", "🥬"], ["grelos", "🥬"], ["alface", "🥬"], ["salsa", "🌿"], ["hortelã", "🌿"],
  ["feijão", "🫘"], ["grão", "🫘"], ["lentilha", "🫘"], ["ervilha", "🫛"],
  ["arroz", "🍚"], ["massa", "🍝"], ["esparguete", "🍝"], ["macarr", "🍝"],
  ["pão", "🍞"], ["papo-seco", "🍞"], ["limão", "🍋"], ["vinho", "🍷"],
];
export function emojiIngrediente(nome) {
  const n = nome.toLowerCase();
  for (const [chave, e] of EMOJI_ING) if (n.includes(chave)) return e;
  return "🛒";
}
