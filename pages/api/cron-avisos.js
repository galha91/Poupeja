import webpush from "web-push";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { bearerValido } from "../../lib/seguranca";
import { DESAFIOS_MENSAIS } from "../../lib/desafios";

/*
 * Avisos personalizados por utilizador — cron diário (Vercel, 18:00 UTC).
 *
 * Ao contrário do /api/push-enviar (broadcast), este endpoint avalia os dados
 * de CADA utilizador (já sincronizados na tabela dados_utilizador pelo
 * lib/sync.js) e envia push só a quem tem algo relevante:
 *
 *   ⛽ Combustível  — poupeja_avisos: preço nacional mais barato ≤ precoAlvo
 *                     (com supressão de 6 dias para não repetir todos os dias)
 *   🛡️ Garantias    — poupeja_taloes: garantia a expirar em 30, 7 ou 1 dia(s)
 *   📅 Contas fixas — poupeja_contas: diaVencimento é amanhã e ainda não paga
 *   🔥 Streak       — poupeja_taloes: domingo, sequência semanal ≥2 em risco
 *   🎯 Desafio      — poupeja_taloes: ≥80% da meta do mês por completar
 *
 * Estado de supressão do combustível fica em dados_utilizador com a chave
 * 'poupeja_avisos_notificados' (fora do CHAVES_SYNC do cliente — só o
 * servidor lhe toca).
 *
 * Requer: VAPID_*, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET.
 */

const CHAVES = ["poupeja_avisos", "poupeja_taloes", "poupeja_contas", "poupeja_contas_pago", "poupeja_meta", "poupeja_avisos_notificados"];
const MAX_POR_USER = 3;
const SUPRESSAO_COMBUSTIVEL_DIAS = 6;

function hojeLisboa() {
  const s = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }); // YYYY-MM-DD
  const [ano, mes, dia] = s.split("-").map(Number);
  return { ano, mes, dia, iso: s };
}

