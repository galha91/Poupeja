/*
 * Catálogo da lista de compras, no formato que o ecrã da lista usa.
 *
 * Os dados vivem em data/catalogo-lista.js (um ficheiro simples de editar:
 * nome, unidade, termo de pesquisa do preço, sinónimos). Aqui só se monta
 * a forma { categoria: { items } } e as funções de procura.
 *
 * O campo `emoji` fica vazio: o ecrã da lista já não mostra emojis, mas
 * os artigos mantêm o mesmo formato no localStorage e na lista partilhada.
 *
 * Usado pelo autocomplete da lista e pelas sugestões do "Comparar preços".
 */

import { semAcentos } from "./listaCompras.js";
import { CATEGORIAS as DADOS, ITENS } from "../data/catalogo-lista.js";
import { pesquisarCatalogo } from "./pesquisaCatalogo.js";
export { semAcentos };

export const CATS = Object.fromEntries(DADOS.map((c) => [c.nome, {
  items: ITENS.filter((i) => i.cat === c.id).map((i) => ({ nome: i.nome, emoji: "", q: i.q, un: i.un, sin: i.sin })),
}]));

export const CATEGORIAS = Object.keys(CATS);

/* Exemplo do campo "Outro" de cada categoria (data/catalogo-lista.js). */
export const EXEMPLO_OUTRO = Object.fromEntries(DADOS.map((c) => [c.nome, c.outro]));
export const NOMES_ARTIGOS = ITENS.map((i) => i.nome);

const NOME_CAT = Object.fromEntries(DADOS.map((c) => [c.id, c.nome]));
const COM_CATEGORIA = ITENS.map((i) => ({ ...i, emoji: "", categoria: NOME_CAT[i.cat] }));
const POR_NOME = new Map();
for (const it of COM_CATEGORIA) if (!POR_NOME.has(semAcentos(it.nome))) POR_NOME.set(semAcentos(it.nome), it);

/*
 * O artigo do catálogo com este nome (sem olhar a maiúsculas nem acentos), ou null.
 * Só pelo nome: "leite" não passa a "Leite meio-gordo" sem a pessoa escolher.
 */
export function doCatalogo(nome) {
  return POR_NOME.get(semAcentos(nome)) || null;
}

/*
 * Os artigos sem categoria (vindos do Comparar, ou de versões antigas) ou
 * com uma categoria que já não existe ("Frutas", "Carnes"…) ganham a do
 * catálogo, se o nome coincidir. Devolve a mesma lista se nada mudar.
 */
export function preencherCategorias(itens) {
  let mudou = false;
  const out = itens.map((i) => {
    if (i.categoria && CATEGORIAS.includes(i.categoria)) return i;
    const c = doCatalogo(i.nome);
    if (!c || c.categoria === i.categoria) return i;
    mudou = true;
    return { ...i, categoria: c.categoria };
  });
  return mudou ? out : itens;
}

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/*
 * Sugestões do campo "Adicionar artigo…".
 * Sem texto: o que já se comparou ("Já comparaste"). Com texto: os já
 * comparados que correspondem vêm à frente (são nomes que as lojas
 * reconhecem de certeza), depois o catálogo pela pesquisa tolerante
 * (sem acentos, singular/plural, erros leves, sinónimos).
 */
export function sugerir(texto, { comparados = [], max = 6 } = {}) {
  const t = semAcentos(texto);
  const vistos = new Set();
  const ja = [];
  for (const q of comparados) {
    const nome = doCatalogo(q)?.nome || maiuscula(String(q).trim());
    const k = semAcentos(nome);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    ja.push({ nome, origem: "comparados" });
  }
  if (!t) return ja.slice(0, max);
  const jaQueCasam = ja.filter((s) => semAcentos(s.nome).includes(t) || pesquisarCatalogo(texto, [{ nome: s.nome }]).length);
  const doCat = pesquisarCatalogo(texto, COM_CATEGORIA, max * 2)
    .filter((i) => !vistos.has(semAcentos(i.nome)))
    .map((i) => ({ nome: i.nome, origem: "catalogo" }));
  return [...jaQueCasam, ...doCat].slice(0, max);
}
