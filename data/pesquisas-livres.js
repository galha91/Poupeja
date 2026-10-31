/*
 * O que as pessoas escrevem à mão na lista de compras (e não só os nomes do
 * catálogo): palavras soltas, singulares, sem acentos, marcas, gíria.
 * A auditoria (scripts/auditar-comparacao.mjs) pesquisa cada uma como a app
 * pesquisa e assinala as que trazem o produto errado.
 * Para acrescentar um caso que falhou, juntar aqui e a tests/relevancia.test.mjs.
 */
export const PESQUISAS_LIVRES = [
  // Palavras soltas (as mais escritas)
  "pão", "leite", "arroz", "massa", "frango", "carne", "peixe", "queijo", "fiambre", "iogurte", "manteiga", "ovos",
  "azeite", "óleo", "açúcar", "sal", "farinha", "café", "chá", "sumo", "água", "cerveja", "vinho", "refrigerante",
  "bolachas", "cereais", "chocolate", "gelado", "batatas", "cebola", "alho", "tomate", "alface", "cenoura", "banana",
  "maçã", "laranja", "limão", "pera", "uvas", "morangos", "melancia", "abacate", "kiwi", "ananás", "pêssego",
  // Carne, peixe, charcutaria
  "hamburguer", "hambúrguer", "hamburger", "bifes", "bife de vaca", "bifanas", "febras", "costeletas", "salsichas",
  "chouriço", "presunto", "bacon", "mortadela", "peru", "carne de vaca", "carne de porco", "peito de peru",
  "atum", "sardinhas", "bacalhau", "salmão", "pescada", "camarão", "lulas", "polvo", "douradinhos", "filetes",
  // Laticínios e ovos
  "iogurtes", "yogurte", "iogurte grego", "leite magro", "leite achocolatado", "leite de coco", "leite condensado",
  "leite em pó", "natas", "chantilly", "queijo ralado", "queijo fresco", "mozzarella", "queijo de cabra",
  "queijo creme", "philadelphia", "requeijão", "ovo", "ovos de codorniz", "bebida de soja", "bebida de aveia",
  "bebida de amêndoa", "danone", "activia", "actimel", "mimosa", "planta",
  // Mercearia
  "esparguete", "massa penne", "massa folhada", "arroz basmati", "arroz agulha", "feijão", "grão de bico",
  "lentilhas", "ervilhas", "milho", "azeitonas", "ketchup", "maionese", "mostarda", "molho de tomate",
  "polpa de tomate", "tomate pelado", "caldo knorr", "sopa", "puré de batata", "pipocas", "amendoins",
  "frutos secos", "manteiga de amendoim", "mel", "compota", "doce", "marmelada", "nutella", "bolo", "bolo rei",
  "croissant", "tostas", "torradas", "wraps", "tortilhas", "pão de forma", "pão integral", "pão ralado", "carcaças",
  "bolacha maria", "cream crackers", "cereais crianças", "corn flakes", "special k", "nesquik", "milo", "aveia",
  "granola", "fermento", "bicarbonato", "vinagre", "especiarias", "pimenta", "orégãos", "colorau", "louro",
  // Bebidas e marcas
  "coca cola", "pepsi", "fanta", "sprite", "7up", "ice tea", "sumol", "compal", "água com gás", "água das pedras",
  "sagres", "super bock", "heineken", "cerveja sem álcool", "vinho tinto", "vinho verde", "espumante", "licor beirão",
  "nespresso", "cápsulas de café", "delta", "nescafé", "café moído", "café em grão", "chá verde", "cevada",
  "red bull", "monster", "sumo de laranja", "sumo de maçã",
  // Snacks e doces
  "batatas fritas", "pringles", "lays", "doritos", "oreo", "kinder", "m&m", "gomas", "rebuçados", "chiclete",
  "bolachas recheadas", "barras de cereais", "bombons", "kit kat", "toblerone",
  // Frutas e legumes (singular, sem acentos)
  "maca", "limao", "ananas", "feijao verde", "couve", "brocolos", "espinafres", "pepino", "pimento", "curgete",
  "beringela", "cogumelos", "cenouras", "batata doce", "cebola roxa", "cebolinho", "salsa", "coentros", "hortelã",
  "frutos vermelhos", "mirtilos", "framboesas", "cerejas", "manga", "meloa", "figos", "romã", "tangerinas",
  "clementinas", "toranja", "lima",
  // Casa, higiene, bebé, animais
  "detergente", "detergente roupa", "detergente loiça", "lava loiça", "amaciador", "lixívia", "papel higiénico",
  "papel de cozinha", "guardanapos", "sacos do lixo", "esponja", "champô", "gel de banho", "sabonete",
  "pasta de dentes", "escova de dentes", "desodorizante", "fraldas", "toalhitas", "algodão", "cotonetes",
  "pensos", "tampões", "protetor solar", "creme", "papa", "leite bebé", "ração cão", "ração gato", "areia gato",
  "pilhas", "lâmpadas", "velas", "pastilhas máquina loiça", "sal máquina loiça", "ajax", "fairy", "skip", "ariel",
  // Erros comuns
  "pao de forma", "acucar", "cafe", "cha", "oleo", "agua", "feijao", "grao", "iogurt", "yogurt natural", "hamburgueres",
];
