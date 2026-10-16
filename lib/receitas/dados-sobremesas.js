/*
 * Sobremesas — doçaria portuguesa de casa e algumas mais leves.
 * As receitas com ovo cru têm `ovoCru: true`: a app avisa (ovos
 * pasteurizados; não para grávidas, crianças pequenas, idosos ou defesas
 * baixas) e a restrição "Sem ovo cru" tira-as. Das três mais conhecidas
 * (mousse, salame, bolo de bolacha) há também versão sem ovo.
 */

export const SOBREMESAS = [
  {
    id: "arroz-doce", nome: "Arroz-doce", emoji: "🍚", tipo: "sobremesa",
    custo: 1, tempoMin: 50, equip: ["fogao"], tags: ["conforto", "familia"],
    porcoes: 8, un: "taças",
    ing: [["arroz", 200], ["leite", 1000], ["acucar", 150], ["gema", 3], ["limao", 1], ["manteiga", 20], ["canela", 1], ["sal", 1]],
    passos: [
      "Coze o arroz em 400 ml de água com a casca do limão e uma pitada de sal até a água quase desaparecer (10 min).",
      "Junta o leite quente aos poucos, mexendo, em lume brando, até o arroz ficar cremoso (30 min).",
      "Fora do lume, junta o açúcar, a manteiga e as gemas desfeitas num pouco de leite; volta ao lume só até engrossar (2 min).",
      "Deita em taças e enfeita com canela.",
    ],
  },
  {
    id: "arroz-doce-robo", nome: "Arroz-doce no robô de cozinha", emoji: "🍚", tipo: "sobremesa",
    custo: 1, tempoMin: 50, equip: ["robo"], tags: ["conforto", "familia"],
    porcoes: 8, un: "taças",
    ing: [["arroz", 200], ["leite", 1000], ["acucar", 150], ["gema", 3], ["limao", 1], ["canela", 1], ["sal", 1]],
    passos: [
      "Põe no copo o leite, a casca do limão e o sal: 90 °C, velocidade de colher, rotação inversa (8 min).",
      "Junta o arroz: 90 °C, rotação inversa, velocidade de colher (35 min).",
      "Junta o açúcar e as gemas: 90 °C, rotação inversa (3 min).",
      "Deita em taças e enfeita com canela.",
    ],
  },
  {
    id: "leite-creme", nome: "Leite-creme queimado", emoji: "🍮", tipo: "sobremesa",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["conforto"],
    porcoes: 6, un: "taças",
    ing: [["leite", 750], ["gema", 5], ["acucar", 180], ["farinha", 35], ["limao", 1], ["canela", 1]],
    passos: [
      "Aquece o leite com a casca do limão e um pau de canela.",
      "Mistura as gemas, 130 g de açúcar e a farinha; junta o leite quente aos poucos, sempre a mexer.",
      "Volta ao lume brando, sempre a mexer, até engrossar (8 min). Deita em pratinhos.",
      "Já frio, polvilha com o resto do açúcar e queima com o ferro ou maçarico.",
    ],
  },
  {
    id: "aletria", nome: "Aletria", emoji: "🥣", tipo: "sobremesa",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["conforto"],
    porcoes: 8, un: "taças",
    ing: [["aletria", 250], ["leite", 1000], ["acucar", 150], ["gema", 3], ["manteiga", 20], ["limao", 1], ["canela", 1], ["sal", 1]],
    passos: [
      "Ferve 500 ml de água com sal, a casca do limão e a manteiga; junta a aletria (3 min).",
      "Junta o leite quente e o açúcar e coze em lume brando, mexendo (10 min).",
      "Fora do lume, junta as gemas desfeitas num pouco de leite; volta ao lume só até engrossar (2 min).",
      "Deita numa travessa e desenha com canela.",
    ],
  },
  {
    id: "pudim-flan", nome: "Pudim flan caseiro", emoji: "🍮", tipo: "sobremesa",
    custo: 1, tempoMin: 70, equip: [["forno", "panela-pressao"]], tags: ["familia"],
    porcoes: 8, un: "fatias",
    ing: [["ovo", 6], ["leite", 750], ["acucar", 220], ["limao", 1]],
    passos: [
      "Faz um caramelo com 100 g de açúcar e forra a forma de pudim.",
      "Bate os ovos com o resto do açúcar, junta o leite e raspa de limão, e passa por um passador para a forma.",
      "Forno em banho-maria a 180 °C (50 min). Panela de pressão: forma tapada com alumínio sobre 2 dedos de água (15 min após a pressão).",
      "Deixa arrefecer e vai ao frigorífico (pelo menos 4 h) antes de desenformar.",
    ],
  },
  {
    id: "bolo-iogurte", nome: "Bolo de iogurte", emoji: "🍰", tipo: "sobremesa",
    custo: 1, tempoMin: 50, equip: [["forno", "airfryer"]], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["iogurte", 1], ["acucar", 250], ["farinha", 250], ["oleo", 7], ["ovo", 3], ["fermento-po", 3], ["limao", 1]],
    passos: [
      "Usa o copo do iogurte como medida: 1 iogurte, 2 copos de açúcar, 3 de farinha e 1 de óleo.",
      "Bate os ovos com o açúcar, junta o iogurte, o óleo e a raspa do limão.",
      "Envolve a farinha com o fermento e deita numa forma untada.",
      "Forno a 180 °C (35 min) ou air fryer a 160 °C (30 min). Teste do palito.",
    ],
  },
  {
    id: "pao-de-lo", nome: "Pão de ló", emoji: "🍰", tipo: "sobremesa",
    custo: 1, tempoMin: 50, equip: [["batedeira", "robo"], "forno"], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["ovo", 6], ["acucar", 200], ["farinha", 150]],
    passos: [
      "Na batedeira, bate os ovos inteiros com o açúcar em velocidade alta até triplicarem e ficarem esbranquiçados (10 min).",
      "Envolve a farinha peneirada à mão, devagar, para não tirar o ar.",
      "Deita numa forma forrada com papel vegetal.",
      "Forno a 180 °C, sem abrir a porta (30 min).",
    ],
  },
  {
    id: "bolo-laranja", nome: "Bolo de laranja (com a laranja inteira)", emoji: "🍊", tipo: "sobremesa",
    custo: 1, tempoMin: 55, equip: [["liquidificadora", "robo", "processador", "varinha"], ["forno", "airfryer"]], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["laranja", 2], ["ovo", 4], ["acucar", 250], ["farinha", 250], ["oleo", 8], ["fermento-po", 3]],
    passos: [
      "Lava bem as laranjas, corta-as em pedaços e tira as sementes — vão com casca.",
      "Tritura as laranjas com os ovos, o açúcar e o óleo até ficar liso.",
      "Junta a farinha e o fermento e envolve; deita numa forma untada.",
      "Forno a 180 °C (40 min) ou air fryer a 160 °C (35 min).",
    ],
  },
  {
    id: "bolo-caneca", nome: "Bolo de chocolate na caneca", emoji: "☕", tipo: "sobremesa",
    custo: 1, tempoMin: 10, equip: ["microondas"], tags: ["familia"],
    porcoes: 4, un: "canecas",
    ing: [["farinha", 120], ["acucar", 100], ["cacau", 6], ["ovo", 4], ["leite", 120], ["oleo", 4], ["fermento-po", 1]],
    passos: [
      "Em cada caneca, mistura 3 colheres de farinha, 2 de açúcar e 1½ de cacau, com uma pitada de fermento.",
      "Junta 1 ovo, 2 colheres de leite e 1 de óleo e mexe bem com um garfo.",
      "Micro-ondas na potência máxima, uma caneca de cada vez (90 s).",
      "Deixa arrefecer um minuto — sai muito quente.",
    ],
  },
  {
    id: "maca-assada", nome: "Maçã assada com canela", emoji: "🍎", tipo: "sobremesa",
    custo: 1, tempoMin: 35, equip: [["forno", "airfryer", "microondas"]], tags: ["conforto"],
    ing: [["maca", 4], ["canela", 1], ["mel", 2], ["manteiga", 20], ["frutos-secos", 30]],
    passos: [
      "Tira o caroço às maçãs sem as atravessar e dá-lhes um golpe à volta.",
      "Recheia com os frutos secos, a manteiga, o mel e a canela.",
      "Forno a 190 °C (30 min), air fryer a 170 °C (18 min) ou micro-ondas tapadas (6 min).",
      "Serve mornas, com o molho que fica no fundo.",
    ],
  },
  {
    id: "crumble-maca", nome: "Crumble de maçã e canela", emoji: "🥧", tipo: "sobremesa",
    custo: 1, tempoMin: 40, equip: [["forno", "airfryer"]], tags: ["conforto", "familia"],
    porcoes: 6, un: "porções",
    ing: [["maca", 4], ["aveia", 80], ["farinha", 60], ["manteiga", 70], ["acucar", 70], ["canela", 1], ["limao", 0.5]],
    passos: [
      "Corta as maçãs em cubos e envolve com limão, metade da canela e 20 g de açúcar; põe num pirex.",
      "Esfarela com os dedos a aveia, a farinha, a manteiga fria, o resto do açúcar e da canela.",
      "Espalha por cima da maçã.",
      "Forno a 190 °C (30 min) ou air fryer a 170 °C (20 min), até dourar.",
    ],
  },
  {
    id: "mousse-chocolate", nome: "Mousse de chocolate (sem ovo cru)", emoji: "🍫", tipo: "sobremesa",
    custo: 2, tempoMin: 20, equip: [["batedeira", "robo"], ["fogao", "microondas"]], tags: ["familia"],
    porcoes: 6, un: "taças",
    ing: [["chocolate", 200], ["natas", 400], ["acucar", 20]],
    passos: [
      "Derrete o chocolate com 100 ml de natas, em banho-maria ou no micro-ondas em intervalos de 30 s; deixa amornar.",
      "Bate as restantes natas bem frias com o açúcar, na batedeira, até ficarem firmes (3 min).",
      "Envolve as natas batidas no chocolate, em três vezes, com movimentos suaves.",
      "Divide por taças e leva ao frigorífico (pelo menos 3 h).",
    ],
  },
  {
    id: "suspiros", nome: "Suspiros", emoji: "☁️", tipo: "sobremesa",
    custo: 1, tempoMin: 100, equip: [["batedeira", "robo"], "forno"], tags: ["familia"],
    porcoes: 10, un: "porções",
    ing: [["clara", 4], ["acucar", 240], ["limao", 0.25]],
    passos: [
      "Na batedeira, bate as claras com umas gotas de limão até ficarem em castelo.",
      "Junta o açúcar aos poucos, sem parar de bater, até ficar brilhante e firme (8 min).",
      "Faz montinhos num tabuleiro com papel vegetal.",
      "Forno a 100 °C, com a porta entreaberta, até secarem (90 min). Usa as gemas no leite-creme.",
    ],
  },
  {
    id: "salada-fruta", nome: "Salada de fruta da época", emoji: "🍉", tipo: "sobremesa",
    custo: 1, tempoMin: 15, equip: [], tags: ["familia"],
    porcoes: 6, un: "taças",
    ing: [["laranja", 3], ["maca", 2], ["banana", 2], ["kiwi", 2], ["morangos", 200], ["hortela", 0.25]],
    passos: [
      "Espreme uma das laranjas para uma taça — o sumo evita que a fruta escureça.",
      "Corta a restante fruta em cubos pequenos e junta ao sumo.",
      "Mistura e deixa no frigorífico (20 min).",
      "Serve com folhas de hortelã. Troca a fruta pela que estiver mais barata na época.",
    ],
  },
  {
    id: "gelado-banana", nome: "Gelado de banana e cacau (sem açúcar)", emoji: "🍨", tipo: "sobremesa",
    custo: 1, tempoMin: 10, equip: [["processador", "robo", "liquidificadora"]], tags: ["familia"],
    ing: [["banana", 5], ["cacau", 2], ["frutos-secos", 20]],
    passos: [
      "Na véspera, corta as bananas maduras às rodelas e congela-as.",
      "Tritura as rodelas congeladas com o cacau, raspando as paredes, até ficar cremoso (3 min).",
      "Serve logo como gelado mole, ou leva ao congelador (1 h) para ficar firme.",
      "Polvilha com frutos secos picados.",
    ],
  },
  {
    id: "rabanadas", nome: "Rabanadas", emoji: "🍞", tipo: "sobremesa",
    custo: 1, tempoMin: 35, equip: [["fritadeira", "fogao"]], tags: ["conforto", "familia"],
    porcoes: 8, un: "porções",
    ing: [["baguete", 1], ["leite", 500], ["ovo", 3], ["acucar", 100], ["canela", 2], ["limao", 1], ["oleo", 6]],
    passos: [
      "Ferve o leite com a casca do limão e 30 g de açúcar; deixa amornar.",
      "Corta o pão (de véspera) em fatias grossas, passa pelo leite e depois pelos ovos batidos.",
      "Frita em óleo quente (fritadeira a 170 °C ou frigideira) até dourarem (2 min de cada lado).",
      "Escorre e passa pelo resto do açúcar misturado com a canela.",
    ],
  },
  {
    id: "peras-bebadas", nome: "Peras bêbadas", emoji: "🍐", tipo: "sobremesa",
    custo: 2, tempoMin: 40, equip: ["fogao"], tags: ["conforto"],
    ing: [["pera", 4], ["vinho-tinto", 500], ["acucar", 100], ["canela", 1], ["laranja", 1]],
    passos: [
      "Descasca as peras, deixando o pé.",
      "Ferve o vinho com o açúcar, a canela e a casca da laranja.",
      "Coze as peras de pé no vinho, tapadas, regando de vez em quando (25 min).",
      "Tira as peras e reduz o molho até ficar em xarope (10 min). Serve com o molho por cima.",
    ],
  },
  {
    id: "salame-chocolate", nome: "Salame de chocolate (sem ovo)", emoji: "🍫", tipo: "sobremesa",
    custo: 1, tempoMin: 20, equip: [["fogao", "microondas"]], tags: ["familia"],
    porcoes: 12, un: "fatias",
    ing: [["bolacha-maria", 200], ["chocolate", 150], ["manteiga", 100], ["acucar", 50], ["leite", 50]],
    passos: [
      "Parte as bolachas em pedaços pequenos (não em pó).",
      "Derrete o chocolate com a manteiga, o açúcar e o leite (lume brando ou micro-ondas aos 30 s).",
      "Envolve as bolachas no chocolate e enrola em película aderente, em forma de salame.",
      "Frigorífico (pelo menos 4 h) e corta às rodelas.",
    ],
  },
  {
    id: "bolo-bolacha", nome: "Bolo de bolacha (sem ovo)", emoji: "🎂", tipo: "sobremesa",
    custo: 1, tempoMin: 30, equip: [["batedeira", "robo"]], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["bolacha-maria", 400], ["manteiga", 200], ["acucar", 150], ["cafe", 300]],
    passos: [
      "Na batedeira, bate a manteiga amolecida com o açúcar até ficar um creme fofo e esbranquiçado (6 min).",
      "Passa cada bolacha rapidamente pelo café frio.",
      "Monta camadas de bolacha e creme num prato, terminando em creme.",
      "Polvilha com bolacha ralada e leva ao frigorífico (pelo menos 4 h).",
    ],
  },
  {
    id: "crepes", nome: "Crepes com compota", emoji: "🫓", tipo: "sobremesa",
    custo: 1, tempoMin: 30, equip: ["fogao"], tags: ["familia"],
    ing: [["farinha", 125], ["leite", 300], ["ovo", 2], ["manteiga", 20], ["acucar", 10], ["compota", 6]],
    passos: [
      "Bate a farinha, o leite, os ovos, o açúcar e a manteiga derretida até ficar liso; deixa descansar (10 min).",
      "Numa frigideira antiaderente quente, deita uma concha fina e roda para cobrir o fundo.",
      "Vira quando as bordas soltarem (1 min de cada lado).",
      "Barra com compota e dobra em quatro.",
    ],
  },

  // ───────────── Com ovo cru (versões tradicionais) ─────────────
  {
    id: "mousse-chocolate-tradicional", nome: "Mousse de chocolate tradicional", emoji: "🍫", tipo: "sobremesa",
    custo: 2, tempoMin: 25, equip: [["fogao", "microondas"], ["batedeira", "robo"]], tags: ["familia"], ovoCru: true,
    porcoes: 6, un: "taças",
    ing: [["chocolate", 200], ["ovo", 6], ["manteiga", 50], ["acucar", 60], ["sal", 1]],
    passos: [
      "Derrete o chocolate com a manteiga (banho-maria ou micro-ondas aos 30 s) e deixa amornar.",
      "Separa os ovos. Junta as gemas, uma a uma, ao chocolate morno, mexendo bem.",
      "Na batedeira, bate as claras com uma pitada de sal em castelo; junta o açúcar e bate até ficarem firmes e brilhantes.",
      "Envolve as claras no chocolate em três vezes, com cuidado; divide por taças e frigorífico (pelo menos 4 h).",
    ],
  },
  {
    id: "baba-camelo", nome: "Baba de camelo", emoji: "🍮", tipo: "sobremesa",
    custo: 1, tempoMin: 40, equip: [["panela-pressao", "fogao"], ["batedeira", "robo"]], tags: ["familia"], ovoCru: true,
    porcoes: 8, un: "taças",
    ing: [["leite-condensado", 2], ["ovo", 6], ["frutos-secos", 50]],
    passos: [
      "Coze as latas de leite condensado fechadas, sempre cobertas de água: panela de pressão (30 min) ou tacho (2 h 30). Deixa arrefecer totalmente antes de abrir. Também se vende já cozido (doce de leite).",
      "Separa os ovos e mistura as gemas no doce de leite até ficar liso.",
      "Bate as claras em castelo firme e envolve-as no creme.",
      "Divide por taças, polvilha com frutos secos picados e leva ao frigorífico (pelo menos 3 h).",
    ],
  },
  {
    id: "salame-chocolate-tradicional", nome: "Salame de chocolate tradicional", emoji: "🍫", tipo: "sobremesa",
    custo: 1, tempoMin: 20, equip: [], tags: ["familia"], ovoCru: true,
    porcoes: 12, un: "fatias",
    ing: [["bolacha-maria", 200], ["manteiga", 125], ["acucar", 125], ["ovo", 2], ["cacau", 4]],
    passos: [
      "Bate a manteiga amolecida com o açúcar até ficar cremosa.",
      "Junta os ovos, um a um, e o cacau, batendo sempre.",
      "Envolve as bolachas partidas em pedaços e enrola em película aderente, em forma de salame.",
      "Frigorífico (pelo menos 4 h) e corta às rodelas.",
    ],
  },
  {
    id: "bolo-bolacha-tradicional", nome: "Bolo de bolacha tradicional", emoji: "🎂", tipo: "sobremesa",
    custo: 1, tempoMin: 30, equip: [["batedeira", "robo"]], tags: ["familia"], ovoCru: true,
    porcoes: 10, un: "fatias",
    ing: [["bolacha-maria", 400], ["manteiga", 250], ["acucar", 250], ["gema", 3], ["cafe", 300]],
    passos: [
      "Na batedeira, bate a manteiga amolecida com o açúcar até ficar esbranquiçada (5 min).",
      "Junta as gemas, uma a uma, e bate até o creme ficar fofo (3 min).",
      "Passa cada bolacha rapidamente pelo café frio e monta camadas de bolacha e creme.",
      "Termina com creme, polvilha com bolacha ralada e leva ao frigorífico (pelo menos 4 h).",
    ],
  },
];
