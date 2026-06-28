import crypto from "crypto";

/*
 * Validação do header Authorization dos endpoints protegidos por CRON_SECRET,
 * com comparação em tempo constante (evita timing attacks ao segredo).
 *
 * Devolve true apenas se o header for exatamente "Bearer <CRON_SECRET>".
 */
export function bearerValido(authHeader, secret) {
  if (!secret) return false;
  const esperado = `Bearer ${secret}`;
  const recebido = String(authHeader || "");
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  // timingSafeEqual exige comprimentos iguais; a verificação de comprimento
  // não revela o segredo (só o seu tamanho, que é fixo).
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
