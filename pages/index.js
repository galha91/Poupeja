import React, { useState, useEffect } from "react";
import SecaoFolhetos from "../SecaoFolhetos";
import SecaoLojas from "../SecaoLojas";
import SecaoMobilidade from "../SecaoMobilidade";
import SecaoTaloes from "../SecaoTaloes";
import SecaoDefinicoes from "../SecaoDefinicoes";
import PainelAvisos from "../PainelAvisos";
import EcraAuth, { lerAuth, guardarAuth, apagarAuth } from "../EcraAuth";
import {
  Home, ShoppingCart, Store, Fuel, PiggyBank, Bell, Users,
  Receipt, Tag, Battery, Shirt, Smartphone, ChevronRight,
  Zap, ArrowRight, BarChart, Target, Coffee, ArrowLeft,
  Trophy, Star, Sparkles, TrendingUp, Plus,
} from "lucide-react";

/* ─── nav config ─── */
const NAV = [
  { id: "inicio",     label: "Início",     icon: Home },
  { id: "mercados",   label: "Mercado",    icon: ShoppingCart },
  { id: "lojas",      label: "Lojas",      icon: Store },
  { id: "mobilidade", label: "Mobilidade", icon: Fuel },
  { id: "poupanca",   label: "Poupança",   icon: PiggyBank },
];
const NAV_IDS = NAV.map(n => n.id);

const TITULOS = {
  inicio:     { t: "Olá! Bem-vindo de volta",          s: "Vamos poupar nas compras de hoje?" },
  mercados:   { t: "Supermercados",                     s: "Os folhetos da semana num só sítio" },
  lojas:      { t: "Lojas",                             s: "Moda, eletrónica e desporto com desconto" },
  mobilidade: { t: "Mobilidade",                        s: "Combustíveis e pontos de carregamento" },
  poupanca:   { t: "A tua poupança",                    s: "Quanto já poupaste este mês" },
  taloes:     { t: "Os meus talões",                    s: "Compras e garantias num só sítio" },
};

