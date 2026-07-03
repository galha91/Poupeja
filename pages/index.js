import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Cada separador só descarrega o seu código quando é aberto (code-splitting).
// Reduz fortemente o JavaScript inicial da home.
const carregandoSeccao = () => (
  <div className="px-4 py-16 flex flex-col items-center gap-3 text-slate-300">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin" />
    <span className="text-xs font-bold">A carregar…</span>
  </div>
);
const SecaoFolhetos    = dynamic(() => import("../SecaoFolhetos"), { loading: carregandoSeccao });
const SecaoLojas       = dynamic(() => import("../SecaoLojas"), { loading: carregandoSeccao });
const SecaoMobilidade  = dynamic(() => import("../SecaoMobilidade"), { loading: carregandoSeccao });
const SecaoTaloes      = dynamic(() => import("../SecaoTaloes"), { loading: carregandoSeccao });
const SecaoListaCompras= dynamic(() => import("../SecaoListaCompras"), { loading: carregandoSeccao });
const SecaoDefinicoes  = dynamic(() => import("../SecaoDefinicoes"), { loading: carregandoSeccao });
const SecaoApoios      = dynamic(() => import("../SecaoApoios"), { loading: carregandoSeccao });
const SecaoContas      = dynamic(() => import("../SecaoContas"), { loading: carregandoSeccao });
const SecaoCasa        = dynamic(() => import("../SecaoCasa"), { loading: carregandoSeccao });
const SecaoIRS         = dynamic(() => import("../SecaoIRS"), { loading: carregandoSeccao });
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
  ExternalLink, TrendingDown, Lightbulb, Landmark, CalendarClock, X, Building2, Calculator,
} from "lucide-react";
import { partilharPoupanca } from "../lib/partilhar";
import { calcularEstado, nivelAtual } from "../lib/desafios";

/* ─── nav config ─── */
const NAV = [
  { id: "inicio",     label: "Início",     icon: Home },
  { id: "mercados",   label: "Mercado",    icon: ShoppingCart },
  { id: "poupanca",   label: "Poupança",   icon: PiggyBank },
  { id: "contas",     label: "Contas",     icon: CalendarClock },
  { id: "casa",       label: "Casa",       icon: Building2 },
  { id: "mobilidade", label: "Mobilidade", icon: Fuel },
  { id: "apoios",     label: "Apoios",     icon: Landmark },
  { id: "lojas",      label: "Lojas",      icon: Store },
];
const NAV_IDS = ["inicio","poupanca","mercados","contas","casa","mobilidade","apoios","lojas","irs","taloes","lista"];

