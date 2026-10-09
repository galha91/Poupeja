import { gerarTokenUnsub, verificarTokenUnsub } from "./unsubscribeToken";

/* O token assina "sub:<id>", para nunca coincidir com o de um utilizador. */
export function urlCancelarSub(base, id) {
  const t = gerarTokenUnsub(`sub:${id}`);
  return `${base}/api/cancelar-subscricao?s=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
}

export function tokenSubValido(id, token) {
  return verificarTokenUnsub(`sub:${id}`, token);
}
