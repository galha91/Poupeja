/*
 * Relevância: de tudo o que a pesquisa de uma loja devolve, o que é mesmo
 * o artigo procurado. Sem dependências das lojas, para se testar com os
 * nomes e secções reais (tests/relevancia.test.mjs).
 */

/* ── Relevância ──
   A pesquisa de cada loja é generosa: "laranja" traz sumos, gelatinas e,
   no Lidl, peras. Para comparar preços só interessa o artigo em si. */

const semAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Singular aproximado, o suficiente para "laranjas" = "laranja" e
// "limões" = "limão". Não é gramática: é só para comparar palavras.
export function raiz(palavra) {
  let w = semAcentos(palavra);
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("ais")) return w.slice(0, -2) + "l";
  if (w.endsWith("eis")) return w.slice(0, -3) + "el";
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  if (/[rsz]es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

const PALAVRAS_VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "com", "sem", "a", "o", "em", "para"]);

export function palavras(txt) {
  return semAcentos(String(txt || ""))
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w))
    .map(raiz);
}

/* Nomes diferentes para a mesma coisa, de loja para loja. */
// Chaves já em raiz() ("ananás" → "anana").
const SINONIMOS = {
  anana: ["abacaxi"], abacaxi: ["anana"],
  esparguete: ["spaghetti", "spaguetti"], spaghetti: ["esparguete"],
  racao: ["comida"],
  fatiado: ["fatia"], fatia: ["fatiado"],
};

/*
 * Palavras que vêm ANTES do produto sem o transformar noutra coisa:
 * «Peito de Frango» é frango, «Massa Esparguete» é esparguete, «Tablete
 * de Chocolate» é chocolate. Ao contrário de «Sumo de Laranja».
 */
const FORMATOS = new Set([
  "peito", "bife", "coxa", "sobrecoxa", "asa", "asinha", "perna", "perninha", "lombinho", "lombo",
  "filete", "file", "posta", "pedaco", "metade", "meio", "cubo", "tira", "fatia", "rodela",
  "massa", "tablete", "embalagem", "emb", "pack", "saco", "rede", "cuvete", "caixa", "lata", "frasco", "garrafa",
  "mini", "maxi", "fresco", "fresca",
]);

/*
 * Produtos que só LEVAM o que se procurou: a categoria da loja pode dizer
 * «laranja» (a secção dos sumos de laranja), mas um sumo não é uma laranja.
 */
const DERIVADOS = new Set([
  "sumo", "nectar", "iogurte", "gelatina", "gelado", "bolo", "bolacha", "refrigerante", "agua", "cha",
  "doce", "compota", "molho", "cereal", "barra", "leite", "pudim", "crepe", "croissant", "bebida", "licor",
  "creme", "sobremesa", "infusao", "tempero", "preparado", "snack", "salada", "pizza", "tarte", "cocktail",
  // Padaria e salgados: «Pão de Hambúrguer» é pão, «Pão de Alho» é pão.
  "pao", "broa", "tosta", "sande", "sandwich", "wrap", "tortilha", "folhado", "empada", "pastel", "rissol", "rissoi", "croquete",
  // Carne já preparada: «Salsichas de Frango», «Hambúrguer de Novilho» não são frango nem novilho.
  "hamburguer", "salsicha", "almondega", "nugget", "panado", "lasanha", "sopa", "batido",
  // Purés e bolsas (fruta para levar, comida de bebé).
  "pure", "polpa", "bolsa", "saqueta", "tacinha", "pacotinho", "boiao", "papa",
]);

function casa(w, t) {
  if (w === t) return true;
  const [curta, longa] = w.length <= t.length ? [w, t] : [t, w];
  return curta.length >= 5 && longa.startsWith(curta);
}

function temTermo(p, t) {
  return [t, ...(SINONIMOS[t] || [])].some((alt) => p.some((w) => casa(w, alt)));
}