/* ─── micro components ─── */
function Chip({ children, color = "green" }) {
  const map = {
    green:  "bg-emerald-50  text-emerald-700 border-emerald-100",
    blue:   "bg-blue-50    text-blue-700   border-blue-100",
    amber:  "bg-amber-50   text-amber-700  border-amber-100",
    slate:  "bg-slate-100  text-slate-500  border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[color]}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children, icon: Icon, className = "" }) {
  return (
    <p className={`text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 ${className}`}>
      {Icon && <Icon size={12} className="text-slate-300" />}
      {children}
    </p>
  );
}

function EmptyState({ icon: Icon, titulo, sub, cta, onCta }) {
  return (
    <div className="mx-4 card p-8 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-300" />
      </div>
      <p className="text-sm font-black text-slate-500">{titulo}</p>
      <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">{sub}</p>
      {cta && (
        <button
          onClick={onCta}
          className="press mt-4 px-5 py-2.5 rounded-xl text-white text-xs font-black"
          style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

/* ─── Ecrã Início ─── */
function EcraInicio({ user, setTab }) {
  const primeiroNome = user?.nome?.split(" ")[0] || "aí";

  const FEATURES = [
    { icon: Receipt, label: "Os meus talões",   desc: "Guarda compras e garantias num só sítio", bg: "from-emerald-600 to-teal-500",  shadow: "rgba(5,150,105,0.3)",   tab: "taloes" },
    { icon: Tag,     label: "Folhetos",          desc: "Todos os supermercados comparados",       bg: "from-blue-600 to-blue-500",     shadow: "rgba(37,99,235,0.3)",   tab: "mercados" },
    { icon: Fuel,    label: "Combustíveis e EV", desc: "Preços reais e postos perto de ti",       bg: "from-orange-500 to-amber-400",  shadow: "rgba(245,158,11,0.3)",  tab: "mobilidade" },
    { icon: Store,   label: "Lojas e promoções", desc: "Moda, eletrónica e desporto",             bg: "from-violet-600 to-purple-500", shadow: "rgba(124,58,237,0.3)", tab: "lojas" },
  ];

  const SHORTCUTS = [
    { icon: Tag,        label: "Folhetos",    color: "text-blue-600",    bg: "bg-blue-50",    tab: "mercados" },
    { icon: Receipt,    label: "Talões",      color: "text-emerald-600", bg: "bg-emerald-50", tab: "taloes" },
    { icon: Shirt,      label: "Moda",        color: "text-violet-600",  bg: "bg-violet-50",  tab: "lojas" },
    { icon: Smartphone, label: "Eletrónica",  color: "text-slate-700",   bg: "bg-slate-100",  tab: "lojas" },
    { icon: Fuel,       label: "Combustíveis",color: "text-orange-600",  bg: "bg-orange-50",  tab: "mobilidade" },
    { icon: Battery,    label: "Postos EV",   color: "text-emerald-600", bg: "bg-emerald-50", tab: "mobilidade" },
  ];

  return (
    <div className="pb-28">

      {/* Hero boas-vindas */}
      <div className="px-4 pt-4 pb-2 anim-up">
        <div
          className="rounded-3xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#064e3b 0%,#059669 60%,#34d399 100%)", boxShadow: "0 20px 50px -15px rgba(5,150,105,0.45)" }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute right-8 bottom-12 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

          <div className="px-6 pt-6 pb-4 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <PiggyBank size={15} className="text-white" />
              </div>
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">O teu assistente de poupança</span>
            </div>
            <p className="text-[13px] font-semibold text-white/80">Olá, {primeiroNome}!</p>
            <p className="text-2xl font-black text-white mt-0.5 leading-snug" style={{ fontFamily: "'Sora', system-ui" }}>
              Pronto para poupar<br />nas compras de hoje?
            </p>
            <button
              onClick={() => setTab("taloes")}
              className="press mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20 transition-colors"
            >
              Guardar primeiro talão <ArrowRight size={13} />
            </button>
          </div>

          <div className="px-6 pb-5 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/50 font-semibold">Começa a usar e a tua poupança aparece aqui automaticamente.</p>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="px-4 mt-4 anim-up anim-up-1">
        <SectionLabel icon={Sparkles}>O que podes fazer</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => f.tab && setTab(f.tab)}
              className={`press bg-gradient-to-br ${f.bg} rounded-2xl p-4 text-left text-white shadow-lg`}
              style={{ boxShadow: `0 10px 25px -8px ${f.shadow}` }}
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <f.icon size={18} />
              </div>
              <p className="text-sm font-black leading-snug">{f.label}</p>
              <p className="text-[10px] text-white/70 mt-0.5 leading-relaxed">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos */}
      <div className="px-4 mt-5 anim-up anim-up-2">
        <SectionLabel icon={Zap}>Atalhos rápidos</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {SHORTCUTS.map((it, i) => (
            <button
              key={i}
              onClick={() => setTab(it.tab)}
              className="press card flex flex-col items-center gap-2 py-4 px-2"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${it.bg}`}>
                <it.icon size={19} className={it.color} />
              </div>
              <span className="text-[10px] font-black text-slate-700 text-center leading-tight">{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dica */}
      <div className="px-4 mt-5 mb-2 anim-up anim-up-3">
        <button
          onClick={() => setTab("mercados")}
          className="press w-full text-left rounded-2xl p-4 flex gap-3 items-start"
          style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1.5px solid #fde68a" }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Star size={17} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Dica do dia</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">Vê os folhetos antes de ir às compras</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Compara 5 supermercados num segundo e poupa mais.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-amber-600">
              Ver folhetos <ChevronRight size={11} />
            </span>
          </div>
        </button>
      </div>

    </div>
  );
}

/* ─── Ecrã Poupança ─── */
function SecaoPoupanca({ setTab }) {
  return (
    <div className="pb-28 pt-4">

      {/* Hero vazio */}
      <div className="px-4 mb-5 anim-up">
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#60a5fa 100%)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.4)" }}
        >
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
          <p className="text-[11px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <PiggyBank size={12} /> Total poupado este mês
          </p>
          <p className="text-5xl font-black text-white/30">€ 0</p>
          <p className="text-[12px] text-white/60 mt-2">
            Começa a guardar talões para acompanhar a tua poupança aqui.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setTab("taloes")}
              className="press inline-flex items-center gap-1.5 bg-white text-blue-700 text-xs font-black px-4 py-2 rounded-xl"
            >
              <Plus size={12} /> Guardar primeiro talão
            </button>
          </div>
        </div>
      </div>

      {/* Empty state categorias */}
      <div className="px-4 mb-5 anim-up anim-up-1">
        <SectionLabel icon={Zap}>Onde poupaste</SectionLabel>
        <EmptyState
          icon={BarChart}
          titulo="Ainda sem dados de poupança"
          sub="À medida que fores guardando talões, vês aqui o breakdown por categoria."
          cta="Guardar primeiro talão"
          onCta={() => setTab("taloes")}
        />
      </div>

      {/* Desafio bloqueado */}
      <div className="px-4 anim-up anim-up-2">
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1.5px solid #fde68a" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-sm font-black text-amber-800">Desafios mensais</p>
            <Chip color="amber">Em breve</Chip>
          </div>
          <p className="text-[12px] text-amber-700">
            Guarda talões e desbloqueia desafios de poupança com metas mensais.
          </p>
        </div>
      </div>

    </div>
  );
}

/* ─── Wrapper Mercados ─── */
function SecaoMercados() {
  return (
    <div className="pb-28 pt-4">
      <SecaoFolhetos />
    </div>
  );
}

/* ─── Root App ─── */
export default function PoupeJa() {
  const [user, setUser]           = useState(null);
  const [hydrated, setHydrated]   = useState(false);
  const [tab, setTabRaw]          = useState("inicio");
  const [dir, setDir]             = useState("right");
  const [bounce, setBounce]       = useState(null);
  const [verAvisos, setVerAvisos] = useState(false);
  const [verDefs, setVerDefs]     = useState(false);

  /* Lê auth do localStorage apenas no cliente */
  useEffect(() => {
    setUser(lerAuth());
    setHydrated(true);
  }, []);

  function handleAuth(u) {
    guardarAuth(u);
    setUser(u);
  }

  function handleLogout() {
    apagarAuth();
    setUser(null);
    setTabRaw("inicio");
    setVerDefs(false);
  }

  function go(newTab) {
    if (newTab === tab) return;
    const pi = NAV_IDS.indexOf(tab);
    const ni = NAV_IDS.indexOf(newTab);
    const d = ni === -1 ? "up" : pi === -1 ? "fade" : ni > pi ? "right" : "left";
    setDir(d);
    setTabRaw(newTab);
  }

  function navClick(id) {
    if (id === tab) return;
    setBounce(id);
    setTimeout(() => setBounce(null), 400);
    go(id);
  }

  /* Não renderiza nada até hidratar (evita flash) */
  if (!hydrated) return null;

  /* Utilizador não autenticado → ecrã de auth */
  if (!user) {
    return <EcraAuth onAuth={handleAuth} />;
  }

  const info = TITULOS[tab] || TITULOS.inicio;
  const tituloPersonalizado = tab === "inicio"
    ? { t: `Olá, ${user.nome.split(" ")[0]}!`, s: "Vamos poupar nas compras de hoje?" }
    : info;

  return (
    <>
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative select-none overflow-x-hidden">

        {verDefs ? (
          <SecaoDefinicoes
            user={user}
            onVoltar={() => { setDir("fade"); setTabRaw("inicio"); setVerDefs(false); }}
            onLogout={handleLogout}
          />
        ) : (
          <>
            {/* Header */}
            <header
              className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-10 pb-3 sticky top-0 z-30"
              style={{ boxShadow: "0 1px 12px rgba(15,23,42,0.06)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
                    <PiggyBank size={17} color="white" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-slate-900">
                    Poupe<span className="text-emerald-600">Já</span>
                  </span>
                  <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md leading-none">PT</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setVerAvisos(true)}
                    className="press w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center relative"
                  >
                    <Bell size={16} className="text-slate-500" />
                  </button>
                  <button
                    onClick={() => { setDir("up"); setVerDefs(true); setTabRaw("inicio"); }}
                    className="press w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center"
                  >
                    <Users size={16} className="text-emerald-600" />
                  </button>
                </div>
              </div>
              <div key={tab} className="mt-0.5 header-title">
                <h1 className="text-[15px] font-black text-slate-900 leading-tight">{tituloPersonalizado.t}</h1>
                <p className="text-[11px] text-slate-400 font-medium">{tituloPersonalizado.s}</p>
              </div>
            </header>

            {/* Conteúdo */}
            <main style={{ overflowX: "hidden" }}>
              <div key={tab} data-dir={dir}>
                {tab === "inicio"     && <EcraInicio user={user} setTab={go} />}
                {tab === "mercados"   && <SecaoMercados />}
                {tab === "lojas"      && <SecaoLojas />}
                {tab === "mobilidade" && <SecaoMobilidade />}
                {tab === "poupanca"   && <SecaoPoupanca setTab={go} />}
                {tab === "taloes"     && (
                  <div className="pt-4">
                    <button onClick={() => go("inicio")} className="press mx-4 mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-400">
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    <SecaoTaloes />
                  </div>
                )}
              </div>
            </main>

            {/* Bottom Nav */}
            <nav
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 z-40"
              style={{ boxShadow: "0 -4px 24px rgba(15,23,42,0.07)", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-around px-2 py-2">
                {NAV.map(it => {
                  const active = tab === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => navClick(it.id)}
                      className="flex flex-col items-center gap-1 px-3 py-2 min-w-[56px] relative"
                    >
                      <span
                        className="absolute top-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: active ? "20px" : "0px", opacity: active ? 1 : 0 }}
                      />
                      <it.icon
                        size={20}
                        className={`transition-all duration-200 ${active ? "text-emerald-600" : "text-slate-400"} ${bounce === it.id ? "nav-icon-active" : ""}`}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                      <span className={`text-[9px] font-black transition-colors duration-200 ${active ? "text-emerald-600" : "text-slate-400"}`}>
                        {it.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {verAvisos && (
          <PainelAvisos
            avisos={{ garantias: [] }}
            onFechar={() => setVerAvisos(false)}
            onAbrirTaloes={() => { setVerAvisos(false); go("taloes"); }}
          />
        )}

      </div>
    </>
  );
}
