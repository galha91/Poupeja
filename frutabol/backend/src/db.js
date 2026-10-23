import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

// Erro de negócio: mensagem segura para mostrar ao utilizador.
export class ErroNegocio extends Error {
  constructor(mensagem, codigo = 400) {
    super(mensagem);
    this.codigo = codigo;
  }
}

// Executa `fn(tx)` numa transação SERIALIZABLE, repetindo até 5 vezes em
// caso de conflito de serialização (P2034). É isto que impede double-spend
// e corridas entre licitações concorrentes.
export async function transacaoSegura(fn) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      });
    } catch (e) {
      const conflito =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
      if (!conflito || tentativa >= 5) throw e;
      // pequeno recuo aleatório antes de tentar de novo
      await new Promise((r) => setTimeout(r, 20 * tentativa + Math.random() * 50));
    }
  }
}
