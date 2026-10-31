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
  // Cores no masculino e no feminino ("tinta branca" / "Tinta … branco").
  branca: ["branco"], branco: ["branca"], preta: ["preto"], preto: ["preta"],
  esparguete: ["spaghetti", "spaguetti"], spaghetti: ["esparguete"],
  racao: ["comida"],
  fatiado: ["fatia"], fatia: ["fatiado"],
  // O colorau vende-se como "Pimentão Doce (Colorau)".
  colorau: ["pimentao"],
  // No inverno as lojas chamam-lhes clementinas ou mandarinas.
  tangerina: ["clementina", "mandarina"], clementina: ["tangerina", "mandarina"], mandarina: ["tangerina", "clementina"],
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
/* Marcas que são o próprio produto, e o género que as lojas lhes põem à frente. */
const MARCAS_PRODUTO = new Set(["coca", "pepsi", "fanta", "sprite", "nestea", "lipton", "sumol", "compal", "actimel"]);
const GENEROS = new Set(["refrigerante", "bebida", "sumo", "nectar", "iogurte", "cha"]);

/*
 * Pesquisas por marca ("nutella", "heineken", "special k"): a marca vem no fim
 * ou no meio do nome ("Creme para Barrar Chocolate e Avelãs Nutella"), por
 * isso a regra do "antes da palavra" não serve. Cada marca diz que tipo de
 * produto é o que as pessoas procuram (`tipo`) e o que não é (`fora`): a
 * Sagres também faz sardinhas, a Ariel é uma princesa da Disney, o M&M
 * também é espumante.
 * As marcas com vários produtos que não se comparam entre si (Danone,
 * Nescafé, Fairy…) estão em GENERICOS (lib/comparacao.js): pede-se o produto.
 */
const MARCAS = new Map(Object.entries({
  "nutella": { tipo: /creme|barrar|avel[ãa]s?/i, fora: /& ?go\b|breadsticks|biscuit|b-?ready|gelado|bolo/i },
  "philadelphia": { tipo: /barrar|creme/i },
  "activia": { tipo: /./ },
  "special k": { tipo: /cereais|flocos|granola/i },
  "7up": { tipo: /refrigerante|bebida/i },
  "sagres": { tipo: /cerveja/i },
  "super bock": { tipo: /cerveja/i },
  "heineken": { tipo: /cerveja/i },
  "red bull": { tipo: /./ },
  "monster": { tipo: /energy|energ[ée]tica/i },
  "pringles": { tipo: /./ },
  "lays": { tipo: /batata|snack|chips|cones?/i },
  "doritos": { tipo: /snack|nachos|tortilla/i, fora: /molho|dip/i },
  "oreo": { tipo: /bolacha|biscoito|cookie/i, fora: /gengibre|gelado|bolo/i },
  "m&m": { tipo: /./, fora: /espumante|vinho|bebida|l[áa]ctea|fizz|bairrada/i },
  "kit kat": { tipo: /snack|barra|chocolate|wafer|chunky/i, fora: /c[áa]psula|berlim|gelado|bolo/i },
  "toblerone": { tipo: /tablete|chocolate|barra/i, fora: /bolo|gelado|lavacake/i },
  "nespresso": { tipo: /c[áa]psula/i, fora: /detergente|limpeza|descalcific/i },
  "ariel": { tipo: /detergente|roupa|c[áa]psula|pods|l[ií]quido/i },
  "skip": { tipo: /detergente|roupa|c[áa]psula|pods|l[ií]quido/i },
  "ajax": { tipo: /lava tudo|limp|detergente|spray|vidros|multiusos|desinfet|wc|casa de banho/i },
  "cream crackers": { tipo: /./ },
}).map(([k, v]) => [palavras(k).join(" "), v]));

/* Cortes de carne e peixe: à frente do artigo, fazem dele outra peça. */
const CORTES = new Set(["costeleta", "entrecosto", "entremeada", "febra", "bifana", "cachaco", "pa", "perna", "lombo",
  "bife", "peito", "coxa", "asa", "posta", "filete", "lombinho", "picanha", "acem", "alcatra", "vazia", "cabeca", "rabo"]);

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
  const marca = MARCAS.get(termos.join(" "));
  if (marca) return marca.tipo.test(`${nome} ${categoria}`) && !marca.fora?.test(nome) ? 2 : 1;
  const antes = antesDe(p, primeiro) || p;
  if (!antes.length) return 2;
  // "Refrigerante Coca-Cola" é a Coca-Cola: quem pesquisa a marca já disse o produto.
  const generoOk = (w) => MARCAS_PRODUTO.has(primeiro) && GENEROS.has(w);
  if (antes.some((w) => DERIVADOS.has(w) && !generoOk(w))) return 1;
  if (MARCAS_PRODUTO.has(primeiro)) return 2;
  if (antesDe(p, primeiro) && antes.every((w) => FORMATOS.has(w) || /^\d/.test(w))) return 2;
  // A secção da loja é a do que se procurou, e não a de outro produto:
  // "Talho/Frango e Peru" e "Leite e Natas" sim; "Pão de Hambúrguer e Cachorro" não.
  // (Vale qualquer palavra do que se procurou: as pastilhas da Auchan estão
  // em "detergente-máquina-loiça".)
  const seccoes = String(categoria || "").split(/[/>|]/).map(palavras);
  const secaoDe = (t) => seccoes.some((s) => { const a = antesDe(s, t); return a && !a.some((w) => DERIVADOS.has(w)); });
  if (secaoDe(primeiro)) return 2;
  // Pelas outras palavras só se à frente do artigo não vier outro corte
  // ("Costeletas do Lombo" não é lombo, mesmo na secção do porco).
  if (!antes.some((w) => CORTES.has(w)) && termos.slice(1).some(secaoDe)) return 2;
  return 1;
}

