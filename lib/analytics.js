/*
 * Eventos GA4 — wrapper seguro sobre o gtag carregado em _document.js.
 * Sem gtag (SSR, bloqueador de anúncios), tudo é no-op silencioso.
 *
 * Eventos usados na app:
 *   screen_view       { screen_name }        — mudança de separador (a nav é estado React, o GA não vê rotas)
 *   sign_up           { method }             — registo concluído
 *   login             { method }             — sessão iniciada
 *   receipt_scanned   { ok }                 — talão fotografado (ativação!)
 *   share             { content_type }       — partilha (poupança, desafio, lista…)
 *   app_installed     { platform }           — PWA instalada
 *   push_subscribed   {}                     — notificações ativadas
 */
export function evento(nome, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", nome, params);
    }
  } catch (_) {}
}

export function ecra(nome) {
  evento("screen_view", { screen_name: nome });
}