/*
 * 2 = é mesmo isto ("Laranja do Algarve", "Peito de Frango")
 * 1 = contém tudo, mas é outra coisa ("Sumo de Laranja")
 * 0 = não tem a ver
 *
 * Olha para o que vem ANTES da palavra procurada:
 *   - nada, ou só formatos ("Peito de", "Massa", "Mini"): é isto;
 *   - outro produto ("Pão de", "Sumo de", "Bolsa de"): leva-o, não é;
 *   - outra coisa (quase sempre a marca: "Milka Chocolate"): decide a
 *     secção da loja, desde que essa secção seja a do artigo e não a de
 *     outro produto. Era aqui que o "Pão de Hambúrguer" passava por
 *     hambúrguer: o Continente arruma-o em "Pão de Hambúrguer e Cachorro".
 */
/* As palavras antes da procurada (todas, se não estiver lá). */
function antesDe(ws, termo) {
  const i = ws.findIndex((w) => temTermo([w], termo));
  return i < 0 ? null : ws.slice(0, i);
}

export function relevancia(nome, termos, categoria = "") {
  if (!termos.length) return 0;
  const p = palavras(nome);
  if (!termos.every((t) => temTermo(p, t))) return 0;
  const primeiro = termos[0];
  const antes = antesDe(p, primeiro) || p;
  if (!antes.length) return 2;
  if (antes.some((w) => DERIVADOS.has(w))) return 1;
  if (antesDe(p, primeiro) && antes.every((w) => FORMATOS.has(w) || /^\d/.test(w))) return 2;
  // A secção da loja é a do que se procurou, e não a de outro produto:
  // "Talho/Frango e Peru" e "Leite e Natas" sim; "Pão de Hambúrguer e Cachorro" não.
  const seccoes = String(categoria || "").split(/[/>|]/).map(palavras);
  if (seccoes.some((s) => { const a = antesDe(s, primeiro); return a && !a.some((w) => DERIVADOS.has(w)); })) return 2;
  return 1;
}

/*
 * Comida de bebé (purés +6M, papas, saquetas) aparece em quem procura
 * "fruta", "iogurte" ou "pera". Só conta como o artigo se se pediu.
 */
// No nome, as marcas e o "+6M"; na secção, a de bebé. ("Infantil" no
// nome fica: um iogurte ou um leite para crianças continua a sê-lo.)
const BEBE_NOME = /\bbaby\b|\+\s?\d{1,2}\s?m(eses)?\b|bl[eé]dina|nutriben|cerelac|gerber|naturnes|\bhero (baby|solo)\b/i;
const BEBE_SECCAO = /beb[eé]|alimenta[cç][aã]o infantil/i;
const PEDE_BEBE = /beb|baby|infantil|papa|crianca/;

/* Secções que não são de comida nem de casa de banho/limpeza: a capa, o saco de silicone… */
const NAO_SUPERMERCADO = /casa e jardim|brinquedo|eletrodom|electrodom|bricolage|jardinagem|decora[cç]/i;

/*
 * A relevância de um produto tal como a loja o devolveu, com as exceções
 * todas (parecidos, bebé, fora do supermercado, ervas secas). Falta só a
 * passagem das formas processadas, que precisa de ver a lista inteira.
 */
export function classificar(bruto, termos, lojaId = "", modo = modoComparacao(termos)) {
  let rel = relevancia(bruto.nome, termos, bruto.categoria || "");
  if (rel !== 2) return rel;
  if (EXCLUIR[termos[0]]?.test(bruto.nome)) return 1;
  if ((BEBE_NOME.test(bruto.nome) || BEBE_SECCAO.test(bruto.categoria || "")) && !termos.some((t) => PEDE_BEBE.test(t))) return 1;
  if (NAO_SUPERMERCADO.test(bruto.categoria || "")) return 1;
  // Ervas: o frasco de salsa seca é "relacionado", não é o molho fresco.
  if (modo === "embalagem" && !eFresca({ ...bruto, loja: lojaId })) return 1;
  return rel;
}

/*
 * Formas processadas saem da comparação quando há frescos em ≥ 2 lojas
 * e quem procurou não pediu a forma processada ("morangos congelados").
 * Muda os produtos no sítio.
 */
export function separarProcessados(produtos, q) {
  if (PROCESSADO.test(q)) return produtos;
  const lojasFresco = new Set(produtos.filter((p) => p.relevancia === 2 && !PROCESSADO.test(p.nome)).map((p) => p.loja));
  if (lojasFresco.size >= 2) for (const p of produtos) if (p.relevancia === 2 && PROCESSADO.test(p.nome)) p.relevancia = 1;
  return produtos;
}

