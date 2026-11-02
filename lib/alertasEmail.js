import { emailValido, normalizarEmail } from "./subscritores.js";
import { avaliarVigia } from "./alertas.js";

/*
 * Alertas de preço por email, para quem não tem conta (ou não quer
 * notificações). O convidado escreve o email no próprio alerta do
 * "Comparar preços"; o cron-alertas-email verifica uma vez por dia e manda
 * um email só quando algum alerta dispara. Funções puras, testadas em
 * tests/alertasEmail.test.mjs.
 */

export const MAX_ALERTAS_POR_EMAIL = 20;
export const SUPRESSAO_DIAS = 3; // o mesmo que as notificações (cron-avisos)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIDADE = /^[a-zà-ú.]{1,12}$/i;

// Valida o pedido do browser. Devolve { erro } ou { alerta } pronto a gravar.
export function validarPedido(corpo) {
  const { email, q, alvo, unidade, modo, valorAtual, consentimento, convidado, tipo, promo } = corpo || {};
  if (consentimento !== true) return { erro: "Falta aceitar receber o aviso por email." };
  if (!emailValido(email)) return { erro: "Escreve um email válido." };
  const termo = typeof q === "string" ? q.trim().toLowerCase().slice(0, 80) : "";
  if (termo.length < 2) return { erro: "Pesquisa inválida." };
  if (typeof unidade !== "string" || !UNIDADE.test(unidade)) return { erro: "Unidade inválida." };
  const vigiar = tipo === "vigiar";
  const ref = Number(valorAtual);
  const a = Number(alvo);
  if (!(ref > 0 && ref < 10000)) return { erro: "Preço inválido." };
  if (!vigiar && !(a > 0 && a < 10000)) return { erro: "Preço alvo inválido." };
  return {
    alerta: {
      email: normalizarEmail(email),
      q: termo,
      tipo: vigiar ? "vigiar" : "alvo",
      alvo: vigiar ? null : Math.round(a * 100) / 100,
      referencia: Math.round(ref * 1000) / 1000,
      unidade,
      modo: modo === "embalagem" ? "embalagem" : "unidade",
      promo_na_criacao: !!promo,
      convidado_id: typeof convidado === "string" && UUID.test(convidado) ? convidado : null,
    },
  };
}

const diasEntre = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

/*
 * Decide se um alerta dispara hoje.
 * - alvo: o mais barato está ≤ alvo, e não se avisou nos últimos 3 dias.
 * - vigiar: desceu face à referência ou entrou em promoção, uma vez por
 *   preço (as mesmas regras das notificações, em lib/alertas).
 * Devolve { avisar, motivo, registo } — registo é o novo ultimo_aviso a
 * gravar (ou null para limpar, undefined para manter).
 */
export function decidirAviso(alerta, atual, hojeISO) {
  if (!atual || atual.unidade !== alerta.unidade) return { avisar: false };
  if (alerta.tipo === "vigiar") {
    const v = avaliarVigia({ referencia: Number(alerta.referencia), promoNaCriacao: alerta.promo_na_criacao }, atual, alerta.ultimo_aviso || undefined);
    if (v.avisar) return { avisar: true, motivo: v.motivo, registo: { valor: atual.valor, dia: hojeISO } };
    return { avisar: false, registo: v.limpar ? null : undefined };
  }
  if (!(Number(alerta.alvo) > 0) || atual.valor > Number(alerta.alvo)) return { avisar: false };
  const ultimo = alerta.ultimo_aviso?.dia;
  if (ultimo && diasEntre(ultimo, hojeISO) < SUPRESSAO_DIAS) return { avisar: false };
  return { avisar: true, motivo: "alvo", registo: { valor: atual.valor, dia: hojeISO } };
}
