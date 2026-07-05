// Entrega digital: links de download assinados (HMAC), com expiração,
// que só funcionam para o dono da edição. O ficheiro nunca é servido
// por URL pública direta.

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const PASTA_UPLOADS = path.join(raiz, "..", "uploads");

const VALIDADE_MS = 15 * 60 * 1000; // 15 minutos

function assinatura(editionId, userId, expira) {
  return crypto
    .createHmac("sha256", config.downloadSecret)
    .update(`${editionId}:${userId}:${expira}`)
    .digest("hex");
}

export function gerarLinkDownload(editionId, userId) {
  const expira = Date.now() + VALIDADE_MS;
  const sig = assinatura(editionId, userId, expira);
  return `${config.backendUrl}/api/ficheiros/${editionId}?u=${userId}&e=${expira}&s=${sig}`;
}

export function verificarLink(editionId, userId, expira, sig) {
  if (!userId || !expira || !sig) return false;
  if (Date.now() > Number(expira)) return false;
  const esperada = assinatura(editionId, userId, Number(expira));
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperada));
  } catch {
    return false;
  }
}
