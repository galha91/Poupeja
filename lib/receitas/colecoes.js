/*
 * Coleções de receitas — páginas públicas por ingrediente e por ocasião
 * (/receitas/frango, /receitas/jantares-rapidos…). Respondem a pesquisas
 * como "receitas de frango baratas" ou "jantares rápidos".
 *
 * Não se escreve à mão que receita entra em que coleção: cada coleção é um
 * filtro sobre os ingredientes, o tempo e as dietas que o motor já calcula.
 * Assim uma receita nova entra sozinha nas coleções certas.
 *
 * Os slugs partilham o caminho /receitas/[id] com as receitas: o teste
 * garante que nenhum coincide com o id de uma receita.
 */

import { receitas } from "./motor.js";

const usa = (r, ...keys) => r.ingredientes.some((i) => keys.includes(i.key));
const refeicao = (r) => r.tipo === "prato" || r.tipo === "sopa";
// "Receitas de X": o X tem de ser o prato, não um pormenor (o chouriço do caldo verde não faz dele uma receita de porco).
const principal = (r, ...keys) => r.tipo === "prato" && usa(r, ...keys);

export const MIN_RECEITAS_COLECAO = 5;

// A consoada: bacalhau e sobremesas de Natal. Escrito à mão (é uma ocasião, não um ingrediente).
const NATAL = new Set([
  "bacalhau-gomes-sa", "bacalhau-bras", "bacalhau-natas", "bacalhau-broa", "bacalhau-grao", "bolinhos-bacalhau",
  "rabanadas", "arroz-doce", "aletria", "leite-creme", "pudim-flan", "pao-de-lo", "baba-camelo", "peras-bebadas",
  "mousse-chocolate-tradicional", "salame-chocolate-tradicional", "bolo-bolacha-tradicional",
]);

