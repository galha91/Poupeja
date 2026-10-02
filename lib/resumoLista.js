import { chaveLista } from "./poupancaListas.js";

/*
 * O último "onde fica mais barata" da lista, para o bloco de baixo do
 * ecrã da lista e para o cartão do Início.
 *
 * Só vale para a mesma lista (mesmos artigos e quantidades) e durante
 * um dia: depois disso os preços podem ter mudado e volta a pedir-se
 * para comparar. Fica só neste dispositivo.
 */

export const LS_RESUMO_LISTA = "poupeja_lista_resumo";
export const VALIDADE_MS = 24 * 60 * 60 * 1000;

export const chaveDaLista = (pendentes) => chaveLista(pendentes.map((i) => `${i.nome}×${i.qty || 1}`));

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
