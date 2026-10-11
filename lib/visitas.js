// Contador de visitas sem cookies: só conta páginas vistas por dia, por
// página e por origem, mais um total de visitantes diários obtido a partir de
// um hash que muda todos os dias (não permite reconhecer ninguém de um dia
// para o outro). Funções puras, testadas em tests/visitas.test.mjs.

const CAMINHO = /^\/[a-z0-9\-_/]{0,79}$/;
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|axios|monitor|uptime|vercel/i;

export function caminhoValido(bruto) {
  if (typeof bruto !== "string") return null;
  let c = bruto.split(/[?#]/)[0].toLowerCase();
  if (c.length > 1) c = c.replace(/\/+$/, "");
  if (!CAMINHO.test(c)) return null;
  if (c === "/admin" || c.startsWith("/admin/") || c.startsWith("/api")) return null;
  return c;
}

export function eBot(userAgent) {
  return !userAgent || BOTS.test(userAgent);
}

// Reduz o referrer a poucas categorias; nunca guardamos o URL.
export function classificarOrigem(referrer, anfitriaoProprio) {
  if (referrer === "interno") return "interno";
  if (typeof referrer !== "string" || !referrer) return "direto";
  let h = "";
  try { h = new URL(referrer).hostname.toLowerCase(); } catch { return "direto"; }
  if (!h) return "direto";
  if (anfitriaoProprio && (h === anfitriaoProprio || h.endsWith("." + anfitriaoProprio))) return "interno";
  if (/(^|\.)google\./.test(h)) return "google";
  if (/bing\.com$|duckduckgo\.com$|ecosia\.org$|yahoo\.com$/.test(h)) return "pesquisa";
  if (/facebook\.com$|fb\.com$|fb\.me$/.test(h)) return "facebook";
  if (/instagram\.com$/.test(h)) return "instagram";
  if (/tiktok\.com$/.test(h)) return "tiktok";
  if (/whatsapp\.com$|wa\.me$/.test(h)) return "whatsapp";
  return "outro";
}
