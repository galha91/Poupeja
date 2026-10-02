import { melhoresPorLoja } from "./comparacao.js";

/*
 * Últimos preços conhecidos, guardados no dispositivo.
 *
 * A lista de compras tem de funcionar no supermercado, onde a rede é
 * fraca ou não há. Cada pesquisa que corre bem fica guardada em versão
 * compacta (só o melhor produto de cada loja, sem fotos); sem rede, a
 * comparação usa estes preços e diz de quando são.
 *
 * Não sincroniza com a conta: são preços públicos, não dados da pessoa.
 */

export const LS_PRECOS = "poupeja_precos_cache";
const MAX_PESQUISAS = 80;

const CAMPOS = ["loja", "lojaNome", "nome", "marca", "preco", "precoUnidade", "unidade", "nomeUnidade", "aoPeso", "qtdBase",
  "quantidade", "precoAntigo", "promo", "url", "onde", "periodo"];

/*
 * Fica só o que a soma da lista precisa: o melhor de cada loja, já na
 * ordem do ranking. Marcados como relevância 2, a leitura (melhoresPorLoja,
 * custoPorLoja) dá exatamente o mesmo resultado que com a resposta inteira.
 */
export function compactar(dados) {
  const { ranking } = melhoresPorLoja(dados);
  return {
    q: dados.q,
    modo: dados.modo || "unidade",
    nomeUnidade: dados.nomeUnidade || null,
    obtidoEm: dados.obtidoEm || new Date().toISOString(),
    historico: dados.historico || null,
    lojas: (dados.lojas || []).map((l) => ({ id: l.id, nome: l.nome, ok: l.ok })),
    produtos: ranking.map((p) => {
      const o = { relevancia: 2 };
      for (const c of CAMPOS) if (p[c] != null) o[c] = p[c];
      return o;
    }),
  };
}

function lerTudo() {
  try { return JSON.parse(localStorage.getItem(LS_PRECOS) || "{}") || {}; } catch { return {}; }
}

export function lerGuardado(q) {
  return lerTudo()[q] || null;
}

export function guardar(q, dados) {
  try {
    const tudo = lerTudo();
    tudo[q] = compactar(dados);
    const chaves = Object.keys(tudo);
    if (chaves.length > MAX_PESQUISAS) {
      chaves.sort((a, b) => String(tudo[a].obtidoEm).localeCompare(String(tudo[b].obtidoEm)))
        .slice(0, chaves.length - MAX_PESQUISAS)
        .forEach((k) => delete tudo[k]);
    }
    localStorage.setItem(LS_PRECOS, JSON.stringify(tudo));
  } catch {}
}

/*
 * Pesquisa com recurso ao guardado. Devolve { dados, guardado } — guardado
 * é true quando a resposta veio do dispositivo (sem rede ou API em baixo).
 */
export async function pesquisarComRecurso(q) {
  try {
    const r = await fetch(`/api/precos-supermercado?q=${encodeURIComponent(q)}`);
    if (!r.ok && r.status !== 502) throw new Error(`HTTP ${r.status}`);
    const dados = await r.json();
    if (r.ok && dados?.produtos?.length) guardar(q, dados);
    if (!r.ok) throw new Error("lojas em baixo");
    return { dados, guardado: false };
  } catch (e) {
    const antigo = lerGuardado(q);
    if (antigo) return { dados: antigo, guardado: true };
    throw e;
  }
}