/*
 * Comida de bebé (purés +6M, papas, saquetas) aparece em quem procura
 * "fruta", "iogurte" ou "pera". Só conta como o artigo se se pediu.
 */
// No nome, as marcas e o "+6M"; na secção, a de bebé. ("Infantil" no
// nome fica: um iogurte ou um leite para crianças continua a sê-lo.)
const BEBE_NOME = /\bnan\b|aptamil|nutrilon|milupa|optipro|enfamil|blemil|nidina|lactentes|f[óo]rmula infantil|\bbaby\b|\+\s?\d{1,2}\s?m(eses)?\b|bl[eé]dina|nutriben|cerelac|gerber|naturnes|\bhero (baby|solo)\b/i;
const BEBE_SECCAO = /beb[eé]|alimenta[cç][aã]o infantil/i;
const PEDE_BEBE = /beb|baby|infantil|papa|crianca/;

/* Secções que não são de comida nem de casa de banho/limpeza: a capa, o saco de silicone, a cola UHU… */
const NAO_SUPERMERCADO = /casa e jardim|brinquedo|jogos|lego|bonecas?|eletrodom|electrodom|bricolage|jardinagem|plantas|flores|decora[cç]|manualidades|papelaria|escrit[óo]rio|material escolar|livros|literatura|funko|disney|vestu[áa]rio|t[êe]xtei|cal[çc]ado|acess[óo]rios|maquilhagem/i;

/* Não é o artigo, é o que o substitui: "Alternativa à Nata", "Fatias Sabor a Frango". */
const IMITACAO = /\balternativa\b|\bsabor a\b|\bimita[cç]|\btipo [a-z]|\bsoja\b|\bvegan|\bveggie|\bvegetari|\bvegetal\b/i;

/*
 * Leite gordo, meio-gordo e magro não se trocam: quem pede "gordo" não quer
 * o "Meio-Gordo" nem o "m/gordo" (que também diz gordo).
 */
function gorduraTrocada(nome, qq) {
  const n = semAcentos(nome);
  const meio = /meio[- ]?gord|m\/ ?gord|semi[- ]?desnat/.test(n);
  const magro = /\bmagr[oa]s?\b|desnatad/.test(n) && !meio;
  const gordo = /\bgord[oa]s?\b/.test(n) && !meio;
  if (/meio[- ]?gord/.test(qq)) return magro || gordo;
  if (/\bgord[oa]\b/.test(qq)) return meio || magro;
  if (/\bmagr[oa]\b/.test(qq)) return meio || gordo;
  return false;
}

/* As palavras que vêm logo a seguir a "sem" ("sem fermento" → fermento). */
function semDe(txt) {
  const out = new Set();
  for (const m of semAcentos(String(txt || "")).matchAll(/\bsem\s+([a-z0-9]+)/g)) out.add(raiz(m[1]));
  return out;
}

/*
 * Versões especiais do artigo: magro, light, sem lactose, ralado, bio…
 * Continuam a ser o artigo, mas quem escreve "manteiga" quer a manteiga
 * normal. Marca-se (variante) e a soma da lista, em cada loja, só as usa
 * se a loja não tiver a normal.
 */
