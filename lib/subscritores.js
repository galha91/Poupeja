/* Subscritores do resumo de folhetos que não têm conta. */

const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function emailValido(email) {
  return typeof email === "string" && email.length <= 254 && RE_EMAIL.test(email.trim());
}

export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