const TITULOS = {
  inicio:     { t: "Olá! Bem-vindo de volta",          s: "Vamos poupar nas compras de hoje?" },
  mercados:   { t: "Supermercados",                     s: "Os folhetos da semana num só sítio" },
  lojas:      { t: "Lojas",                             s: "Moda, eletrónica e desporto com desconto" },
  mobilidade: { t: "Mobilidade",                        s: "Combustíveis e pontos de carregamento" },
  poupanca:   { t: "A tua poupança",                    s: "Quanto já poupaste este mês" },
  apoios:     { t: "Apoios do Estado",                  s: "Benefícios a que podes ter direito" },
  contas:     { t: "Contas fixas",                      s: "As tuas despesas mensais num só sítio" },
  casa:       { t: "A tua casa",                        s: "Crédito, renda e contas fixas" },
  irs:        { t: "Simulador de IRS",                   s: "Estima o teu IRS antes da hora" },
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

/* ─── Convite a instalar — leva à página /instalar (ou instala já no Android) ─── */
function ModalInstalar({ modo, onFechar, onInstalarAndroid }) {
  if (!modo) return null;

  const beneficios = [
    { emoji: "🔔", texto: "Notificações dos folhetos toda a segunda-feira de manhã" },
    { emoji: "⚡", texto: "Acesso instantâneo — abre como uma app, sem abrir o browser" },
    { emoji: "📶", texto: "Funciona sem internet — consulta as listas e contas offline" },
    { emoji: "🏠", texto: "Ícone no ecrã inicial, como qualquer outra app" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onFechar}>
      <div
        className="w-full rounded-t-3xl bg-white overflow-hidden"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
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
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl">
            {modo === "ios" ? "🍎" : "🤖"}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
              {modo === "ios" ? "iOS (Safari)" : "Android"}
            </p>
            <p className="text-[15px] font-black text-white leading-tight">Instalar o PoupeJá</p>
          </div>
          <button onClick={onFechar} className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Benefícios */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Porque vale a pena</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {beneficios.map((b, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-3 flex items-start gap-2">
                <span className="text-lg leading-none flex-shrink-0">{b.emoji}</span>
                <p className="text-[11px] font-bold text-slate-700 leading-snug">{b.texto}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Ação — instala direto (Android) ou abre o guia completo em /instalar */}
        <div className="px-5 pb-8 flex flex-col gap-2.5">
          {modo === "android" && onInstalarAndroid ? (
            <>
              <button
                onClick={onInstalarAndroid}
                className="w-full py-4 rounded-2xl text-white font-black text-base"
                style={{ background: "linear-gradient(135deg,#065f46,#059669)", boxShadow: "0 8px 20px -6px rgba(5,150,105,0.5)" }}
              >
                📲 Instalar agora — é grátis
              </button>
              <a href="/instalar" className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm text-center">
                Ver o guia completo
              </a>
            </>
          ) : (
            <a
              href="/instalar"
              className="w-full py-4 rounded-2xl text-white font-black text-base text-center"
              style={{ background: "linear-gradient(135deg,#065f46,#059669)", boxShadow: "0 8px 20px -6px rgba(5,150,105,0.5)" }}
            >
              📲 Ver como instalar
            </a>
          )}
          <button
            onClick={onFechar}
            className="w-full py-2.5 text-slate-400 font-bold text-sm"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Hook de deteção de plataforma de instalação ─── */
function useInstallDetect() {
  const [modo, setModo] = useState(null); // null | "ios" | "android" | "instalado"
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setModo("instalado");
      return;
    }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setModo("ios"); return; }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setModo("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return { modo, prompt };
}

/* ─── Barra sticky de instalação (abaixo do header, todos os ecrãs) ─── */
function BarraInstalacao({ modo, onAbrir, onInstalarDireto }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!modo || modo === "instalado") return;
    // Mostrar se não foi dispensado nesta sessão
    if (sessionStorage.getItem("poupeja_barra_dispensada")) return;
    // Cooldown: depois de 3 dispensas → 2 dias de pausa
    const ndispensas = parseInt(localStorage.getItem("poupeja_ndispensas") || "0");
    if (ndispensas >= 3) {
      const ultimo = parseInt(localStorage.getItem("poupeja_instalar_dispensado") || "0");
      if (Date.now() - ultimo < 2 * 24 * 3600 * 1000) return;
    }
    setVisivel(true);
  }, [modo]);

  function dispensar() {
    sessionStorage.setItem("poupeja_barra_dispensada", "1");
    const n = parseInt(localStorage.getItem("poupeja_ndispensas") || "0") + 1;
    localStorage.setItem("poupeja_ndispensas", String(n));
    localStorage.setItem("poupeja_instalar_dispensado", String(Date.now()));
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="lg:hidden mx-4 mt-2 rounded-xl px-4 py-3 flex items-center gap-3 bg-white border border-slate-100"
      style={{ boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <Smartphone size={15} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-slate-800 leading-snug">Instala a app — gratuito</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Notificações e acesso rápido</p>
      </div>
      <button
        onClick={modo === "android" && onInstalarDireto ? onInstalarDireto : onAbrir}
        className="press flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black"
      >
        {modo === "android" ? "Instalar" : "Como →"}
      </button>
      <button onClick={dispensar} className="press w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <X size={10} className="text-slate-400" />
      </button>
    </div>
  );
}

/* ─── Banner instalar app (ecrã início) ─── */
function BannerInstalar({ onAbrirModal, onInstalarAndroid, modo }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!modo || modo === "instalado") return;
    // No ecrã inicial mostra sempre se não foi instalada
    setVisivel(true);
  }, [modo]);

  function dispensar() {
    sessionStorage.setItem("poupeja_banner_dispensado", "1");
    setVisivel(false);
  }

  if (!visivel || sessionStorage.getItem("poupeja_banner_dispensado")) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl overflow-hidden anim-up anim-up-1 bg-white border border-slate-100" style={{ boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
      <div className="px-4 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Smartphone size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-slate-800 leading-snug">
            {modo === "ios" ? "Instala no iPhone — grátis" : "Instala como app — grátis"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Notificações semanais · Acesso rápido · Offline
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={onAbrirModal}
              className="press px-4 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-black"
            >
              {modo === "ios" ? "Como instalar" : "Ver instruções"}
            </button>
            {modo === "android" && (
              <button
                onClick={onInstalarAndroid}
                className="press px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-black border border-emerald-100"
              >
                Instalar agora
              </button>
            )}
            <button onClick={dispensar} className="press px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-black">
              Já tenho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function calcStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem("poupeja_visita_diaria") || "null");
    const hoje = new Date().toISOString().slice(0, 10);
    if (!raw) {
      localStorage.setItem("poupeja_visita_diaria", JSON.stringify({ data: hoje, streak: 1 }));
      return 1;
    }
    if (raw.data === hoje) return raw.streak;
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    const streak = raw.data === ontem.toISOString().slice(0, 10) ? raw.streak + 1 : 1;
    localStorage.setItem("poupeja_visita_diaria", JSON.stringify({ data: hoje, streak }));
    return streak;
  } catch { return 1; }
}

