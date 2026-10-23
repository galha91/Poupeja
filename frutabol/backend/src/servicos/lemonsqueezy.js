// FASE 2 — Lemon Squeezy (Merchant of Record: eles tratam de IVA mundial,
// faturas e reembolsos). Só ativo com PAYMENTS_ENABLED=true.
//
// Fluxo: o frontend abre o checkout (overlay) devolvido por /api/moedas/checkout;
// quando o pagamento é confirmado, o Lemon Squeezy chama o nosso webhook, que
// verifica a assinatura, garante idempotência e credita as moedas no ledger.

import crypto from "node:crypto";
import { config } from "../config.js";
import { prisma, transacaoSegura, ErroNegocio } from "../db.js";
import { movimentar } from "./moedas.js";
import { enviarRecibo } from "./email.js";

export function urlCheckout(pack, userId) {
  if (!config.pagamentosAtivos) throw new ErroNegocio("Pagamentos ainda não disponíveis.", 403);
  if (!pack.lsVariantId || !config.lemonSqueezy.loja)
    throw new ErroNegocio("Pack não configurado para venda.", 500);
  const p = new URLSearchParams({
    "checkout[custom][user_id]": userId,
    "checkout[custom][pack_id]": pack.id,
    embed: "1",
  });
  return `https://${config.lemonSqueezy.loja}.lemonsqueezy.com/checkout/buy/${pack.lsVariantId}?${p}`;
}

// Verifica a assinatura HMAC-SHA256 do webhook (header X-Signature) sobre o
// corpo RAW — por isso a rota usa express.raw().
export function assinaturaValida(corpoRaw, assinatura) {
  if (!assinatura || !config.lemonSqueezy.webhookSecret) return false;
  const esperada = crypto
    .createHmac("sha256", config.lemonSqueezy.webhookSecret)
    .update(corpoRaw)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada));
  } catch {
    return false;
  }
}

// Processa um evento order_created de forma idempotente: o mesmo evento
// (reenviado pelo Lemon Squeezy) nunca credita moedas duas vezes.
export async function processarEvento(evento) {
  const nome = evento?.meta?.event_name;
  if (nome !== "order_created") return { ignorado: true };

  const idEvento = String(
    evento?.data?.id ? `order-${evento.data.id}` : evento?.meta?.webhook_id || crypto.randomUUID()
  );
  const custom = evento?.meta?.custom_data || {};
  const userId = custom.user_id;
  const packId = custom.pack_id;
  if (!userId || !packId) throw new ErroNegocio("Evento sem user_id/pack_id.");

  const resultado = await transacaoSegura(async (tx) => {
    // idempotência: create falha se o evento já foi processado
    const jaExiste = await tx.webhookEvent.findUnique({ where: { id: idEvento } });
    if (jaExiste) return null;
    await tx.webhookEvent.create({ data: { id: idEvento } });

    const pack = await tx.coinPack.findUniqueOrThrow({ where: { id: packId } });
    await movimentar(tx, userId, "COMPRA_PACK", pack.moedas, {
      packId,
      precoCents: pack.precoCents,
      ordem: idEvento,
    });
    return pack;
  });

  if (resultado) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) enviarRecibo(user.email, resultado.nome, resultado.moedas).catch(() => {});
    return { creditado: resultado.moedas };
  }
  return { duplicado: true };
}
