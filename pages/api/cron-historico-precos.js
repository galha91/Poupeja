import { bearerValido } from "../../lib/seguranca";
import { pesquisarTudo } from "../../lib/supermercados";
import { registar } from "../../lib/supermercados/historico";

/*
 * Histórico diário de preços (Vercel Cron, ver vercel.json).
 *
 * As pesquisas feitas na app já ficam registadas, mas só quando alguém
 * as faz. Estes artigos — o cabaz de quase toda a gente — são registados
 * todos os dias, para o "mais baixo dos últimos 30 dias" ter sempre dados.
 *
 * Duas pesquisas de cada vez e uma pausa entre elas: em rajada, o
 * Continente começa a recusar pedidos.
 */

export const POPULARES = [
  "laranjas", "maçãs", "bananas", "peras", "tomate", "batatas", "cebolas", "cenouras", "alface", "salsa",
  "leite meio gordo", "ovos", "iogurte natural", "manteiga", "queijo flamengo", "fiambre",
  "arroz", "esparguete", "azeite", "óleo", "açúcar", "farinha", "café", "atum",
  "frango", "peito de frango", "carne picada", "bacalhau", "pescada",
  "pão de forma", "bolacha maria", "cereais", "água", "cerveja",
  "papel higiénico", "detergente roupa", "detergente loiça", "fraldas",
];

const EM_PARALELO = 2;
const PAUSA_MS = 700;

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  let proximo = 0, feitos = 0, falhas = 0;
  await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
    while (proximo < POPULARES.length) {
      const q = POPULARES[proximo++];
      try {
        const r = await pesquisarTudo(q);
        if (r.lojas.some((l) => l.ok)) { await registar(r); feitos++; } else falhas++;
      } catch { falhas++; }
      await new Promise((ok) => setTimeout(ok, PAUSA_MS));
    }
  }));
  console.log(`cron-historico-precos: ${feitos} registadas, ${falhas} falhadas`);
  return res.status(200).json({ ok: true, feitos, falhas });
}
