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
 *   lista_criada      { origem }             — primeiro artigo de uma lista vazia
 *   comparar_lista    { artigos }            — lista otimizada calculada
 *   lista_escolha     { plano, lojas, poupanca } — "Vou comprar no…" (poupança estimada)
 *   alerta_preco_criado   { q, tipo, origem } — alerta/vigia ativado
 *   alerta_preco_removido { q, origem }       — alerta/vigia desativado
 *   cobertura_ver     {}                     — abriu "Que supermercados comparamos?"
 *   sugerir_supermercado { cadeia }          — pediu uma cadeia ainda não incluída
 *   (o cartão partilhável vai em share { content_type: "cartao_poupanca" })
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
