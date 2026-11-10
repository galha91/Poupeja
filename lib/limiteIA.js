/*
 * Teto diário de gastos na Anthropic, por funcionalidade.
 *
 * O rate limit por IP (lib/protecao-api.js) trava rajadas, mas vive em
 * memória e cada instância da Vercel tem a sua: alguém com muitos IPs, ou
 * com paciência, gastava os créditos à mesma. Este teto é global e
 * persistente: soma o custo de hoje que o lib/custos.js já regista em
 * metricas_dia (tipo "custo") e, passado o limite, a funcionalidade pára
 * até à meia-noite de Lisboa.
 *
 * Custa uma leitura de UMA linha, guardada 1 minuto em memória.
 *
 * Limite: env ANTHROPIC_LIMITE_DIARIO_USD (dólares por dia e por
 * funcionalidade). Por omissão 2 USD — com o Haiku, uns 300 talões por dia,
 * muito acima do uso real (perto de zero em novembro de 2026).
 *
 * Se a base de dados não responder, NÃO deixa passar: na dúvida, protege
 * os créditos. A defesa final continua a ser o limite de gastos na consola
 * da Anthropic (ver docs/SEGURANCA.md).
 */
import { getSupabaseAdmin } from "./supabaseAdmin";

const CACHE_MS = 60_000;
const cache = new Map(); // onde → { ate, gasto }

export function limiteDiarioUsd() {
  const v = parseFloat(process.env.ANTHROPIC_LIMITE_DIARIO_USD);
  return Number.isFinite(v) && v >= 0 ? v : 2;
}

export function diaLisboa(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(agora);
}

/* true se ainda há orçamento hoje para `onde` (ex.: "ler-talao"). */
export async function orcamentoIADisponivel(onde) {
  const limite = limiteDiarioUsd();
  const c = cache.get(onde);
  if (c && c.ate > Date.now()) return c.gasto < limite;

  const admin = getSupabaseAdmin();
  // Sem service role (máquina de desenvolvimento): não há onde contar.
  if (!admin) return process.env.NODE_ENV !== "production";

  try {
    const { data, error } = await admin
      .from("metricas_dia")
      .select("soma")
      .eq("dia", diaLisboa())
      .eq("tipo", "custo")
      .eq("chave", "anthropic")
      .eq("detalhe", onde)
      .maybeSingle();
    if (error) throw error;
    const gasto = Number(data?.soma) || 0;
    cache.set(onde, { ate: Date.now() + CACHE_MS, gasto });
    return gasto < limite;
  } catch (e) {
    console.error("limiteIA: não consegui ler o gasto de hoje:", e?.message);
    return false;
  }
}

/* Depois de uma chamada paga: soma já à cache, sem esperar pelo próximo minuto. */
export function somarGasto(onde, usd) {
  const c = cache.get(onde);
  if (c && usd > 0) c.gasto += usd;
}
