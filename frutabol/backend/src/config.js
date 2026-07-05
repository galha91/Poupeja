// Configuração central — tudo vem do .env, com valores seguros em dev.
// Em produção, JWT_SECRET e DOWNLOAD_SECRET TÊM de ser definidos.

const dev = process.env.NODE_ENV !== "production";

function obrigatorio(nome) {
  const v = process.env[nome];
  if (!v && !dev) throw new Error(`Variável de ambiente em falta: ${nome}`);
  return v || `dev-inseguro-${nome.toLowerCase()}`;
}

export const config = {
  dev,
  porta: parseInt(process.env.PORT || "4000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
  jwtSecret: obrigatorio("JWT_SECRET"),
  downloadSecret: obrigatorio("DOWNLOAD_SECRET"),
  adminEmail: (process.env.ADMIN_EMAIL || "").toLowerCase(),

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "FrutaBol <noreply@frutabol.example>",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  // FASE 2 — desativada por defeito. Ver checklist no README antes de ligar.
  pagamentosAtivos: process.env.PAYMENTS_ENABLED === "true",
  lemonSqueezy: {
    loja: process.env.LEMONSQUEEZY_STORE || "",
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
  },

  // Bónus por defeito (o admin pode alterar na tabela Config)
  bonus: { registo: 500, diario: 50, referral: 200 },
};