/* ─── Home redesign: helpers ─── */
function saudacaoHora() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
}

// Contagem crescente do valor poupado (respeita prefers-reduced-motion)
function useCountUp(target, ms = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") { setVal(target); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setVal(target); return; }
    let raf, start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / ms, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

// Gradientes por marca para os cartões de folhetos
const FOLHETO_CORES = {
  "Continente":      ["#e11d48", "#be123c"],
  "Pingo Doce":      ["#16a34a", "#15803d"],
  "Lidl":            ["#0ea5e9", "#0369a1"],
  "Aldi":            ["#0284c7", "#075985"],
  "Auchan":          ["#e11d48", "#b91c1c"],
  "E.Leclerc":       ["#2563eb", "#1d4ed8"],
  "El Corte Inglés": ["#047857", "#065f46"],
  "Froiz":           ["#dc2626", "#991b1b"],
  "Intermarché":     ["#dc2626", "#b91c1c"],
};
const corFolheto = (loja) => FOLHETO_CORES[loja] || ["#059669", "#047857"];

/* ─── Card de combustível na Home (dados reais DGEG) ─── */
function CardCombustivelHome({ setTab }) {
  const [dados, setDados] = useState(null);      // { preco, marca, nome?, distancia?, perto }
  const [aLocalizar, setALocalizar] = useState(false);

  function escolherGasoleo(lista, campoTipo) {
    if (!lista?.length) return null;
    const g = lista.filter(x => (x[campoTipo] || "").toLowerCase() === "gasóleo");
    return (g.length ? g : lista).slice().sort((a, b) => a.preco - b.preco)[0] || null;
  }

  function buscarPerto(lat, lon) {
    setALocalizar(true);
    fetch(`/api/combustiveis?lat=${lat}&lon=${lon}&raio=15`)
      .then(r => r.json())
      .then(j => {
        setALocalizar(false);
        if (!j.success) return;
        const best = escolherGasoleo(j.estacoes, "tipoLabel");
        if (best) setDados({ preco: best.preco, marca: best.marca || best.nome, nome: best.nome, distancia: best.distancia, perto: true });
      })
      .catch(() => setALocalizar(false));
  }

  useEffect(() => {
    let vivo = true;
    // Preço nacional mais barato — imediato, sem pedir localização
    fetch("/api/combustiveis")
      .then(r => r.json())
      .then(j => {
        if (!vivo || !j.success) return;
        const best = escolherGasoleo(j.dados, "tipo");
        if (best) setDados(prev => prev?.perto ? prev : { preco: best.preco, marca: best.posto, perto: false });
      })
      .catch(() => {});
    // Se a localização já foi autorizada antes, mostra logo o mais barato perto
    navigator.permissions?.query?.({ name: "geolocation" })
      .then(p => { if (vivo && p.state === "granted" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => vivo && buscarPerto(pos.coords.latitude, pos.coords.longitude), () => {});
      }}).catch(() => {});
    return () => { vivo = false; };
  }, []);

  function pedirLocalizacao(e) {
    e.stopPropagation();
    if (!navigator.geolocation) return;
    setALocalizar(true);
    navigator.geolocation.getCurrentPosition(
      pos => buscarPerto(pos.coords.latitude, pos.coords.longitude),
      () => setALocalizar(false)
    );
  }

  return (
    <button onClick={() => setTab("mobilidade")}
      className="pj-tap w-full text-left rounded-[22px] px-[18px] py-4 text-white flex items-center justify-between gap-3"
      style={{ background: "linear-gradient(150deg,#0f2a20,#143a2c)", boxShadow: "0 10px 24px -12px rgba(15,42,32,0.6)" }}>
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold opacity-75 flex items-center gap-1.5">
          <Fuel size={13} strokeWidth={1.9} />
          {dados?.perto ? "Gasóleo mais barato perto de ti" : "Gasóleo mais barato"}
        </div>
        {dados ? (
          <>
            <div className="text-[15px] font-extrabold mt-1 truncate">{dados.marca || "—"}</div>
            <div className="text-[11.5px] opacity-70 mt-0.5">
              {dados.perto
                ? <>{dados.distancia ? `a ${dados.distancia} km · ` : ""}toca para ver no mapa</>
                : <>preço nacional · <span onClick={pedirLocalizacao} className="underline font-bold" style={{ color: "#6ee7b7" }}>{aLocalizar ? "a localizar…" : "ver perto de ti"}</span></>}
            </div>
          </>
        ) : (
          <div className="text-[15px] font-extrabold mt-1">Postos e preços perto de ti</div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {dados
          ? <div className="font-display text-[26px] font-extrabold" style={{ color: "#6ee7b7" }}>{dados.preco.toFixed(3).replace(".", ",")}<span className="text-[14px]">€</span></div>
          : <ChevronRight size={20} className="opacity-80" />}
      </div>
    </button>
  );
}

/* ─── Ecrã Início ─── */
function EcraInicio({ user, setTab, goGarantias, onAbrirAvisos, onAbrirDefinicoes, avisosCount = 0 }) {
  const primeiroNome = user?.nome?.split(" ")[0] || "aí";

  const [totalMes, setTotalMes]       = useState(0);
  const [totalSempre, setTotalSempre] = useState(0);
  const [estadoDesafio, setEstadoDesafio] = useState(null);
  const [folhetos, setFolhetos]   = useState([]);
  const [streak, setStreak]       = useState(0);
  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const mesAtual = new Date().toISOString().slice(0, 7);
      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado > 0);
      const doMes = compras.filter(t => (t.dataCompra || t.criadoEm || "").slice(0, 7) === mesAtual);
      setTotalMes(doMes.reduce((s, t) => s + (t.valorPoupado || 0), 0));
      setTotalSempre(compras.reduce((s, t) => s + (t.valorPoupado || 0), 0));
    } catch {}
    setEstadoDesafio(calcularEstado());
    setStreak(calcStreak());
    fetch("/api/folhetos").then(r => r.json()).then(d => setFolhetos(d.folhetos || [])).catch(() => {});
  }, []);

  // Dados derivados para o novo ecrã
  const nivel     = nivelAtual(totalSempre);
  const mesNome   = new Date().toLocaleDateString("pt-PT", { month: "long" });
  const inteiroMes = Math.floor(totalMes);
  const animMes   = useCountUp(inteiroMes, 1100);
  const decMes    = String(Math.round((totalMes - inteiroMes) * 100)).padStart(2, "0");

  const FEATURES = [
    // Ordenado por frequência de uso: semanal → mensal → ocasional → sazonal
    { icon: Tag,           label: "Folhetos",           desc: "Supermercados desta semana",            iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", tab: "mercados" },
    { icon: ListChecks,    label: "Lista de compras",  desc: "Organiza antes de ir às compras",      iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "lista" },
    { icon: Fuel,          label: "Combustíveis",        desc: "Preços e postos perto de ti",          iconBg: "bg-orange-50",   iconColor: "text-orange-500",  tab: "mobilidade" },
    { icon: Receipt,       label: "Os meus talões",    desc: "Compras e garantias",                   iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "taloes" },
    { icon: CalendarClock, label: "Contas fixas",       desc: "Renda, luz, água — tudo controlado",   iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "contas" },
    { icon: Store,         label: "Lojas",              desc: "Moda, eletrónica e desporto",           iconBg: "bg-slate-100",   iconColor: "text-slate-500",   tab: "lojas" },
    { icon: Landmark,      label: "Apoios do Estado",   desc: "Benefícios a que tens direito",         iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "apoios" },
    { icon: Building2,     label: "A tua casa",         desc: "Crédito, renda e Euribor",              iconBg: "bg-indigo-50",   iconColor: "text-indigo-600",  tab: "casa" },
    { icon: Calculator,    label: "Simulador de IRS",   desc: "Estima o teu reembolso",                iconBg: "bg-fuchsia-50",  iconColor: "text-fuchsia-600", tab: "irs" },
  ];


  return (
    <div className="pb-28">

      {/* Cabeçalho — saudação + nível + notificações + perfil */}
      <div className="px-4 pt-11 pb-1 flex items-center justify-between anim-up">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500">{saudacaoHora()},</span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#a16207" }}>
              <Star size={10} className="fill-current" /> Nível {nivel.idx + 1}
            </span>
          </div>
          <p className="font-display text-[22px] font-extrabold text-slate-900 leading-tight tracking-tight capitalize">{primeiroNome}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={onAbrirAvisos}
            className="press relative w-[42px] h-[42px] rounded-[14px] bg-white flex items-center justify-center"
            style={{ boxShadow: "0 2px 8px rgba(15,42,32,0.06)" }}>
            <Bell size={20} className="text-slate-700" />
            {avisosCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
          </button>
          <button onClick={onAbrirDefinicoes}
            className="press w-[42px] h-[42px] rounded-[14px] flex items-center justify-center text-white font-display font-extrabold text-[17px]"
            style={{ background: "linear-gradient(140deg,#34d399,#059669)", boxShadow: "0 4px 10px rgba(5,150,105,0.32)" }}>
            {(primeiroNome[0] || "P").toUpperCase()}
          </button>
        </div>
      </div>

      {/* HERO — poupança do mês (count-up) + meta + streak */}
      <div className="px-4 pt-2">
        <button onClick={() => setTab("poupanca")}
          className="pj-tap relative overflow-hidden rounded-[26px] p-[22px] text-white w-full text-left block anim-up anim-up-1"
          style={{ background: "linear-gradient(155deg,#10b981 0%,#059669 52%,#047857 100%)", boxShadow: "0 20px 40px -16px rgba(5,150,105,0.55)" }}>
          <div className="pj-sheen absolute top-0 bottom-0 left-0 w-[70px] pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)" }} />
          <div className="absolute -right-8 -top-8 w-[150px] h-[150px] rounded-full" style={{ background: "rgba(255,255,255,0.09)" }} />
          <div className="absolute right-8 -bottom-12 w-[110px] h-[110px] rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-[12.5px] font-semibold opacity-90 capitalize">Poupaste em {mesNome}</p>
              <p className="font-display text-[42px] font-extrabold leading-none tracking-tight mt-0.5">
                €{Math.floor(animMes)}<span className="text-[24px] opacity-80">,{decMes}</span>
              </p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold"
              style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)" }}>
              🔥 {Math.max(streak, 1)} dia{Math.max(streak, 1) !== 1 ? "s" : ""}
            </span>
          </div>
          {estadoDesafio && (() => {
            const pctMeta = Math.min(Math.round(estadoDesafio.progresso * 100), 100);
            return (
              <div className="relative mt-[18px]">
                <div className="flex justify-between text-[11.5px] font-semibold opacity-90 mb-[7px]">
                  <span>Meta do mês · €{estadoDesafio.desafio.meta}</span><span>{pctMeta}%</span>
                </div>
                <div className="h-[9px] rounded-full" style={{ background: "rgba(255,255,255,0.22)" }}>
                  <div className="h-full rounded-full pj-bar"
                    style={{ width: `${pctMeta}%`, "--pj-final-width": `${pctMeta}%`, background: "linear-gradient(90deg,#fde68a,#fbbf24)" }} />
                </div>
              </div>
            );
          })()}
        </button>
      </div>

      {/* Ações rápidas */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2.5 anim-up anim-up-2">
        {[
          { Icon: Receipt,     label: "Talões",      bg: "#ecfdf5", color: "#059669", on: () => setTab("taloes") },
          { Icon: Fuel,        label: "Combustível", bg: "#fff7ed", color: "#ea580c", on: () => setTab("mobilidade") },
          { Icon: ShieldCheck, label: "Garantias",   bg: "#eff6ff", color: "#2563eb", on: goGarantias },
          { Icon: Landmark,    label: "Apoios",      bg: "#f5f3ff", color: "#7c3aed", on: () => setTab("apoios") },
        ].map((a, i) => (
          <button key={i} onClick={a.on}
            className="pj-tap bg-white rounded-[18px] py-3.5 px-1.5 flex flex-col items-center gap-1.5"
            style={{ boxShadow: "0 2px 10px rgba(15,42,32,0.05)" }}>
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: a.bg, color: a.color }}>
              <a.Icon size={22} strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: "#3a4a43" }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Desafio do mês */}
      {estadoDesafio && (() => {
        const d = estadoDesafio.desafio;
        const pct = Math.min(Math.round(estadoDesafio.progresso * 100), 100);
        const completo = estadoDesafio.completo;
        const falta = Math.max(0, d.meta - estadoDesafio.totalMes);
        return (
          <div className="px-4 mt-4 anim-up anim-up-3">
            <button onClick={() => setTab("poupanca")}
              className="pj-tap w-full text-left bg-white rounded-[22px] p-[18px] border border-[#eef2f0]"
              style={{ boxShadow: "0 2px 12px rgba(15,42,32,0.06)" }}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(140deg,#fb7185,#e11d48)" }}>
                    <Trophy size={20} strokeWidth={1.9} />
                  </div>
                  <div>
                    <p className="font-display text-[14px] font-extrabold text-slate-900 leading-tight">{d.nome}</p>
                    <p className="text-[11.5px] font-semibold" style={{ color: "#8a968f" }}>Meta de €{d.meta} este mês</p>
                  </div>
                </div>
                <span className="text-[12px] font-extrabold" style={{ color: "#e11d48" }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#f1eaec" }}>
                <div className="h-full rounded-full pj-bar"
                  style={{ width: `${pct}%`, "--pj-final-width": `${pct}%`, background: "linear-gradient(90deg,#fb7185,#e11d48)" }} />
              </div>
              <p className="mt-3 text-[11.5px] font-semibold" style={{ color: "#8a968f" }}>
                {completo
                  ? <>Desafio <b style={{ color: "#e11d48" }}>completo</b> 🏆 — parabéns!</>
                  : <>Faltam <b style={{ color: "#e11d48" }}>€{falta.toFixed(0)}</b> para <b className="text-slate-900">completares</b></>}
              </p>
            </button>
          </div>
        );
      })()}

      {/* Folhetos desta semana — carrossel */}
      {folhetos.length > 0 && (
        <div className="mt-4 anim-up anim-up-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <span className="font-display text-[16px] font-extrabold text-slate-900">Folhetos desta semana</span>
            <button onClick={() => setTab("mercados")} className="press text-[12px] font-bold text-emerald-600">Ver todos</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {folhetos.slice(0, 8).map((f, i) => {
              const [c1, c2] = corFolheto(f.loja);
              return (
                <button key={f.id || i}
                  onClick={() => f.url ? window.open(f.url, "_blank", "noopener") : setTab("mercados")}
                  className="pj-tap flex-shrink-0 w-[138px] bg-white rounded-[18px] overflow-hidden text-left"
                  style={{ boxShadow: "0 3px 12px rgba(15,42,32,0.07)" }}>
                  <div className="h-[88px] flex items-center justify-center text-white font-extrabold text-[15px] px-2 text-center leading-tight"
                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>{f.loja}</div>
                  <div className="p-3">
                    <p className="text-[12.5px] font-bold text-slate-900 leading-tight"
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {f.titulo || "Folheto desta semana"}
                    </p>
                    <p className="text-[11px] font-bold mt-1" style={{ color: "#8a968f" }}>{f.validade || "em vigor"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Combustível perto de ti — dados reais */}
      <div className="px-4 mt-4 anim-up anim-up-4">
        <CardCombustivelHome setTab={setTab} />
      </div>

      {/* Explorar tudo — acesso a todas as secções */}
      <div className="px-4 mt-5 anim-up anim-up-4">
        <SectionLabel icon={Sparkles}>Explorar tudo</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => f.tab && setTab(f.tab)}
              className="press bg-white rounded-xl border border-slate-100 text-left flex items-center gap-3 p-3"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)" }}
            >
              <div className={`${f.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 w-9 h-9`}>
                <f.icon size={17} className={f.iconColor} />
              </div>
              <p className="font-black text-slate-800 leading-tight text-[12.5px] flex-1 min-w-0">{f.label}</p>
            </button>
          ))}
        </div>
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
          className="rounded-2xl p-6 overflow-hidden"
          style={{ background: "linear-gradient(150deg,#1d4ed8 0%,#2563eb 100%)", boxShadow: "0 8px 32px -8px rgba(37,99,235,0.35)" }}
        >
          <p className="text-[12px] text-blue-200 mb-1">Total poupado este mês</p>
          <p className="text-[44px] font-black text-white leading-none tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>
            {dados ? `€${dados.totalMes.toFixed(2)}` : "€0.00"}
          </p>
          {dados && dados.totalGeral > 0 ? (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <p className="text-[12px] text-blue-200">
                €{dados.totalGeral.toFixed(2)} no total · {dados.count} talões
              </p>
              {dados.tendencia !== 0 && dados.totalAnterior > 0 && (
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${dados.tendencia > 0 ? "bg-white/20 text-white" : "bg-red-400/30 text-red-100"}`}>
                  {dados.tendencia > 0 ? "+" : ""}{dados.tendencia}% vs mês anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-blue-200 mt-1">Guarda talões com o valor poupado para ver aqui.</p>
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
  const [modalInstalarAberto, setModalInstalarAberto] = useState(false);
  const { modo: installModo, prompt: installPrompt } = useInstallDetect();

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

  /* Regista plataforma e estado de instalação PWA no Supabase */
  useEffect(() => {
    if (!user?.id) return;
    try {
      const isPwa = window.matchMedia("(display-mode: standalone)").matches ||
                    window.navigator.standalone === true;
      const ua = navigator.userAgent;
      const platform = /iphone|ipad|ipod/i.test(ua) ? "ios"
                     : /android/i.test(ua)           ? "android"
                     : "desktop";
      supabase.from("dados_utilizador").upsert({
        user_id: user.id,
        chave: "poupeja_dispositivo",
        valor: { pwa: isPwa, platform, atualizado: new Date().toISOString() },
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "user_id,chave" }).then(() => {});
    } catch {}
  }, [user?.id]);

  /* Pede permissão de push automaticamente ao fazer login (se ainda não foi pedida) */
  useEffect(() => {
    if (!user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC) return;

    // Se já tem permissão concedida, subscreve sem pedir de novo (VAPID podem ter sido adicionadas depois)
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async reg => {
        const jaSubscrito = await reg.pushManager.getSubscription();
        if (jaSubscrito) return;
        function urlBase64ToUint8Array(b) {
          const pad = "=".repeat((4 - (b.length % 4)) % 4);
          const base64 = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
          const raw = atob(base64);
          return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
        }
        try {
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) });
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch("/api/push-subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ subscription: sub }),
            });
          }
        } catch {}
      });
      return;
    }

    if (Notification.permission !== "default") return;

    const timer = setTimeout(async () => {
      try {
        // Se já foi pedido mas não há subscrição ativa, pede de novo
        const jaAtivou = localStorage.getItem("poupeja_push_pedido");
        if (jaAtivou) {
          const regAtual = await navigator.serviceWorker.ready;
          const subAtual = await regAtual.pushManager.getSubscription().catch(() => null);
          if (subAtual) return;
          localStorage.removeItem("poupeja_push_pedido");
        }
        localStorage.setItem("poupeja_push_pedido", "1");

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
    return () => clearTimeout(timer); // evita disparar após desmontar/trocar de utilizador
  }, [user?.id]);

  /* Convite a instalar: logo na 1ª visita e depois a relembrar (3ª e a cada 5) */
  useEffect(() => {
    if (!hydrated || !installModo || installModo === "instalado") return;
    if (sessionStorage.getItem("poupeja_modal_ja_aberto")) return;
    const ndispensas = parseInt(localStorage.getItem("poupeja_ndispensas") || "0");
    if (ndispensas >= 3) return; // já dispensou 3+ vezes, não forçar mais
    const visitas = parseInt(localStorage.getItem("poupeja_visitas") || "0") + 1;
    localStorage.setItem("poupeja_visitas", String(visitas));
    if (visitas === 1 || visitas === 3 || (visitas > 3 && visitas % 5 === 0)) {
      sessionStorage.setItem("poupeja_modal_ja_aberto", "1");
      setTimeout(() => setModalInstalarAberto(true), 2500);
    }
  }, [hydrated, installModo]);

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

  async function instalarAndroid() {
    if (!installPrompt) return;
    setModalInstalarAberto(false);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("poupeja_ndispensas", "99"); // evita mostrar de novo
    }
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
            {/* Header — escondido no Início (que tem cabeçalho próprio no ecrã) */}
            {tab !== "inicio" && (<header
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
            </header>)}

            {/* Barra de instalação — todos os ecrãs */}
            {installModo !== "instalado" && (
              <BarraInstalacao
                modo={installModo}
                onAbrir={() => setModalInstalarAberto(true)}
                onInstalarDireto={installModo === "android" ? instalarAndroid : null}
              />
            )}

            {/* Conteúdo */}
            <main style={{ overflowX: "hidden" }}>
              <div key={`${tab}-${syncTick}`} data-dir={dir}>
                {tab === "inicio"     && <EcraInicio user={user} setTab={go} goGarantias={goGarantias} onAbrirAvisos={() => { calcGarantiasAviso(); setVerAvisos(true); }} onAbrirDefinicoes={() => { setDir("up"); setVerDefs(true); setTabRaw("inicio"); }} avisosCount={garantiasAviso.length} />}
                {tab === "mercados"   && <SecaoMercados />}
                {tab === "lojas"      && <SecaoLojas />}
                {tab === "mobilidade" && <SecaoMobilidade />}
                {tab === "poupanca"   && <SecaoPoupanca setTab={go} />}
                {tab === "apoios"     && <SecaoApoios />}
                {tab === "contas"     && <SecaoContas />}
                {tab === "casa"       && <SecaoCasa />}
                {tab === "irs"        && (
                  <div className="pt-4">
                    <button onClick={() => go("inicio")} className="press mx-4 mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-400">
                      <ArrowLeft size={15} /> Voltar
                    </button>
                    <SecaoIRS />
                  </div>
                )}
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
              <div className="flex items-center justify-between px-1 py-1.5">
                {NAV.map(it => {
                  const active = tab === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => navClick(it.id)}
                      className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-colors duration-150 ${active ? "bg-emerald-50" : ""}`}
                    >
                      <it.icon
                        size={18}
                        className={`transition-colors duration-150 ${active ? "text-emerald-600" : "text-slate-400"} ${bounce === it.id ? "nav-icon-active" : ""}`}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                      <span className={`text-[8px] font-black transition-colors duration-150 ${active ? "text-emerald-600" : "text-slate-400"}`}>
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

        {/* Modal de instalação */}
        {modalInstalarAberto && installModo && installModo !== "instalado" && (
          <ModalInstalar
            modo={installModo}
            onFechar={() => setModalInstalarAberto(false)}
            onInstalarAndroid={installModo === "android" ? instalarAndroid : null}
          />
        )}

      </div>
    </>
  );
}
