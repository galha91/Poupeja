import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import {
  ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Bell, Send, ChevronDown, Search,
  LayoutDashboard, BarChart3, Users, Megaphone, ArrowUpRight, ArrowDownRight, Minus,
  MousePointerClick, Gauge, Store, Bug, Repeat, Mail, Globe, Activity, SearchX, Route, AlertTriangle, Hourglass,
  Download, Target, Trash2, Copy, Plus, Newspaper as Publicacao, Timer, MessageSquare, Wallet,
} from "lucide-react";

// Painel privado do dono, do mais geral para o mais detalhado:
//   Geral       — o que mudou esta semana e se há alguma coisa partida
//   Aquisição   — de onde vêm as visitas (contador próprio, Google, emails)
//   Uso         — o que fazem cá dentro: funcionalidades, pesquisas, retenção
//   Utilizadores— contas, alcance e lista
//   Qualidade   — saúde dos preços, velocidade e erros
//   Avisos      — notificações push
// Os blocos marcados "a recolher" dependem de métricas novas (lib/metricas.js)
// e enchem-se sozinhos à medida que as pessoas usam a app.

const ABAS = [
  { id: "geral", rotulo: "Geral", Icone: LayoutDashboard },
  { id: "aquisicao", rotulo: "Aquisição", Icone: BarChart3 },
  { id: "uso", rotulo: "Uso", Icone: MousePointerClick },
  { id: "utilizadores", rotulo: "Utilizadores", Icone: Users },
  { id: "qualidade", rotulo: "Qualidade", Icone: Gauge },
  { id: "avisos", rotulo: "Avisos", Icone: Megaphone },
];

// Nomes legíveis dos eventos de lib/analytics.js.
const NOMES_EVENTO = {
  screen_view: "Abriu um separador", sign_up: "Criou conta", login: "Iniciou sessão", receipt_scanned: "Fotografou um talão",
  share: "Partilhou", app_installed: "Instalou a app", push_subscribed: "Ativou notificações", push_soft: "Convite às notificações",
  lista_criada: "Criou uma lista", comparar_lista: "Comparou a lista", lista_escolha: "Escolheu onde comprar",
  alerta_preco_criado: "Criou alerta de preço", alerta_email_criado: "Pediu alerta por email", sem_resultado_alerta_aberto: "Abriu «avisa-me» numa pesquisa sem resultado", alerta_preco_removido: "Removeu alerta de preço", cobertura_ver: "Viu supermercados comparados",
  sugerir_supermercado: "Pediu um supermercado", conta_renovacao_registada: "Registou conta que renova", erse_aberto: "Abriu simulador ERSE",
  erse_resultado_guardado: "Guardou resultado ERSE", garantia_registada: "Registou garantia", garantia_exportada: "Exportou garantia",
  lembrete_ativado: "Ativou lembrete", calendario_exportado: "Exportou para calendário", prazos_filtro: "Filtrou prazos do Estado",
  copia_seguranca: "Cópia de segurança", inicio_combustivel: "Combustível no início", comparar_exemplo: "Viu exemplo do Mercado",
  comparar_pesquisa: "Pesquisou um produto", comparar_sem_resultados: "Pesquisa sem resultados", desconto_combustivel: "Desconto de combustível",
  codigo_barras: "Leitor de código de barras", ementas_plano: "Plano de jantares", receita_cozinhada: "Cozinhou uma receita",
  abrir_poupeja: "Abriu a app a partir do site", feedback_util: "Respondeu «Isto foi útil?»", arranque_cabaz: "Comparou o cabaz básico (1 toque)",
  lembrete_compras_criado: "Pediu lembrete do dia das compras", lembrete_compras_cancelado: "Cancelou o lembrete", lista_guardada_usada: "Usou uma lista guardada",
  lista_pediu_artigo: "Escreveu palavra geral na lista", pedir_conta: "Tocou em criar conta", subscrever_folhetos: "Subscreveu os folhetos",
};
const NOMES_TAREFA = {
  "cron-precos": "Preços dos combustíveis (DGEG)", "cron-saude-precos": "Verificação dos preços das lojas", "cron-historico-precos": "Histórico de preços (1/3)",
  "cron-historico-precos-2": "Histórico de preços (2/3)", "cron-historico-precos-3": "Histórico de preços (3/3)", "cron-avisos": "Notificações personalizadas",
  "cron-alertas-email": "Alertas de preço por email", "cron-lembrete-compras": "Lembrete do dia das compras", "cron-email-semanal": "Resumo semanal dos folhetos",
  "cron-email-combustiveis": "Email semanal de combustível", "cron-previsao-combustiveis": "Previsão dos combustíveis", "cron-validar-urls": "Validação de links",
  "cron-indexnow": "Aviso de páginas novas aos motores (IndexNow)", "cron-resumo-admin": "Resumo do admin por email", "push-enviar": "Notificação geral de quinta",
};
const NOMES_VITAL = {
  LCP: ["Conteúdo principal", "tempo até aparecer o maior elemento"],
  INP: ["Resposta ao toque", "atraso entre tocar e o ecrã reagir"],
  CLS: ["Estabilidade", "quanto a página salta enquanto carrega"],
  FCP: ["Primeiro conteúdo", "tempo até aparecer alguma coisa"],
  TTFB: ["Resposta do servidor", "tempo até chegar o primeiro byte"],
};

const NOMES_MODO = { "app-android": "App Android", pwa: "App instalada", browser: "Browser" };
const NOMES_ORIGEM = {
  direto: "Direto / app", google: "Google", pesquisa: "Outros motores", facebook: "Facebook",
  instagram: "Instagram", tiktok: "TikTok", whatsapp: "WhatsApp", outro: "Outros sites", interno: "Navegação interna",
};
const NOMES_PLATAFORMA = { ios: "iOS", android: "Android", desktop: "Computador" };

// Paleta discreta para séries: verde da marca primeiro, depois tons neutros.
const CORES = ["#0b6b4f", "#3f9070", "#82b09b", "#c8a26a", "#8a978e", "#cfccbf"];

