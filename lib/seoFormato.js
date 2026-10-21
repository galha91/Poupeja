/*
 * Datas e números das páginas públicas de preços. À parte de
 * lib/seoPrecos para o browser não descarregar o catálogo inteiro só por
 * causa de uma vírgula.
 */

/* Cadeias que não publicam preços: ditas na nota, para ninguém julgar que as esquecemos. */
export const SEM_PRECOS_ONLINE = ["Intermarché", "Mercadona", "E.Leclerc", "Minipreço"];

/* ── Datas e números ── */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/* "2026-10-21" → "21 out 2026" */
export function dataCurta(dia, { ano = true } = {}) {
  const [a, m, d] = String(dia).split("-").map(Number);
  if (!a || !m || !d) return "";
  return `${d} ${MESES[m - 1]}${ano ? ` ${a}` : ""}`;
}
export function diasAntes(dia, n) {
  const t = Date.parse(`${dia}T12:00:00Z`) - n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}
export const hojeLisboa = (agora = new Date()) => agora.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

export const euros = (v) => (Number.isFinite(v) ? v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");

/* Unidade gravada na tabela → como se escreve à frente de um preço. */
export function porUnidade(unidade) {
  if (!unidade || unidade === "embalagem") return "";
  return `/${unidade}`;
}

/* Meta description com ~160 caracteres, cortada numa palavra e não a meio dela. */
export function cortar(texto, max = 160) {
  const t = String(texto || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[,;:.\s]+$/, "") + "…";
}
