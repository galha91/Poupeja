import { exigirAdmin } from "../../lib/adminAuth";

// Põe o contador de visitas a zero (botão no /admin, com confirmação).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const { admin } = ctx;
  const erros = [];
  for (const t of ["visitas_dia", "visitas_unicos", "visitas_hash"]) {
    const { error } = await admin.from(t).delete().gte("dia", "2000-01-01");
    if (error) erros.push(t);
  }
  return res.status(erros.length ? 500 : 200).json({ ok: !erros.length });
}
