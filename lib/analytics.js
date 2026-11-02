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
 *   push_soft         { passo, resultado? }  — convite aos avisos: mostrado | ativar | agora_nao | resultado
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
 *   inicio_combustivel { acao, nivel }      — herói do gasóleo: localizar | ver_postos | guardar_talao | email_abrir; nivel = pais | aproximada | exata
 *   comparar_exemplo  { q }                  — o Mercado abriu com o exemplo do dia (não é pesquisa da pessoa)
 *   desconto_combustivel { acao }            — adicionar | remover ("o meu desconto" na Mobilidade)
 *   codigo_barras     { acao }               — abrir | lido | desconhecido (leitor no Comparar preços)
 *   ementas_plano     { acao, … }            — criar | editar | trocar | regenerar | lista | recomecar (plano de jantares)
 *   receita_cozinhada { id }                 — chegou ao fim do modo "Cozinhar"
 *   abrir_poupeja     { origem, tipo }       — botão "abrir no PoupeJá" das páginas públicas de SEO: origem = seo; tipo = preco | hub | categoria | loja | comparar | combustivel | receita | garantias | devolucoes | tarifa-social | irs | reduflacao | salario | abono | ferramentas | desemprego | imt | recibos-verdes | iuc | mais-valias | rendas | indemnizacao
 *   comparar_sem_resultados { q }          — pesquisa de produto sem nenhum resultado (o que falta cobrir)
 *   (nunca valores, nomes de produtos, datas ou dados pessoais — só a ação)
 */
import { detalheEvento } from "./metricas";

export function evento(nome, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", nome, params);
    }
  } catch (_) {}
  // Além do GA (só quem aceita cookies), conta-se o evento de forma anónima
  // no nosso contador, para o /admin ver o uso de toda a gente.
  if (nome === "comparar_pesquisa") metrica({ tipo: "pesquisa", chave: params.q });
  if (nome === "comparar_sem_resultados") metrica({ tipo: "pesquisa_vazia", chave: params.q });
  metrica({ tipo: "evento", chave: nome, detalhe: detalheEvento(params) });
}

/*
 * Métricas anónimas (ver lib/metricas.js e pages/api/metrica.js): vão para
 * uma fila e saem em lote — de 5 em 5 segundos ou quando a página fica
 * escondida —, para não haver um pedido por clique. Os dispositivos do dono
 * (marcados no /admin) não contam.
 */
let fila = [];
let temporizador = null;
let aEscutar = false;

export function metrica(item) {
  if (typeof window === "undefined") return;
  try { if (localStorage.getItem("poupeja_nao_contar") === "1") return; } catch (_) {}
  fila.push(item);
  if (!aEscutar) {
    aEscutar = true;
    window.addEventListener("pagehide", enviarMetricas);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") enviarMetricas(); });
  }
  if (fila.length >= 20) return enviarMetricas();
  if (!temporizador) temporizador = setTimeout(enviarMetricas, 5000);
}

function enviarMetricas() {
  clearTimeout(temporizador);
  temporizador = null;
  if (!fila.length) return;
  const corpo = JSON.stringify({ itens: fila.splice(0, 25) });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/metrica", corpo)) return;
    fetch("/api/metrica", { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(() => {});
  } catch (_) {}
}

export function ecra(nome) {
  evento("screen_view", { screen_name: nome });
}
