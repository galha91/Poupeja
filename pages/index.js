import React, { useState } from "react";
import SecaoFolhetos from "../SecaoFolhetos";
import SecaoLojas from "../SecaoLojas";
import SecaoMobilidade from "../SecaoMobilidade";
import SecaoTaloes from "../SecaoTaloes";
import SecaoDefinicoes from "../SecaoDefinicoes";
import PainelAvisos from "../PainelAvisos";
import {
  Home, ShoppingCart, Store, Fuel, PiggyBank, Bell, Users,
  Receipt, Tag, Battery, Shirt, Smartphone, ChevronRight,
  Zap, ArrowRight, BarChart, Target, Coffee, ShieldCheck,
  Trophy, X, ArrowLeft, TrendingUp, TrendingDown, Sparkles,
  Wallet, Star, CheckCircle
} from "lucide-react";

/* ─── constants ─── */
const SUPER_CORES = {
  Continente: "#e63329", "Pingo Doce": "#009a3e",
  Lidl: "#0050aa", Aldi: "#1a3b6f", "Intermarché": "#e2001a",
};

const NAV = [
  { id: "inicio",     label: "Início",     icon: Home },
  { id: "mercados",   label: "Mercado",    icon: ShoppingCart },
  { id: "lojas",      label: "Lojas",      icon: Store },
  { id: "mobilidade", label: "Mobilidade", icon: Fuel },
  { id: "poupanca",   label: "Poupança",   icon: PiggyBank },
];

const GARANTIAS = [
  { id: 1, produto: "Máquina de Lavar Bosch",  data: "2024-07-15", anos: 2 },
  { id: 2, produto: "Telemóvel Samsung A55",   data: "2025-11-20", anos: 2 },
  { id: 3, produto: "Aspirador Dyson",          data: "2026-03-10", anos: 2 },
];

function garantiasAAcabar(dias) {
  const limite = dias || 60;
  const hoje = new Date();
  return GARANTIAS.map(g => {
    const fim = new Date(g.data);
    fim.setFullYear(fim.getFullYear() + g.anos);
    const restam = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    return { produto: g.produto, restam };
  }).filter(g => g.restam >= 0 && g.restam <= limite);
}

