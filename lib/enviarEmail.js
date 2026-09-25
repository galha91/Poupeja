/*
 * Envia um email pelo Resend e FALHA quando o envio falha.
 *
 * O SDK do Resend não lança erro quando a API recusa o email (chave
 * inválida, domínio por verificar, rate limit): devolve { data, error } e
 * segue. Com `await resend.emails.send(...)` sozinho, um envio recusado
 * passava por bem-sucedido — o email semanal contava-o como "enviado" e o
 * log não dizia nada. Assim, quem chama continua a usar try/catch como
 * sempre, e o catch passa a apanhar também as recusas da API.
 */
export async function enviarEmail(resend, mensagem) {
  const { data, error } = await resend.emails.send(mensagem);
  if (error) {
    const e = new Error(`Resend recusou o email: ${error.name ?? "erro"} — ${error.message ?? ""}`.trim());
    e.resend = error;
    throw e;
  }
  return data;
}
