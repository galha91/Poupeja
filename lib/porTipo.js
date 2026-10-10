/*
 * Os N postos mais baratos de CADA combustível, pela ordem em que os tipos
 * foram pedidos. A lista de entrada vem ordenada por preço com os tipos
 * misturados; cortá-la a direito dava a gasolina (mais barata) todos os
 * lugares e deixava o gasóleo com 1 ou 3 postos num concelho com dezenas.
 */
export function primeirosPorTipo(postos, tipos, n = 10) {
  return tipos.flatMap(t => postos.filter(p => p.tipoLabel === t).slice(0, n));
}
