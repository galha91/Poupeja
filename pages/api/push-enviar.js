import webpush from "web-push";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { bearerValido } from "../../lib/seguranca";
import { lerFolhetos } from "../../lib/emailFolhetos";

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

  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }

  const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_EMAIL       = process.env.VAPID_EMAIL;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return res.status(500).json({ erro: "Env vars VAPID em falta." });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ erro: "Supabase indisponível." });

  // Blast manual do admin (com body explícito) mantém-se broadcast igual para todos.
  const manual = !!(req.body?.title || req.body?.body);
  const payloadGenerico = JSON.stringify({
    title: req.body?.title || "📰 Folhetos desta semana",
    body:  req.body?.body  || "Os novos folhetos dos supermercados já estão disponíveis. Vê onde podes poupar!",
    url:   req.body?.url   || "/",
  });

  // Cron semanal: personalizar por lojas favoritas do utilizador
  // (prefs.favoritos já sincroniza via dados_utilizador)
  const favoritosPorUser = new Map();
  let lojasComFolheto = [];
  if (!manual) {
    lojasComFolheto = lerFolhetos().map(f => f.loja);
    try {
      const { data: prefsRows } = await admin
        .from("dados_utilizador")
        .select("user_id, valor")
        .eq("chave", "poupeja_prefs");
      for (const row of prefsRows || []) {
        const v = typeof row.valor === "string" ? JSON.parse(row.valor) : row.valor;
        if (Array.isArray(v?.favoritos) && v.favoritos.length) {
          favoritosPorUser.set(row.user_id, v.favoritos);
        }
      }
    } catch (_) {}
  }

  function payloadPara(userId) {
    if (manual) return payloadGenerico;
    const favs = favoritosPorUser.get(userId);
    if (!favs) return payloadGenerico;
    const minhas = lojasComFolheto.filter(l => favs.includes(l));
    if (!minhas.length) return payloadGenerico;
    const nomes = minhas.length <= 3
      ? minhas.join(minhas.length === 2 ? " e " : ", ").replace(/, ([^,]+)$/, " e $1")
      : `${minhas.slice(0, 2).join(", ")} e mais ${minhas.length - 2}`;
    return JSON.stringify({
      title: "📰 Folhetos desta semana",
      body: `Saíram os folhetos do ${nomes} — as tuas lojas favoritas. Vê antes de ires às compras!`,
      url: "/",
    });
  }

  // Buscar todas as subscrições ativas
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, subscription");

  if (error) return res.status(500).json({ erro: "Erro ao ler subscrições." });
  if (!subs?.length) return res.status(200).json({ enviadas: 0, mensagem: "Sem subscrições." });

  let enviadas = 0;
  const expiradas = [];

  await Promise.all(subs.map(async row => {
    try {
      await webpush.sendNotification(row.subscription, payloadPara(row.user_id));
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
