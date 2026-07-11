import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { Users, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Clock, Bell, Send, Smartphone, Monitor } from "lucide-react";

export default function Admin() {
  const router = useRouter();
  const [estado, setEstado] = useState("a-carregar"); // a-carregar | negado | ok | erro
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState("");
  const [sessaoEmail, setSessaoEmail] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState("registo"); // "registo" | "login"

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
    } catch {
      setErro("Falha de ligação.");
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, []);

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
            <div className="grid grid-cols-2 gap-3 mb-5">
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

            {/* Push subscritores */}
            {stats.pushSubscritores?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <Bell size={14} className="text-blue-500" />
                  <h2 className="text-sm font-black text-slate-700">Notificações push ativas</h2>
                  <span className="ml-auto text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {stats.pushSubscritores.length}
                  </span>
                </div>
                {stats.pushSubscritores.map((s, i) => (
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

            {/* Cabeçalho da lista + ordenação */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-slate-700">
                {ordenarPor === "login" ? "Por último login" : "Registos recentes"}
              </h2>
              <button
                onClick={carregar}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"
              >
                <RefreshCw size={13} /> Atualizar
              </button>
            </div>

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

            <p className="text-center text-[11px] text-slate-300 font-medium mt-4">
              Atualizado às {fmtData(stats.atualizadoEm)}
            </p>

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
