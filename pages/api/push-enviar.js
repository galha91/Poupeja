import webpush from "web-push";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

/*
 * Envia notificações push a todos os utilizadores com subscrição ativa.
 * Protegido por CRON_SECRET (mesmo mecanismo do email semanal).
 *
 * Requer env vars:
 *   VAPID_PUBLIC_KEY   — chave pública VAPID
 *   VAPID_PRIVATE_KEY  — chave privada VAPID
 *   VAPID_EMAIL        — email de contacto (ex: mailto:poupeja.portugal@gmail.com)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET
 *
 * Body (opcional, via POST com JSON):
 *   { title, body, url }
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return res.status(500).json({ erro: "Env vars VAPID em falta." });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Supabase indisponível." });

  // Payload da notificação
  const payload = JSON.stringify({
    title: req.body?.title || "📰 Folhetos desta semana",
    body:  req.body?.body  || "Os novos folhetos dos supermercados já estão disponíveis. Vê onde podes poupar!",
    url:   req.body?.url   || "/",
  });

  // Buscar todas as subscrições ativas
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, subscription");

  if (error) return res.status(500).json({ erro: "Erro ao ler subscrições." });
  if (!subs?.length) return res.status(200).json({ enviadas: 0, mensagem: "Sem subscrições." });

  let enviadas = 0;
  const expiradas = [];

  await Promise.all(subs.map(async row => {
    try {
      await webpush.sendNotification(row.subscription, payload);
      enviadas++;
    } catch (e) {
      // 410 Gone = subscrição expirada/removida pelo browser
      if (e.statusCode === 410 || e.statusCode === 404) {
        expiradas.push(row.id);
      }
    }
  }));

  // Limpar subscrições expiradas
  if (expiradas.length) {
    await admin.from("push_subscriptions").delete().in("id", expiradas);
  }

  return res.status(200).json({ enviadas, expiradas: expiradas.length });
}