const VARIANTES = [
  /\bmagr[oa]s?\b/i, /\blight\b/i, /ligeir[oa]/i, /meio[- ]?gord[oa]/i, /sem lactose/i, /sem [aá]lcool/i,
  /com g[aá]s/i, /\bralad[oa]s?\b/i, /rechead[oa]s?/i, /h[úu]mid[oa]/i, /\bzero\b|\b0 ?%/i, /sem a[çc][úu]car/i,
  /\bbio\b|biol[óo]gic/i, /prote[íi]n|proteic/i, /sem gl[úu]ten|isento de gl[úu]ten/i, /integra(l|is)\b/i,
  /descafeinad/i, /\bmini\b/i, /infantil|\bkids\b|\bjúnior\b|\bjunior\b/i, /\bde (lim[ãa]o|morango|lim[aã]o)\b/i,
];
// Sabores: "Iogurte Grego" é o natural, "Croissant" é o simples.
VARIANTES.push(/morango|baunilha|chocolate|cacau|caramelo|\bcoco\b|banana|anan[aá]s|frutos (vermelhos|silvestres|do bosque)|p[eê]ssego|framboesa|mirtilo|manga|avel[aã]|stracciatella|tutti|speculoos|pistach/i,
  /konjac|\bslim\b/i, /para barrar/i, /sem pele|sem espinha/i, /em tomate|picante|escabeche/i,
  // Do relatório de 31/10: o que não é o artigo "normal" da prateleira.
  /m[áa]gic/i, /\bwc\b/i, /\bspray\b/i, /decorativ|natal|festa|aniversari/i, /maxibon|magnum|cornetto|solero|twister/i,
  /panko|japon[êe]s/i, /\bmini\b/i,
  /cappuccino|l[áa]ctea/i, /\b\d+ ?x ?\d{2,3} ?ml\b/i,
  /perna de pau|\bcone\b|palito|cornetto/i, /caipir|cocktail/i, /wrap de (atum|frango|peru|presunto|salm|queijo|legumes|fiambre)/i, /tortilha de (batata|ovos?)/i, /asi[áa]tic|jasmim|basmati|vaporizado|saquetas?/i, /chines|noodle|ramen|instant/i);
export function eVariante(nome, q) {
  const qq = semAcentos(String(q || ""));
  return VARIANTES.some((r) => r.test(nome) && !r.test(qq) && !r.test(String(q || "")));
}

/*
 * A relevância de um produto tal como a loja o devolveu, com as exceções
 * todas (parecidos, bebé, fora do supermercado, ervas secas). Falta só a
 * passagem das formas processadas, que precisa de ver a lista inteira.
 */