// Período escolhido no cabeçalho (7, 30 ou 90 dias), para os textos dos painéis.
const PeriodoCtx = createContext(7);
const usePeriodo = () => { const dias = useContext(PeriodoCtx); return { dias, txt: `${dias} dias` }; };
const PERIODOS = [[7, "7 d"], [30, "30 d"], [90, "90 d"]];
const URL_SITE = "https://poupejá.com";

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
  const [crescimento, setCrescimento] = useState(null);
  const [erro, setErro] = useState("");
  const [sessaoEmail, setSessaoEmail] = useState(null);
  const [aba, setAba] = useState("geral");
  const [dias, setDias] = useState(7);
  const [aAtualizar, setAAtualizar] = useState(false);
  const [estadoRepor, setEstadoRepor] = useState(""); // "", "a-repor", "ok", "erro"

  const [pushTitulo, setPushTitulo] = useState("🏛️ Novidade no PoupeJá");
  const [pushCorpo, setPushCorpo] = useState("Descobre os Apoios do Estado a que tens direito — subsídios, isenções e muito mais.");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushEstado, setPushEstado] = useState(""); // "", "a-enviar", "ok", "erro"
  const [pushResultado, setPushResultado] = useState(null);

  async function carregar(d = dias) {
    // Na primeira carga mostra o ecrã de espera; depois só roda o botão.
    if (!stats) setEstado("a-carregar");
    setAAtualizar(true);
    setErro("");
    const { data: { session } } = await supabase.auth.getSession();
    setSessaoEmail(session?.user?.email || null);
    if (!session?.access_token) { setEstado("negado"); setAAtualizar(false); return; }
    const auth = { Authorization: `Bearer ${session.access_token}` };
    try {
      const r = await fetch(`/api/admin-stats?dias=${d}`, { headers: auth });
      if (r.status === 403 || r.status === 401) { setEstado("negado"); return; }
      const data = await r.json();
      if (!r.ok) { setErro(data.erro || "Erro a obter dados."); setEstado("erro"); return; }
      setStats(data);
      setEstado("ok");
      // Este dispositivo é do dono: deixa de contar nas visitas e nos convidados.
      try { localStorage.setItem("poupeja_nao_contar", "1"); } catch {}
      const ler = (u) => fetch(u, { headers: auth }).then(x => (x.ok ? x.json() : null)).catch(() => null);
      const [t, c] = await Promise.all([ler(`/api/admin-trafego?dias=${d}`), ler(`/api/admin-crescimento?dias=${d}`)]);
      setTrafego(t);
      setCrescimento(c || {});
    } catch {
      setErro("Falha de ligação.");
      setEstado("erro");
    } finally {
      setAAtualizar(false);
    }
  }

  useEffect(() => {
    let d = 7;
    try { d = Number(localStorage.getItem("poupeja_admin_dias")) || 7; } catch {}
    if (![7, 30, 90].includes(d)) d = 7;
    setDias(d);
    carregar(d);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function mudarPeriodo(d) {
    setDias(d);
    try { localStorage.setItem("poupeja_admin_dias", String(d)); } catch {}
    carregar(d);
  }

  // Pedidos autenticados das ações do admin (notas, metas).
  async function pedir(url, opcoes = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(url, { ...opcoes, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` } });
    const corpo = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) throw new Error(corpo?.erro || "Não foi possível guardar.");
    return corpo;
  }
  const atualizarCresc = (f) => setCrescimento(c => ({ ...(c || {}), ...f(c || {}) }));

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
              <Segmentado valor={dias} onChange={mudarPeriodo} opcoes={PERIODOS} rotulo="Período" />
            )}
            {estado === "ok" && (
              <button
                onClick={() => carregar()}
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
            <button onClick={() => carregar()} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-sm">
              <RefreshCw size={14} /> Tentar de novo
            </button>
          </div>
        )}

        {estado === "ok" && stats && (
          <PeriodoCtx.Provider value={dias}>
          <div role="tabpanel" className={aAtualizar ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {aba === "geral" && <VisaoGeral stats={stats} trafego={trafego} cresc={crescimento} irPara={setAba} pedir={pedir} atualizarCresc={atualizarCresc} />}
            {aba === "aquisicao" && <Trafego dados={trafego} cresc={crescimento} onRepor={reporVisitas} estadoRepor={estadoRepor} pedir={pedir} atualizarCresc={atualizarCresc} />}
            {aba === "uso" && <Uso stats={stats} cresc={crescimento} />}
            {aba === "utilizadores" && <Utilizadores stats={stats} cresc={crescimento} />}
            {aba === "qualidade" && <Qualidade cresc={crescimento} />}
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
          </PeriodoCtx.Provider>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Separadores ───────────────────────── */

function VisaoGeral({ stats, trafego, cresc, irPara, pedir, atualizarCresc }) {
  const { dias, txt } = usePeriodo();
  const [editarMetas, setEditarMetas] = useState(false);
  const p = trafego?.proprio;
  const r = cresc?.retencao;
  const e = cresc?.emails;
  const conv = stats.entradasConvidado;
  const metas = cresc?.metas || {};
  const escala = dias / 7; // as metas são semanais
  const meta = (k) => (metas[k] ? Math.round(metas[k] * escala) : null);
  const totalEmails = (stats.subFolhetos ?? 0) + (stats.subCombustivel ?? 0);
  const origens = (p?.origens || []).filter(o => o.origem !== "interno").map(o => ({ rotulo: NOMES_ORIGEM[o.origem] || o.origem, n: o.n }));
  const paginas = (p?.paginas || []).map(o => ({ rotulo: o.caminho === "/" ? "/ (app)" : o.caminho, n: o.n }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Últimos {txt}, comparado com os {txt} anteriores</p>
        <button onClick={() => setEditarMetas(v => !v)} className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <Target size={13} /> {editarMetas ? "Fechar metas" : Object.keys(metas).length ? "Editar metas" : "Definir metas"}
        </button>
      </div>
      {editarMetas && (
        <EditorMetas
          metas={metas}
          onGuardar={async (novas) => { const m = await pedir("/api/admin-metas", { method: "PUT", body: JSON.stringify(novas) }); atualizarCresc(() => ({ metas: m })); setEditarMetas(false); }}
        />
      )}
      <Grelha4>
        <Kpi rotulo="Visitantes" ajuda={txt} valor={p ? p.periodo.visitantes : "…"} antes={p?.anterior?.visitantes} meta={meta("visitantes")} />
        <Kpi rotulo="Novos na app" ajuda={`convidados, ${txt}`} valor={r ? r.novos : conv?.novos7 ?? "—"} antes={r ? r.novosAntes : conv?.novosAnteriores7} meta={meta("convidados")} />
        <Kpi rotulo="Contas novas" ajuda={txt} valor={stats.periodo?.contasNovas ?? stats.ultimos7} antes={stats.periodo?.contasAntes ?? stats.anteriores7} meta={meta("contas")} />
        <Kpi rotulo="Emails novos" ajuda={`${num(totalEmails)} subscritores no total`} valor={e ? e.novos : "—"} antes={e?.novosAntes} meta={meta("emails")} />
      </Grelha4>

      <Estado cresc={cresc} irPara={irPara} />

      <div className="grid gap-4 md:grid-cols-5">
        <Painel
          className="md:col-span-3"
          titulo="Visitantes por dia"
          nota={`últimos ${Math.max(14, dias)} dias · os pontos são as tuas notas`}
          acao={<LinkAba onClick={() => irPara("aquisicao")}>Aquisição</LinkAba>}
        >
          {p ? (
            <>
              <Linha3 a={["Pessoas hoje", p.hoje.visitantes]} b={["Páginas abertas hoje", p.hoje.vistas]} c={[`Páginas abertas ${txt}`, p.periodo.vistas]} />
              <Barras dados={p.serie.map(s => ({ dia: s.dia, n: s.visitantes }))} notas={cresc?.notas} />
            </>
          ) : <Carregando />}
        </Painel>

        <Painel
          className="md:col-span-2"
          titulo="Percurso dos convidados"
          nota="quem entrou nos últimos 7 dias"
          acao={<LinkAba onClick={() => irPara("uso")}>Uso</LinkAba>}
        >
          {conv?.funil7?.entraram > 0 ? <FunilConvidados f={conv.funil7} compacto /> : <Vazio>Sem entradas nos últimos 7 dias.</Vazio>}
        </Painel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="De onde vêm" nota={`páginas vistas, ${txt}`} csv={() => [["Origem", "Páginas vistas"], ...origens.map(o => [o.rotulo, o.n])]} nomeCsv="origens">
          {p ? <ListaBarras itens={origens} limite={5} /> : <Carregando />}
        </Painel>
        <Painel titulo="Páginas mais vistas" nota={txt} csv={() => [["Página", "Vistas"], ...paginas.map(o => [o.rotulo, o.n])]} nomeCsv="paginas">
          {p ? <ListaBarras itens={paginas} limite={5} /> : <Carregando />}
        </Painel>
      </div>
    </div>
  );
}

function EditorMetas({ metas, onGuardar }) {
  const [v, setV] = useState({ visitantes: metas.visitantes || "", convidados: metas.convidados || "", contas: metas.contas || "", emails: metas.emails || "" });
  const [estado, setEstado] = useState("");
  const campos = [["visitantes", "Visitantes"], ["convidados", "Convidados novos"], ["contas", "Contas novas"], ["emails", "Emails novos"]];
  return (
    <Painel titulo="Metas por semana" nota="nos períodos de 30 e 90 dias a meta é ajustada; deixa vazio para não ter meta">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {campos.map(([k, rotulo]) => (
          <label key={k} className="block">
            <span className="text-xs font-semibold text-slate-600">{rotulo}</span>
            <input type="number" min="0" inputMode="numeric" value={v[k]} onChange={e => setV({ ...v, [k]: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm tabular-nums outline-none focus:border-emerald-300" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={async () => { setEstado("a-guardar"); try { await onGuardar(v); } catch (e) { setEstado(e.message); } }}
          disabled={estado === "a-guardar"}
          className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
        >
          {estado === "a-guardar" ? "A guardar…" : "Guardar metas"}
        </button>
        {estado && estado !== "a-guardar" && <span className="text-xs text-[color:var(--pj-danger)]">{estado}</span>}
      </div>
    </Painel>
  );
}

function Trafego({ dados, cresc, onRepor, estadoRepor, pedir, atualizarCresc }) {
  const { dias, txt } = usePeriodo();
  if (!dados) return <Esqueleto />;
  const { proprio: p, google: g } = dados;
  if (!p) return <EmRecolha>Não foi possível ler o contador de visitas.</EmRecolha>;
  const origens = p.origens.filter(o => o.origem !== "interno").map(o => ({ rotulo: NOMES_ORIGEM[o.origem] || o.origem, n: o.n, antes: o.antes }));
  const paginas = p.paginas.map(o => ({ rotulo: o.caminho === "/" ? "/ (app)" : o.caminho, n: o.n, antes: o.antes }));
  const ga = g?.ga;
  const sc = g?.sc;
  const gaHoje = ga?.dias?.at(-1);
  const ga7 = (ga?.dias || []).slice(-7).reduce((s, d) => s + d.utilizadores, 0);
  const scCliques = (sc?.dias || []).reduce((s, d) => s + d.cliques, 0);
  const scImpr = (sc?.dias || []).reduce((s, d) => s + d.impressoes, 0);
  const perfil = p.perfil || {};

  return (
    <div className="space-y-4">
      <Grupo Icone={Activity} titulo="Visitas" nota={`Contador próprio: toda a gente, com ou sem cookies, sem bots. Desde ${new Date(p.desdeDia + "T12:00:00").toLocaleDateString("pt-PT")}.`} />
      <Grelha4>
        <Kpi rotulo="Pessoas hoje" ajuda={`${num(p.hoje.vistas)} páginas abertas`} valor={p.hoje.visitantes} />
        <Kpi rotulo="Visitantes" ajuda={txt} valor={p.periodo.visitantes} antes={p.anterior.visitantes} />
        <Kpi rotulo="Páginas vistas" ajuda={txt} valor={p.periodo.vistas} antes={p.anterior.vistas} />
        <Kpi rotulo="Páginas por visitante" ajuda={txt} valor={p.periodo.visitantes ? (p.periodo.vistas / p.periodo.visitantes).toLocaleString("pt-PT", { maximumFractionDigits: 1 }) : "—"} />
      </Grelha4>

      <Painel titulo="Visitantes por dia" nota={`últimos ${Math.max(14, dias)} dias · os pontos são as tuas notas`}
        csv={() => [["Dia", "Visitantes", "Páginas vistas"], ...p.serie.map(s => [s.dia, s.visitantes, s.vistas])]} nomeCsv="visitantes-por-dia">
        <Barras dados={p.serie.map(s => ({ dia: s.dia, n: s.visitantes }))} notas={cresc?.notas} alto />
      </Painel>

      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="De onde vêm" nota={`páginas vistas, ${txt} · vs. período anterior`} csv={() => [["Origem", "Páginas vistas", "Período anterior"], ...origens.map(o => [o.rotulo, o.n, o.antes])]} nomeCsv="origens">
          <ListaBarras itens={origens} comparar />
        </Painel>
        <Painel titulo="Páginas mais vistas" nota={txt} csv={() => [["Página", "Vistas", "Período anterior"], ...paginas.map(o => [o.rotulo, o.n, o.antes])]} nomeCsv="paginas">
          <ListaBarras itens={paginas} comparar />
        </Painel>
        <Painel titulo="Perfil dos visitantes" nota={`visitantes-dia, ${txt}`}>
          <div className="space-y-4">
            <Divisao titulo="Aparelho" itens={(perfil.dispositivo || []).map(o => ({ rotulo: o.valor, n: o.n }))} />
            <Divisao titulo="Como usam" itens={(perfil.modo || []).map(o => ({ rotulo: NOMES_MODO[o.valor] || o.valor, n: o.n }))} />
            <Divisao titulo="Visita" itens={(perfil.recorrencia || []).map(o => ({ rotulo: o.valor === "novo" ? "Primeira" : "Recorrente", n: o.n }))} />
          </div>
        </Painel>
        <Painel titulo="Distrito" nota={`visitantes-dia, ${txt} · aproximado pelo IP`} csv={() => [["Distrito", "Visitantes-dia"], ...(perfil.regiao || []).map(o => [o.valor, o.n])]} nomeCsv="distritos">
          <ListaBarras itens={(perfil.regiao || []).map(o => ({ rotulo: o.valor, n: o.n }))} limite={6} />
        </Painel>
      </div>

      <Publicacoes cresc={cresc} pedir={pedir} atualizarCresc={atualizarCresc} />

      <Grupo Icone={Globe} titulo="Google" nota="Quanto o Google nos mostra e quantos clicam. É o canal que mais cresce sozinho." />
      {!ga && !sc && !g?.gaErro && !g?.scErro ? (
        <Vazio>Google Analytics e Search Console ainda não estão ligados ao admin.</Vazio>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Painel titulo="Google Analytics" nota="só quem aceitou cookies · intervalo próprio do Google">
            {ga ? (
              <>
                <Linha3 a={["Hoje", gaHoje?.utilizadores ?? 0]} b={["Últimos 7 dias", ga7]} c={["Vistas hoje", gaHoje?.vistas ?? 0]} />
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

      <EmailsCrescimento dados={cresc?.emails} />

      <EmailsEntrega cresc={cresc} />

      <div className="text-right">
        <button onClick={onRepor} disabled={estadoRepor === "a-repor"} className="text-xs font-semibold text-slate-500 underline hover:text-[color:var(--pj-danger)]">
          {estadoRepor === "a-repor" ? "A repor…" : estadoRepor === "ok" ? "Contador reposto a zero" : estadoRepor === "erro" ? "Erro — tenta de novo" : "Pôr contador de visitas a zero"}
        </button>
      </div>
    </div>
  );
}

// Notas do que publicaste ou mudaste, com o link etiquetado de cada
// publicação e o que ela trouxe: visitas, convidados, retenção e contas.
function Publicacoes({ cresc, pedir, atualizarCresc }) {
  const { txt } = usePeriodo();
  const hoje = new Date().toLocaleDateString("sv-SE");
  const [form, setForm] = useState({ dia: hoje, texto: "", campanha: "" });
  const [estado, setEstado] = useState("");
  const [copiado, setCopiado] = useState("");
  if (!cresc) return null;
  const notas = cresc.notas;
  const visitas = Object.fromEntries((cresc.metricas?.campanhas || []).map(c => [c.chave, c.n]));
  const porCampanha = Object.fromEntries((cresc.retencao?.porCampanha || []).map(c => [c.chave, c]));
  const etiquetas = [...new Set([...(notas || []).map(n => n.campanha).filter(Boolean), ...Object.keys(visitas), ...Object.keys(porCampanha)])];
  const link = (c) => `${URL_SITE}/?o=${c}`;
  const copiar = async (c) => { try { await navigator.clipboard.writeText(link(c)); setCopiado(c); setTimeout(() => setCopiado(""), 1500); } catch {} };

  async function guardar(e) {
    e.preventDefault();
    setEstado("a-guardar");
    try {
      const nota = await pedir("/api/admin-notas", { method: "POST", body: JSON.stringify({ ...form, campanha: form.campanha.trim() || undefined }) });
      atualizarCresc(c => ({ notas: [nota, ...(c.notas || [])].sort((a, b) => (a.dia < b.dia ? 1 : -1)) }));
      setForm({ dia: hoje, texto: "", campanha: "" });
      setEstado("");
    } catch (err) { setEstado(err.message); }
  }
  async function apagar(id) {
    if (!window.confirm("Apagar esta nota?")) return;
    try { await pedir(`/api/admin-notas?id=${id}`, { method: "DELETE" }); atualizarCresc(c => ({ notas: (c.notas || []).filter(n => n.id !== id) })); } catch {}
  }

  return (
    <Grupo Icone={Publicacao} titulo="Publicações e notas" nota="Regista o que publicas ou mudas. Usa um link etiquetado por publicação para saber o que cada uma trouxe.">
      {notas === null ? <EmRecolha>Precisa da migração admin_crescimento (supabase/setup.sql).</EmRecolha> : (
        <div className="grid gap-4 md:grid-cols-5">
          <Painel className="md:col-span-2" titulo="Nova nota">
            <form onSubmit={guardar} className="space-y-3">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <input type="date" value={form.dia} onChange={e => setForm({ ...form, dia: e.target.value })} className="h-10 px-2 rounded-xl border border-slate-200 bg-white text-sm" required />
                <input value={form.texto} onChange={e => setForm({ ...form, texto: e.target.value })} maxLength={140} placeholder="Reel do azeite no Instagram" className="min-w-0 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm" required />
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Etiqueta do link (opcional)</span>
                <input value={form.campanha} onChange={e => setForm({ ...form, campanha: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} maxLength={40} placeholder="ig-reel-azeite"
                  className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono" />
                <span className="text-[11px] text-slate-400">Começa por ig, tt, fb, wa ou email para contar no canal certo. Link: {link(form.campanha || "ig-exemplo")}</span>
              </label>
              <button disabled={estado === "a-guardar"} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60">
                <Plus size={14} /> {estado === "a-guardar" ? "A guardar…" : "Guardar nota"}
              </button>
              {estado && estado !== "a-guardar" && <p className="text-xs text-[color:var(--pj-danger)]">{estado}</p>}
            </form>
          </Painel>

          <Painel className="md:col-span-3" titulo="Resultado por publicação" nota={`entradas pelo link, ${txt}`}
            csv={() => [["Etiqueta", "Visitas", "Convidados", "Voltaram (1 dia)", "Contas"], ...etiquetas.map(c => [c, visitas[c] || 0, porCampanha[c]?.entraram || 0, porCampanha[c]?.d1 || 0, porCampanha[c]?.converteram || 0])]} nomeCsv="publicacoes">
            {!etiquetas.length ? <Vazio>Ainda nenhum link etiquetado trouxe visitas neste período.</Vazio> : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm tabular-nums">
                  <thead><tr className="text-xs text-slate-500">
                    <th className="text-left font-semibold pb-2 px-1">Etiqueta</th>
                    <th className="text-right font-semibold pb-2 px-1">Visitas</th>
                    <th className="text-right font-semibold pb-2 px-1">Convidados</th>
                    <th className="text-right font-semibold pb-2 px-1">Voltaram</th>
                    <th className="text-right font-semibold pb-2 px-1">Contas</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {etiquetas.map(c => (
                      <tr key={c}>
                        <td className="py-2 px-1">
                          <button onClick={() => copiar(c)} title="Copiar link" className="inline-flex items-center gap-1 font-mono text-[13px] text-slate-700 hover:text-emerald-700">
                            {c} <Copy size={11} className="text-slate-400" />{copiado === c && <span className="text-[11px] text-emerald-700 font-sans">copiado</span>}
                          </button>
                        </td>
                        <td className="py-2 px-1 text-right font-semibold text-slate-900">{num(visitas[c] || 0)}</td>
                        <td className="py-2 px-1 text-right">{num(porCampanha[c]?.entraram || 0)}</td>
                        <td className="py-2 px-1 text-right text-slate-600">{porCampanha[c]?.entraram ? `${pct(porCampanha[c].d1, porCampanha[c].entraram)}%` : "—"}</td>
                        <td className="py-2 px-1 text-right text-slate-600">{num(porCampanha[c]?.converteram || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {notas?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 mb-2">Notas</p>
                <ul className="divide-y divide-slate-100">
                  {notas.slice(0, 12).map(n => (
                    <li key={n.id} className="py-2 flex items-start gap-3 text-sm">
                      <span className="text-xs text-slate-500 tabular-nums w-12 shrink-0 pt-0.5">{rotuloDia(n.dia)}</span>
                      <span className="min-w-0 flex-1 text-slate-700">{n.texto}{n.campanha && <span className="ml-1.5 font-mono text-[11px] text-slate-400">{n.campanha}</span>}</span>
                      <button onClick={() => apagar(n.id)} aria-label="Apagar nota" className="text-slate-300 hover:text-[color:var(--pj-danger)]"><Trash2 size={14} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Painel>
        </div>
      )}
    </Grupo>
  );
}

function Utilizadores({ stats, cresc }) {
  const { txt } = usePeriodo();
  const conv = stats.entradasConvidado;
  const totalPush = (stats.pushSubscritores?.length || 0) + (stats.pushConvidados || 0);

  return (
    <div className="space-y-4">
      <Grelha4>
        <Kpi rotulo="Contas" ajuda={`${num(stats.confirmados)} com email confirmado`} valor={stats.total} />
        <Kpi rotulo="Ativas" ajuda={`fizeram login, ${txt}`} valor={stats.periodo?.ativos ?? stats.ativos7 ?? "—"} />
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

      <Contactos lista={cresc?.contactos} />

      <ListaContas stats={stats} />
    </div>
  );
}

// Quem deu o email sem criar conta: alertas de preço, folhetos e combustível.
// Quando o email foi dado dentro da app, mostra a ficha do convidado.
function Contactos({ lista }) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState(20);
  const [aberto, setAberto] = useState(null);
  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (lista || []).filter(p => !q || p.email.includes(q) || p.alertas.some(a => a.q.includes(q)));
  }, [lista, busca]);
  if (lista === undefined) return null;
  const marcos = (c) => [
    c.comparou_em && "comparou", c.escolheu_em && "escolheu loja", c.alerta_em && "ligou o sino", c.pediu_conta_em && "pediu conta", c.converteu_em && "criou conta",
  ].filter(Boolean);

  return (
    <section className="bg-white rounded-2xl border border-slate-200">
      <button onClick={() => setAberta(v => !v)} aria-expanded={aberta} className="w-full flex items-center gap-2 px-5 py-4 text-left">
        <Mail size={16} className="text-emerald-600" />
        <h2 className="font-semibold text-slate-800">Contactos sem conta</h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">{lista ? lista.length : "—"}</span>
        <span className="text-xs text-slate-400 hidden sm:inline">deram o email para alertas, lembretes, folhetos ou combustível</span>
        <ChevronDown size={18} className={`ml-auto text-slate-400 transition-transform ${aberta ? "rotate-180" : ""}`} />
      </button>
      {aberta && (!lista ? <div className="px-5 pb-5"><EmRecolha>Não foi possível ler os contactos.</EmRecolha></div> : (
        <>
          <div className="flex flex-wrap items-center gap-2 px-5 pb-3 border-b border-slate-100">
            <label className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={busca} onChange={e => { setBusca(e.target.value); setLimite(20); }} placeholder="Procurar email ou produto"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-300 focus:bg-white" />
            </label>
            <BotaoCsv nome="contactos" linhas={() => [["Email", "Desde", "Alertas", "Folhetos", "Combustível", "Origem", "Campanha", "Entrou na app", "Aberturas", "Criou conta"],
              ...filtrada.map(p => [p.email, p.desde, p.alertas.filter(a => a.ativo).map(a => a.q).join(", "), p.folhetos?.ativo ? "sim" : "", p.combustivel.filter(c => c.ativo).map(c => c.concelho).join(", "),
                p.convidado?.origem || "", p.convidado?.campanha || "", p.convidado?.primeira_em || "", p.convidado?.aberturas || "", p.convidado?.converteu_em ? "sim" : ""])]} />
          </div>
          <ul className="divide-y divide-slate-100">
            {filtrada.slice(0, limite).map(p => {
              const c = p.convidado;
              const ativos = p.alertas.filter(a => a.ativo);
              return (
                <li key={p.email} className="px-5 py-3">
                  <button onClick={() => setAberto(a => (a === p.email ? null : p.email))} aria-expanded={aberto === p.email} className="w-full text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-semibold">{p.email[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ativos.length > 0 && <Etiqueta forte>{ativos.length} {ativos.length === 1 ? "alerta" : "alertas"}: {ativos.slice(0, 3).map(a => a.q).join(", ")}{ativos.length > 3 ? "…" : ""}</Etiqueta>}
                        {p.folhetos?.ativo && <Etiqueta>Folhetos</Etiqueta>}
                        {p.lembrete?.ativo && <Etiqueta>Lembrete · {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][p.lembrete.dia - 1]}</Etiqueta>}
                        {p.combustivel.filter(x => x.ativo).map(x => <Etiqueta key={x.concelho}>Combustível · {x.concelho}</Etiqueta>)}
                        {!ativos.length && !p.folhetos?.ativo && !p.lembrete?.ativo && !p.combustivel.some(x => x.ativo) && <Etiqueta>cancelou tudo</Etiqueta>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                        Deu o email {fmtRelativo(p.desde)}
                        {c ? <>
                          <span className="text-slate-300"> · </span>veio de {NOMES_ORIGEM[c.origem] || c.origem || "origem desconhecida"}{c.campanha && <span className="font-mono"> ({c.campanha})</span>}
                          <span className="text-slate-300"> · </span>entrou {fmtRelativo(c.primeira_em)}, abriu {num(c.aberturas)}×, última {fmtRelativo(c.ultima_em)}
                          {marcos(c).length > 0 && <><span className="text-slate-300"> · </span>{marcos(c).join(", ")}</>}
                        </> : <span className="text-slate-400"> · sem ficha de convidado (deu o email numa página pública ou antes desta versão)</span>}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`mt-1 shrink-0 text-slate-400 transition-transform ${aberto === p.email ? "rotate-180" : ""}`} />
                  </button>
                  {aberto === p.email && <FichaContacto p={p} />}
                </li>
              );
            })}
            {filtrada.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Ainda ninguém deu o email sem conta.</li>}
          </ul>
          {filtrada.length > limite && (
            <button onClick={() => setLimite(l => l + 30)} className="w-full py-3 text-sm font-semibold text-emerald-700 border-t border-slate-100 hover:bg-slate-50 rounded-b-2xl">
              Mostrar mais ({filtrada.length - limite})
            </button>
          )}
        </>
      ))}
    </section>
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
        <div className="px-5 -mt-2 pb-2 text-right">
          <BotaoCsv nome="contas" linhas={() => [["Email", "Registo", "Último login", "Confirmado", "Google", "Plataforma", "App", "Push"],
            ...lista.map(u => [u.convidado ? "Convidado" : u.email, u.criado, u.ultimoAcesso || "", u.confirmado ? "sim" : "não", u.google ? "sim" : "não", u.dispositivo?.platform || "", u.dispositivo?.pwa ? "sim" : "não", comPush.has(u.email) ? "sim" : "não"])]} />
        </div>
      )}

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

/* ───────────────────────── Estado, uso e qualidade ───────────────────────── */

const fmtVital = (nome, v) => {
  if (v == null) return "—";
  if (nome === "CLS") return v.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
  return v >= 1000 ? `${(v / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })} s` : `${Math.round(v)} ms`;
};
// O Google considera uma página "boa" quando 75% das visitas ficam dentro do limite.
const corBons = (f) => (f == null ? "bg-slate-300" : f >= 0.75 ? "bg-emerald-500" : f >= 0.5 ? "bg-[#c8a26a]" : "bg-[color:var(--pj-danger)]");

// Resumo do que pode estar partido, no topo da visão geral.
function Estado({ cresc, irPara }) {
  if (!cresc) return null;
  const m = cresc.metricas;
  const lojas = cresc.saude;
  const falhas = (lojas || []).filter(l => !l.ok);
  const lcp = m?.vitais?.find(v => v.nome === "LCP");
  const taxaVazias = m?.pesquisas?.total ? m.pesquisas.vazias / m.pesquisas.total : null;
  const itens = [
    { Icone: Store, rotulo: "Preços das lojas", aba: "qualidade",
      valor: lojas?.length ? (falhas.length ? `${falhas.length} em falha` : `${lojas.length} a funcionar`) : null,
      nota: falhas.length ? falhas.map(f => f.nome).join(", ") : lojas?.length ? `verificado ${fmtRelativo(lojas[0].verificado_em)}` : "após a próxima verificação diária",
      alerta: falhas.length > 0 },
    { Icone: Gauge, rotulo: "Velocidade", aba: "qualidade",
      valor: lcp?.n ? `${Math.round(lcp.bons * 100)}% rápidas` : null,
      nota: lcp?.n ? `conteúdo principal em ${fmtVital("LCP", lcp.media)} em média` : "a recolher", alerta: lcp?.n > 0 && lcp.bons < 0.75 },
    { Icone: Bug, rotulo: "Erros no browser", aba: "qualidade",
      valor: m ? `${num(m.erros.total)} no período` : null, nota: m?.erros?.lista?.[0] ? `mais comum em ${m.erros.lista[0].pagina}` : m ? "nenhum registado" : "a recolher",
      alerta: (m?.erros?.total || 0) > 20 },
    { Icone: SearchX, rotulo: "Pesquisas sem resultado", aba: "uso",
      valor: taxaVazias != null ? `${Math.round(taxaVazias * 100)}%` : null,
      nota: m?.pesquisas?.semResultado?.[0] ? `ex.: «${m.pesquisas.semResultado[0].termo}»` : "a recolher", alerta: taxaVazias > 0.15 },
  ];
  const tarefasMal = (cresc.tarefas || []).filter(t => t.ok === false || t.atrasada);
  return (
    <>
    {tarefasMal.length > 0 && (
      <button onClick={() => irPara("qualidade")} className="w-full text-left rounded-2xl border border-[color:var(--pj-danger-border)] bg-[color:var(--pj-danger-wash)] px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[color:var(--pj-danger)]" />
        <span className="text-sm text-slate-800">
          <b>{tarefasMal.length === 1 ? "Uma tarefa automática" : `${tarefasMal.length} tarefas automáticas`} com problemas:</b>{" "}
          {tarefasMal.map(t => `${NOMES_TAREFA[t.nome] || t.nome} (${t.ok === false ? "falhou" : "atrasada"})`).join(", ")}
        </span>
      </button>
    )}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {itens.map(({ Icone, rotulo, valor, nota, alerta, aba }) => (
        <button key={rotulo} onClick={() => irPara(aba)} className={`min-w-0 text-left rounded-2xl border px-4 py-3 flex items-start gap-3 hover:bg-white ${alerta ? "border-[color:var(--pj-danger-border)] bg-[color:var(--pj-danger-wash)]" : "border-slate-200 bg-slate-50"}`}>
          <Icone size={16} className={`mt-0.5 shrink-0 ${alerta ? "text-[color:var(--pj-danger)]" : "text-emerald-600"}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">{rotulo}{alerta && <AlertTriangle size={12} className="text-[color:var(--pj-danger)]" />}</p>
            <p className="text-sm font-semibold text-slate-900">{valor ?? <span className="text-slate-400 font-medium">sem dados ainda</span>}</p>
            <p className="text-xs text-slate-500 truncate">{nota}</p>
          </div>
        </button>
      ))}
    </div>
    </>
  );
}

