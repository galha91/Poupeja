import crypto from "crypto";

/*
 * Token de cancelamento (one-click unsubscribe) assinado com HMAC-SHA256.
 *
 * Permite que o link/header List-Unsubscribe funcione sem o utilizador ter
 * sessão iniciada: o token prova que o pedido é legítimo (foi gerado por nós)
 * sem expor nada sensível. Usa o CRON_SECRET como chave de assinatura.
 */

function segredo() {
  // Reutiliza o CRON_SECRET; em último caso usa a service role key.
  return process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "poupeja-fallback";
}

export function gerarTokenUnsub(userId) {
  return crypto
    .createHmac("sha256", segredo())
    .update(String(userId))
    .digest("base64url");
}

export function verificarTokenUnsub(userId, token) {
  if (!userId || !token) return false;
  const esperado = gerarTokenUnsub(userId);
  try {
    const a = Buffer.from(esperado);
    const b = Buffer.from(String(token));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** URL completo de cancelamento para um utilizador. */
export function urlUnsub(base, userId) {
  const t = gerarTokenUnsub(userId);
  return `${base}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(t)}`;
}
