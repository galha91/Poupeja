/*
 * Receitas económicas — portuguesas, baratas, curadas à mão. Para 4 pessoas.
 *
 * Cada receita:
 *   id       slug estável (é o URL público /receitas/[id] — não mudar)
 *   tipo     "prato" (jantar) ou "sopa" (a panela da semana)
 *   custo    faixa: 1 = € (até ~1,5 €/pessoa), 2 = €€ (~1,5–3 €), 3 = €€€.
 *            Faixas, nunca totais ao cêntimo: os preços reais vêm dos
 *            supermercados, quando a pessoa compara a lista.
 *   equip    o que é preciso; uma lista dentro da lista = qualquer um serve
 *            (["forno", "airfryer"] → forno OU air fryer). Ids em
 *            EQUIPAMENTOS (lib/receitas/motor.js); cada aparelho tem de
 *            ter receitas (o teste verifica)
 *   tags     o que não se calcula: "familia", "conforto", "takeaway"
 *            (rápido, leve, proteína e fibra saem do tempo e da nutrição)
 *   ing      [chave do ingrediente (lib/receitas/ingredientes.js), quantidade
 *            na unidade dele]
 *   passos   texto simples; "(20 min)" no passo dá temporizador no modo cozinhar
 *
 * As dietas (vegano, sem glúten…) NÃO se escrevem aqui: saem dos
 * ingredientes. Assim não há "vegetariano" com chouriço por engano.
 */

export const PORCOES = 4;

