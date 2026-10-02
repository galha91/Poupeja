import { CATEGORIAS, NOMES_ARTIGOS, doCatalogo, semAcentos } from "./catalogoLista.js";

/*
 * Lógica da lista de compras, sem React: o ecrã (SecaoListaCompras) só
 * desenha o que sai daqui. O formato de cada artigo não muda — é o que
 * está no localStorage (poupeja_lista_compras) e na lista partilhada:
 *   { id, nome, emoji, categoria, qty, feito }
 */

export const OUTROS = "Outros";

/* Categoria do artigo: a que traz, ou a do catálogo pelo nome (os do Comparar vêm sem). */
export function categoriaDe(item) {
  if (item?.categoria && CATEGORIAS.includes(item.categoria)) return item.categoria;
  return doCatalogo(item?.nome)?.categoria || OUTROS;
}

/*
 * Agrupa por categoria, pela ordem do catálogo, "Outros" no fim. Com uma
 * só categoria não há títulos: devolve um grupo sem nome.
 */
export function agruparPorCategoria(itens) {
  const grupos = new Map();
  for (const it of itens) {
    const c = categoriaDe(it);
    if (!grupos.has(c)) grupos.set(c, []);
    grupos.get(c).push(it);
  }
  if (grupos.size < 2) return itens.length ? [{ categoria: null, itens: [...itens] }] : [];
  const ordem = [...CATEGORIAS, OUTROS];
  return [...grupos.entries()]
    .sort(([a], [b]) => ordem.indexOf(a) - ordem.indexOf(b))
    .map(([categoria, its]) => ({ categoria, itens: its }));
}

/*
 * Junta um artigo. Se já está por comprar, soma 1 à quantidade. O nome
 * escrito à mão passa a ser o do catálogo quando coincide ("leite
 * meio gordo" → "Leite meio-gordo"), e ganha a categoria.
 */
export function adicionar(itens, nome, id = Date.now() + Math.random()) {
  const limpo = String(nome || "").replace(/\s+/g, " ").trim();
  if (!limpo) return itens;
  const cat = doCatalogo(limpo);
  const final = cat ? cat.nome : limpo.charAt(0).toUpperCase() + limpo.slice(1);
  const existe = itens.find((i) => !i.feito && semAcentos(i.nome) === semAcentos(final));
  if (existe) return itens.map((i) => (i === existe ? { ...i, qty: (i.qty || 1) + 1 } : i));
  return [{ id, nome: final, emoji: cat?.emoji || "", categoria: cat?.categoria || "", qty: 1, feito: false }, ...itens];
}

export function alterarQty(itens, id, delta) {
  return itens.map((i) => (i.id === id ? { ...i, qty: Math.min(99, Math.max(1, (i.qty || 1) + delta)) } : i));
}

/* Tira artigos e guarda onde estavam, para o "Anular". */
export function retirar(itens, ids) {
  const alvo = new Set(ids);
  const removidos = [];
  itens.forEach((item, indice) => { if (alvo.has(item.id)) removidos.push({ item, indice }); });
  return { itens: itens.filter((i) => !alvo.has(i.id)), removidos };
}

/*
 * Anular: volta a pôr os artigos no sítio de onde saíram. Se entretanto a
 * lista mudou (outra pessoa na lista partilhada), o que já lá estiver não
 * se duplica e o resto entra o mais perto possível da posição original.
 */
export function repor(itens, removidos) {
  const ids = new Set(itens.map((i) => i.id));
  const out = [...itens];
  for (const { item, indice } of [...removidos].sort((a, b) => a.indice - b.indice)) {
    if (ids.has(item.id)) continue;
    out.splice(Math.min(indice, out.length), 0, item);
    ids.add(item.id);
  }
  return out;
}

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/*
 * Sugestões do campo "Adicionar artigo…".
 * Sem texto: o que já se comparou ("Já comparaste"). Com texto: primeiro
 * os nomes que começam pelo que se escreveu, depois os que têm uma palavra
 * a começar assim, depois os que o contêm. Os já comparados vêm à frente
 * em cada nível — são nomes que as lojas reconhecem de certeza.
 */
export function sugerir(texto, { comparados = [], max = 6 } = {}) {
  const t = semAcentos(texto);
  const vistos = new Set();
  const candidatos = [];
  for (const q of comparados) {
    const nome = doCatalogo(q)?.nome || maiuscula(String(q).trim());
    const k = semAcentos(nome);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    candidatos.push({ nome, origem: "comparados" });
  }
  if (!t) return candidatos.slice(0, max);
  for (const nome of NOMES_ARTIGOS) {
    const k = semAcentos(nome);
    if (vistos.has(k)) continue;
    vistos.add(k);
    candidatos.push({ nome, origem: "catalogo" });
  }
  const nivel = (nome) => {
    const k = semAcentos(nome);
    if (k.startsWith(t)) return 0;
    if (k.split(" ").some((p) => p.startsWith(t))) return 1;
    if (k.includes(t)) return 2;
    return -1;
  };
  return candidatos
    .map((c, i) => ({ ...c, n: nivel(c.nome), i }))
    .filter((c) => c.n >= 0)
    .sort((a, b) => a.n - b.n || a.i - b.i)
    .slice(0, max)
    .map(({ nome, origem }) => ({ nome, origem }));
}
