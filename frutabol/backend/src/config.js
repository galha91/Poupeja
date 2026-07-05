// Configuração central — tudo vem do .env, com valores seguros em dev.
// Em produção, JWT_SECRET e DOWNLOAD_SECRET TÊM de ser definidos.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carrega o .env da raiz do backend (sem dependências). Variáveis já
// definidas no ambiente têm sempre prioridade — em produção (Railway,
// Render…) usa as variáveis da plataforma e não é preciso ficheiro.
const ficheiroEnv = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (fs.existsSync(ficheiroEnv)) {
  for (const linha of fs.readFileSync(ficheiroEnv, "utf8").split("\n")) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

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
