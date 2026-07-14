// Motor de leilões — todas as operações críticas correm em transações
// serializáveis (ver transacaoSegura): duas licitações simultâneas nunca
// podem ambas "ganhar", e as moedas do maior licitador ficam cativas
// (débito LICITACAO) até ser ultrapassado (crédito DEVOLUCAO) ou vencer.

import { ErroNegocio, prisma, transacaoSegura } from "../db.js";
import { movimentar } from "./moedas.js";
import { emitirCertificado } from "./certificados.js";
import { enviarUltrapassado, enviarVitoria } from "./email.js";
import { emitirParaLeilao } from "../sockets.js";

const ANTI_SNIPING_MS = 60 * 1000; // licitação nos últimos 60s estende 60s

export function leilaoPublico(l) {
  const topo = l.bids?.[0];
  return {
    id: l.id,
    character: l.character,
    editionNumero: l.edition?.numero,
    tiragem: l.character?.tiragem,
    precoInicial: l.precoInicial,
    incrementoMinimo: l.incrementoMinimo,
    compraImediata: l.compraImediata,
    inicio: l.inicio,
    fim: l.fim,
    estado: l.estado,
    precoFinal: l.precoFinal,
    licitacaoAtual: topo?.valor ?? null,
    licitante: topo?.user?.nome ?? null,
    nLicitacoes: l._count?.bids ?? l.bids?.length ?? 0,
  };
}

const INCLUDE_LEILAO = {
  character: true,
  edition: true,
  bids: { orderBy: { valor: "desc" }, take: 1, include: { user: { select: { nome: true, id: true, email: true } } } },
  _count: { select: { bids: true } },
};

export async function obterLeilao(id) {
  return prisma.auction.findUnique({ where: { id }, include: INCLUDE_LEILAO });
}

// ---------- licitar ----------
export async function licitar(leilaoId, userId, valor) {
  const resultado = await transacaoSegura(async (tx) => {
    const leilao = await tx.auction.findUnique({ where: { id: leilaoId }, include: INCLUDE_LEILAO });
    if (!leilao) throw new ErroNegocio("Leilão não encontrado.", 404);
    const agora = new Date();
    if (leilao.estado !== "ATIVO" || agora >= leilao.fim) throw new ErroNegocio("Este leilão já não está ativo.");
    if (agora < leilao.inicio) throw new ErroNegocio("Este leilão ainda não começou.");

    const topo = leilao.bids[0] || null;
    const minimo = topo ? topo.valor + leilao.incrementoMinimo : leilao.precoInicial;
    if (valor < minimo) throw new ErroNegocio(`A licitação mínima é ${minimo} moedas.`);
    if (leilao.compraImediata && valor >= leilao.compraImediata)
      throw new ErroNegocio(`Para esse valor usa a compra imediata (${leilao.compraImediata} moedas).`);

    // devolve as moedas cativas ao anterior maior licitador (pode ser o próprio,
    // se estiver a subir a sua licitação)
    if (topo) {
      await movimentar(tx, topo.userId, "DEVOLUCAO", topo.valor, { leilaoId, motivo: "ultrapassado" });
    }
    // cativa as moedas da nova licitação
    await movimentar(tx, userId, "LICITACAO", -valor, { leilaoId });

    await tx.bid.create({ data: { auctionId: leilaoId, userId, valor } });

    // anti-sniping: estende o fim se faltar menos de 60s
    let fim = leilao.fim;
    if (leilao.fim.getTime() - agora.getTime() < ANTI_SNIPING_MS) {
      fim = new Date(leilao.fim.getTime() + ANTI_SNIPING_MS);
      await tx.auction.update({ where: { id: leilaoId }, data: { fim } });
    }

    return {
      ultrapassado: topo && topo.userId !== userId ? topo.user : null,
      leilao: await tx.auction.findUniqueOrThrow({ where: { id: leilaoId }, include: INCLUDE_LEILAO }),
    };
  });

  // fora da transação: notificações (não podem desfazer a licitação)
  emitirParaLeilao(resultado.leilao.id, "licitacao", leilaoPublico(resultado.leilao));
  if (resultado.ultrapassado) {
    enviarUltrapassado(resultado.ultrapassado.email, resultado.leilao.character.nome, valor).catch(() => {});
  }
  return resultado.leilao;
}