export const COLECOES = [
  {
    slug: "frango", grupo: "ingrediente", curto: "Frango",
    titulo: "Receitas de frango baratas",
    intro: "Peito, coxas ou frango inteiro: assados, estufados, à Brás e com caril. O frango é das carnes mais baratas e rende bem para quatro.",
    filtro: (r) => principal(r, "peito-frango", "coxas-frango"),
  },
  {
    slug: "carne-picada", grupo: "ingrediente", curto: "Carne picada",
    titulo: "Receitas com carne picada",
    intro: "Empadão, almôndegas, bolonhesa, pimentos recheados e chili. Meio quilo de carne picada dá um jantar para quatro.",
    filtro: (r) => principal(r, "carne-picada"),
  },
  {
    slug: "porco", grupo: "ingrediente", curto: "Porco",
    titulo: "Receitas de porco baratas",
    intro: "Febras, lombo, costeletas e entrecosto, assados no forno ou feitos no tacho, à portuguesa.",
    filtro: (r) => principal(r, "febras", "lombo", "costeletas", "entrecosto"),
  },
  {
    slug: "bacalhau", grupo: "ingrediente", curto: "Bacalhau",
    titulo: "Receitas de bacalhau",
    intro: "À Brás, com natas, à Gomes de Sá, com broa, com grão e em pataniscas. Para render, conta com o bacalhau já demolhado congelado.",
    filtro: (r) => principal(r, "bacalhau"),
  },
  {
    slug: "atum", grupo: "ingrediente", curto: "Atum",
    titulo: "Receitas com atum em lata",
    intro: "Massa, arroz, saladas, tostas e empadão: o atum em lata é proteína barata que está sempre na despensa.",
    filtro: (r) => principal(r, "atum"),
  },
  {
    slug: "peixe", grupo: "ingrediente", curto: "Peixe",
    titulo: "Receitas de peixe baratas",
    intro: "Pescada, carapau, sardinha, lulas, salmão e conservas. Peixe ao jantar sem gastar muito.",
    filtro: (r) => r.tipo === "prato" && r.proteina === "peixe",
  },
  {
    slug: "ovos", grupo: "ingrediente", curto: "Ovos",
    titulo: "Receitas com ovos",
    intro: "Omelete, tortilha, ovos rotos, ovos escalfados em tomate. Quando o ovo é o prato principal, o jantar sai dos mais baratos.",
    filtro: (r) => r.tipo === "prato" && r.proteina === "ovo",
  },
  {
    slug: "grao-e-feijao", grupo: "ingrediente", curto: "Grão, feijão e lentilhas",
    titulo: "Receitas com grão, feijão e lentilhas",
    intro: "Leguminosas são a proteína mais barata que há, e enchem. Caril, feijoada, chili, sopas e saladas.",
    filtro: (r) => refeicao(r) && r.proteina === "leguminosa",
  },
  {
    slug: "vegetarianas", grupo: "dieta", curto: "Vegetarianas",
    titulo: "Receitas vegetarianas baratas",
    intro: "Jantares e sopas sem carne nem peixe. Saem dos ingredientes, não de uma etiqueta: não há chouriço escondido.",
    filtro: (r) => refeicao(r) && r.veg,
  },
  {
    slug: "veganas", grupo: "dieta", curto: "Veganas",
    titulo: "Receitas veganas baratas",
    intro: "Sem carne, peixe, ovos, lacticínios nem mel. Leguminosas, legumes, massa e arroz.",
    filtro: (r) => refeicao(r) && r.vegano,
  },
  {
    slug: "sem-gluten", grupo: "dieta", curto: "Sem glúten",
    titulo: "Receitas sem glúten baratas",
    intro: "Sem trigo, massa, pão nem aveia. Nos processados (chouriço, salsichas, caril), confirma sempre o rótulo: as marcas variam.",
    filtro: (r) => refeicao(r) && r.dietas.includes("sem-gluten"),
  },
  {
    slug: "jantares-rapidos", grupo: "ocasiao", curto: "Jantares rápidos",
    titulo: "Jantares rápidos, prontos em 25 minutos",
    intro: "Para os dias em que se chega tarde a casa. Todos prontos em 25 minutos ou menos, do fogão à mesa.",
    filtro: (r) => r.tipo === "prato" && r.tempoMin <= 25,
  },
  {
    slug: "air-fryer", grupo: "ocasiao", curto: "Air fryer",
    titulo: "Receitas na air fryer",
    intro: "Jantares que se fazem na air fryer, ou no forno quando não há. Menos óleo e menos tempo de forno ligado.",
    filtro: (r) => refeicao(r) && r.airfryer,
  },
  {
    slug: "natal", grupo: "ocasiao", curto: "Natal",
    titulo: "Receitas de Natal baratas",
    intro: "Bacalhau à Gomes de Sá, à Brás e com natas, rabanadas, arroz-doce, aletria e outras sobremesas da consoada, com quantidades para quatro.",
    ligacao: { href: "/ceia-de-natal", texto: "Quanto custa a ceia de Natal em cada supermercado" },
    filtro: (r) => NATAL.has(r.id),
  },
  {
    slug: "sopas", grupo: "ocasiao", curto: "Sopas",
    titulo: "Sopas baratas",
    intro: "Uma panela de sopa dá para vários dias. Cremes, caldo verde, sopa de feijão e sopas com proteína que valem por um jantar.",
    filtro: (r) => r.tipo === "sopa",
  },
];

export const GRUPOS_COLECAO = [
  { id: "ingrediente", titulo: "Por ingrediente" },
  { id: "dieta", titulo: "Por dieta" },
  { id: "ocasiao", titulo: "Por ocasião" },
];

export function colecaoPorSlug(slug) {
  return COLECOES.find((c) => c.slug === slug) || null;
}

/* As receitas de uma coleção: as mais baratas primeiro, depois as mais rápidas. */
export function receitasDaColecao(colecao) {
  return receitas()
    .filter(colecao.filtro)
    .sort((a, b) => a.custo - b.custo || a.tempoMin - b.tempoMin || a.nome.localeCompare(b.nome, "pt"));
}

/* As coleções em que uma receita entra. */
export function colecoesDaReceita(receita) {
  return COLECOES.filter((c) => c.filtro(receita));
}

/*
 * Receitas parecidas: primeiro as do mesmo tipo e da mesma proteína, depois
 * as que partilham coleções. Determinístico (a página é estática).
 */
export function parecidas(receita, n = 8) {
  const minhas = new Set(colecoesDaReceita(receita).map((c) => c.slug));
  return receitas()
    .filter((r) => r.id !== receita.id && r.tipo === receita.tipo)
    .map((r) => ({
      r,
      p: (r.proteina === receita.proteina ? 3 : 0)
        + colecoesDaReceita(r).filter((c) => minhas.has(c.slug)).length
        + (r.base === receita.base ? 0.5 : 0),
    }))
    .sort((a, b) => b.p - a.p || a.r.nome.localeCompare(b.r.nome, "pt"))
    .slice(0, n)
    .map((x) => x.r);
}
