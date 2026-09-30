/*
 * Folhetos que se abrem dentro da app.
 *
 * Só entram as cadeias cujo folheto o próprio site deixa mostrar dentro de
 * outra página (sem X-Frame-Options nem frame-ancestors a impedir). Verificado
 * a 30/09/2026. As outras (Continente, Auchan, Lidl, El Corte Inglés)
 * bloqueiam-no de propósito e continuam a abrir no site da loja.
 *
 *   viewer — o folheto vive num subdomínio próprio (folhetos.aldi.pt…), cujo
 *            link muda todas as semanas: lê-se da página de folhetos da loja.
 *   pagina — a própria página de folhetos da loja já se pode mostrar.
 */
export const EMBUTIVEIS = {
  Aldi:          { tipo: "viewer", pagina: "https://www.aldi.pt/folheto/esta-semana.html", host: "folhetos.aldi.pt" },
  "Pingo Doce":  { tipo: "viewer", pagina: "https://www.pingodoce.pt/folhetos/", host: "folhetos.pingodoce.pt" },
  "Intermarché": { tipo: "viewer", pagina: "https://www.intermarche.pt/sign/brands/catalog-page", host: "folhetos.intermarche.pt" },
  "E.Leclerc":   { tipo: "pagina", host: "www.e-leclerc.pt" },
  Froiz:         { tipo: "pagina", host: "www.froiz.pt" },
};

export const embutivel = (loja) => Object.prototype.hasOwnProperty.call(EMBUTIVEIS, loja);

/** Só se mostra dentro da app um endereço https de um dos hosts acima. */
export function urlPermitido(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && Object.values(EMBUTIVEIS).some((e) => e.host === u.hostname || (e.host === "www.e-leclerc.pt" && u.hostname === "e-leclerc.pt"));
  } catch { return false; }
}
