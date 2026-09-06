import dadosFolhetos from "../public/folhetos.json";
import { EMENTAS } from "./ementas-data";

/*
 * Slugs partilhados pelas páginas públicas de SEO (nível 2) e pelo sitemap.
 * Fonte única para não haver deriva entre /folhetos/[loja],
 * /combustiveis/[cidade], /receitas/[id] e o sitemap.xml.
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

// Receitas com página própria em /receitas/[id] (os ids já são slugs)
export const RECEITAS_SLUGS = EMENTAS.map(e => ({ slug: e.id, nome: e.nome }));

/* As cidades deixaram de estar aqui: as páginas de /combustiveis/[cidade]
   passaram a ser por CONCELHO e a lista sai dos próprios dados da DGEG,
   em lib/municipios.js. Uma lista à mão significava coordenadas escritas
   por mim, e páginas para concelhos que a DGEG nem cobre. */
