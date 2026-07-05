// Emails transacionais. Sem SMTP configurado (dev), imprime na consola —
// assim o fluxo de verificação funciona localmente sem contas externas.

import nodemailer from "nodemailer";
import { config } from "../config.js";

const transporte = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : null;

async function enviar(para, assunto, html) {
  if (!transporte) {
    console.log(`\n📧 [email simulado] Para: ${para}\nAssunto: ${assunto}\n${html.replace(/<[^>]+>/g, "")}\n`);
    return;
  }
  await transporte.sendMail({ from: config.smtp.from, to: para, subject: assunto, html });
}

const rodape = `<p style="color:#888;font-size:12px">FrutaBol — todas as personagens, clubes e equipamentos são fictícios e originais.</p>`;

export function enviarVerificacao(para, token) {
  const url = `${config.frontendUrl}/verificar?token=${token}`;
  return enviar(para, "Confirma o teu email — FrutaBol 🍌",
    `<h2>Bem-vindo à FrutaBol!</h2><p>Confirma o teu email para começares a colecionar:</p><p><a href="${url}">${url}</a></p>${rodape}`);
}

export function enviarUltrapassado(para, personagem, valor) {
  return enviar(para, `Foste ultrapassado no leilão de ${personagem}! ⚡`,
    `<p>Alguém licitou <b>${valor} moedas</b> por <b>${personagem}</b>. As tuas moedas cativas já foram devolvidas — ainda vais a tempo de responder!</p><p><a href="${config.frontendUrl}">Voltar ao leilão</a></p>${rodape}`);
}

export function enviarVitoria(para, personagem, valor) {
  return enviar(para, `Ganhaste o leilão de ${personagem}! 🏆`,
    `<p>Parabéns! <b>${personagem}</b> é teu por <b>${valor} moedas</b>. O download em alta resolução e o certificado de autenticidade já estão na tua coleção.</p><p><a href="${config.frontendUrl}/colecao">Ver a minha coleção</a></p>${rodape}`);
}

export function enviarRecibo(para, pack, moedas) {
  return enviar(para, "Recibo — moedas FrutaBol 🪙",
    `<p>Obrigado! O pack <b>${pack}</b> foi processado e <b>${moedas} moedas</b> já estão na tua conta. A fatura oficial é emitida pelo nosso parceiro Lemon Squeezy e chega por email.</p>${rodape}`);
}
