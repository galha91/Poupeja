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

// Etiqueta posta à mão nos links partilhados (?o=fb), porque as apps do
// Facebook, Instagram e WhatsApp muitas vezes não dizem de onde vem a visita.
const ETIQUETAS = { fb: "facebook", ig: "instagram", tt: "tiktok", wa: "whatsapp", g: "google", email: "email" };

export function origemEtiqueta(o) {
  return typeof o === "string" ? ETIQUETAS[o.toLowerCase()] || null : null;
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

// ── Perfil anónimo do visitante do dia ──────────────────────────────────────
// Só categorias largas (distrito, tipo de aparelho, novo/recorrente), contadas
// uma vez por visitante e por dia. Nunca ligadas a um hash, a um IP ou a uma
// página: não permitem reconhecer ninguém.

// ISO 3166-2:PT, que é o que a Vercel manda em x-vercel-ip-country-region.
const DISTRITOS = {
  "01": "Aveiro", "02": "Beja", "03": "Braga", "04": "Bragança", "05": "Castelo Branco",
  "06": "Coimbra", "07": "Évora", "08": "Faro", "09": "Guarda", "10": "Leiria",
  "11": "Lisboa", "12": "Portalegre", "13": "Porto", "14": "Santarém", "15": "Setúbal",
  "16": "Viana do Castelo", "17": "Vila Real", "18": "Viseu", "20": "Açores", "30": "Madeira",
};

export function regiaoDe(pais, codigo) {
  if (!pais) return "Desconhecida";
  if (pais !== "PT") return "Estrangeiro";
  const c = typeof codigo === "string" ? codigo.replace(/^PT-/i, "").trim() : "";
  return DISTRITOS[c] || "Portugal (outra)";
}

export function tipoDispositivo(userAgent) {
  const ua = userAgent || "";
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "telemóvel";
  return "computador";
}

const MODOS = new Set(["app-android", "pwa", "browser"]);
export const modoValido = (m) => (MODOS.has(m) ? m : null);
export const recorrenciaValida = (r) => (r === "novo" || r === "recorrente" ? r : null);
