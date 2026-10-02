/*
 * Catálogo da lista de compras: nomes de artigos que as lojas reconhecem,
 * agrupados por categoria (a ordem é a de um supermercado, mais ou menos).
 *
 * O ecrã da lista já não mostra emojis. O campo `emoji` continua aqui só
 * para os artigos manterem o mesmo formato no localStorage e na lista
 * partilhada (a página /lista/[id] ainda o usa).
 *
 * Usado pelo autocomplete da lista e pelas sugestões do "Comparar preços".
 */

export const CATS = {
  "Frutas": {
    items: [
      { nome: "Maçãs", emoji: "🍎" }, { nome: "Bananas", emoji: "🍌" },
      { nome: "Laranjas", emoji: "🍊" }, { nome: "Morangos", emoji: "🍓" },
      { nome: "Uvas", emoji: "🍇" }, { nome: "Pêras", emoji: "🍐" },
      { nome: "Melão", emoji: "🍈" }, { nome: "Limões", emoji: "🍋" },
      { nome: "Kiwi", emoji: "🥝" }, { nome: "Ananás", emoji: "🍍" },
      { nome: "Manga", emoji: "🥭" }, { nome: "Cerejas", emoji: "🍒" },
      { nome: "Pêssegos", emoji: "🍑" }, { nome: "Ameixas", emoji: "" },
      { nome: "Melancia", emoji: "🍉" }, { nome: "Figos", emoji: "" },
      { nome: "Framboesas", emoji: "" }, { nome: "Mirtilos", emoji: "🫐" },
      { nome: "Tangerinas", emoji: "🍊" }, { nome: "Amoras", emoji: "" },
      { nome: "Toranja", emoji: "🍊" }, { nome: "Papaia", emoji: "" },
      { nome: "Coco", emoji: "🥥" }, { nome: "Abacate", emoji: "🥑" },
    ],
  },
  "Legumes": {
    items: [
      { nome: "Tomates", emoji: "🍅" }, { nome: "Alface", emoji: "🥬" },
      { nome: "Cenouras", emoji: "🥕" }, { nome: "Cebolas", emoji: "🧅" },
      { nome: "Alho", emoji: "🧄" }, { nome: "Batatas", emoji: "🥔" },
      { nome: "Bróculos", emoji: "🥦" }, { nome: "Pepinos", emoji: "🥒" },
      { nome: "Pimentos", emoji: "🫑" }, { nome: "Couve", emoji: "🥬" },
      { nome: "Espinafres", emoji: "🥬" }, { nome: "Cogumelos", emoji: "🍄" },
      { nome: "Beringela", emoji: "🍆" }, { nome: "Malagueta", emoji: "🌶️" },
      { nome: "Beterraba", emoji: "" }, { nome: "Nabo", emoji: "" },
      { nome: "Ervilhas", emoji: "🫛" }, { nome: "Feijão verde", emoji: "🫛" },
      { nome: "Milho", emoji: "🌽" }, { nome: "Courgette", emoji: "🥒" },
      { nome: "Salsa", emoji: "🌿" }, { nome: "Coentros", emoji: "🌿" },
      { nome: "Hortelã", emoji: "🌿" }, { nome: "Louro", emoji: "🌿" },
      { nome: "Cebola roxa", emoji: "🧅" }, { nome: "Alho francês", emoji: "🥬" },
      { nome: "Aipo", emoji: "🥬" }, { nome: "Grelos", emoji: "🥬" },
    ],
  },
  "Laticínios & Ovos": {
    items: [
      { nome: "Leite meio-gordo", emoji: "🥛" }, { nome: "Leite gordo", emoji: "🥛" },
      { nome: "Iogurte natural", emoji: "🫙" }, { nome: "Iogurte grego", emoji: "🫙" },
      { nome: "Iogurte de fruta", emoji: "🫙" }, { nome: "Queijo flamengo", emoji: "🧀" },
      { nome: "Queijo fresco", emoji: "🧀" }, { nome: "Queijo parmesão", emoji: "🧀" },
      { nome: "Manteiga", emoji: "🧈" }, { nome: "Natas", emoji: "🥛" },
      { nome: "Ovos", emoji: "🥚" }, { nome: "Requeijão", emoji: "🧀" },
      { nome: "Mozarela", emoji: "🧀" }, { nome: "Queijo para barrar", emoji: "🧀" },
      { nome: "Creme fraîche", emoji: "🥛" }, { nome: "Kefir", emoji: "🥛" },
      { nome: "Queijo da Serra", emoji: "🧀" }, { nome: "Queijo azul", emoji: "🧀" },
    ],
  },
  "Padaria": {
    items: [
      { nome: "Pão de trigo", emoji: "🍞" }, { nome: "Pão de forma", emoji: "🍞" },
      { nome: "Pão integral", emoji: "🍞" }, { nome: "Baguete", emoji: "🥖" },
      { nome: "Croissant", emoji: "🥐" }, { nome: "Tostas", emoji: "🍞" },
      { nome: "Bolacha Maria", emoji: "🍪" }, { nome: "Bolacha torrada", emoji: "🍪" },
      { nome: "Bolos", emoji: "🧁" }, { nome: "Pão de leite", emoji: "🍞" },
      { nome: "Tarte", emoji: "🥧" }, { nome: "Pastel de nata", emoji: "🥧" },
      { nome: "Broa", emoji: "🍞" }, { nome: "Papo-seco", emoji: "🥖" },
      { nome: "Pão de centeio", emoji: "🍞" }, { nome: "Muffins", emoji: "🧁" },
      { nome: "Granola", emoji: "🌾" },
    ],
  },
  "Carnes": {
    items: [
      { nome: "Frango inteiro", emoji: "🍗" }, { nome: "Peito de frango", emoji: "🍗" },
      { nome: "Coxa de frango", emoji: "🍗" }, { nome: "Carne picada", emoji: "🥩" },
      { nome: "Bifes de vaca", emoji: "🥩" }, { nome: "Costeletas de porco", emoji: "🥩" },
      { nome: "Lombo de porco", emoji: "🥩" }, { nome: "Entrecosto", emoji: "🥩" },
      { nome: "Cordeiro", emoji: "🍖" }, { nome: "Vitela", emoji: "🥩" },
      { nome: "Presunto", emoji: "🥓" }, { nome: "Fiambre", emoji: "🍖" },
      { nome: "Chouriço", emoji: "🌭" }, { nome: "Salpicão", emoji: "🌭" },
      { nome: "Alheira", emoji: "🌭" }, { nome: "Salsichas", emoji: "🌭" },
      { nome: "Bacon", emoji: "🥓" }, { nome: "Mortadela", emoji: "🍖" },
      { nome: "Paio", emoji: "🌭" }, { nome: "Linguiça", emoji: "🌭" },
      { nome: "Morcela", emoji: "🌭" }, { nome: "Peru fatiado", emoji: "🍗" },
    ],
  },
  "Peixe & Marisco": {
    items: [
      { nome: "Atum (lata)", emoji: "🐟" }, { nome: "Sardinha (lata)", emoji: "🐟" },
      { nome: "Cavala (lata)", emoji: "🐟" }, { nome: "Bacalhau", emoji: "🐠" },
      { nome: "Salmão", emoji: "🐟" }, { nome: "Pescada", emoji: "🐠" },
      { nome: "Dourada", emoji: "🐠" }, { nome: "Robalo", emoji: "🐠" },
      { nome: "Camarão", emoji: "🦐" }, { nome: "Lulas", emoji: "🦑" },
      { nome: "Mexilhão", emoji: "🦪" }, { nome: "Polvo", emoji: "🐙" },
      { nome: "Truta", emoji: "🐟" }, { nome: "Filetes", emoji: "🐠" },
      { nome: "Peixe espada", emoji: "🐠" }, { nome: "Choco", emoji: "🦑" },
      { nome: "Amêijoas", emoji: "🦪" }, { nome: "Berbigão", emoji: "🦪" },
    ],
  },
  "Mercearia": {
    items: [
      { nome: "Arroz", emoji: "🍚" }, { nome: "Massa esparguete", emoji: "🍝" },
      { nome: "Massa penne", emoji: "🍝" }, { nome: "Massa laços", emoji: "🍝" },
      { nome: "Farinha", emoji: "🌾" }, { nome: "Açúcar", emoji: "🍬" },
      { nome: "Sal", emoji: "🧂" }, { nome: "Azeite", emoji: "🫒" },
      { nome: "Óleo vegetal", emoji: "🫙" }, { nome: "Vinagre", emoji: "🫙" },
      { nome: "Molho de tomate", emoji: "🍅" }, { nome: "Polpa de tomate", emoji: "🍅" },
      { nome: "Feijão (lata)", emoji: "🫘" }, { nome: "Grão (lata)", emoji: "🫘" },
      { nome: "Lentilhas", emoji: "🫘" }, { nome: "Caldo de galinha", emoji: "🫙" },
      { nome: "Maionese", emoji: "🫙" }, { nome: "Ketchup", emoji: "🍅" },
      { nome: "Mostarda", emoji: "🫙" }, { nome: "Mel", emoji: "🍯" },
      { nome: "Compotas", emoji: "🍓" }, { nome: "Cereais", emoji: "🌾" },
      { nome: "Aveia", emoji: "🌾" }, { nome: "Flocos milho", emoji: "🌾" },
      { nome: "Pimenta", emoji: "🫙" }, { nome: "Canela", emoji: "🫙" },
      { nome: "Bicarbonato", emoji: "🫙" }, { nome: "Fermento", emoji: "🫙" },
      { nome: "Levedura", emoji: "🫙" }, { nome: "Amido milho", emoji: "🌽" },
      { nome: "Milho (lata)", emoji: "🌽" }, { nome: "Pickles", emoji: "🥒" },
    ],
  },
  "Bebidas": {
    items: [
      { nome: "Água natural", emoji: "💧" }, { nome: "Água com gás", emoji: "💧" },
      { nome: "Sumo de laranja", emoji: "🍊" }, { nome: "Sumo de fruta", emoji: "🧃" },
      { nome: "Refrigerante cola", emoji: "🥤" }, { nome: "Refrigerante limão", emoji: "🥤" },
      { nome: "Cerveja", emoji: "🍺" }, { nome: "Vinho tinto", emoji: "🍷" },
      { nome: "Vinho branco", emoji: "🥂" }, { nome: "Vinho verde", emoji: "🍷" },
      { nome: "Espumante", emoji: "🍾" }, { nome: "Sumo de maçã", emoji: "🍎" },
      { nome: "Café", emoji: "☕" }, { nome: "Cápsulas café", emoji: "☕" },
      { nome: "Chá", emoji: "🍵" }, { nome: "Leite vegetal", emoji: "🥛" },
      { nome: "Chocolate quente", emoji: "🍫" }, { nome: "Bebida energética", emoji: "⚡" },
      { nome: "Tónica", emoji: "🥤" }, { nome: "Cidra", emoji: "🍺" },
      { nome: "Sangria", emoji: "🍷" }, { nome: "Água com sabor", emoji: "💧" },
    ],
  },
  "Congelados": {
    items: [
      { nome: "Batata frita (cong.)", emoji: "🍟" }, { nome: "Pizza congelada", emoji: "🍕" },
      { nome: "Lasanha congelada", emoji: "🍝" }, { nome: "Legumes cong.", emoji: "🥦" },
      { nome: "Peixe cong.", emoji: "🐟" }, { nome: "Camarão cong.", emoji: "🦐" },
      { nome: "Hambúrgueres", emoji: "🍔" }, { nome: "Nuggets", emoji: "🍗" },
      { nome: "Gelados", emoji: "🍦" }, { nome: "Fruta cong.", emoji: "🍓" },
      { nome: "Pão cong.", emoji: "🍞" }, { nome: "Waffles cong.", emoji: "🧇" },
      { nome: "Ervilhas cong.", emoji: "🫛" }, { nome: "Espinafres cong.", emoji: "🥬" },
    ],
  },
  "Snacks": {
    items: [
      { nome: "Chocolate", emoji: "🍫" }, { nome: "Batatas fritas", emoji: "🥔" },
      { nome: "Pipocas", emoji: "🍿" }, { nome: "Gomas", emoji: "🍬" },
      { nome: "Amendoins", emoji: "🥜" }, { nome: "Frutos secos", emoji: "🥜" },
      { nome: "Barras de cereais", emoji: "🌾" }, { nome: "Rebuçados", emoji: "🍬" },
      { nome: "Chupa-chupas", emoji: "🍭" }, { nome: "Chips", emoji: "🥔" },
      { nome: "Bolachas doces", emoji: "🍪" }, { nome: "Croissant embal.", emoji: "🥐" },
      { nome: "Panquecas", emoji: "🥞" }, { nome: "Tortilhas", emoji: "🫓" },
      { nome: "Rissóis", emoji: "🫓" }, { nome: "Croquetes", emoji: "🫓" },
    ],
  },
  "Limpeza": {
    items: [
      { nome: "Detergente loiça", emoji: "🧴" }, { nome: "Detergente máq.", emoji: "🧺" },
      { nome: "Amaciador roupa", emoji: "🧺" }, { nome: "Limpeza WC", emoji: "🚿" },
      { nome: "Limpeza casa banho", emoji: "🫧" }, { nome: "Limpeza cozinha", emoji: "🫧" },
      { nome: "Papel higiénico", emoji: "🧻" }, { nome: "Papel de cozinha", emoji: "🧻" },
      { nome: "Guardanapos", emoji: "🧻" }, { nome: "Sacos do lixo", emoji: "🗑️" },
      { nome: "Sacos congelar", emoji: "🛍️" }, { nome: "Esfregão", emoji: "🧹" },
      { nome: "Vassoura", emoji: "🧹" }, { nome: "Desinfetante", emoji: "💧" },
      { nome: "Lixívia", emoji: "💧" }, { nome: "Esponjas", emoji: "🧽" },
      { nome: "Pano de cozinha", emoji: "🧻" }, { nome: "Film plástico", emoji: "🫙" },
      { nome: "Papel de alumínio", emoji: "🫙" }, { nome: "Ambientador", emoji: "🌸" },
      { nome: "Spray limpeza", emoji: "💧" }, { nome: "Pastilhas máq. loiça", emoji: "🧴" },
    ],
  },
  "Higiene": {
    items: [
      { nome: "Champô", emoji: "🧴" }, { nome: "Condicionador", emoji: "🧴" },
      { nome: "Gel de banho", emoji: "🚿" }, { nome: "Sabonete", emoji: "🧼" },
      { nome: "Pasta dentes", emoji: "🪥" }, { nome: "Escova dentes", emoji: "🪥" },
      { nome: "Fio dentário", emoji: "🦷" }, { nome: "Elixir bucal", emoji: "🦷" },
      { nome: "Desodorizante", emoji: "🧴" }, { nome: "Creme rosto", emoji: "🧴" },
      { nome: "Creme corpo", emoji: "🧴" }, { nome: "Protetor solar", emoji: "☀️" },
      { nome: "Maquilhagem", emoji: "💄" }, { nome: "Máscara facial", emoji: "🧖" },
      { nome: "Pensos higiénicos", emoji: "🩸" }, { nome: "Tampões", emoji: "🩸" },
      { nome: "Algodão", emoji: "🌱" }, { nome: "Lâminas barbear", emoji: "🪒" },
      { nome: "Espuma de barbear", emoji: "🪒" }, { nome: "Perfume", emoji: "🌺" },
      { nome: "Cotonetes", emoji: "🌱" }, { nome: "Papel higiénico húmido", emoji: "🧻" },
      { nome: "Champô seco", emoji: "🧴" }, { nome: "Creme de mãos", emoji: "🧴" },
    ],
  },
  "Bebé & Criança": {
    items: [
      { nome: "Fraldas", emoji: "👶" }, { nome: "Lenços húmidos", emoji: "🧻" },
      { nome: "Leite em pó", emoji: "🥛" }, { nome: "Papas bebé", emoji: "🍼" },
      { nome: "Iogurte bebé", emoji: "🫙" }, { nome: "Sumo bebé", emoji: "🧃" },
      { nome: "Creme bumbum", emoji: "🧴" }, { nome: "Champô bebé", emoji: "🧴" },
      { nome: "Chupeta", emoji: "🍼" }, { nome: "Biberão", emoji: "🍼" },
    ],
  },
  "Farmácia": {
    items: [
      { nome: "Paracetamol", emoji: "💊" }, { nome: "Ibuprofeno", emoji: "💊" },
      { nome: "Vitamina C", emoji: "🍊" }, { nome: "Vitamina D", emoji: "☀️" },
      { nome: "Multivitaminas", emoji: "💊" }, { nome: "Magnésio", emoji: "💊" },
      { nome: "Probióticos", emoji: "🫙" }, { nome: "Ómega 3", emoji: "🐟" },
      { nome: "Pensos rápidos", emoji: "🩹" }, { nome: "Termómetro", emoji: "🌡️" },
      { nome: "Álcool etílico", emoji: "💧" }, { nome: "Água oxigenada", emoji: "💧" },
    ],
  },
};

export const CATEGORIAS = Object.keys(CATS);
export const NOMES_ARTIGOS = Object.values(CATS).flatMap((c) => c.items.map((i) => i.nome));

export const semAcentos = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

const POR_NOME = new Map();
for (const [categoria, c] of Object.entries(CATS)) {
  for (const it of c.items) if (!POR_NOME.has(semAcentos(it.nome))) POR_NOME.set(semAcentos(it.nome), { ...it, categoria });
}

/* O artigo do catálogo com este nome (sem olhar a maiúsculas nem acentos), ou null. */
export function doCatalogo(nome) {
  return POR_NOME.get(semAcentos(nome)) || null;
}