// ---------- compra imediata ----------
export async function comprarImediato(leilaoId, userId) {
  const leilaoFechado = await transacaoSegura(async (tx) => {
    const leilao = await tx.auction.findUnique({ where: { id: leilaoId }, include: INCLUDE_LEILAO });
    if (!leilao) throw new ErroNegocio("Leilão não encontrado.", 404);
    if (leilao.estado !== "ATIVO" || new Date() >= leilao.fim) throw new ErroNegocio("Este leilão já não está ativo.");
    if (!leilao.compraImediata) throw new ErroNegocio("Este item não tem compra imediata.");

    const topo = leilao.bids[0] || null;
    if (topo) await movimentar(tx, topo.userId, "DEVOLUCAO", topo.valor, { leilaoId, motivo: "compra imediata" });
    await movimentar(tx, userId, "COMPRA_IMEDIATA", -leilao.compraImediata, { leilaoId });

    return fecharLeilao(tx, leilao, userId, leilao.compraImediata, "COMPRA_IMEDIATA");
  });

  emitirParaLeilao(leilaoId, "estado", leilaoPublico(leilaoFechado));
  const vencedor = await prisma.user.findUnique({ where: { id: userId } });
  enviarVitoria(vencedor.email, leilaoFechado.character.nome, leilaoFechado.precoFinal).catch(() => {});
  return leilaoFechado;
}

// Fecha um leilão com vencedor: entrega a edição, regista a compra e emite
// o certificado. As moedas do vencedor já estão cativas — não há novo débito.
async function fecharLeilao(tx, leilao, vencedorId, precoFinal, tipoCompra) {
  await tx.auction.update({
    where: { id: leilao.id },
    data: { estado: "TERMINADO", vencedorId, precoFinal, fim: new Date() },
  });
  await tx.edition.update({ where: { id: leilao.editionId }, data: { ownerId: vencedorId } });
  await tx.purchase.create({
    data: { editionId: leilao.editionId, userId: vencedorId, valor: precoFinal, tipo: tipoCompra },
  });
  await emitirCertificado(tx, leilao.editionId);
  return tx.auction.findUniqueOrThrow({ where: { id: leilao.id }, include: INCLUDE_LEILAO });
}

// ---------- relógio do servidor ----------
// Corre a cada poucos segundos: ativa leilões agendados e fecha os expirados.
// O fim é SEMPRE decidido aqui (server-side) — o contador no browser é só visual.
export async function processarLeiloes() {
  const agora = new Date();

  const paraAtivar = await prisma.auction.findMany({
    where: { estado: "AGENDADO", inicio: { lte: agora } },
  });
  for (const l of paraAtivar) {
    await prisma.auction.update({ where: { id: l.id }, data: { estado: "ATIVO" } });
    const completo = await obterLeilao(l.id);
    emitirParaLeilao(l.id, "estado", leilaoPublico(completo));
  }

  const expirados = await prisma.auction.findMany({
    where: { estado: "ATIVO", fim: { lte: agora } },
    select: { id: true },
  });

  for (const { id } of expirados) {
    try {
      const resultado = await transacaoSegura(async (tx) => {
        const leilao = await tx.auction.findUnique({ where: { id }, include: INCLUDE_LEILAO });
        // reconfirma dentro da transação (pode ter sido estendido entretanto)
        if (!leilao || leilao.estado !== "ATIVO" || leilao.fim > new Date()) return null;
        const topo = leilao.bids[0] || null;
        if (!topo) {
          await tx.auction.update({ where: { id }, data: { estado: "TERMINADO" } });
          return { leilao: await tx.auction.findUniqueOrThrow({ where: { id }, include: INCLUDE_LEILAO }), vencedor: null };
        }
        const fechado = await fecharLeilao(tx, leilao, topo.userId, topo.valor, "LEILAO");
        return { leilao: fechado, vencedor: topo.user };
      });
      if (resultado) {
        emitirParaLeilao(id, "estado", leilaoPublico(resultado.leilao));
        if (resultado.vencedor) {
          enviarVitoria(resultado.vencedor.email, resultado.leilao.character.nome, resultado.leilao.precoFinal).catch(() => {});
        }
      }
    } catch (e) {
      console.error(`Erro a fechar leilão ${id}:`, e.message);
    }
  }
}

export function iniciarRelogio() {
  const timer = setInterval(() => processarLeiloes().catch((e) => console.error(e)), 5000);
  timer.unref?.();
  return timer;
}
