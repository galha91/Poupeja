import { exigirAdmin } from "../../lib/adminAuth";
import { campanhaValida } from "../../lib/visitas";

// Notas do /admin: o que publicaste ou mudaste num dia ("reel do azeite",
// "nova página de receitas"). Aparecem nos gráficos para ver o efeito.
// POST { dia, texto, campanha? } cria; DELETE ?id= apaga.
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const { admin } = ctx;

  if (req.method === "POST") {
    const { dia, texto, campanha } = req.body || {};
    const t = typeof texto === "string" ? texto.trim().slice(0, 140) : "";
    if (!DATA.test(dia || "") || !t) return res.status(400).json({ erro: "Falta a data ou o texto." });
    const c = campanha ? campanhaValida(campanha) : null;
    if (campanha && !c) return res.status(400).json({ erro: "Etiqueta inválida: usa letras minúsculas, números e hífens (ex.: ig-reel-azeite)." });
    const { data, error } = await admin.from("admin_notas").insert({ dia, texto: t, campanha: c }).select("id, dia, texto, campanha").single();
    return error ? res.status(500).json({ erro: "Não foi possível guardar (migração aplicada?)." }) : res.status(200).json(data);
  }
  if (req.method === "DELETE") {
    const id = String(req.query.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).end();
    const { error } = await admin.from("admin_notas").delete().eq("id", id);
    return res.status(error ? 500 : 204).end();
  }
  return res.status(405).end();
}
