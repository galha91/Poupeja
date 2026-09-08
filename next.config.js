const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/*
 * Content-Security-Policy — a defesa que faltava contra XSS.
 *
 * Vai em REPORT-ONLY de propósito. Um CSP a bloquear, mal afinado, parte o
 * site em silêncio: deixa de carregar o Google Analytics, o Awin, os
 * logótipos das lojas ou o mapa, e nada disso dá erro visível. Em
 * report-only o browser aplica tudo na mesma, mas limita-se a escrever na
 * consola o que TERIA bloqueado.
 *
 * Como passar a bloquear (quando estiveres à vontade): abre o site com a
 * consola aberta, percorre Início, Mercado, Mobilidade (mapa), Lojas e
 * Poupança, e vê se aparece alguma queixa de CSP. Se não aparecer nenhuma,
 * troca a chave para "Content-Security-Policy" e fica a valer.
 *
 * Cada linha existe por causa de algo concreto que o site carrega mesmo:
 */
const csp = [
  "default-src 'self'",
  // GA e Awin. O 'unsafe-inline' é preciso porque o Next injeta scripts
  // inline para a hidratação e o gtag é configurado inline no _document.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.dwin1.com https://www.awin1.com",
  // A app inteira usa style={{…}} e o Leaflet injeta estilos próprios.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Logótipos das lojas (Clearbit e o serviço de favicons da Google),
  // tiles do mapa (OpenStreetMap) e as imagens dos talões em base64/blob.
  "img-src 'self' data: blob: https://logo.clearbit.com https://www.google.com https://*.tile.openstreetmap.org",
  // Supabase (dados e auth) e os beacons do GA.
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=self, geolocation=self, microphone=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = withPWA(nextConfig);