/* ─── micro components ─── */
function Chip({ children, color = "green" }) {
  const map = {
    green:  "bg-emerald-50  text-emerald-700 border-emerald-100",
    blue:   "bg-blue-50    text-blue-700   border-blue-100",
    amber:  "bg-amber-50   text-amber-700  border-amber-100",
    red:    "bg-red-50     text-red-700    border-red-100",
    slate:  "bg-slate-100  text-slate-500  border-slate-200",
    purple: "bg-purple-50  text-purple-700 border-purple-100",
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

/* ─── Ecrã Início ─── */
function EcraInicio({ setTab }) {
  const total = 117;
  const avisosGarantia = garantiasAAcabar(60);
  const [verAviso, setVerAviso] = useState(true);

  const FEATURES = [
    {
      icon: Receipt, label: "Os meus talões",
      desc: "Compras e garantias num só sítio",
      bg: "from-emerald-600 to-teal-500",
      shadow: "rgba(5,150,105,0.3)", tab: "taloes",
    },
    {
      icon: Tag, label: "Folhetos da semana",
      desc: "Todos os supermercados comparados",
      bg: "from-blue-600 to-blue-500",
      shadow: "rgba(37,99,235,0.3)", tab: "mercados",
    },
    {
      icon: Fuel, label: "Combustíveis e EV",
      desc: "Preços reais e postos perto de ti",
      bg: "from-orange-500 to-amber-400",
      shadow: "rgba(245,158,11,0.3)", tab: "mobilidade",
    },
    {
      icon: Store, label: "Lojas e promoções",
      desc: "Moda, eletrónica e desporto",
      bg: "from-violet-600 to-purple-500",
      shadow: "rgba(124,58,237,0.3)", tab: "lojas",
    },
  ];

  const SHORTCUTS = [
    { icon: Tag,         label: "Folhetos",     color: "text-blue-600",    bg: "bg-blue-50",    tab: "mercados" },
    { icon: Receipt,     label: "Talões",        color: "text-emerald-600", bg: "bg-emerald-50", tab: "taloes" },
    { icon: Shirt,       label: "Moda",          color: "text-violet-600",  bg: "bg-violet-50",  tab: "lojas" },
    { icon: Smartphone,  label: "Eletrónica",    color: "text-slate-700",   bg: "bg-slate-100",  tab: "lojas" },
    { icon: Fuel,        label: "Combustíveis",  color: "text-orange-600",  bg: "bg-orange-50",  tab: "mobilidade" },
    { icon: Battery,     label: "Postos EV",     color: "text-emerald-600", bg: "bg-emerald-50", tab: "mobilidade" },
  ];

  return (
    <div className="pb-28">

      {/* ── Aviso garantia ── */}
      {verAviso && avisosGarantia.length > 0 && (
        <div className="px-4 pt-4 anim-up">
          <button
            onClick={() => setTab("taloes")}
            className="press w-full text-left rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#92400e,#d97706)", boxShadow: "0 8px 24px -8px rgba(217,119,6,0.45)" }}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={19} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Garantia a terminar</p>
              <p className="text-sm font-black text-white leading-snug mt-0.5">{avisosGarantia[0].produto}</p>
              <p className="text-[11px] text-white/75 mt-0.5">
                {avisosGarantia[0].restam === 0 ? "Termina hoje" : `Termina em ${avisosGarantia[0].restam} dias`}
                {avisosGarantia.length > 1 && ` · +${avisosGarantia.length - 1} a acabar`}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setVerAviso(false); }}
              className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"
            >
              <X size={14} className="text-white" />
            </button>
          </button>
        </div>
      )}

      {/* ── Hero poupança ── */}
      <div className="px-4 pt-4 pb-2 anim-up">
        <div className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#064e3b 0%,#059669 60%,#34d399 100%)", boxShadow: "0 20px 50px -15px rgba(5,150,105,0.45)" }}>
          {/* deco circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute right-8 bottom-12 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

          <div className="px-6 pt-6 pb-2 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <PiggyBank size={15} className="text-white" />
              </div>
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Poupança de junho</span>
            </div>
            <p className="text-[13px] font-semibold text-white/80">Este mês já poupaste</p>
            <p className="text-5xl font-black text-white mt-1 leading-none">
              € {total}
              <span className="text-2xl text-emerald-300 ml-1">.00</span>
            </p>
            <button
              onClick={() => setTab("poupanca")}
              className="press mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20 transition-colors"
            >
              Ver detalhes <ArrowRight size={13} />
            </button>
          </div>

          {/* stats strip */}
          <div className="mt-4 px-6 pb-5 pt-3 grid grid-cols-3 gap-0 border-t border-white/10">
            {[
              { label: "Supermercado", value: "€ 47", icon: ShoppingCart },
              { label: "Combustível",  value: "€ 23", icon: Fuel },
              { label: "Lojas",        value: "€ 47", icon: Store },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-0.5">
                <s.icon size={13} className="text-white/50 mb-0.5" />
                <p className="text-base font-black text-white">{s.value}</p>
                <p className="text-[9px] text-white/55 leading-none">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features grid ── */}
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

      {/* ── Atalhos rápidos ── */}
      <div className="px-4 mt-5 anim-up anim-up-2">
        <SectionLabel icon={Zap}>Atalhos rápidos</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {SHORTCUTS.map((it, i) => (
            <button
              key={i}
              onClick={() => setTab(it.tab)}
              className="press card flex flex-col items-center gap-2 py-4 px-2"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${it.bg}`}>
                <it.icon size={20} className={it.color} />
              </div>
              <span className="text-[10px] font-black text-slate-700 text-center leading-tight">{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Dica do dia ── */}
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
function SecaoPoupanca() {
  const total = 117;
  const historico = [
    { mes: "Mar", valor: 98 },
    { mes: "Abr", valor: 112 },
    { mes: "Mai", valor: 89 },
    { mes: "Jun", valor: total },
  ];
  const maxH = Math.max(...historico.map(h => h.valor));

  const categorias = [
    { label: "Supermercado", valor: 47,  icon: ShoppingCart, cor: "bg-blue-500",    pct: 40 },
    { label: "Combustível",  valor: 23,  icon: Fuel,          cor: "bg-orange-400",  pct: 20 },
    { label: "Eletricidade", valor: 12,  icon: Battery,       cor: "bg-yellow-400",  pct: 10 },
    { label: "Refeições",    valor: 35,  icon: Coffee,        cor: "bg-amber-500",   pct: 30 },
  ];

  return (
    <div className="pb-28 pt-4">

      {/* Hero */}
      <div className="px-4 mb-4 anim-up">
        <div className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#60a5fa 100%)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.4)" }}>
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />

          <div className="px-6 pt-6 pb-2 relative z-10">
            <p className="text-[11px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <PiggyBank size={12} /> Total poupado este mês
            </p>
            <p className="text-5xl font-black text-white mt-1">
              € {total}<span className="text-2xl text-blue-300">.00</span>
            </p>
            <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
              <TrendingUp size={11} /> +€15 face ao mês anterior
            </p>
            <div className="flex gap-2 mt-4">
              <button className="press inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-black px-3 py-2 rounded-xl border border-white/20">
                <BarChart size={11} /> Relatório
              </button>
              <button className="press inline-flex items-center gap-1.5 bg-white text-blue-700 text-xs font-black px-3 py-2 rounded-xl">
                <Target size={11} /> Objetivos
              </button>
            </div>
          </div>

          {/* mini bar chart */}
          <div className="px-6 py-4 mt-2 border-t border-white/10">
            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3">Histórico</p>
            <div className="flex items-end gap-2" style={{ height: 44 }}>
              {historico.map((h, i) => (
                <div key={h.mes} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(h.valor / maxH) * 36}px`,
                      background: i === historico.length - 1 ? "#fff" : "rgba(255,255,255,0.3)",
                    }}
                  />
                  <p className="text-[8px] text-white/50">{h.mes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="px-4 mb-4 anim-up anim-up-1">
        <SectionLabel icon={Zap}>Onde poupaste</SectionLabel>
        <div className="flex flex-col gap-2.5">
          {categorias.map((c, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <c.icon size={18} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-black text-slate-800">{c.label}</p>
                    <p className="text-sm font-black text-emerald-600">€ {c.valor}</p>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.cor} rounded-full`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desafio */}
      <div className="px-4 mb-2 anim-up anim-up-2">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1.5px solid #fde68a" }}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-sm font-black text-amber-800">Desafio de Junho</p>
            <Chip color="amber">Em curso</Chip>
          </div>
          <p className="text-[12px] text-amber-700 mb-3">Usa os folhetos da semana e chega aos € 100 poupados.</p>
          <div className="flex justify-between text-xs font-black text-amber-700 mb-1.5">
            <span>€ 38 poupados</span>
            <span>Meta: € 100</span>
          </div>
          <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: "38%", background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
          </div>
          <p className="text-[10px] text-amber-600 mt-2">Faltam € 62 para atingires o objetivo!</p>
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
const NAV_IDS = NAV.map(n => n.id);

const TITULOS = {
  inicio:     { t: "Olá! Bem-vindo de volta",          s: "Vamos poupar nas compras de hoje?" },
  mercados:   { t: "Supermercados",                     s: "Os folhetos da semana num só sítio" },
  lojas:      { t: "Lojas",                             s: "Moda, eletrónica e desporto com desconto" },
  mobilidade: { t: "Mobilidade",                        s: "Combustíveis e pontos de carregamento" },
  poupanca:   { t: "A tua poupança",                    s: "Quanto já poupaste este mês" },
  taloes:     { t: "Os meus talões",                    s: "Compras e garantias num só sítio" },
};

export default function PoupeJa() {
  const [tab, setTabRaw]       = useState("inicio");
  const [dir, setDir]          = useState("right");
  const [bounce, setBounce]    = useState(null);
  const [verAvisos, setVerAvisos] = useState(false);
  const [verDefs, setVerDefs]     = useState(false);

  /* Calcula direção da animação com base na posição das tabs */
  function go(newTab) {
    if (newTab === tab) return;
    const pi = NAV_IDS.indexOf(tab);
    const ni = NAV_IDS.indexOf(newTab);
    let d;
    if (ni === -1)       d = "up";    // sub-página (taloes, defs)
    else if (pi === -1)  d = "fade";  // volta de sub-página
    else if (ni > pi)    d = "right"; // avança para a direita
    else                 d = "left";  // recua para a esquerda
    setDir(d);
    setTabRaw(newTab);
  }

  /* Nav click com feedback de bounce no ícone */
  function navClick(id) {
    if (id === tab) return;
    setBounce(id);
    setTimeout(() => setBounce(null), 400);
    go(id);
  }

  const info  = TITULOS[tab] || TITULOS.inicio;
  const avisos = garantiasAAcabar(60);

  return (
    <>
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative select-none overflow-x-hidden">

        {verDefs ? (
          <SecaoDefinicoes onVoltar={() => { setDir("fade"); setTabRaw("inicio"); setVerDefs(false); }} />
        ) : (
          <>
            {/* ── Header ── */}
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
                    {avisos.length > 0 && (
                      <span className="pulse-dot absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  <button
                    onClick={() => { setDir("up"); setVerDefs(true); setTabRaw("inicio"); }}
                    className="press w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center"
                  >
                    <Users size={16} className="text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Título anima a cada mudança de tab */}
              <div key={tab} className="mt-0.5 header-title">
                <h1 className="text-[15px] font-black text-slate-900 leading-tight">{info.t}</h1>
                <p className="text-[11px] text-slate-400 font-medium">{info.s}</p>
              </div>
            </header>

            {/* ── Conteúdo com transição direcional ── */}
            <main style={{ overflow: "hidden" }}>
              <div key={tab} data-dir={dir}>
                {tab === "inicio"     && <EcraInicio setTab={go} />}
                {tab === "mercados"   && <SecaoMercados />}
                {tab === "lojas"      && <SecaoLojas />}
                {tab === "mobilidade" && <SecaoMobilidade />}
                {tab === "poupanca"   && <SecaoPoupanca />}
                {tab === "taloes"     && (
                  <div className="pt-4">
                    <button
                      onClick={() => go("inicio")}
                      className="press mx-4 mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-400"
                    >
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    <SecaoTaloes />
                  </div>
                )}
              </div>
            </main>

            {/* ── Bottom Nav ── */}
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
                      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-150 ${active ? "bg-emerald-50" : ""}`}
                    >
                      <it.icon
                        size={20}
                        className={`transition-colors duration-150 ${active ? "text-emerald-600" : "text-slate-400"} ${bounce === it.id ? "nav-icon-active" : ""}`}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                      <span className={`text-[9px] font-black transition-colors duration-150 ${active ? "text-emerald-600" : "text-slate-400"}`}>
                        {it.label}
                      </span>
                      {/* active indicator dot */}
                      <span
                        className="w-1 h-1 rounded-full bg-emerald-500 transition-all duration-200"
                        style={{ opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(0)" }}
                      />
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {verAvisos && (
          <PainelAvisos
            avisos={{ garantias: avisos }}
            onFechar={() => setVerAvisos(false)}
            onAbrirTaloes={() => { setVerAvisos(false); go("taloes"); }}
          />
        )}
      </div>
    </>
  );
}
