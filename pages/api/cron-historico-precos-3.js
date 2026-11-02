import { executar } from "./cron-historico-precos";
import { comRegisto } from "../../lib/cronRegisto";

/* 3.ª execução diária do histórico de preços: continua o resto do catálogo (ver cron-historico-precos). */
export const config = { maxDuration: 60 };

function handler(req, res) {
  return executar(req, res, 3);
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-historico-precos-3", handler);
