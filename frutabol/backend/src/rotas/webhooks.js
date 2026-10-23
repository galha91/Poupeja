import { Router } from "express";
import express from "express";
import { config } from "../config.js";
import { limiteWebhooks } from "../middleware/limites.js";
import { assinaturaValida, processarEvento } from "../servicos/lemonsqueezy.js";

export const rotasWebhooks = Router();

// IMPORTANTE: corpo RAW — a assinatura é calculada sobre os bytes originais.
rotasWebhooks.post(
  "/lemonsqueezy",
  limiteWebhooks,
  express.raw({ type: "*/*", limit: "1mb" }),
  async (req, res) => {
    try {
      if (!config.pagamentosAtivos) return res.status(503).json({ erro: "Pagamentos desativados." });
      if (!assinaturaValida(req.body, req.get("X-Signature"))) {
        return res.status(401).json({ erro: "Assinatura inválida." });
      }
      const evento = JSON.parse(req.body.toString("utf8"));
      const resultado = await processarEvento(evento);
      res.json(resultado);
    } catch (e) {
      console.error("Webhook Lemon Squeezy:", e.message);
      // 500 → o Lemon Squeezy volta a tentar; a idempotência protege-nos
      res.status(500).json({ erro: "Erro a processar o evento." });
    }
  }
);
