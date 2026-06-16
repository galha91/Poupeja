import React, { useState, useEffect } from "react";
import SecaoFolhetos from "../SecaoFolhetos";
import SecaoLojas from "../SecaoLojas";
import SecaoMobilidade from "../SecaoMobilidade";
import SecaoTaloes from "../SecaoTaloes";
import SecaoListaCompras from "../SecaoListaCompras";
import SecaoDefinicoes from "../SecaoDefinicoes";
import SecaoApoios from "../SecaoApoios";
import SecaoContas from "../SecaoContas";
import DesafiosMensais from "../DesafiosMensais";
import PainelAvisos from "../PainelAvisos";
import EcraAuth, { DefinirNovaPass, sessionParaUser } from "../EcraAuth";
import { supabase } from "../lib/supabase";
import { iniciarSync, pararSync } from "../lib/sync";
import {
  Home, ShoppingCart, Store, Fuel, PiggyBank, Bell, Users,
  Receipt, Tag, Battery, Shirt, Smartphone, ChevronRight,
  Zap, ArrowRight, BarChart, Target, Coffee, ArrowLeft,
  Trophy, Star, Sparkles, TrendingUp, Plus, ShieldCheck, ListChecks, Share2,
  ExternalLink, TrendingDown, Lightbulb, Landmark, CalendarClock,
} from "lucide-react";
import { partilharPoupanca } from "../lib/partilhar";
import { calcularEstado } from "../lib/desafios";

/* ─── nav config ─── */
const NAV = [
  { id: "inicio",     label: "Início",     icon: Home },
  { id: "mercados",   label: "Mercado",    icon: ShoppingCart },
  { id: "lojas",      label: "Lojas",      icon: Store },
  { id: "mobilidade", label: "Mobilidade", icon: Fuel },
  { id: "poupanca",   label: "Poupança",   icon: PiggyBank },
  { id: "apoios",     label: "Apoios",     icon: Landmark },
  { id: "contas",     label: "Contas",     icon: CalendarClock },
];
const NAV_IDS = NAV.map(n => n.id);

