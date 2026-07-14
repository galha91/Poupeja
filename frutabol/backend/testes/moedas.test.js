import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/db.js";
import { limparBd, registarUtilizador } from "./ajuda.js";

describe("moedas e ledger", () => {
  beforeAll(async () => {
    await limparBd();
  });

  it("regista com bónus de boas-vindas no ledger", async () => {
    const { user } = await registarUtilizador();
    expect(user.saldo).toBe(500);
    const movimentos = await prisma.coinTransaction.findMany({ where: { userId: user.id } });
    expect(movimentos).toHaveLength(1);
    expect(movimentos[0].tipo).toBe("BONUS_REGISTO");
    expect(movimentos[0].saldoApos).toBe(500);
  });

  it("bónus diário só pode ser reclamado uma vez por dia", async () => {
    const { agente } = await registarUtilizador();
    const r1 = await agente.post("/api/moedas/bonus-diario");
    expect(r1.status).toBe(200);
    expect(r1.body.valor).toBe(50);
    const r2 = await agente.post("/api/moedas/bonus-diario");
    expect(r2.status).toBe(400);
  });

  it("referral dá bónus aos dois e regista a relação", async () => {
    const { user: padrinho } = await registarUtilizador();
    const { user: afilhado } = await registarUtilizador({ codigoReferral: padrinho.codigoReferral });
    expect(afilhado.saldo).toBe(500 + 200);
    const padrinhoAtual = await prisma.user.findUnique({ where: { id: padrinho.id } });
    expect(padrinhoAtual.saldo).toBe(500 + 200);
    expect(await prisma.referral.count({ where: { padrinhoId: padrinho.id } })).toBe(1);
  });

  it("código de referral inválido é rejeitado", async () => {
    await expect(registarUtilizador({ codigoReferral: "FRBNAOEXISTE" })).rejects.toThrow();
  });
});
