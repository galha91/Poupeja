import { VITAIS } from "./metricas";
import vercel from "../vercel.json";
import { descreverHorario } from "./horarioCron";

/*
 * Leituras para o /admin e para o resumo semanal por email
 * (pages/api/admin-*.js e pages/api/cron-resumo-admin.js).
 *
 * Todas aceitam um período em dias (7, 30 ou 90) e devolvem também o
 * período anterior do mesmo tamanho, para comparar. Cada função lida com a
 * sua tabela: se a tabela não existir (migração por aplicar), devolve null
 * e o resto do painel continua a funcionar.
 */

export const DIA = 864e5;
export const PERIODOS = [7, 30, 90];
export const periodoValido = (v) => (PERIODOS.includes(Number(v)) ? Number(v) : 7);
export const dia = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
const diaHa = (n) => dia(new Date(Date.now() - n * DIA));

function somar(linhas, chaveFn) {
  const m = new Map();
  for (const l of linhas) {
    const k = chaveFn(l);
    const a = m.get(k) || { n: 0, soma: 0, bons: 0 };
    a.n += l.n; a.soma += l.soma || 0; a.bons += l.bons || 0;
    m.set(k, a);
  }
  return m;
}
const topo = (m, lim) => [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, lim);
const serieDias = (dias, mapa) =>
  Array.from({ length: Math.max(14, dias) }, (_, i) => {
    const d = diaHa(Math.max(14, dias) - 1 - i);
    return { dia: d, n: mapa.get(d)?.n || 0 };
  });

// Lê uma tabela grande por páginas de 1000 (o limite do PostgREST).
async function lerTudo(consulta, max = 100000) {
  const linhas = [];
  for (let de = 0; de < max; de += 1000) {
    const { data, error } = await consulta().range(de, de + 999);
    if (error) throw error;
    linhas.push(...data);
    if (data.length < 1000) break;
  }
  return linhas;
}

// ── Visitas (contador próprio) ──────────────────────────────────────────────
export async function trafegoProprio(admin, dias) {
  const ini = diaHa(dias - 1);
  const iniAnt = diaHa(2 * dias - 1);
  const hoje = dia(new Date());
  const [vd, vu, vp] = await Promise.all([
    lerTudo(() => admin.from("visitas_dia").select("dia, caminho, origem, n").gte("dia", iniAnt).order("dia").order("caminho").order("origem")),
    admin.from("visitas_unicos").select("dia, n").gte("dia", iniAnt),
    lerTudo(() => admin.from("visitas_perfil").select("dia, dimensao, valor, n").gte("dia", ini).order("dia").order("dimensao").order("valor")),
  ]);
  const unicos = vu.data || [];
  const noPeriodo = (l) => l.dia >= ini;
  const doAnterior = (l) => l.dia >= iniAnt && l.dia < ini;
  const soma = (ls) => ls.reduce((s, l) => s + l.n, 0);

  const porDia = somar(vd, l => l.dia);
  const unicosDia = new Map(unicos.map(u => [u.dia, { n: u.n }]));

  const agrupar = (chave) => {
    const atual = somar(vd.filter(noPeriodo), l => l[chave]);
    const antes = somar(vd.filter(doAnterior), l => l[chave]);
    return topo(atual, 15).map(([k, v]) => ({ [chave]: k, n: v.n, antes: antes.get(k)?.n || 0 }));
  };
  const perfil = {};
  for (const l of vp) (perfil[l.dimensao] ||= {})[l.valor] = ((perfil[l.dimensao] || {})[l.valor] || 0) + l.n;
  const perfilTopo = (d) => Object.entries(perfil[d] || {}).sort((a, b) => b[1] - a[1]).map(([valor, n]) => ({ valor, n }));

  const serie = serieDias(dias, unicosDia).map(s => ({ dia: s.dia, visitantes: s.n, vistas: porDia.get(s.dia)?.n || 0 }));
  return {
    dias,
    desdeDia: [...porDia.keys()].sort()[0] || hoje,
    hoje: { vistas: porDia.get(hoje)?.n || 0, visitantes: unicosDia.get(hoje)?.n || 0 },
    periodo: { vistas: soma(vd.filter(noPeriodo)), visitantes: soma(unicos.filter(noPeriodo)) },
    anterior: { vistas: soma(vd.filter(doAnterior)), visitantes: soma(unicos.filter(doAnterior)) },
    serie,
    paginas: agrupar("caminho"),
    origens: agrupar("origem"),
    perfil: { regiao: perfilTopo("regiao").slice(0, 12), dispositivo: perfilTopo("dispositivo"), modo: perfilTopo("modo"), recorrencia: perfilTopo("recorrencia") },
  };
}

