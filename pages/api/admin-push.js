import webpush from "web-push";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

const ADMIN_EMAIL = "poupeja.portugal@gmail.com";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não suportado." });

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Supabase indisponível." });

  // Validar sessão de administrador
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ erro: "Sem autorização." });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return res.status(500).json({ erro: "Env vars VAPID em falta." });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title: req.body?.title || "PoupeJá",
    body:  req.body?.body  || "",
    url:   req.body?.url   || "/",
  });

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, subscription");

  if (error) return res.status(500).json({ erro: "Erro ao ler subscrições." });
  if (!subs?.length) return res.status(200).json({ enviadas: 0, total: 0 });

  let enviadas = 0;
  const expiradas = [];

  await Promise.all(subs.map(async row => {
    try {
      await webpush.sendNotification(row.subscription, payload);
      enviadas++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) expiradas.push(row.id);
    }
  }));

  if (expiradas.length) {
    await admin.from("push_subscriptions").delete().in("id", expiradas);
  }

  return res.status(200).json({ enviadas, total: subs.length, expiradas: expiradas.length });
}
