// App Express (separada do arranque para poder ser usada nos testes).

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { ErroNegocio } from "./db.js";
import { comUtilizador } from "./middleware/auth.js";
import { rotasAuth } from "./rotas/auth.js";
import { rotasCatalogo } from "./rotas/catalogo.js";
import { rotasLeiloes } from "./rotas/leiloes.js";
import { rotasMoedas } from "./rotas/moedas.js";
import { rotasColecao, rotasFicheiros } from "./rotas/colecao.js";
import { rotasAdmin } from "./rotas/admin.js";
import { rotasWebhooks } from "./rotas/webhooks.js";
import { PASTA_UPLOADS } from "./servicos/ficheiros.js";

export function criarApp() {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: config.frontendUrl, credentials: true }));

  // webhooks primeiro: precisam do corpo RAW (antes do express.json)
  app.use("/api/webhooks", rotasWebhooks);

  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use(comUtilizador);

  app.use("/api/auth", rotasAuth);
  app.use("/api/catalogo", rotasCatalogo);
  app.use("/api/leiloes", rotasLeiloes);
  app.use("/api/moedas", rotasMoedas);
  app.use("/api/colecao", rotasColecao);
  app.use("/api/ficheiros", rotasFicheiros);
  app.use("/api/admin", rotasAdmin);

  // imagens públicas do catálogo (miniaturas); o download "oficial" em alta
  // resolução continua a exigir link assinado
  app.use(
    "/api/imagens",
    express.static(PASTA_UPLOADS, { maxAge: "1d", index: false, dotfiles: "deny" })
  );

  app.get("/api/saude", (_req, res) => res.json({ ok: true }));

  // handler de erros central: ErroNegocio → mensagem amigável; resto → 500 opaco
  app.use((err, _req, res, _next) => {
    if (err instanceof ErroNegocio) return res.status(err.codigo).json({ erro: err.message });
    if (err?.name === "MulterError") return res.status(400).json({ erro: "Upload inválido." });
    console.error(err);
    res.status(500).json({ erro: "Erro interno. Tenta de novo." });
  });

  return app;
}
