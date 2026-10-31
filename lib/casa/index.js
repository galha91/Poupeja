import { leroy } from "./leroy.js";
import { ikea } from "./ikea.js";

/*
 * Lojas de casa e bricolagem. Usam o mesmo motor de pesquisa dos
 * supermercados (pesquisarTudo): o mesmo artigo em todas as lojas ao
 * mesmo tempo, comparado pelo preço por unidade (€/lâmpada, €/L, €/m²).
 *
 * Fora, por agora: o Bricomarché recusa pedidos (HTTP 403 a 31/10/2026).
 */
export const LOJAS_CASA = [leroy, ikea];