// ── Métricas de produto (lib/metricas.js) ───────────────────────────────────
export async function metricas(admin, dias) {
  const ini = diaHa(dias - 1);
  const iniAnt = diaHa(2 * dias - 1);
  let data;
  try {
    data = await lerTudo(() => admin.from("metricas_dia").select("dia, tipo, chave, detalhe, n, soma, bons").gte("dia", iniAnt).order("dia").order("tipo").order("chave").order("detalhe"));
  } catch { return null; }
  const atual = data.filter(l => l.dia >= ini);
  const anterior = data.filter(l => l.dia < ini);
  const de = (linhas, tipo) => linhas.filter(l => l.tipo === tipo);

  const ev = somar(de(atual, "evento"), l => l.chave);
  const evAnt = somar(de(anterior, "evento"), l => l.chave);
  const variantes = somar(de(atual, "evento").filter(l => l.detalhe), l => `${l.chave}|${l.detalhe}`);
  const eventos = topo(ev, 60).map(([chave, v]) => ({
    chave, n: v.n, antes: evAnt.get(chave)?.n || 0,
    variantes: topo(new Map([...variantes].filter(([k]) => k.startsWith(chave + "|"))), 6).map(([k, x]) => ({ detalhe: k.split("|")[1], n: x.n })),
  }));

  const pesq = somar(de(atual, "pesquisa"), l => l.chave);
  const vazias = somar(de(atual, "pesquisa_vazia"), l => l.chave);
  const total = (m) => [...m.values()].reduce((s, v) => s + v.n, 0);
  const erros = somar(de(atual, "erro"), l => `${l.chave}|${l.detalhe}`);
  const vit = de(atual, "vital");
  const porMetrica = somar(vit, l => l.chave);
  const lcpPagina = somar(vit.filter(l => l.chave === "LCP"), l => l.detalhe);

  return {
    desde: data.length ? data.reduce((m, l) => (l.dia < m ? l.dia : m), data[0].dia) : null,
    eventos,
    eventosDia: serieDias(dias, somar(de(atual, "evento"), l => l.dia)),
    pesquisas: {
      total: total(pesq), antes: total(somar(de(anterior, "pesquisa"), l => l.chave)), vazias: total(vazias),
      topo: topo(pesq, 30).map(([termo, v]) => ({ termo, n: v.n, vazias: vazias.get(termo)?.n || 0 })),
      semResultado: topo(vazias, 30).map(([termo, v]) => ({ termo, n: v.n })),
    },
    erros: {
      total: total(erros), antes: total(somar(de(anterior, "erro"), l => l.chave)),
      lista: topo(erros, 20).map(([k, v]) => { const [pagina, mensagem] = k.split("|"); return { pagina, mensagem, n: v.n }; }),
      porDia: serieDias(dias, somar(de(atual, "erro"), l => l.dia)),
    },
    vitais: Object.keys(VITAIS).map(nome => { const v = porMetrica.get(nome); return { nome, limite: VITAIS[nome], n: v?.n || 0, media: v?.n ? v.soma / v.n : null, bons: v?.n ? v.bons / v.n : null }; }),
    paginasLentas: topo(lcpPagina, 80).filter(([, v]) => v.n >= 3).map(([pagina, v]) => ({ pagina, n: v.n, media: v.soma / v.n, bons: v.bons / v.n })).sort((a, b) => b.media - a.media).slice(0, 10),
    campanhas: topo(somar(de(atual, "campanha"), l => l.chave), 30).map(([chave, v]) => ({ chave, n: v.n })),
  };
}