function diasAte(dataISO, hojeISO) {
  return Math.round((new Date(dataISO) - new Date(hojeISO)) / 86400000);
}

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

  // 1. Só interessam utilizadores com push ativo
  const { data: subs, error: errSubs } = await admin
    .from("push_subscriptions")
    .select("id, user_id, subscription");
  if (errSubs) return res.status(500).json({ erro: "Erro ao ler subscrições." });
  if (!subs?.length) return res.status(200).json({ utilizadores: 0, notificacoes: 0 });

  const subsPorUser = {};
  for (const s of subs) {
    (subsPorUser[s.user_id] ||= []).push(s);
  }
  const userIds = Object.keys(subsPorUser);

  // 2. Dados sincronizados desses utilizadores
  const { data: linhas, error: errDados } = await admin
    .from("dados_utilizador")
    .select("user_id, chave, valor")
    .in("user_id", userIds)
    .in("chave", CHAVES);
  if (errDados) return res.status(500).json({ erro: "Erro ao ler dados." });

  const dadosPorUser = {};
  for (const l of linhas || []) {
    (dadosPorUser[l.user_id] ||= {})[l.chave] = l.valor;
  }

  // 3. Preços de combustível nacionais (uma vez para todos)
  let precos = [];
  try {
    const host = req.headers.host;
    const proto = host?.startsWith("localhost") ? "http" : "https";
    const r = await fetch(`${proto}://${host}/api/combustiveis`);
    const j = await r.json();
    precos = j.dados || [];
  } catch (_) {}
  const maisBaratoPorTipo = {};
  for (const p of precos) {
    if (!maisBaratoPorTipo[p.tipo] || p.preco < maisBaratoPorTipo[p.tipo].preco) {
      maisBaratoPorTipo[p.tipo] = p;
    }
  }

  const hoje = hojeLisboa();
  const amanha = new Date(new Date(hoje.iso).getTime() + 86400000);
  const diaAmanha = amanha.getDate();
  const mesAmanhaChave = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, "0")}`;

  let totalNotificacoes = 0;
  const expiradas = [];

  for (const userId of userIds) {
    const d = dadosPorUser[userId] || {};
    const notifs = [];
    const notificados = d.poupeja_avisos_notificados || {};
    let notificadosMudou = false;

    // ⛽ Combustível abaixo do alvo (com supressão de 6 dias)
    const avisos = Array.isArray(d.poupeja_avisos) ? d.poupeja_avisos : [];
    for (const a of avisos) {
      if (a.tipo !== "combustivel" || !a.combTipo || !a.precoAlvo) continue;
      const best = maisBaratoPorTipo[a.combTipo];
      if (!best || best.preco > a.precoAlvo) continue;
      const ultima = notificados[`comb_${a.id}`];
      if (ultima && diasAte(hoje.iso, ultima) < SUPRESSAO_COMBUSTIVEL_DIAS) continue;
      notifs.push({
        title: `⛽ ${a.combTipo} a €${best.preco.toFixed(3)}`,
        body: `No ${best.posto} — abaixo do teu alvo de €${Number(a.precoAlvo).toFixed(3)}/litro. Abre para ver perto de ti.`,
        url: "/",
      });
      notificados[`comb_${a.id}`] = hoje.iso;
      notificadosMudou = true;
    }

    // 🛡️ Garantias a expirar (30 / 7 / 1 dias — o match exato evita repetições)
    const taloes = Array.isArray(d.poupeja_taloes) ? d.poupeja_taloes : [];
    for (const t of taloes) {
      if (t.tipo !== "garantia" || !t.dataExpiracao) continue;
      const dias = diasAte(t.dataExpiracao, hoje.iso);
      if (![30, 7, 1].includes(dias)) continue;
      const nome = t.nome || "um artigo";
      notifs.push({
        title: "🛡️ Garantia a expirar",
        body: dias === 1
          ? `A garantia de ${nome} termina amanhã. Se algo não está bem, é agora.`
          : `A garantia de ${nome} termina em ${dias} dias.`,
        url: "/",
      });
    }

    // 📅 Contas fixas a vencer amanhã (e ainda não pagas este mês)
    const contas = Array.isArray(d.poupeja_contas) ? d.poupeja_contas : [];
    const pagos = (d.poupeja_contas_pago || {})[mesAmanhaChave] || {};
    for (const c of contas) {
      if (c.diaVencimento !== diaAmanha || pagos[c.id]) continue;
      notifs.push({
        title: `📅 ${c.nome} vence amanhã`,
        body: `€${Number(c.valor || 0).toFixed(2)} — dia ${diaAmanha}. Marca como paga quando tratares disto.`,
        url: "/",
      });
    }

    // 🔥 Streak semanal em risco (só ao domingo — última oportunidade da semana)
    // + 🎯 Desafio do mês quase completo (≥80%, uma vez por mês)
    {
      const dataDoTalao = t => (t.dataCompra || (t.criadoEm || "").slice(0, 10)) || null;
      const segundaDaSemana = iso => {
        const d = new Date(iso);
        const dow = (d.getDay() + 6) % 7; // 0 = segunda
        d.setDate(d.getDate() - dow);
        return d.toISOString().slice(0, 10);
      };
      const diaSemana = new Date(hoje.iso).getDay(); // 0 = domingo

      if (diaSemana === 0 && taloes.length) {
        const semanas = new Set(taloes.map(dataDoTalao).filter(Boolean).map(segundaDaSemana));
        const estaSemana = segundaDaSemana(hoje.iso);
        if (!semanas.has(estaSemana)) {
          // contar sequência a terminar na semana passada
          let streak = 0;
          const cursor = new Date(estaSemana);
          for (;;) {
            cursor.setDate(cursor.getDate() - 7);
            if (semanas.has(cursor.toISOString().slice(0, 10))) streak++;
            else break;
          }
          if (streak >= 2) {
            notifs.push({
              title: `🔥 Não percas a tua sequência de ${streak} semanas`,
              body: "Hoje é o último dia da semana. Guarda um talão e mantém o ritmo!",
              url: "/",
            });
          }
        }
      }

      const mesAtual = hoje.iso.slice(0, 7);
      const desafio = DESAFIOS_MENSAIS[Number(hoje.iso.slice(5, 7)) - 1];
      if (desafio && !notificados[`desafio_${mesAtual}`]) {
        const totalMes = taloes
          .filter(t => t.tipo === "compra" && t.valorPoupado != null)
          .filter(t => (dataDoTalao(t) || "").slice(0, 7) === mesAtual)
          .reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
        if (totalMes >= desafio.meta * 0.8 && totalMes < desafio.meta) {
          const falta = desafio.meta - totalMes;
          notifs.push({
            title: `🎯 Faltam €${falta.toFixed(2)} para completares "${desafio.nome}"`,
            body: `Já poupaste €${totalMes.toFixed(2)} este mês. A meta de €${desafio.meta} está mesmo aí.`,
            url: "/",
          });
          notificados[`desafio_${mesAtual}`] = hoje.iso;
          notificadosMudou = true;
        }
      }
    }

    // 🎯 Meta de poupança: marcos 25/50/75/100% (uma vez por marco por meta)
    const meta = d.poupeja_meta;
    if (meta?.valor > 0 && meta?.criadoEm) {
      const prog = taloes
        .filter(t => t.tipo === "compra" && t.valorPoupado != null)
        .filter(t => ((t.dataCompra || (t.criadoEm || "").slice(0, 10)) || "") >= meta.criadoEm)
        .reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
      const pct = (prog / meta.valor) * 100;
      for (const marco of [100, 75, 50, 25]) {
        if (pct < marco) continue;
        const chaveMarco = `meta_${meta.criadoEm}_${marco}`;
        if (notificados[chaveMarco]) break; // marcos menores já implícitos
        notifs.push(marco === 100
          ? { title: `🎉 ${meta.emoji || "🎯"} "${meta.nome}" — meta alcançada!`, body: `Poupaste €${prog.toFixed(2)} e chegaste aos €${meta.valor}. Parabéns!`, url: "/" }
          : { title: `${meta.emoji || "🎯"} ${marco}% da meta "${meta.nome}"`, body: `Já lá vão €${prog.toFixed(2)} de €${meta.valor}. Continua!`, url: "/" });
        notificados[chaveMarco] = hoje.iso;
        notificadosMudou = true;
        break; // só o marco mais alto novo por dia
      }
    }

    // 🎁 Dia 1: retrato do mês anterior pronto (para quem tem compras nesse mês)
    if (hoje.dia === 1 && taloes.length) {
      const dAnt = new Date(hoje.ano, hoje.mes - 2, 1);
      const chaveAnt = `${dAnt.getFullYear()}-${String(dAnt.getMonth() + 1).padStart(2, "0")}`;
      const nomeAnt = dAnt.toLocaleDateString("pt-PT", { month: "long" });
      const totalAnt = taloes
        .filter(t => t.tipo === "compra" && t.valorPoupado != null)
        .filter(t => ((t.dataCompra || (t.criadoEm || "").slice(0, 10)) || "").slice(0, 7) === chaveAnt)
        .reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
      if (totalAnt > 0) {
        notifs.push({
          title: `🎁 O teu retrato de ${nomeAnt} está pronto`,
          body: `Poupaste €${totalAnt.toFixed(2)} — vê o resumo do teu mês e partilha.`,
          url: "/",
        });
      }
    }

    if (!notifs.length) continue;

    // Guardar estado de supressão do combustível
    if (notificadosMudou) {
      try {
        await admin.from("dados_utilizador").upsert({
          user_id: userId,
          chave: "poupeja_avisos_notificados",
          valor: notificados,
          atualizado_em: new Date().toISOString(),
        });
      } catch (_) {}
    }

    // Enviar (máx. 3 por utilizador para não ser spam)
    for (const n of notifs.slice(0, MAX_POR_USER)) {
      const payload = JSON.stringify(n);
      await Promise.all(subsPorUser[userId].map(async row => {
        try {
          await webpush.sendNotification(row.subscription, payload);
          totalNotificacoes++;
        } catch (e) {
          if (e.statusCode === 410 || e.statusCode === 404) expiradas.push(row.id);
        }
      }));
    }
  }

  if (expiradas.length) {
    await admin.from("push_subscriptions").delete().in("id", [...new Set(expiradas)]);
  }

  return res.status(200).json({
    utilizadores: userIds.length,
    notificacoes: totalNotificacoes,
    expiradas: expiradas.length,
  });
}
