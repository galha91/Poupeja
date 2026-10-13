/*
 * "El Corte Inglés" → "el-corte-ingles", "Vila Nova de Gaia" → "vila-nova-de-gaia".
 *
 * Ficheiro à parte para o cliente o poder importar sem levar consigo
 * lib/seo-slugs (que traz os folhetos e as ementas inteiras). As páginas
 * de concelho e o Início têm de chegar ao MESMO slug.
 */
export function slugify(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
