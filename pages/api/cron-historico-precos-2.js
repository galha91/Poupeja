import { executar } from "./cron-historico-precos";

/* 2.ª execução diária do histórico de preços: continua o resto do catálogo (ver cron-historico-precos). */
export default function handler(req, res) {
  return executar(req, res, 2);
}
