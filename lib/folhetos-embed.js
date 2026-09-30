/*
 * Folhetos que se abrem dentro da app.
 *
 * Só entram as cadeias cujo folheto vive num site próprio que o deixa ser
 * mostrado dentro de outra página (sem X-Frame-Options nem frame-ancestors a
 * impedir) e que mostra só o folheto: um leitor de páginas, sem menus. O
 * endereço muda todas as semanas (folhetos.aldi.pt/2026/s40/…) e lê-se da
 * página de folhetos da loja (lib/folhetos-viewer). Verificado a 30/09/2026.
 *
 * Ficam de fora, a abrir no site da loja:
 *   Continente, Auchan, Lidl, El Corte Inglés — bloqueiam-no de propósito.
 *   E.Leclerc, Froiz — deixam, mas a página é o site inteiro: menus, anúncios,
 *   pop-up de newsletter e avisos de cookies dentro da app. Pior do que abrir
 *   no browser.
 */
export const EMBUTIVEIS = {
  Aldi:          { pagina: "https://www.aldi.pt/folheto/esta-semana.html", host: "folhetos.aldi.pt" },
  "Pingo Doce":  { pagina: "https://www.pingodoce.pt/folhetos/", host: "folhetos.pingodoce.pt" },
  "Intermarché": { pagina: "https://www.intermarche.pt/sign/brands/catalog-page", host: "folhetos.intermarche.pt" },
};

export const embutivel = (loja) => Object.prototype.hasOwnProperty.call(EMBUTIVEIS, loja);

/** Só se mostra dentro da app um endereço https de um dos hosts acima. */
export function urlPermitido(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && Object.values(EMBUTIVEIS).some((e) => e.host === u.hostname);
  } catch { return false; }
}
