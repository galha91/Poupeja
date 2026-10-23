import http from "node:http";
import { criarApp } from "./app.js";
import { config } from "./config.js";
import { iniciarSockets } from "./sockets.js";
import { iniciarRelogio } from "./servicos/leiloes.js";

const app = criarApp();
const servidor = http.createServer(app);

iniciarSockets(servidor);
iniciarRelogio(); // ativa/fecha leilões server-side a cada 5s

servidor.listen(config.porta, () => {
  console.log(`🍌 FrutaBol backend em http://localhost:${config.porta}`);
  console.log(`   Pagamentos (fase 2): ${config.pagamentosAtivos ? "ATIVOS" : "desativados"}`);
});
