/*
 * Custo das chamadas à Anthropic, para o /admin (Qualidade → Custos).
 * Cada chamada regista os dólares estimados a partir dos tokens que a
 * própria resposta devolve (usage), em metricas_dia (tipo "custo").
 * Preços por milhão de tokens, em USD (tabela pública da Anthropic);
 * atualizar aqui se mudarem.
 */
export const PRECOS = {
  "claude-haiku-4-5": { entrada: 1, saida: 5 },
  "claude-sonnet-4-5": { entrada: 3, saida: 15 },
  "claude-opus-5-5": { entrada: 5, saida: 25 }, // confirmar com a fatura do primeiro mês
};
const PESQUISA_WEB = 10 / 1000; // USD por pesquisa web

export function precoDe(modelo) {
  const m = String(modelo || "");
  const chave = Object.keys(PRECOS).find((k) => m.startsWith(k));
  return chave ? PRECOS[chave] : { entrada: 5, saida: 25 }; // desconhecido: o mais caro, para não subestimar
}

export function custoUsd(modelo, usage) {
  if (!usage) return 0;
  const p = precoDe(modelo);
  const entrada = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) * 1.25 + (usage.cache_read_input_tokens || 0) * 0.1;
  const pesquisas = usage.server_tool_use?.web_search_requests || 0;
  return (entrada * p.entrada + (usage.output_tokens || 0) * p.saida) / 1e6 + pesquisas * PESQUISA_WEB;
}

export async function registarCusto(onde, modelo, usage) {
  try {
    const valor = custoUsd(modelo, usage);
    if (!(valor > 0)) return;
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();
    if (admin) await admin.rpc("registar_metricas", { p_itens: [{ tipo: "custo", chave: "anthropic", detalhe: onde, valor, bom: false }] });
  } catch (_) {}
}
