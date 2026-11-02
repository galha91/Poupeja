import { exigirAdmin } from "../../lib/adminAuth";
import { VITAIS } from "../../lib/metricas";

// Dados de crescimento e qualidade para o /admin: uso das funcionalidades,
// pesquisas (e as que não dão nada), retenção dos convidados, crescimento
// dos emails, erros no browser, velocidade das páginas e saúde dos preços.
// Cada bloco é independente: uma tabela em falta (migração por aplicar)
// devolve null nesse bloco e o resto continua a aparecer.

const DIA = 864e5;
const dia = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
const somar = (linhas, chaveFn) => {
  const m = new Map();
  for (const l of linhas) {
    const k = chaveFn(l);
    const a = m.get(k) || { n: 0, soma: 0, bons: 0 };
    a.n += l.n; a.soma += l.soma || 0; a.bons += l.bons || 0;
    m.set(k, a);
  }
  return m;
};
const topo = (m, lim) => [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, lim);

async function metricas(admin) {
  const desde = dia(new Date(Date.now() - 29 * DIA));
  const { data, error } = await admin.from("metricas_dia").select("dia, tipo, chave, detalhe, n, soma, bons").gte("dia", desde).limit(50000);
  if (error) return null;
  const lim7 = dia(new Date(Date.now() - 6 * DIA));
  const lim14 = dia(new Date(Date.now() - 13 * DIA));
  const sete = data.filter(l => l.dia >= lim7);
  const anteriores = data.filter(l => l.dia >= lim14 && l.dia < lim7);
  const de = (linhas, tipo) => linhas.filter(l => l.tipo === tipo);

  // Funcionalidades: eventos dos últimos 7 dias, com a semana anterior e as variantes.
  const ev7 = somar(de(sete, "evento"), l => l.chave);
  const evAnt = somar(de(anteriores, "evento"), l => l.chave);
  const variantes = somar(de(sete, "evento").filter(l => l.detalhe), l => `${l.chave}|${l.detalhe}`);
  const eventos = topo(ev7, 40).map(([chave, v]) => ({
    chave, n: v.n, antes: evAnt.get(chave)?.n || 0,
    variantes: topo(new Map([...variantes].filter(([k]) => k.startsWith(chave + "|"))), 4).map(([k, x]) => ({ detalhe: k.split("|")[1], n: x.n })),
  }));

  const pesq = somar(de(sete, "pesquisa"), l => l.chave);
  const vazias = somar(de(sete, "pesquisa_vazia"), l => l.chave);
  const totalPesq = [...pesq.values()].reduce((s, v) => s + v.n, 0);
  const totalVazias = [...vazias.values()].reduce((s, v) => s + v.n, 0);

  const erros7 = somar(de(sete, "erro"), l => `${l.chave}|${l.detalhe}`);
  const errosDia = somar(de(data, "erro").filter(l => l.dia >= lim14), l => l.dia);

  // Velocidade: média e % de "bons" por métrica; páginas mais lentas pelo LCP.
  const vit = de(sete, "vital");
  const porMetrica = somar(vit, l => l.chave);
  const lcpPagina = somar(vit.filter(l => l.chave === "LCP"), l => l.detalhe);

  const serieDias = (tipo) => {
    const m = somar(de(data, tipo).filter(l => l.dia >= lim14), l => l.dia);
    return Array.from({ length: 14 }, (_, i) => { const d = dia(new Date(Date.now() - (13 - i) * DIA)); return { dia: d, n: m.get(d)?.n || 0 }; });
  };

  return {
    desde: data.length ? data.reduce((m, l) => (l.dia < m ? l.dia : m), data[0].dia) : null,
    eventos,
    eventosDia: serieDias("evento"),
    pesquisas: { total: totalPesq, vazias: totalVazias, topo: topo(pesq, 15).map(([termo, v]) => ({ termo, n: v.n, vazias: vazias.get(termo)?.n || 0 })), semResultado: topo(vazias, 15).map(([termo, v]) => ({ termo, n: v.n })) },
    erros: { total: [...erros7.values()].reduce((s, v) => s + v.n, 0), lista: topo(erros7, 12).map(([k, v]) => { const [pagina, mensagem] = k.split("|"); return { pagina, mensagem, n: v.n }; }),
      porDia: Array.from({ length: 14 }, (_, i) => { const d = dia(new Date(Date.now() - (13 - i) * DIA)); return { dia: d, n: errosDia.get(d)?.n || 0 }; }) },
    vitais: Object.keys(VITAIS).map(nome => { const v = porMetrica.get(nome); return { nome, limite: VITAIS[nome], n: v?.n || 0, media: v?.n ? v.soma / v.n : null, bons: v?.n ? v.bons / v.n : null }; }),
    paginasLentas: topo(lcpPagina, 50).filter(([, v]) => v.n >= 3).map(([pagina, v]) => ({ pagina, n: v.n, media: v.soma / v.n, bons: v.bons / v.n })).sort((a, b) => b.media - a.media).slice(0, 8),
  };
}

