import rateLimit from "express-rate-limit";

const json = (msg) => ({ message: { erro: msg }, standardHeaders: true, legacyHeaders: false });

// Auth: apertado — trava força bruta em passwords.
export const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  ...json("Demasiadas tentativas. Tenta de novo dentro de 15 minutos."),
});

// Licitações: generoso mas suficiente para travar bots.
export const limiteLicitacoes = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  ...json("Estás a licitar depressa demais. Acalma, a fruta não foge. 🍌"),
});

// Webhooks: protege contra floods.
export const limiteWebhooks = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  ...json("Rate limit."),
});
