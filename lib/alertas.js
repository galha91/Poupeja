/*
 * Alertas "vigiar" — avisar quando um artigo da lista desce de preço ou
 * entra em promoção. A mesma decisão serve o cron (notificação) e a app
 * (aviso dentro da app, para quem não tem notificações).
 *
 * O alerta guarda o preço de referência (o melhor no dia em que se
 * começou a vigiar). O registo é o último aviso enviado: { valor, dia }.
 * Só se volta a avisar se o preço descer ainda mais — uma promoção de
 * duas semanas não pode dar catorze notificações. Quando o preço volta
 * para cima da referência, o registo limpa-se e a próxima descida avisa.
 */

const EPS = 0.005;

/** Melhor preço atual de uma pesquisa, com a indicação de promoção. */
export function resumoAtual(p, modo) {
  if (!p) return null;
  return {
    valor: modo === "embalagem" ? p.preco : p.precoUnidade,
    promo: !!((p.precoAntigo && p.precoAntigo > p.preco) || p.promo),
    loja: p.lojaNome,
    nome: p.nome,
  };
}

/**
 * @param alerta   { referencia, promoNaCriacao }
 * @param atual    { valor, promo }
 * @param registo  { valor, dia } | undefined — último aviso enviado
 * @returns { avisar, motivo: "desceu"|"promo"|null, limpar }
 */
export function avaliarVigia(alerta, atual, registo) {
  if (!atual || !(atual.valor > 0) || !(alerta?.referencia > 0)) return { avisar: false, motivo: null, limpar: false };
  const desceu = atual.valor < alerta.referencia - EPS;
  const promoNova = atual.promo && !alerta.promoNaCriacao;
  if (!desceu && !promoNova) return { avisar: false, motivo: null, limpar: !!registo };
  const motivo = desceu ? "desceu" : "promo";
  if (registo && atual.valor >= Number(registo.valor) - EPS) return { avisar: false, motivo, limpar: false };
  return { avisar: true, motivo, limpar: false };
}