function Uso({ stats, cresc }) {
  const { txt } = usePeriodo();
  if (!cresc) return <Esqueleto />;
  const m = cresc.metricas;
  const r = cresc.retencao;
  const conv = stats.entradasConvidado;
  const eventos = (m?.eventos || []).filter(e => !["screen_view", "comparar_exemplo"].includes(e.chave));
  const ecras = m?.eventos?.find(e => e.chave === "screen_view");

  return (
    <div className="space-y-4">
      <Grupo Icone={MousePointerClick} titulo="Funcionalidades" nota={`O que as pessoas fazem cá dentro, nos últimos ${txt}. Conta toda a gente, sem cookies.`}>
        {!m?.eventos?.length ? <EmRecolha /> : (
          <div className="grid gap-4 md:grid-cols-5">
            <Painel className="md:col-span-3" titulo="Ações mais feitas" nota="vs. período anterior"
              csv={() => [["Ação", "Evento", "Vezes", "Período anterior"], ...eventos.map(e => [NOMES_EVENTO[e.chave] || e.chave, e.chave, e.n, e.antes])]} nomeCsv="funcionalidades">
              <ListaEventos eventos={eventos} />
            </Painel>
            <div className="md:col-span-2 space-y-4">
              <Painel titulo="Atividade por dia" nota="ações registadas">
                <Barras dados={m.eventosDia} />
              </Painel>
              {ecras?.variantes?.length > 0 && (
                <Painel titulo="Separadores mais abertos" nota={txt}>
                  <ListaBarras itens={ecras.variantes.map(v => ({ rotulo: v.detalhe, n: v.n }))} />
                </Painel>
              )}
            </div>
          </div>
        )}
      </Grupo>

      <Grupo Icone={Search} titulo="Pesquisas de produtos" nota="O que procuram no Comparar preços — e o que não encontram (o que falta cobrir).">
        {!m?.pesquisas?.total ? <EmRecolha /> : (
          <>
            <Grelha4>
              <Kpi rotulo="Pesquisas" ajuda={txt} valor={m.pesquisas.total} antes={m.pesquisas.antes} />
              <Kpi rotulo="Sem resultado" ajuda={`${num(m.pesquisas.vazias)} pesquisas`} valor={`${pct(m.pesquisas.vazias, m.pesquisas.total)}%`} />
              <Kpi rotulo="Por dia" ajuda="média" valor={Math.round(m.pesquisas.total / (cresc.dias || 7))} />
              <Kpi rotulo="Termos sem resultado" ajuda="diferentes" valor={m.pesquisas.semResultado.length} />
            </Grelha4>
            <div className="grid gap-4 md:grid-cols-2">
              <Painel titulo="Mais pesquisados" nota={txt} csv={() => [["Termo", "Pesquisas", "Sem resultado"], ...m.pesquisas.topo.map(t => [t.termo, t.n, t.vazias])]} nomeCsv="pesquisas">
                <ListaBarras itens={m.pesquisas.topo.map(t => ({ rotulo: t.termo, n: t.n, extra: t.vazias ? `${t.vazias} sem result.` : null }))} limite={8} />
              </Painel>
              <Painel titulo="Sem nenhum resultado" nota="candidatos a melhorar a pesquisa" csv={() => [["Termo", "Pesquisas"], ...m.pesquisas.semResultado.map(t => [t.termo, t.n])]} nomeCsv="pesquisas-sem-resultado">
                <ListaBarras itens={m.pesquisas.semResultado.map(t => ({ rotulo: t.termo, n: t.n }))} limite={8} />
              </Painel>
            </div>
          </>
        )}
      </Grupo>

      <Grupo Icone={Repeat} titulo="Retenção" nota="Quem entra volta? É o melhor sinal de que a app é útil. Convidados por semana de entrada.">
        {!r?.coortes?.length ? <EmRecolha>Ainda não há convidados nas últimas 8 semanas.</EmRecolha> : (
          <>
            <Grelha4>
              <Kpi rotulo="Ativos hoje" ajuda="convidados" valor={r.ativos1} />
              <Kpi rotulo="Ativos 7 dias" ajuda="convidados" valor={r.ativos7} />
              <Kpi rotulo="Ativos 30 dias" ajuda="convidados" valor={r.ativos30} />
              <Kpi rotulo="Hábito" ajuda="ativos hoje ÷ ativos 30 dias" valor={r.ativos30 ? `${pct(r.ativos1, r.ativos30)}%` : "—"} />
            </Grelha4>
            <Painel titulo="Voltaram depois de…" nota="por semana de entrada; “—” quando ainda não passou tempo suficiente"
              csv={() => [["Semana", "Entraram", "1 dia", "7 dias", "30 dias", "Conta"], ...r.coortes.map(c => [c.semana, c.entraram, c.d1, c.elegivel7 ? c.d7 : "", c.elegivel30 ? c.d30 : "", c.converteram])]} nomeCsv="retencao-semanas">
              <TabelaCoortes coortes={r.coortes} primeira="Semana de" rotulo={c => rotuloDia(c.semana)} />
            </Painel>
            <Painel titulo="O que faz voltar" nota={`quem entrou há 7+ dias (${num(r.base7 || 0)} convidados): % que ainda usava a app 7 dias depois`}
              csv={() => [["Ação", "Fizeram", "Voltaram (fizeram)", "Voltaram (não fizeram)"], ...(r.oQueFazVoltar || []).map(a => [a.rotulo, a.fizeram, a.comAcao == null ? "" : Math.round(a.comAcao * 100), a.semAcao == null ? "" : Math.round(a.semAcao * 100)])]} nomeCsv="o-que-faz-voltar">
              {r.oQueFazVoltar?.length ? <OQueFazVoltar acoes={r.oQueFazVoltar} /> : <EmRecolha>Precisa de convidados com pelo menos 7 dias.</EmRecolha>}
            </Painel>
            <Painel titulo="Funil por origem" nota={`quem entrou nos últimos ${txt}: que canal traz gente que usa a app`}
              csv={() => [["Origem", "Entraram", "Compararam", "Escolheram loja", "Deram email", "Criaram conta"], ...(r.porOrigem || []).map(c => [c.chave, c.entraram, c.comparou, c.escolheu, c.email, c.converteram])]} nomeCsv="funil-origem">
              {r.porOrigem?.some(c => c.chave !== "sem registo") ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm tabular-nums">
                    <thead><tr className="text-xs text-slate-500">
                      {["Origem", "Entraram", "Compararam", "Escolheram", "Email", "Conta"].map((h, i) => <th key={h} className={`${i ? "text-right" : "text-left"} font-semibold pb-2 px-1`}>{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {r.porOrigem.map(c => (
                        <tr key={c.chave}>
                          <td className="py-2 px-1 text-slate-700">{NOMES_ORIGEM[c.chave] || c.chave}</td>
                          <td className="py-2 px-1 text-right font-semibold text-slate-900">{num(c.entraram)}</td>
                          {[c.comparou, c.escolheu, c.email, c.converteram].map((v, i) => (
                            <td key={i} className="py-2 px-1 text-right text-slate-600">{c.entraram ? `${pct(v || 0, c.entraram)}%` : "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmRecolha>A origem dos convidados começou a ser guardada a 2 de novembro.</EmRecolha>}
            </Painel>
            <Painel titulo="Por origem" nota={`quem entrou nos últimos ${txt}, pelo sítio de onde veio da primeira vez`}
              csv={() => [["Origem", "Entraram", "1 dia", "7 dias", "30 dias", "Conta"], ...(r.porOrigem || []).map(c => [c.chave, c.entraram, c.d1, c.d7, c.d30, c.converteram])]} nomeCsv="retencao-origem">
              {r.porOrigem?.some(c => c.chave !== "sem registo") ? (
                <TabelaCoortes coortes={r.porOrigem} primeira="Origem" rotulo={c => NOMES_ORIGEM[c.chave] || c.chave} />
              ) : <EmRecolha>A origem dos convidados começa a ser guardada com esta versão.</EmRecolha>}
            </Painel>
          </>
        )}
      </Grupo>

      <Grupo Icone={MessageSquare} titulo="Opinião" nota="«Isto foi útil?» no fim da comparação da lista (uma vez a cada 14 dias por aparelho).">
        {!cresc.opiniao ? <EmRecolha>Precisa da migração tarefas_feedback.</EmRecolha> : !cresc.opiniao.total && !cresc.opiniao.comentarios.length ? <EmRecolha /> : (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2 grid grid-cols-2 gap-3 content-start">
              <Kpi rotulo="Acharam útil" ajuda={`${num(cresc.opiniao.uteis)} de ${num(cresc.opiniao.total)} respostas`} valor={cresc.opiniao.total ? `${pct(cresc.opiniao.uteis, cresc.opiniao.total)}%` : "—"} />
              <Kpi rotulo="Respostas" ajuda={txt} valor={cresc.opiniao.total} />
            </div>
            <Painel className="md:col-span-3" titulo="O que disseram" nota="últimos comentários" csv={() => [["Dia", "Útil", "Comentário"], ...cresc.opiniao.comentarios.map(c => [c.dia, c.util ? "sim" : "não", c.texto])]} nomeCsv="opiniao">
              {cresc.opiniao.comentarios.length ? (
                <ul className="divide-y divide-slate-100">
                  {cresc.opiniao.comentarios.map((c, i) => (
                    <li key={i} className="py-2 first:pt-0 last:pb-0 text-sm">
                      <span className="text-slate-800">“{c.texto}”</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{rotuloDia(c.dia)} · {c.util ? "achou útil" : "não achou útil"}</span>
                    </li>
                  ))}
                </ul>
              ) : <Vazio>Ainda sem comentários escritos.</Vazio>}
            </Painel>
          </div>
        )}
      </Grupo>

      <Grupo Icone={Route} titulo="Percurso dos convidados" nota="Do primeiro abrir até criar conta, para quem entrou nos últimos 7 dias.">
        <Painel titulo="Funil">
          {conv?.funil7?.entraram > 0 ? (
            <>
              <FunilConvidados f={conv.funil7} />
              <p className="text-xs text-slate-400 mt-3">{num(conv.aberturas)} aberturas no total. Contagem desde 1 out 2026.</p>
            </>
          ) : <Vazio>Sem entradas nos últimos 7 dias.</Vazio>}
        </Painel>
      </Grupo>
    </div>
  );
}

function ListaEventos({ eventos }) {
  const [tudo, setTudo] = useState(false);
  if (!eventos.length) return <Vazio>Sem ações registadas.</Vazio>;
  const max = Math.max(1, ...eventos.map(e => e.n));
  const visiveis = tudo ? eventos : eventos.slice(0, 10);
  return (
    <div>
      <ul className="space-y-2.5">
        {visiveis.map(e => (
          <li key={e.chave}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-slate-700" title={e.chave}>{NOMES_EVENTO[e.chave] || e.chave}</span>
              <span className="shrink-0 flex items-center gap-2 tabular-nums">
                {e.antes > 0 && <Variacao agora={e.n} antes={e.antes} />}
                <span className="font-semibold text-slate-900">{num(e.n)}</span>
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(e.n / max) * 100}%` }} />
            </div>
            {e.variantes?.length > 0 && (
              <p className="text-xs text-slate-400 mt-1 truncate">{e.variantes.map(v => `${v.detalhe} ${v.n}`).join(" · ")}</p>
            )}
          </li>
        ))}
      </ul>
      {eventos.length > 10 && (
        <button onClick={() => setTudo(v => !v)} className="mt-3 text-xs font-semibold text-emerald-700">
          {tudo ? "Mostrar menos" : `Ver todas (${eventos.length})`}
        </button>
      )}
    </div>
  );
}

// Com e sem cada ação: quanto mais volta quem a fez. Indica onde investir.
function OQueFazVoltar({ acoes }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm tabular-nums">
        <thead><tr className="text-xs text-slate-500">
          <th className="text-left font-semibold pb-2 px-1">Ação</th>
          <th className="text-right font-semibold pb-2 px-1">Fizeram</th>
          <th className="text-right font-semibold pb-2 px-1">Voltaram</th>
          <th className="text-right font-semibold pb-2 px-1">Sem a ação</th>
          <th className="text-right font-semibold pb-2 px-1">Efeito</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {acoes.map(a => {
            const efeito = a.comAcao != null && a.semAcao ? a.comAcao / a.semAcao : null;
            return (
              <tr key={a.campo}>
                <td className="py-2 px-1 text-slate-700">{a.rotulo}</td>
                <td className="py-2 px-1 text-right text-slate-600">{num(a.fizeram)}</td>
                <td className="py-2 px-1 text-right font-semibold text-slate-900">{a.comAcao == null ? "—" : `${Math.round(a.comAcao * 100)}%`}</td>
                <td className="py-2 px-1 text-right text-slate-500">{a.semAcao == null ? "—" : `${Math.round(a.semAcao * 100)}%`}</td>
                <td className="py-2 px-1 text-right">
                  {efeito == null ? <span className="text-slate-300">—</span>
                    : <span className={`inline-block rounded px-1.5 py-0.5 font-semibold ${efeito >= 1.5 ? "bg-emerald-100 text-emerald-800" : efeito >= 1 ? "text-emerald-700" : "text-[color:var(--pj-danger)]"}`}>
                        {efeito.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}×
                      </span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 mt-2">“Efeito” = quantas vezes mais volta quem fez a ação. Mostra associação, não prova causa; com poucos convidados, os números variam muito.</p>
    </div>
  );
}

function TabelaCoortes({ coortes, primeira = "Semana de", rotulo = (c) => rotuloDia(c.semana) }) {
  const celula = (n, base) => {
    if (!base) return <span className="text-slate-300">—</span>;
    const p = pct(n, base);
    return <span className={`inline-block min-w-[3rem] rounded px-1.5 py-0.5 ${p >= 30 ? "bg-emerald-100 text-emerald-800" : p >= 10 ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}>{p}%</span>;
  };
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="text-left font-semibold pb-2 px-1">{primeira}</th>
            <th className="text-right font-semibold pb-2 px-1">Entraram</th>
            <th className="text-right font-semibold pb-2 px-1">1 dia</th>
            <th className="text-right font-semibold pb-2 px-1">7 dias</th>
            <th className="text-right font-semibold pb-2 px-1">30 dias</th>
            <th className="text-right font-semibold pb-2 px-1">Conta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {coortes.map(c => (
            <tr key={c.chave || c.semana}>
              <td className="py-2 px-1 text-slate-700">{rotulo(c)}</td>
              <td className="py-2 px-1 text-right font-semibold text-slate-900">{num(c.entraram)}</td>
              <td className="py-2 px-1 text-right">{celula(c.d1, c.entraram)}</td>
              <td className="py-2 px-1 text-right">{celula(c.d7, c.elegivel7)}</td>
              <td className="py-2 px-1 text-right">{celula(c.d30, c.elegivel30)}</td>
              <td className="py-2 px-1 text-right">{celula(c.converteram, c.entraram)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailsCrescimento({ dados }) {
  const { txt } = usePeriodo();
  return (
    <Grupo Icone={Mail} titulo="Emails sem conta" nota="Quem pede o resumo de folhetos ou o preço do combustível por email: o canal que traz as pessoas de volta.">
      {!dados ? <EmRecolha>Sem dados de subscritores.</EmRecolha> : (
        <div className="grid gap-4 md:grid-cols-5">
          <Painel className="md:col-span-3" titulo="Novos por semana" nota={`últimas ${dados?.semanas?.length || 8} semanas`}
            csv={() => [["Semana", "Folhetos", "Combustível", "Cancelaram"], ...dados.semanas.map(w => [w.semana, w.folhetos, w.combustivel, w.cancelaram])]} nomeCsv="emails">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="text-left font-semibold pb-2">Semana de</th>
                  <th className="text-right font-semibold pb-2">Folhetos</th>
                  <th className="text-right font-semibold pb-2">Combustível</th>
                  <th className="text-right font-semibold pb-2">Cancelaram</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados.semanas.map(w => (
                  <tr key={w.semana}>
                    <td className="py-1.5 text-slate-700">{rotuloDia(w.semana)}</td>
                    <td className="py-1.5 text-right text-slate-900">{num(w.folhetos)}</td>
                    <td className="py-1.5 text-right text-slate-900">{num(w.combustivel)}</td>
                    <td className={`py-1.5 text-right ${w.cancelaram ? "text-[color:var(--pj-danger)]" : "text-slate-400"}`}>{num(w.cancelaram)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Painel>
          <div className="md:col-span-2 space-y-4">
            <Painel titulo="Onde subscreveram" nota={`folhetos, ${txt}`}>
              <ListaBarras itens={dados.origens} limite={5} />
            </Painel>
            <Painel titulo="Concelhos" nota="combustível, ativos">
              <ListaBarras itens={dados.concelhos} limite={5} />
            </Painel>
          </div>
        </div>
      )}
    </Grupo>
  );
}

function Qualidade({ cresc }) {
  const { txt } = usePeriodo();
  if (!cresc) return <Esqueleto />;
  const m = cresc.metricas;
  const lojas = cresc.saude;
  const comDados = m?.vitais?.some(v => v.n > 0);
  return (
    <div className="space-y-4">
      <Grupo Icone={Timer} titulo="Tarefas automáticas" nota="O que corre sozinho todos os dias: preços, emails, notificações. Vermelho = falhou; âmbar = não correu quando devia.">
        {!cresc.tarefas ? <EmRecolha>Precisa da migração tarefas_feedback.</EmRecolha> : (
          <Painel titulo="Última execução" csv={() => [["Tarefa", "Horário", "Última", "Estado", "Duração (ms)", "Falhas seguidas", "Resumo / erro"], ...cresc.tarefas.map(t => [NOMES_TAREFA[t.nome] || t.nome, t.horario, t.ultima_em || "", !t.registada ? "sem registo" : t.ok ? "ok" : "falhou", t.duracao_ms ?? "", t.falhas_seguidas ?? "", t.erro || t.resumo || ""])]} nomeCsv="tarefas">
            <ul className="divide-y divide-slate-100">
              {cresc.tarefas.map(t => (
                <li key={t.nome} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!t.registada ? "bg-slate-300" : t.ok === false ? "bg-[color:var(--pj-danger)]" : t.atrasada ? "bg-[#c8a26a]" : "bg-emerald-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{NOMES_TAREFA[t.nome] || t.nome}</p>
                    <p className="text-xs text-slate-500">{t.horario}</p>
                    {t.ok === false && t.erro && <p className="text-xs text-[color:var(--pj-danger)] break-words mt-0.5">{t.erro}</p>}
                    {t.ok !== false && t.resumo && <p className="text-[11px] text-slate-400 font-mono break-all mt-0.5 line-clamp-2">{t.resumo}</p>}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 text-right tabular-nums">
                    {!t.registada ? "ainda sem registo" : <>
                      {fmtRelativo(t.ultima_em)}{t.duracao_ms != null && <> · {t.duracao_ms >= 1000 ? `${(t.duracao_ms / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })} s` : `${t.duracao_ms} ms`}</>}
                      {t.ok === false && <><br />{t.falhas_seguidas} {t.falhas_seguidas === 1 ? "falha" : "falhas seguidas"}</>}
                      {t.atrasada && t.ok !== false && <><br />atrasada</>}
                    </>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 mt-3">Cada tarefa passa a ficar registada a partir desta versão: até à primeira execução aparece "ainda sem registo".</p>
          </Painel>
        )}
      </Grupo>

      <Custos cresc={cresc} />

      <Grupo Icone={Store} titulo="Preços das lojas" nota="Verificação diária do Comparar preços: cada loja tem de devolver produtos com preço plausível.">
        {!lojas?.length ? <EmRecolha>Aparece depois da próxima verificação diária (cron-saude-precos).</EmRecolha> : (
          <Painel titulo="Estado por loja" nota={`última verificação ${fmtRelativo(lojas[0].verificado_em)}`}>
            <ul className="divide-y divide-slate-100">
              {lojas.map(l => (
                <li key={l.loja} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${l.ok ? "bg-emerald-500" : "bg-[color:var(--pj-danger)]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{l.nome}</p>
                    {!l.ok && <p className="text-xs text-[color:var(--pj-danger)] break-words">{l.erro}</p>}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 text-right">
                    {l.ok ? "a funcionar" : `falha há ${l.falhas_seguidas} ${l.falhas_seguidas === 1 ? "dia" : "dias"}`}
                    {!l.ok && l.ultimo_ok_em && <><br />último ok {fmtRelativo(l.ultimo_ok_em)}</>}
                  </span>
                </li>
              ))}
            </ul>
          </Painel>
        )}
      </Grupo>

      <Grupo Icone={Gauge} titulo="Velocidade" nota={`Medida no telemóvel de quem usa a app, ${txt}. O Google`+" pede 75% das visitas dentro do limite — também conta para o SEO."}>
        {!comDados ? <EmRecolha /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {m.vitais.map(v => (
                <div key={v.nome} className="min-w-0 bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">{NOMES_VITAL[v.nome][0]}</p>
                  <p className="font-display text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{fmtVital(v.nome, v.media)}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full ${corBons(v.bons)}`} style={{ width: `${Math.round((v.bons || 0) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">{v.n ? `${Math.round(v.bons * 100)}% boas · ${num(v.n)}` : "sem medições"}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{NOMES_VITAL[v.nome][1]} · bom ≤ {fmtVital(v.nome, v.limite)}</p>
                </div>
              ))}
            </div>
            <Painel titulo="Páginas mais lentas" nota="conteúdo principal (LCP), média · só páginas com 3+ medições"
              csv={() => [["Página", "LCP médio (ms)", "% boas", "Medições"], ...m.paginasLentas.map(p => [p.pagina, Math.round(p.media), Math.round(p.bons * 100), p.n])]} nomeCsv="paginas-lentas">
              {m.paginasLentas.length ? (
                <ul className="divide-y divide-slate-100">
                  {m.paginasLentas.map(p => (
                    <li key={p.pagina} className="py-2 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-slate-700 truncate">{p.pagina}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className="text-xs text-slate-400 mr-2">{Math.round(p.bons * 100)}% boas · {num(p.n)}</span>
                        <span className={`font-semibold ${p.media > 2500 ? "text-[color:var(--pj-danger)]" : "text-slate-900"}`}>{fmtVital("LCP", p.media)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <Vazio>Ainda poucas medições por página.</Vazio>}
            </Painel>
          </>
        )}
      </Grupo>

      <Grupo Icone={Bug} titulo="Erros no browser" nota="Falhas de JavaScript que as pessoas apanharam, por página (sem dados pessoais). Corrigir o topo desta lista resolve a maioria.">
        {!m ? <EmRecolha /> : !m.erros.total ? (
          <Painel titulo={`Últimos ${txt}`}><Vazio>Nenhum erro registado.</Vazio></Painel>
        ) : (
          <div className="grid gap-4 md:grid-cols-5">
            <Painel className="md:col-span-2" titulo="Erros por dia">
              <Barras dados={m.erros.porDia} />
            </Painel>
            <Painel className="md:col-span-3" titulo="Mais frequentes" nota={txt} csv={() => [["Mensagem", "Página", "Vezes"], ...m.erros.lista.map(e => [e.mensagem, e.pagina, e.n])]} nomeCsv="erros">
              <ul className="divide-y divide-slate-100">
                {m.erros.lista.map((e, i) => (
                  <li key={i} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 break-words font-mono text-[13px]">{e.mensagem}</p>
                      <p className="text-xs text-slate-500">{e.pagina}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{num(e.n)}</span>
                  </li>
                ))}
              </ul>
            </Painel>
          </div>
        )}
      </Grupo>
    </div>
  );
}

const NOMES_EMAIL = {
  folhetos: "Folhetos (sem conta)", folhetos_conta: "Folhetos (com conta)", combustivel: "Combustível semanal", previsao_combustivel: "Aviso de subida do combustível",
  alerta_preco: "Alertas de preço", lembrete_compras: "Lembrete do dia das compras", admin: "Para ti (admin)", outro: "Outros",
};
const NOMES_CUSTO = { "ler-talao": "Leitura de talões", "previsao-combustiveis": "Previsão dos combustíveis" };
const usd = (v) => `${(v || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

// Entrega e leitura dos emails, por tipo (envios contados por nós; o resto vem do Resend).
function EmailsEntrega({ cresc }) {
  const { txt } = usePeriodo();
  const linhas = (cresc?.metricas?.emails || []).filter(e => e.tipo !== "admin");
  const canc = cresc?.cancelamentos || {};
  const wh = cresc?.resendWebhook;
  const taxa = (v, base) => (base ? `${pct(v || 0, base)}%` : "—");
  return (
    <Grupo Icone={Send} titulo="Emails: entrega e leitura" nota={`Por tipo de email, ${txt}. Abertos é aproximado: o Mail da Apple abre tudo sozinho.`}>
      {wh?.estado === "erro" && <EmRecolha>Não foi possível ligar as estatísticas do Resend ({wh.erro}). Tenta abrir o admin mais tarde.</EmRecolha>}
      {wh?.estado === "sem-chave" && <EmRecolha>Sem RESEND_API_KEY neste ambiente: só os envios são contados.</EmRecolha>}
      {!linhas.length && !Object.keys(canc).length ? <EmRecolha>Os envios contam a partir desta versão; entregas e aberturas chegam do Resend a partir de agora.</EmRecolha> : (
        <Painel titulo="Por tipo de email" csv={() => [["Tipo", "Enviados", "Entregues", "Abertos", "Cliques", "Devolvidos", "Queixas", "Cancelaram", "Ativos"],
          ...Object.keys({ ...Object.fromEntries(linhas.map(l => [l.tipo, 1])), ...canc }).map(t => { const l = linhas.find(x => x.tipo === t) || {}; return [NOMES_EMAIL[t] || t, l.enviado || 0, l.entregue || 0, l.aberto || 0, l.clique || 0, l.devolvido || 0, l.queixa || 0, canc[t]?.cancelaram ?? "", canc[t]?.ativos ?? ""]; })]} nomeCsv="emails-entrega">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm tabular-nums">
              <thead><tr className="text-xs text-slate-500">
                {["Tipo", "Enviados", "Entregues", "Abertos", "Cliques", "Devolvidos", "Cancelaram", "Ativos"].map((h, i) => <th key={h} className={`${i ? "text-right" : "text-left"} font-semibold pb-2 px-1 whitespace-nowrap`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys({ ...Object.fromEntries(linhas.map(l => [l.tipo, 1])), ...canc }).map(t => {
                  const l = linhas.find(x => x.tipo === t) || {};
                  const base = l.entregue || l.enviado || 0;
                  return (
                    <tr key={t}>
                      <td className="py-2 px-1 text-slate-700 whitespace-nowrap">{NOMES_EMAIL[t] || t}</td>
                      <td className="py-2 px-1 text-right font-semibold text-slate-900">{num(l.enviado || 0)}</td>
                      <td className="py-2 px-1 text-right text-slate-600">{taxa(l.entregue, l.enviado)}</td>
                      <td className="py-2 px-1 text-right text-slate-600">{taxa(l.aberto, base)}</td>
                      <td className="py-2 px-1 text-right text-slate-600">{taxa(l.clique, base)}</td>
                      <td className={`py-2 px-1 text-right ${(l.devolvido || 0) + (l.queixa || 0) ? "text-[color:var(--pj-danger)] font-semibold" : "text-slate-400"}`}>{num((l.devolvido || 0) + (l.queixa || 0))}</td>
                      <td className="py-2 px-1 text-right text-slate-600">{canc[t] ? num(canc[t].cancelaram) : "—"}</td>
                      <td className="py-2 px-1 text-right text-slate-600">{canc[t] ? num(canc[t].ativos) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">Devolvidos inclui queixas de spam. Um email devolvido de vez ou com queixa é cancelado sozinho, para não voltarmos a escrever-lhe.{wh?.estado === "ligado" && !wh.aviso && " Estatísticas do Resend ligadas (entregas, aberturas e cliques)."}{wh?.aviso && ` Aviso: ${wh.aviso}.`}</p>
        </Painel>
      )}
    </Grupo>
  );
}

// Custos do mês: o que se paga por uso (Anthropic) e a quota de emails.
function Custos({ cresc }) {
  const c = cresc?.custos;
  if (!c) return (
    <Grupo Icone={Wallet} titulo="Custos do mês"><EmRecolha>Sem dados de custos.</EmRecolha></Grupo>
  );
  const proj = (v) => (c.diaDoMes ? (v / c.diaDoMes) * c.diasMes : v);
  const usos = Object.entries(c.mes.anthropic);
  const emailsProj = Math.round(proj(c.mes.emails));
  const pctEmails = Math.min(100, Math.round((c.mes.emails / c.limiteEmails) * 100));
  return (
    <Grupo Icone={Wallet} titulo="Custos do mês" nota="Estimados a partir do uso registado pela app (contam a partir desta versão). A fatura real manda.">
      <Grelha4>
        <Kpi rotulo="Anthropic este mês" ajuda={`previsão ${usd(proj(c.mes.anthropicUsd))} no fim do mês`} valor={usd(c.mes.anthropicUsd)} />
        <Kpi rotulo="Anthropic mês passado" ajuda="estimado" valor={usd(c.mesAnterior.anthropicUsd)} />
        <Kpi rotulo="Emails este mês" ajuda={`previsão ${num(emailsProj)} · limite ${num(c.limiteEmails)}`} valor={c.mes.emails} />
        <Kpi rotulo="Emails mês passado" valor={c.mesAnterior.emails} />
      </Grelha4>
      <div className="grid gap-4 md:grid-cols-2">
        <Painel titulo="Anthropic por uso" nota="este mês">
          {usos.length ? (
            <ul className="divide-y divide-slate-100">
              {usos.map(([onde, x]) => (
                <li key={onde} className="py-2 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-700">{NOMES_CUSTO[onde] || onde}<span className="block text-xs text-slate-400">{num(x.chamadas)} {x.chamadas === 1 ? "chamada" : "chamadas"} · {usd(x.chamadas ? x.usd / x.chamadas : 0)} cada</span></span>
                  <span className="font-semibold text-slate-900 tabular-nums">{usd(x.usd)}</span>
                </li>
              ))}
            </ul>
          ) : <Vazio>Ainda sem chamadas registadas este mês.</Vazio>}
        </Painel>
        <Painel titulo="Quota de emails" nota="Resend, este mês">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${emailsProj > c.limiteEmails ? "bg-[color:var(--pj-danger)]" : "bg-emerald-500"}`} style={{ width: `${pctEmails}%` }} />
          </div>
          <p className="text-sm text-slate-700 mt-2 tabular-nums">{num(c.mes.emails)} de {num(c.limiteEmails)} ({pctEmails}%)</p>
          <p className="text-xs text-slate-500 mt-1">{emailsProj > c.limiteEmails ? `Ao ritmo atual passa o limite (${num(emailsProj)} previstos): considera subir de plano.` : `Ao ritmo atual ficas nos ${num(emailsProj)} emails.`}</p>
        </Painel>
      </div>
    </Grupo>
  );
}

// Ficha de um contacto: a cronologia do que fez, do primeiro abrir até hoje.
function FichaContacto({ p }) {
  const c = p.convidado;
  const ev = [];
  const juntar = (quando, texto) => quando && ev.push({ quando, texto });
  if (c) {
    juntar(c.primeira_em, `Entrou na app${c.origem ? ` (veio de ${NOMES_ORIGEM[c.origem] || c.origem}${c.campanha ? ` · ${c.campanha}` : ""})` : ""}`);
    juntar(c.comparou_em, "Comparou a lista pela primeira vez");
    juntar(c.escolheu_em, "Escolheu onde comprar");
    juntar(c.alerta_em, "Ligou o sino de um artigo");
    juntar(c.email_em, "Deixou o email");
    juntar(c.pediu_conta_em, "Tocou em criar conta");
    juntar(c.converteu_em, "Criou conta");
    juntar(c.ultima_em, `Última vez que abriu (${num(c.aberturas)} aberturas no total)`);
  }
  for (const a of p.alertas) {
    juntar(a.desde, `Alerta por email: ${a.q}${a.tipo === "vigiar" ? " (a vigiar)" : a.alvo ? ` abaixo de ${Number(a.alvo).toLocaleString("pt-PT", { minimumFractionDigits: 2 })} €` : ""}${a.avisos ? ` · ${a.avisos} ${a.avisos === 1 ? "aviso enviado" : "avisos enviados"}` : ""}`);
    juntar(a.cancelado, `Cancelou o alerta: ${a.q}`);
  }
  if (p.folhetos) { juntar(p.folhetos.desde, `Subscreveu os folhetos${p.folhetos.origem ? ` (${p.folhetos.origem})` : ""}`); juntar(p.folhetos.cancelado, "Cancelou os folhetos"); }
  for (const x of p.combustivel) { juntar(x.desde, `Subscreveu o combustível de ${x.concelho}`); juntar(x.cancelado, `Cancelou o combustível de ${x.concelho}`); }
  if (p.lembrete) { juntar(p.lembrete.desde, `Pediu o lembrete do dia das compras (${["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"][p.lembrete.dia - 1]}) · ${num(p.lembrete.envios || 0)} enviados`); juntar(p.lembrete.cancelado, "Cancelou o lembrete"); }
  ev.sort((a, b) => (a.quando < b.quando ? -1 : 1));
  return (
    <ol className="mt-3 ml-11 border-l-2 border-emerald-100 pl-4 space-y-2">
      {ev.map((e, i) => (
        <li key={i} className="relative text-sm">
          <span className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          <span className="text-slate-700">{e.texto}</span>
          <span className="block text-xs text-slate-400 tabular-nums">{fmtData(e.quando)}</span>
        </li>
      ))}
      {!c && <li className="text-xs text-slate-400">Sem ficha de convidado: deu o email numa página pública ou antes de 2 de novembro.</li>}
    </ol>
  );
}

/* ───────────────────────── Peças ───────────────────────── */

function Painel({ titulo, nota, acao, csv, nomeCsv, className = "", children }) {
  return (
    <section className={`min-w-0 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 ${className}`}>
      <header className="flex items-start gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800 leading-snug">{titulo}</h2>
          {nota && <p className="text-xs text-slate-400 mt-0.5">{nota}</p>}
        </div>
        {(acao || csv) && (
          <span className="ml-auto shrink-0 pt-0.5 flex items-center gap-3">
            {csv && <BotaoCsv nome={nomeCsv || titulo} linhas={csv} />}
            {acao}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

// Agrupador: cabeçalho de um conjunto de painéis sobre o mesmo assunto.
function Grupo({ Icone, titulo, nota, children }) {
  return (
    <div className="pt-3 first:pt-0">
      <div className="flex items-start gap-2.5">
        {Icone && (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Icone size={16} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-slate-800 leading-tight">{titulo}</h2>
          {nota && <p className="text-xs text-slate-500 mt-0.5">{nota}</p>}
        </div>
      </div>
      {children && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  );
}

// Medição nova, ainda sem dados: explica o que vai aparecer e porquê.
function EmRecolha({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
      <Hourglass size={15} className="text-slate-400 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-600">A recolher.</span> {children || "Esta medição é nova e enche-se à medida que as pessoas usam a app."}
      </p>
    </div>
  );
}

function Grelha4({ children }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

function Kpi({ rotulo, ajuda, valor, antes, meta }) {
  const progresso = meta && typeof valor === "number" ? Math.min(100, Math.round((valor / meta) * 100)) : null;
  return (
    <div className="min-w-0 bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500">{rotulo}</p>
      <p className="font-display text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{num(valor)}</p>
      <div className="mt-1 min-h-[1rem] flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
        {antes !== undefined && typeof valor === "number" && <Variacao agora={valor} antes={antes} />}
        {ajuda && <span>{ajuda}</span>}
      </div>
      {progresso !== null && (
        <div className="mt-2" title={`Meta: ${num(meta)}`}>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${progresso >= 100 ? "bg-emerald-500" : "bg-emerald-300"}`} style={{ width: `${progresso}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">{progresso}% da meta de {num(meta)}</p>
        </div>
      )}
    </div>
  );
}

// Descarrega uma tabela como CSV (separador ";" e BOM, para o Excel em português).
function baixarCsv(nome, linhas) {
  const cel = (v) => { const t = v == null ? "" : String(v); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const texto = "\ufeff" + linhas.map(l => l.map(cel).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `poupeja-${String(nome).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}-${new Date().toLocaleDateString("sv-SE")}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BotaoCsv({ nome, linhas }) {
  return (
    <button onClick={() => baixarCsv(nome, linhas())} title="Descarregar CSV" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-700">
      <Download size={13} /> CSV
    </button>
  );
}

// Variação face à semana anterior: só aparece quando há com que comparar.
function Variacao({ agora, antes }) {
  if (!antes) return null;
  const v = Math.round(((agora - antes) / antes) * 100);
  const [Icone, cor] = v > 0 ? [ArrowUpRight, "text-emerald-600"] : v < 0 ? [ArrowDownRight, "text-[color:var(--pj-danger)]"] : [Minus, "text-slate-400"];
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${cor}`} title="vs. período anterior">
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

// Barras por dia. As notas do admin (publicações) aparecem como um ponto
// por baixo do dia, com o texto ao passar o rato.
function Barras({ dados, alto = false, notas }) {
  const max = Math.max(1, ...dados.map(d => d.n));
  const h = alto ? 140 : 96;
  const hoje = dados.length - 1;
  const porDia = {};
  for (const n of notas || []) (porDia[n.dia] ||= []).push(n.texto);
  const temNotas = dados.some(d => porDia[d.dia]);
  return (
    <div>
      <div className={`flex items-end ${dados.length > 40 ? "gap-px" : "gap-1"}`} style={{ height: h }}>
        {dados.map((d, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end group relative" title={`${new Date(d.dia + "T12:00:00").toLocaleDateString("pt-PT")}: ${d.n}${porDia[d.dia] ? " · " + porDia[d.dia].join(" · ") : ""}`}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 tabular-nums">{d.n}</span>
            <div
              className={`w-full rounded-t ${i === hoje ? "bg-emerald-500" : "bg-emerald-200 group-hover:bg-emerald-300"}`}
              style={{ height: `${d.n === 0 ? 2 : Math.max(4, (d.n / max) * h)}px` }}
            />
          </div>
        ))}
      </div>
      {temNotas && (
        <div className={`flex ${dados.length > 40 ? "gap-px" : "gap-1"} mt-1`}>
          {dados.map((d, i) => (
            <div key={i} className="flex-1 flex justify-center" title={porDia[d.dia]?.join(" · ")}>
              {porDia[d.dia] && <span className="w-1.5 h-1.5 rounded-full bg-[#c8a26a]" />}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 tabular-nums">
        <span>{rotuloDia(dados[0]?.dia)}</span>
        <span>{rotuloDia(dados[Math.floor(dados.length / 2)]?.dia)}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}
const rotuloDia = (d) => { if (!d) return ""; const x = new Date(d + "T12:00:00"); return `${x.getDate()}/${x.getMonth() + 1}`; };

function ListaBarras({ titulo, itens, limite = 10, comparar = false }) {
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
              <span className="shrink-0 tabular-nums inline-flex items-baseline gap-2">
                {comparar && i.antes > 0 && <span className="text-xs"><Variacao agora={i.n} antes={i.antes} /></span>}
                {comparar && !i.antes && i.n > 0 && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded px-1">novo</span>}
                {i.extra && <span className="text-xs text-slate-400">{i.extra}</span>}
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
    ["Escolheram onde comprar", f.escolheu], ["Ligaram o sino", f.alerta],
    ...(f.deuEmail !== undefined ? [["Deixaram email", f.deuEmail]] : []),
    ["Tocaram em criar conta", f.pediuConta], ["Criaram conta", f.converteram],
  ];
  const etapas = compacto ? todas.filter(([r]) => ["Entraram", "Voltaram a abrir", "Compararam a lista", "Deixaram email", "Criaram conta"].includes(r)) : todas;
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

function Segmentado({ valor, onChange, opcoes, rotulo }) {
  return (
    <div className="inline-flex bg-slate-100 p-0.5 rounded-lg" role="group" aria-label={rotulo}>
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
