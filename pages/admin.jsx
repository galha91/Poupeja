import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import {
  ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Bell, Send, ChevronDown, Search,
  LayoutDashboard, BarChart3, Users, Megaphone, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

// Painel privado do dono. Quatro separadores, do mais geral para o mais
// detalhado: Visão geral (o que mudou esta semana), Tráfego (visitas e
// Google), Utilizadores (contas, convidados, alcance) e Avisos (push).

const ABAS = [
  { id: "geral", rotulo: "Visão geral", Icone: LayoutDashboard },
  { id: "trafego", rotulo: "Tráfego", Icone: BarChart3 },
  { id: "utilizadores", rotulo: "Utilizadores", Icone: Users },
  { id: "avisos", rotulo: "Avisos", Icone: Megaphone },
];

const NOMES_MODO = { "app-android": "App Android", pwa: "App instalada", browser: "Browser" };
const NOMES_ORIGEM = {
  direto: "Direto / app", google: "Google", pesquisa: "Outros motores", facebook: "Facebook",
  instagram: "Instagram", tiktok: "TikTok", whatsapp: "WhatsApp", outro: "Outros sites", interno: "Navegação interna",
};
const NOMES_PLATAFORMA = { ios: "iOS", android: "Android", desktop: "Computador" };

// Paleta discreta para séries: verde da marca primeiro, depois tons neutros.
const CORES = ["#0b6b4f", "#3f9070", "#82b09b", "#c8a26a", "#8a978e", "#cfccbf"];

const num = (v) => (typeof v === "number" ? v.toLocaleString("pt-PT") : v ?? "—");
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const fmtData = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};
const fmtHora = (iso) => {
  try { return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};
const fmtRelativo = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} d`;
  return fmtData(iso).split(",")[0];
};

export default function Admin() {
  const router = useRouter();
  const [estado, setEstado] = useState("a-carregar"); // a-carregar | negado | ok | erro
  const [stats, setStats] = useState(null);
  const [trafego, setTrafego] = useState(null);
  const [erro, setErro] = useState("");
  const [sessaoEmail, setSessaoEmail] = useState(null);
  const [aba, setAba] = useState("geral");
  const [aAtualizar, setAAtualizar] = useState(false);
  const [estadoRepor, setEstadoRepor] = useState(""); // "", "a-repor", "ok", "erro"

  const [pushTitulo, setPushTitulo] = useState("🏛️ Novidade no PoupeJá");
  const [pushCorpo, setPushCorpo] = useState("Descobre os Apoios do Estado a que tens direito — subsídios, isenções e muito mais.");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushEstado, setPushEstado] = useState(""); // "", "a-enviar", "ok", "erro"
  const [pushResultado, setPushResultado] = useState(null);

  async function carregar() {
    // Na primeira carga mostra o ecrã de espera; depois só roda o botão.
    if (!stats) setEstado("a-carregar");
    setAAtualizar(true);
    setErro("");
    const { data: { session } } = await supabase.auth.getSession();
    setSessaoEmail(session?.user?.email || null);
    if (!session?.access_token) { setEstado("negado"); setAAtualizar(false); return; }
    const auth = { Authorization: `Bearer ${session.access_token}` };
    try {
      const r = await fetch("/api/admin-stats", { headers: auth });
      if (r.status === 403 || r.status === 401) { setEstado("negado"); return; }
      const data = await r.json();
      if (!r.ok) { setErro(data.erro || "Erro a obter dados."); setEstado("erro"); return; }
      setStats(data);
      setEstado("ok");
      // Este dispositivo é do dono: deixa de contar nas visitas e nos convidados.
      try { localStorage.setItem("poupeja_nao_contar", "1"); } catch {}
      const t = await fetch("/api/admin-trafego", { headers: auth }).then(x => (x.ok ? x.json() : null)).catch(() => null);
      setTrafego(t);
    } catch {
      setErro("Falha de ligação.");
      setEstado("erro");
    } finally {
      setAAtualizar(false);
    }
  }

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function reporVisitas() {
    if (!window.confirm("Pôr o contador de visitas a zero? Apaga as visitas contadas até agora.")) return;
    setEstadoRepor("a-repor");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch("/api/admin-repor-visitas", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` } });
      setEstadoRepor(r.ok ? "ok" : "erro");
      if (r.ok) carregar();
    } catch { setEstadoRepor("erro"); }
  }

  async function enviarPush() {
    setPushEstado("a-enviar");
    setPushResultado(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch("/api/admin-push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ title: pushTitulo, body: pushCorpo, url: pushUrl }),
      });
      const data = await r.json();
      if (!r.ok) { setPushEstado("erro"); setPushResultado(data.erro || "Erro."); return; }
      setPushEstado("ok");
      setPushResultado(`Enviadas ${data.enviadas} de ${data.total} notificações.`);
    } catch {
      setPushEstado("erro");
      setPushResultado("Falha de ligação.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Head>
        <title>PoupeJá · Administração</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Cabeçalho fixo: título, hora da última leitura, atualizar e separadores */}
      <header className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button onClick={() => router.push("/")} aria-label="Voltar à app" className="w-9 h-9 -ml-2 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-semibold leading-tight">Administração</h1>
              <p className="text-xs text-slate-500">
                {stats ? `Atualizado às ${fmtHora(stats.atualizadoEm)}` : "Painel privado"}
              </p>
            </div>
            {estado === "ok" && (
              <button
                onClick={carregar}
                disabled={aAtualizar}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                <RefreshCw size={14} className={aAtualizar ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            )}
          </div>
          {estado === "ok" && (
            <nav role="tablist" aria-label="Secções" className="flex sm:gap-1 -mb-px overflow-x-auto">
              {ABAS.map(({ id, rotulo, Icone }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={aba === id}
                  onClick={() => setAba(id)}
                  className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-2.5 text-[13px] sm:text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    aba === id ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icone size={15} className="hidden min-[400px]:block" /> {rotulo}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {estado === "a-carregar" && <Esqueleto />}

        {estado === "negado" && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={22} className="text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800">Acesso restrito</p>
            <p className="text-sm text-slate-500 mt-1">Esta página é só para a conta de administração.</p>
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-left text-sm">
              {sessaoEmail ? (
                <>
                  <p className="text-xs text-slate-500">Sessão atual neste domínio</p>
                  <p className="font-semibold text-slate-700 break-all">{sessaoEmail}</p>
                  <p className="text-xs text-slate-500 mt-1">O acesso é só para <b>poupeja.portugal@gmail.com</b>.</p>
                </>
              ) : (
                <p className="text-slate-600">Não tens sessão iniciada <b>neste domínio</b>. Inicia sessão aqui primeiro.</p>
              )}
            </div>
            <button onClick={() => router.push("/?entrar=1")} className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm">
              Iniciar sessão
            </button>
          </div>
        )}

        {estado === "erro" && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="font-semibold text-[color:var(--pj-danger)]">{erro}</p>
            <button onClick={carregar} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-sm">
              <RefreshCw size={14} /> Tentar de novo
            </button>
          </div>
        )}

        {estado === "ok" && stats && (
          <div role="tabpanel">
            {aba === "geral" && <VisaoGeral stats={stats} trafego={trafego} irPara={setAba} />}
            {aba === "trafego" && <Trafego dados={trafego} onRepor={reporVisitas} estadoRepor={estadoRepor} />}
            {aba === "utilizadores" && <Utilizadores stats={stats} />}
            {aba === "avisos" && (
              <Avisos
                stats={stats}
                titulo={pushTitulo} setTitulo={setPushTitulo}
                corpo={pushCorpo} setCorpo={setPushCorpo}
                url={pushUrl} setUrl={setPushUrl}
                estado={pushEstado} resultado={pushResultado} onEnviar={enviarPush}
              />
            )}
            <p className="text-center text-xs text-slate-400 mt-8">
              Este dispositivo e as tuas contas não contam nas estatísticas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Separadores ───────────────────────── */

function VisaoGeral({ stats, trafego, irPara }) {
  const p = trafego?.proprio;
  const conv = stats.entradasConvidado;
  const emails = (stats.subFolhetos ?? 0) + (stats.subCombustivel ?? 0);
  const origens = (p?.origens || []).filter(o => o.origem !== "interno").map(o => ({ rotulo: NOMES_ORIGEM[o.origem] || o.origem, n: o.n }));
  const paginas = (p?.paginas || []).map(o => ({ rotulo: o.caminho === "/" ? "/ (app)" : o.caminho, n: o.n }));

  return (
    <div className="space-y-4">
      <Grelha4>
        <Kpi rotulo="Visitantes" ajuda="7 dias" valor={p ? p.sete.visitantes : "…"} antes={p?.anteriores7} />
        <Kpi rotulo="Novos na app" ajuda="convidados, 7 dias" valor={conv?.novos7 ?? "—"} antes={conv?.novosAnteriores7} />
        <Kpi rotulo="Contas novas" ajuda="7 dias" valor={stats.ultimos7} antes={stats.anteriores7} />
        <Kpi rotulo="Subscritores email" ajuda={`${num(stats.subFolhetos ?? 0)} folhetos · ${num(stats.subCombustivel ?? 0)} combustível`} valor={emails} />
      </Grelha4>

      <div className="grid gap-4 md:grid-cols-5">
        <Painel
          className="md:col-span-3"
          titulo="Visitantes por dia"
          nota="últimos 14 dias"
          acao={<LinkAba onClick={() => irPara("trafego")}>Tráfego</LinkAba>}
        >
          {p ? (
            <>
              <Linha3
                a={["Hoje", p.hoje.visitantes]}
                b={["Vistas hoje", p.hoje.vistas]}
                c={["Vistas 30 dias", p.trinta.vistas]}
              />
              <Barras dados={p.serie.map(s => ({ dia: s.dia, n: s.visitantes }))} />
            </>
          ) : <Carregando />}
        </Painel>

        <Painel
          className="md:col-span-2"
          titulo="Percurso dos convidados"
          nota="quem entrou nos últimos 7 dias"
          acao={<LinkAba onClick={() => irPara("utilizadores")}>Utilizadores</LinkAba>}
        >
          {conv?.funil7?.entraram > 0 ? <FunilConvidados f={conv.funil7} compacto /> : <Vazio>Sem entradas nos últimos 7 dias.</Vazio>}
        </Painel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="De onde vêm" nota="páginas vistas, 7 dias">
          {p ? <ListaBarras itens={origens} limite={5} /> : <Carregando />}
        </Painel>
        <Painel titulo="Páginas mais vistas" nota="7 dias">
          {p ? <ListaBarras itens={paginas} limite={5} /> : <Carregando />}
        </Painel>
      </div>
    </div>
  );
}

function Trafego({ dados, onRepor, estadoRepor }) {
  if (!dados) return <Esqueleto />;
  const { proprio: p, google: g } = dados;
  const ga = g?.ga;
  const sc = g?.sc;
  const gaHoje = ga?.dias?.at(-1);
  const ga7 = (ga?.dias || []).slice(-7).reduce((s, d) => s + d.utilizadores, 0);
  const scCliques = (sc?.dias || []).reduce((s, d) => s + d.cliques, 0);
  const scImpr = (sc?.dias || []).reduce((s, d) => s + d.impressoes, 0);
  const perfil = p.perfil || {};

  return (
    <div className="space-y-4">
      <Secao titulo="Contador próprio" nota={`Conta toda a gente, com ou sem cookies, sem bots. Desde ${new Date(p.desdeDia + "T12:00:00").toLocaleDateString("pt-PT")}.`} />
      <Grelha4>
        <Kpi rotulo="Visitantes hoje" valor={p.hoje.visitantes} />
        <Kpi rotulo="Visitantes" ajuda="7 dias" valor={p.sete.visitantes} antes={p.anteriores7} />
        <Kpi rotulo="Páginas vistas" ajuda="7 dias" valor={p.sete.vistas} />
        <Kpi rotulo="Páginas vistas" ajuda="30 dias" valor={p.trinta.vistas} />
      </Grelha4>

      <Painel titulo="Visitantes por dia" nota="últimos 14 dias">
        <Barras dados={p.serie.map(s => ({ dia: s.dia, n: s.visitantes }))} alto />
      </Painel>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="De onde vêm" nota="páginas vistas, 7 dias">
          <ListaBarras itens={p.origens.filter(o => o.origem !== "interno").map(o => ({ rotulo: NOMES_ORIGEM[o.origem] || o.origem, n: o.n }))} />
        </Painel>
        <Painel titulo="Páginas mais vistas" nota="7 dias">
          <ListaBarras itens={p.paginas.map(o => ({ rotulo: o.caminho === "/" ? "/ (app)" : o.caminho, n: o.n }))} />
        </Painel>
        <Painel titulo="Perfil dos visitantes" nota="visitantes-dia, 7 dias">
          <div className="space-y-4">
            <Divisao titulo="Aparelho" itens={(perfil.dispositivo || []).map(o => ({ rotulo: o.valor, n: o.n }))} />
            <Divisao titulo="Como usam" itens={(perfil.modo || []).map(o => ({ rotulo: NOMES_MODO[o.valor] || o.valor, n: o.n }))} />
            <Divisao titulo="Visita" itens={(perfil.recorrencia || []).map(o => ({ rotulo: o.valor === "novo" ? "Primeira" : "Recorrente", n: o.n }))} />
          </div>
        </Painel>
        <Painel titulo="Distrito" nota="visitantes-dia, 7 dias · aproximado pelo IP">
          <ListaBarras itens={(perfil.regiao || []).map(o => ({ rotulo: o.valor, n: o.n }))} limite={6} />
        </Painel>
      </div>

      <Secao titulo="Google" />
      {!ga && !sc && !g?.gaErro && !g?.scErro ? (
        <Vazio>Google Analytics e Search Console ainda não estão ligados ao admin.</Vazio>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Painel titulo="Google Analytics" nota="só quem aceitou cookies">
            {ga ? (
              <>
                <Linha3 a={["Hoje", gaHoje?.utilizadores ?? 0]} b={["7 dias", ga7]} c={["Vistas hoje", gaHoje?.vistas ?? 0]} />
                <Barras dados={ga.dias.map(d => ({ dia: d.dia, n: d.utilizadores }))} />
                <div className="mt-4"><ListaBarras titulo="Canais (sessões, 7 dias)" itens={ga.canais.map(c => ({ rotulo: c.canal, n: c.sessoes }))} limite={5} /></div>
              </>
            ) : <SemGoogle erro={g?.gaErro} nome="Google Analytics" />}
          </Painel>
          <Painel titulo="Search Console" nota="28 dias">
            {sc ? (
              <>
                <Linha3 a={["Cliques", scCliques]} b={["Impressões", scImpr]} c={["CTR", scImpr ? `${((scCliques / scImpr) * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%` : "—"]} />
                <ListaBarras
                  titulo="Pesquisas (impressões)"
                  itens={sc.pesquisas.map(q => ({ rotulo: q.texto, n: q.impressoes, extra: `${q.cliques} cl. · pos. ${q.posicao}` }))}
                  limite={6}
                />
                <div className="mt-4">
                  <ListaBarras titulo="Páginas (impressões)" itens={sc.paginas.map(q => ({ rotulo: q.caminho, n: q.impressoes, extra: `${q.cliques} cl.` }))} limite={5} />
                </div>
              </>
            ) : <SemGoogle erro={g?.scErro} nome="Search Console" />}
          </Painel>
        </div>
      )}

      <div className="text-right">
        <button onClick={onRepor} disabled={estadoRepor === "a-repor"} className="text-xs font-semibold text-slate-500 underline hover:text-[color:var(--pj-danger)]">
          {estadoRepor === "a-repor" ? "A repor…" : estadoRepor === "ok" ? "Contador reposto a zero" : estadoRepor === "erro" ? "Erro — tenta de novo" : "Pôr contador de visitas a zero"}
        </button>
      </div>
    </div>
  );
}

function Utilizadores({ stats }) {
  const conv = stats.entradasConvidado;
  const totalPush = (stats.pushSubscritores?.length || 0) + (stats.pushConvidados || 0);

  return (
    <div className="space-y-4">
      <Grelha4>
        <Kpi rotulo="Contas" ajuda={`${num(stats.confirmados)} com email confirmado`} valor={stats.total} />
        <Kpi rotulo="Ativas" ajuda="fizeram login, 7 dias" valor={stats.ativos7 ?? "—"} />
        <Kpi rotulo="Convidados" ajuda={conv ? `${num(conv.converteram)} criaram conta (${pct(conv.converteram, conv.total)}%)` : "sem conta"} valor={conv?.total ?? stats.convidados ?? 0} />
        <Kpi rotulo="Nunca voltaram" ajuda="contas sem 2.º login" valor={stats.nuncaVoltaram ?? "—"} />
      </Grelha4>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="Por período">
          <TabelaPeriodos
            linhas={[
              ["Contas novas", stats.hoje, stats.ultimos7, stats.ultimos30],
              ["Contas ativas", stats.ativosHoje, stats.ativos7, stats.ativos30],
              ...(conv ? [
                ["Convidados que abriram", conv.abriramHoje, conv.abriram7, conv.abriram30],
                ["Convidados novos", conv.novosHoje, conv.novos7, conv.novos30],
              ] : []),
            ]}
          />
          {Array.isArray(stats.crescimento) && stats.crescimento.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 mb-2">Contas novas por dia · 14 dias</p>
              <Barras dados={stats.crescimento.map(d => ({ dia: String(d.dia).slice(0, 10), n: d.n }))} />
            </div>
          )}
        </Painel>

        <Painel titulo="Percurso dos convidados" nota="quem entrou nos últimos 7 dias">
          {conv?.funil7?.entraram > 0 ? (
            <>
              <FunilConvidados f={conv.funil7} />
              <p className="text-xs text-slate-400 mt-3">
                {num(conv.aberturas)} aberturas no total. Contagem desde 1 out 2026; antes disso ver Google Analytics (login · convidado_local).
              </p>
            </>
          ) : <Vazio>Sem entradas nos últimos 7 dias.</Vazio>}
        </Painel>

        <Painel titulo="Funil das contas" nota="em relação às contas registadas">
          {stats.funil ? (
            <Funil etapas={[
              ["Registou", stats.funil.registou],
              ["Confirmou email", stats.funil.confirmou],
              ["Instalou a app", stats.funil.instalou],
              ["Ativou notificações", stats.funil.ativouPush],
            ]} />
          ) : <Vazio>Sem dados.</Vazio>}
        </Painel>

        <Painel titulo="Alcance" nota="por onde lhes podes chegar">
          <dl className="divide-y divide-slate-100">
            <LinhaDado rotulo="Email semanal" valor={stats.emailAtivos ?? stats.confirmados} nota={`${num(stats.emailDesativado ?? 0)} desativaram`} />
            <LinhaDado rotulo="Notificações push" valor={totalPush} nota={stats.pushConvidados ? `${num(stats.pushConvidados)} sem conta` : null} />
            <LinhaDado rotulo="Alertas de folhetos" valor={stats.subFolhetos ?? 0} />
            <LinhaDado rotulo="Alertas de combustível" valor={stats.subCombustivel ?? 0} />
            <LinhaDado rotulo="App instalada" valor={stats.totalPwa ?? 0} nota={`${pct(stats.totalPwa ?? 0, stats.total)}% das contas`} />
            <LinhaDado rotulo="Listas partilhadas" valor={stats.listasPartilhadas ?? 0} nota={`${num(stats.listasAtivas7 ?? 0)} ativas em 7 dias`} />
          </dl>
        </Painel>

        <Painel titulo="Perfil das contas" className="md:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Divisao titulo="Plataforma" itens={Object.entries(NOMES_PLATAFORMA).map(([k, rotulo]) => ({ rotulo, n: stats.porPlataforma?.[k] ?? 0 }))} />
            <Divisao titulo="Método de login" itens={[{ rotulo: "Google", n: stats.porMetodo?.google ?? 0 }, { rotulo: "Email e password", n: stats.porMetodo?.email ?? 0 }]} />
          </div>
        </Painel>
      </div>

      <ListaContas stats={stats} />
    </div>
  );
}

function ListaContas({ stats }) {
  const [aberta, setAberta] = useState(false);
  const [ordem, setOrdem] = useState("registo"); // registo | login
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState(20);
  const comPush = useMemo(() => new Set((stats.pushSubscritores || []).map(s => s.email)), [stats.pushSubscritores]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return [...stats.recentes]
      .filter(u => !q || (u.email || "convidado").toLowerCase().includes(q))
      .sort((a, b) => ordem === "login"
        ? (b.ultimoAcesso ? new Date(b.ultimoAcesso) : 0) - (a.ultimoAcesso ? new Date(a.ultimoAcesso) : 0)
        : new Date(b.criado) - new Date(a.criado));
  }, [stats.recentes, busca, ordem]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200">
      <button onClick={() => setAberta(v => !v)} aria-expanded={aberta} className="w-full flex items-center gap-2 px-5 py-4 text-left">
        <h2 className="font-semibold text-slate-800">Contas</h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">{stats.recentes.length}</span>
        <span className="text-xs text-slate-400 hidden sm:inline">mais recentes e últimos logins</span>
        <ChevronDown size={18} className={`ml-auto text-slate-400 transition-transform ${aberta ? "rotate-180" : ""}`} />
      </button>

      {aberta && (
        <>
          <div className="flex flex-wrap items-center gap-2 px-5 pb-3 border-b border-slate-100">
            <label className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={e => { setBusca(e.target.value); setLimite(20); }}
                placeholder="Procurar email"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-300 focus:bg-white"
              />
            </label>
            <Segmentado
              valor={ordem}
              onChange={setOrdem}
              opcoes={[["registo", "Registo"], ["login", "Último login"]]}
            />
          </div>

          <ul className="divide-y divide-slate-100">
            {lista.slice(0, limite).map((u, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${u.convidado ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-700"}`}>
                  {u.convidado ? "?" : (u.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.convidado ? "Convidado" : u.email}</p>
                    {u.confirmado && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" aria-label="Email confirmado" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Registo {fmtData(u.criado)}
                    <span className="text-slate-300"> · </span>
                    {u.ultimoAcesso ? <>login {fmtRelativo(u.ultimoAcesso)}</> : <span className="text-slate-400">nunca voltou</span>}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {u.google && <Etiqueta>Google</Etiqueta>}
                  {u.dispositivo?.platform && <Etiqueta>{NOMES_PLATAFORMA[u.dispositivo.platform] || u.dispositivo.platform}</Etiqueta>}
                  {u.dispositivo?.pwa && <Etiqueta forte>App</Etiqueta>}
                  {comPush.has(u.email) && <Bell size={13} className="text-emerald-600 ml-1" aria-label="Notificações ativas" />}
                </div>
              </li>
            ))}
            {lista.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Nenhuma conta encontrada.</li>}
          </ul>
          {lista.length > limite && (
            <button onClick={() => setLimite(l => l + 30)} className="w-full py-3 text-sm font-semibold text-emerald-700 border-t border-slate-100 hover:bg-slate-50 rounded-b-2xl">
              Mostrar mais ({lista.length - limite})
            </button>
          )}
        </>
      )}
    </section>
  );
}

function Avisos({ stats, titulo, setTitulo, corpo, setCorpo, url, setUrl, estado, resultado, onEnviar }) {
  const destinatarios = (stats.pushSubscritores?.length || 0) + (stats.pushConvidados || 0);
  const campo = "mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50";
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Painel className="md:col-span-3" titulo="Enviar notificação push" nota={`vai para ${num(destinatarios)} aparelhos com notificações ativas`}>
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600">Título <span className="text-slate-400 tabular-nums">{titulo.length}/80</span></span>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={80} className={campo} />
          </label>
          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600">Mensagem <span className="text-slate-400 tabular-nums">{corpo.length}/200</span></span>
            <textarea value={corpo} onChange={e => setCorpo(e.target.value)} rows={3} maxLength={200} className={`${campo} resize-none`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Abre em</span>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="/ ou /apoios" className={campo} />
          </label>
          <button
            onClick={() => { if (window.confirm(`Enviar esta notificação a ${destinatarios} aparelhos?`)) onEnviar(); }}
            disabled={estado === "a-enviar" || !titulo.trim() || !corpo.trim()}
            className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            {estado === "a-enviar" ? <><RefreshCw size={14} className="animate-spin" /> A enviar…</> : <><Send size={14} /> Enviar a todos</>}
          </button>
          {resultado && (
            <p className={`text-sm font-semibold text-center rounded-xl px-4 py-2.5 ${estado === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-[color:var(--pj-danger-wash)] text-[color:var(--pj-danger)]"}`}>
              {resultado}
            </p>
          )}
        </div>
      </Painel>

      <Painel className="md:col-span-2" titulo="Pré-visualização">
        <div className="rounded-2xl bg-slate-800 p-4">
          <div className="rounded-xl bg-white/95 p-3 shadow">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <div className="w-4 h-4 rounded bg-emerald-500" /> PoupeJá · agora
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1.5 break-words">{titulo || "Título"}</p>
            <p className="text-sm text-slate-600 mt-0.5 break-words">{corpo || "Mensagem"}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 break-all">Ao tocar abre: {url || "/"}</p>
        </div>
      </Painel>
    </div>
  );
}

/* ───────────────────────── Peças ───────────────────────── */

function Painel({ titulo, nota, acao, className = "", children }) {
  return (
    <section className={`min-w-0 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 ${className}`}>
      <header className="flex items-start gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800 leading-snug">{titulo}</h2>
          {nota && <p className="text-xs text-slate-400 mt-0.5">{nota}</p>}
        </div>
        {acao && <span className="ml-auto shrink-0 pt-0.5">{acao}</span>}
      </header>
      {children}
    </section>
  );
}

function Secao({ titulo, nota }) {
  return (
    <div className="pt-2">
      <h2 className="font-display text-base font-semibold text-slate-700">{titulo}</h2>
      {nota && <p className="text-xs text-slate-500 mt-0.5">{nota}</p>}
    </div>
  );
}

function Grelha4({ children }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

function Kpi({ rotulo, ajuda, valor, antes }) {
  return (
    <div className="min-w-0 bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500">{rotulo}</p>
      <p className="font-display text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{num(valor)}</p>
      <div className="mt-1 min-h-[1rem] flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
        {antes !== undefined && typeof valor === "number" && <Variacao agora={valor} antes={antes} />}
        {ajuda && <span>{ajuda}</span>}
      </div>
    </div>
  );
}

// Variação face à semana anterior: só aparece quando há com que comparar.
function Variacao({ agora, antes }) {
  if (!antes) return null;
  const v = Math.round(((agora - antes) / antes) * 100);
  const [Icone, cor] = v > 0 ? [ArrowUpRight, "text-emerald-600"] : v < 0 ? [ArrowDownRight, "text-[color:var(--pj-danger)]"] : [Minus, "text-slate-400"];
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${cor}`} title="vs. 7 dias anteriores">
      <Icone size={13} /> {Math.abs(v)}%
    </span>
  );
}

function Linha3({ a, b, c }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[a, b, c].map(([r, v]) => (
        <div key={r}>
          <p className="text-xs text-slate-500">{r}</p>
          <p className="text-lg font-semibold text-slate-900 tabular-nums">{num(v)}</p>
        </div>
      ))}
    </div>
  );
}

function Barras({ dados, alto = false }) {
  const max = Math.max(1, ...dados.map(d => d.n));
  const h = alto ? 140 : 96;
  const hoje = dados.length - 1;
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: h }}>
        {dados.map((d, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end group relative" title={`${new Date(d.dia + "T12:00:00").toLocaleDateString("pt-PT")}: ${d.n}`}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 tabular-nums">{d.n}</span>
            <div
              className={`w-full rounded-t ${i === hoje ? "bg-emerald-500" : "bg-emerald-200 group-hover:bg-emerald-300"}`}
              style={{ height: `${d.n === 0 ? 2 : Math.max(4, (d.n / max) * h)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 tabular-nums">
        <span>{rotuloDia(dados[0]?.dia)}</span>
        <span>{rotuloDia(dados[Math.floor(dados.length / 2)]?.dia)}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}
const rotuloDia = (d) => { if (!d) return ""; const x = new Date(d + "T12:00:00"); return `${x.getDate()}/${x.getMonth() + 1}`; };

function ListaBarras({ titulo, itens, limite = 10 }) {
  const [tudo, setTudo] = useState(false);
  if (!itens?.length) return <Vazio>Sem dados.</Vazio>;
  const max = Math.max(1, ...itens.map(i => i.n));
  const total = itens.reduce((s, i) => s + i.n, 0);
  const visiveis = tudo ? itens : itens.slice(0, limite);
  return (
    <div>
      {titulo && <p className="text-xs font-semibold text-slate-500 mb-2">{titulo}</p>}
      <ul className="space-y-2">
        {visiveis.map((i, k) => (
          <li key={k}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700 truncate" title={i.rotulo}>{i.rotulo}</span>
              <span className="shrink-0 tabular-nums">
                {i.extra && <span className="text-xs text-slate-400 mr-2">{i.extra}</span>}
                <span className="font-semibold text-slate-900">{num(i.n)}</span>
                {!i.extra && <span className="text-xs text-slate-400 ml-1.5 inline-block w-8 text-right">{pct(i.n, total)}%</span>}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(i.n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {itens.length > limite && (
        <button onClick={() => setTudo(v => !v)} className="mt-3 text-xs font-semibold text-emerald-700">
          {tudo ? "Mostrar menos" : `Ver todos (${itens.length})`}
        </button>
      )}
    </div>
  );
}

// Uma barra empilhada com legenda: para dimensões com poucas categorias.
function Divisao({ titulo, itens }) {
  const total = itens.reduce((s, i) => s + i.n, 0);
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-2">{titulo}</p>
      {total === 0 ? <p className="text-sm text-slate-400">Sem dados.</p> : (
        <>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
            {itens.map((i, k) => i.n > 0 && (
              <div key={k} style={{ width: `${(i.n / total) * 100}%`, background: CORES[k % CORES.length] }} title={`${i.rotulo}: ${i.n}`} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {itens.map((i, k) => (
              <li key={k} className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: CORES[k % CORES.length] }} />
                <span className="text-slate-600">{i.rotulo}</span>
                <span className="font-semibold text-slate-900 tabular-nums">{num(i.n)}</span>
                <span className="text-xs text-slate-400 tabular-nums">{pct(i.n, total)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Funil({ etapas }) {
  const base = Math.max(1, etapas[0][1] || 0);
  return (
    <ol className="space-y-2.5">
      {etapas.map(([rotulo, v], i) => {
        const p = Math.min(100, pct(v || 0, base)); // nunca passa dos 100%
        return (
          <li key={i}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-700">{rotulo}</span>
              <span className="tabular-nums"><span className="font-semibold text-slate-900">{num(v ?? 0)}</span><span className="text-xs text-slate-400 ml-1.5 inline-block w-9 text-right">{p}%</span></span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(v ? 2 : 0, p)}%`, opacity: 1 - i * 0.12 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function FunilConvidados({ f, compacto = false }) {
  const todas = [
    ["Entraram", f.entraram], ["Voltaram a abrir", f.voltaram], ["Compararam a lista", f.comparou],
    ["Escolheram onde comprar", f.escolheu], ["Ligaram o sino", f.alerta], ["Tocaram em criar conta", f.pediuConta], ["Criaram conta", f.converteram],
  ];
  const etapas = compacto ? todas.filter(([r]) => ["Entraram", "Voltaram a abrir", "Compararam a lista", "Criaram conta"].includes(r)) : todas;
  return <Funil etapas={etapas} />;
}

function TabelaPeriodos({ linhas }) {
  return (
    <table className="w-full text-sm tabular-nums">
      <thead>
        <tr className="text-xs text-slate-500">
          <th className="text-left font-semibold pb-2" />
          <th className="text-right font-semibold pb-2 w-14">Hoje</th>
          <th className="text-right font-semibold pb-2 w-14">7 d</th>
          <th className="text-right font-semibold pb-2 w-14">30 d</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {linhas.map(([rotulo, ...v]) => (
          <tr key={rotulo}>
            <td className="py-2 text-slate-700">{rotulo}</td>
            {v.map((x, i) => <td key={i} className={`py-2 text-right ${i === 1 ? "font-semibold text-slate-900" : "text-slate-600"}`}>{num(x ?? "—")}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LinhaDado({ rotulo, valor, nota }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-sm text-slate-700">{rotulo}</dt>
      <dd className="text-right tabular-nums">
        {nota && <span className="text-xs text-slate-400 mr-2">{nota}</span>}
        <span className="font-semibold text-slate-900">{num(valor)}</span>
      </dd>
    </div>
  );
}

function Segmentado({ valor, onChange, opcoes }) {
  return (
    <div className="inline-flex bg-slate-100 p-0.5 rounded-lg">
      {opcoes.map(([id, rotulo]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-pressed={valor === id}
          className={`px-3 h-8 text-xs font-semibold rounded-md transition ${valor === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

function Etiqueta({ children, forte = false }) {
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${forte ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{children}</span>;
}

function LinkAba({ onClick, children }) {
  return <button onClick={onClick} className="text-xs font-semibold text-emerald-700 hover:underline">{children} →</button>;
}

function SemGoogle({ erro, nome }) {
  return <Vazio>{erro ? `${nome}: erro a ler (${erro}). Confirma o acesso da conta de serviço.` : `${nome} ainda não está ligado ao admin.`}</Vazio>;
}

function Vazio({ children }) {
  return <p className="text-sm text-slate-400 py-2">{children}</p>;
}

function Carregando() {
  return <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />;
}

function Esqueleto() {
  return (
    <div className="space-y-4" aria-label="A carregar">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />)}
      </div>
      <div className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse" />
    </div>
  );
}
