const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

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
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    // Domínio canónico: poupejá.com (xn--poupej-uta.com). Se as variantes
    // estiverem ligadas ao projeto no Vercel, redirecionam aqui — sem
    // configuração no painel.
    return [
      { source: "/:path*", has: [{ type: "host", value: "poupeja.com" }],          destination: "https://xn--poupej-uta.com/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "www.poupeja.com" }],      destination: "https://xn--poupej-uta.com/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "www.xn--poupej-uta.com" }], destination: "https://xn--poupej-uta.com/:path*", permanent: true },
    ];
  },
};

module.exports = withPWA(nextConfig);
