/*
 * Simulador de IRS: só aparece no Início na época da declaração (abril a
 * junho). Fora dela, só para quem já o usou (tem uma simulação guardada).
 */
export function mostrarIRS(agora = new Date(), jaUsou = false) {
  const m = agora.getMonth(); // 0 = janeiro
  return (m >= 3 && m <= 5) || jaUsou;
}
