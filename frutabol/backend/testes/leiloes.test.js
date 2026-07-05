// O teste mais importante do projeto: licitações CONCORRENTES não podem
// criar dinheiro, perder dinheiro nem deixar dois vencedores.

import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/db.js";
import { processarLeiloes } from "../src/servicos/leiloes.js";
import { limparBd, registarUtilizador, criarLeilaoDeTeste } from "./ajuda.js";

describe("leilões", () => {
  beforeAll(async () => {
    await limparBd();
  });

  it("licitação cativa moedas; ser ultrapassado devolve-as", async () => {
    const a = await registarUtilizador();
    const b = await registarUtilizador();
    const leilao = await criarLeilaoDeTeste({ precoInicial: 100, incremento: 10 });

    const r1 = await a.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 100 });
    expect(r1.status).toBe(200);
    let userA = await prisma.user.findUnique({ where: { id: a.user.id } });
    expect(userA.saldo).toBe(400); // 500 - 100 cativas

    const r2 = await b.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 150 });
    expect(r2.status).toBe(200);
    userA = await prisma.user.findUnique({ where: { id: a.user.id } });
    const userB = await prisma.user.findUnique({ where: { id: b.user.id } });
    expect(userA.saldo).toBe(500); // devolvidas
    expect(userB.saldo).toBe(350);
  });

  it("rejeita licitações abaixo do mínimo e acima do saldo", async () => {
    const a = await registarUtilizador();
    const leilao = await criarLeilaoDeTeste({ precoInicial: 100, incremento: 10 });
    expect((await a.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 50 })).status).toBe(400);
    expect((await a.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 9999 })).status).toBe(402);
  });

  it("20 licitações concorrentes: sem double-spend, saldo total conservado", async () => {
    const jogadores = [];
    for (let i = 0; i < 4; i++) jogadores.push(await registarUtilizador());
    const leilao = await criarLeilaoDeTeste({ precoInicial: 10, incremento: 1, minutos: 10 });

    // 4 utilizadores × 5 licitações em paralelo com valores crescentes
    const pedidos = [];
    for (let volta = 0; volta < 5; volta++) {
      jogadores.forEach((j, ji) => {
        pedidos.push(
          j.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 20 + volta * 40 + ji * 7 })
        );
      });
    }
    const respostas = await Promise.all(pedidos);
    const aceites = respostas.filter((r) => r.status === 200).length;
    expect(aceites).toBeGreaterThan(0);

    // invariante 1: exatamente UM utilizador tem moedas cativas (o topo)
    const topo = await prisma.bid.findFirst({ where: { auctionId: leilao.id }, orderBy: { valor: "desc" } });
    const saldos = await prisma.user.findMany({
      where: { id: { in: jogadores.map((j) => j.user.id) } },
    });
    for (const u of saldos) {
      const esperado = u.id === topo.userId ? 500 - topo.valor : 500;
      expect(u.saldo).toBe(esperado);
    }

    // invariante 2: o ledger de cada utilizador soma exatamente o saldo
    for (const u of saldos) {
      const movimentos = await prisma.coinTransaction.findMany({ where: { userId: u.id } });
      const soma = movimentos.reduce((s, m) => s + m.valor, 0);
      expect(soma).toBe(u.saldo);
    }

    // fecho: vencedor recebe a edição e o certificado; sem novo débito
    await prisma.auction.update({ where: { id: leilao.id }, data: { fim: new Date(Date.now() - 1000) } });
    await processarLeiloes();
    const fechado = await prisma.auction.findUnique({ where: { id: leilao.id } });
    expect(fechado.estado).toBe("TERMINADO");
    expect(fechado.vencedorId).toBe(topo.userId);
    const edicao = await prisma.edition.findUnique({ where: { id: fechado.editionId }, include: { certificado: true } });
    expect(edicao.ownerId).toBe(topo.userId);
    expect(edicao.certificado).not.toBeNull();
    const vencedor = await prisma.user.findUnique({ where: { id: topo.userId } });
    expect(vencedor.saldo).toBe(500 - topo.valor);
  });

  it("anti-sniping: licitar nos últimos 60s estende o fim", async () => {
    const a = await registarUtilizador();
    const leilao = await criarLeilaoDeTeste({ precoInicial: 10, minutos: 0.5 }); // fim em 30s
    const fimAntes = leilao.fim.getTime();
    await a.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 10 });
    const depois = await prisma.auction.findUnique({ where: { id: leilao.id } });
    expect(depois.fim.getTime()).toBe(fimAntes + 60000);
  });

  it("compra imediata fecha o leilão e devolve moedas ao licitador ultrapassado", async () => {
    const a = await registarUtilizador();
    const b = await registarUtilizador();
    const leilao = await criarLeilaoDeTeste({ precoInicial: 50, compraImediata: 300 });
    await a.agente.post(`/api/leiloes/${leilao.id}/licitar`).send({ valor: 50 });
    const r = await b.agente.post(`/api/leiloes/${leilao.id}/comprar`);
    expect(r.status).toBe(200);
    const userA = await prisma.user.findUnique({ where: { id: a.user.id } });
    const userB = await prisma.user.findUnique({ where: { id: b.user.id } });
    expect(userA.saldo).toBe(500);
    expect(userB.saldo).toBe(200);
    const fechado = await prisma.auction.findUnique({ where: { id: leilao.id } });
    expect(fechado.estado).toBe("TERMINADO");
    expect(fechado.vencedorId).toBe(b.user.id);
  });
});
