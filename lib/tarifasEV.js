/*
 * Tarifas dos postos EV (MOBI.E / NAP Portugal), lidas do Supabase.
 *
 * A linha da tabela tarifas_ev é escrita de 6 em 6 horas pelo GitHub Action
 * tarifas-ev (scripts/tarifas_ev.py). Aqui só se lê, com cache em memória
 * por instância, e se constrói o índice espacial uma vez.
 *
 * Qualquer falha devolve null: sem tarifas, a rota /api/ev continua a
 * mostrar os postos como antes, só sem custo.
 */
import { getSupabaseAdmin } from "./supabaseAdmin";
import { indexarTarifas } from "./custoCarregamento";

const CACHE_MEMORIA = 30 * 60 * 1000;
/* Tarifas mudam pouco, mas três dias sem atualizar já é sinal de avaria:
 * a partir daí preferimos não mostrar preço a mostrar um velho. */
const VALIDADE = 3 * 24 * 60 * 60 * 1000;

let memoria = null; // { valor, ts }

export async function lerTarifasEV() {
  const agora = Date.now();
  if (memoria && agora - memoria.ts < CACHE_MEMORIA) return memoria.valor;

  let valor = null;
  try {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb
        .from("tarifas_ev")
        .select("postos, obtido_em, publicado_em")
        .eq("id", "mobie")
        .maybeSingle();
      const obtido = data ? Date.parse(data.obtido_em) : NaN;
      if (!error && data && Number.isFinite(obtido) && agora - obtido <= VALIDADE) {
        valor = {
          indice: indexarTarifas(data.postos),
          obtidoEm: data.obtido_em,
          publicadoEm: data.publicado_em,
        };
      }
    }
  } catch {
    valor = null;
  }

  // Também guardamos o "não há", mas por pouco tempo: evita ir ao Supabase
  // em cada pedido sem prender uma falha passageira durante meia hora.
  memoria = { valor, ts: valor ? agora : agora - CACHE_MEMORIA + 5 * 60 * 1000 };
  return valor;
}
