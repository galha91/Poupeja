import { resolverFolhetos } from "../../lib/folhetos-viewer";
import { embutivel } from "../../lib/folhetos-embed";
import { excedeuLimite } from "../../lib/protecao-api";

/*
 * GET /api/folheto-viewer?loja=Aldi → { folhetos: [{ titulo, url }] }
 *
 * O endereço do folheto em vigor de algumas cadeias muda todas as semanas;
 * lê-se da página delas e guarda-se umas horas. Só responde para as lojas de
 * lib/folhetos-embed (nunca abre um URL vindo do pedido).
 */
const TTL = 2 * 60 * 60 * 1000;
const memoria = new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido." });
  const loja = String(req.query.loja || "");
  if (!embutivel(loja)) return res.status(400).json({ folhetos: [], erro: "Loja sem folheto embutido." });

  const guardado = memoria.get(loja);
  if (guardado && Date.now() - guardado.em < TTL) {
    res.setHeader("Cache-Control", "public, s-maxage=7200, stale-while-revalidate=21600");
    return res.status(200).json({ folhetos: guardado.folhetos });
  }
  if (excedeuLimite(req, "folheto-viewer", 30)) return res.status(429).json({ folhetos: [], erro: "Demasiados pedidos." });

  try {
    const folhetos = await resolverFolhetos(loja);
    if (!folhetos.length) throw new Error("sem folhetos");
    memoria.set(loja, { em: Date.now(), folhetos });
    res.setHeader("Cache-Control", "public, s-maxage=7200, stale-while-revalidate=21600");
    return res.status(200).json({ folhetos });
  } catch (e) {
    // Falhou: nunca guardar (a app cai para o site da loja).
    console.warn("folheto-viewer:", loja, e?.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ folhetos: [], erro: "Não foi possível obter o folheto." });
  }
}
