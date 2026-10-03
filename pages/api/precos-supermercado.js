import { pesquisarTudo } from "../../lib/supermercados";
import { excedeuLimite } from "../../lib/protecao-api";
import { registar, resumo } from "../../lib/supermercados/historico";

// O histórico é um extra: nunca pode atrasar a resposta mais do que isto.
const comPrazo = (p, ms) => Promise.race([p, new Promise((ok) => setTimeout(() => ok(null), ms))]).catch(() => null);

/*
 * GET /api/precos-supermercado?q=laranjas
 *
 * Procura o artigo nos supermercados com loja online (e nos destaques de
 * loja do Lidl) e devolve tudo ordenado pelo preço por kg / L / unidade.
 *
 * Cada pesquisa custa pedidos a sites de terceiros, por isso há duas
 * camadas de cache: a CDN do Vercel (a mesma pesquisa, de quem for, é
 * servida da cache durante 1 h, no máximo) e uma memória curta dentro da função.
 */

const TTL_MEMORIA = 15 * 60 * 1000;
const memoria = new Map();

// O ecrã normaliza da mesma forma antes de pedir, para "Laranjas " e
// "laranjas" darem o mesmo URL — e a mesma entrada na cache da CDN.
function normalizarPesquisa(q) {
  return String(q || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido." });

  const q = normalizarPesquisa(req.query.q);
  if (q.length < 2) return res.status(400).json({ erro: "Escreve pelo menos 2 letras." });

  const guardado = memoria.get(q);
  if (guardado && Date.now() - guardado.em < TTL_MEMORIA) {
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=300");
    return res.status(200).json(guardado.dados);
  }

  // 40/min: comparar uma lista de compras faz uma pesquisa por artigo.
  // (As que vêm da cache nem chegam aqui.)
  if (excedeuLimite(req, "precos-supermercado", 40)) {
    return res.status(429).json({ erro: "Demasiadas pesquisas seguidas. Tenta daqui a um minuto." });
  }

  const r = await pesquisarTudo(q);
  const falhas = r.lojas.filter((l) => !l.ok);
  if (falhas.length) console.warn("precos-supermercado:", q, falhas.map((f) => `${f.id}: ${f.erro}`).join("; "));

  let historico = null;
  if (falhas.length < r.lojas.length) {
    await comPrazo(registar(r), 1500);
    historico = await comPrazo(resumo(q, r.modo === "embalagem" ? "embalagem" : r.nomeUnidade), 1500);
  }
  const dados = { ...r, historico, obtidoEm: new Date().toISOString() };

  if (falhas.length === r.lojas.length) {
    // Tudo em baixo: nunca guardar isto em cache.
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ...dados, erro: "Os supermercados não responderam. Tenta daqui a pouco." });
  }

  // Com alguma loja em falha, cache curta — para ela voltar depressa.
  res.setHeader("Cache-Control", falhas.length
    ? "public, s-maxage=600, stale-while-revalidate=120"
    : "public, s-maxage=3600, stale-while-revalidate=300");
  if (!falhas.length) {
    memoria.set(q, { em: Date.now(), dados });
    if (memoria.size > 500) memoria.delete(memoria.keys().next().value);
  }
  return res.status(200).json(dados);
}
