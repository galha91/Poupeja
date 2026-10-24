import { executar } from "./cron-historico-precos";

/* 3.ª execução diária do histórico de preços: continua o resto do catálogo (ver cron-historico-precos). */
export const config = { maxDuration: 60 };

export default function handler(req, res) {
  return executar(req, res, 3);
}
