import { continente, pingoDoce, auchan } from "../supermercados/sfcc";
import { apolonia } from "../supermercados/apolonia";
import { ikea } from "./ikea.js";

/*
 * Lojas de casa e bricolagem. Usam o mesmo motor de pesquisa dos
 * supermercados (pesquisarTudo): o mesmo artigo em todas as lojas ao
 * mesmo tempo, comparado pelo preço por unidade (€/lâmpada, €/L).
 *
 * Os supermercados com loja online também vendem casa (lâmpadas, pilhas,
 * extensões…): entram aqui. Lidl e Aldi não (não têm estes artigos online).
 *
 * Fora, a 31/10/2026, porque recusam pedidos do servidor do PoupeJá:
 *   - Leroy Merlin (HTTP 403 a partir do Vercel; o leitor está em
 *     ./leroy.js e testado, pronto para quando houver acesso autorizado);
 *   - Bricomarché (HTTP 403).
 * Não se contorna um bloqueio: a decisão é da loja.
 */
export const LOJAS_CASA = [continente, pingoDoce, auchan, apolonia, ikea];
