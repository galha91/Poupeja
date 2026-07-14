// Tempo real: cada página de leilão junta-se à sala `leilao:<id>` e recebe
// eventos "licitacao" (nova licitação) e "estado" (ativado/terminado).

import { Server } from "socket.io";
import { config } from "./config.js";

let io = null;

export function iniciarSockets(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: { origin: config.frontendUrl, credentials: true },
  });
  io.on("connection", (socket) => {
    socket.on("entrar", (leilaoId) => {
      if (typeof leilaoId === "string" && leilaoId.length < 64) socket.join(`leilao:${leilaoId}`);
    });
    socket.on("sair", (leilaoId) => socket.leave(`leilao:${leilaoId}`));
  });
  return io;
}

export function emitirParaLeilao(leilaoId, evento, dados) {
  io?.to(`leilao:${leilaoId}`).emit(evento, dados);
}
