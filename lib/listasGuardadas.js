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

/* Muda o nome. Vazio, ou igual ao de outra lista, não muda nada. */
export function renomearLista(listas, id, nome) {
  const limpo = limparNome(nome);
  const outra = porNome(listas, limpo);
  if (!limpo || (outra && outra.id !== id)) return listas;
  return listas.map((l) => (l.id === id ? { ...l, nome: limpo } : l));
}

/* Troca os artigos de uma lista (editados no detalhe). Sem artigos, a lista fica, vazia. */
export function alterarArtigos(listas, id, itens, { agora = Date.now() } = {}) {
  return listas.map((l) => (l.id === id ? { ...l, itens: artigosParaGuardar(itens), atualizada: agora } : l));
}

/* Marca como usada agora e passa para o topo (as mais usadas ficam à mão). */
export function marcarUsada(listas, id, { agora = Date.now() } = {}) {
  const l = listas.find((x) => x.id === id);
  return l ? [{ ...l, usada: agora }, ...listas.filter((x) => x !== l)] : listas;
}

/*
 * "Usada hoje", "ontem", "há 3 dias"… Sem data de uso, conta a de
 * gravação ("Guardada hoje").
 */
export function quando(lista, agora = Date.now()) {
  const ts = lista?.usada || lista?.atualizada;
  if (!ts) return "";
  const verbo = lista.usada ? "Usada" : "Guardada";
  const dia = (t) => { const d = new Date(t); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5; };
  const dias = Math.max(0, Math.round(dia(agora) - dia(ts)));
  if (dias === 0) return `${verbo} hoje`;
  if (dias === 1) return `${verbo} ontem`;
  if (dias < 7) return `${verbo} há ${dias} dias`;
  if (dias < 30) { const s = Math.floor(dias / 7); return `${verbo} há ${s} ${s === 1 ? "semana" : "semanas"}`; }
  const m = Math.floor(dias / 30);
  return m < 12 ? `${verbo} há ${m} ${m === 1 ? "mês" : "meses"}` : `${verbo} há mais de um ano`;
}

export const nArtigos = (n) => (n === 1 ? "1 artigo" : `${n} artigos`);

/*
 * Põe uma lista guardada na lista de compras.
 *   juntar (por omissão): não apaga nada do que lá está; o que já está
 *     por comprar fica com a maior das duas quantidades, o resto entra
 *     no topo, por comprar.
 *   substituir: a lista de compras passa a ser só esta.
 * Devolve { itens, novos }.
 */
export function usarLista(itens, lista, { modo = "juntar", novoId = (i) => Date.now() + i + Math.random() } = {}) {
  let out = modo === "substituir" ? [] : [...itens];
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

/* A lista de compras tem exatamente os artigos desta lista guardada (para dizer "Guardada como…"). */
export function mesmaLista(lista, itens) {
  const a = new Set((lista?.itens || []).map((x) => semAcentos(x.nome)));
  const b = new Set((itens || []).map((x) => semAcentos(x.nome)).filter(Boolean));
  return a.size > 0 && a.size === b.size && [...a].every((k) => b.has(k));
}

/*
 * Listas prontas, para quem ainda não guardou nenhuma. Só nome e
 * quantidade: a categoria (e o termo de pesquisa) vêm do catálogo ao
 * usar (ver completarPronta). Os nomes são do catálogo (testado).
 */
export const LISTAS_PRONTAS = [
  {
    id: "pronta-basicos-semana",
    nome: "Básicos da semana",
    pronta: true,
    itens: [
      ["Leite meio-gordo", 6], ["Pão de forma", 1], ["Ovos", 1], ["Iogurte natural", 1], ["Manteiga", 1],
      ["Queijo flamengo", 1], ["Fiambre", 1], ["Bananas", 1], ["Maçãs", 1], ["Batatas", 1], ["Cebolas", 1],
      ["Tomate", 1], ["Alface", 1], ["Peito de frango", 1], ["Arroz carolino", 1], ["Massa esparguete", 1],
      ["Café moído", 1],
    ].map(([nome, qty]) => ({ nome, categoria: "", qty })),
  },
];

/* As prontas que ainda não estão entre as do utilizador (pelo nome). */
export const prontasPorGuardar = (listas) => LISTAS_PRONTAS.filter((p) => !porNome(listas, p.nome));

/* Uma lista pronta com a categoria, o emoji e o termo de pesquisa do catálogo. */
export function completarPronta(lista, doCatalogo) {
  if (!doCatalogo) return lista;
  return {
    ...lista,
    itens: lista.itens.map((a) => {
      const c = doCatalogo(a.nome);
      return c ? { ...a, nome: c.nome, categoria: c.categoria || a.categoria, ...(c.emoji ? { emoji: c.emoji } : {}), ...(c.q ? { q: c.q } : {}) } : a;
    }),
  };
}

/* Copia uma pronta para as listas do utilizador, para a poder editar. */
export function copiarPronta(listas, pronta, opcoes) {
  return guardarLista(listas, pronta.nome, pronta.itens, opcoes);
}
