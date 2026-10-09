/*
 * Consentimento de cookies de medição (Google Analytics) e afiliação (Awin).
 * Sem escolha, nada grava cookies: o GA arranca em modo "negado" (sem
 * cookies) e o Awin nem é carregado.
 */
const CHAVE = "poupeja_cookies";
const AWIN = "https://www.dwin1.com/pub.2930079.min.js";

export function escolhaCookies() {
  try { return localStorage.getItem(CHAVE); } catch { return null; } // "sim" | "nao" | null
}

function carregarAwin() {
  if (typeof document === "undefined" || document.querySelector(`script[src="${AWIN}"]`)) return;
  const s = document.createElement("script");
  s.src = AWIN; s.defer = true;
  document.body.appendChild(s);
}

export function aplicarEscolha(escolha) {
  try { localStorage.setItem(CHAVE, escolha); } catch {}
  if (escolha === "sim") {
    try {
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
    } catch {}
    carregarAwin();
  }
}

/** Arranque: quem já aceitou antes volta a ter Awin. */
export function retomarEscolha() {
  if (escolhaCookies() === "sim") carregarAwin();
}
