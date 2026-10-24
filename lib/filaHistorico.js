/*
 * Fila do histórico diário de preços (pages/api/cron-historico-precos).
 * Funções puras, sem imports, para se poderem testar em node.
 *
 * Uma execução do cron só chega a ~60 pesquisas: o Vercel corta a cadeia
 * de chamadas da função a si própria à 5.ª volta (resposta 508) e cada
 * volta tem de acabar nos 30 s da função. O catálogo é maior, por isso:
 *   - os populares (o cabaz) correm todos os dias, na 1.ª execução;
 *   - o resto do catálogo roda de dia para dia e é repartido por três
 *     execuções diárias, para todos os artigos voltarem a ter preços
 *     dentro de 3 dias (é o que as páginas de /precos pedem para entrar
 *     no Google).
 */
export const POR_DIA = 12; // quantos populares o ponto de partida avança por dia
// Artigos do resto que cada execução garante (a 1.ª gasta ~38 nos populares).
export const RESTO_POR_PARTE = [20, 50, 50];
export const PARTES = RESTO_POR_PARTE.length;
const RESTO_POR_DIA = RESTO_POR_PARTE.reduce((a, b) => a + b, 0);

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
 * partes 2 e 3: só o resto, a começar onde a parte anterior garante ter
 * chegado.
 */
export function filaDoDia({ populares, resto }, agora = new Date(), parte = 1) {
  const antes = RESTO_POR_PARTE.slice(0, parte - 1).reduce((a, b) => a + b, 0);
  const fim = rodar(resto, dia(agora) * RESTO_POR_DIA + antes);
  return parte === 1 ? [...ordemDoDia(populares, agora), ...fim] : fim;
}
