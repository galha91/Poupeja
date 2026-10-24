import { bearerValido } from "../../lib/seguranca";
import { pesquisarTudo } from "../../lib/supermercados";
import { registar, registarEmbalagens, registarMarcas } from "../../lib/supermercados/historico";
import { ARTIGOS_SEO, CATEGORIAS_SEO, LOJAS_SEO, normalizarQ } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { filaDoDia, PARTES } from "../../lib/filaHistorico";

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
 *
 * Três execuções por dia (ver vercel.json): a 1.ª faz os populares e o
 * princípio do resto do catálogo; a 2.ª e a 3.ª (cron-historico-precos-2 e
 * -3) continuam o resto. A ordem vem de lib/filaHistorico.
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
// Na última volta sobra tempo para refazer os hubs (22 páginas) antes dos 30 s.
const ORCAMENTO_ULTIMA_MS = 12_000;
const VOLTAS_MAX = 4;

/*
 * Depois dos populares, o resto do catálogo: são os artigos com página
 * pública em /precos, e cada página só entra no Google com preços dos
 * últimos 3 dias. Não cabem numa execução, por isso cada volta, ao acabar
 * o orçamento, chama a seguinte com ?desde=<onde parou>&volta=<n+1> (o
 * mesmo encadeamento do cron do El Corte Inglés). Uma de cada vez, nunca em
 * paralelo, e com a mesma pausa entre pesquisas.
 *
 * O Vercel recusa (508, "loop detetado") a 6.ª chamada da função a si
 * própria, e os logs mostram que a cadeia parava aí todos os dias. Por
 * isso a cadeia é de VOLTAS_MAX voltas, de propósito: a última não chama a
 * seguinte e refaz os hubs. A revalidação (res.revalidate) é ela própria
 * uma chamada da função a si própria, por isso conta como mais uma: com 5
 * voltas ela era a 6.ª e os 22 hubs davam todos 508 (visto nos logs da
 * parte 3 a 24/10). Com 4 voltas é a 5.ª. O resto do catálogo roda de dia para dia
 * (lib/filaHistorico) em vez de se esperar que caiba numa só cadeia.
 */
export function filaCompleta(agora = new Date(), parte = 1) {
  const populares = POPULARES;
  const vistos = new Set(populares.map(normalizarQ));
  const resto = ARTIGOS_SEO.map((a) => a.q).filter((q) => !vistos.has(q) && vistos.add(q));
  return filaDoDia({ populares, resto }, agora, parte);
}

/* Os hubs refazem-se quando a volta acaba, para mostrarem já os preços de hoje. */
const HUBS = ["/precos", "/comparar", ...CATEGORIAS_SEO.map((c) => `/precos/categoria/${c.slug}`), ...LOJAS_SEO.map((l) => `/precos/loja/${l.slug}`)];

/*
 * O Vercel só lê o maxDuration deste ficheiro no vercel.json se o padrão
 * específico vier ANTES do genérico "pages/api/*.js" (vinha depois e esta
 * função cortava aos 30 s). Os orçamentos abaixo cabem nos 30 s mesmo que
 * o limite de 60 s não seja aplicado.
 */
export const config = { maxDuration: 60 };

export default function handler(req, res) {
  return executar(req, res);
}

/* parteFixa: a 2.ª e a 3.ª execuções diárias entram por outras rotas (cron-historico-precos-2 e -3) com a parte já escolhida. */
export async function executar(req, res, parteFixa) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const parte = parteFixa || Math.min(PARTES, Math.max(1, parseInt(req.query.parte, 10) || 1));
  const volta = Math.max(1, parseInt(req.query.volta, 10) || 1);
  const ultimaVolta = volta >= VOLTAS_MAX;
  const fila = filaCompleta(new Date(), parte);
  const desde = Math.max(0, Math.min(parseInt(req.query.desde, 10) || 0, fila.length));
  const limite = Date.now() + (ultimaVolta ? ORCAMENTO_ULTIMA_MS : ORCAMENTO_MS);
  let proximo = desde, feitos = 0, falhas = 0;
  await Promise.all(Array.from({ length: EM_PARALELO }, async () => {
    while (proximo < fila.length && Date.now() < limite) {
      const q = fila[proximo++];
      try {
        const r = await pesquisarTudo(q);
        if (r.lojas.some((l) => l.ok)) { await Promise.all([registar(r), registarEmbalagens(r).catch(() => {}), registarMarcas(r).catch(() => {})]); feitos++; } else falhas++;
      } catch { falhas++; }
      await new Promise((ok) => setTimeout(ok, PAUSA_MS));
    }
  }));
  const ficaramPorFazer = fila.length - proximo;
  // Falta fila, não é a última volta e esta registou alguma coisa: chama a
  // seguinte. Se nada correu bem (lojas a recusar), pára por hoje em vez de
  // insistir. Só se espera que o pedido chegue; a seguinte corre por conta
  // própria. Em produção, pelo domínio público: o endereço do deploy (o
  // Host que o cron da Vercel usa) está atrás da Proteção de Deployments e
  // devolvia 401 em silêncio, e a cadeia parava na primeira volta.
  if (ficaramPorFazer > 0 && feitos > 0 && !ultimaVolta) {
    const base = process.env.VERCEL_ENV === "production" ? URL_SITE : `https://${req.headers.host}`;
    const r = await fetch(`${base}/api/cron-historico-precos?desde=${proximo}&volta=${volta + 1}&parte=${parte}`, {
      headers: { authorization: req.headers.authorization },
      signal: AbortSignal.timeout(3000),
    }).catch(() => null); // timeout = a seguinte já está a correr
    if (r && !r.ok) console.warn(`cron-historico-precos: a volta seguinte respondeu ${r.status}`);
  }
  // Os hubs refazem-se quando a cadeia acaba: no fim da fila ou na última
  // volta. Em grupos, para as 22 páginas caberem no tempo que sobra.
  let hubs = 0;
  if (ficaramPorFazer === 0 || ultimaVolta) {
    for (let i = 0; i < HUBS.length; i += 4) {
      await Promise.all(HUBS.slice(i, i + 4).map(async (caminho) => {
        try { await res.revalidate(caminho); hubs++; } catch (e) { console.warn(`cron-historico-precos: revalidar ${caminho}:`, e.message); }
      }));
    }
  }
  console.log(`cron-historico-precos: parte ${parte}, volta ${volta}, desde ${desde}, ${feitos} registadas, ${falhas} falhadas, ${ficaramPorFazer} por fazer${hubs ? `, ${hubs} hubs refeitos` : ""}`);
  return res.status(200).json({ ok: true, parte, volta, desde, feitos, falhas, ficaramPorFazer, hubs });
}
