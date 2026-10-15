const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // O leitor de códigos de barras (1 MB de WebAssembly) não vai para a
  // cache de toda a gente: só se descarrega quando alguém o usa.
  publicExcludes: ["!noprecache/**", "!zxing/**"],
});

/*
 * Content-Security-Policy — a defesa contra XSS. APLICADA (já não é
 * Report-Only): o browser bloqueia o que não estiver aqui.
 *
 * Antes de mudar alguma coisa: abre o site com a consola aberta, percorre
 * Início, Mercado, Lista, Mobilidade (mapa), Lojas e Poupança, e vê se
 * aparece "Refused to …" de CSP.
 *
 * Cada linha existe por causa de algo concreto que o site carrega mesmo:
 */
const csp = [
  "default-src 'self'",
  // GA e Awin. O 'unsafe-inline' é preciso porque o Next injeta scripts
  // inline para a hidratação e o gtag é configurado inline no _document.
  // Mesmo assim, um script vindo de qualquer outro domínio é recusado.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.dwin1.com https://www.awin1.com",
  // A app inteira usa style={{…}} e o Leaflet injeta estilos próprios.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Imagens de qualquer sítio em HTTPS: as fotos dos produtos vêm dos CDNs
  // de cada supermercado (mudam sem aviso), os logótipos da Clearbit e da
  // Google, os tiles do mapa do OpenStreetMap. Uma imagem não corre código,
  // por isso abrir aqui não abre uma porta a XSS.
  "img-src 'self' data: blob: https:",
  // Supabase (dados, auth e tempo real), GA4 e o Awin.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.awin1.com https://*.dwin1.com https://world.openfoodfacts.org",
  // Folhetos que se abrem dentro da app (ver lib/folhetos-embed).
  "frame-src https://folhetos.aldi.pt https://folhetos.pingodoce.pt https://folhetos.intermarche.pt",
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
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      /*
       * A CSP fica fora do service worker (sw.js, workbox-*, worker-*). Lá,
       * cada fetch conta como connect-src: com a lista acima, o SW deixava
       * de ir buscar as fotos dos produtos às lojas e as imagens partiam.
       */
      { source: "/((?!sw\\.js|workbox-|worker-).*)", headers: [{ key: "Content-Security-Policy", value: csp }] },
    ];
  },
};

module.exports = withPWA(nextConfig);