// Retenção dos convidados por semana de entrada (últimas 8 semanas).
async function retencao(admin) {
  const desde = new Date(Date.now() - 8 * 7 * DIA).toISOString();
  const { data, error } = await admin.from("convidados_site").select("primeira_em, ultima_em, aberturas, converteu_em").gte("primeira_em", desde).limit(50000);
  if (error) return null;
  const agora = Date.now();
  const segunda = (t) => { const d = new Date(t); const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return dia(s); };
  const coortes = new Map();
  for (const c of data) {
    const p = new Date(c.primeira_em).getTime();
    const u = new Date(c.ultima_em).getTime();
    const k = segunda(p);
    const x = coortes.get(k) || { semana: k, entraram: 0, d1: 0, d7: 0, d30: 0, elegivel7: 0, elegivel30: 0, converteram: 0 };
    x.entraram++;
    if (u - p >= DIA) x.d1++;
    if (agora - p >= 7 * DIA) { x.elegivel7++; if (u - p >= 7 * DIA) x.d7++; }
    if (agora - p >= 30 * DIA) { x.elegivel30++; if (u - p >= 30 * DIA) x.d30++; }
    if (c.converteu_em) x.converteram++;
    coortes.set(k, x);
  }
  const ativos = (dias) => data.filter(c => agora - new Date(c.ultima_em).getTime() < dias * DIA).length;
  return {
    coortes: [...coortes.values()].sort((a, b) => (a.semana < b.semana ? 1 : -1)),
    ativos1: ativos(1), ativos7: ativos(7), ativos30: ativos(30),
  };
}

// Crescimento dos emails sem conta: novos e cancelados por semana, e origem.
async function emails(admin) {
  const desde = new Date(Date.now() - 8 * 7 * DIA).toISOString();
  const ler = (t, cols) => admin.from(t).select(cols).or(`criado_em.gte.${desde},cancelado_em.gte.${desde}`).limit(20000);
  const [f, c] = await Promise.all([ler("subscritores_folhetos", "criado_em, cancelado_em, origem"), ler("subscritores_combustivel", "criado_em, cancelado_em, concelho")]);
  if (f.error && c.error) return null;
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const fim = Date.now() - i * 7 * DIA, ini = fim - 7 * DIA;
    const dentro = (t) => t && new Date(t).getTime() >= ini && new Date(t).getTime() < fim;
    return {
      semana: dia(new Date(ini)),
      folhetos: (f.data || []).filter(s => dentro(s.criado_em)).length,
      combustivel: (c.data || []).filter(s => dentro(s.criado_em)).length,
      cancelaram: [...(f.data || []), ...(c.data || [])].filter(s => dentro(s.cancelado_em)).length,
    };
  }).reverse();
  const origens = {};
  for (const s of f.data || []) if (s.criado_em >= desde) origens[s.origem || "sem origem"] = (origens[s.origem || "sem origem"] || 0) + 1;
  const concelhos = {};
  for (const s of c.data || []) if (s.criado_em >= desde && !s.cancelado_em) concelhos[s.concelho] = (concelhos[s.concelho] || 0) + 1;
  const ordenar = (o, lim) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, lim).map(([rotulo, n]) => ({ rotulo, n }));
  return { semanas, origens: ordenar(origens, 8), concelhos: ordenar(concelhos, 8) };
}

async function saude(admin) {
  const { data, error } = await admin.from("saude_precos").select("loja, nome, ok, erro, verificado_em, ultimo_ok_em, falhas_seguidas").order("nome");
  return error ? null : data;
}

export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const { admin } = ctx;
  const seguro = (p) => p.catch(() => null);
  const [m, r, e, s] = await Promise.all([seguro(metricas(admin)), seguro(retencao(admin)), seguro(emails(admin)), seguro(saude(admin))]);
  return res.status(200).json({ metricas: m, retencao: r, emails: e, saude: s, atualizadoEm: new Date().toISOString() });
}