// ── Convidados: retenção por semana de entrada e por origem ─────────────────
export async function retencao(admin, dias) {
  const semanas = Math.max(8, Math.ceil(dias / 7));
  const desde = new Date(Date.now() - semanas * 7 * DIA).toISOString();
  let data;
  try {
    data = await lerTudo(() => admin.from("convidados_site").select("id, primeira_em, ultima_em, aberturas, converteu_em, origem, campanha, comparou_em, escolheu_em, alerta_em, email_em, pediu_conta_em").gte("primeira_em", desde).order("id"));
  } catch {
    // Antes da migração não há origem/campanha: lê o resto.
    try { data = await lerTudo(() => admin.from("convidados_site").select("id, primeira_em, ultima_em, aberturas, converteu_em").gte("primeira_em", desde).order("id")); }
    catch { return null; }
  }
  const agora = Date.now();
  const segunda = (t) => { const d = new Date(t); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return dia(d); };
  const novo = (k) => ({ chave: k, entraram: 0, d1: 0, d7: 0, d30: 0, elegivel7: 0, elegivel30: 0, converteram: 0, comparou: 0, escolheu: 0, email: 0 });
  const juntar = (x, c) => {
    const p = new Date(c.primeira_em).getTime();
    const u = new Date(c.ultima_em).getTime();
    x.entraram++;
    if (u - p >= DIA) x.d1++;
    if (agora - p >= 7 * DIA) { x.elegivel7++; if (u - p >= 7 * DIA) x.d7++; }
    if (agora - p >= 30 * DIA) { x.elegivel30++; if (u - p >= 30 * DIA) x.d30++; }
    if (c.converteu_em) x.converteram++;
    if (c.comparou_em) x.comparou++;
    if (c.escolheu_em) x.escolheu++;
    if (c.email_em) x.email++;
  };
  const coortes = new Map(), origens = new Map(), campanhas = new Map();
  for (const c of data) {
    const k = segunda(c.primeira_em);
    if (!coortes.has(k)) coortes.set(k, novo(k));
    juntar(coortes.get(k), c);
    if (agora - new Date(c.primeira_em).getTime() < dias * DIA) {
      const o = c.origem || "sem registo";
      if (!origens.has(o)) origens.set(o, novo(o));
      juntar(origens.get(o), c);
      if (c.campanha) {
        if (!campanhas.has(c.campanha)) campanhas.set(c.campanha, novo(c.campanha));
        juntar(campanhas.get(c.campanha), c);
      }
    }
  }
  const ativos = (n) => data.filter(c => agora - new Date(c.ultima_em).getTime() < n * DIA).length;

  // O que faz voltar: entre quem entrou há 7+ dias, a % que ainda usava a
  // app 7 dias depois, com e sem cada ação. (Só ações ligadas ao convidado.)
  const elegiveis = data.filter(c => agora - new Date(c.primeira_em).getTime() >= 7 * DIA);
  const voltou = (c) => new Date(c.ultima_em).getTime() - new Date(c.primeira_em).getTime() >= 7 * DIA;
  const taxa = (ls) => (ls.length ? ls.filter(voltou).length / ls.length : null);
  const ACOES = [["comparou_em", "Comparou a lista"], ["escolheu_em", "Escolheu onde comprar"], ["alerta_em", "Ligou o sino"], ["email_em", "Deixou email"], ["pediu_conta_em", "Tocou em criar conta"], ["converteu_em", "Criou conta"]];
  const oQueFazVoltar = elegiveis.length ? ACOES.map(([campo, rotulo]) => {
    const fez = elegiveis.filter(c => c[campo]);
    const naoFez = elegiveis.filter(c => !c[campo]);
    return { campo, rotulo, fizeram: fez.length, comAcao: taxa(fez), semAcao: taxa(naoFez) };
  }).filter(a => a.fizeram > 0 || a.campo in (elegiveis[0] || {})) : [];
  return {
    oQueFazVoltar, base7: elegiveis.length,
    coortes: [...coortes.values()].sort((a, b) => (a.chave < b.chave ? 1 : -1)).map(c => ({ ...c, semana: c.chave })),
    porOrigem: [...origens.values()].sort((a, b) => b.entraram - a.entraram),
    porCampanha: [...campanhas.values()].sort((a, b) => b.entraram - a.entraram),
    novos: data.filter(c => agora - new Date(c.primeira_em).getTime() < dias * DIA).length,
    novosAntes: data.filter(c => { const t = agora - new Date(c.primeira_em).getTime(); return t >= dias * DIA && t < 2 * dias * DIA; }).length,
    ativos1: ativos(1), ativos7: ativos(7), ativos30: ativos(30),
  };
}

