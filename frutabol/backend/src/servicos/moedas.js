// Serviço de moedas — ÚNICO ponto de escrita de saldos.
// Regras: todo o movimento acontece dentro de uma transação (recebe `tx`),
// fica registado no ledger imutável (CoinTransaction) e nunca deixa o
// saldo negativo. Nunca aceitar valores vindos do cliente sem validar.

import { ErroNegocio, prisma, transacaoSegura } from "../db.js";
import { config } from "../config.js";

// Movimenta moedas de um utilizador dentro da transação `tx`.
export async function movimentar(tx, userId, tipo, valor, meta = undefined) {
  if (!Number.isInteger(valor)) throw new ErroNegocio("Valor inválido.");
  const user = await tx.user.update({
    where: { id: userId },
    data: { saldo: { increment: valor } },
    select: { saldo: true },
  });
  if (user.saldo < 0) throw new ErroNegocio("Saldo insuficiente.", 402);
  await tx.coinTransaction.create({
    data: { userId, tipo, valor, saldoApos: user.saldo, meta },
  });
  return user.saldo;
}

// Lê um valor de configuração (bónus) com fallback para os defaults.
export async function valorConfig(tx, chave) {
  const linha = await tx.config.findUnique({ where: { chave } });
  if (linha) return linha.valor;
  const defaults = {
    BONUS_REGISTO: config.bonus.registo,
    BONUS_DIARIO: config.bonus.diario,
    BONUS_REFERRAL: config.bonus.referral,
  };
  return defaults[chave] ?? 0;
}

// Bónus diário — no máximo um por dia de calendário (UTC).
export async function reclamarBonusDiario(userId) {
  return transacaoSegura(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const hoje = new Date().toISOString().slice(0, 10);
    const ultimo = user.ultimoBonusDiario?.toISOString().slice(0, 10);
    if (ultimo === hoje) throw new ErroNegocio("Já recebeste o bónus de hoje. Volta amanhã! 🍊");
    const valor = await valorConfig(tx, "BONUS_DIARIO");
    await tx.user.update({ where: { id: userId }, data: { ultimoBonusDiario: new Date() } });
    const saldo = await movimentar(tx, userId, "BONUS_DIARIO", valor);
    return { saldo, valor };
  });
}

export async function historico(userId, limite = 50) {
  return prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });
}
