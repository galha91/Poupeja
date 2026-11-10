/* Subscritores do resumo de folhetos que não têm conta. */

/*
 * Sem % * , ( ) ; : < > [ ] \ " — nenhum email real os usa, e alguns são
 * caracteres especiais nos filtros do Supabase (o % — e o *, que o Supabase lê como % — é "qualquer coisa" num
 * ilike: "%@gmail.com" apanhava os subscritores de outras pessoas).
 */
const RE_EMAIL = /^[^\s@%*,();:<>[\]\\"]+@[^\s@.%*,();:<>[\]\\"']+(\.[^\s@.%*,();:<>[\]\\"']+)+$/;

export function emailValido(email) {
  return typeof email === "string" && email.length <= 254 && RE_EMAIL.test(email.trim());
}

export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/*
 * Email → padrão para .ilike("email", …) que só apanha ESSE email.
 * No LIKE, "_" é "um carácter qualquer" e "%" é "qualquer coisa": sem isto,
 * "ana_silva@x.pt" apanhava também "anaXsilva@x.pt". O ilike fica (para não
 * depender de maiúsculas guardadas no passado), mas literal.
 */
export function padraoEmail(email) {
  return normalizarEmail(email).replace(/[\\%_]/g, (c) => "\\" + c);
}


/* Slug de concelho tal como o gera lib/seo-slugs (minúsculas, números, hífens). */
export function slugConcelhoValido(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
}
