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
 *   conta_renovacao_registada { tipo }      — conta que renova (eletricidade, gas, telecom, seguro)
 *   erse_aberto       { tipo }               — abriu o simulador oficial da ERSE
 *   erse_resultado_guardado { tipo }         — guardou o valor anual que lá encontrou
 *   garantia_registada { estado_bem, com_foto, meses } — compra com garantia registada
 *   garantia_exportada { formato, via }      — ficha da compra partilhada/descarregada
 *   lembrete_ativado  { tipo }               — conta | garantia | prazo
 *   calendario_exportado { tipo }            — lembretes exportados em .ics
 *   prazos_filtro     { perfis }             — n.º de perfis escolhidos nos prazos do Estado
 *   copia_seguranca   { acao }               — exportar | restaurar
 *   (nunca valores, nomes de produtos, datas ou dados pessoais — só a ação)
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
