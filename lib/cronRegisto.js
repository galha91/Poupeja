import { getSupabaseAdmin } from "./supabaseAdmin.js";

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

export function comRegisto(nome, handler) {
  return async function registado(req, res) {
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
