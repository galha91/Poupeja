import { gerarTokenUnsub, verificarTokenUnsub } from "./unsubscribeToken";

/* O token assina "sub:<id>", para nunca coincidir com o de um utilizador. */
export function urlCancelarSub(base, id) {
  const t = gerarTokenUnsub(`sub:${id}`);
  return `${base}/api/cancelar-subscricao?s=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
}

export function tokenSubValido(id, token) {
  return verificarTokenUnsub(`sub:${id}`, token);
}

/* Email de combustível: o token assina "comb:<id>", distinto dos outros. */
export function urlCancelarComb(base, id) {
  const t = gerarTokenUnsub(`comb:${id}`);
  return `${base}/api/cancelar-combustivel?s=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
}

export function tokenCombValido(id, token) {
  return verificarTokenUnsub(`comb:${id}`, token);
}
