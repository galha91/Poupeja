import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validar } from "../middleware/validar.js";
import { exigirAuth } from "../middleware/auth.js";
import { leilaoPublico } from "../servicos/leiloes.js";

export const rotasCatalogo = Router();

// GET /api/catalogo?q=&raridade=&favoritos=1
rotasCatalogo.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const raridade = ["COMUM", "RARO", "EPICO", "LENDARIO"].includes(req.query.raridade)
      ? req.query.raridade
      : undefined;

    const personagens = await prisma.character.findMany({
      where: {
        ativo: true,
        raridade,
        ...(q && {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
            { estilo: { contains: q, mode: "insensitive" } },
            { clube: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { criadoEm: "desc" },
      include: {
        leiloes: {
          where: { estado: { in: ["ATIVO", "AGENDADO"] } },
          orderBy: { fim: "asc" },
          take: 1,
          include: { bids: { orderBy: { valor: "desc" }, take: 1 }, _count: { select: { bids: true } } },
        },
        edicoes: { where: { ownerId: { not: null } }, select: { id: true } },
      },
    });

    const meusFavoritos = req.user
      ? new Set(
          (await prisma.favorite.findMany({ where: { userId: req.user.id }, select: { characterId: true } })).map(
            (f) => f.characterId
          )
        )
      : new Set();

    res.json({
      personagens: personagens.map((p) => ({
        id: p.id,
        nome: p.nome,
        clube: p.clube,
        descricao: p.descricao,
        estilo: p.estilo,
        raridade: p.raridade,
        imagem: `/api/imagens/${p.imagem}`,
        tiragem: p.tiragem,
        vendidas: p.edicoes.length,
        favorito: meusFavoritos.has(p.id),
        leilao: p.leiloes[0]
          ? {
              id: p.leiloes[0].id,
              estado: p.leiloes[0].estado,
              fim: p.leiloes[0].fim,
              inicio: p.leiloes[0].inicio,
              licitacaoAtual: p.leiloes[0].bids[0]?.valor ?? null,
              precoInicial: p.leiloes[0].precoInicial,
              compraImediata: p.leiloes[0].compraImediata,
              nLicitacoes: p.leiloes[0]._count.bids,
            }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// Detalhe de personagem + leilões
rotasCatalogo.get("/:id", async (req, res, next) => {
  try {
    const p = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        leiloes: {
          orderBy: { criadoEm: "desc" },
          include: {
            edition: true,
            character: true,
            bids: { orderBy: { valor: "desc" }, take: 1, include: { user: { select: { nome: true } } } },
            _count: { select: { bids: true } },
          },
        },
        edicoes: { where: { ownerId: { not: null } }, select: { id: true } },
      },
    });
    if (!p || !p.ativo) return res.status(404).json({ erro: "Personagem não encontrada." });
    const favorito = req.user
      ? !!(await prisma.favorite.findUnique({
          where: { userId_characterId: { userId: req.user.id, characterId: p.id } },
        }))
      : false;
    res.json({
      personagem: {
        id: p.id, nome: p.nome, clube: p.clube, descricao: p.descricao, estilo: p.estilo,
        raridade: p.raridade, imagem: `/api/imagens/${p.imagem}`, tiragem: p.tiragem,
        vendidas: p.edicoes.length, favorito,
      },
      leiloes: p.leiloes.map(leilaoPublico),
    });
  } catch (e) {
    next(e);
  }
});

// Favoritos
rotasCatalogo.post(
  "/:id/favorito",
  exigirAuth,
  validar(z.object({}).passthrough()),
  async (req, res, next) => {
    try {
      const chave = { userId_characterId: { userId: req.user.id, characterId: req.params.id } };
      const existente = await prisma.favorite.findUnique({ where: chave });
      if (existente) {
        await prisma.favorite.delete({ where: chave });
        return res.json({ favorito: false });
      }
      await prisma.favorite.create({ data: { userId: req.user.id, characterId: req.params.id } });
      res.json({ favorito: true });
    } catch (e) {
      next(e);
    }
  }
);
