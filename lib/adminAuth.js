import { getSupabaseAdmin } from "./supabaseAdmin";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "poupeja.portugal@gmail.com").toLowerCase();

// Contas do dono: não entram nas estatísticas nem no contador de visitas.
export const EMAILS_EXCLUIDOS = new Set(
  (process.env.EMAILS_EXCLUIDOS || "poupeja.portugal@gmail.com,ricardogalha1@gmail.com,ricardogalha1@hotmail.com")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
);
EMAILS_EXCLUIDOS.add(ADMIN_EMAIL);

// Devolve { admin } se o pedido traz a sessão do administrador; senão responde
// ao pedido e devolve null.
export async function exigirAdmin(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const admin = getSupabaseAdmin();
  if (!admin) { res.status(503).json({ erro: "Serviço de administração indisponível." }); return null; }
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ erro: "Sem autorização." }); return null; }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) { res.status(401).json({ erro: "Sessão inválida." }); return null; }
  if ((data.user.email || "").toLowerCase() !== ADMIN_EMAIL) { res.status(403).json({ erro: "Acesso restrito." }); return null; }
  return { admin };
}
