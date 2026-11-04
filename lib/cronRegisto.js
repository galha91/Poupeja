import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { bearerValido } from "./seguranca.js";

/*
 * Regista cada execução de um cron (tabela cron_execucoes) para o /admin
 * mostrar quando correu, quanto demorou, o que respondeu e se falhou.
 * Envolve o handler sem lhe mudar o comportamento:
 *   export default comRegisto("cron-x", handler);
 * Pedidos sem autorização (401) não contam — são tentativas de fora.
 * Uma falha a registar nunca afeta o cron.
 */
export function resumir(corpo) {
  if (corpo == null) return null;
  try {
    const texto = JSON.stringify(corpo, (k, v) => (Array.isArray(v) && v.length > 5 ? `[${v.length} itens]` : v));
    return texto.length > 600 ? texto.slice(0, 597) + "…" : texto;
  } catch { return null; }
}

// Pedido de reserva (GitHub Actions, ?reserva=1): se o cron já correu nas
// últimas HORAS_RESERVA horas, não faz nada. Assim a reserva só atua quando o
// cron da Vercel (plano Hobby, sem repetição) falhou.
export const HORAS_RESERVA = 20;

export function jaCorreuRecentemente(ultimaEm, agora = Date.now(), horas = HORAS_RESERVA) {
  if (!ultimaEm) return false;
  const t = new Date(ultimaEm).getTime();
  return Number.isFinite(t) && agora - t < horas * 36e5;
}

export function comRegisto(nome, handler) {
  return async function registado(req, res) {
    if (req.query?.reserva && bearerValido(req.headers?.authorization, process.env.CRON_SECRET)) {
      try {
        const admin = getSupabaseAdmin();
        const { data } = admin ? await admin.from("cron_execucoes").select("ultima_em").eq("nome", nome).maybeSingle() : { data: null };
        if (jaCorreuRecentemente(data?.ultima_em)) return res.status(200).json({ ignorado: true, motivo: "Já correu nas últimas " + HORAS_RESERVA + "h." });
      } catch (_) {}
    }
    const inicio = Date.now();
    let corpo = null;
    const json = res.json.bind(res);
    res.json = (b) => { corpo = b; return json(b); };
    let falha = null;
    try {
      return await handler(req, res);
    } catch (e) {
      falha = e;
      throw e;
    } finally {
      const status = res.statusCode;
      if (status !== 401) {
        const ok = !falha && status < 400;
        const erro = falha ? String(falha.message || falha).slice(0, 300) : !ok ? String(corpo?.erro || `HTTP ${status}`).slice(0, 300) : null;
        try {
          const admin = getSupabaseAdmin();
          if (admin) await admin.rpc("registar_cron", { p_nome: nome, p_ok: ok, p_duracao: Date.now() - inicio, p_resumo: resumir(corpo), p_erro: erro });
        } catch (_) {}
      }
    }
  };
}