const TITULOS = {
  inicio:     { t: "Olá! Bem-vindo de volta",          s: "Vamos poupar nas compras de hoje?" },
  mercados:   { t: "Supermercados",                     s: "Os folhetos da semana num só sítio" },
  lojas:      { t: "Lojas",                             s: "Moda, eletrónica e desporto com desconto" },
  mobilidade: { t: "Mobilidade",                        s: "Combustíveis e pontos de carregamento" },
  poupanca:   { t: "A tua poupança",                    s: "Quanto já poupaste este mês" },
  apoios:     { t: "Apoios do Estado",                  s: "Benefícios a que podes ter direito" },
  contas:     { t: "Contas fixas",                      s: "As tuas despesas mensais num só sítio" },
  taloes:     { t: "Os meus talões",                    s: "Compras e garantias num só sítio" },
  lista:      { t: "Lista de compras",                  s: "Os artigos que precisas de comprar" },
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

function EmptyState({ icon: Icon, titulo, sub, cta, onCta, color = "slate" }) {
  const paleta = {
    slate: { wrap: "bg-slate-50 border-slate-100",       icon: "text-slate-300" },
    blue:  { wrap: "bg-blue-50 border-blue-100",         icon: "text-blue-300" },
    green: { wrap: "bg-emerald-50 border-emerald-100",   icon: "text-emerald-300" },
  };
  const c = paleta[color] || paleta.slate;
  return (
    <div className="mx-4 card p-8 flex flex-col items-center text-center">
      <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${c.wrap}`}>
        <Icon size={30} className={c.icon} />
      </div>
      <p className="text-sm font-black text-slate-600">{titulo}</p>
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

/* ─── Modal de instruções de instalação ─── */
function ModalInstalar({ modo, onFechar, onInstalarAndroid }) {
  if (!modo) return null;

  const passos = modo === "ios" ? [
    { emoji: "1️⃣", titulo: "Abre no Safari", desc: "Certifica-te de que estás a usar o Safari (não Chrome nem Firefox)." },
    { emoji: "⬆️", titulo: "Toca em Partilhar", desc: "O ícone de partilhar fica na barra de baixo do Safari — parece uma caixa com uma seta a apontar para cima." },
    { emoji: "📲", titulo: "Adicionar ao ecrã inicial", desc: "Faz scroll na lista e toca em \"Adicionar ao Ecrã Inicial\". Pode estar a meio da lista." },
    { emoji: "✅", titulo: "Confirma", desc: "Toca em \"Adicionar\" no canto superior direito. O ícone do PoupeJá aparece no teu ecrã!" },
  ] : [
    { emoji: "1️⃣", titulo: "Toca em \"Instalar\"", desc: "Aparece um popup do sistema a perguntar se queres instalar o PoupeJá." },
    { emoji: "✅", titulo: "Confirma a instalação", desc: "Toca em \"Instalar\" no popup. O ícone fica no teu ecrã imediatamente." },
    { emoji: "🔔", titulo: "Ativa notificações", desc: "Podes ativar notificações para receberes os folhetos semanais automaticamente." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onFechar}>
      <div
        className="w-full rounded-t-3xl bg-white overflow-hidden"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Cabeçalho */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: modo === "ios" ? "linear-gradient(135deg,#1e3a8a,#2563eb)" : "linear-gradient(135deg,#065f46,#059669)" }}
        >
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{modo === "ios" ? "🍎" : "🤖"}</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
              {modo === "ios" ? "iPhone / iPad" : "Android"}
            </p>
            <p className="text-[15px] font-black text-white leading-tight">Como instalar o PoupeJá</p>
          </div>
          <button onClick={onFechar} className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={16} className="text-white" />
          </button>
        </div>

        {/* Passos */}
        <div className="px-5 pt-5 pb-3 flex flex-col gap-4">
          {passos.map((p, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-2xl border border-slate-100">
                {p.emoji}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-black text-slate-800">{p.titulo}</p>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Nota iOS sobre Safari */}
        {modo === "ios" && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              💡 <strong>Atenção:</strong> No iPhone, só consegues instalar sites como app através do <strong>Safari</strong>. Se estás a usar o Chrome ou outro browser, copia o link e abre no Safari.
            </p>
          </div>
        )}

        {/* Botão de ação */}
        <div className="px-5 pb-8">
          {modo === "android" && onInstalarAndroid && (
            <button
              onClick={onInstalarAndroid}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm mb-3"
              style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}
            >
              📲 Instalar agora
            </button>
          )}
          <button
            onClick={onFechar}
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Banner instalar app ─── */
function BannerInstalar() {
  const [modo, setModo]             = useState(null); // null | "android" | "ios" | "oculto"
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [modalAberto, setModalAberto]       = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dispensado = localStorage.getItem("poupeja_instalar_dispensado");
    if (dispensado && Date.now() - Number(dispensado) < 7 * 24 * 60 * 60 * 1000) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    if (isIos) { setModo("ios"); return; }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setModo("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dispensar() {
    localStorage.setItem("poupeja_instalar_dispensado", String(Date.now()));
    setModo("oculto");
  }

  async function instalarAndroid() {
    if (!deferredPrompt) return;
    setModalAberto(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem("poupeja_instalar_dispensado", String(Date.now()));
    setModo("oculto");
  }

  if (!modo || modo === "oculto") return null;

  return (
    <>
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden anim-up anim-up-1" style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 8px 24px -8px rgba(37,99,235,0.5)" }}>
        <div className="px-4 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white leading-snug">
              {modo === "ios" ? "📲 Instala o PoupeJá no iPhone" : "📲 Instala o PoupeJá como app"}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
              {modo === "ios"
                ? "Adiciona ao ecrã inicial — acesso rápido e notificações semanais."
                : "Instala em 2 segundos — notificações, acesso rápido e funciona offline."}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setModalAberto(true)}
                className="press px-3.5 py-1.5 rounded-xl bg-white text-blue-700 text-[11px] font-black"
              >
                {modo === "ios" ? "Como instalar →" : "Ver como instalar →"}
              </button>
              {modo === "android" && (
                <button
                  onClick={instalarAndroid}
                  className="press px-3.5 py-1.5 rounded-xl bg-blue-500 text-white text-[11px] font-black border border-white/20"
                >
                  Instalar agora
                </button>
              )}
              <button onClick={dispensar} className="press px-3.5 py-1.5 rounded-xl bg-white/15 text-white text-[11px] font-black">
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalAberto && (
        <ModalInstalar
          modo={modo}
          onFechar={() => setModalAberto(false)}
          onInstalarAndroid={modo === "android" ? instalarAndroid : null}
        />
      )}
    </>
  );
}

/* ─── Ecrã Início ─── */
function EcraInicio({ user, setTab, goGarantias }) {
  const primeiroNome = user?.nome?.split(" ")[0] || "aí";

  const [totalMes, setTotalMes]       = useState(0);
  const [totalSempre, setTotalSempre] = useState(0);
  const [nTaloes, setNTaloes]         = useState(0);
  const [feedbackPartilha, setFeedbackPartilha] = useState("");
  const [estadoDesafio, setEstadoDesafio] = useState(null);
  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const mesAtual = new Date().toISOString().slice(0, 7);
      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado > 0);
      const doMes = compras.filter(t => (t.dataCompra || t.criadoEm || "").slice(0, 7) === mesAtual);
      setTotalMes(doMes.reduce((s, t) => s + (t.valorPoupado || 0), 0));
      setTotalSempre(compras.reduce((s, t) => s + (t.valorPoupado || 0), 0));
      setNTaloes(compras.length);
    } catch {}
    setEstadoDesafio(calcularEstado());
  }, []);

  async function partilhar() {
    const valor = totalMes > 0 ? totalMes : totalSempre;
    const periodo = totalMes > 0 ? "este mês" : "até hoje";
    const r = await partilharPoupanca(valor, periodo);
    if (r === "copiado") {
      setFeedbackPartilha("Copiado ✓");
      setTimeout(() => setFeedbackPartilha(""), 2500);
    }
  }

  const FEATURES = [
    { icon: ListChecks, label: "Lista de compras",  desc: "Organiza o que levas antes de sair",     bg: "from-violet-600 to-purple-500", shadow: "rgba(124,58,237,0.3)", tab: "lista",      full: true },
    { icon: Receipt,    label: "Os meus talões",    desc: "Guarda compras e garantias",              bg: "from-blue-600 to-blue-500",     shadow: "rgba(37,99,235,0.3)",  tab: "taloes" },
    { icon: Tag,        label: "Folhetos",           desc: "Todos os supermercados num só sítio",    bg: "from-violet-600 to-purple-500", shadow: "rgba(124,58,237,0.3)", tab: "mercados" },
    { icon: Fuel,       label: "Combustíveis e EV",  desc: "Preços reais e postos perto de ti",     bg: "from-orange-500 to-amber-400",  shadow: "rgba(245,158,11,0.3)", tab: "mobilidade" },
    { icon: Store,      label: "Lojas e promoções",  desc: "Moda, eletrónica e desporto",           bg: "from-slate-700 to-slate-600",   shadow: "rgba(51,65,85,0.3)",  tab: "lojas" },
    { icon: Landmark,   label: "Apoios do Estado",   desc: "Benefícios e subsídios a que tens direito", bg: "from-blue-700 to-blue-500", shadow: "rgba(29,78,216,0.3)",  tab: "apoios" },
    { icon: CalendarClock, label: "Contas fixas",   desc: "Renda, luz, água, net — tudo controlado",  bg: "from-violet-700 to-purple-600", shadow: "rgba(109,40,217,0.3)", tab: "contas" },
  ];

  const SHORTCUTS = [
    { icon: Tag,         label: "Folhetos",    color: "text-violet-600",  bg: "bg-violet-50",   tab: "mercados" },
    { icon: Receipt,     label: "Talões",      color: "text-blue-600",    bg: "bg-blue-50",     tab: "taloes" },
    { icon: ListChecks,  label: "Lista",       color: "text-purple-600",  bg: "bg-purple-50",   tab: "lista" },
    { icon: ShieldCheck, label: "Garantias",   color: "text-emerald-600", bg: "bg-emerald-50",  action: goGarantias },
    { icon: Fuel,        label: "Combustíveis",color: "text-orange-600",  bg: "bg-orange-50",   tab: "mobilidade" },
    { icon: Battery,     label: "Postos EV",   color: "text-emerald-600", bg: "bg-emerald-50",  tab: "mobilidade" },
    { icon: Landmark,    label: "Apoios",      color: "text-blue-600",    bg: "bg-blue-50",     tab: "apoios" },
    { icon: CalendarClock, label: "Contas",   color: "text-violet-600",  bg: "bg-violet-50",   tab: "contas" },
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

          <div className="px-6 pt-6 pb-5 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <PiggyBank size={15} className="text-white" />
              </div>
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">O teu assistente de poupança</span>
            </div>

            {totalSempre > 0 ? (
              <>
                <p className="text-[13px] font-semibold text-white/70">
                  Olá, {primeiroNome}! {totalMes > 0 ? "Este mês já poupaste" : "Já poupaste no total"}
                </p>
                <p className="text-5xl font-black text-white mt-1 leading-none" style={{ fontFamily: "'Sora', system-ui" }}>
                  €{(totalMes > 0 ? totalMes : totalSempre).toFixed(2)}
                </p>
                <p className="text-[12px] text-white/60 mt-1.5">
                  {totalMes > 0 && totalSempre > totalMes
                    ? <>€{totalSempre.toFixed(2)} no total · {nTaloes} tal{nTaloes !== 1 ? "ões" : "ão"}</>
                    : <>em {nTaloes} talão{nTaloes !== 1 ? "s" : ""} guardado{nTaloes !== 1 ? "s" : ""}</>}
                </p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTab("poupanca")}
                    className="press inline-flex items-center gap-2 bg-white/20 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20"
                  >
                    Ver detalhes <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => setTab("taloes")}
                    className="press inline-flex items-center gap-2 bg-white text-emerald-700 text-xs font-black px-4 py-2 rounded-xl"
                  >
                    <Plus size={13} /> Adicionar talão
                  </button>
                  <button
                    onClick={partilhar}
                    className="press inline-flex items-center gap-2 bg-white/20 text-white text-xs font-black px-3.5 py-2 rounded-xl border border-white/20"
                  >
                    <Share2 size={13} /> {feedbackPartilha || "Partilhar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-white/80">Olá, {primeiroNome}!</p>
                <p className="text-2xl font-black text-white mt-0.5 leading-snug" style={{ fontFamily: "'Sora', system-ui" }}>
                  Pronto para poupar<br />nas compras de hoje?
                </p>
                <button
                  onClick={() => setTab("taloes")}
                  className="press mt-4 inline-flex items-center gap-2 bg-white/20 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20"
                >
                  Guardar primeiro talão <ArrowRight size={13} />
                </button>
                <p className="text-[10px] text-white/40 mt-3">Começa a usar e a tua poupança aparece aqui automaticamente.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner instalar app */}
      <BannerInstalar />

      {/* Garantias highlight */}
      <div className="px-4 mt-4 anim-up anim-up-1">
        <button
          onClick={goGarantias}
          className="press w-full rounded-2xl p-4 flex items-center gap-3.5 text-left"
          style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 12px 28px -10px rgba(5,150,105,0.4)" }}
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Exclusivo PoupeJá</p>
            <p className="text-[15px] font-black text-white leading-snug">Garantias digitais</p>
            <p className="text-[11px] text-white/70 mt-0.5">Nunca percas a validade dos teus produtos</p>
          </div>
          <ChevronRight size={18} className="text-white/50 flex-shrink-0" />
        </button>
      </div>

      {/* Desafio do mês — destaque */}
      {estadoDesafio && (() => {
        const d = estadoDesafio.desafio;
        const pct = Math.round(estadoDesafio.progresso * 100);
        const completo = estadoDesafio.completo;
        return (
          <div className="px-4 mt-3 anim-up anim-up-2">
            <button
              onClick={() => setTab("poupanca")}
              className="press w-full rounded-2xl p-4 flex items-center gap-3.5 text-left relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg,${d.cor}f0,${d.cor})`,
                boxShadow: `0 12px 28px -10px ${d.cor}66`,
              }}
            >
              <div className="absolute right-3 bottom-2 text-5xl opacity-10 pointer-events-none select-none">{d.emoji}</div>
              <div
                className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              >{d.emoji}</div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Desafio do mês</p>
                  {completo && <span className="text-[9px] font-black text-white bg-white/20 px-1.5 py-0.5 rounded-full">Completo 🏆</span>}
                </div>
                <p className="text-[14px] font-black text-white leading-tight truncate">{d.nome}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: completo ? "#fbbf24" : "rgba(255,255,255,0.9)" }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-white/80 flex-shrink-0">
                    €{estadoDesafio.totalMes.toFixed(0)}/€{d.meta}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/50 flex-shrink-0 relative z-10" />
            </button>
          </div>
        );
      })()}

      {/* Features grid */}
      <div className="px-4 mt-3 anim-up anim-up-1">
        <SectionLabel icon={Sparkles}>O que podes fazer</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => f.tab && setTab(f.tab)}
              className={`press bg-gradient-to-br ${f.bg} rounded-2xl text-left text-white ${f.full ? "col-span-2 lg:col-span-4 flex items-center gap-4 px-5 py-4" : "p-5"}`}
              style={{ boxShadow: `0 12px 28px -8px ${f.shadow}` }}
            >
              <div className={`bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 ${f.full ? "w-14 h-14" : "w-11 h-11 mb-3.5"}`}>
                <f.icon size={f.full ? 26 : 21} />
              </div>
              <div className={f.full ? "flex-1" : ""}>
                <p className={`font-black leading-snug ${f.full ? "text-[17px]" : "text-[15px]"}`}>{f.label}</p>
                <p className="text-[11px] text-white/75 mt-1 leading-relaxed">{f.desc}</p>
                {!f.full && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-black text-white/60">
                    Ver mais <ChevronRight size={10} />
                  </div>
                )}
              </div>
              {f.full && <ChevronRight size={20} className="text-white/50 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos */}
      <div className="px-4 mt-5 anim-up anim-up-2">
        <SectionLabel icon={Zap}>Atalhos rápidos</SectionLabel>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {SHORTCUTS.map((it, i) => (
            <button
              key={i}
              onClick={it.action || (() => setTab(it.tab))}
              className="press card flex flex-col items-center gap-2.5 py-4 px-2"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${it.bg}`}>
                <it.icon size={21} className={it.color} />
              </div>
              <span className="text-[11px] font-black text-slate-700 text-center leading-tight">{it.label}</span>
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
            <p className="text-[11px] text-slate-500 mt-0.5">Vê as promoções de todos os supermercados e poupa mais.</p>
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
  const [dados, setDados] = useState(null);
  const [feedbackPartilha, setFeedbackPartilha] = useState("");
  const [barSelecionada, setBarSelecionada] = useState(null);
  const [mostrar12, setMostrar12] = useState(false);

  async function partilhar() {
    if (!dados) return;
    const valor = dados.totalMes > 0 ? dados.totalMes : dados.totalGeral;
    const periodo = dados.totalMes > 0 ? "este mês" : "até hoje";
    const r = await partilharPoupanca(valor, periodo);
    if (r === "copiado") {
      setFeedbackPartilha("Copiado ✓");
      setTimeout(() => setFeedbackPartilha(""), 2500);
    }
  }

  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado != null);
      const agora = new Date();
      const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      const mesAnterior = (() => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })();

      // Agrupar por mês (últimos 12 meses)
      const porMes = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        porMes[k] = 0;
      }
      compras.forEach(t => {
        const data = t.dataCompra || t.criadoEm?.slice(0, 7) || mesAtual;
        const k = data.slice(0, 7);
        if (k in porMes) porMes[k] += t.valorPoupado;
      });

      const meses12 = Object.entries(porMes).map(([k, v]) => ({
        k, v,
        label: new Date(k + "-01").toLocaleDateString("pt-PT", { month: "short" }),
        labelLong: new Date(k + "-01").toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      }));

      const totalMes    = porMes[mesAtual] || 0;
      const totalAnterior = porMes[mesAnterior] || 0;
      const totalGeral  = compras.reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
      const mesesComValor = meses12.filter(m => m.v > 0);
      const melhorMes   = mesesComValor.length ? mesesComValor.reduce((a, b) => b.v > a.v ? b : a) : null;
      const mediaMensal = mesesComValor.length ? totalGeral / mesesComValor.length : 0;
      const tendencia   = totalAnterior > 0
        ? Math.round(((totalMes - totalAnterior) / totalAnterior) * 100)
        : totalMes > 0 ? 100 : 0;
      const maxBar = Math.max(...meses12.map(m => m.v), 0.01);

      setDados({ meses12, totalMes, totalGeral, count: compras.length, maxBar, melhorMes, mediaMensal, tendencia, totalAnterior });
    } catch {}
  }, []);

  const semDados = !dados || dados.totalGeral === 0;
  const mesesVisiveis = dados ? (mostrar12 ? dados.meses12 : dados.meses12.slice(6)) : [];

  return (
    <div className="pb-28 pt-4">

      {/* Hero */}
      <div className="px-4 mb-5 anim-up">
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#60a5fa 100%)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.4)" }}
        >
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
          <p className="text-[11px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <PiggyBank size={12} /> Total poupado este mês
          </p>
          <p className="text-5xl font-black text-white">
            {dados ? `€${dados.totalMes.toFixed(2)}` : "€0.00"}
          </p>
          {dados && dados.totalGeral > 0 ? (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <p className="text-[12px] text-white/70">
                Total: <strong className="text-white">€{dados.totalGeral.toFixed(2)}</strong> em {dados.count} talões
              </p>
              {dados.tendencia !== 0 && dados.totalAnterior > 0 && (
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${dados.tendencia > 0 ? "bg-emerald-400/30 text-emerald-200" : "bg-red-400/30 text-red-200"}`}>
                  {dados.tendencia > 0 ? "▲" : "▼"} {Math.abs(dados.tendencia)}% vs mês anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-white/70 mt-2">Guarda talões com o valor poupado para ver aqui.</p>
          )}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setTab("taloes")}
              className="press inline-flex items-center gap-1.5 bg-white text-blue-700 text-xs font-black px-4 py-2 rounded-xl"
            >
              <Plus size={12} /> {semDados ? "Guardar primeiro talão" : "Adicionar talão"}
            </button>
            {!semDados && (
              <button
                onClick={partilhar}
                className="press inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-black px-3.5 py-2 rounded-xl border border-white/20"
              >
                <Share2 size={12} /> {feedbackPartilha || "Partilhar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {dados && dados.totalGeral > 0 ? (<>

        {/* Cartões de resumo */}
        <div className="px-4 mb-5 anim-up anim-up-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Melhor mês</p>
              <p className="text-xl font-black text-slate-800 mt-1">
                €{dados.melhorMes ? dados.melhorMes.v.toFixed(2) : "0.00"}
              </p>
              <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                {dados.melhorMes ? dados.melhorMes.labelLong : "—"}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Média mensal</p>
              <p className="text-xl font-black text-slate-800 mt-1">€{dados.mediaMensal.toFixed(2)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">nos meses com dados</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="px-4 mb-2 anim-up anim-up-1">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={BarChart}>{mostrar12 ? "Últimos 12 meses" : "Últimos 6 meses"}</SectionLabel>
            <button
              onClick={() => { setMostrar12(v => !v); setBarSelecionada(null); }}
              className="text-[11px] font-black text-blue-500"
            >
              {mostrar12 ? "Ver 6 meses" : "Ver 12 meses"}
            </button>
          </div>

          {/* Tooltip da barra selecionada */}
          {barSelecionada && (
            <div className="mb-3 mx-auto text-center bg-blue-50 rounded-2xl py-2.5 px-4 border border-blue-100">
              <p className="text-[11px] font-black text-blue-400 capitalize">{barSelecionada.labelLong}</p>
              <p className="text-lg font-black text-blue-700">€{barSelecionada.v.toFixed(2)}</p>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-end gap-1.5 h-32">
              {mesesVisiveis.map(m => {
                const pct = dados.maxBar > 0 ? (m.v / dados.maxBar) * 100 : 0;
                const isAtual = m.k === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                const isSelecionada = barSelecionada?.k === m.k;
                return (
                  <button
                    key={m.k}
                    onClick={() => setBarSelecionada(isSelecionada ? null : m)}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <p className="text-[8px] font-black text-blue-500 h-3">
                      {m.v > 0 ? `€${m.v.toFixed(0)}` : ""}
                    </p>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(pct, m.v > 0 ? 6 : 3)}%`,
                        background: isSelecionada
                          ? "linear-gradient(180deg,#f59e0b,#d97706)"
                          : isAtual
                          ? "linear-gradient(180deg,#60a5fa,#1d4ed8)"
                          : m.v > 0 ? "#bfdbfe" : "#f1f5f9",
                        minHeight: 4,
                      }}
                    />
                    <p className={`text-[9px] font-bold ${isAtual ? "text-blue-600" : "text-slate-400"}`}>
                      {m.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span className="text-[10px] text-slate-400 font-medium">Mês atual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
                <span className="text-[10px] text-slate-400 font-medium">Meses anteriores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista mensal */}
        <div className="px-4 mb-5 anim-up anim-up-2">
          <SectionLabel icon={TrendingUp}>Detalhe por mês</SectionLabel>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {[...mesesVisiveis].reverse().filter(m => m.v > 0).map(m => {
              const isAtual = m.k === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
              const pct = dados.totalGeral > 0 ? (m.v / dados.totalGeral) * 100 : 0;
              return (
                <div key={m.k} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-blue-600 capitalize">{m.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-slate-800 capitalize">
                        {m.labelLong} {isAtual && <span className="text-[10px] text-blue-500 font-bold ml-1">• atual</span>}
                      </p>
                      <p className="text-sm font-black text-emerald-600">€{m.v.toFixed(2)}</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {mesesVisiveis.every(m => m.v === 0) && (
              <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">
                Sem dados neste período.
              </div>
            )}
          </div>
        </div>

      </>) : (
        <div className="px-4 mb-5 anim-up anim-up-1">
          <SectionLabel icon={Zap}>Histórico</SectionLabel>
          <EmptyState
            icon={BarChart}
            titulo="Ainda sem dados de poupança"
            sub="Quando guardares talões com o valor poupado, o teu histórico aparece aqui."
            cta="Guardar talão"
            onCta={() => setTab("taloes")}
            color="blue"
          />
        </div>
      )}

      {/* Lista de compras shortcut */}
      <div className="px-4 mb-5 anim-up anim-up-2">
        <button
          onClick={() => setTab("lista")}
          className="press w-full rounded-2xl p-4 flex items-center gap-3.5 text-left"
          style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", boxShadow: "0 12px 28px -10px rgba(124,58,237,0.4)" }}
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ListChecks size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Novo</p>
            <p className="text-[15px] font-black text-white leading-snug">Lista de compras</p>
            <p className="text-[11px] text-white/70 mt-0.5">Organiza o que precisas antes de ir às compras</p>
          </div>
          <ChevronRight size={18} className="text-white/50 flex-shrink-0" />
        </button>
      </div>

      {/* Poupa nas contas */}
      <div className="px-4 mb-5 anim-up anim-up-3">
        <SectionLabel icon={Lightbulb}>Poupa também nas contas</SectionLabel>
        <div className="flex flex-col gap-3">
          {LEADS_FINANCEIROS.map(lead => (
            <a
              key={lead.id}
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="press card p-4 flex items-center gap-4 text-left no-underline"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: lead.bg }}
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${lead.dominio}&sz=64`}
                  alt={lead.nome}
                  width={32}
                  height={32}
                  style={{ objectFit: "contain" }}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
                />
                <span style={{ display: "none", fontSize: 22 }}>{lead.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-black text-slate-800">{lead.nome}</p>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: lead.bg, color: lead.cor }}
                  >
                    {lead.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{lead.desc}</p>
                <p className="text-[10px] font-black mt-1" style={{ color: lead.cor }}>
                  {lead.cta} →
                </p>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Serviços de comparação gratuitos e sem compromisso
        </p>
      </div>

      {/* Desafios */}
      <DesafiosMensais setTab={setTab} />

    </div>
  );
}

/* ─── Leads financeiros ─── */
const LEADS_FINANCEIROS = [
  {
    id: "comparaja",
    nome: "ComparaJá",
    dominio: "comparaja.pt",
    emoji: "⚡",
    bg: "#fef3c7",
    cor: "#d97706",
    badge: "Energia & Internet",
    desc: "Compara tarifas de eletricidade, gás, internet e seguros. Poupas centenas por ano sem sair de casa.",
    cta: "Comparar agora",
    url: "https://www.comparaja.pt/?ref=poupeja",
  },
  {
    id: "doutorfinancas",
    nome: "Doutor Finanças",
    dominio: "doutorfinancas.pt",
    emoji: "🏦",
    bg: "#eff6ff",
    cor: "#2563eb",
    badge: "Crédito & Seguros",
    desc: "Simula crédito habitação, pessoal e seguros. Negociação gratuita com os melhores bancos.",
    cta: "Simular grátis",
    url: "https://www.doutorfinancas.pt/?ref=poupeja",
  },
];

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
  const [recovery, setRecovery]   = useState(false);
  const [tab, setTabRaw]          = useState("inicio");
  const [dir, setDir]             = useState("right");
  const [bounce, setBounce]       = useState(null);
  const [verAvisos, setVerAvisos]       = useState(false);
  const [verDefs, setVerDefs]           = useState(false);
  const [subTabTaloes, setSubTabTaloes] = useState("compras");
  const [garantiasAviso, setGarantiasAviso] = useState([]);
  const [syncTick, setSyncTick]         = useState(0);

  function calcGarantiasAviso() {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const agora = new Date();
      const lista = taloes
        .filter(t => t.tipo === "garantia" && t.dataExpiracao)
        .map(t => {
          const dias = Math.ceil((new Date(t.dataExpiracao) - agora) / 86400000);
          return { produto: t.nome, restam: dias, dataExpiracao: t.dataExpiracao };
        })
        .filter(t => t.restam >= 0 && t.restam <= 30)
        .sort((a, b) => a.restam - b.restam);
      setGarantiasAviso(lista);
    } catch {}
  }

  /* Lê a sessão Supabase e fica a ouvir alterações (login, logout, recuperação) */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(sessionParaUser(session));
      setHydrated(true);
    });
    calcGarantiasAviso();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setUser(sessionParaUser(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  /* Sincroniza dados locais com a conta (talões, lista, prefs…) */
  useEffect(() => {
    if (user?.id) iniciarSync(user.id);
  }, [user?.id]);

  /* Pede permissão de push automaticamente ao fazer login (se ainda não foi pedida) */
  useEffect(() => {
    if (!user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC) return;

    const jaAtivou = localStorage.getItem("poupeja_push_pedido");
    if (jaAtivou) return;
    localStorage.setItem("poupeja_push_pedido", "1");

    setTimeout(async () => {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;
        const reg = await navigator.serviceWorker.ready;
        const jaSubscrito = await reg.pushManager.getSubscription();
        if (jaSubscrito) return;
        function urlBase64ToUint8Array(b) {
          const pad = "=".repeat((4 - (b.length % 4)) % 4);
          const base64 = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
          const raw = atob(base64);
          return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/push-subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ subscription: sub }),
          });
        }
      } catch {}
    }, 3000); // pequeno delay para não assustar logo ao abrir a app
  }, [user?.id]);

  /* Dados chegaram de outro dispositivo → re-renderiza o ecrã atual */
  useEffect(() => {
    function onSync() {
      setSyncTick(t => t + 1);
      calcGarantiasAviso();
    }
    window.addEventListener("poupeja:sync-updated", onSync);
    return () => window.removeEventListener("poupeja:sync-updated", onSync);
  }, []);

  useEffect(() => {
    function onNav(e) { go(e.detail); }
    window.addEventListener("poupeja:nav", onNav);
    return () => window.removeEventListener("poupeja:nav", onNav);
  }, [tab]);

  function handleAuth(u) {
    setUser(u);
  }

  async function handleLogout() {
    pararSync();
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setTabRaw("inicio");
    setVerDefs(false);
  }

  function go(newTab) {
    if (newTab === tab) return;
    if (newTab === "taloes") setSubTabTaloes("compras");
    if (tab === "taloes") calcGarantiasAviso();
    const pi = NAV_IDS.indexOf(tab);
    const ni = NAV_IDS.indexOf(newTab);
    const d = ni === -1 ? "up" : pi === -1 ? "fade" : ni > pi ? "right" : "left";
    setDir(d);
    setTabRaw(newTab);
  }

  function goGarantias() {
    setSubTabTaloes("garantias");
    setDir("up");
    setTabRaw("taloes");
  }

  function navClick(id) {
    if (id === tab) return;
    setBounce(id);
    setTimeout(() => setBounce(null), 400);
    go(id);
  }

  /* Não renderiza nada até hidratar (evita flash) */
  if (!hydrated) return null;

  /* Veio do link de recuperação → definir nova password */
  if (recovery) {
    return <DefinirNovaPass onConcluido={() => setRecovery(false)} />;
  }

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
      <div className="min-h-screen bg-slate-50 mx-auto max-w-md lg:max-w-none lg:mx-0 relative select-none overflow-x-hidden">

        {/* Sidebar (apenas desktop) */}
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 z-40 px-4 py-6">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
              <PiggyBank size={19} color="white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Poupe<span className="text-emerald-600">Já</span>
            </span>
            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md leading-none">PT</span>
          </div>
          <div className="flex flex-col gap-1">
            {NAV.map(it => {
              const active = !verDefs && tab === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => { setVerDefs(false); navClick(it.id); }}
                  className={`press flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <it.icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[13px] font-black">{it.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col gap-1 border-t border-slate-100 pt-4">
            <button
              onClick={() => { calcGarantiasAviso(); setVerAvisos(true); }}
              className="press flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-500 hover:bg-slate-50"
            >
              <span className="relative">
                <Bell size={18} strokeWidth={1.8} />
                {garantiasAviso.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-black text-white">
                    {garantiasAviso.length}
                  </span>
                )}
              </span>
              <span className="text-[13px] font-black">Avisos</span>
            </button>
            <button
              onClick={() => { setDir("up"); setVerDefs(true); setTabRaw("inicio"); }}
              className={`press flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${verDefs ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Users size={18} strokeWidth={1.8} />
              <span className="text-[13px] font-black">A minha conta</span>
            </button>
          </div>
        </aside>

        {/* Coluna de conteúdo (desloca-se para a direita da sidebar em desktop) */}
        <div className="lg:pl-60">
        <div className="lg:max-w-5xl lg:mx-auto">

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
              className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-10 pb-3 sticky top-0 z-30 lg:pt-5 lg:px-8"
              style={{ boxShadow: "0 1px 12px rgba(15,23,42,0.06)" }}
            >
              <div className="flex items-center justify-between mb-1 lg:hidden">
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
                    onClick={() => { calcGarantiasAviso(); setVerAvisos(true); }}
                    className="press w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center relative"
                  >
                    <Bell size={16} className="text-slate-500" />
                    {garantiasAviso.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-black text-white">
                        {garantiasAviso.length}
                      </span>
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
              <div key={tab} className="mt-0.5 header-title">
                <h1 className="text-[15px] font-black text-slate-900 leading-tight">{tituloPersonalizado.t}</h1>
                <p className="text-[11px] text-slate-400 font-medium">{tituloPersonalizado.s}</p>
              </div>
            </header>

            {/* Conteúdo */}
            <main style={{ overflowX: "hidden" }}>
              <div key={`${tab}-${syncTick}`} data-dir={dir}>
                {tab === "inicio"     && <EcraInicio user={user} setTab={go} goGarantias={goGarantias} />}
                {tab === "mercados"   && <SecaoMercados />}
                {tab === "lojas"      && <SecaoLojas />}
                {tab === "mobilidade" && <SecaoMobilidade />}
                {tab === "poupanca"   && <SecaoPoupanca setTab={go} />}
                {tab === "apoios"     && <SecaoApoios />}
                {tab === "contas"     && <SecaoContas />}
                {tab === "lista"      && <SecaoListaCompras />}
                {tab === "taloes"     && (
                  <div className="pt-4">
                    <button onClick={() => go("inicio")} className="press mx-4 mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-400">
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    <SecaoTaloes inicioAba={subTabTaloes} />
                  </div>
                )}
                {tab === "lista" && (
                  <div className="pt-4">
                    <button onClick={() => go("inicio")} className="press mx-4 mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-400">
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    <SecaoListaCompras />
                  </div>
                )}
              </div>
            </main>

            {/* Bottom Nav */}
            <nav
              className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 z-40"
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

        </div>
        </div>

        {verAvisos && (
          <PainelAvisos
            avisos={{ garantias: garantiasAviso }}
            onFechar={() => setVerAvisos(false)}
            onAbrirTaloes={() => { setVerAvisos(false); goGarantias(); }}
          />
        )}

      </div>
    </>
  );
}