/*
 * Como se compara cada tipo de produto — a vistoria às quatro lojas
 * mostrou que o €/kg serve para quase tudo, mas não para tudo:
 *
 * - Ervas aromáticas frescas compram-se ao molho (50 g, 100 g). Ao kg, um
 *   saco congelado de 250 g "ganhava" ao molho fresco — resposta certa à
 *   pergunta errada. Compara-se o preço da embalagem, e só entre frescas.
 * - Contáveis (ovos, rolos, fraldas, cápsulas, doses de detergente): o
 *   preço por ovo / rolo / lavagem, que é o que as lojas afixam.
 */
const ERVAS_FRESCAS = new Set(["salsa", "coentro", "hortela", "manjericao", "cebolinho", "alecrim", "tomilho", "endro", "estragao", "louro", "oregao", "salva"]);
const NAO_FRESCO = /frasco|saqueta|desidrat|\bsec[oa]s?\b|em folhas?|folhas? em|congelad|picad|mo[ií]d|gr[aã]o|liofiliz|pasta de/i;

// Fresca = a loja arruma-a nos frescos/legumes e o nome não diz o contrário.
// (O Lidl não traz categoria útil; aí decide só o nome.)
function eFresca(p) {
  if (NAO_FRESCO.test(p.nome)) return false;
  return p.categoria && p.loja !== "lidl" ? /fresc|legume/i.test(p.categoria) : true;
}

/*
 * Parecido no nome, outro produto. Para quem procura "ovos", os de
 * codorniz a 0,11 € não são a resposta; para "alho", o alho-francês não é
 * alho. Continuam na lista, em "relacionados".
 */
const EXCLUIR = {
  ovo: /codorniz|cozid|chocolate|p[áa]scoa|kinder/i,
  alho: /franc[eê]s|pão|baguete|manteiga|massa/i,
  frango: /moela|f[ií]gado|cora[çc][ãaõo]|pesco[çc]o/i,
  // "Bacalhau com …" é prato feito (com natas, com couve e broa…).
  // Caldeirada e conservas (em azeite, em óleo) também não são o bacalhau
  // que se procura: no histórico real, "Caldeirada de Bacalhau" e
  // "Bacalhau em Azeite e Alho 120 g" apareciam como o bacalhau da loja.
  bacalhau: /\bcom\b|br[áa]s|pat[ae]niscas|past[ée]is|bolinhos|caras de|migas|lascas|caldeirada|em azeite|em [óo]leo/i,
  // "Salsichas" a sério: as vegetais são outra coisa.
  salsicha: /veggie|vegan|vegetal|vegetariana/i,
  manteiga: /amendoim|cacau|karit[ée]|corporal|feij[ãa]o|ab[óo]bora/i,
  papel: /h[úu]mido|cozinha|alum[ií]nio|vegetal|toalhita/i,
  champo: /carro|auto|c[ãa]o|c[ãa]es|gato/i,
  pizza: /massa|base|molho|farinha/i,
  leite: /coco|am[êe]ndoa|aveia|soja|condensad|em p[óo]|chocolate|achocolatad|corporal|hidratante|limpeza|p[ãa]o/i,
  queijo: /ralador|tabua|t[áa]bua/i,
};

/*
 * Congelado, em calda, em lata, fumado, polpa… é outra forma do produto.
 * Quem procura "morangos" quer morangos frescos, a não ser que nenhuma
 * loja os tenha — por isso só se separa quando há frescos em pelo menos
 * duas lojas (as ervilhas, quase todas congeladas, comparam-se entre si).
 */
// Sem "seco": alho seco, feijão seco e grão seco são a forma normal.
const PROCESSADO = /congelad|ultracongelad|em calda|conserva|desidratad|em lata|enlatad|em p[óo]\b|fumad|pelad|polpa|passata|concentrad|pur[ée]\b|em pedaços|triturad|mo[ií]d[oa]|picad[oa]|massa de|pasta de|migas|lascas|cozid[oa]|desfiad|assad[oa]|panad[oa]|grelhad/i;

export function modoComparacao(termos) {
  return ERVAS_FRESCAS.has(termos[0]) ? "embalagem" : "unidade";
}