// ── Emails sem conta ────────────────────────────────────────────────────────
export async function emails(admin, dias) {
  const semanas = Math.max(8, Math.ceil(dias / 7));
  const desde = new Date(Date.now() - semanas * 7 * DIA).toISOString();
  const ler = (t, cols) => admin.from(t).select(cols).or(`criado_em.gte.${desde},cancelado_em.gte.${desde}`).limit(20000);
  const [f, c] = await Promise.all([ler("subscritores_folhetos", "criado_em, cancelado_em, origem"), ler("subscritores_combustivel", "criado_em, cancelado_em, concelho")]);
  if (f.error && c.error) return null;
  const fs = f.data || [], cs = c.data || [];
  const entre = (t, ini, fim) => t && new Date(t).getTime() >= ini && new Date(t).getTime() < fim;
  const lista = Array.from({ length: semanas }, (_, i) => {
    const fim = Date.now() - i * 7 * DIA, ini = fim - 7 * DIA;
    return {
      semana: dia(new Date(ini)),
      folhetos: fs.filter(s => entre(s.criado_em, ini, fim)).length,
      combustivel: cs.filter(s => entre(s.criado_em, ini, fim)).length,
      cancelaram: [...fs, ...cs].filter(s => entre(s.cancelado_em, ini, fim)).length,
    };
  }).reverse();
  const limite = Date.now() - dias * DIA;
  const contar = (ls, campo) => {
    const o = {};
    for (const s of ls) if (new Date(s.criado_em).getTime() >= limite) o[s[campo] || "sem origem"] = (o[s[campo] || "sem origem"] || 0) + 1;
    return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([rotulo, n]) => ({ rotulo, n }));
  };
  const novos = (ini, fim) => [...fs, ...cs].filter(s => entre(s.criado_em, ini, fim)).length;
  return {
    semanas: lista,
    novos: novos(Date.now() - dias * DIA, Date.now() + 1),
    novosAntes: novos(Date.now() - 2 * dias * DIA, Date.now() - dias * DIA),
    origens: contar(fs, "origem"),
    concelhos: contar(cs.filter(s => !s.cancelado_em), "concelho"),
  };
}

export async function saude(admin) {
  const { data, error } = await admin.from("saude_precos").select("loja, nome, ok, erro, verificado_em, ultimo_ok_em, falhas_seguidas").order("nome");
  return error ? null : data;
}

// ── Notas (publicações, mudanças) e metas, guardadas pelo próprio admin ─────
export async function notas(admin) {
  const { data, error } = await admin.from("admin_notas").select("id, dia, texto, campanha").order("dia", { ascending: false }).limit(200);
  return error ? null : data;
}

export const METAS_CHAVES = ["visitantes", "convidados", "contas", "emails"];
export async function lerMetas(admin) {
  const { data, error } = await admin.from("admin_config").select("valor").eq("chave", "metas").maybeSingle();
  if (error) return null;
  return data?.valor || {};
}

