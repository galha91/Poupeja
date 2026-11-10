import webpush from "web-push";
import { exigirAdmin } from "../../lib/adminAuth";

// Notificação manual do /admin para todas as subscrições.
// Só o admin (sessão verificada no servidor, ver lib/adminAuth.js). Mesmo
// assim o conteúdo é validado: o link só pode abrir páginas do próprio site.
function linkInterno(url) {
  const u = typeof url === "string" ? url.trim() : "";
  if (!u) return "/";
  // Link completo do próprio site → fica só o caminho.
  const proprio = u.match(/^https:\/\/(?:www\.)?(?:xn--poupej-uta\.com|poupejá\.com)(\/[^\s]*)?$/i);
  if (proprio) return (proprio[1] || "/").slice(0, 300);
  // Caminho relativo ("/folhetos"), nunca "//outro-site" nem "javascript:".
  return /^\/(?!\/)[^\s]*$/.test(u) ? u.slice(0, 300) : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não suportado." });

  const sessao = await exigirAdmin(req, res);
  if (!sessao) return;
  const { admin } = sessao;

  const titulo = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 80) : "";
  const corpo = typeof req.body?.body === "string" ? req.body.body.trim().slice(0, 300) : "";
  const url = linkInterno(req.body?.url);
  if (url === null) return res.status(400).json({ erro: "O link tem de ser uma página do PoupeJá (ex.: /folhetos)." });

  const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_EMAIL       = process.env.VAPID_EMAIL;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return res.status(500).json({ erro: "Env vars VAPID em falta." });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({ title: titulo || "PoupeJá", body: corpo, url });

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
