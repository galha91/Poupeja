import { createSign } from "node:crypto";

// Leitura do Google Analytics 4 e do Search Console com uma conta de serviço.
// Env vars: GOOGLE_SERVICE_ACCOUNT_JSON (JSON em bruto ou em base64),
// GA4_PROPERTY_ID (só números) e SEARCH_CONSOLE_SITE (ex.: sc-domain:xn--poupej-uta.com).

function credenciais() {
  const bruto = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!bruto) return null;
  try {
    const texto = bruto.trim().startsWith("{") ? bruto : Buffer.from(bruto, "base64").toString("utf8");
    const j = JSON.parse(texto);
    return j.client_email && j.private_key ? j : null;
  } catch { return null; }
}

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

async function token(cred, scope) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: cred.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: agora, exp: agora + 3000 })}`;
  const assinatura = createSign("RSA-SHA256").update(corpo).sign(cred.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${assinatura}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.error || "token");
  return j.access_token;
}

async function post(url, tk, corpo) {
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}

const num = (v) => Number(v) || 0;
const dataGA = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

export function googleConfigurado() {
  return { ga: !!(credenciais() && process.env.GA4_PROPERTY_ID), sc: !!(credenciais() && process.env.SEARCH_CONSOLE_SITE) };
}

export async function lerAnalytics() {
  const cred = credenciais(); const id = process.env.GA4_PROPERTY_ID;
  if (!cred || !id) return null;
  const tk = await token(cred, "https://www.googleapis.com/auth/analytics.readonly");
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`;
  const [dias, canais, paginas] = await Promise.all([
    post(url, tk, { dateRanges: [{ startDate: "13daysAgo", endDate: "today" }], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
    post(url, tk, { dateRanges: [{ startDate: "6daysAgo", endDate: "today" }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 }),
    post(url, tk, { dateRanges: [{ startDate: "6daysAgo", endDate: "today" }], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
  ]);
  return {
    dias: (dias.rows || []).map(r => ({ dia: dataGA(r.dimensionValues[0].value), utilizadores: num(r.metricValues[0].value), sessoes: num(r.metricValues[1].value), vistas: num(r.metricValues[2].value) })),
    canais: (canais.rows || []).map(r => ({ canal: r.dimensionValues[0].value, sessoes: num(r.metricValues[0].value) })),
    paginas: (paginas.rows || []).map(r => ({ caminho: r.dimensionValues[0].value, vistas: num(r.metricValues[0].value) })),
  };
}

export async function lerSearchConsole() {
  const cred = credenciais(); const site = process.env.SEARCH_CONSOLE_SITE;
  if (!cred || !site) return null;
  const tk = await token(cred, "https://www.googleapis.com/auth/webmasters.readonly");
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const iso = (d) => d.toISOString().slice(0, 10);
  const fim = new Date(Date.now() - 2 * 864e5); // o Search Console atrasa 2-3 dias
  const ini = new Date(fim.getTime() - 27 * 864e5);
  const base = { startDate: iso(ini), endDate: iso(fim) };
  const [dias, pesquisas, paginas] = await Promise.all([
    post(url, tk, { ...base, dimensions: ["date"] }),
    post(url, tk, { ...base, dimensions: ["query"], rowLimit: 10 }),
    post(url, tk, { ...base, dimensions: ["page"], rowLimit: 10 }),
  ]);
  const linha = (r) => ({ cliques: num(r.clicks), impressoes: num(r.impressions), posicao: Math.round(num(r.position) * 10) / 10 });
  return {
    periodo: base,
    dias: (dias.rows || []).map(r => ({ dia: r.keys[0], ...linha(r) })),
    pesquisas: (pesquisas.rows || []).map(r => ({ texto: r.keys[0], ...linha(r) })),
    paginas: (paginas.rows || []).map(r => ({ caminho: r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/", ...linha(r) })),
  };
}
