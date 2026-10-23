// Certificados de autenticidade: ID único legível, hash SHA-256 da obra
// (imagem + dados da edição) e PDF gerado on-the-fly só para o dono.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { PASTA_UPLOADS } from "./ficheiros.js";

export async function emitirCertificado(tx, editionId) {
  const edicao = await tx.edition.findUniqueOrThrow({
    where: { id: editionId },
    include: { character: true, certificado: true },
  });
  if (edicao.certificado) return edicao.certificado;

  let bytesImagem = Buffer.alloc(0);
  try {
    bytesImagem = fs.readFileSync(path.join(PASTA_UPLOADS, edicao.character.imagem));
  } catch {
    // sem imagem, o hash cobre só os dados — continua válido e único
  }
  const hash = crypto
    .createHash("sha256")
    .update(bytesImagem)
    .update(`${edicao.characterId}:${edicao.id}:${edicao.numero}/${edicao.character.tiragem}`)
    .digest("hex");

  const id = `FRB-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  return tx.certificate.create({ data: { id, editionId, hash } });
}

// Escreve o PDF do certificado diretamente na resposta HTTP.
export function gerarPdfCertificado(res, { certificado, edicao, dono }) {
  const doc = new PDFDocument({ size: "A4", margin: 60 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${certificado.id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(10).fillColor("#888").text("FrutaBol — Colecionáveis Digitais", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(26).fillColor("#111").text("Certificado de Autenticidade", { align: "center" });
  doc.moveDown(2);

  const linha = (rotulo, valor) => {
    doc.fontSize(10).fillColor("#888").text(rotulo.toUpperCase());
    doc.fontSize(14).fillColor("#111").text(valor);
    doc.moveDown(0.8);
  };
  linha("Personagem", edicao.character.nome);
  linha("Clube fictício", edicao.character.clube);
  linha("Raridade", edicao.character.raridade);
  linha("Edição", `${edicao.numero} de ${edicao.character.tiragem}`);
  linha("Identificador", certificado.id);
  linha("Proprietário", dono.nome);
  linha("Data de emissão", certificado.emitidoEm.toISOString().slice(0, 10));
  linha("Impressão digital (SHA-256)", certificado.hash);

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#888").text(
    "Todas as personagens, clubes e equipamentos são fictícios e originais. " +
      "Qualquer semelhança com pessoas ou entidades reais é mera coincidência. " +
      "Este certificado comprova a titularidade desta edição digital na plataforma FrutaBol.",
    { align: "center" }
  );
  doc.end();
}
