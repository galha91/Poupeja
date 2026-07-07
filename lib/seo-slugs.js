import dadosFolhetos from "../public/folhetos.json";

/*
 * Slugs partilhados pelas páginas públicas de SEO (nível 2) e pelo sitemap.
 * Fonte única para não haver deriva entre /folhetos/[loja],
 * /combustiveis/[cidade] e o sitemap.xml.
 */

// "El Corte Inglés" → "el-corte-ingles", "E.Leclerc" → "e-leclerc"
export function slugify(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Logótipos em /public/logos/{key}.svg (chave ≠ slug: sem hífenes)
export const LOGO = {
  "Continente": "continente", "Pingo Doce": "pingodoce", "Lidl": "lidl",
  "Aldi": "aldi", "Auchan": "auchan", "Intermarché": "intermarche",
  "Froiz": "froiz", "E.Leclerc": "eleclerc", "El Corte Inglés": "elcorteingles",
};

// Lojas com folheto, derivadas de public/folhetos.json
export const LOJAS_SLUGS = (dadosFolhetos.folhetos || []).map(f => ({
  slug: slugify(f.loja),
  loja: f.loja,
}));

// Cidades com página própria em /combustiveis/[cidade]
export const CIDADES = [
  { slug: "lisboa",    nome: "Lisboa",    lat: 38.7223, lon: -9.1393 },
  { slug: "porto",     nome: "Porto",     lat: 41.1579, lon: -8.6291 },
  { slug: "braga",     nome: "Braga",     lat: 41.5454, lon: -8.4265 },
  { slug: "coimbra",   nome: "Coimbra",   lat: 40.2033, lon: -8.4103 },
  { slug: "aveiro",    nome: "Aveiro",    lat: 40.6405, lon: -8.6538 },
  { slug: "setubal",   nome: "Setúbal",   lat: 38.5244, lon: -8.8882 },
  { slug: "faro",      nome: "Faro",      lat: 37.0194, lon: -7.9322 },
  { slug: "leiria",    nome: "Leiria",    lat: 39.7436, lon: -8.8071 },
  { slug: "viseu",     nome: "Viseu",     lat: 40.6566, lon: -7.9125 },
  { slug: "evora",     nome: "Évora",     lat: 38.5714, lon: -7.9135 },
  { slug: "guimaraes", nome: "Guimarães", lat: 41.4425, lon: -8.2918 },
  { slug: "funchal",   nome: "Funchal",   lat: 32.6669, lon: -16.9241 },
];
