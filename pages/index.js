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
import { calcularEstado } from "../lib/desafios";

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

/* ─── Modal de instruções de instalação ─── */
function ModalInstalar({ modo, onFechar, onInstalarAndroid }) {
  if (!modo) return null;

  const beneficios = [
    { emoji: "🔔", texto: "Notificações dos folhetos toda a segunda-feira de manhã" },
    { emoji: "⚡", texto: "Acesso instantâneo — abre como uma app, sem abrir o browser" },
    { emoji: "📶", texto: "Funciona sem internet — consulta as listas e contas offline" },
    { emoji: "🏠", texto: "Ícone no ecrã inicial, como qualquer outra app" },
  ];

  const passos = modo === "ios" ? [
    { emoji: "1️⃣", titulo: "Abre no Safari", desc: "Tens de estar no Safari (não Chrome nem Firefox). Se estás noutro browser, copia o link e abre no Safari." },
    { emoji: "⬆️", titulo: "Toca no ícone Partilhar", desc: "Na barra de baixo do Safari — parece uma caixa com uma seta a apontar para cima ↑" },
    { emoji: "📲", titulo: "\"Adicionar ao Ecrã Inicial\"", desc: "Faz scroll na lista que aparece e toca em \"Adicionar ao Ecrã Inicial\". Pode estar a meio da lista." },
    { emoji: "✅", titulo: "Toca em \"Adicionar\"", desc: "No canto superior direito. O ícone do PoupeJá aparece imediatamente no teu ecrã!" },
  ] : [
    { emoji: "📲", titulo: "Toca em \"Instalar agora\"", desc: "Aparece um popup do sistema a perguntar se queres instalar o PoupeJá." },
    { emoji: "✅", titulo: "Confirma a instalação", desc: "Toca em \"Instalar\" no popup. O ícone fica no ecrã imediatamente — é gratuito." },
    { emoji: "🔔", titulo: "Ativa notificações", desc: "Permite notificações e recebe os folhetos semanais automaticamente." },
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

          {/* Separador */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-100" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Como instalar</p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Passos */}
          <div className="flex flex-col gap-3.5">
            {passos.map((p, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-xl border border-slate-100">
                  {p.emoji}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-black text-slate-800">{p.titulo}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nota iOS sobre Safari */}
        {modo === "ios" && (
          <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              ⚠️ <strong>Só funciona no Safari.</strong> Se estás a usar o Chrome, o Firefox ou o Edge — este passo não vai funcionar. Copia o endereço e abre no Safari primeiro.
            </p>
          </div>
        )}

        {/* Botões de ação */}
        <div className="px-5 pb-8 flex flex-col gap-2.5">
          {modo === "android" && onInstalarAndroid && (
            <button
              onClick={onInstalarAndroid}
              className="w-full py-4 rounded-2xl text-white font-black text-base"
              style={{ background: "linear-gradient(135deg,#065f46,#059669)", boxShadow: "0 8px 20px -6px rgba(5,150,105,0.5)" }}
            >
              📲 Instalar agora — é grátis
            </button>
          )}
          <button
            onClick={onFechar}
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-500 font-black text-sm"
          >
            Fechar
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

/* ─── Dicas diárias (índice = dayOfYear % 30) ─── */
const DICAS_DIA = [
  { emoji: "🛒", titulo: "Compara antes de comprar", texto: "Vê os folhetos de todos os supermercados antes de sair de casa — podes poupar até 30% na mesma lista." },
  { emoji: "⛽", titulo: "Abastece antes de quarta", texto: "Os preços dos combustíveis sobem frequentemente às quartas. Antecipar o abastecimento poupa alguns cêntimos por litro." },
  { emoji: "💳", titulo: "Usa cartão de fidelização", texto: "Programas de pontos do Continente, Pingo Doce e Lidl Plus acumulam descontos reais — vale a pena ativar." },
  { emoji: "🥦", titulo: "Compra fruta e legumes da época", texto: "Produtos sazonais são até 50% mais baratos e chegam ao mercado no seu melhor estado." },
  { emoji: "🏷️", titulo: "Marcas próprias poupam muito", texto: "As marcas do distribuidor têm qualidade similar às de referência a 20–40% menos." },
  { emoji: "📋", titulo: "Lista de compras", texto: "Ir ao supermercado com lista reduz as compras por impulso em até 40%. Usa a lista aqui no PoupeJá." },
  { emoji: "🧊", titulo: "Congela o pão", texto: "Congela pão fatiado e descongela só o que precisas. Cortas o desperdício e as idas ao supermercado." },
  { emoji: "💡", titulo: "Desliga o standby", texto: "Equipamentos em standby podem custar até €50/ano. Um filtro com interruptor resolve o problema." },
  { emoji: "🚿", titulo: "Duche em vez de banho", texto: "Um duche de 5 min usa ~35L; um banho usa ~150L. A diferença pode valer €120/ano na água." },
  { emoji: "📱", titulo: "Compara tarifas de telemóvel", texto: "O mercado de telecomunicações mudou muito. Comparar tarifas pode poupar-te €20+ por mês." },
  { emoji: "🏠", titulo: "Renegocia o crédito habitação", texto: "Com a Euribor a baixar, simula a transferência do crédito. A diferença pode ser centenas de euros por ano." },
  { emoji: "🔒", titulo: "Seguro auto: compara ao renovar", texto: "Mudar de seguradora ao renovar poupa frequentemente 20–30% na apólice — vale sempre a pena comparar." },
  { emoji: "🎵", titulo: "Audita as tuas subscrições", texto: "A maioria das pessoas paga subscrições que não usa. Revê tudo uma vez por mês e cancela o que não vale." },
  { emoji: "☀️", titulo: "Painéis solares: simula já", texto: "Painéis solares amortizam em 7–10 anos e reduzem a fatura de eletricidade em 60–80%." },
  { emoji: "🛁", titulo: "Repara torneiras a pingar", texto: "Uma torneira a pingar desperdiça 20L/dia — até €15/mês na fatura de água. Vale uma visita ao canalizador." },
  { emoji: "🚗", titulo: "Calibra os pneus mensalmente", texto: "Pneus murchos aumentam o consumo em 3–4%. Uma visita rápida ao posto poupa combustível." },
  { emoji: "🍳", titulo: "Usa panela de pressão", texto: "Reduz o tempo de cozimento até 70% — e a conta da eletricidade. Ideal para leguminosas e guisados." },
  { emoji: "🌡️", titulo: "Termostato a 19 °C", texto: "Por cada grau extra no aquecimento, a conta de gás sobe ~7%. Um simples ajuste faz diferença no final do mês." },
  { emoji: "📦", titulo: "Compra a granel o que usas muito", texto: "Papel higiénico, detergente, café, arroz — em grandes quantidades poupas até 40% por unidade." },
  { emoji: "💧", titulo: "Água da torneira é segura", texto: "Em Portugal a água da torneira é tratada e controlada. Usar garrafa filtrante poupa €30+/mês vs. garrafas." },
  { emoji: "🔄", titulo: "Segunda mão primeiro", texto: "Roupa, livros, eletrodomésticos — OLX e Vinted têm tudo a preços imbatíveis. Experimenta antes de comprar novo." },
  { emoji: "📉", titulo: "Pede revisão do spread", texto: "Se tens crédito habitação há mais de 3 anos, pede ao banco uma revisão das condições. Pouparás na prestação." },
  { emoji: "🛍️", titulo: "Cashback em compras online", texto: "Sites de cashback devolvem uma percentagem nas lojas onde já compras — sem mudar os teus hábitos." },
  { emoji: "🥩", titulo: "Congela carne em promoção", texto: "Quando encontrares carne em promoção, compra em quantidade e congela em porções. Poupa e evitas desperdício." },
  { emoji: "🔋", titulo: "Carrega dispositivos de noite", texto: "Nas tarifas bihorárias, a eletricidade é mais barata fora do horário de ponta. Programa os carregamentos à noite." },
  { emoji: "📊", titulo: "Regista o que gastas", texto: "Quem regista as despesas mensais poupa em média 18% mais. Usa as Contas Fixas aqui no PoupeJá." },
  { emoji: "🎭", titulo: "Entretenimento gratuito", texto: "Portugal tem museus, jardins, trilhos e mercados com entrada livre. Há sempre algo para fazer sem gastar." },
  { emoji: "🏋️", titulo: "Ginásio: compara preços", texto: "Ginásios low-cost e municipais custam um terço dos ginásios premium — com equipamento equivalente." },
  { emoji: "🍕", titulo: "Cozinha em lote ao domingo", texto: "Preparar refeições para a semana ao domingo evita take-away durante a semana e poupa tempo e dinheiro." },
  { emoji: "🔌", titulo: "Muda de comercializador de energia", texto: "No mercado liberalizado podes mudar de fornecedor de eletricidade e gás. Compara tarifas e poupa por ano." },
];

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

function dicaHoje() {
  const d = new Date();
  const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return DICAS_DIA[dia % DICAS_DIA.length];
}

/* ─── Cartão Diário ─── */
function calcLembreteCasa() {
  try {
    const d = JSON.parse(localStorage.getItem("poupeja_casa") || "{}");
    const candidatos = [];
    if (d.credito?.dataRevisao) {
      const [a, m] = d.credito.dataRevisao.split("-").map(Number);
      const dias = Math.round((new Date(a, m - 1, 1) - new Date()) / 86400000);
      if (dias >= 0 && dias <= 60) candidatos.push({ dias, texto: "Revisão do crédito habitação", tab: "casa", emoji: "🏠" });
    }
    if (d.renda?.mesRevisao) {
      const hoje = new Date();
      let ano = hoje.getFullYear();
      if (hoje.getMonth() + 1 >= d.renda.mesRevisao) ano++;
      const dias = Math.round((new Date(ano, d.renda.mesRevisao - 1, 1) - hoje) / 86400000);
      if (dias >= 0 && dias <= 60) candidatos.push({ dias, texto: "Revisão da renda", tab: "casa", emoji: "🏢" });
    }
    candidatos.sort((x, y) => x.dias - y.dias);
    return candidatos[0] || null;
  } catch { return null; }
}

function calcContasMes() {
  try {
    const contas = JSON.parse(localStorage.getItem("poupeja_contas") || "[]");
    return contas.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  } catch { return 0; }
}

function CartaoDiario({ setTab }) {
  const [streak, setStreak]       = useState(1);
  const [contasMes, setContasMes] = useState(null);
  const [folheto, setFolheto]     = useState(null);
  const [dicaAberta, setDicaAberta] = useState(false);
  const [lembrete, setLembrete]   = useState(null);

  useEffect(() => {
    setStreak(calcStreak());
    setLembrete(calcLembreteCasa());
    setContasMes(calcContasMes());

    fetch("/api/folhetos")
      .then(r => r.json())
      .then(data => {
        const lista = data.folhetos || [];
        if (!lista.length) return;
        const d = new Date();
        const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
        const destacados = lista.filter(f => f.destaque);
        const pool = destacados.length ? destacados : lista;
        setFolheto(pool[dia % pool.length]);
      })
      .catch(() => {});
  }, []);

  const dica = dicaHoje();
  const hoje = new Date().toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "long" });

  return (
    <div
      className="mx-4 mt-4 rounded-3xl overflow-hidden anim-up anim-up-1"
      style={{ background: "linear-gradient(135deg,#0c1829,#1a2744)", boxShadow: "0 20px 48px -14px rgba(12,24,41,0.5)" }}
    >
      {/* Cabeçalho */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumo do dia</p>
          <p className="text-[13px] font-black text-white capitalize">{hoje}</p>
        </div>
        {streak >= 2 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <span className="text-sm">🔥</span>
            <span className="text-[11px] font-black text-amber-400">{streak} dias seguidos</span>
          </div>
        )}
      </div>

      {/* 3 mini-cards */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {/* Contas fixas */}
        <button
          onClick={() => setTab("contas")}
          className="press rounded-2xl p-3 flex flex-col items-start text-left"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-lg mb-1.5">📋</span>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Contas fixas</p>
          {contasMes !== null ? (
            contasMes > 0 ? (
              <p className="text-[15px] font-black text-white mt-0.5 leading-none">€{contasMes.toFixed(0)}</p>
            ) : (
              <p className="text-[11px] font-black text-slate-500 mt-0.5 leading-tight">Sem dados</p>
            )
          ) : (
            <div className="h-5 w-14 rounded-lg mt-0.5 animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
          )}
          <p className="text-[9px] text-slate-600 mt-0.5">por mês</p>
        </button>

        {/* Folheto */}
        <button
          onClick={() => folheto?.url ? window.open(folheto.url, "_blank", "noopener") : setTab("mercados")}
          className="press rounded-2xl p-3 flex flex-col items-start text-left"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-lg mb-1.5">🛒</span>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Folheto</p>
          <p className="text-[13px] font-black text-white mt-0.5 leading-tight" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {folheto?.loja || "—"}
          </p>
          <p className="text-[9px] text-slate-600 mt-0.5">{folheto?.validade || "em vigor"}</p>
        </button>

        {/* Dica */}
        <button
          onClick={() => setDicaAberta(v => !v)}
          className="press rounded-2xl p-3 flex flex-col items-start text-left"
          style={{ background: dicaAberta ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.06)", border: dicaAberta ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-lg mb-1.5">{dica.emoji}</span>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Dica</p>
          <p className="text-[11px] font-black text-white mt-0.5 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {dica.titulo}
          </p>
        </button>
      </div>

      {/* Expansão da dica */}
      {dicaAberta && (
        <div className="mx-3 mb-3 px-3.5 py-3 rounded-2xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <p className="text-[12px] text-slate-300 leading-relaxed">{dica.texto}</p>
        </div>
      )}

      {/* Lembrete proativo — revisão de crédito/renda a chegar */}
      {lembrete && (
        <button
          onClick={() => setTab(lembrete.tab)}
          className="press w-full mx-3 mb-3 px-3.5 py-3 rounded-2xl flex items-center gap-3 text-left"
          style={{ width: "calc(100% - 1.5rem)", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
        >
          <span className="text-xl">{lembrete.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-white leading-tight">{lembrete.texto}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">
              {lembrete.dias === 0 ? "É hoje!" : `Daqui a ${lembrete.dias} dia${lembrete.dias !== 1 ? "s" : ""}`} · toca para ver
            </p>
          </div>
          <ChevronRight size={15} className="text-blue-300 flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

/* ─── Ecrã Início ─── */
function EcraInicio({ user, setTab, goGarantias, installModo, onAbrirInstalar, onInstalarAndroid }) {
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
    { icon: ListChecks,    label: "Lista de compras",  desc: "Organiza antes de ir às compras",      iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "lista",     full: true },
    { icon: Receipt,       label: "Os meus talões",    desc: "Compras e garantias",                   iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "taloes" },
    { icon: Tag,           label: "Folhetos",           desc: "Supermercados desta semana",            iconBg: "bg-emerald-50",  iconColor: "text-emerald-600", tab: "mercados" },
    { icon: Fuel,          label: "Combustíveis",        desc: "Preços e postos perto de ti",          iconBg: "bg-orange-50",   iconColor: "text-orange-500",  tab: "mobilidade" },
    { icon: Store,         label: "Lojas",              desc: "Moda, eletrónica e desporto",           iconBg: "bg-slate-100",   iconColor: "text-slate-500",   tab: "lojas" },
    { icon: Landmark,      label: "Apoios do Estado",   desc: "Benefícios a que tens direito",         iconBg: "bg-blue-50",     iconColor: "text-blue-600",    tab: "apoios" },
    { icon: CalendarClock, label: "Contas fixas",       desc: "Renda, luz, água — tudo controlado",   iconBg: "bg-violet-50",   iconColor: "text-violet-600",  tab: "contas" },
    { icon: Building2,     label: "A tua casa",         desc: "Crédito, renda e Euribor",              iconBg: "bg-indigo-50",   iconColor: "text-indigo-600",  tab: "casa" },
    { icon: Calculator,    label: "Simulador de IRS",   desc: "Estima o teu reembolso",                iconBg: "bg-fuchsia-50",  iconColor: "text-fuchsia-600", tab: "irs" },
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
    { icon: Building2,   label: "Casa",        color: "text-indigo-600",  bg: "bg-indigo-50",   tab: "casa" },
    { icon: Calculator,  label: "IRS",         color: "text-fuchsia-600", bg: "bg-fuchsia-50",  tab: "irs" },
  ];

  return (
    <div className="pb-28">

      {/* Hero boas-vindas */}
      <div className="px-4 pt-4 pb-2 anim-up">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(150deg,#047857 0%,#059669 100%)", boxShadow: "0 8px 32px -8px rgba(5,150,105,0.35)" }}
        >
          <div className="px-6 pt-6 pb-5">
            {totalSempre > 0 ? (
              <>
                <p className="text-[12px] text-emerald-200 mb-1">
                  Olá, {primeiroNome} · {totalMes > 0 ? "este mês poupaste" : "total poupado"}
                </p>
                <p className="text-[44px] font-black text-white leading-none tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>
                  €{(totalMes > 0 ? totalMes : totalSempre).toFixed(2)}
                </p>
                <p className="text-[12px] text-emerald-200 mt-1.5">
                  {totalMes > 0 && totalSempre > totalMes
                    ? <>€{totalSempre.toFixed(2)} no total · {nTaloes} tal{nTaloes !== 1 ? "ões" : "ão"}</>
                    : <>em {nTaloes} talão{nTaloes !== 1 ? "s" : ""}</>}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setTab("poupanca")}
                    className="press inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-black px-4 py-2 rounded-xl border border-white/20"
                  >
                    Ver detalhes <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => setTab("taloes")}
                    className="press inline-flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-black px-4 py-2 rounded-xl"
                  >
                    <Plus size={12} /> Talão
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] text-emerald-200">Olá, {primeiroNome}</p>
                <p className="text-[28px] font-black text-white mt-1 leading-tight" style={{ fontFamily: "'Sora', system-ui" }}>
                  Pronto para poupar<br />nas compras de hoje?
                </p>
                <button
                  onClick={() => setTab("taloes")}
                  className="press mt-4 inline-flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-black px-4 py-2.5 rounded-xl"
                >
                  Guardar primeiro talão <ArrowRight size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cartão diário: combustível, folheto, dica + streak */}
      <CartaoDiario setTab={setTab} />

      {/* Garantias highlight */}
      <div className="px-4 mt-3 anim-up anim-up-1">
        <button
          onClick={goGarantias}
          className="press w-full card p-4 flex items-center gap-3.5 text-left"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={19} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-black text-slate-800 leading-snug">Garantias digitais</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Nunca percas a validade dos teus produtos</p>
          </div>
          <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
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
      <div className="px-4 mt-4 anim-up anim-up-1">
        <SectionLabel icon={Sparkles}>O que podes fazer</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => f.tab && setTab(f.tab)}
              className={`press bg-white rounded-xl border border-slate-100 text-left ${f.full ? "col-span-2 lg:col-span-4 flex items-center gap-4 px-5 py-4" : "p-4"}`}
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)" }}
            >
              <div className={`${f.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ${f.full ? "w-12 h-12" : "w-10 h-10 mb-3"}`}>
                <f.icon size={f.full ? 21 : 18} className={f.iconColor} />
              </div>
              <div className={f.full ? "flex-1" : ""}>
                <p className={`font-black text-slate-800 leading-snug ${f.full ? "text-[15px]" : "text-[13px]"}`}>{f.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                {!f.full && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-slate-400">
                    Abrir <ChevronRight size={9} />
                  </div>
                )}
              </div>
              {f.full && <ChevronRight size={17} className="text-slate-300 flex-shrink-0" />}
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
      <div className="px-4 mt-4 mb-2 anim-up anim-up-3">
        <button
          onClick={() => setTab("mercados")}
          className="press w-full text-left card p-4 flex gap-3 items-start"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Star size={16} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-600 mb-0.5">Dica do dia</p>
            <p className="text-sm font-black text-slate-800">Vê os folhetos antes de ir às compras</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Compara as promoções de todos os supermercados e poupa mais.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-amber-600">
              Ver folhetos <ChevronRight size={10} />
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

  /* Abre o modal de instalação automaticamente na 3ª visita (e depois a cada 5) */
  useEffect(() => {
    if (!hydrated || !installModo || installModo === "instalado") return;
    if (sessionStorage.getItem("poupeja_modal_ja_aberto")) return;
    const ndispensas = parseInt(localStorage.getItem("poupeja_ndispensas") || "0");
    if (ndispensas >= 3) return; // já dispensou 3+ vezes, não forçar mais
    const visitas = parseInt(localStorage.getItem("poupeja_visitas") || "0") + 1;
    localStorage.setItem("poupeja_visitas", String(visitas));
    if (visitas === 3 || (visitas > 3 && visitas % 5 === 0)) {
      sessionStorage.setItem("poupeja_modal_ja_aberto", "1");
      setTimeout(() => setModalInstalarAberto(true), 3500);
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
                {tab === "inicio"     && <EcraInicio user={user} setTab={go} goGarantias={goGarantias} installModo={installModo} onAbrirInstalar={() => setModalInstalarAberto(true)} onInstalarAndroid={instalarAndroid} />}
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
