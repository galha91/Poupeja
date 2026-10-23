/*
 * Contas fixas do mês (poupeja_contas + poupeja_contas_pago), partilhado
 * entre o separador Contas → Mensais e o cartão "Próxima conta" do Início.
 */

export const LS_CONTAS = "poupeja_contas";
export const LS_PAGOS = "poupeja_contas_pago";

export const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function ler(chave, vazio) {
  try { return JSON.parse(localStorage.getItem(chave) || "null") ?? vazio; } catch { return vazio; }
}
export function lerContas() {
  const l = ler(LS_CONTAS, []);
  return Array.isArray(l) ? l : [];
}
export function guardarContas(lista) {
  try { localStorage.setItem(LS_CONTAS, JSON.stringify(lista)); } catch {}
}
export function lerPagamentos() {
  const p = ler(LS_PAGOS, {});
  return p && typeof p === "object" && !Array.isArray(p) ? p : {};
}
export function guardarPagamentos(obj) {
  try { localStorage.setItem(LS_PAGOS, JSON.stringify(obj)); } catch {}
}

/** Marca (ou desmarca) uma conta num mês, sobre o que está guardado agora. */
export function marcarPagamento(mes, id, pago) {
  const atuais = lerPagamentos();
  const novos = { ...atuais, [mes]: { ...(atuais[mes] || {}) } };
  if (pago) novos[mes][id] = true; else delete novos[mes][id];
  guardarPagamentos(novos);
  return novos;
}

/** "outubro" — ou "outubro 2025" se não for o ano de `hoje`. */
export function mesNome(data = new Date(), offset = 0, hoje = new Date()) {
  const d = new Date(data.getFullYear(), data.getMonth() + offset, 1);
  return d.getFullYear() !== hoje.getFullYear() ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : MESES[d.getMonth()];
}

/** O 1.º dia do mês `offset` meses depois de `data`. */
export function inicioDoMes(data = new Date(), offset = 0) {
  return new Date(data.getFullYear(), data.getMonth() + offset, 1, 12);
}

/** "2026-10" — a chave do mês nos pagamentos. */
export function mesChave(data = new Date(), offset = 0) {
  const d = new Date(data.getFullYear(), data.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Uma conta "ao dia 31" em novembro paga-se a 30 — o último dia do mês. */
export function diaEfetivo(dia, data = new Date()) {
  const ultimo = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  return Math.min(dia, ultimo);
}

/**
 * "Vence hoje", "Vence amanhã", "Dia 22 · daqui a 3 dias", "Dia 5 · já passou".
 * `data` é um dia do mês que se está a ver (o "dia 31" de novembro é o 30).
 */
export function quandoVence(conta, { pago, esMesAtual, hoje, data = new Date() }) {
  const e = diaEfetivo(conta.diaVencimento, data);
  if (pago || !esMesAtual) return { texto: `Dia ${e}`, tom: null };
  if (e === hoje) return { texto: "Vence hoje", tom: "danger" };
  if (e === hoje + 1) return { texto: "Vence amanhã", tom: "warn" };
  if (e > hoje && e <= hoje + 5) return { texto: `Dia ${e} · daqui a ${e - hoje} dias`, tom: "warn" };
  if (e < hoje) return { texto: `Dia ${e} · já passou`, tom: "warn" };
  return { texto: `Dia ${e}`, tom: null };
}

/**
 * O que falta pagar este mês, da mais urgente para a menos:
 * primeiro as que já passaram o dia (esquecidas), depois hoje e as seguintes.
 */
export function porPagarOrdenadas(contas, pagosMes, data = new Date()) {
  const hoje = data.getDate();
  return (contas || [])
    .filter(c => c && !pagosMes?.[c.id])
    .map(c => ({ c, e: diaEfetivo(c.diaVencimento, data) }))
    .sort((a, b) => {
      const pa = a.e < hoje ? 0 : 1, pb = b.e < hoje ? 0 : 1;
      return pa - pb || a.e - b.e;
    })
    .map(x => x.c);
}

/** Resumo para o Início: a próxima conta, quanto falta e quantas são. null sem contas. */
export function resumoMes(contas, pagos, data = new Date()) {
  if (!contas?.length) return null;
  const pagosMes = pagos?.[mesChave(data)] || {};
  const lista = porPagarOrdenadas(contas, pagosMes, data);
  return {
    proxima: lista[0] || null,
    porPagar: lista.length,
    falta: lista.reduce((s, c) => s + (Number(c.valor) || 0), 0),
    total: contas.length,
  };
}
