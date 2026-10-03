/*
 * O último "onde fica mais barata" da lista, para o bloco de baixo do
 * ecrã da lista e para o cartão do Início.
 *
 * Só vale para a mesma lista (mesmos artigos e quantidades) e durante
 * 3 horas: depois disso os preços podem ter mudado e volta a pedir-se
 * para comparar (a comparação vai sempre buscar os preços de agora). Fica só neste dispositivo.
 */

export const LS_RESUMO_LISTA = "poupeja_lista_resumo";
export const VALIDADE_MS = 3 * 60 * 60 * 1000;

/* Artigos e quantidades, sem ordem nem maiúsculas, num hash curto. */
export function chaveDaLista(pendentes) {
  const s = pendentes.map((i) => `${String(i.nome).toLowerCase().trim()}×${i.qty || 1}`).sort().join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function resumoValido(guardado, pendentes, agora = Date.now()) {
  if (!guardado || !pendentes?.length) return null;
  if (guardado.chave !== chaveDaLista(pendentes)) return null;
  if (!(agora - guardado.em >= 0 && agora - guardado.em < VALIDADE_MS)) return null;
  return guardado;
}

export function lerResumo(pendentes, agora = Date.now()) {
  try { return resumoValido(JSON.parse(localStorage.getItem(LS_RESUMO_LISTA) || "null"), pendentes, agora); } catch { return null; }
}

/* resumo: { loja, nome, total, poupanca, artigos } — ou null quando não houve preços. */
export function guardarResumo(pendentes, resumo, agora = Date.now()) {
  const r = resumo ? { ...resumo, chave: chaveDaLista(pendentes), em: agora } : null;
  try {
    if (r) localStorage.setItem(LS_RESUMO_LISTA, JSON.stringify(r));
    else localStorage.removeItem(LS_RESUMO_LISTA);
  } catch {}
  return r;
}