export function classificar(bruto, termos, lojaId = "", modo = modoComparacao(termos), q = termos.join(" ")) {
  let rel = relevancia(bruto.nome, termos, bruto.categoria || "");
  if (!rel) return 0;
  // "Farinha sem Fermento" não é fermento; "Água sem Gás" não é água com gás.
  const negados = semDe(bruto.nome), pedidosSem = semDe(q);
  if (termos.some((t) => negados.has(t) && !pedidosSem.has(t))) return 0;
  if (rel !== 2) return rel;
  const qq = semAcentos(String(q));
  // Parecidos no nome, outro produto, a não ser que se peça ("alho francês").
  const excluir = EXCLUIR[termos[0]];
  // ("Água com gás" não se exclui de quem pesquisa "água das pedras".)
  if (excluir?.test(bruto.nome) && !excluir.test(qq) && !(termos[0] === "agua" && termos.length > 1)) return 1;
  if (IMITACAO.test(bruto.nome) && !IMITACAO.test(qq)) return 1;
  // Planta em vaso (o "cebolinho vaso" não é o molho); bebidas alcoólicas com a marca ("Absolut and Sprite").
  if (/\bvaso\b/i.test(bruto.nome) && !/vaso/.test(qq)) return 1;
  if (MARCAS_PRODUTO.has(termos[0]) && /cocktail|absolut|vodka|whisk|\brum\b|\bgin\b|jack daniel|bacardi|long drink/i.test(bruto.nome)) return 1;
  if (gorduraTrocada(bruto.nome, qq)) return 1;
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
  const principais = produtos.filter((p) => p.relevancia === 2);
  const lojasFresco = new Set(principais.filter((p) => !PROCESSADO.test(p.nome)).map((p) => p.loja));
  const lojasSoProcessado = new Set(principais.map((p) => p.loja).filter((l) => !lojasFresco.has(l)));
  // Com frescos em 2 lojas, ou em tantas como as que só têm a forma
  // processada (pêssegos: 1 fresca contra 1 em calda), compara-se o fresco.
  // Se o normal é a forma processada (milho doce: 1 fresca contra 4 latas), não.
  if (lojasFresco.size >= 2 || (lojasFresco.size >= 1 && lojasFresco.size >= lojasSoProcessado.size)) {
    for (const p of principais) if (PROCESSADO.test(p.nome)) p.relevancia = 1;
  }
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
  // Quem escreve "bacalhau" quer o seco: o fresco, os rabos e as barrigas são outra compra.
  bacalhau: /\bcom\b|br[áa]s|pat[ae]niscas|past[ée]is|bolinhos|caras de|migas|lascas|caldeirada|em azeite|em [óo]leo|fresco|\brabos?\b|barriga|cabe[cç]a|badana|espiritual|(?:^|\s)[àa] (gomes|z[ée]|lagareiro|minhota|bras)|natas|gratinad/i,
  // "Salsichas" a sério: as vegetais são outra coisa.
  salsicha: /veggie|vegan|vegetal|vegetariana/i,
  manteiga: /amendoim|cacau|karit[ée]|corporal|feij[ãa]o|ab[óo]bora/i,
  papel: /h[úu]mido|cozinha|alum[ií]nio|vegetal|toalhita/i,
  champo: /carro|auto|c[ãa]o|c[ãa]es|gato/i,
  pizza: /massa|base|molho|farinha|cookie|chocolate|nutella|forno|p[áa]\b/i,
  leite: /coco|am[êe]ndoa|aveia|soja|condensad|em p[óo]|chocolate|achocolatad|corporal|hidratante|limpeza|p[ãa]o|caf[ée]/i,
  queijo: /ralador|tabua|t[áa]bua/i,
  // Vistos na auditoria de todo o catálogo (30/10/2026):
  ameixa: /\bsec[ao]s?\b|passa|calda|compota|doce de/i,
  figo: /\bsec[ao]s?\b|farinha|compota|doce de|bolo|pingo mel/i,
  cereja: /cristaliz|rechear|calda|licor|marrasquino|bombo/i,
  salmao: /cabe[cç]a|espinha|aparas|fumad/i,
  chocolate: /dinheiro|jelly|moedas|ovos? de|figura|coelho|bomba/i,
  lula: /caldeirada|an[ée]is|anel|panad|recheada|arroz/i,
  choco: /chocolat/i,
  canela: /biscoit|bolach/i,
  fralda: /incontin/i,
  coca: /jack|whisk|\brum\b|cocktail|vodka|bacardi|gin\b/i,
  lima: /safira|unhas|el[ée]tric|metal|\bp[ée]s\b|escova/i,
  algodao: /pratas|duraglit|limpa/i,
  colorau: /chouri|queijo|fresco|vermelho|verde|amarelo|colora[cç]/i,
  toalhita: /incontin|multius|multissuperf|limpeza|desinfet|desengordur|\bwc\b|m[óo]veis|cozinha|[óo]culos|maquilh|desmaquilh|ch[ãa]o|vidros/i,
  sal: /m[áa]quina|loi[çc]a|banho|piscina|pimenta|ervas|dishwasher/i,
  vinagre: /limpeza|desengordur|lavagem|anticalc/i,
  laranja: /cortad|marmelad|ma made|doce de|compota|robertson|casca/i,
  azeitona: /anchova|rechead|pasta|pat[êe]|tapenade|queijo|feta|piment/i,
  batata: /waffle|\bfrit[ao]s?\b|chips|palha|rosti|noisette|gratin|pur[ée](?![a-z])|croquete|airfryer|doce/i,
  agua: /com g[aá]s|t[óo]nica|sabor|aromatiz|\bcoco\b|lim[aã]o|gaseificad|micelar|oxigenad|colónia|col[óo]nia|perfum/i,
  // Peixe fresco: as conservas são outra compra (a não ser que se peçam).
  cavala: /azeite|[óo]leo|tomate|escabeche|filete|picante|lata|fumad/i,
  sardinha: /azeite|[óo]leo|tomate|escabeche|picante|lata|fumad|past/i,
  areia: /caixa|gaveta|tabuleiro|bandeja|saco para|\bp[áa](?![a-z])/i,
  multiuso: /saco|caixa|toalhit|esponja|pano|bolsa|tesoura|gancho/i,
};

/*
 * Congelado, em calda, em lata, fumado, polpa… é outra forma do produto.
 * Quem procura "morangos" quer morangos frescos, a não ser que nenhuma
 * loja os tenha — por isso só se separa quando há frescos em pelo menos
 * duas lojas (as ervilhas, quase todas congeladas, comparam-se entre si).
 */
// Sem "seco": alho seco, feijão seco e grão seco são a forma normal.
const PROCESSADO = /congelad|ultracongelad|\bcalda\b|conserva|desidratad|em lata|enlatad|em p[óo](?![a-z])|fumad|pelad|polpa|passata|concentrad|pur[ée](?![a-z])|em pedaços|em cubos|triturad|mo[ií]d[oa]|picad[oa]|massa de|pasta de|migas|lascas|cozid[oa]|desfiad|assad[oa]|panad[oa]|grelhad|em sumo|cristalizad|para rechear|pr[ée][- ]?frit|\bfrit[ao]s?\b|airfryer|mccain|\bcubos\b|\d+ ?\(\d+\) ?g|escabeche|caldeirada|com legumes|com arroz|refei[cç][ãa]o|gelcampo|kirsch|luxardo|licor|marrasquino|\brodelas\b/i;

export function modoComparacao(termos) {
  return ERVAS_FRESCAS.has(termos[0]) ? "embalagem" : "unidade";
}
