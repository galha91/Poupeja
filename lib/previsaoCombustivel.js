import { eur } from "./formato.js"; // com .js: os testes correm em node sem bundler

/*
 * Alerta de subida dos combustíveis na semana seguinte — as contas, sem I/O.
 *
 * Todas as sextas o Governo publica a portaria que mexe no desconto do ISP
 * e a imprensa (ECO, ACP, CNN…) diz quanto o gasóleo e a gasolina vão subir
 * ou descer na segunda-feira. O cron (/api/cron-previsao-combustiveis) pede
 * à pesquisa web da Anthropic esses valores; aqui valida-se o que veio,
 * decide-se se é subida que mereça aviso e monta-se o email.
 */

export const MIN_SUBIDA_CENT = 1; // abaixo de 1 cêntimo não vale um email
const MAX_CENT = 30;              // mais do que isto numa semana é erro de leitura

/* "AAAA-MM-DD" de hoje em Lisboa. */
export function hojeLisboa(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

/* A segunda-feira seguinte (nunca hoje), em Lisboa: a "próxima semana" das notícias. */
export function proximaSegunda(agora = new Date()) {
  const d = new Date(`${hojeLisboa(agora)}T12:00:00Z`);
  const faltam = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + faltam);
  return d.toISOString().slice(0, 10);
}

/* O último objeto JSON de um texto (o modelo pode escrever antes dele ou usar ```json). */
export function extrairJson(texto) {
  const s = String(texto || "");
  const fim = s.lastIndexOf("}");
  if (fim < 0) return null;
  // Do "{" mais à direita para a esquerda, até um que feche num JSON válido.
  for (let i = s.lastIndexOf("{", fim); i >= 0; i = s.lastIndexOf("{", i - 1)) {
    try {
      const o = JSON.parse(s.slice(i, fim + 1));
      if (o && typeof o === "object" && !Array.isArray(o) && "semana" in o) return o;
    } catch { /* continua para a esquerda */ }
    if (i === 0) break;
  }
  return null;
}

const centimos = (v) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || Math.abs(n) > MAX_CENT) return undefined; // inválido
  return Math.round(n * 10) / 10;
};

/*
 * Aceita a resposta do modelo só se for para a semana pedida, com pelo menos
 * um valor e uma fonte com link. Devolve { semana, gasoleo, gasolina, fontes,
 * resumo } (cêntimos por litro, + sobe, − desce) ou null.
 */
export function validarPrevisao(o, semanaEsperada) {
  if (!o || o.encontrado === false || o.semana !== semanaEsperada) return null;
  const gasoleo = centimos(o.gasoleo_cent);
  const gasolina = centimos(o.gasolina_cent);
  if (gasoleo === undefined || gasolina === undefined) return null;
  if (gasoleo == null && gasolina == null) return null;
  const fontes = (Array.isArray(o.fontes) ? o.fontes : [])
    .filter(f => f && /^https:\/\/[^\s"<>]+$/.test(String(f.url || "")))
    .slice(0, 3)
    .map(f => ({ titulo: String(f.titulo || f.url).slice(0, 160), url: String(f.url) }));
  if (!fontes.length) return null;
  return { semana: semanaEsperada, gasoleo, gasolina, fontes, resumo: String(o.resumo || "").slice(0, 400) };
}

export function vaiSubir(p) {
  return !!p && ((p.gasoleo ?? 0) >= MIN_SUBIDA_CENT || (p.gasolina ?? 0) >= MIN_SUBIDA_CENT);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cent = (v) => eur(Math.abs(v), 1).replace(/,0$/, "");
function frase(rotulo, v) {
  if (v == null) return null;
  if (Math.abs(v) < 0.5) return `${rotulo}: fica praticamente igual`;
  return `${rotulo}: ${v > 0 ? "sobe" : "desce"} cerca de ${cent(v)} cênt./L`;
}
const diaMes = (iso) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };

/* Email do alerta. `pagina`: onde ver os postos (o concelho da pessoa, se houver). */
export function construirEmailPrevisao({ previsao, base, pagina, unsubscribeUrl }) {
  const { semana, gasoleo, gasolina, fontes } = previsao;
  const sobe = [gasoleo >= MIN_SUBIDA_CENT && `Gasóleo +${cent(gasoleo)}`, gasolina >= MIN_SUBIDA_CENT && `Gasolina +${cent(gasolina)}`].filter(Boolean);
  const subject = `⛽ ${sobe.join(" · ")} cênt. a partir de segunda (${diaMes(semana)}) — abastece até domingo`;
  const linhas = [frase("Gasóleo", gasoleo), frase("Gasolina 95", gasolina)].filter(Boolean);
  const link = pagina || `${base}/combustiveis`;

  const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>Combustíveis sobem na segunda — PoupeJá</title></head>
<body style="margin:0;padding:0;background:#f3f4f2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;"><tr><td align="center">
<table width="100%" style="max-width:500px;background:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td style="background:#b45309;padding:26px 28px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.85);">PoupeJá · alerta</p>
    <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:900;line-height:1.25;">Os combustíveis sobem na segunda-feira, ${diaMes(semana)}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    ${linhas.map(l => `<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">${esc(l)}</p>`).join("")}
    <p style="margin:14px 0 14px;font-size:14px;line-height:1.6;color:#0f172a;">Se precisas de abastecer, fá-lo <strong>até domingo</strong>. Num depósito de 50 litros, ${cent(Math.max(gasoleo ?? 0, gasolina ?? 0))} cêntimos são cerca de <strong>${eur(Math.max(gasoleo ?? 0, gasolina ?? 0) / 2, 2)} €</strong>.</p>
    <div style="text-align:center;margin:22px 0 12px;">
      <a href="${esc(link)}" style="display:inline-block;background:#0b6b4f;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:12px;">Ver os postos mais baratos</a>
    </div>
  </td></tr>
  <tr><td style="padding:8px 28px 24px;">
    <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.6;">É uma estimativa, feita a partir da portaria semanal do ISP e das notícias de sexta-feira: ${fontes.map(f => `<a href="${esc(f.url)}" style="color:#64748b;">${esc(f.titulo)}</a>`).join(" · ")}. Cada posto define o seu preço.</p>
    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">Recebes este alerta porque o pediste no PoupeJá. <a href="${esc(unsubscribeUrl)}" style="color:#64748b;">Deixar de receber alertas</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Os combustíveis sobem na segunda-feira, ${diaMes(semana)}.`,
    "",
    ...linhas,
    "",
    "Se precisas de abastecer, fá-lo até domingo.",
    `Postos mais baratos: ${link}`,
    "",
    `Estimativa a partir da portaria do ISP e das notícias: ${fontes.map(f => f.url).join(" ")}`,
    `Deixar de receber alertas: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
