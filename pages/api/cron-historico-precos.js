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

/*
 * Orçamento de tempo. Cada pesquisa vai a 5 supermercados e as 38 não cabem
 * nos 30 s que a função tem: o Vercel mostra "Task timed out after 30
 * seconds" todos os dias neste cron, a meio das pesquisas.
 *
 * Em vez de tentar tudo e ser cortado, para-se de começar pesquisas novas
 * ao fim de ORCAMENTO_MS e responde-se com o que ficou feito. Para todos os
 * artigos terem a sua vez, a lista começa num ponto diferente em cada dia
 * (os que ficaram para trás hoje, vêm primeiro amanhã).
 */
const ORCAMENTO_MS = 22_000;
const POR_DIA = 12; // quantos artigos o ponto de partida avança por dia

/* Ordem de hoje: a lista rodada, para o início variar de dia para dia. */
export function ordemDoDia(lista, agora = new Date()) {
  const dia = Math.floor(agora.getTime() / 86_400_000);
  const inicio = (dia * POR_DIA) % lista.length;
  return [...lista.slice(inicio), ...lista.slice(0, inicio)];
}

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const fila = ordemDoDia(POPULARES);
  const limite = Date.now() + ORCAMENTO_MS;
  let proximo = 0, feitos = 0, falhas = 0;
  await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
    while (proximo < fila.length && Date.now() < limite) {
      const q = fila[proximo++];
      try {
        const r = await pesquisarTudo(q);
        if (r.lojas.some((l) => l.ok)) { await registar(r); feitos++; } else falhas++;
      } catch { falhas++; }
      await new Promise((ok) => setTimeout(ok, PAUSA_MS));
    }
  }));
  const ficaramPorFazer = fila.length - proximo;
  console.log(`cron-historico-precos: ${feitos} registadas, ${falhas} falhadas, ${ficaramPorFazer} para outro dia`);
  return res.status(200).json({ ok: true, feitos, falhas, ficaramPorFazer });
}
