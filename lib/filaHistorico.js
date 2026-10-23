/*
 * Fila do histórico diário de preços (pages/api/cron-historico-precos).
 * Funções puras, sem imports, para se poderem testar em node.
 *
 * Uma execução do cron só chega a ~100 pesquisas: o Vercel corta a cadeia
 * de chamadas da função a si própria à 5.ª volta (resposta 508), e cada
 * volta tem 60 s. O catálogo é maior, por isso:
 *   - os populares (o cabaz) correm todos os dias, na 1.ª execução;
 *   - o resto do catálogo roda de dia para dia e é repartido pelas duas
 *     execuções diárias, para todos os artigos voltarem a ter preços
 *     dentro de 3 dias (é o que as páginas de /precos pedem para entrar
 *     no Google).
 */
export const POR_DIA = 12; // quantos populares o ponto de partida avança por dia
export const RESTO_POR_PARTE = 60; // artigos do resto que cada execução garante
export const PARTES = 2; // execuções por dia

const dia = (agora) => Math.floor(agora.getTime() / 86_400_000);

/** A lista começando `passo` posições à frente, sem perder nem repetir artigos. */
export function rodar(lista, passo) {
  if (!lista.length) return [];
  const i = ((passo % lista.length) + lista.length) % lista.length;
  return [...lista.slice(i), ...lista.slice(0, i)];
}

/* Ordem de hoje dos populares: a lista rodada, para o início variar de dia para dia. */
export function ordemDoDia(lista, agora = new Date()) {
  return rodar(lista, dia(agora) * POR_DIA);
}

/*
 * parte 1: populares e depois o resto, a começar no ponto de hoje.
 * parte 2: só o resto, a começar onde a parte 1 garante ter chegado.
 */
export function filaDoDia({ populares, resto }, agora = new Date(), parte = 1) {
  const inicio = dia(agora) * RESTO_POR_PARTE * PARTES + (parte - 1) * RESTO_POR_PARTE;
  const fim = rodar(resto, inicio);
  return parte === 1 ? [...ordemDoDia(populares, agora), ...fim] : fim;
}
