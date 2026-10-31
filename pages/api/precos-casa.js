import { pesquisarTudo } from "../../lib/supermercados";
import { LOJAS_CASA } from "../../lib/casa";
import { excedeuLimite } from "../../lib/protecao-api";

/*
 * GET /api/precos-casa?q=lampada led e27
 *
 * O mesmo que /api/precos-supermercado, nas lojas de casa e bricolagem
 * (lib/casa): pesquisa em direto no site de cada loja e devolve tudo
 * ordenado pelo preço por unidade (€/lâmpada, €/L, €/m²). Não grava
 * histórico: essa tabela é a dos supermercados.
 *
 * Duas camadas de cache, como nos supermercados: a CDN do Vercel (1 h no
 * máximo) e uma memória curta dentro da função.
 */

const TTL_MEMORIA = 15 * 60 * 1000;
const memoria = new Map();

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

  if (excedeuLimite(req, "precos-casa", 40)) {
    return res.status(429).json({ erro: "Demasiadas pesquisas seguidas. Tenta daqui a um minuto." });
  }

  const r = await pesquisarTudo(q, LOJAS_CASA);
  const falhas = r.lojas.filter((l) => !l.ok);
  if (falhas.length) console.warn("precos-casa:", q, falhas.map((f) => `${f.id}: ${f.erro}`).join("; "));
  const dados = { ...r, obtidoEm: new Date().toISOString() };

  if (falhas.length === r.lojas.length) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ...dados, erro: "As lojas não responderam. Tenta daqui a pouco." });
  }

  res.setHeader("Cache-Control", falhas.length
    ? "public, s-maxage=600, stale-while-revalidate=120"
    : "public, s-maxage=3600, stale-while-revalidate=300");
  if (!falhas.length) {
    memoria.set(q, { em: Date.now(), dados });
    if (memoria.size > 500) memoria.delete(memoria.keys().next().value);
  }
  return res.status(200).json(dados);
}
