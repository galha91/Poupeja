import { Router } from "express";
import { z } from "zod";
import { prisma, ErroNegocio } from "../db.js";
import { config } from "../config.js";
import { validar } from "../middleware/validar.js";
import { exigirAuth } from "../middleware/auth.js";
import { reclamarBonusDiario, historico } from "../servicos/moedas.js";
import { urlCheckout } from "../servicos/lemonsqueezy.js";

export const rotasMoedas = Router();

rotasMoedas.post("/bonus-diario", exigirAuth, async (req, res, next) => {
  try {
    res.json(await reclamarBonusDiario(req.user.id));
  } catch (e) {
    next(e);
  }
});

rotasMoedas.get("/historico", exigirAuth, async (req, res, next) => {
  try {
    res.json({ movimentos: await historico(req.user.id) });
  } catch (e) {
    next(e);
  }
});

rotasMoedas.get("/referral", exigirAuth, async (req, res, next) => {
  try {
    const convidados = await prisma.referral.count({ where: { padrinhoId: req.user.id } });
    res.json({ codigo: req.user.codigoReferral, convidados });
  } catch (e) {
    next(e);
  }
});

// ---------- FASE 2 (atrás de PAYMENTS_ENABLED) ----------
rotasMoedas.get("/packs", async (_req, res, next) => {
  try {
    const packs = config.pagamentosAtivos
      ? await prisma.coinPack.findMany({ where: { ativo: true }, orderBy: { precoCents: "asc" } })
      : [];
    res.json({ pagamentosAtivos: config.pagamentosAtivos, packs });
  } catch (e) {
    next(e);
  }
});

rotasMoedas.post(
  "/checkout",
  exigirAuth,
  validar(z.object({ packId: z.string().min(1) })),
  async (req, res, next) => {
    try {
      if (!config.pagamentosAtivos) throw new ErroNegocio("Pagamentos ainda não disponíveis.", 403);
      const pack = await prisma.coinPack.findUnique({ where: { id: req.dados.packId } });
      if (!pack || !pack.ativo) throw new ErroNegocio("Pack não encontrado.", 404);
      res.json({ url: urlCheckout(pack, req.user.id) });
    } catch (e) {
      next(e);
    }
  }
);
