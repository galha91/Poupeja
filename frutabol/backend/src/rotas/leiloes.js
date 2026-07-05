import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validar } from "../middleware/validar.js";
import { exigirAuth } from "../middleware/auth.js";
import { limiteLicitacoes } from "../middleware/limites.js";
import { licitar, comprarImediato, obterLeilao, leilaoPublico } from "../servicos/leiloes.js";

export const rotasLeiloes = Router();

// Lista de leilões ativos e agendados (para a página inicial)
rotasLeiloes.get("/", async (_req, res, next) => {
  try {
    const leiloes = await prisma.auction.findMany({
      where: { estado: { in: ["ATIVO", "AGENDADO"] } },
      orderBy: { fim: "asc" },
      take: 24,
      include: {
        character: true,
        edition: true,
        bids: { orderBy: { valor: "desc" }, take: 1, include: { user: { select: { nome: true } } } },
        _count: { select: { bids: true } },
      },
    });
    res.json({ leiloes: leiloes.map(leilaoPublico), agora: new Date() });
  } catch (e) {
    next(e);
  }
});

rotasLeiloes.get("/:id", async (req, res, next) => {
  try {
    const leilao = await obterLeilao(req.params.id);
    if (!leilao) return res.status(404).json({ erro: "Leilão não encontrado." });
    const historicoBids = await prisma.bid.findMany({
      where: { auctionId: leilao.id },
      orderBy: { valor: "desc" },
      take: 20,
      include: { user: { select: { nome: true } } },
    });
    res.json({
      leilao: leilaoPublico(leilao),
      historico: historicoBids.map((b) => ({ nome: b.user.nome, valor: b.valor, em: b.criadoEm })),
      agora: new Date(),
    });
  } catch (e) {
    next(e);
  }
});

// Licitar — o valor vem do cliente mas TODAS as regras (mínimo, saldo,
// estado, fim) são validadas server-side dentro da transação.
rotasLeiloes.post(
  "/:id/licitar",
  exigirAuth,
  limiteLicitacoes,
  validar(z.object({ valor: z.number().int().positive().max(100_000_000) })),
  async (req, res, next) => {
    try {
      const leilao = await licitar(req.params.id, req.user.id, req.dados.valor);
      res.json({ leilao: leilaoPublico(leilao) });
    } catch (e) {
      next(e);
    }
  }
);

rotasLeiloes.post("/:id/comprar", exigirAuth, limiteLicitacoes, async (req, res, next) => {
  try {
    const leilao = await comprarImediato(req.params.id, req.user.id);
    res.json({ leilao: leilaoPublico(leilao) });
  } catch (e) {
    next(e);
  }
});
