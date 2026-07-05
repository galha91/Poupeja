import { Router } from "express";
import path from "node:path";
import { prisma } from "../db.js";
import { exigirAuth } from "../middleware/auth.js";
import { gerarLinkDownload, verificarLink, PASTA_UPLOADS } from "../servicos/ficheiros.js";
import { gerarPdfCertificado } from "../servicos/certificados.js";

export const rotasColecao = Router();
export const rotasFicheiros = Router();

// A minha coleção: edições, certificados e compras
rotasColecao.get("/", exigirAuth, async (req, res, next) => {
  try {
    const edicoes = await prisma.edition.findMany({
      where: { ownerId: req.user.id },
      orderBy: { criadoEm: "desc" },
      include: { character: true, certificado: true, compra: true },
    });
    res.json({
      itens: edicoes.map((e) => ({
        editionId: e.id,
        numero: e.numero,
        tiragem: e.character.tiragem,
        personagem: {
          id: e.character.id, nome: e.character.nome, clube: e.character.clube,
          raridade: e.character.raridade, imagem: `/api/imagens/${e.character.imagem}`,
        },
        certificadoId: e.certificado?.id ?? null,
        compradoPor: e.compra?.valor ?? null,
        compradoEm: e.compra?.criadoEm ?? null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// Pede um link de download assinado (só o dono)
rotasColecao.post("/download/:editionId", exigirAuth, async (req, res, next) => {
  try {
    const edicao = await prisma.edition.findUnique({ where: { id: req.params.editionId } });
    if (!edicao || edicao.ownerId !== req.user.id)
      return res.status(403).json({ erro: "Este item não é teu." });
    res.json({ url: gerarLinkDownload(edicao.id, req.user.id), expiraEmMin: 15 });
  } catch (e) {
    next(e);
  }
});

// Certificado em PDF (só o dono)
rotasColecao.get("/certificado/:editionId", exigirAuth, async (req, res, next) => {
  try {
    const edicao = await prisma.edition.findUnique({
      where: { id: req.params.editionId },
      include: { character: true, certificado: true, owner: true },
    });
    if (!edicao || edicao.ownerId !== req.user.id)
      return res.status(403).json({ erro: "Este item não é teu." });
    if (!edicao.certificado) return res.status(404).json({ erro: "Sem certificado." });
    gerarPdfCertificado(res, { certificado: edicao.certificado, edicao, dono: edicao.owner });
  } catch (e) {
    next(e);
  }
});

// Serve o ficheiro de um link assinado. Reverifica assinatura, expiração
// E titularidade no momento do download.
rotasFicheiros.get("/:editionId", async (req, res, next) => {
  try {
    const { u, e, s } = req.query;
    if (!verificarLink(req.params.editionId, String(u || ""), e, String(s || "")))
      return res.status(403).json({ erro: "Link inválido ou expirado. Pede um novo na tua coleção." });
    const edicao = await prisma.edition.findUnique({
      where: { id: req.params.editionId },
      include: { character: true },
    });
    if (!edicao || edicao.ownerId !== u)
      return res.status(403).json({ erro: "Este item não é teu." });
    const ficheiro = path.join(PASTA_UPLOADS, path.basename(edicao.character.imagem));
    res.download(ficheiro, `${edicao.character.nome}-ed${edicao.numero}${path.extname(ficheiro)}`);
  } catch (e2) {
    next(e2);
  }
});
