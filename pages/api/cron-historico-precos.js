import { bearerValido } from "../../lib/seguranca";
import { pesquisarTudo } from "../../lib/supermercados";
import { registar, registarMarcas } from "../../lib/supermercados/historico";
import { ARTIGOS_SEO, CATEGORIAS_SEO, LOJAS_SEO, normalizarQ } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";

/*
 * Histórico diário de preços (Vercel Cron, ver vercel.json).
 *
 * As pesquisas feitas na app já ficam registadas, mas só quando alguém
 * as faz. Estes artigos — o cabaz de quase toda a gente — são registados
 * todos os dias, para o "mais baixo dos últimos 30 dias" ter sempre dados;
 * a seguir, o resto do catálogo (ver filaCompleta), que alimenta /precos.
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

/*
 * Depois dos populares, o resto do catálogo da lista: são os artigos com
 * página pública em /precos, e cada página só entra no Google com preços
 * dos últimos 3 dias. Não cabem numa execução, por isso cada execução, ao
 * acabar o orçamento, chama a seguinte com ?desde=<onde parou> (o mesmo
 * encadeamento do cron do El Corte Inglés). Uma de cada vez, nunca em
 * paralelo, e com a mesma pausa entre pesquisas.
 */
export function filaCompleta(agora = new Date()) {
  const populares = ordemDoDia(POPULARES, agora);
  const vistos = new Set(populares.map(normalizarQ));
  const resto = ARTIGOS_SEO.map((a) => a.q).filter((q) => !vistos.has(q) && vistos.add(q));
  return [...populares, ...resto];
}

/* Os hubs refazem-se quando a volta acaba, para mostrarem já os preços de hoje. */
const HUBS = ["/precos", "/comparar", ...CATEGORIAS_SEO.map((c) => `/precos/categoria/${c.slug}`), ...LOJAS_SEO.map((l) => `/precos/loja/${l.slug}`)];

export default async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const fila = filaCompleta();
  const desde = Math.max(0, Math.min(parseInt(req.query.desde, 10) || 0, fila.length));
  const limite = Date.now() + ORCAMENTO_MS;
  let proximo = desde, feitos = 0, falhas = 0;
  await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
    while (proximo < fila.length && Date.now() < limite) {
      const q = fila[proximo++];
      try {
        const r = await pesquisarTudo(q);
        if (r.lojas.some((l) => l.ok)) { await Promise.all([registar(r), registarMarcas(r).catch(() => {})]); feitos++; } else falhas++;
      } catch { falhas++; }
      await new Promise((ok) => setTimeout(ok, PAUSA_MS));
    }
  }));
  const ficaramPorFazer = fila.length - proximo;
  // Falta fila e esta execução registou alguma coisa: chama a seguinte. Se
  // nada correu bem (lojas a recusar), pára por hoje em vez de insistir.
  // Só se espera que o pedido chegue; a seguinte corre por conta própria.
  // Em produção, pelo domínio público: o endereço do deploy (o Host que o
  // cron da Vercel usa) está atrás da Proteção de Deployments e devolvia
  // 401 em silêncio, e a cadeia parava na primeira volta.
  if (ficaramPorFazer > 0 && feitos > 0) {
    const base = process.env.VERCEL_ENV === "production" ? URL_SITE : `https://${req.headers.host}`;
    const r = await fetch(`${base}/api/cron-historico-precos?desde=${proximo}`, {
      headers: { authorization: req.headers.authorization },
      signal: AbortSignal.timeout(3000),
    }).catch(() => null); // timeout = a seguinte já está a correr
    if (r && !r.ok) console.warn(`cron-historico-precos: a volta seguinte respondeu ${r.status}`);
  }
  let hubs = 0;
  if (ficaramPorFazer === 0) {
    for (const caminho of HUBS) {
      try { await res.revalidate(caminho); hubs++; } catch (e) { console.warn(`cron-historico-precos: revalidar ${caminho}:`, e.message); }
    }
  }
  console.log(`cron-historico-precos: desde ${desde}, ${feitos} registadas, ${falhas} falhadas, ${ficaramPorFazer} por fazer${hubs ? `, ${hubs} hubs refeitos` : ""}`);
  return res.status(200).json({ ok: true, desde, feitos, falhas, ficaramPorFazer, hubs });
}
