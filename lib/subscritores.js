/* Subscritores do resumo de folhetos que não têm conta. */

const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function emailValido(email) {
  return typeof email === "string" && email.length <= 254 && RE_EMAIL.test(email.trim());
}

export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}


/* Slug de concelho tal como o gera lib/seo-slugs (minúsculas, números, hífens). */
export function slugConcelhoValido(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
}
