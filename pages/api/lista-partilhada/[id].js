import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { excedeuLimite } from "../../../lib/protecao-api";

/* De 6 a 32: os IDs novos têm 12 caracteres criptográficos (ver
   gerarShareId em SecaoListaCompras.jsx), e os de 8 já emitidos com o
   gerador antigo continuam a responder. */
const ID_RE = /^[a-z0-9]{6,32}$/;
const MAX_ITENS = 200;          // limite de artigos por lista
const MAX_NOME = 80;            // limite de caracteres do nome de um artigo

// Normaliza e valida cada artigo, descartando campos inesperados e cortando
// strings demasiado longas. Evita que a tabela seja usada para guardar lixo
// arbitrário (abuso de armazenamento) ou payloads gigantes (DoS).
function limparItens(itens) {
  if (!Array.isArray(itens)) return null;
  if (itens.length > MAX_ITENS) return null;
  return itens.map((it) => ({
    id: typeof it?.id === "number" || typeof it?.id === "string" ? it.id : Date.now(),
    nome: String(it?.nome ?? "").slice(0, MAX_NOME),
    emoji: String(it?.emoji ?? "").slice(0, 8),
    qty: Number.isFinite(it?.qty) ? Math.max(1, Math.min(99, Math.floor(it.qty))) : 1,
    feito: !!it?.feito,
    ...(it?.categoria ? { categoria: String(it.categoria).slice(0, 40) } : {}),
  }));
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !ID_RE.test(id)) return res.status(400).json({ erro: "ID inválido" });

  res.setHeader("Cache-Control", "no-store");

  /*
   * Sem limite, dava para experimentar IDs em ciclo à velocidade do HTTP,
   * à procura das listas de outras pessoas — e uma lista aberta lê-se e
   * escreve-se sem conta nenhuma. O ID novo tem 12 caracteres
   * criptográficos, o que já torna o palheiro enorme; isto fecha a porta
   * a quem queira varrê-lo à força.
   *
   * 40/min é folgado para o uso real: a lista sincroniza sozinha enquanto
   * uma família a edita, mas nunca a esse ritmo.
   */
  if (excedeuLimite(req, "lista-partilhada", 40)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  // Usa a service role (server-side). A tabela já não tem políticas públicas,
  // por isso o acesso anónimo direto ao Supabase está bloqueado: tudo passa
  // por aqui, com o id validado.
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível" });

  if (req.method === "GET") {
    const { data, error } = await admin
      .from("listas_partilhadas")
      .select("itens, atualizado_em")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ erro: "Lista não encontrada" });
    return res.json({ itens: data.itens, atualizado_em: data.atualizado_em });
  }

  if (req.method === "PUT") {
    const limpos = limparItens(req.body?.itens);
    if (limpos === null) return res.status(400).json({ erro: "Formato inválido" });
    const { error } = await admin
      .from("listas_partilhadas")
      .upsert({ id, itens: limpos, atualizado_em: new Date().toISOString() });
    if (error) return res.status(500).json({ erro: "Erro ao guardar" });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
