/*
 * Posição do concelho entre os do mesmo distrito, pelo gasóleo mais barato.
 * É informação própria de cada página (a posição e o total mudam de concelho
 * para concelho), ao contrário de texto igual com o nome trocado.
 */
export function rankingNoDistrito(municipio, lista, tipo = "Gasóleo") {
  const meu = municipio.baratos?.[tipo]?.preco;
  if (meu == null || !municipio.distrito) return null;
  const doDistrito = lista.filter(m => m.distrito === municipio.distrito && m.baratos?.[tipo]?.preco != null);
  if (doDistrito.length < 3) return null;
  const posicao = 1 + doDistrito.filter(m => m.baratos[tipo].preco < meu).length;
  return { tipo, posicao, total: doDistrito.length, distrito: municipio.distrito };
}
