/*
 * Mais jantares e sopas económicos — o mesmo formato de dados.js (lê o
 * cabeçalho de lá). Para 4 pessoas.
 *
 * Sem fotografias: nem tiradas por nós, nem geradas. O emoji é o que a
 * receita mostra.
 */

export const MAIS = [
  // ───────────── Sopas ─────────────
  {
    id: "sopa-grao-espinafres", nome: "Sopa de grão com espinafres", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto", "familia"],
    ing: [["batata", 400], ["cebola", 1], ["cenoura", 2], ["alho", 2], ["grao", 2], ["espinafres", 200], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze a batata, a cenoura, a cebola, o alho e metade do grão em água com sal (20 min).",
      "Tritura tudo com a varinha até ficar cremoso.",
      "Junta o resto do grão inteiro e os espinafres e deixa ferver mais um pouco (6 min).",
      "Tempera com um fio de azeite no fim.",
    ],
  },
  {
    id: "creme-alho-frances", nome: "Creme de alho-francês e batata", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto"],
    ing: [["alho-frances", 2], ["batata", 500], ["cebola", 1], ["cenoura", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Lava bem o alho-francês e corta-o às rodelas, com a parte verde mais clara.",
      "Refoga o alho-francês e a cebola num fio de azeite, sem deixar ganhar cor (5 min).",
      "Junta a batata, a cenoura e 1,5 L de água com sal e coze (20 min).",
      "Tritura até ficar aveludado e termina com o resto do azeite.",
    ],
  },
  {
    id: "creme-couve-flor", nome: "Creme de couve-flor", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 30, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["conforto", "familia"],
    ing: [["couve-flor", 600], ["batata", 300], ["cebola", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Separa a couve-flor em raminhos e corta a batata e a cebola aos bocados.",
      "Coze tudo com o alho em 1,3 L de água com sal (20 min).",
      "Tritura até ficar cremoso; se estiver espesso, junta um pouco de água quente.",
      "Serve com um fio de azeite por cima.",
    ],
  },
  {
    id: "sopa-lentilhas", nome: "Sopa de lentilhas e cenoura", emoji: "🍲", tipo: "sopa",
    custo: 1, tempoMin: 40, equip: ["fogao"], tags: ["conforto"],
    ing: [["lentilhas", 200], ["cenoura", 3], ["cebola", 1], ["alho", 2], ["polpa", 0.5], ["cominhos", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Passa as lentilhas por água fria e escorre.",
      "Refoga a cebola, o alho e a cenoura aos cubinhos no azeite (6 min).",
      "Junta os cominhos, a polpa, as lentilhas e 1,5 L de água com sal.",
      "Deixa cozer em lume brando até as lentilhas ficarem macias (25 min).",
    ],
  },
  {
    id: "sopa-pedra", nome: "Sopa da pedra (versão económica)", emoji: "🍲", tipo: "sopa",
    custo: 2, tempoMin: 50, equip: ["fogao"], tags: ["conforto"],
    ing: [["feijao", 2], ["chourico", 0.5], ["entremeada", 150], ["batata", 400], ["cebola", 1], ["cenoura", 2], ["couve", 200], ["louro", 1], ["sal", 1]],
    passos: [
      "Coze a entremeada e o chouriço inteiros em 2 L de água com o louro e a cebola picada (20 min).",
      "Retira as carnes, corta-as aos bocados e guarda.",
      "No mesmo caldo, coze a batata e a cenoura aos cubos (15 min).",
      "Junta o feijão escorrido, a couve em tiras e as carnes; ferve mais um pouco e retifica o sal (8 min).",
    ],
  },
  {
    id: "sopa-feijao-verde", nome: "Sopa de feijão-verde", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 35, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["familia"],
    ing: [["batata", 400], ["cenoura", 2], ["cebola", 1], ["abobora", 200], ["feijao-verde", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze a batata, a cenoura, a cebola e a abóbora em 1,5 L de água com sal (20 min).",
      "Tritura para fazer o caldo.",
      "Junta o feijão-verde cortado fininho e deixa cozer no caldo (10 min).",
      "Termina com o azeite.",
    ],
  },
  {
    id: "sopa-legumes-rapida", nome: "Sopa rápida de legumes congelados", emoji: "🥣", tipo: "sopa",
    custo: 1, tempoMin: 25, equip: ["fogao", ["varinha", "liquidificadora", "robo"]], tags: ["familia"],
    ing: [["legumes-sopa", 750], ["batata", 300], ["cebola", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Leva a ferver 1,3 L de água com sal, a batata e a cebola aos bocados.",
      "Junta os legumes congelados sem descongelar e coze tudo (15 min).",
      "Tritura e termina com o azeite.",
    ],
  },

  // ───────────── Peixe ─────────────
  {
    id: "pescada-forno", nome: "Pescada no forno com batatas", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 55, equip: ["forno"], tags: ["familia"],
    ing: [["pescada", 800], ["batata", 800], ["cebola", 2], ["tomate", 2], ["pimento", 1], ["alho", 3], ["vinho-branco", 100], ["salsa", 0.5], ["azeite", 4], ["sal", 1]],
    passos: [
      "Corta a batata às rodelas finas e espalha no tabuleiro com metade da cebola, sal e um fio de azeite. Forno a 200 °C (20 min).",
      "Tempera a pescada com sal e alho picado.",
      "Põe a pescada por cima das batatas, com o resto da cebola, o tomate e o pimento às rodelas, o vinho e o azeite.",
      "Volta ao forno até o peixe lascar (25 min). Salsa picada no fim.",
    ],
  },
  {
    id: "carapaus-forno", nome: "Carapaus no forno com batata a murro", emoji: "🐟", tipo: "prato",
    custo: 1, tempoMin: 50, equip: ["forno"], tags: ["conforto"],
    ing: [["carapau", 1000], ["batata", 1000], ["alho", 4], ["alface", 1], ["tomate", 2], ["azeite", 5], ["vinagre", 1], ["sal", 1]],
    passos: [
      "Coze as batatas pequenas com casca em água com sal (15 min), escorre e dá-lhes um murro.",
      "Arranja os carapaus, tempera com sal grosso e põe-nos no tabuleiro com as batatas.",
      "Rega com azeite e o alho às lâminas e leva ao forno a 220 °C (20 min).",
      "Serve com salada de alface e tomate, temperada com azeite e vinagre.",
    ],
  },
  {
    id: "sardinhas-assadas", nome: "Sardinhas assadas com pimentos e batata", emoji: "🐟", tipo: "prato",
    custo: 2, tempoMin: 45, equip: ["fogao", ["grelhador", "forno"]], tags: ["conforto"],
    ing: [["sardinha", 1000], ["batata", 1000], ["pimento", 3], ["cebola", 1], ["azeite", 4], ["vinagre", 1], ["sal", 1]],
    passos: [
      "Coze as batatas com casca em água com sal (20 min).",
      "Assa os pimentos inteiros até a pele estalar, deixa arrefecer tapados e tira-lhes a pele (15 min).",
      "Tempera as sardinhas com sal grosso e grelha-as no grelhador ou no forno bem quente (8 min).",
      "Serve com os pimentos às tiras e a cebola às rodelas, temperados com azeite e vinagre.",
    ],
  },
  {
    id: "esparguete-sardinhas", nome: "Esparguete com sardinhas e tomate", emoji: "🍝", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: [],
    ing: [["esparguete", 400], ["sardinhas-lata", 3], ["polpa", 1], ["cebola", 1], ["alho", 3], ["salsa", 0.5], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze o esparguete em água com sal (10 min).",
      "Entretanto, refoga a cebola e o alho no azeite (5 min) e junta a polpa (5 min).",
      "Junta as sardinhas escorridas e desfeitas em lascas, só para aquecer.",
      "Envolve o esparguete no molho e termina com salsa picada.",
    ],
  },
  {
    id: "batata-cavala", nome: "Batata cozida com cavala, ovo e feijão-verde", emoji: "🐟", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: [],
    ing: [["batata", 800], ["feijao-verde", 300], ["ovo", 4], ["cavala-lata", 3], ["alho", 2], ["azeite", 3], ["vinagre", 1], ["sal", 1]],
    passos: [
      "Coze as batatas em água com sal (15 min); junta os ovos e o feijão-verde nos últimos 10 min.",
      "Escorre, descasca os ovos e corta-os ao meio.",
      "Põe tudo na travessa com a cavala escorrida em lascas.",
      "Tempera com azeite, vinagre e alho picado.",
    ],
  },
  {
    id: "lulas-estufadas", nome: "Lulas estufadas com batata", emoji: "🦑", tipo: "prato",
    custo: 2, tempoMin: 60, equip: ["fogao"], tags: ["conforto"],
    ing: [["lulas", 800], ["batata", 700], ["cebola", 2], ["polpa", 1], ["pimento", 1], ["alho", 3], ["vinho-branco", 100], ["louro", 1], ["azeite", 3], ["sal", 1]],
    passos: [
      "Limpa as lulas e corta-as às argolas.",
      "Refoga a cebola, o alho e o pimento no azeite com o louro (8 min).",
      "Junta as lulas, o vinho e a polpa e deixa estufar tapado em lume brando (25 min).",
      "Junta a batata aos cubos e um copo de água e coze até ficar macia (20 min).",
    ],
  },
  {
    id: "bacalhau-natas", nome: "Bacalhau com natas", emoji: "🐠", tipo: "prato",
    custo: 3, tempoMin: 60, equip: ["fogao", "forno"], tags: ["conforto", "familia"],
    ing: [["bacalhau", 600], ["batata", 800], ["cebola", 2], ["alho", 2], ["natas", 400], ["leite", 300], ["farinha", 30], ["manteiga", 30], ["queijo-ralado", 60], ["azeite", 3], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Corta a batata em cubos pequenos e frita-a ou assa-a no forno com um fio de azeite até alourar (20 min).",
      "Refoga a cebola às meias-luas e o alho no azeite (8 min) e junta o bacalhau desfiado (5 min).",
      "Faz o molho: derrete a manteiga, junta a farinha e depois o leite aos poucos, a mexer até engrossar; junta as natas.",
      "Envolve a batata, o bacalhau e o molho num tabuleiro, polvilha com queijo e gratina a 200 °C (20 min).",
    ],
  },
  {
    id: "bacalhau-gomes-sa", nome: "Bacalhau à Gomes de Sá", emoji: "🐠", tipo: "prato",
    custo: 3, tempoMin: 50, equip: ["fogao", "forno"], tags: ["conforto", "familia"],
    ing: [["bacalhau", 600], ["batata", 800], ["cebola", 3], ["ovo", 4], ["azeitonas", 60], ["alho", 3], ["salsa", 0.5], ["azeite", 8], ["sal", 1]],
    passos: [
      "Coze as batatas com pele e os ovos (15 min). Descasca e corta tudo às rodelas.",
      "Escalda o bacalhau em água a ferver, escorre e lasca-o.",
      "Aloura a cebola às rodelas e o alho no azeite em lume brando (10 min) e junta o bacalhau.",
      "Num tabuleiro, camadas de batata e bacalhau com a cebolada; forno a 200 °C (15 min). Por cima, ovo, azeitonas e salsa.",
    ],
  },
  {
    id: "bacalhau-broa", nome: "Bacalhau com broa", emoji: "🐠", tipo: "prato",
    custo: 3, tempoMin: 60, equip: ["fogao", "forno"], tags: ["conforto"],
    ing: [["bacalhau", 700], ["broa", 300], ["batata", 800], ["couve", 300], ["cebola", 2], ["alho", 5], ["azeite", 10], ["sal", 1]],
    passos: [
      "Coze as batatas pequenas com casca (15 min) e a couve em água com sal (8 min).",
      "Esfarela a broa e mistura com alho picado e um pouco de azeite.",
      "Num tabuleiro, põe o bacalhau, cobre com a broa e rodeia com as batatas a murro e a cebola às rodelas.",
      "Rega com o resto do azeite e leva ao forno a 200 °C até a broa ficar estaladiça (25 min). Serve com a couve.",
    ],
  },
  {
    id: "empadao-atum", nome: "Empadão de atum", emoji: "🥧", tipo: "prato",
    custo: 1, tempoMin: 50, equip: ["fogao", "forno"], tags: ["familia", "conforto"],
    ing: [["batata", 1000], ["atum", 4], ["leite", 150], ["manteiga", 30], ["cebola", 1], ["alho", 2], ["polpa", 0.5], ["ovo", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze as batatas em água com sal (20 min) e esmaga-as com o leite e a manteiga.",
      "Refoga a cebola e o alho no azeite, junta a polpa e o atum escorrido (8 min).",
      "Num pirex, metade do puré, o recheio e o resto do puré por cima.",
      "Pincela com ovo batido e leva ao forno a 200 °C até alourar (20 min).",
    ],
  },

  // ───────────── Frango e peru ─────────────
  {
    id: "caril-frango", nome: "Caril de frango com arroz", emoji: "🍛", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao"], tags: ["takeaway"],
    ing: [["peito-frango", 600], ["cebola", 1], ["alho", 2], ["caril", 2], ["polpa", 0.5], ["natas", 200], ["arroz", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze o arroz (18 min).",
      "Refoga a cebola e o alho no azeite (5 min), junta o caril e mexe um minuto.",
      "Junta o frango aos cubos e deixa alourar (8 min).",
      "Junta a polpa e as natas e deixa apurar em lume brando (10 min). Serve com o arroz.",
    ],
  },
  {
    id: "coxas-limao-alho", nome: "Coxas de frango com limão e alho", emoji: "🍗", tipo: "prato",
    custo: 1, tempoMin: 45, equip: [["airfryer", "forno"]], tags: ["familia"],
    ing: [["coxas-frango", 1200], ["batata", 800], ["limao", 2], ["alho", 4], ["colorau", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Tempera as coxas com sal, colorau, alho picado, o sumo de um limão e azeite.",
      "Corta as batatas em gomos e tempera com sal e azeite.",
      "Assa tudo a 200 °C, na air fryer ou no forno, virando a meio (35 min).",
      "Serve com gomos do outro limão.",
    ],
  },
  {
    id: "frango-bras", nome: "Frango à Brás", emoji: "🍳", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: ["familia"],
    ing: [["peito-frango", 500], ["batata-palha", 200], ["ovo", 6], ["cebola", 2], ["alho", 2], ["azeitonas", 40], ["salsa", 0.5], ["azeite", 3], ["sal", 1]],
    passos: [
      "Corta o frango em tirinhas e tempera com sal.",
      "Refoga a cebola às meias-luas e o alho no azeite (8 min) e junta o frango até ficar cozinhado (8 min).",
      "Junta a batata palha e os ovos batidos e mexe em lume brando só até os ovos ficarem cozinhados, ainda húmidos.",
      "Termina com salsa e azeitonas.",
    ],
  },
  {
    id: "peru-cogumelos", nome: "Bifes de peru com cogumelos e arroz", emoji: "🍄", tipo: "prato",
    custo: 2, tempoMin: 30, equip: ["fogao"], tags: [],
    ing: [["bifes-peru", 600], ["cogumelos", 250], ["natas", 200], ["cebola", 1], ["alho", 2], ["arroz", 300], ["azeite", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze o arroz (18 min).",
      "Tempera os bifes com sal e pimenta e aloura-os no azeite (3 min de cada lado). Reserva.",
      "Na mesma frigideira, refoga a cebola, o alho e os cogumelos laminados (6 min).",
      "Junta as natas, volta a pôr os bifes e deixa apurar (5 min). Serve com o arroz.",
    ],
  },
  {
    id: "peru-batata-doce", nome: "Peru grelhado com batata-doce e salada", emoji: "🥗", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao", ["forno", "airfryer"]], tags: [],
    ing: [["bifes-peru", 600], ["batata-doce", 800], ["alface", 1], ["tomate", 2], ["pepino", 1], ["limao", 1], ["azeite", 3], ["sal", 1]],
    passos: [
      "Corta a batata-doce em gomos, tempera com sal e azeite e assa a 200 °C (25 min).",
      "Tempera os bifes com sal e sumo de limão.",
      "Grelha os bifes numa frigideira bem quente (3 min de cada lado).",
      "Serve com salada de alface, tomate e pepino.",
    ],
  },

  // ───────────── Porco e vaca ─────────────
  {
    id: "lombo-assado", nome: "Lombo de porco assado com batatas", emoji: "🥩", tipo: "prato",
    custo: 2, tempoMin: 75, equip: ["forno"], tags: ["conforto", "familia"],
    ing: [["lombo", 1000], ["batata", 1000], ["cebola", 2], ["alho", 5], ["vinho-branco", 150], ["colorau", 1], ["louro", 2], ["azeite", 4], ["sal", 1]],
    passos: [
      "Barra o lombo com alho picado, sal, colorau, louro e o vinho. Se puderes, deixa a marinar umas horas.",
      "Põe-no no tabuleiro com as batatas e a cebola aos gomos e rega com azeite e a marinada.",
      "Assa a 190 °C, regando de vez em quando com o molho (60 min).",
      "Deixa repousar 5 minutos antes de fatiar.",
    ],
  },
  {
    id: "costeletas-feijao-verde", nome: "Costeletas de porco com arroz de feijão-verde", emoji: "🥩", tipo: "prato",
    custo: 2, tempoMin: 40, equip: ["fogao"], tags: ["familia"],
    ing: [["costeletas", 1000], ["arroz", 300], ["feijao-verde", 300], ["cebola", 1], ["alho", 3], ["limao", 1], ["azeite", 3], ["sal", 1]],
    passos: [
      "Tempera as costeletas com sal, alho e sumo de limão.",
      "Refoga a cebola no azeite, junta o feijão-verde cortado e o arroz, e depois 2,5 vezes o volume de água com sal (18 min).",
      "Grelha as costeletas numa frigideira bem quente (5 min de cada lado).",
      "Serve as costeletas com o arroz.",
    ],
  },
  {
    id: "entrecosto-forno", nome: "Entrecosto no forno com batatas", emoji: "🍖", tipo: "prato",
    custo: 2, tempoMin: 80, equip: ["forno"], tags: ["conforto", "familia"],
    ing: [["entrecosto", 1000], ["batata", 1000], ["alho", 5], ["colorau", 2], ["vinho-branco", 150], ["limao", 1], ["louro", 2], ["azeite", 3], ["sal", 1]],
    passos: [
      "Tempera o entrecosto com alho, colorau, sal, louro, vinho e sumo de limão.",
      "Põe-no no tabuleiro tapado com papel de alumínio e assa a 180 °C (40 min).",
      "Destapa, junta as batatas aos gomos com azeite e sal.",
      "Assa mais, a 210 °C, até tudo ficar dourado (30 min).",
    ],
  },
  {
    id: "febras-cebolada", nome: "Febras de cebolada com batata cozida", emoji: "🥩", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao"], tags: ["conforto"],
    ing: [["febras", 700], ["cebola", 3], ["alho", 3], ["vinho-branco", 100], ["louro", 1], ["batata", 800], ["azeite", 3], ["sal", 1]],
    passos: [
      "Coze as batatas em água com sal (20 min).",
      "Tempera as febras com sal e alho e aloura-as no azeite (3 min de cada lado). Reserva.",
      "Na mesma frigideira, cozinha a cebola às rodelas com o louro em lume brando até ficar macia (10 min).",
      "Junta o vinho e as febras, deixa apurar (5 min) e serve com as batatas.",
    ],
  },
  {
    id: "alheira-grelos", nome: "Alheira com ovo, batata e grelos", emoji: "🌭", tipo: "prato",
    custo: 2, tempoMin: 35, equip: ["fogao", ["forno", "airfryer"]], tags: ["conforto"],
    ing: [["alheira", 4], ["ovo", 4], ["batata", 800], ["grelos", 400], ["alho", 2], ["azeite", 3], ["oleo", 2], ["sal", 1]],
    passos: [
      "Corta as batatas em gomos e assa-as com azeite e sal a 200 °C (30 min); a meio, junta as alheiras picadas com um garfo.",
      "Coze os grelos em água com sal (6 min) e salteia-os com alho e azeite.",
      "Estrela os ovos no óleo.",
      "Serve cada alheira com um ovo, as batatas e os grelos.",
    ],
  },
  {
    id: "arroz-carne-picada", nome: "Arroz de carne picada com ervilhas", emoji: "🍚", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["fogao"], tags: ["familia"],
    ing: [["carne-picada", 500], ["arroz", 300], ["ervilhas", 200], ["cenoura", 2], ["cebola", 1], ["alho", 2], ["polpa", 0.5], ["azeite", 2], ["sal", 1]],
    passos: [
      "Refoga a cebola, o alho e a cenoura aos cubinhos no azeite (6 min).",
      "Junta a carne picada e mexe até perder a cor rosada (6 min).",
      "Junta a polpa, o arroz e 750 ml de água a ferver com sal.",
      "Coze tapado em lume brando (15 min); junta as ervilhas nos últimos 5.",
    ],
  },
  {
    id: "pimentos-recheados", nome: "Pimentos recheados com carne e arroz", emoji: "🫑", tipo: "prato",
    custo: 2, tempoMin: 60, equip: ["fogao", "forno"], tags: ["familia"],
    ing: [["pimento", 4], ["carne-picada", 400], ["arroz", 150], ["cebola", 1], ["alho", 2], ["polpa", 1], ["queijo-ralado", 60], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze o arroz só até meio (8 min) e escorre.",
      "Refoga a cebola e o alho, junta a carne até perder a cor e metade da polpa (10 min). Mistura com o arroz.",
      "Corta o topo dos pimentos, tira as sementes e recheia-os.",
      "Põe-nos num pirex com o resto da polpa à volta, queijo por cima, e forno a 190 °C (35 min).",
    ],
  },
  {
    id: "beringelas-recheadas", nome: "Beringelas recheadas com carne picada", emoji: "🍆", tipo: "prato",
    custo: 2, tempoMin: 55, equip: ["fogao", "forno"], tags: [],
    ing: [["beringela", 2], ["carne-picada", 400], ["cebola", 1], ["alho", 2], ["polpa", 1], ["queijo-ralado", 80], ["azeite", 2], ["sal", 1]],
    passos: [
      "Corta as beringelas ao comprido, faz cortes na polpa, tempera com sal e azeite e assa a 200 °C (20 min).",
      "Tira a polpa com uma colher, deixando a casca inteira, e pica-a.",
      "Refoga a cebola e o alho, junta a carne, a polpa da beringela e a polpa de tomate (12 min).",
      "Recheia as cascas, cobre com queijo e gratina (15 min).",
    ],
  },
  {
    id: "chili-carne", nome: "Chili com carne e arroz", emoji: "🌶️", tipo: "prato",
    custo: 1, tempoMin: 40, equip: ["fogao"], tags: ["takeaway", "conforto"],
    ing: [["carne-picada", 500], ["feijao", 2], ["polpa", 1], ["cebola", 1], ["pimento", 1], ["alho", 2], ["cominhos", 1], ["colorau", 1], ["arroz", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze o arroz (18 min).",
      "Refoga a cebola, o alho e o pimento aos cubos no azeite (6 min).",
      "Junta a carne e as especiarias e mexe até a carne perder a cor (6 min).",
      "Junta a polpa e o feijão escorrido e deixa apurar em lume brando (15 min). Serve com o arroz.",
    ],
  },
  {
    id: "rancho", nome: "Rancho à portuguesa", emoji: "🍲", tipo: "prato",
    custo: 2, tempoMin: 60, equip: ["fogao"], tags: ["conforto"],
    ing: [["grao", 2], ["massa", 200], ["chourico", 0.5], ["entremeada", 200], ["couve", 300], ["batata", 300], ["cebola", 1], ["cenoura", 1], ["alho", 2], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze a entremeada e o chouriço em 2 L de água com sal (20 min). Retira e corta aos bocados.",
      "Refoga a cebola, o alho e a cenoura no azeite e junta o caldo das carnes.",
      "Junta a batata aos cubos e a couve em tiras (10 min), depois a massa e o grão (10 min).",
      "Volta a pôr as carnes e deixa apurar. Deve ficar caldoso.",
    ],
  },
  {
    id: "massa-bacon-ervilhas", nome: "Massa com bacon, ervilhas e natas", emoji: "🍝", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: ["familia", "takeaway"],
    ing: [["esparguete", 400], ["bacon", 150], ["ervilhas", 200], ["natas", 200], ["queijo-ralado", 60], ["cebola", 1], ["alho", 2], ["azeite", 1], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze o esparguete em água com sal (10 min); junta as ervilhas nos últimos 3.",
      "Aloura o bacon numa frigideira sem gordura e junta a cebola e o alho (5 min).",
      "Junta as natas e deixa ferver um pouco.",
      "Envolve a massa e as ervilhas no molho, com o queijo e pimenta.",
    ],
  },
  {
    id: "ovos-rotos", nome: "Ovos rotos com batata e chouriço", emoji: "🍳", tipo: "prato",
    custo: 1, tempoMin: 40, equip: ["fogao", ["forno", "airfryer"]], tags: ["takeaway"],
    ing: [["batata", 1000], ["ovo", 6], ["chourico", 0.5], ["cebola", 1], ["azeite", 4], ["sal", 1]],
    passos: [
      "Corta as batatas em palitos grossos, tempera com sal e azeite e assa a 200 °C até ficarem douradas (30 min).",
      "Aloura a cebola e o chouriço às rodelas numa frigideira (6 min).",
      "Estrela os ovos com a gema mole.",
      "Põe os ovos por cima das batatas e do chouriço e rompe-os à mesa.",
    ],
  },

  // ───────────── Sem carne nem peixe ─────────────
  {
    id: "caril-lentilhas", nome: "Caril de lentilhas com espinafres", emoji: "🍛", tipo: "prato",
    custo: 1, tempoMin: 35, equip: ["fogao"], tags: ["conforto"],
    ing: [["lentilhas", 300], ["cebola", 1], ["alho", 3], ["polpa", 1], ["caril", 2], ["cominhos", 1], ["espinafres", 200], ["arroz", 300], ["azeite", 2], ["sal", 1]],
    passos: [
      "Coze o arroz (18 min).",
      "Refoga a cebola e o alho no azeite (5 min) e junta o caril e os cominhos.",
      "Junta as lentilhas, a polpa e 800 ml de água e coze em lume brando até ficarem macias (25 min).",
      "Junta os espinafres no fim, até murcharem. Serve com o arroz.",
    ],
  },
  {
    id: "bolonhesa-lentilhas", nome: "Esparguete à bolonhesa de lentilhas", emoji: "🍝", tipo: "prato",
    custo: 1, tempoMin: 40, equip: ["fogao"], tags: ["familia"],
    ing: [["esparguete", 400], ["lentilhas", 200], ["cenoura", 2], ["cebola", 1], ["alho", 2], ["polpa", 1], ["oregaos", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Refoga a cebola, o alho e a cenoura ralada no azeite (6 min).",
      "Junta as lentilhas, a polpa, os orégãos e 600 ml de água e coze em lume brando (25 min).",
      "Coze o esparguete em água com sal (10 min).",
      "Serve o esparguete com o molho por cima.",
    ],
  },
  {
    id: "curgetes-recheadas", nome: "Curgetes recheadas com grão e queijo", emoji: "🥒", tipo: "prato",
    custo: 1, tempoMin: 45, equip: ["fogao", "forno"], tags: [],
    ing: [["curgete", 4], ["grao", 2], ["tomate", 2], ["cebola", 1], ["alho", 2], ["queijo-ralado", 80], ["azeite", 2], ["sal", 1]],
    passos: [
      "Corta as curgetes ao comprido e tira a polpa com uma colher.",
      "Refoga a cebola e o alho, junta a polpa da curgete picada, o tomate e o grão esmagado grosseiramente (10 min).",
      "Recheia as curgetes e cobre com queijo.",
      "Forno a 200 °C (25 min).",
    ],
  },
  {
    id: "couve-flor-gratinada", nome: "Couve-flor gratinada com ovo", emoji: "🥦", tipo: "prato",
    custo: 1, tempoMin: 45, equip: ["fogao", "forno"], tags: ["familia", "conforto"],
    ing: [["couve-flor", 800], ["ovo", 4], ["leite", 500], ["farinha", 40], ["manteiga", 40], ["queijo-ralado", 100], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze a couve-flor em raminhos (8 min) e os ovos (10 min).",
      "Faz o molho: derrete a manteiga, junta a farinha e depois o leite aos poucos, a mexer até engrossar. Tempera.",
      "Num pirex, a couve-flor e os ovos às rodelas, cobertos com o molho e o queijo.",
      "Gratina a 210 °C (20 min).",
    ],
  },
  {
    id: "feijoada-legumes", nome: "Feijoada de legumes", emoji: "🫘", tipo: "prato",
    custo: 1, tempoMin: 45, equip: ["fogao"], tags: ["conforto"],
    ing: [["feijao", 3], ["cenoura", 2], ["abobora", 300], ["couve", 200], ["cebola", 1], ["alho", 3], ["polpa", 1], ["colorau", 1], ["louro", 1], ["arroz", 300], ["azeite", 3], ["sal", 1]],
    passos: [
      "Coze o arroz (18 min).",
      "Refoga a cebola, o alho e o louro no azeite (5 min) com o colorau.",
      "Junta a cenoura e a abóbora aos cubos, a polpa e um copo de água (15 min).",
      "Junta o feijão com um pouco do líquido e a couve em tiras (10 min). Serve com o arroz.",
    ],
  },
  {
    id: "shakshuka", nome: "Ovos escalfados em molho de tomate e pimento", emoji: "🍳", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: [],
    ing: [["ovo", 8], ["polpa", 2], ["pimento", 2], ["cebola", 1], ["alho", 3], ["cominhos", 1], ["colorau", 1], ["coentros", 0.5], ["pao", 4], ["azeite", 3], ["sal", 1]],
    passos: [
      "Refoga a cebola, o alho e os pimentos às tiras no azeite (8 min).",
      "Junta os cominhos, o colorau e a polpa e deixa apurar (10 min).",
      "Faz covas no molho, parte lá os ovos e tapa até as claras ficarem firmes (8 min).",
      "Coentros por cima; serve com o pão para molhar.",
    ],
  },
  {
    id: "massa-cogumelos-natas", nome: "Massa com cogumelos e natas", emoji: "🍄", tipo: "prato",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: [],
    ing: [["massa", 400], ["cogumelos", 400], ["natas", 200], ["cebola", 1], ["alho", 3], ["queijo-ralado", 50], ["salsa", 0.5], ["azeite", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze a massa em água com sal (11 min).",
      "Salteia os cogumelos laminados em lume forte com o azeite, a cebola e o alho (8 min).",
      "Junta as natas e deixa reduzir um pouco (3 min).",
      "Envolve a massa, o queijo e a salsa. Tempera com pimenta.",
    ],
  },
  {
    id: "esparguete-requeijao", nome: "Esparguete com requeijão e espinafres", emoji: "🍝", tipo: "prato",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: [],
    ing: [["esparguete", 400], ["requeijao", 1], ["espinafres", 300], ["alho", 3], ["limao", 0.5], ["queijo-ralado", 40], ["azeite", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Coze o esparguete em água com sal (10 min). Guarda um copo da água da cozedura.",
      "Salteia o alho e os espinafres no azeite até murcharem (3 min).",
      "Junta o requeijão desfeito, a raspa de limão e um pouco da água da massa, até ficar cremoso.",
      "Envolve o esparguete e o queijo e tempera com pimenta.",
    ],
  },
  {
    id: "arroz-salteado", nome: "Arroz salteado com legumes e ovo", emoji: "🍚", tipo: "prato",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["takeaway", "familia"],
    ing: [["arroz", 300], ["ovo", 4], ["ervilhas", 200], ["cenoura", 2], ["cebola", 1], ["milho", 1], ["alho", 2], ["oleo", 3], ["sal", 1]],
    passos: [
      "Coze o arroz (18 min) e deixa arrefecer espalhado num tabuleiro. Com arroz da véspera fica ainda melhor.",
      "Numa frigideira grande, salteia a cebola, o alho e a cenoura aos cubinhos no óleo em lume forte (5 min).",
      "Junta as ervilhas e o milho (3 min), afasta para o lado e mexe lá os ovos batidos.",
      "Junta o arroz e salteia tudo junto (5 min).",
    ],
  },
];
