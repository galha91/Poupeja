import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

// Guarda ou remove uma subscrição push do utilizador autenticado.
// POST  { subscription } → guarda
// DELETE { subscription.endpoint } → remove
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível." });

  // Validar sessão
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ erro: "Sem autorização." });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ erro: "Sessão inválida." });

  if (req.method === "POST") {
    const { subscription } = req.body || {};
    if (!subscription?.endpoint) return res.status(400).json({ erro: "Subscrição inválida." });

    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint: subscription.endpoint, subscription },
        { onConflict: "user_id,endpoint" }
      );

    if (error) return res.status(500).json({ erro: "Erro ao guardar subscrição." });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ erro: "Endpoint em falta." });

    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ erro: "Método não suportado." });
}
