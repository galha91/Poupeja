import { pesquisarTudo } from "./supermercados";
import { registar } from "./supermercados/historico";
import { melhoresPorLoja, valorComparacao } from "./comparacao";
import { resumoAtual } from "./alertas";

// Partilhado pelos avisos por notificação (cron-avisos) e por email
// (cron-alertas-email).
const MAX_PESQUISAS_ALERTAS = 30;

/*
 * O mais barato de cada pesquisa com alertas — uma vez por pesquisa, por
 * muitos utilizadores que a tenham. Duas de cada vez, com pausa: em
 * rajada, o Continente recusa pedidos.
 */
export async function precosDosAlertas(qs, max = MAX_PESQUISAS_ALERTAS) {
  const lista = [...qs].slice(0, max);
  const out = {};
  let i = 0;
  await Promise.all([0, 1].map(async () => {
    while (i < lista.length) {
      const q = lista[i++];
      try {
        const r = await pesquisarTudo(q);
        await registar(r).catch(() => {});
        const { modo, ranking } = melhoresPorLoja(r);
        const p = ranking[0];
        if (p) out[q] = { ...resumoAtual(p, modo), valor: valorComparacao(p, modo), modo, unidade: modo === "embalagem" ? "embalagem" : p.nomeUnidade };
      } catch (_) {}
      await new Promise((ok) => setTimeout(ok, 600));
    }
  }));
  return out;
}

