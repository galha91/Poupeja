import { Router } from "express";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { z } from "zod";
import { prisma, transacaoSegura, ErroNegocio } from "../db.js";
import { validar } from "../middleware/validar.js";
import { exigirAdmin } from "../middleware/auth.js";
import { PASTA_UPLOADS } from "../servicos/ficheiros.js";

export const rotasAdmin = Router();
rotasAdmin.use(exigirAdmin);

// Upload de imagens: nome aleatório, extensões controladas, 10 MB máx.
const upload = multer({
  storage: multer.diskStorage({
    destination: PASTA_UPLOADS,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomBytes(10).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new ErroNegocio("Formato de imagem não suportado."), ok);
  },
});

const esquemaPersonagem = z.object({
  nome: z.string().min(2).max(48),
  clube: z.string().min(2).max(48),
  descricao: z.string().min(2).max(600),
  estilo: z.string().min(2).max(120),
  raridade: z.enum(["COMUM", "RARO", "EPICO", "LENDARIO"]),
  tiragem: z.coerce.number().int().min(1).max(10000),
});

// ---------- personagens ----------
rotasAdmin.get("/personagens", async (_req, res, next) => {
  try {
    const personagens = await prisma.character.findMany({
      orderBy: { criadoEm: "desc" },
      include: { _count: { select: { edicoes: true, leiloes: true } } },
    });
    res.json({ personagens });
  } catch (e) { next(e); }
});

rotasAdmin.post("/personagens", upload.single("imagem"), validar(esquemaPersonagem), async (req, res, next) => {
  try {
    if (!req.file) throw new ErroNegocio("Falta a imagem da personagem.");
    const personagem = await prisma.character.create({
      data: { ...req.dados, imagem: req.file.filename },
    });
    res.status(201).json({ personagem });
  } catch (e) { next(e); }
});

rotasAdmin.put("/personagens/:id", upload.single("imagem"), validar(esquemaPersonagem.partial()), async (req, res, next) => {
  try {
    const dados = { ...req.dados };
    if (req.file) dados.imagem = req.file.filename;
    if (typeof req.body.ativo !== "undefined") dados.ativo = req.body.ativo === "true" || req.body.ativo === true;
    const personagem = await prisma.character.update({ where: { id: req.params.id }, data: dados });
    res.json({ personagem });
  } catch (e) { next(e); }
});

// ---------- leilões: criar/agendar ----------
const esquemaLeilao = z.object({
  characterId: z.string().min(1),
  precoInicial: z.number().int().min(1),
  incrementoMinimo: z.number().int().min(1).default(5),
  compraImediata: z.number().int().min(1).nullable().optional(),
  inicio: z.coerce.date().optional(), // omitido = começa já
  duracaoMin: z.number().int().min(1).max(7 * 24 * 60),
});

rotasAdmin.post("/leiloes", validar(esquemaLeilao), async (req, res, next) => {
  try {
    const d = req.dados;
    const leilao = await transacaoSegura(async (tx) => {
      const personagem = await tx.character.findUniqueOrThrow({ where: { id: d.characterId } });
      const emitidas = await tx.edition.count({ where: { characterId: personagem.id } });
      if (emitidas >= personagem.tiragem)
        throw new ErroNegocio(`Tiragem esgotada (${personagem.tiragem} edições).`);
      const edicao = await tx.edition.create({
        data: { characterId: personagem.id, numero: emitidas + 1 },
      });
      const inicio = d.inicio || new Date();
      return tx.auction.create({
        data: {
          editionId: edicao.id,
          characterId: personagem.id,
          precoInicial: d.precoInicial,
          incrementoMinimo: d.incrementoMinimo,
          compraImediata: d.compraImediata || null,
          inicio,
          fim: new Date(inicio.getTime() + d.duracaoMin * 60000),
          estado: inicio <= new Date() ? "ATIVO" : "AGENDADO",
        },
      });
    });
    res.status(201).json({ leilao });
  } catch (e) { next(e); }
});

