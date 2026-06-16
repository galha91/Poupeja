import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

// Email autorizado a ver as estatísticas de administração.
// Configurável por env var; fallback para o email do dono do site.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "poupeja.portugal@gmail.com").toLowerCase();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ erro: "Serviço de administração indisponível (falta SUPABASE_SERVICE_ROLE_KEY)." });
  }

  // 1. Validar o token de sessão enviado pelo cliente
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ erro: "Sem autorização." });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ erro: "Sessão inválida." });
  }

  // 2. Confirmar que é o email de administração
  const email = (userData.user.email || "").toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return res.status(403).json({ erro: "Acesso restrito." });
  }

  // 3. Contar todos os utilizadores (a listUsers é paginada)
  try {
    const perPage = 1000;
    let page = 1;
    let todos = [];
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const lote = data?.users || [];
      todos = todos.concat(lote);
      if (lote.length < perPage) break;
      page += 1;
      if (page > 100) break; // salvaguarda
    }

    const agora = Date.now();
    const DIA = 24 * 60 * 60 * 1000;
    const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);

    const total = todos.length;
    const hoje = todos.filter(u => u.created_at && new Date(u.created_at) >= inicioHoje).length;
    const ultimos7 = todos.filter(u => u.created_at && agora - new Date(u.created_at).getTime() < 7 * DIA).length;
    const ultimos30 = todos.filter(u => u.created_at && agora - new Date(u.created_at).getTime() < 30 * DIA).length;
    const confirmados = todos.filter(u => u.email_confirmed_at || u.confirmed_at).length;

    // Lista dos mais recentes (sem dados sensíveis além do email)
    const recentes = [...todos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)
      .map(u => ({
        email: u.email,
        criado: u.created_at,
        confirmado: !!(u.email_confirmed_at || u.confirmed_at),
        ultimoAcesso: u.last_sign_in_at || null,
      }));

    // Subscritores push — cruzar user_id com emails
    const { data: pushSubs } = await admin
      .from("push_subscriptions")
      .select("user_id, criado_em");

    const userMap = Object.fromEntries(todos.map(u => [u.id, u.email]));
    const pushSubscritores = (pushSubs || [])
      .map(s => ({ email: userMap[s.user_id] || "—", desde: s.criado_em }))
      .filter((v, i, arr) => arr.findIndex(x => x.email === v.email) === i) // dedup por email
      .sort((a, b) => new Date(b.desde) - new Date(a.desde));

    return res.status(200).json({
      total,
      hoje,
      ultimos7,
      ultimos30,
      confirmados,
      recentes,
      pushSubscritores,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ erro: "Erro ao obter estatísticas." });
  }
}