export const RECEITAS = [
  // ───────────── Sopas ─────────────
  {
    id: "sopa-legumes", nome: "Sopa de legumes da avó", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto", "familia"],
    ing: [["batata", 500], ["cenoura", 3], ["curgete", 1], ["cebola", 1], ["espinafres", 200], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze a batata, a cenoura, a curgete e a cebola em água com sal (20 min).",
      "Tritura tudo com a varinha até ficar cremoso.",
      "Junta os espinafres e deixa ferver mais um pouco (8 min).",
      "Tempera com um fio de azeite no fim.",
    ],
  },
  {
    id: "caldo-verde", nome: "Caldo verde", emoji: "🍲", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto"],
    ing: [["batata", 600], ["couve-galega", 300], ["chourico", 0.5], ["cebola", 1], ["alho", 2], ["azeite", 3], ["sal", 1]],
    passos: [
      "Coze a batata com a cebola e o alho (20 min).",
      "Tritura no próprio caldo.",
      "Junta a couve cortada fininha e ferve destapado (5 min).",
      "Adiciona o chouriço às rodelas e deixa apurar (5 min). Serve com um fio de azeite.",
    ],
  },
  {
    id: "sopa-feijao", nome: "Sopa de feijão com massa", emoji: "🫘", tipo: "sopa",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["feijao", 1], ["macarrao", 150], ["cenoura", 2], ["cebola", 1], ["couve", 150], ["azeite", 2], ["sal", 1]],
    passos: [
      "Refoga a cebola no azeite; junta a cenoura em cubos e 1,5 L de água (10 min).",
      "Esmaga metade do feijão com um garfo (ou tritura) e junta à panela.",
      "Adiciona o macarrão, a couve e o resto do feijão (12 min).",
      "Retifica o sal e serve.",
    ],
  },
  {
    id: "canja", nome: "Canja de galinha", emoji: "🐔", tipo: "sopa",
    custo: 1, tempoMin: 40, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["coxas-frango", 400], ["massinhas", 120], ["cebola", 1], ["cenoura", 1], ["hortela", 0.25], ["sal", 1]],
    passos: [
      "Coze as coxas de frango com a cebola e a cenoura em 2 L de água (25 min).",
      "Retira o frango, desfia e coa o caldo.",
      "Coze as massinhas no caldo (8 min) e devolve o frango desfiado.",
      "Serve com folhas de hortelã.",
    ],
  },
  {
    id: "sopa-abobora", nome: "Creme de abóbora", emoji: "🎃", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto"],
    ing: [["abobora", 800], ["batata", 300], ["cenoura", 2], ["cebola", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Descasca e corta a abóbora, a batata, a cenoura e a cebola em pedaços.",
      "Coze tudo com o alho em 1,5 L de água com sal (25 min).",
      "Tritura com a varinha até ficar aveludado.",
      "Serve com um fio de azeite cru.",
    ],
  },
  {
    id: "creme-brocolos", nome: "Creme de brócolos", emoji: "🥦", tipo: "sopa",
    custo: 1, tempoMin: 30, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: [],
    ing: [["brocolos", 500], ["batata", 400], ["cebola", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze a batata, a cebola e o alho em 1,5 L de água com sal (15 min).",
      "Junta os brócolos em raminhos (7 min) — pouco tempo, para ficarem verdes.",
      "Tritura com a varinha.",
      "Termina com um fio de azeite.",
    ],
  },

  // ───────────── Massas ─────────────
  {
    id: "esparguete-atum", nome: "Esparguete com atum", emoji: "🍝", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: ["familia"],
    ing: [["esparguete", 400], ["atum", 2], ["polpa", 1], ["cebola", 1], ["alho", 2], ["azeite", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze o esparguete em água com sal (10 min).",
      "Ao mesmo tempo, refoga a cebola e o alho; junta a polpa e apura (8 min).",
      "Adiciona o atum escorrido ao molho e envolve.",
      "Mistura a massa no molho e serve.",
    ],
  },
  {
    id: "massa-lavrador", nome: "Massa à lavrador", emoji: "🌾", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["conforto"],
    ing: [["macarrao", 300], ["feijao", 1], ["couve", 200], ["chourico", 0.5], ["cebola", 1], ["alho", 2], ["azeite", 2]],
    passos: [
      "Refoga a cebola, o alho e o chouriço às rodelas no azeite.",
      "Junta 1,2 L de água e a couve às tiras e deixa levantar fervura.",
      "Adiciona o macarrão (10 min); junta o feijão nos últimos 5.",
      "Deve ficar caldoso — retifica o sal e serve.",
    ],
  },
  {
    id: "esparguete-alho", nome: "Esparguete alho e azeite com ovo", emoji: "🍳", tipo: "prato",
    custo: 1, tempoMin: 15, equip: ["fogao"], tags: [],
    ing: [["esparguete", 400], ["ovo", 4], ["alho", 4], ["salsa", 1], ["azeite", 4], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze o esparguete (10 min); guarda uma chávena da água.",
      "Doura o alho laminado no azeite em lume brando.",
      "Envolve a massa no azeite com um pouco da água de cozedura.",
      "Serve com um ovo estrelado por cima e salsa picada.",
    ],
  },
  {
    id: "macarrao-salsicha", nome: "Macarrão com salsichas", emoji: "🌭", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: ["familia"],
    ing: [["macarrao", 350], ["salsichas", 1], ["polpa", 1], ["cebola", 1], ["queijo-ralado", 50], ["azeite", 2]],
    passos: [
      "Coze o macarrão em água com sal (10 min).",
      "Refoga a cebola, junta a polpa e apura; adiciona as salsichas às rodelas.",
      "Envolve a massa no molho.",
      "Polvilha com queijo ralado antes de servir.",
    ],
  },
  {
    id: "massa-grao-tomate", nome: "Massa com grão, tomate e espinafres", emoji: "🍅", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: [],
    ing: [["massa", 350], ["grao", 1], ["polpa", 1], ["espinafres", 150], ["alho", 3], ["azeite", 3], ["oregaos", 1], ["sal", 1]],
    passos: [
      "Coze a massa em água com sal (10 min).",
      "Doura o alho no azeite, junta a polpa e os orégãos e apura (8 min).",
      "Adiciona o grão escorrido e os espinafres; mexe até murcharem.",
      "Envolve a massa no molho e serve.",
    ],
  },
  {
    id: "esparguete-bolonhesa", nome: "Esparguete à bolonhesa", emoji: "🍝", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao"], tags: ["familia", "conforto"],
    ing: [["esparguete", 400], ["carne-picada", 400], ["polpa", 1], ["cenoura", 1], ["cebola", 1], ["alho", 2], ["louro", 1], ["queijo-ralado", 40], ["azeite", 2]],
    passos: [
      "Refoga a cebola, o alho e a cenoura ralada no azeite.",
      "Junta a carne picada e deixa alourar, desfazendo com a colher.",
      "Adiciona a polpa e o louro e deixa apurar em lume brando (20 min).",
      "Coze o esparguete (10 min) e serve com o molho e queijo ralado.",
    ],
  },
  {
    id: "salada-massa-atum", nome: "Salada fria de massa com atum", emoji: "🥗", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: [],
    ing: [["massa", 300], ["atum", 2], ["milho", 1], ["tomate", 2], ["pepino", 1], ["azeite", 3], ["vinagre", 1], ["sal", 1]],
    passos: [
      "Coze a massa (10 min) e passa por água fria.",
      "Corta o tomate e o pepino em cubos.",
      "Junta a massa, o atum escorrido, o milho e os legumes.",
      "Tempera com azeite, vinagre e sal. Aguenta bem para o almoço do dia seguinte.",
    ],
  },

  // ───────────── Arroz ─────────────
  {
    id: "arroz-atum", nome: "Arroz de atum malandrinho", emoji: "🍚", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: ["conforto"],
    ing: [["arroz", 300], ["atum", 2], ["tomate", 2], ["cebola", 1], ["alho", 2], ["salsa", 0.5], ["azeite", 2]],
    passos: [
      "Refoga a cebola e o alho; junta o tomate picado e apura (5 min).",
      "Adiciona 750 ml de água a ferver e o arroz (12 min).",
      "Envolve o atum escorrido e deixa mais um pouco (2 min).",
      "Serve malandrinho, com salsa picada.",
    ],
  },
  {
    id: "arroz-feijao-ovo", nome: "Arroz de feijão com ovo estrelado", emoji: "🥚", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: [],
    ing: [["arroz", 300], ["feijao", 1], ["ovo", 4], ["cebola", 1], ["alho", 2], ["azeite", 3]],
    passos: [
      "Refoga a cebola e o alho; junta o feijão com metade da calda.",
      "Adiciona o arroz e 700 ml de água a ferver (12 min).",
      "Estrela os ovos.",
      "Serve o arroz com o ovo por cima.",
    ],
  },
  {
    id: "arroz-salsichas", nome: "Arroz de salsichas", emoji: "🍛", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: ["familia"],
    ing: [["arroz", 300], ["salsichas", 1], ["ervilhas", 200], ["cebola", 1], ["polpa", 0.25], ["azeite", 2]],
    passos: [
      "Refoga a cebola; junta a polpa e as ervilhas.",
      "Adiciona o arroz e 750 ml de água (12 min).",
      "Junta as salsichas às rodelas nos últimos minutos (5 min).",
      "Deixa repousar 2 min e serve.",
    ],
  },
  {
    id: "arroz-grelos", nome: "Arroz de grelos com ovo", emoji: "🥬", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: ["conforto"],
    ing: [["arroz", 300], ["grelos", 400], ["ovo", 4], ["cebola", 1], ["alho", 2], ["azeite", 3]],
    passos: [
      "Escalda os grelos (3 min) e escorre.",
      "Refoga a cebola e o alho; junta os grelos e o arroz.",
      "Adiciona 750 ml de água a ferver (12 min).",
      "Serve com um ovo estrelado.",
    ],
  },
  {
    id: "arroz-cogumelos", nome: "Arroz de cogumelos e ervilhas", emoji: "🍄", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: [],
    ing: [["arroz", 300], ["cogumelos", 300], ["ervilhas", 200], ["cebola", 1], ["alho", 3], ["salsa", 0.5], ["azeite", 3], ["sal", 1]],
    passos: [
      "Salteia os cogumelos laminados em azeite bem quente até alourarem; reserva.",
      "Na mesma panela, refoga a cebola e o alho.",
      "Junta o arroz, as ervilhas e 750 ml de água a ferver (12 min).",
      "Envolve os cogumelos e a salsa e serve.",
    ],
  },
  {
    id: "lentilhas", nome: "Lentilhas estufadas com arroz", emoji: "🍲", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["fogao"], tags: ["conforto"],
    ing: [["lentilhas", 300], ["arroz", 200], ["cenoura", 2], ["cebola", 1], ["polpa", 0.5], ["cominhos", 1], ["azeite", 2]],
    passos: [
      "Refoga a cebola; junta a cenoura, a polpa e os cominhos.",
      "Adiciona as lentilhas e 900 ml de água (25 min).",
      "Coze o arroz à parte (12 min).",
      "Serve as lentilhas sobre o arroz.",
    ],
  },
  {
    id: "caril-grao", nome: "Caril de grão e espinafres", emoji: "🍛", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: ["conforto"],
    ing: [["grao", 2], ["polpa", 1], ["espinafres", 200], ["cebola", 1], ["alho", 3], ["caril", 2], ["arroz", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Põe o arroz a cozer (12 min).",
      "Refoga a cebola e o alho no azeite; junta o caril e mexe 1 minuto.",
      "Adiciona a polpa, o grão escorrido e um copo de água e apura (10 min).",
      "Junta os espinafres até murcharem e serve com o arroz.",
    ],
  },
  {
    id: "chili-sem-carne", nome: "Chili de feijão (sem carne)", emoji: "🌶️", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["feijao", 2], ["milho", 1], ["pimento", 2], ["cebola", 1], ["alho", 3], ["polpa", 1], ["cominhos", 1], ["colorau", 1], ["arroz", 300], ["azeite", 2]],
    passos: [
      "Refoga a cebola, o alho e os pimentos em cubos (5 min).",
      "Junta os cominhos, o colorau, a polpa e o feijão escorrido e apura (20 min).",
      "Coze o arroz à parte (12 min).",
      "Junta o milho no fim e serve com o arroz.",
    ],
  },

  // ───────────── Carne ─────────────
  {
    id: "jardineira-frango", nome: "Jardineira de frango", emoji: "🥘", tipo: "prato",
    custo: 1, tempoMin: 45, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["coxas-frango", 800], ["batata", 600], ["cenoura", 3], ["ervilhas", 200], ["cebola", 1], ["polpa", 0.5], ["azeite", 2]],
    passos: [
      "Aloura o frango com a cebola no azeite.",
      "Junta a polpa, a cenoura às rodelas e água até meio; estufa (15 min).",
      "Adiciona as batatas em cubos e as ervilhas (20 min).",
      "Retifica os temperos e serve.",
    ],
  },
  {
    id: "frango-forno", nome: "Frango assado com batatas", emoji: "🍗", tipo: "prato",
    custo: 1, tempoMin: 60, equip: [["forno", "airfryer"]], tags: ["familia"],
    ing: [["coxas-frango", 1200], ["batata", 800], ["alho", 4], ["limao", 1], ["alface", 1], ["colorau", 1], ["azeite", 3], ["sal", 1]],
    passos: [
      "Tempera o frango com alho esmagado, colorau, limão, sal e azeite; deixa marinar se der (30 min).",
      "Forno: 200 °C com as batatas em gomos à volta (50 min). Air fryer: as coxas a 180 °C (25 min) e as batatas à parte (20 min).",
      "Vira a meio e rega com o molho.",
      "Serve com salada de alface.",
    ],
  },
  {
    id: "frango-estufado", nome: "Frango estufado com massa", emoji: "🍖", tipo: "prato",
    custo: 1, tempoMin: 40, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["coxas-frango", 800], ["massa", 300], ["cebola", 1], ["polpa", 1], ["louro", 1], ["azeite", 2]],
    passos: [
      "Aloura o frango com a cebola e o louro.",
      "Junta a polpa e 400 ml de água; estufa (25 min).",
      "Coze a massa à parte (10 min) e envolve no molho.",
      "Serve o frango sobre a massa.",
    ],
  },
  {
    id: "frango-batata-doce", nome: "Frango com batata-doce e brócolos", emoji: "💪", tipo: "prato",
    custo: 2, tempoMin: 30, equip: [["airfryer", "forno"]], tags: [],
    ing: [["peito-frango", 600], ["batata-doce", 600], ["brocolos", 400], ["alho", 2], ["colorau", 1], ["limao", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Corta a batata-doce em cubos, envolve em azeite e sal. Air fryer a 190 °C (10 min) ou forno a 200 °C (15 min).",
      "Tempera o frango em tiras com alho, colorau, limão e sal.",
      "Junta o frango e os brócolos à batata e cozinha mais um pouco, abanando a meio (12 min).",
      "Serve com um fio de limão.",
    ],
  },
  {
    id: "strogonoff-frango", nome: "Strogonoff de frango", emoji: "🍲", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: ["familia", "conforto"],
    ing: [["peito-frango", 600], ["cogumelos", 250], ["natas", 200], ["cebola", 1], ["alho", 2], ["colorau", 1], ["arroz", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Põe o arroz a cozer (12 min).",
      "Aloura o frango em tiras no azeite; reserva.",
      "Refoga a cebola, o alho e os cogumelos; junta o colorau e o frango.",
      "Adiciona as natas e deixa engrossar em lume brando (5 min). Serve com o arroz.",
    ],
  },
  {
    id: "empadao-carne", nome: "Empadão de carne picada", emoji: "🥧", tipo: "prato",
    custo: 2, tempoMin: 55, equip: ["fogao", "forno"], tags: ["conforto", "familia"],
    ing: [["carne-picada", 500], ["batata", 1000], ["cebola", 1], ["cenoura", 1], ["polpa", 0.25], ["leite", 100], ["manteiga", 30], ["azeite", 2]],
    passos: [
      "Coze as batatas (20 min) e faz puré com o leite e a manteiga.",
      "Refoga a cebola e a cenoura ralada; junta a carne e a polpa e apura (10 min).",
      "Monta: carne no fundo, puré por cima; risca com um garfo.",
      "Leva ao forno a 200 °C até dourar (15 min).",
    ],
  },
  {
    id: "almondegas", nome: "Almôndegas em molho de tomate", emoji: "🧆", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao"], tags: ["familia"],
    ing: [["carne-picada", 500], ["arroz", 300], ["polpa", 1], ["cebola", 1], ["ovo", 1], ["pao-ralado", 30], ["azeite", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Mistura a carne com o ovo, o pão ralado, sal e pimenta; molda bolinhas.",
      "Refoga a cebola, junta a polpa e deixa apurar.",
      "Coze as almôndegas no molho, tapadas (15 min).",
      "Serve com arroz branco (12 min a cozer).",
    ],
  },
  {
    id: "bifanas", nome: "Bifanas de porco no pão", emoji: "🥖", tipo: "prato",
    custo: 2, tempoMin: 25, equip: ["fogao"], tags: ["takeaway"],
    ing: [["febras", 600], ["pao", 4], ["alho", 4], ["vinho-branco", 100], ["colorau", 1], ["louro", 1], ["azeite", 2]],
    passos: [
      "Tempera as febras com alho, colorau, louro e vinho branco (30 min).",
      "Frita em lume forte, pouco tempo de cada lado.",
      "Deixa o molho apurar e volta a passar as bifanas por ele.",
      "Serve no pão com o molho.",
    ],
  },
  {
    id: "hamburguer-caseiro", nome: "Hambúrguer no pão com batatas no forno", emoji: "🍔", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao", ["forno", "airfryer"]], tags: ["takeaway", "familia"],
    ing: [["hamburgueres", 4], ["pao", 4], ["batata", 800], ["tomate", 1], ["alface", 0.5], ["azeite", 2], ["sal", 1]],
    passos: [
      "Corta as batatas em palitos, envolve em azeite e sal. Forno a 220 °C ou air fryer a 200 °C (25 min).",
      "Grelha os hambúrgueres na frigideira bem quente (4 min de cada lado).",
      "Abre o pão e aquece-o na frigideira.",
      "Monta com alface e tomate às rodelas e serve com as batatas.",
    ],
  },
  {
    id: "baguete-pizza", nome: "Baguete-pizza", emoji: "🍕", tipo: "prato",
    custo: 2, tempoMin: 20, equip: [["forno", "airfryer"]], tags: ["takeaway", "familia"],
    ing: [["baguete", 2], ["polpa", 0.5], ["mozarela", 2], ["fiambre", 1], ["cogumelos", 150], ["alface", 1], ["oregaos", 1], ["azeite", 1]],
    passos: [
      "Corta as baguetes ao meio, ao comprido.",
      "Barra com polpa de tomate e põe fiambre, cogumelos laminados e mozarela às fatias.",
      "Orégãos por cima e ao forno a 220 °C ou air fryer a 190 °C até derreter (10 min).",
      "Serve com salada de alface.",
    ],
  },

  // ───────────── Peixe ─────────────
  {
    id: "pescada-cozida", nome: "Pescada cozida com todos", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: ["conforto"],
    ing: [["pescada", 600], ["batata", 600], ["ovo", 4], ["couve", 300], ["azeite", 4], ["vinagre", 1]],
    passos: [
      "Coze as batatas e a couve (20 min); a meio, junta os ovos (10 min).",
      "Junta a pescada nos últimos minutos (8 min).",
      "Escorre tudo bem.",
      "Rega com azeite e vinagre e serve tudo no mesmo prato, à moda antiga.",
    ],
  },
  {
    id: "filetes-airfryer", nome: "Filetes de pescada crocantes", emoji: "🍤", tipo: "prato",
    custo: 2, tempoMin: 25, equip: [["airfryer", "forno", "fogao"]], tags: ["familia", "takeaway"],
    ing: [["filetes-pescada", 600], ["arroz", 300], ["ovo", 2], ["pao-ralado", 100], ["limao", 1], ["azeite", 1]],
    passos: [
      "Passa os filetes descongelados por ovo batido e pão ralado.",
      "Air fryer a 200 °C com um fio de azeite, virando a meio (12 min). Sem air fryer: forno a 220 °C ou frigideira.",
      "Coze o arroz (12 min).",
      "Serve com limão e arroz.",
    ],
  },
  {
    id: "bacalhau-bras", nome: "Bacalhau à Brás", emoji: "🐠", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: ["conforto", "familia"],
    ing: [["bacalhau", 400], ["batata-palha", 150], ["ovo", 6], ["cebola", 2], ["alho", 2], ["salsa", 0.5], ["azeitonas", 50], ["azeite", 3]],
    passos: [
      "Refoga a cebola às meias-luas com o alho até ficar macia (8 min).",
      "Junta o bacalhau desfiado e deixa cozinhar (5 min).",
      "Adiciona a batata palha e os ovos batidos; envolve em lume brando até ficar cremoso.",
      "Serve com salsa picada e azeitonas.",
    ],
  },
  {
    id: "bacalhau-grao", nome: "Bacalhau com grão", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: ["conforto"],
    ing: [["bacalhau", 500], ["grao", 2], ["batata", 400], ["ovo", 4], ["cebola", 1], ["alho", 2], ["salsa", 0.5], ["azeite", 4], ["vinagre", 1]],
    passos: [
      "Coze as batatas e os ovos (12 min).",
      "Coze o bacalhau em água a ferver, sem deixar desfazer (6 min).",
      "Aquece o grão e pica a cebola, o alho e a salsa.",
      "Serve tudo no prato e rega com azeite, vinagre e a cebolada crua.",
    ],
  },
  {
    id: "salmao-forno", nome: "Salmão no forno com batatinhas", emoji: "🍣", tipo: "prato",
    custo: 3, tempoMin: 35, equip: [["forno", "airfryer"]], tags: [],
    ing: [["salmao", 600], ["batata", 600], ["feijao-verde", 300], ["limao", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Batatas às rodelas no tabuleiro com azeite, alho e sal; forno a 200 °C (15 min).",
      "Junta o salmão temperado com limão e o feijão-verde (15 min).",
      "Air fryer: batatas a 190 °C (12 min), depois salmão e feijão-verde (10 min).",
      "Serve com mais limão.",
    ],
  },

  // ───────────── Ovos ─────────────
  {
    id: "omelete-legumes", nome: "Omelete de legumes com salada", emoji: "🥗", tipo: "prato",
    custo: 1, tempoMin: 15, equip: ["fogao"], tags: [],
    ing: [["ovo", 8], ["curgete", 1], ["pimento", 1], ["cebola", 1], ["alface", 1], ["queijo-ralado", 50], ["azeite", 2]],
    passos: [
      "Salteia a cebola, o pimento e a curgete em cubos pequenos (5 min).",
      "Bate os ovos e junta os legumes e o queijo.",
      "Cozinha a omelete em lume médio-baixo e dobra ao meio.",
      "Serve com salada de alface.",
    ],
  },
  {
    id: "tortilha", nome: "Tortilha de batata", emoji: "🫓", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["fogao"], tags: ["familia"],
    ing: [["batata", 600], ["ovo", 6], ["cebola", 1], ["alface", 1], ["azeite", 4], ["sal", 1]],
    passos: [
      "Frita a batata às rodelas finas com a cebola, em lume médio, até macia (15 min).",
      "Escorre e envolve nos ovos batidos com sal; deixa repousar (5 min).",
      "Cozinha na frigideira em lume brando e vira com a ajuda de um prato.",
      "Serve morna com salada.",
    ],
  },
  {
    id: "grao-espinafres", nome: "Grão com espinafres e ovo escalfado", emoji: "🌿", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: [],
    ing: [["grao", 2], ["espinafres", 300], ["ovo", 4], ["alho", 3], ["colorau", 1], ["azeite", 3], ["vinagre", 1]],
    passos: [
      "Doura o alho no azeite com o colorau.",
      "Junta o grão escorrido e os espinafres; salteia até murcharem.",
      "Escalfa os ovos em água com um fio de vinagre (3 min).",
      "Serve o grão com o ovo por cima.",
    ],
  },
  {
    id: "salada-grao-atum", nome: "Salada de grão com atum", emoji: "🥙", tipo: "prato",
    custo: 1, tempoMin: 15, equip: ["fogao"], tags: [],
    ing: [["grao", 2], ["atum", 2], ["ovo", 4], ["cebola-roxa", 1], ["pimento", 1], ["salsa", 1], ["azeite", 3], ["vinagre", 1]],
    passos: [
      "Coze os ovos (10 min).",
      "Mistura o grão escorrido, o atum, a cebola e o pimento picados.",
      "Tempera com azeite, vinagre, sal e salsa.",
      "Junta os ovos em quartos por cima.",
    ],
  },
  {
    id: "legumes-airfryer", nome: "Legumes assados com ovo", emoji: "🍆", tipo: "prato",
    custo: 1, tempoMin: 30, equip: [["airfryer", "forno"], "fogao"], tags: [],
    ing: [["batata-doce", 500], ["curgete", 1], ["pimento", 2], ["cebola-roxa", 1], ["ovo", 4], ["oregaos", 1], ["azeite", 2]],
    passos: [
      "Corta os legumes em pedaços regulares e envolve em azeite, sal e orégãos.",
      "Air fryer a 190 °C, abanando a meio (20 min). Forno: 200 °C (30 min).",
      "Estrela ou escalfa os ovos.",
      "Serve os legumes com o ovo por cima.",
    ],
  },

  // ───────────── Micro-ondas ─────────────
  {
    id: "pescada-microondas", nome: "Pescada com batata e legumes no micro-ondas", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 20, equip: ["microondas"], tags: [],
    ing: [["filetes-pescada", 600], ["batata", 500], ["curgete", 1], ["cenoura", 2], ["tomate", 2], ["limao", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Corta a batata, a curgete, a cenoura e o tomate às rodelas finas.",
      "Num prato fundo próprio para micro-ondas, põe a batata e a cenoura com um fio de azeite e 3 colheres de água; tapa e cozinha na potência máxima (6 min).",
      "Junta a curgete e o tomate, os filetes por cima, alho laminado, limão e sal; tapa outra vez (7 min).",
      "Deixa repousar tapado (2 min) — acaba de cozinhar com o próprio vapor — e serve.",
    ],
  },
  {
    id: "batata-recheada-microondas", nome: "Batata recheada com atum (micro-ondas)", emoji: "🥔", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["microondas"], tags: ["familia"],
    ing: [["batata", 1000], ["atum", 2], ["milho", 1], ["iogurte", 2], ["cebola-roxa", 0.5], ["salsa", 0.5], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Lava 4 batatas grandes e pica-as várias vezes com um garfo.",
      "Micro-ondas na potência máxima, virando a meio, até estarem macias (12 min).",
      "Mistura o atum escorrido, o milho, o iogurte, a cebola picada, a salsa, sal e pimenta.",
      "Abre as batatas ao meio, esmaga um pouco o miolo e recheia.",
    ],
  },

  // ───────────── Panela de pressão ─────────────
  {
    id: "carne-estufada-pressao", nome: "Carne estufada com batatas (panela de pressão)", emoji: "🥩", tipo: "prato",
    custo: 2, tempoMin: 50, equip: ["panela-pressao"], tags: ["conforto", "familia"],
    ing: [["carne-estufar", 600], ["batata", 800], ["cenoura", 2], ["cebola", 1], ["alho", 2], ["polpa", 0.5], ["vinho-branco", 100], ["louro", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Na própria panela, refoga a cebola e o alho no azeite e aloura a carne em cubos.",
      "Junta o vinho, a polpa, o louro e 300 ml de água.",
      "Fecha a panela e conta o tempo a partir do momento em que ganha pressão (25 min).",
      "Tira a pressão, junta as batatas e a cenoura em pedaços, fecha outra vez (6 min) e serve.",
    ],
  },
  {
    id: "feijao-frade-atum", nome: "Salada de feijão-frade com atum e ovo", emoji: "🫘", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["panela-pressao"], tags: [],
    ing: [["feijao-frade", 300], ["atum", 2], ["ovo", 4], ["cebola-roxa", 1], ["salsa", 1], ["azeite", 4], ["vinagre", 2], ["sal", 1]],
    passos: [
      "Põe o feijão-frade na panela com 1 L de água e sal — na pressão não é preciso demolhar.",
      "Coloca os ovos lavados por cima, fecha e conta a partir da pressão (12 min).",
      "Tira a pressão, escorre o feijão e passa os ovos por água fria.",
      "Junta o atum, a cebola e a salsa picadas e os ovos em quartos; tempera com azeite e vinagre.",
    ],
  },

  // ───────────── Panela de cozedura lenta ─────────────
  {
    id: "frango-desfiado-lento", nome: "Sandes de frango desfiado (cozedura lenta)", emoji: "🥪", tipo: "prato",
    custo: 2, tempoMin: 240, equip: ["slowcooker"], tags: ["takeaway", "familia"],
    ing: [["peito-frango", 700], ["polpa", 1], ["pimento", 2], ["cebola", 1], ["alho", 3], ["colorau", 1], ["cominhos", 1], ["pao", 4], ["alface", 0.5], ["sal", 1]],
    passos: [
      "De manhã, põe na panela o frango, a polpa, os pimentos e a cebola às tiras, o alho, o colorau, os cominhos e sal.",
      "Liga no mínimo e vai à tua vida: fica pronto sozinho (4 h no máximo, ou 6-8 h no mínimo).",
      "Desfia o frango com dois garfos no próprio molho.",
      "Serve no pão com alface.",
    ],
  },
  {
    id: "grao-abobora-lento", nome: "Estufado de grão e abóbora (cozedura lenta)", emoji: "🎃", tipo: "prato",
    custo: 1, tempoMin: 240, equip: ["slowcooker"], tags: ["conforto"],
    ing: [["grao", 2], ["abobora", 600], ["cebola", 1], ["alho", 3], ["polpa", 1], ["espinafres", 150], ["cominhos", 1], ["colorau", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Põe na panela o grão escorrido, a abóbora em cubos, a cebola e o alho picados, a polpa, as especiarias, o azeite e um copo de água.",
      "Liga no máximo e deixa estar (4 h no máximo, ou 7 h no mínimo).",
      "Junta os espinafres nos últimos minutos, só para murcharem.",
      "Serve como está, ou com pão para o molho.",
    ],
  },

  // ───────────── Robô de cozinha ─────────────
  {
    id: "risotto-cogumelos-robo", nome: "Risotto de cogumelos no robô de cozinha", emoji: "🍄", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["robo"], tags: ["conforto"],
    ing: [["arroz", 320], ["cogumelos", 300], ["cebola", 1], ["alho", 2], ["vinho-branco", 100], ["queijo-ralado", 40], ["azeite", 3], ["sal", 1]],
    passos: [
      "Pica a cebola e o alho no copo, alguns segundos em velocidade média.",
      "Junta o azeite e refoga a 120 °C com rotação inversa (3 min).",
      "Junta o arroz, os cogumelos laminados e o vinho (2 min); depois 900 ml de água e sal, a 100 °C, rotação inversa e velocidade de colher (15 min).",
      "Envolve o queijo ralado e deixa repousar no copo (2 min).",
    ],
  },
  {
    id: "creme-cenoura-robo", nome: "Creme de cenoura e coentros no robô", emoji: "🥕", tipo: "sopa",
    custo: 1, tempoMin: 30, equip: ["robo"], tags: ["conforto"],
    ing: [["cenoura", 8], ["batata", 300], ["cebola", 1], ["alho", 1], ["coentros", 0.25], ["azeite", 2], ["sal", 1]],
    passos: [
      "Pica a cebola e o alho no copo; junta o azeite e refoga a 120 °C (3 min).",
      "Junta a cenoura e a batata em pedaços, 1 L de água e sal: 100 °C, velocidade baixa (25 min).",
      "Tritura de forma progressiva até à velocidade máxima (1 min).",
      "Serve com coentros picados.",
    ],
  },

  // ───────────── Fritadeira e picadora ─────────────
  {
    id: "pataniscas", nome: "Pataniscas de bacalhau com salada", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 30, equip: [["fritadeira", "fogao"]], tags: ["familia", "conforto"],
    ing: [["bacalhau", 300], ["farinha", 150], ["ovo", 2], ["cebola", 1], ["salsa", 1], ["oleo", 4], ["alface", 1], ["tomate", 2], ["sal", 1]],
    passos: [
      "Desfia o bacalhau e pica a cebola e a salsa.",
      "Faz um polme com a farinha, os ovos e 200 ml de água; junta o bacalhau, a cebola e a salsa.",
      "Fritadeira a 180 °C (ou frigideira com óleo bem quente): frita às colheradas, virando, até alourarem (4 min).",
      "Escorre em papel e serve com salada de alface e tomate.",
    ],
  },
  {
    id: "bolinhos-bacalhau", nome: "Bolinhos de bacalhau", emoji: "🧆", tipo: "prato",
    custo: 2, tempoMin: 50, equip: [["processador", "robo"], ["fritadeira", "fogao"]], tags: ["familia", "conforto"],
    ing: [["bacalhau", 300], ["batata", 500], ["ovo", 2], ["cebola", 0.5], ["salsa", 1], ["oleo", 4], ["alface", 1], ["sal", 1]],
    passos: [
      "Coze as batatas com casca (20 min), descasca e esmaga.",
      "Na picadora, desfaz o bacalhau em fios com a cebola e a salsa.",
      "Mistura com a batata e os ovos; molda os bolinhos com duas colheres.",
      "Fritadeira a 180 °C ou óleo bem quente (4 min); serve com salada.",
    ],
  },
  {
    id: "hamburguer-grao", nome: "Hambúrgueres de grão no pão", emoji: "🍔", tipo: "prato",
    custo: 1, tempoMin: 30, equip: [["processador", "robo"], ["fogao", "forno", "airfryer", "grelhador"]], tags: ["takeaway", "familia"],
    ing: [["grao", 2], ["cebola", 1], ["alho", 2], ["salsa", 0.5], ["pao-ralado", 50], ["cominhos", 1], ["colorau", 1], ["pao", 4], ["tomate", 1], ["alface", 0.5], ["azeite", 2], ["sal", 1]],
    passos: [
      "Na picadora, tritura o grão escorrido com a cebola, o alho, a salsa e as especiarias — fica uma pasta grossa.",
      "Junta o pão ralado e molda 4 hambúrgueres; se der, 15 min no frigorífico.",
      "Frigideira com um fio de azeite (4 min de cada lado), air fryer ou grelhador a 200 °C (10 min).",
      "Serve no pão com alface e tomate.",
    ],
  },

  // ───────────── Grelhador, tosteira e torradeira ─────────────
  {
    id: "frango-grelhado-grao", nome: "Frango grelhado com salada de grão", emoji: "🥗", tipo: "prato",
    custo: 2, tempoMin: 25, equip: [["grelhador", "fogao"]], tags: [],
    ing: [["peito-frango", 600], ["limao", 1], ["alho", 2], ["grao", 1], ["tomate", 2], ["pepino", 1], ["cebola-roxa", 0.5], ["azeite", 3], ["vinagre", 1], ["sal", 1]],
    passos: [
      "Tempera os bifes de frango com alho, limão e sal (10 min).",
      "Grelhador bem quente, 4 min de cada lado (ou uma frigideira grelhadora no fogão).",
      "Mistura o grão escorrido com o tomate, o pepino e a cebola picados; tempera com azeite e vinagre.",
      "Serve o frango às tiras sobre a salada.",
    ],
  },
  {
    id: "tostas-mistas", nome: "Tostas mistas com salada", emoji: "🥪", tipo: "prato",
    custo: 1, tempoMin: 15, equip: [["sanduicheira", "grelhador", "fogao"]], tags: ["familia", "takeaway"],
    ing: [["pao-forma", 8], ["fiambre", 1], ["queijo-flamengo", 8], ["manteiga", 20], ["alface", 1], ["tomate", 2]],
    passos: [
      "Barra o pão com uma camada fina de manteiga, do lado de fora.",
      "Monta: pão, queijo, fiambre, queijo, pão.",
      "Tosteira bem quente até dourar (4 min). Sem tosteira: frigideira tapada, 2 min de cada lado.",
      "Serve com salada de alface e tomate.",
    ],
  },
  {
    id: "tosta-atum", nome: "Tosta de atum e queijo", emoji: "🥪", tipo: "prato",
    custo: 1, tempoMin: 15, equip: [["sanduicheira", "grelhador", "forno"]], tags: [],
    ing: [["pao-forma", 8], ["atum", 2], ["queijo-flamengo", 4], ["cebola-roxa", 0.5], ["tomate", 2], ["alface", 1]],
    passos: [
      "Mistura o atum escorrido com a cebola picada.",
      "Monta as tostas com o atum, uma fatia de queijo e rodelas de tomate.",
      "Tosteira ou grelhador até o queijo derreter (4 min); no forno, 220 °C (8 min).",
      "Serve com alface.",
    ],
  },
  {
    id: "torradas-abacate-ovo", nome: "Torradas com abacate e ovo", emoji: "🥑", tipo: "prato",
    custo: 2, tempoMin: 15, equip: [["torradeira", "forno", "grelhador"], ["fogao", "microondas"]], tags: [],
    ing: [["pao-forma", 8], ["abacate", 2], ["ovo", 4], ["tomate", 2], ["limao", 0.5], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Torra o pão na torradeira.",
      "Esmaga o abacate com limão, sal e pimenta.",
      "Escalfa os ovos em água a ferver (3 min) — ou no micro-ondas, numa chávena com água tapada (1 min).",
      "Barra as torradas com abacate, junta tomate às rodelas e o ovo por cima.",
    ],
  },
  {
    id: "bruschetta-atum", nome: "Bruschetta de tomate e atum", emoji: "🍅", tipo: "prato",
    custo: 1, tempoMin: 15, equip: [["torradeira", "forno", "grelhador", "airfryer"]], tags: [],
    ing: [["baguete", 1], ["tomate", 4], ["atum", 2], ["alho", 2], ["azeite", 3], ["oregaos", 1], ["alface", 1], ["sal", 1]],
    passos: [
      "Corta a baguete em fatias e torra-as.",
      "Esfrega cada fatia com um dente de alho cortado ao meio.",
      "Pica o tomate e mistura com o atum, azeite, orégãos e sal.",
      "Põe por cima das torradas e serve com salada.",
    ],
  },

  // ───────────── Chaleira elétrica e liquidificadora (sem fogão) ─────────────
  {
    id: "cuscuz-grao-legumes", nome: "Cuscuz com grão e legumes", emoji: "🥙", tipo: "prato",
    custo: 1, tempoMin: 15, equip: [["chaleira", "fogao", "microondas"]], tags: [],
    ing: [["cuscuz", 300], ["grao", 1], ["tomate", 2], ["pepino", 1], ["pimento", 1], ["cebola-roxa", 0.5], ["hortela", 0.5], ["limao", 1], ["azeite", 4], ["sal", 1]],
    passos: [
      "Ferve 300 ml de água na chaleira.",
      "Deita sobre o cuscuz com sal e um fio de azeite; tapa e deixa inchar (5 min).",
      "Solta com um garfo e junta o grão, os legumes picados e a hortelã.",
      "Tempera com limão e azeite. Aguenta bem para o almoço do dia seguinte.",
    ],
  },
  {
    id: "cuscuz-atum", nome: "Cuscuz com atum e pimentos", emoji: "🍋", tipo: "prato",
    custo: 1, tempoMin: 15, equip: [["chaleira", "fogao", "microondas"]], tags: [],
    ing: [["cuscuz", 300], ["atum", 2], ["pimento", 1], ["milho", 1], ["tomate", 2], ["salsa", 0.5], ["limao", 1], ["azeite", 3], ["sal", 1]],
    passos: [
      "Ferve 300 ml de água na chaleira.",
      "Deita sobre o cuscuz com sal; tapa e deixa inchar (5 min).",
      "Junta o atum, o pimento e o tomate picados, o milho e a salsa.",
      "Tempera com limão e azeite e serve.",
    ],
  },
  {
    id: "gaspacho", nome: "Gaspacho alentejano", emoji: "🍅", tipo: "sopa",
    custo: 1, tempoMin: 15, equip: [["liquidificadora", "varinha", "robo"]], tags: [],
    ing: [["tomate", 6], ["pepino", 1], ["pimento", 1], ["cebola", 0.5], ["alho", 1], ["azeite", 4], ["vinagre", 2], ["sal", 1]],
    passos: [
      "Corta o tomate, o pepino, o pimento, a cebola e o alho em pedaços.",
      "Tritura tudo na liquidificadora com o azeite, o vinagre, sal e 300 ml de água fria.",
      "Prova e acerta o vinagre e o sal.",
      "Serve bem fresco — guarda no frigorífico até ao jantar.",
    ],
  },
];