// ── Contactos sem conta: quem deu o email (alertas, folhetos, combustível) ──
// Junta por email e, quando o email foi dado dentro da app, liga-o ao
// convidado: de onde veio, quando entrou, quantas vezes abriu e o que fez.
export async function contactos(admin) {
  const [al, fo, co, le] = await Promise.all([
    admin.from("alertas_email").select("email, q, tipo, alvo, unidade, criado_em, cancelado_em, avisos, convidado_id").order("criado_em", { ascending: false }).limit(3000),
    admin.from("subscritores_folhetos").select("email, criado_em, cancelado_em, origem, convidado_id").order("criado_em", { ascending: false }).limit(3000),
    admin.from("subscritores_combustivel").select("email, concelho, criado_em, cancelado_em, convidado_id").order("criado_em", { ascending: false }).limit(3000),
    admin.from("lembretes_compras").select("email, dia, criado_em, cancelado_em, convidado_id, envios").order("criado_em", { ascending: false }).limit(3000),
  ]);
  if (al.error && fo.error && co.error) return null;
  const pessoas = new Map();
  const de = (email) => {
    const k = String(email || "").toLowerCase();
    if (!pessoas.has(k)) pessoas.set(k, { email: k, desde: null, alertas: [], folhetos: null, combustivel: [], lembrete: null, convidadoId: null });
    return pessoas.get(k);
  };
  const marcar = (p, quando, conv) => {
    if (!p.desde || quando < p.desde) p.desde = quando;
    if (conv && !p.convidadoId) p.convidadoId = conv;
  };
  for (const a of al.data || []) {
    const p = de(a.email); marcar(p, a.criado_em, a.convidado_id);
    p.alertas.push({ q: a.q, tipo: a.tipo, alvo: a.alvo, unidade: a.unidade, avisos: a.avisos, ativo: !a.cancelado_em });
  }
  for (const f of fo.data || []) {
    const p = de(f.email); marcar(p, f.criado_em, f.convidado_id);
    p.folhetos = { ativo: !f.cancelado_em, origem: f.origem };
  }
  for (const c of co.data || []) {
    const p = de(c.email); marcar(p, c.criado_em, c.convidado_id);
    p.combustivel.push({ concelho: c.concelho, ativo: !c.cancelado_em });
  }
  for (const l of le?.data || []) {
    const p = de(l.email); marcar(p, l.criado_em, l.convidado_id);
    if (!p.lembrete || !l.cancelado_em) p.lembrete = { dia: l.dia, ativo: !l.cancelado_em, envios: l.envios };
  }
  const ids = [...pessoas.values()].map(p => p.convidadoId).filter(Boolean);
  const convidados = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from("convidados_site")
      .select("id, primeira_em, ultima_em, aberturas, origem, campanha, comparou_em, escolheu_em, alerta_em, pediu_conta_em, converteu_em")
      .in("id", ids.slice(i, i + 200));
    for (const c of data || []) convidados[c.id] = c;
  }
  return [...pessoas.values()]
    .map(({ convidadoId, ...p }) => ({ ...p, convidado: convidadoId ? convidados[convidadoId] || null : null }))
    .sort((a, b) => (a.desde < b.desde ? 1 : -1))
    .slice(0, 500);
}

// ── Tarefas automáticas (crons) ─────────────────────────────────────────────
// Junta o horário (vercel.json) com a última execução (cron_execucoes, ver
// lib/cronRegisto.js). Atrasada = devia ter corrido e não correu.
export async function tarefas(admin) {
  const { data, error } = await admin.from("cron_execucoes").select("nome, ultima_em, ok, duracao_ms, resumo, erro, ultimo_ok_em, falhas_seguidas, execucoes");
  if (error) return null;
  const porNome = Object.fromEntries((data || []).map(t => [t.nome, t]));
  const horarios = {};
  for (const c of vercel.crons || []) {
    const nome = c.path.split("/").pop();
    (horarios[nome] ||= []).push(descreverHorario(c.schedule));
  }
  const agora = Date.now();
  return Object.entries(horarios).map(([nome, hs]) => {
    const r = porNome[nome] || null;
    const intervalo = Math.min(...hs.map(h => h.intervaloH));
    const atrasada = r ? agora - new Date(r.ultima_em).getTime() > (intervalo + 3) * 36e5 : false;
    return { nome, horario: hs.map(h => h.texto).join(" e "), ...(r || {}), registada: !!r, atrasada };
  }).sort((a, b) => (b.ok === false) - (a.ok === false) || b.atrasada - a.atrasada || a.nome.localeCompare(b.nome));
}

// ── Opinião ("Isto foi útil?") ──────────────────────────────────────────────
export async function opiniao(admin, dias) {
  const desde = diaHa(Math.max(dias, 30) - 1);
  const { data, error } = await admin.from("feedback_app").select("dia, contexto, util, texto, criado_em").gte("dia", desde).order("criado_em", { ascending: false }).limit(2000);
  if (error) return null;
  const ini = diaHa(dias - 1);
  const periodo = data.filter(f => f.dia >= ini);
  return {
    total: periodo.length,
    uteis: periodo.filter(f => f.util).length,
    comentarios: data.filter(f => f.texto).slice(0, 30).map(f => ({ dia: f.dia, util: f.util, texto: f.texto, contexto: f.contexto })),
  };
}
