/*
 * Pedido de notificações em duas etapas.
 *
 * Antes, 3 segundos depois do login, o browser mostrava o pedido nativo
 * ("poupejá.com quer enviar notificações") sem nenhum contexto. Quem
 * recusa ou fecha esse pedido não volta a ser perguntado: o browser guarda
 * "bloqueado" para sempre. Só 14 de 51 contas tinham as notificações
 * ativas, e 12 das que instalaram a app não as ativaram.
 *
 * Agora a app mostra primeiro um cartão seu, a explicar o que se ganha. O
 * pedido nativo só aparece quando a pessoa toca em "Ativar avisos". Com
 * "Agora não" nada se gasta: volta a perguntar daqui a 3, 7 e 14 dias, e
 * depois deixa de insistir.
 *
 * Funções puras: quem as chama guarda o estado.
 */

const DIA = 24 * 60 * 60 * 1000;
export const ADIAMENTOS_DIAS = [3, 7, 14];

/* estado: { vezes, proxima } guardado em localStorage; vazio = nunca se mostrou. */
export function podeMostrar(estado, agora = Date.now()) {
  const vezes = estado?.vezes || 0;
  if (vezes >= ADIAMENTOS_DIAS.length) return false; // já disse "agora não" 3 vezes
  return agora >= (estado?.proxima || 0);
}

/* "Agora não": adia o próximo pedido (3, 7, 14 dias) e conta. */
export function adiar(estado, agora = Date.now()) {
  const vezes = (estado?.vezes || 0) + 1;
  const dias = ADIAMENTOS_DIAS[Math.min(vezes - 1, ADIAMENTOS_DIAS.length - 1)];
  return { vezes, proxima: agora + dias * DIA };
}

const CHAVE = "poupeja_push_soft";

export function lerEstado() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch { return {}; }
}
export function guardarEstado(estado) {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch {}
}
