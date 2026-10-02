/*
 * Que supermercados comparamos — fonte única.
 *
 * Tudo o que a app diz sobre cobertura sai daqui: a linha "Comparamos 5
 * supermercados", o painel "Que supermercados comparamos?", a soma da
 * lista de compras e a nota do cartão de poupança. Quando entrar uma
 * cadeia nova, muda-se aqui e o resto acompanha.
 *
 * Estados:
 *   incluida   — temos os preços de todo o sortido
 *   parcial    — temos alguns preços (o Lidl só publica as promoções)
 *   sem-precos — não comparamos; nunca se inventa nem estima um preço
 *
 * `id` é o mesmo de lib/supermercados (é ele que vem nas respostas da API).
 * `nome` é o que o LogoLoja reconhece.
 */

export const CADEIAS = [
  { id: "continente", nome: "Continente", estado: "incluida", nota: "Preços da loja online" },
  { id: "pingo-doce", nome: "Pingo Doce", estado: "incluida", nota: "Preços da loja online" },
  { id: "auchan", nome: "Auchan", estado: "incluida", nota: "Preços da loja online" },
  { id: "aldi", nome: "Aldi", estado: "incluida", nota: "Preços de loja, publicados no site" },
  { id: "lidl", nome: "Lidl", estado: "parcial", nota: "Só as promoções da semana" },
  { id: "intermarche", nome: "Intermarché", estado: "sem-precos", motivo: "Ainda não tem preços online que possamos comparar" },
  { id: "mercadona", nome: "Mercadona", estado: "sem-precos", motivo: "Não vende online em Portugal, por isso não há preços online" },
  { id: "minipreco", nome: "Minipreço", estado: "sem-precos", motivo: "Ainda não tem preços online que possamos comparar" },
  { id: "eleclerc", nome: "E.Leclerc", estado: "sem-precos", motivo: "Ainda não tem preços online que possamos comparar" },
  { id: "elcorteingles", nome: "El Corte Inglés", estado: "sem-precos", motivo: "Ainda não tem preços online que possamos comparar" },
  { id: "froiz", nome: "Froiz", estado: "sem-precos", motivo: "Ainda não tem preços online que possamos comparar" },
];

export const COMPARADAS = CADEIAS.filter((c) => c.estado !== "sem-precos");
export const NAO_INCLUIDAS = CADEIAS.filter((c) => c.estado === "sem-precos");
export const N_COMPARADAS = COMPARADAS.length;

const POR_ID = Object.fromEntries(CADEIAS.map((c) => [c.id, c]));
export const cadeia = (id) => POR_ID[id] || null;
export const nomeCadeia = (id) => POR_ID[id]?.nome || id;

/* "Continente" · "Continente e Auchan" · "Continente, Aldi e Auchan" */
export function juntarNomes(ids) {
  const nomes = ids.map(nomeCadeia);
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/* Textos curtos, para não haver duas versões da mesma frase pela app. */
export const TEXTO_COBERTURA = {
  linha: `Comparamos ${N_COMPARADAS} supermercados`,
  maisBarato: "o mais barato entre os supermercados comparados",
  estimativa: "Estimativa que considera só os supermercados comparados.",
};
