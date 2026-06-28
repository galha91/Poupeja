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

    // Excluir a(s) conta(s) de administração de todas as estatísticas
    const adminIds = new Set(
      todos.filter(u => (u.email || "").toLowerCase() === ADMIN_EMAIL).map(u => u.id)
    );
    todos = todos.filter(u => !adminIds.has(u.id));

    const agora = Date.now();
    const DIA = 24 * 60 * 60 * 1000;
    const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);

    const total = todos.length;
    const hoje = todos.filter(u => u.created_at && new Date(u.created_at) >= inicioHoje).length;
    const ultimos7 = todos.filter(u => u.created_at && agora - new Date(u.created_at).getTime() < 7 * DIA).length;
    const ultimos30 = todos.filter(u => u.created_at && agora - new Date(u.created_at).getTime() < 30 * DIA).length;
    const confirmados = todos.filter(u => u.email_confirmed_at || u.confirmed_at).length;

    // Utilizadores ATIVOS (fizeram login no período) — engagement real, não só registo
    const ativosHoje = todos.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= inicioHoje).length;
    const ativos7 = todos.filter(u => u.last_sign_in_at && agora - new Date(u.last_sign_in_at).getTime() < 7 * DIA).length;
    const ativos30 = todos.filter(u => u.last_sign_in_at && agora - new Date(u.last_sign_in_at).getTime() < 30 * DIA).length;
    const nuncaVoltaram = todos.filter(u => !u.last_sign_in_at).length;

    // Mini-gráfico: registos por dia nos últimos 14 dias
    const crescimento = [];
    for (let i = 13; i >= 0; i--) {
      const ini = new Date(); ini.setHours(0, 0, 0, 0); ini.setDate(ini.getDate() - i);
      const fim = new Date(ini); fim.setDate(fim.getDate() + 1);
      const n = todos.filter(u => {
        const c = u.created_at ? new Date(u.created_at) : null;
        return c && c >= ini && c < fim;
      }).length;
      crescimento.push({ dia: ini.toISOString().split("T")[0], n });
    }

    // Subscritores push — cruzar user_id com emails (sem o admin)
    const { data: pushSubsRaw } = await admin
      .from("push_subscriptions")
      .select("user_id, criado_em");
    const pushSubs = (pushSubsRaw || []).filter(s => !adminIds.has(s.user_id));

    const userMap = Object.fromEntries(todos.map(u => [u.id, u.email]));
    const pushSubscritores = (pushSubs || [])
      .map(s => ({ email: userMap[s.user_id] || "—", desde: s.criado_em }))
      .filter((v, i, arr) => arr.findIndex(x => x.email === v.email) === i)
      .sort((a, b) => new Date(b.desde) - new Date(a.desde));

    // Dispositivos — plataforma e PWA instalada
    const { data: dispositivos } = await admin
      .from("dados_utilizador")
      .select("user_id, valor")
      .eq("chave", "poupeja_dispositivo");

    const dispositivoMap = Object.fromEntries(
      (dispositivos || []).filter(d => !adminIds.has(d.user_id)).map(d => [d.user_id, d.valor])
    );
    const totalPwa = Object.values(dispositivoMap).filter(d => d?.pwa).length;
    const porPlataforma = {
      ios:     Object.values(dispositivoMap).filter(d => d?.platform === "ios").length,
      android: Object.values(dispositivoMap).filter(d => d?.platform === "android").length,
      desktop: Object.values(dispositivoMap).filter(d => d?.platform === "desktop").length,
    };

    // Listas de compras partilhadas (funcionalidade de recomendação/boca-a-boca)
    let listasPartilhadas = 0, listasAtivas7 = 0;
    try {
      const { data: listas } = await admin
        .from("listas_partilhadas")
        .select("atualizado_em");
      listasPartilhadas = (listas || []).length;
      listasAtivas7 = (listas || []).filter(l => l.atualizado_em && agora - new Date(l.atualizado_em).getTime() < 7 * DIA).length;
    } catch {}

    // Quem desativou o email semanal (alcance real das campanhas de quinta)
    let emailDesativado = 0;
    try {
      const { data: prefsRows } = await admin
        .from("dados_utilizador")
        .select("user_id, valor")
        .eq("chave", "poupeja_prefs");
      for (const row of prefsRows || []) {
        if (adminIds.has(row.user_id)) continue; // ignora o admin
        const v = typeof row.valor === "string" ? JSON.parse(row.valor) : row.valor;
        if (v && v.emailSemanal === false) emailDesativado++;
      }
    } catch {}
    const emailAtivos = Math.max(0, confirmados - emailDesativado);

    // Funil de conversão: Registou → Confirmou → Instalou app → Ativou push
    const totalPush = new Set((pushSubs || []).map(s => s.user_id)).size;
    const funil = {
      registou: total,
      confirmou: confirmados,
      instalou: totalPwa,
      ativouPush: totalPush,
    };

    // Recentes com última visita e dispositivo
    const recentes = [...todos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      .map(u => ({
        email: u.email,
        criado: u.created_at,
        confirmado: !!(u.email_confirmed_at || u.confirmed_at),
        ultimoAcesso: u.last_sign_in_at || null,
        dispositivo: dispositivoMap[u.id] || null,
      }));

    return res.status(200).json({
      total,
      hoje,
      ultimos7,
      ultimos30,
      confirmados,
      totalPwa,
      porPlataforma,
      recentes,
      pushSubscritores,
      ativosHoje,
      ativos7,
      ativos30,
      nuncaVoltaram,
      crescimento,
      listasPartilhadas,
      listasAtivas7,
      emailDesativado,
      emailAtivos,
      funil,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ erro: "Erro ao obter estatísticas." });
  }
}
