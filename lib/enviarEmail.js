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
  await contarEnviados(tipoDe(mensagem));
  return data;
}

/*
 * Cada email leva a etiqueta "tipo" (folhetos, combustivel, alerta_preco…).
 * O Resend devolve-a nos eventos (entregue, aberto, devolvido…) e o /admin
 * junta tudo por tipo. Aqui conta-se o envio (metricas_dia, tipo "email").
 */
export const etiqueta = (tipo) => [{ name: "tipo", value: tipo }];
export const tipoDe = (mensagem) => mensagem?.tags?.find((t) => t.name === "tipo")?.value || "outro";

export async function contarEnviados(tipo, n = 1) {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();
    if (!admin || n < 1) return;
    await admin.rpc("registar_metricas", { p_itens: Array.from({ length: n }, () => ({ tipo: "email", chave: "enviado", detalhe: tipo, valor: 0, bom: false })) });
  } catch (_) {}
}
