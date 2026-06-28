import crypto from "crypto";

/*
 * Token de cancelamento (one-click unsubscribe) assinado com HMAC-SHA256.
 *
 * Permite que o link/header List-Unsubscribe funcione sem o utilizador ter
 * sessão iniciada: o token prova que o pedido é legítimo (foi gerado por nós)
 * sem expor nada sensível. Usa o CRON_SECRET como chave de assinatura.
 */

function segredo() {
  // Chave dedicada (recomendada) e independente do CRON_SECRET — assim,
  // rodar o CRON_SECRET não invalida os links de cancelamento já enviados.
  // Fallback para CRON_SECRET / service role. Nunca um literal público:
  // se nada estiver configurado, falha (fail-closed) em vez de assinar com
  // um segredo conhecido que tornaria os tokens forjáveis.
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("unsubscribeToken: nenhum segredo configurado (UNSUBSCRIBE_SECRET/CRON_SECRET).");
  return s;
}

export function gerarTokenUnsub(userId) {
  return crypto
    .createHmac("sha256", segredo())
    .update(String(userId))
    .digest("base64url");
}

export function verificarTokenUnsub(userId, token) {
  if (!userId || !token) return false;
  try {
    const esperado = gerarTokenUnsub(userId);
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
