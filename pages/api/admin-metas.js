import { exigirAdmin } from "../../lib/adminAuth";
import { METAS_CHAVES } from "../../lib/adminDados";

// Metas semanais do /admin (visitantes, convidados novos, contas novas,
// emails novos). PUT { visitantes: 300, ... } — vazio ou 0 apaga a meta.
export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  if (req.method !== "PUT") return res.status(405).end();
  const metas = {};
  for (const k of METAS_CHAVES) {
    const v = Math.round(Number(req.body?.[k]));
    if (Number.isFinite(v) && v > 0 && v < 1e7) metas[k] = v;
  }
  const { error } = await ctx.admin.from("admin_config").upsert({ chave: "metas", valor: metas, atualizado_em: new Date().toISOString() });
  return error ? res.status(500).json({ erro: "Não foi possível guardar (migração aplicada?)." }) : res.status(200).json(metas);
}
