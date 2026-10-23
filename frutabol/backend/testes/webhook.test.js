// Webhook Lemon Squeezy: assinatura obrigatória + idempotência
// (o mesmo evento reenviado nunca credita moedas duas vezes).

import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import { prisma } from "../src/db.js";
import { app, limparBd, registarUtilizador } from "./ajuda.js";

// Estes testes assumem PAYMENTS_ENABLED=true e um segredo de webhook,
// definidos pelo runner de testes (ver package.json / CI).
const SEGREDO = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "segredo-teste";

function assinar(corpo) {
  return crypto.createHmac("sha256", SEGREDO).update(corpo).digest("hex");
}

function eventoOrdem(userId, packId, ordemId) {
  return JSON.stringify({
    meta: { event_name: "order_created", custom_data: { user_id: userId, pack_id: packId } },
    data: { id: ordemId },
  });
}

describe("webhook Lemon Squeezy", () => {
  let user, pack;

  beforeAll(async () => {
    await limparBd();
    ({ user } = await registarUtilizador());
    pack = await prisma.coinPack.create({
      data: { nome: "Pack Teste", moedas: 100, precoCents: 499, lsVariantId: "123" },
    });
  });

  it("rejeita assinatura inválida", async () => {
    const corpo = eventoOrdem(user.id, pack.id, 1);
    const r = await request(app)
      .post("/api/webhooks/lemonsqueezy")
      .set("Content-Type", "application/json")
      .set("X-Signature", "assinatura-falsa".padEnd(64, "0"))
      .send(corpo);
    expect(r.status).toBe(401);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(500); // nada creditado
  });

  it("credita moedas com assinatura válida", async () => {
    const corpo = eventoOrdem(user.id, pack.id, 42);
    const r = await request(app)
      .post("/api/webhooks/lemonsqueezy")
      .set("Content-Type", "application/json")
      .set("X-Signature", assinar(corpo))
      .send(corpo);
    expect(r.status).toBe(200);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(600);
  });

  it("evento duplicado não credita duas vezes (idempotência)", async () => {
    const corpo = eventoOrdem(user.id, pack.id, 42); // mesma ordem 42
    const r = await request(app)
      .post("/api/webhooks/lemonsqueezy")
      .set("Content-Type", "application/json")
      .set("X-Signature", assinar(corpo))
      .send(corpo);
    expect(r.status).toBe(200);
    expect(r.body.duplicado).toBe(true);
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(600); // continua igual
    // e o ledger só tem UMA compra de pack
    const compras = await prisma.coinTransaction.count({ where: { userId: user.id, tipo: "COMPRA_PACK" } });
    expect(compras).toBe(1);
  });
});
