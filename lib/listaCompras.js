
/*
 * Lógica da lista de compras, sem React: o ecrã (SecaoListaCompras) só
 * desenha o que sai daqui. O formato de cada artigo não muda — é o que
 * está no localStorage (poupeja_lista_compras) e na lista partilhada:
 *   { id, nome, emoji, categoria, qty, feito }
 *
 * Não importa o catálogo (lib/catalogoLista): esse é maior e só faz falta
 * ao escrever, por isso o ecrã descarrega-o à parte, a pedido.
 */

export const semAcentos = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

/* A ordem do catálogo (testado contra lib/catalogoLista e data/catalogo-lista). */
export const CATEGORIAS = ["Frutas e legumes", "Talho", "Peixaria", "Charcutaria e queijos", "Padaria", "Laticínios e ovos",
  "Mercearia", "Conservas", "Bebidas", "Congelados", "Higiene", "Limpeza", "Bebé", "Animais"];

/*
 * Categorias do catálogo antigo, para as listas já guardadas não irem
 * parar todas a "Outros". (O catálogo, quando carrega, acerta pelo nome:
 * o fiambre que estava em "Carnes" passa a "Charcutaria e queijos".)
 */
export const CATEGORIA_ANTIGA = {
  "Frutas": "Frutas e legumes", "Legumes": "Frutas e legumes", "Laticínios & Ovos": "Laticínios e ovos",
  "Carnes": "Talho", "Peixe & Marisco": "Peixaria", "Snacks": "Mercearia", "Bebé & Criança": "Bebé",
};

export const OUTROS = "Outros";

/* A comparação da lista pesquisa no máximo estes artigos (o servidor limita pesquisas por minuto). */
export const MAX_ARTIGOS = 25;

/* Categoria do artigo, ou "Outros" (o catálogo preenche as que faltam: ver preencherCategorias). */
export function categoriaDe(item) {
  const c = CATEGORIA_ANTIGA[item?.categoria] || item?.categoria;
  return c && CATEGORIAS.includes(c) ? c : OUTROS;
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
export function adicionar(itens, nome, { id = Date.now() + Math.random(), doCatalogo = () => null, categoria = "" } = {}) {
  const limpo = String(nome || "").replace(/\s+/g, " ").trim();
  if (!limpo) return itens;
  const cat = doCatalogo(limpo);
  const final = cat ? cat.nome : limpo.charAt(0).toUpperCase() + limpo.slice(1);
  const existe = itens.find((i) => !i.feito && semAcentos(i.nome) === semAcentos(final));
  if (existe) return itens.map((i) => (i === existe ? { ...i, qty: (i.qty || 1) + 1 } : i));
  // Fora do catálogo ("Outro…" numa categoria), fica com a categoria onde foi escrito.
  const cat2 = cat?.categoria || (CATEGORIAS.includes(categoria) ? categoria : "");
  // q: o termo de pesquisa do preço, quando o catálogo o sabe (para a comparação).
  return [{ id, nome: final, emoji: cat?.emoji || "", categoria: cat2, qty: 1, feito: false, ...(cat?.q ? { q: cat.q } : {}) }, ...itens];
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

/*
 * "Já comparaste": as pesquisas do Comparar preços, prontas a juntar.
 * Não precisa do catálogo (ao juntar, o nome é acertado por ele).
 */
export function jaComparados(comparados = [], max = 6) {
  const vistos = new Set();
  const out = [];
  for (const q of comparados) {
    const nome = String(q || "").trim();
    const k = semAcentos(nome);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    out.push({ nome: nome.charAt(0).toUpperCase() + nome.slice(1), origem: "comparados" });
  }
  return out.slice(0, max);
}

/* Para começar uma lista vazia: o que quase toda a gente compra (nomes do catálogo). */
export const FREQUENTES = ["Leite meio-gordo", "Pão de forma", "Ovos", "Bananas", "Arroz carolino", "Azeite", "Café moído", "Iogurte natural"];

/*
 * Da época (mês de 1 a 12): entram nas sugestões da lista vazia só nesses
 * meses. Os nomes são do catálogo (testado). Poucos, para não fazer ruído.
 */
export const DA_EPOCA = {
  "Castanhas": [10, 11, 12],
  "Bolo-rei": [11, 12, 1],
  "Couve galega": [10, 11, 12, 1, 2],
  "Borrego": [3, 4],
  "Cerejas": [5, 6],
  "Morangos": [3, 4, 5, 6],
  "Sardinha": [6, 7, 8],
  "Melancia": [6, 7, 8, 9],
};
export const daEpoca = (mes) => Object.keys(DA_EPOCA).filter((n) => DA_EPOCA[n].includes(mes));

/*
 * Sugestões da lista vazia: o que já se comparou, um ou dois artigos da
 * época e, a seguir, os frequentes, sem repetir.
 */
export function sugestoesIniciais(comparados = [], max = 8, mes = new Date().getMonth() + 1) {
  const ja = jaComparados(comparados, max);
  const vistos = new Set(ja.map((s) => semAcentos(s.nome)));
  const epoca = daEpoca(mes).filter((n) => !vistos.has(semAcentos(n))).slice(0, 2).map((nome) => ({ nome, origem: "epoca" }));
  epoca.forEach((s) => vistos.add(semAcentos(s.nome)));
  const freq = FREQUENTES.filter((n) => !vistos.has(semAcentos(n))).map((nome) => ({ nome, origem: "frequentes" }));
  return [...ja, ...epoca, ...freq].slice(0, max);
}
