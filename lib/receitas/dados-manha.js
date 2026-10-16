/*
 * Pequenos-almoços e lanches — o mesmo formato das receitas de jantar
 * (lib/receitas/dados.js). Quando uma receita não rende "4 pessoas",
 * diz quanto rende: `porcoes` e a unidade `un` ("fatias", "iogurtes"…).
 */

export const MANHA = [
  {
    id: "papas-aveia-banana", nome: "Papas de aveia com banana e canela", emoji: "🥣", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 10, equip: [["fogao", "microondas"]], tags: ["conforto", "familia"],
    ing: [["aveia", 160], ["leite", 800], ["banana", 2], ["canela", 1], ["mel", 2]],
    passos: [
      "Junta a aveia e o leite num tacho (ou numa taça grande, no micro-ondas).",
      "Coze em lume brando, sempre a mexer, até engrossar (5 min). No micro-ondas: potência máxima, mexendo a cada minuto (4 min).",
      "Junta metade da banana esmagada e a canela.",
      "Serve com a outra banana às rodelas e um fio de mel.",
    ],
  },
  {
    id: "aveia-vespera", nome: "Aveia de véspera com iogurte e morangos", emoji: "🍓", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 10, equip: [], tags: [],
    ing: [["aveia", 160], ["iogurte", 4], ["leite", 300], ["morangos", 200], ["mel", 2]],
    passos: [
      "À noite, mistura a aveia, os iogurtes e o leite em 4 frascos.",
      "Tapa e deixa no frigorífico durante a noite — a aveia amolece sozinha.",
      "De manhã, junta os morangos às rodelas.",
      "Termina com um fio de mel. Leva-se no frasco para o trabalho.",
    ],
  },
  {
    id: "panquecas-banana", nome: "Panquecas de banana e aveia", emoji: "🥞", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 20, equip: ["fogao"], tags: ["familia"],
    ing: [["banana", 3], ["ovo", 4], ["aveia", 100], ["canela", 1], ["manteiga", 10], ["mel", 2]],
    passos: [
      "Esmaga as bananas com um garfo e junta os ovos, a aveia e a canela (ou tritura tudo).",
      "Aquece uma frigideira antiaderente com um pouco de manteiga, em lume médio.",
      "Deita colheradas da massa e vira quando aparecerem bolhinhas (2 min de cada lado).",
      "Serve com mel ou fruta.",
    ],
  },
  {
    id: "panquecas-classicas", nome: "Panquecas clássicas", emoji: "🥞", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 25, equip: ["fogao"], tags: ["familia"],
    ing: [["farinha", 200], ["leite", 300], ["ovo", 2], ["acucar", 20], ["fermento-po", 2], ["manteiga", 30], ["mel", 4]],
    passos: [
      "Mistura a farinha, o açúcar e o fermento; junta o leite, os ovos e a manteiga derretida e bate até ficar liso.",
      "Deixa a massa descansar (5 min).",
      "Numa frigideira untada, em lume médio, deita uma concha de massa e vira quando fizer bolhas (2 min de cada lado).",
      "Serve com mel, compota ou fruta.",
    ],
  },
  {
    id: "waffles-aveia", nome: "Waffles de aveia e banana", emoji: "🧇", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 20, equip: ["waffles"], tags: ["familia"],
    ing: [["aveia", 150], ["banana", 2], ["ovo", 2], ["leite", 200], ["fermento-po", 1], ["canela", 1], ["morangos", 200]],
    passos: [
      "Tritura a aveia, as bananas, os ovos, o leite, o fermento e a canela até ficar uma massa lisa.",
      "Aquece a máquina de waffles e unta-a levemente.",
      "Deita a massa e fecha até estarem dourados (4 min).",
      "Serve com morangos.",
    ],
  },
  {
    id: "waffles-classicos", nome: "Waffles clássicos com mirtilos", emoji: "🧇", tipo: "pequeno-almoco",
    custo: 2, tempoMin: 25, equip: ["waffles"], tags: ["familia"],
    ing: [["farinha", 250], ["leite", 400], ["ovo", 2], ["manteiga", 60], ["acucar", 30], ["fermento-po", 2], ["mirtilos", 150]],
    passos: [
      "Mistura a farinha, o açúcar e o fermento.",
      "Junta o leite, os ovos e a manteiga derretida e bate só até misturar.",
      "Coze na máquina de waffles bem quente até dourarem (4 min).",
      "Serve com mirtilos.",
    ],
  },
  {
    id: "ovos-mexidos-torradas", nome: "Ovos mexidos com torradas e tomate", emoji: "🍳", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 10, equip: ["fogao"], tags: ["familia"],
    ing: [["ovo", 8], ["pao-forma", 8], ["manteiga", 15], ["tomate", 2], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Torra o pão (torradeira, forno ou frigideira).",
      "Bate os ovos com sal e pimenta.",
      "Numa frigideira com manteiga, em lume brando, mexe os ovos devagar até ficarem cremosos (3 min).",
      "Serve sobre as torradas com tomate às rodelas.",
    ],
  },
  {
    id: "torradas-queijo-fresco", nome: "Torradas com queijo fresco e compota", emoji: "🍞", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 5, equip: [["torradeira", "forno", "grelhador", "sanduicheira", "fogao"]], tags: ["familia"],
    ing: [["pao-forma", 8], ["queijo-fresco", 1], ["compota", 4]],
    passos: [
      "Torra o pão.",
      "Corta o queijo fresco às fatias.",
      "Põe o queijo sobre as torradas.",
      "Termina com uma colher de compota em cada uma.",
    ],
  },
  {
    id: "torradas-abacate-tomate", nome: "Torradas com abacate e tomate", emoji: "🥑", tipo: "pequeno-almoco",
    custo: 2, tempoMin: 10, equip: [["torradeira", "forno", "grelhador", "sanduicheira", "fogao"]], tags: [],
    ing: [["pao-forma", 8], ["abacate", 2], ["tomate", 2], ["limao", 0.5], ["azeite", 1], ["sal", 1], ["pimenta", 1]],
    passos: [
      "Torra o pão.",
      "Esmaga o abacate com o limão, sal e pimenta.",
      "Barra as torradas e põe o tomate às rodelas por cima.",
      "Um fio de azeite e está pronto.",
    ],
  },
  {
    id: "batido-banana-aveia", nome: "Batido de banana, aveia e canela", emoji: "🥤", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 5, equip: [["liquidificadora", "varinha", "robo"]], tags: ["familia"],
    ing: [["banana", 4], ["aveia", 60], ["leite", 800], ["canela", 1], ["mel", 2]],
    passos: [
      "Descasca as bananas e parte-as em pedaços.",
      "Tritura com a aveia, o leite, a canela e o mel até ficar cremoso (1 min).",
      "Se gostares mais fresco, junta umas pedras de gelo.",
      "Serve logo.",
    ],
  },
  {
    id: "batido-frutos-vermelhos", nome: "Batido de frutos vermelhos (vegano)", emoji: "🫐", tipo: "pequeno-almoco",
    custo: 2, tempoMin: 5, equip: [["liquidificadora", "varinha", "robo"]], tags: [],
    ing: [["morangos", 300], ["mirtilos", 125], ["banana", 2], ["bebida-vegetal", 600]],
    passos: [
      "Lava os morangos e tira-lhes o pé.",
      "Tritura tudo com a bebida vegetal até ficar liso (1 min).",
      "Prova: se precisar, junta mais banana para adoçar.",
      "Serve fresco.",
    ],
  },
  {
    id: "granola-caseira", nome: "Granola caseira", emoji: "🥜", tipo: "pequeno-almoco",
    custo: 2, tempoMin: 30, equip: [["forno", "airfryer"]], tags: [],
    porcoes: 10, un: "porções",
    ing: [["aveia", 300], ["frutos-secos", 100], ["mel", 4], ["oleo", 2], ["canela", 1]],
    passos: [
      "Mistura a aveia, os frutos secos picados e a canela.",
      "Junta o mel e o óleo aquecidos e envolve bem.",
      "Espalha num tabuleiro com papel vegetal e leva ao forno a 160 °C, mexendo a meio (20 min). Air fryer: 150 °C, mexendo de 4 em 4 min (12 min).",
      "Deixa arrefecer — fica crocante — e guarda num frasco fechado até 2 semanas.",
    ],
  },
  {
    id: "taca-iogurte-fruta", nome: "Taça de iogurte grego com fruta e frutos secos", emoji: "🥝", tipo: "pequeno-almoco",
    custo: 2, tempoMin: 5, equip: [], tags: [],
    ing: [["iogurte-grego", 4], ["kiwi", 2], ["banana", 1], ["aveia", 60], ["frutos-secos", 40], ["mel", 2]],
    passos: [
      "Põe um iogurte grego em cada taça.",
      "Junta o kiwi e a banana às rodelas.",
      "Polvilha com aveia e frutos secos picados.",
      "Termina com um fio de mel.",
    ],
  },
  {
    id: "muffins-banana-aveia", nome: "Muffins de banana e aveia", emoji: "🧁", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 30, equip: [["forno", "airfryer"]], tags: ["familia"],
    porcoes: 12, un: "muffins",
    ing: [["banana", 3], ["ovo", 2], ["aveia", 200], ["leite", 150], ["mel", 3], ["fermento-po", 2], ["canela", 1], ["oleo", 3]],
    passos: [
      "Esmaga as bananas e mistura com os ovos, o leite, o mel e o óleo.",
      "Junta a aveia, o fermento e a canela.",
      "Distribui por 12 forminhas de muffin.",
      "Forno a 180 °C (20 min) ou air fryer a 160 °C, em duas vezes (12 min cada).",
    ],
  },
  {
    id: "bolo-banana", nome: "Bolo de banana", emoji: "🍌", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 55, equip: [["forno", "airfryer"]], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["banana", 3], ["ovo", 3], ["farinha", 200], ["acucar", 100], ["oleo", 6], ["fermento-po", 2], ["canela", 1]],
    passos: [
      "Esmaga as bananas bem maduras e bate com os ovos, o açúcar e o óleo.",
      "Junta a farinha, o fermento e a canela e mistura só até envolver.",
      "Deita numa forma de bolo inglês untada.",
      "Forno a 180 °C (45 min) ou air fryer a 160 °C (35 min). Faz o teste do palito.",
    ],
  },
  {
    id: "pao-maquina", nome: "Pão caseiro na máquina de pão", emoji: "🍞", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 180, equip: ["maquina-pao"], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["farinha", 500], ["fermento-padeiro", 1], ["azeite", 2], ["acucar", 10], ["sal", 1]],
    passos: [
      "Põe na cuba, por esta ordem: 320 ml de água morna, o azeite, o sal e o açúcar.",
      "Cobre com a farinha e faz uma covinha no topo para o fermento (não pode tocar no sal nem na água).",
      "Escolhe o programa básico, pão de 750 g, crosta média, e liga (3 h).",
      "Desenforma e deixa arrefecer numa grelha antes de cortar.",
    ],
  },
  {
    id: "pao-leite-maquina", nome: "Pão de leite na máquina de pão", emoji: "🥐", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 180, equip: ["maquina-pao"], tags: ["familia"],
    porcoes: 10, un: "fatias",
    ing: [["farinha", 500], ["leite", 250], ["manteiga", 50], ["acucar", 50], ["ovo", 1], ["fermento-padeiro", 1], ["sal", 1]],
    passos: [
      "Põe na cuba o leite morno, o ovo, a manteiga amolecida, o açúcar e o sal.",
      "Cobre com a farinha e põe o fermento numa covinha no topo.",
      "Programa doce (ou básico), crosta clara (3 h).",
      "Deixa arrefecer. Fica fofo para torradas e sandes durante 3 dias.",
    ],
  },
  {
    id: "pao-forno", nome: "Pão rústico no forno", emoji: "🥖", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 150, equip: ["forno"], tags: [],
    porcoes: 10, un: "fatias",
    ing: [["farinha", 500], ["fermento-padeiro", 1], ["azeite", 2], ["sal", 1]],
    passos: [
      "Mistura a farinha, o fermento e o sal; junta 350 ml de água morna e o azeite e amassa 10 minutos (à mão, na batedeira com gancho ou no robô).",
      "Tapa e deixa levedar em sítio morno até dobrar (90 min).",
      "Molda o pão, faz um golpe por cima e deixa descansar enquanto aquece o forno a 230 °C.",
      "Coze com uma taça de água no fundo do forno (30 min).",
    ],
  },
  {
    id: "iogurte-caseiro", nome: "Iogurte natural caseiro", emoji: "🥛", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 600, equip: ["iogurteira"], tags: ["familia"],
    porcoes: 8, un: "iogurtes",
    ing: [["leite", 1000], ["iogurte", 1]],
    passos: [
      "Aquece o leite até ficar morno (cerca de 40 °C — consegues manter o dedo lá dentro).",
      "Mistura bem o iogurte natural com um pouco do leite e depois com o resto.",
      "Distribui pelos frascos, sem tampa, e liga a iogurteira (8 a 10 h).",
      "Tapa e leva ao frigorífico pelo menos 4 h. Guarda um para o próximo lote.",
    ],
  },
  {
    id: "iogurte-grego-caseiro", nome: "Iogurte grego caseiro", emoji: "🥛", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 720, equip: ["iogurteira"], tags: [],
    porcoes: 5, un: "taças",
    ing: [["leite", 1000], ["natas", 100], ["iogurte", 1]],
    passos: [
      "Aquece o leite com as natas até ficar morno (40 °C).",
      "Mistura o iogurte e põe na iogurteira (10 h).",
      "Escorre num coador forrado com um pano limpo, no frigorífico (2 h) — fica espesso.",
      "Serve com mel e fruta. O soro que escorre serve para fazer pão.",
    ],
  },
  {
    id: "iogurte-morango-caseiro", nome: "Iogurte de morango caseiro", emoji: "🍓", tipo: "pequeno-almoco",
    custo: 1, tempoMin: 600, equip: ["iogurteira"], tags: ["familia"],
    porcoes: 8, un: "iogurtes",
    ing: [["leite", 1000], ["iogurte", 1], ["morangos", 200], ["acucar", 40]],
    passos: [
      "Esmaga os morangos com o açúcar e divide pelo fundo dos frascos.",
      "Aquece o leite até morno (40 °C) e mistura o iogurte.",
      "Deita por cima da fruta e liga a iogurteira (8 a 10 h).",
      "Frigorífico pelo menos 4 h antes de comer.",
    ],
  },
];
