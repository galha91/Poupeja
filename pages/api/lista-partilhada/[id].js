import { supabase } from "../../../lib/supabase";

const ID_RE = /^[a-z0-9]{6,12}$/;

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !ID_RE.test(id)) return res.status(400).json({ erro: "ID inválido" });

  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("listas_partilhadas")
      .select("itens, atualizado_em")
      .eq("id", id)
      .single();
    if (error || !data) return res.status(404).json({ erro: "Lista não encontrada" });
    return res.json({ itens: data.itens, atualizado_em: data.atualizado_em });
  }

  if (req.method === "PUT") {
    const { itens } = req.body || {};
    if (!Array.isArray(itens)) return res.status(400).json({ erro: "Formato inválido" });
    const { error } = await supabase
      .from("listas_partilhadas")
      .upsert({ id, itens, atualizado_em: new Date().toISOString() });
    if (error) return res.status(500).json({ erro: "Erro ao guardar" });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
