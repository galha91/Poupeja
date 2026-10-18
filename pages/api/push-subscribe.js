import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { subscricaoPushValida } from "../../lib/pushSubscricao";

// Guarda ou remove uma subscrição push.
// POST  { subscription } → guarda
// DELETE { endpoint } → remove
// Com sessão, fica presa à conta (avisos personalizados + gerais). Sem sessão
// (convidado), fica com user_id null e só recebe os avisos gerais (sexta,
// quinta, admin). Quem cria conta depois passa a subscrição para a conta.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST" && req.method !== "DELETE") return res.status(405).json({ erro: "Método não suportado." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Serviço indisponível." });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  let user = null;
  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ erro: "Sessão inválida." });
    user = data.user;
  } else {
    if (!origemValida(req)) return res.status(403).json({ erro: "Origem não autorizada." });
    if (excedeuLimite(req, "push-subscribe", 10, 10 * 60_000)) return res.status(429).json({ erro: "Demasiados pedidos." });
  }

  if (req.method === "POST") {
    const { subscription } = req.body || {};
    if (!subscricaoPushValida(subscription)) return res.status(400).json({ erro: "Subscrição inválida." });
    const endpoint = subscription.endpoint;

    if (user) {
      const { error } = await admin
        .from("push_subscriptions")
        .upsert({ user_id: user.id, endpoint, subscription }, { onConflict: "user_id,endpoint" });
      if (error) return res.status(500).json({ erro: "Erro ao guardar subscrição." });
      // O mesmo browser deixa de estar como convidado: senão recebia tudo a dobrar.
      await admin.from("push_subscriptions").delete().is("user_id", null).eq("endpoint", endpoint);
      return res.status(200).json({ ok: true });
    }

    // Convidado: se este browser já está numa conta, não duplica.
    const { data: existente } = await admin
      .from("push_subscriptions").select("id").eq("endpoint", endpoint).limit(1);
    if (existente?.length) return res.status(200).json({ ok: true });
    const { error } = await admin.from("push_subscriptions").insert({ user_id: null, endpoint, subscription });
    if (error && error.code !== "23505") return res.status(500).json({ erro: "Erro ao guardar subscrição." });
    return res.status(200).json({ ok: true });
  }

  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ erro: "Endpoint em falta." });
  const apagar = admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  await (user ? apagar.eq("user_id", user.id) : apagar.is("user_id", null));
  return res.status(200).json({ ok: true });
}
