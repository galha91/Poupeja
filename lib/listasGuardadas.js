/*
 * Listas guardadas: a semanal, a mensal, a do churrasco… Em vez de fazer
 * a lista de base todas as vezes, guarda-se uma vez e depois junta-se de
 * um toque à lista de compras.
 *
 * Ficam no localStorage (poupeja_listas_guardadas) e sincronizam com a
 * conta (lib/sync). Cada uma:
 *   { id, nome, itens: [{ nome, categoria, qty, emoji?, q? }], atualizada }
 * Os artigos guardam-se sem id nem "feito": ganham-nos ao entrar na lista.
 */

import { semAcentos, limitarQty } from "./listaCompras.js";

export const LS_LISTAS_GUARDADAS = "poupeja_listas_guardadas";

/* Chegam e sobram; e o localStorage (e a linha sincronizada) não crescem sem fim. */
export const MAX_LISTAS = 20;
export const MAX_ARTIGOS_LISTA = 150;
export const MAX_NOME = 40;

/* Nomes que quase toda a gente quer: aparecem como atalho ao dar nome. */
export const NOMES_SUGERIDOS = ["Semanal", "Mensal", "Fim de semana"];

export const limparNome = (nome) => String(nome || "").replace(/\s+/g, " ").trim().slice(0, MAX_NOME);

/* A lista guardada com este nome (sem olhar a acentos nem maiúsculas), ou null. */
export function porNome(listas, nome) {
  const k = semAcentos(limparNome(nome));
  return (k && listas.find((l) => semAcentos(l.nome) === k)) || null;
}

/* O que se guarda de cada artigo: um por nome, com a maior quantidade. */
function artigosParaGuardar(itens) {
  const out = new Map();
  for (const it of itens || []) {
    const nome = String(it?.nome || "").trim();
    const k = semAcentos(nome);
    if (!k) continue;
    const qty = limitarQty(it.qty || 1);
    if (out.has(k)) { const a = out.get(k); a.qty = Math.max(a.qty, qty); continue; }
    out.set(k, { nome, categoria: it.categoria || "", qty, ...(it.emoji ? { emoji: it.emoji } : {}), ...(it.q ? { q: it.q } : {}) });
  }
  return [...out.values()].slice(0, MAX_ARTIGOS_LISTA);
}

/*
 * Guarda os artigos (por comprar e comprados: guardar depois das compras
 * também tem de dar) com este nome. Se já há uma com o mesmo nome, é
 * atualizada e passa para o topo. Devolve a nova coleção.
 */
export function guardarLista(listas, nome, itens, { id = `l${Date.now().toString(36)}`, agora = Date.now() } = {}) {
  const limpo = limparNome(nome);
  const artigos = artigosParaGuardar(itens);
  if (!limpo || !artigos.length) return listas;
  const existe = porNome(listas, limpo);
  const nova = { id: existe?.id || id, nome: limpo, itens: artigos, atualizada: agora };
  return [nova, ...listas.filter((l) => l !== existe)].slice(0, MAX_LISTAS);
}

export function apagarLista(listas, id) {
  return listas.filter((l) => l.id !== id);
}

/*
 * Junta uma lista guardada à lista de compras, sem apagar nada do que lá
 * está: o que já está por comprar fica com a maior das duas quantidades;
 * o resto entra no topo, por comprar. Devolve { itens, novos }.
 */
export function usarLista(itens, lista, { novoId = (i) => Date.now() + i + Math.random() } = {}) {
  let out = [...itens];
  const novos = [];
  (lista?.itens || []).forEach((a, i) => {
    const k = semAcentos(a.nome);
    const existe = out.find((x) => !x.feito && semAcentos(x.nome) === k);
    const qty = limitarQty(a.qty || 1);
    if (existe) {
      if (qty > (existe.qty || 1)) out = out.map((x) => (x === existe ? { ...x, qty } : x));
      return;
    }
    novos.push({ id: novoId(i), nome: a.nome, emoji: a.emoji || "", categoria: a.categoria || "", qty, feito: false, ...(a.q ? { q: a.q } : {}) });
  });
  return { itens: [...novos, ...out], novos: novos.length };
}

/* Lê o que estiver guardado, deitando fora o que não tiver forma de lista. */
export function validarListas(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.filter((l) => l && typeof l === "object" && l.id && limparNome(l.nome) && Array.isArray(l.itens));
}
