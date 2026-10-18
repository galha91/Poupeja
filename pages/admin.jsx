import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { Users, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Clock, Bell, Send, Smartphone, Monitor, ChevronDown } from "lucide-react";

export default function Admin() {
  const router = useRouter();
  const [estado, setEstado] = useState("a-carregar"); // a-carregar | negado | ok | erro
  const [stats, setStats] = useState(null);
  const [trafego, setTrafego] = useState(null);
  const [erro, setErro] = useState("");
  const [sessaoEmail, setSessaoEmail] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState("registo"); // "registo" | "login"
  // As listas de emails ficam fechadas por omissão: só abrem quando se quer ver.
  const [verPush, setVerPush] = useState(false);
  const [verUtilizadores, setVerUtilizadores] = useState(false);
  const [aba, setAba] = useState("resumo"); // resumo | utilizadores | avisos
  const [estadoRepor, setEstadoRepor] = useState(""); // "", "a-repor", "ok", "erro"

  // Push notification state
  const [pushTitulo, setPushTitulo] = useState("🏛️ Novidade no PoupeJá");
  const [pushCorpo, setPushCorpo] = useState("Descobre os Apoios do Estado a que tens direito — subsídios, isenções e muito mais.");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushEstado, setPushEstado] = useState(""); // "", "a-enviar", "ok", "erro"
  const [pushResultado, setPushResultado] = useState(null);

  async function carregar() {
    setEstado("a-carregar");
    setErro("");
    const { data: { session } } = await supabase.auth.getSession();
    setSessaoEmail(session?.user?.email || null);
    if (!session?.access_token) {
      setEstado("negado");
      return;
    }
    try {
      const r = await fetch("/api/admin-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r.status === 403 || r.status === 401) {
        setEstado("negado");
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setErro(data.erro || "Erro a obter dados.");
        setEstado("erro");
        return;
      }
      setStats(data);
      setEstado("ok");
      // Este dispositivo é do dono: deixa de contar nas visitas e nos convidados.
      try { localStorage.setItem("poupeja_nao_contar", "1"); } catch {}
      fetch("/api/admin-trafego", { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(t => (t.ok ? t.json() : null))
        .then(setTrafego)
        .catch(() => {});
    } catch {
      setErro("Falha de ligação.");
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, []);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ title: pushTitulo, body: pushCorpo, url: pushUrl }),
      });
      const data = await r.json();
      if (!r.ok) { setPushEstado("erro"); setPushResultado(data.erro || "Erro."); return; }
      setPushEstado("ok");
      setPushResultado(`✅ Enviadas ${data.enviadas} de ${data.total} notificações.`);
    } catch {
      setPushEstado("erro");
      setPushResultado("Falha de ligação.");
    }
  }

  const fmtData = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-PT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  const fmtRelativo = (iso) => {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return "agora";
    if (mins < 60)  return `${mins}min atrás`;
    const h = Math.floor(diff / 3600000);
    if (h < 24)     return `${h}h atrás`;
    const d = Math.floor(diff / 86400000);
    if (d < 7)      return `${d}d atrás`;
    return fmtData(iso);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Head>
        <title>PoupeJá · Administração</title>
      </Head>
      <div className="max-w-2xl mx-auto px-4 py-6">

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 mb-5"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight">PoupeJá · Administração</h1>
            <p className="text-xs text-slate-400 font-medium">Painel privado · só tu vês isto</p>
          </div>
        </div>

        {estado === "a-carregar" && (
          <div className="text-center py-20 text-slate-400 text-sm font-semibold">
            A carregar…
          </div>
        )}

        {estado === "negado" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} className="text-rose-500" />
            </div>
            <p className="font-black text-slate-800">Acesso restrito</p>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Esta página é só para o administrador. Inicia sessão com a conta de administração.
            </p>

            {/* Diagnóstico: mostra a sessão atual neste domínio */}
            <div className="mt-4 mx-auto max-w-xs rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-left">
              {sessaoEmail ? (
                <>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sessão atual</p>
                  <p className="text-sm font-bold text-slate-700 break-all">{sessaoEmail}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    O acesso é só para <span className="font-bold">poupeja.portugal@gmail.com</span>.
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-500">
                  Não tens sessão iniciada <span className="font-bold">neste domínio</span>. Inicia sessão aqui primeiro.
                </p>
              )}
            </div>

            <button
              onClick={() => router.push("/")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm"
            >
              Iniciar sessão
            </button>
          </div>
        )}

        {estado === "erro" && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="font-bold text-rose-500">{erro}</p>
            <button
              onClick={carregar}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm"
            >
              <RefreshCw size={14} /> Tentar de novo
            </button>
          </div>
        )}

        {estado === "ok" && stats && (
          <>
            <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-slate-50/95 backdrop-blur mb-2">
              <div className="flex gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                {[["resumo", "Resumo"], ["utilizadores", "Utilizadores"], ["avisos", "Enviar aviso"]].map(([id, rot]) => (
                  <button
                    key={id}
                    onClick={() => setAba(id)}
                    className={`flex-1 text-xs font-black py-2 rounded-lg transition ${aba === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    {rot}
                  </button>
                ))}
                <button onClick={carregar} aria-label="Atualizar" className="px-2.5 text-slate-500">
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {aba === "resumo" && (
              <>
                <Resumo stats={stats} trafego={trafego} />
                <Trafego dados={trafego} />
                <Dispositivo onRepor={reporVisitas} estadoRepor={estadoRepor} />
              </>
            )}

            {aba === "utilizadores" && (
              <>

            {/* Destaque: total de utilizadores */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg mb-4">
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wide">
                <Users size={14} /> Utilizadores registados
              </div>
              <div className="text-5xl font-black mt-2">{stats.total}</div>
              <div className="text-emerald-100 text-sm font-medium mt-1">
                {stats.confirmados} com email confirmado{stats.convidados > 0 ? ` · ${stats.convidados} convidados por converter` : ""}
              </div>
            </div>

            {/* Cartões de períodos — novos registos */}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 px-1">Novos registos</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Cartao rotulo="Hoje" valor={stats.hoje} />
              <Cartao rotulo="7 dias" valor={stats.ultimos7} />
              <Cartao rotulo="30 dias" valor={stats.ultimos30} />
            </div>

            {/* Utilizadores ATIVOS — engagement real */}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 px-1">Ativos (fizeram login)</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Cartao rotulo="Hoje" valor={stats.ativosHoje ?? "—"} cor="text-blue-600" />
              <Cartao rotulo="7 dias" valor={stats.ativos7 ?? "—"} cor="text-blue-600" />
              <Cartao rotulo="30 dias" valor={stats.ativos30 ?? "—"} cor="text-blue-600" />
            </div>

            {/* Modo convidado do site — pessoas (browsers) que entraram sem conta */}
            {stats.entradasConvidado && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Modo convidado (site)</p>
                <p className="text-3xl font-black text-amber-600 mt-1.5">{stats.entradasConvidado.total}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  pessoas já entraram como convidado · {stats.entradasConvidado.aberturas} aberturas ·{" "}
                  {stats.entradasConvidado.converteram} criaram conta
                  {stats.entradasConvidado.total > 0 ? ` (${Math.round(stats.entradasConvidado.converteram / stats.entradasConvidado.total * 100)}%)` : ""}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  {[["Hoje", "novosHoje", "abriramHoje"], ["7 dias", "novos7", "abriram7"], ["30 dias", "novos30", "abriram30"]].map(([rot, novos, abriram]) => (
                    <div key={rot} className="bg-amber-50 rounded-xl py-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase">{rot}</div>
                      <div className="text-lg font-black text-amber-600">{stats.entradasConvidado[abriram]}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">abriram · {stats.entradasConvidado[novos]} novos</div>
                    </div>
                  ))}
                </div>
                {stats.entradasConvidado.funil7 && stats.entradasConvidado.funil7.entraram > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Percurso de quem entrou nos últimos 7 dias</p>
                    {[["Entraram", "entraram"], ["Voltaram a abrir", "voltaram"], ["Compararam a lista", "comparou"], ["Escolheram onde comprar", "escolheu"], ["Ligaram o sino", "alerta"], ["Tocaram em criar conta", "pediuConta"], ["Criaram conta", "converteram"]].map(([rot, k]) => {
                      const v = stats.entradasConvidado.funil7[k];
                      const t = stats.entradasConvidado.funil7.entraram;
                      return (
                        <div key={k} className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] text-slate-600 font-semibold w-36 flex-none">{rot}</span>
                          <div className="flex-1 bg-amber-50 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.max(v ? 3 : 0, Math.round(v / t * 100))}%` }} />
                          </div>
                          <span className="text-[11px] font-black text-slate-700 w-16 text-right flex-none">{v} · {Math.round(v / t * 100)}%</span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-slate-400 mt-1">Os passos novos (comparou, escolheu, sino, criar conta) só contam a partir de agora.</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">Contagem desde 1 out 2026. Antes disso: Google Analytics, evento login · method convidado_local.</p>
              </div>
            )}

            {/* Contas convidadas / nunca voltaram */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Cartao rotulo="Contas convidadas" valor={stats.convidados ?? 0} cor="text-amber-600" />
              <Cartao rotulo="Nunca voltaram" valor={stats.nuncaVoltaram ?? "—"} cor="text-slate-500" />
            </div>

            {/* Mini-gráfico de crescimento (14 dias) */}
            {Array.isArray(stats.crescimento) && stats.crescimento.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-3">Registos · últimos 14 dias</p>
                <Grafico dados={stats.crescimento} />
              </div>
            )}

            {/* Funil de conversão */}
            {stats.funil && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-3">Funil de conversão</p>
                <Funil funil={stats.funil} />
              </div>
            )}

            {/* Listas partilhadas + Email */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Listas partilhadas</p>
                <p className="text-3xl font-black text-pink-600 mt-1.5">{stats.listasPartilhadas ?? 0}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {stats.listasAtivas7 ?? 0} ativas nos últimos 7 dias
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Email semanal</p>
                <p className="text-3xl font-black text-emerald-600 mt-1.5">{stats.emailAtivos ?? stats.confirmados}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  recebem · {stats.emailDesativado ?? 0} desativaram
                </p>
              </div>
            </div>

            {/* Plataformas e PWA */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">Plataforma</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1.5">🍎 <span className="text-slate-600 font-bold">iOS</span></span>
                    <span className="text-sm font-black text-slate-800">{stats.porPlataforma?.ios ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1.5">🤖 <span className="text-slate-600 font-bold">Android</span></span>
                    <span className="text-sm font-black text-slate-800">{stats.porPlataforma?.android ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1.5">💻 <span className="text-slate-600 font-bold">Desktop</span></span>
                    <span className="text-sm font-black text-slate-800">{stats.porPlataforma?.desktop ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">App instalada</p>
                <div>
                  <p className="text-4xl font-black text-violet-600 mt-2">{stats.totalPwa ?? 0}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {stats.total > 0 ? `${Math.round(((stats.totalPwa ?? 0) / stats.total) * 100)}% dos utilizadores` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Método de login — adoção do "Continuar com Google" */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">Método de login (contas registadas)</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5">🔵 <span className="text-slate-600 font-bold">Google</span></span>
                  <span className="text-sm font-black text-slate-800">{stats.porMetodo?.google ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5">✉️ <span className="text-slate-600 font-bold">Email / password</span></span>
                  <span className="text-sm font-black text-slate-800">{stats.porMetodo?.email ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Push subscritores */}
            {(stats.pushSubscritores?.length > 0 || stats.pushConvidados > 0) && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
                <button
                  onClick={() => setVerPush(v => !v)}
                  aria-expanded={verPush}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left ${verPush ? "border-b border-slate-100" : ""}`}
                >
                  <Bell size={14} className="text-blue-500" />
                  <h2 className="text-sm font-black text-slate-700">Notificações push ativas</h2>
                  <span className="ml-auto text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {stats.pushSubscritores.length + (stats.pushConvidados || 0)}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${verPush ? "rotate-180" : ""}`} />
                </button>
                {verPush && stats.pushConvidados > 0 && (
                  <p className="px-4 py-2.5 border-b border-slate-50 text-sm font-bold text-slate-700">
                    {stats.pushConvidados} sem conta <span className="font-normal text-slate-400">(só avisos gerais)</span>
                  </p>
                )}
                {verPush && stats.pushSubscritores.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-blue-500">
                        {(s.email || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 truncate flex-1">{s.email}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de utilizadores — fechada por omissão */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setVerUtilizadores(v => !v)}
                aria-expanded={verUtilizadores}
                className="inline-flex items-center gap-1.5 text-sm font-black text-slate-700"
              >
                {verUtilizadores ? (ordenarPor === "login" ? "Por último login" : "Registos recentes") : `Ver utilizadores (${stats.recentes.length})`}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${verUtilizadores ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={carregar}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"
              >
                <RefreshCw size={13} /> Atualizar
              </button>
            </div>

            {verUtilizadores && (<>
            {/* Toggle ordenar por registo / último login */}
            <div className="flex gap-1.5 mb-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setOrdenarPor("registo")}
                className={`flex-1 text-xs font-black py-1.5 rounded-lg transition ${ordenarPor === "registo" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
              >
                Registo
              </button>
              <button
                onClick={() => setOrdenarPor("login")}
                className={`flex-1 text-xs font-black py-1.5 rounded-lg transition ${ordenarPor === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
              >
                Último login
              </button>
            </div>

            {/* Lista de recentes */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
              {[...stats.recentes]
                .sort((a, b) => {
                  if (ordenarPor === "login") {
                    // Nunca fez login fica no fundo
                    const ta = a.ultimoAcesso ? new Date(a.ultimoAcesso).getTime() : 0;
                    const tb = b.ultimoAcesso ? new Date(b.ultimoAcesso).getTime() : 0;
                    return tb - ta;
                  }
                  return new Date(b.criado) - new Date(a.criado);
                })
                .map((u, i) => {
                const plataforma = u.dispositivo?.platform;
                const temPwa    = u.dispositivo?.pwa;
                const relativo  = fmtRelativo(u.ultimoAcesso);
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${u.convidado ? "bg-amber-50" : "bg-slate-100"}`}>
                        <span className={`text-xs font-black ${u.convidado ? "text-amber-500" : "text-slate-500"}`}>
                          {u.convidado ? "👤" : (u.email || "?")[0].toUpperCase()}
                        </span>
                      </div>

                      {/* Info principal */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 truncate">{u.convidado ? "Convidado" : u.email}</p>
                          {u.convidado && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full shrink-0">
                              CONVIDADO
                            </span>
                          )}
                          {u.google && (
                            <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full shrink-0">
                              GOOGLE
                            </span>
                          )}
                          {u.confirmado && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={9} /> Registo: {fmtData(u.criado)}
                          </span>
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${u.ultimoAcesso ? "text-emerald-600" : "text-slate-300"}`}>
                            👁 Último login: {u.ultimoAcesso ? `${fmtData(u.ultimoAcesso)} · ${relativo}` : "nunca"}
                          </span>
                        </div>
                      </div>

                      {/* Badges plataforma + PWA */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {plataforma === "ios"     && <span className="text-base" title="iOS">🍎</span>}
                        {plataforma === "android" && <span className="text-base" title="Android">🤖</span>}
                        {plataforma === "desktop" && <span className="text-base" title="Desktop">💻</span>}
                        {temPwa && (
                          <span className="text-[9px] font-black bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
                            APP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.recentes.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">
                  Ainda não há registos.
                </div>
              )}
            </div>
            </>)}

              </>
            )}

            {aba === "avisos" && (
              <>
            {/* Enviar notificação push */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mt-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Enviar notificação push</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Envia para todos os utilizadores com notificações ativas</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Título</label>
                  <input
                    type="text"
                    value={pushTitulo}
                    onChange={e => setPushTitulo(e.target.value)}
                    maxLength={80}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Mensagem</label>
                  <textarea
                    value={pushCorpo}
                    onChange={e => setPushCorpo(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Link (ex: /apoios ou /)</label>
                  <input
                    type="text"
                    value={pushUrl}
                    onChange={e => setPushUrl(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                  />
                </div>

                <button
                  onClick={enviarPush}
                  disabled={pushEstado === "a-enviar" || !pushTitulo.trim() || !pushCorpo.trim()}
                  className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-black text-sm disabled:opacity-50"
                >
                  {pushEstado === "a-enviar"
                    ? <><RefreshCw size={14} className="animate-spin" /> A enviar…</>
                    : <><Send size={14} /> Enviar a todos</>
                  }
                </button>

                {pushResultado && (
                  <p className={`text-sm font-bold text-center rounded-xl px-4 py-2.5 ${pushEstado === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                    {pushResultado}
                  </p>
                )}
              </div>
            </div>
              </>
            )}

            <p className="text-center text-[11px] text-slate-300 font-medium mt-4">
              Atualizado às {fmtData(stats.atualizadoEm)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Cartao({ rotulo, valor, cor = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className={`text-2xl font-black ${cor}`}>{valor}</div>
      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{rotulo}</div>
    </div>
  );
}

function Grafico({ dados }) {
  const max = Math.max(1, ...dados.map(d => d.n));
  const total = dados.reduce((s, d) => s + d.n, 0);
  return (
    <>
      <div className="flex items-end justify-between gap-1 h-24">
        {dados.map((d, i) => {
          const altura = d.n === 0 ? 4 : Math.max(8, (d.n / max) * 96);
          const dia = new Date(d.dia);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
              <span className="text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition">{d.n}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-emerald-400 to-emerald-500"
                style={{ height: `${altura}px` }}
                title={`${d.dia}: ${d.n} registos`}
              />
              <span className="text-[8px] text-slate-300 font-bold">{dia.getDate()}/{dia.getMonth() + 1}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 font-medium mt-2 text-center">{total} registos em 14 dias</p>
    </>
  );
}

function Funil({ funil }) {
  const etapas = [
    { rotulo: "Registou", valor: funil.registou, cor: "bg-slate-400" },
    { rotulo: "Confirmou email", valor: funil.confirmou, cor: "bg-emerald-500" },
    { rotulo: "Instalou app", valor: funil.instalou, cor: "bg-violet-500" },
    { rotulo: "Ativou notificações", valor: funil.ativouPush, cor: "bg-blue-500" },
  ];
  const base = Math.max(1, funil.registou);
  return (
    <div className="flex flex-col gap-2">
      {etapas.map((e, i) => {
        const pct = Math.min(100, Math.round((e.valor / base) * 100)); // nunca passa dos 100%
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="font-bold text-slate-600">{e.rotulo}</span>
              <span className="font-black text-slate-800">{e.valor} <span className="text-slate-400 font-medium">({pct}%)</span></span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${e.cor} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const NOMES_MODO = { "app-android": "App Android", pwa: "App instalada (PWA)", browser: "Browser" };
const NOMES_ORIGEM = {
  direto: "Direto / app", google: "Google", pesquisa: "Outros motores", facebook: "Facebook",
  instagram: "Instagram", tiktok: "TikTok", whatsapp: "WhatsApp", outro: "Outros sites", interno: "Navegação interna",
};

function Lista({ titulo, itens }) {
  if (!itens?.length) return null;
  const max = Math.max(1, ...itens.map(i => i.n));
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">{titulo}</p>
      <div className="flex flex-col gap-1.5">
        {itens.map((i, k) => (
          <div key={k}>
            <div className="flex justify-between gap-2 text-[11px]">
              <span className="font-bold text-slate-600 truncate">{i.rotulo}</span>
              <span className="font-black text-slate-800 shrink-0">{i.n}{i.extra ? <span className="text-slate-400 font-medium"> {i.extra}</span> : null}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round((i.n / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Barras({ dados, cor = "from-sky-400 to-sky-500", legenda }) {
  const max = Math.max(1, ...dados.map(d => d.n));
  return (
    <>
      <div className="flex items-end justify-between gap-1 h-20">
        {dados.map((d, i) => {
          const dia = new Date(d.dia + "T12:00:00");
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${d.dia}: ${d.n}`}>
              <span className="text-[8px] font-black text-slate-400">{d.n || ""}</span>
              <div className={`w-full rounded-t-md bg-gradient-to-t ${cor}`} style={{ height: `${d.n === 0 ? 3 : Math.max(6, (d.n / max) * 64)}px` }} />
              <span className="text-[8px] text-slate-300 font-bold">{dia.getDate()}/{dia.getMonth() + 1}</span>
            </div>
          );
        })}
      </div>
      {legenda && <p className="text-[11px] text-slate-400 font-medium mt-2 text-center">{legenda}</p>}
    </>
  );
}

function Trafego({ dados }) {
  if (!dados) {
    return <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-sm text-slate-400 font-medium">A carregar visitas…</div>;
  }
  const { proprio: p, google: g } = dados;
  const ga = g?.ga;
  const sc = g?.sc;
  const gaHoje = ga?.dias?.at(-1);
  const ga7 = (ga?.dias || []).slice(-7).reduce((s, d) => s + d.utilizadores, 0);
  const scCliques = (sc?.dias || []).reduce((s, d) => s + d.cliques, 0);
  const scImpr = (sc?.dias || []).reduce((s, d) => s + d.impressoes, 0);

  return (
    <>
      <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg mb-3">
        <div className="text-sky-100 text-xs font-bold uppercase tracking-wide">Visitantes hoje · contador próprio</div>
        <div className="text-5xl font-black mt-2">{p.hoje.visitantes}</div>
        <div className="text-sky-100 text-sm font-medium mt-1">
          {p.hoje.vistas} páginas vistas hoje · {p.sete.visitantes} visitantes-dia e {p.sete.vistas} vistas em 7 dias
        </div>
        <div className="text-sky-200 text-[11px] mt-2">Conta toda a gente (aceite ou não os cookies), sem bots. A contar desde {p.desdeDia}.</div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">Visitantes por dia (14 dias)</p>
        <Barras dados={p.serie.map(s => ({ dia: s.dia, n: s.visitantes }))} legenda={`${p.trinta.vistas} páginas vistas em 30 dias`} />
      </div>

      <Lista titulo="De onde vêm (7 dias, páginas vistas)" itens={p.origens.filter(o => o.origem !== "interno").map(o => ({ rotulo: NOMES_ORIGEM[o.origem] || o.origem, n: o.n }))} />
      <Lista titulo="Distrito (7 dias, visitantes-dia · aproximado pelo IP)" itens={(p.perfil?.regiao || []).map(o => ({ rotulo: o.valor, n: o.n }))} />
      <Lista titulo="Aparelho (7 dias, visitantes-dia)" itens={(p.perfil?.dispositivo || []).map(o => ({ rotulo: o.valor, n: o.n }))} />
      <Lista titulo="Como usam (7 dias, visitantes-dia)" itens={(p.perfil?.modo || []).map(o => ({ rotulo: NOMES_MODO[o.valor] || o.valor, n: o.n }))} />
      <Lista titulo="Novos e recorrentes (7 dias, visitantes-dia)" itens={(p.perfil?.recorrencia || []).map(o => ({ rotulo: o.valor === "novo" ? "Primeira visita" : "Já cá tinham vindo", n: o.n }))} />
      <Lista titulo="Páginas mais vistas (7 dias)" itens={p.paginas.map(o => ({ rotulo: o.caminho === "/" ? "/ (app)" : o.caminho, n: o.n }))} />

      {!ga && !sc && !g?.gaErro && !g?.scErro ? (
        <p className="text-[11px] text-slate-400 font-medium px-1 mt-2 mb-3">Google Analytics e Search Console ainda não estão ligados ao admin.</p>
      ) : (<>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 px-1 mt-4">Google Analytics</p>
      {ga ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Cartao rotulo="Hoje" valor={gaHoje?.utilizadores ?? 0} cor="text-orange-600" />
            <Cartao rotulo="7 dias" valor={ga7} cor="text-orange-600" />
            <Cartao rotulo="Vistas hoje" valor={gaHoje?.vistas ?? 0} cor="text-orange-600" />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
            <Barras dados={ga.dias.map(d => ({ dia: d.dia, n: d.utilizadores }))} cor="from-orange-400 to-orange-500" legenda="Utilizadores por dia (só quem aceitou cookies)" />
          </div>
          <Lista titulo="Canais GA (7 dias, sessões)" itens={ga.canais.map(c => ({ rotulo: c.canal, n: c.sessoes }))} />
        </>
      ) : (
        <SemGoogle erro={g?.gaErro} nome="Google Analytics" />
      )}

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 px-1 mt-4">Google Search Console (28 dias)</p>
      {sc ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Cartao rotulo="Cliques do Google" valor={scCliques} cor="text-emerald-600" />
            <Cartao rotulo="Vezes que apareceu" valor={scImpr} cor="text-emerald-600" />
          </div>
          <Lista titulo="O que as pessoas pesquisaram" itens={sc.pesquisas.map(q => ({ rotulo: q.texto, n: q.impressoes, extra: `· ${q.cliques} cliques · pos. ${q.posicao}` }))} />
          <Lista titulo="Páginas no Google" itens={sc.paginas.map(q => ({ rotulo: q.caminho, n: q.impressoes, extra: `· ${q.cliques} cliques` }))} />
        </>
      ) : (
        <SemGoogle erro={g?.scErro} nome="Search Console" />
      )}
      </>)}
      <div className="h-2" />
    </>
  );
}

function SemGoogle({ erro, nome }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3 text-[12px] text-slate-500 font-medium">
      {erro ? `${nome}: erro a ler (${erro}). Confirma o acesso da conta de serviço.` : `${nome} ainda não está ligado ao admin.`}
    </div>
  );
}

// Variação face à semana anterior: só aparece quando há com que comparar.
function Variacao({ agora, antes }) {
  if (!antes) return <span className="text-[10px] text-slate-300 font-bold">ainda sem semana passada</span>;
  const pct = Math.round(((agora - antes) / antes) * 100);
  const cor = pct > 0 ? "text-emerald-600" : pct < 0 ? "text-rose-500" : "text-slate-400";
  return <span className={`text-[10px] font-black ${cor}`}>{pct > 0 ? "▲" : pct < 0 ? "▼" : "="} {Math.abs(pct)}% vs semana passada</span>;
}

function Resumo({ stats, trafego }) {
  const p = trafego?.proprio;
  const conv = stats.entradasConvidado;
  const itens = [
    { rotulo: "Visitantes", ajuda: "soma diária, 7 dias", valor: p ? p.sete.visitantes : "…", antes: p?.anteriores7, cor: "text-sky-600" },
    { rotulo: "Novos na app", ajuda: "convidados, 7 dias", valor: conv?.novos7 ?? "—", antes: conv?.novosAnteriores7, cor: "text-amber-600" },
    { rotulo: "Contas novas", ajuda: "7 dias", valor: stats.ultimos7, antes: stats.anteriores7, cor: "text-emerald-600" },
    { rotulo: "Emails", ajuda: "folhetos + combustível", valor: (stats.subFolhetos ?? 0) + (stats.subCombustivel ?? 0), cor: "text-violet-600",
      nota: `${stats.subFolhetos ?? 0} folhetos · ${stats.subCombustivel ?? 0} combustível` },
  ];
  return (
    <>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5 px-1">Esta semana</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {itens.map(i => (
          <div key={i.rotulo} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-black text-slate-500">{i.rotulo}</div>
            <div className={`text-3xl font-black mt-1 ${i.cor}`}>{i.valor}</div>
            <div className="text-[10px] text-slate-400 font-medium">{i.ajuda}</div>
            <div className="mt-1">{i.nota ? <span className="text-[10px] text-slate-500 font-bold">{i.nota}</span> : <Variacao agora={typeof i.valor === "number" ? i.valor : 0} antes={i.antes} />}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Dispositivo({ onRepor, estadoRepor }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3 text-[12px] text-slate-500 font-medium">
      <p><span className="font-black text-emerald-600">✓ Este dispositivo não conta</span> nas visitas nem nos convidados. As tuas contas também ficam de fora das estatísticas.</p>
      <button onClick={onRepor} disabled={estadoRepor === "a-repor"} className="mt-2 text-[12px] font-black text-rose-500 underline">
        {estadoRepor === "a-repor" ? "A repor…" : estadoRepor === "ok" ? "Contador reposto a zero ✓" : estadoRepor === "erro" ? "Erro — tenta de novo" : "Pôr contador de visitas a zero"}
      </button>
    </div>
  );
}
