/*
 * Datas "de calendário" (dia, sem hora) para garantias, renovações e prazos.
 *
 * `new Date("2026-10-03")` é meia-noite em UTC — em Portugal, no horário de
 * inverno, ainda dá certo, mas noutros fusos (e nalgumas contas de dias)
 * escorrega um dia. Aqui as datas vivem como texto "AAAA-MM-DD" e só
 * viram Date ao meio-dia local, onde nenhum fuso as muda de dia.
 */

const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function paraData(iso) {
  const m = RE_ISO.exec(String(iso || ""));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  return d.getMonth() === +m[2] - 1 ? d : null; // 2026-02-30 não é data
}

export function paraIso(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hojeIso(agora = new Date()) {
  return paraIso(agora);
}

/** Dias de `de` até `ate` (positivo se `ate` está no futuro). */
export function diasEntre(de, ate) {
  const a = paraData(de), b = paraData(ate);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

export function somarDias(iso, dias) {
  const d = paraData(iso);
  if (!d) return null;
  d.setDate(d.getDate() + dias);
  return paraIso(d);
}

/**
 * Soma meses mantendo o dia; se o mês de chegada for mais curto, fica no
 * último dia dele (31 de janeiro + 1 mês = 28/29 de fevereiro, não 3 de março).
 */
export function somarMeses(iso, meses) {
  const d = paraData(iso);
  if (!d) return null;
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).getDate();
  d.setDate(Math.min(dia, ultimo));
  return paraIso(d);
}

/** "MM-DD" num dado ano; um dia que não existe nesse ano fica no último do mês (02-29 → 02-28). */
export function diaDoAno(ano, mmdd) {
  const [mm, dd] = String(mmdd).split("-").map(Number);
  if (!mm || !dd) return null;
  const ultimo = new Date(ano, mm, 0, 12).getDate();
  return paraIso(new Date(ano, mm - 1, Math.min(dd, ultimo), 12));
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "3 de outubro de 2026" (ou sem ano). */
export function dataExtenso(iso, { ano = true } = {}) {
  const d = paraData(iso);
  if (!d) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]}${ano ? ` de ${d.getFullYear()}` : ""}`;
}

/** "03/10/2026" */
export function dataCurta(iso) {
  const d = paraData(iso);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** "daqui a 12 dias", "amanhã", "hoje", "há 3 dias" */
export function falta(dias) {
  if (dias == null) return "";
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return dias > 0 ? `daqui a ${dias} dias` : `há ${-dias} dias`;
}