rotasAdmin.post("/leiloes/:id/cancelar", async (req, res, next) => {
  try {
    const leilao = await transacaoSegura(async (tx) => {
      const l = await tx.auction.findUniqueOrThrow({
        where: { id: req.params.id },
        include: { bids: { orderBy: { valor: "desc" }, take: 1 } },
      });
      if (l.estado === "TERMINADO") throw new ErroNegocio("Este leilão já terminou.");
      // devolve as moedas cativas do maior licitador
      if (l.bids[0]) {
        const { movimentar } = await import("../servicos/moedas.js");
        await movimentar(tx, l.bids[0].userId, "DEVOLUCAO", l.bids[0].valor, { leilaoId: l.id, motivo: "cancelado" });
      }
      return tx.auction.update({ where: { id: l.id }, data: { estado: "CANCELADO" } });
    });
    res.json({ leilao });
  } catch (e) { next(e); }
});

// ---------- packs de moedas (fase 2) ----------
const esquemaPack = z.object({
  nome: z.string().min(2).max(48),
  moedas: z.number().int().min(1),
  precoCents: z.number().int().min(1),
  lsVariantId: z.string().max(64).nullable().optional(),
  ativo: z.boolean().optional(),
});

rotasAdmin.get("/packs", async (_req, res, next) => {
  try { res.json({ packs: await prisma.coinPack.findMany({ orderBy: { precoCents: "asc" } }) }); }
  catch (e) { next(e); }
});
rotasAdmin.post("/packs", validar(esquemaPack), async (req, res, next) => {
  try { res.status(201).json({ pack: await prisma.coinPack.create({ data: req.dados }) }); }
  catch (e) { next(e); }
});
rotasAdmin.put("/packs/:id", validar(esquemaPack.partial()), async (req, res, next) => {
  try { res.json({ pack: await prisma.coinPack.update({ where: { id: req.params.id }, data: req.dados }) }); }
  catch (e) { next(e); }
});

// ---------- bónus configuráveis ----------
rotasAdmin.get("/config", async (_req, res, next) => {
  try {
    const linhas = await prisma.config.findMany();
    res.json({ config: Object.fromEntries(linhas.map((l) => [l.chave, l.valor])) });
  } catch (e) { next(e); }
});
rotasAdmin.put(
  "/config",
  validar(z.object({
    BONUS_REGISTO: z.number().int().min(0).optional(),
    BONUS_DIARIO: z.number().int().min(0).optional(),
    BONUS_REFERRAL: z.number().int().min(0).optional(),
  })),
  async (req, res, next) => {
    try {
      for (const [chave, valor] of Object.entries(req.dados)) {
        await prisma.config.upsert({ where: { chave }, update: { valor }, create: { chave, valor } });
      }
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
);

// ---------- dashboard ----------
rotasAdmin.get("/dashboard", async (_req, res, next) => {
  try {
    const [utilizadores, moedasCirculacao, leiloesAtivos, vendas, comprasPack, topCompradores] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.aggregate({ _sum: { saldo: true } }),
        prisma.auction.count({ where: { estado: "ATIVO" } }),
        prisma.purchase.aggregate({ _sum: { valor: true }, _count: true }),
        prisma.coinTransaction.findMany({ where: { tipo: "COMPRA_PACK" }, select: { meta: true } }),
        prisma.purchase.groupBy({
          by: ["userId"],
          _sum: { valor: true },
          orderBy: { _sum: { valor: "desc" } },
          take: 5,
        }),
      ]);
    const receitaCents = comprasPack.reduce((s, t) => s + (t.meta?.precoCents || 0), 0);
    const nomes = await prisma.user.findMany({
      where: { id: { in: topCompradores.map((t) => t.userId) } },
      select: { id: true, nome: true },
    });
    const nomePorId = Object.fromEntries(nomes.map((n) => [n.id, n.nome]));
    res.json({
      utilizadores,
      moedasEmCirculacao: moedasCirculacao._sum.saldo || 0,
      leiloesAtivos,
      itensVendidos: vendas._count,
      moedasGastasEmItens: vendas._sum.valor || 0,
      receitaCents,
      topCompradores: topCompradores.map((t) => ({
        nome: nomePorId[t.userId] || "?",
        moedasGastas: t._sum.valor,
      })),
    });
  } catch (e) { next(e); }
});
