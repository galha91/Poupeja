import { useState, useEffect } from "react";
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
const SecaoEmentas     = dynamic(() => import("../SecaoEmentas"), { loading: carregandoSeccao });
const SecaoLojas       = dynamic(() => import("../SecaoLojas"), { loading: carregandoSeccao });
const SecaoMobilidade  = dynamic(() => import("../SecaoMobilidade"), { loading: carregandoSeccao });
const SecaoTaloes      = dynamic(() => import("../SecaoTaloes"), { loading: carregandoSeccao });
const SecaoListaCompras= dynamic(() => import("../SecaoListaCompras"), { loading: carregandoSeccao });
const SecaoDefinicoes  = dynamic(() => import("../SecaoDefinicoes"), { loading: carregandoSeccao });
const SecaoApoios      = dynamic(() => import("../SecaoApoios"), { loading: carregandoSeccao });
const SecaoContas      = dynamic(() => import("../SecaoContas"), { loading: carregandoSeccao });
const SecaoIRS         = dynamic(() => import("../SecaoIRS"), { loading: carregandoSeccao });
import EcraInicio from "../EcraInicio";
import SecaoPoupanca from "../SecaoPoupanca";
import ModalCriarConta from "../ModalCriarConta";
import { ModalInstalar, useInstallDetect, BarraInstalacao } from "../InstalarApp";
import PainelAvisos from "../PainelAvisos";
import RetratoMes from "../RetratoMes";
import { retratoPorVer, calcularRetrato } from "../lib/retrato";
import EcraAuth, { DefinirNovaPass, sessionParaUser } from "../EcraAuth";
import { supabase } from "../lib/supabase";
import { iniciarSync, pararSync } from "../lib/sync";
import {
  Home, ShoppingCart, Store, Fuel, PiggyBank, Bell, Users, ChefHat,
  Tag, ArrowLeft, Landmark, CalendarClock,
} from "lucide-react";
import { evento, ecra } from "../lib/analytics";

/* ─── nav config ─── */
/* A barra de baixo leva 5 separadores. Com 7 sobravam ~55px cada num
   telemóvel normal, o que obrigava a etiquetas de 8px — ilegíveis.
   Estes 5 são o que a app promete na entrada (folhetos, talões/poupança,
   combustível) mais o Início e as Contas, que trazem gente de volta pelos
   avisos de vencimento. */
const NAV = [
  { id: "inicio",     label: "Início",     icon: Home },
  { id: "mercados",   label: "Mercado",    icon: ShoppingCart },
  { id: "poupanca",   label: "Poupança",   icon: PiggyBank },
  { id: "contas",     label: "Contas",     icon: CalendarClock },
  { id: "mobilidade", label: "Mobilidade", icon: Fuel },
];

/* Usados menos vezes. Saem da barra de baixo, mas continuam a um toque
   no "Explorar tudo" do Início — e a barra lateral do desktop, que tem
   espaço vertical de sobra, mostra-os na mesma. */
const NAV_SECUNDARIO = [
  { id: "apoios",     label: "Apoios",     icon: Landmark },
  { id: "lojas",      label: "Lojas",      icon: Store },
];
const NAV_IDS = ["inicio","poupanca","mercados","contas","mobilidade","apoios","lojas","irs","taloes","lista"];

const TITULOS = {
  inicio:     { t: "Olá! Bem-vindo de volta",          s: "Vamos poupar nas compras de hoje?" },
  mercados:   { t: "Supermercados",                     s: "Folhetos e ementas económicas da semana" },
  lojas:      { t: "Lojas",                             s: "Moda, eletrónica e desporto com desconto" },
  mobilidade: { t: "Mobilidade",                        s: "Combustíveis e pontos de carregamento" },
  poupanca:   { t: "A tua poupança",                    s: "Quanto já poupaste este mês" },
  apoios:     { t: "Apoios do Estado",                  s: "Benefícios a que podes ter direito" },
  contas:     { t: "Contas",                            s: "Despesas fixas, crédito e renda" },
  irs:        { t: "Simulador de IRS",                   s: "Estima o teu IRS antes da hora" },
  taloes:     { t: "Os meus talões",                    s: "Compras e garantias num só sítio" },
  lista:      { t: "Lista de compras",                  s: "Os artigos que precisas de comprar" },
};



/* ─── Wrapper Mercados ─── */
function SecaoMercados({ setTab }) {
  const [sub, setSub] = useState("folhetos");
  return (
    <div className="pb-28 pt-4">
      <div className="flex gap-1 p-1 rounded-2xl mx-4 mb-4" style={{ background: "var(--pj-subtle)" }}>
        {[
          { id: "folhetos", icon: Tag, label: "Folhetos" },
          { id: "ementas", icon: ChefHat, label: "Ementas" },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setSub(o.id)}
            className={`pj-tap press flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${sub === o.id ? "shadow-sm" : ""}`}
            style={sub === o.id ? { background: "var(--pj-card)", color: "var(--pj-text)" } : { color: "var(--pj-text-faint)" }}
          >
            <o.icon size={13} /> {o.label}
          </button>
        ))}
      </div>
      {sub === "folhetos" && <SecaoFolhetos />}
      {sub === "ementas" && <SecaoEmentas setTab={setTab} />}
    </div>
  );
}

/* ─── Root App ─── */
export default function PoupeJa() {
  const [user, setUser]           = useState(null);
  const [hydrated, setHydrated]   = useState(false);
  const [recovery, setRecovery]   = useState(false);
  const [tab, setTabRaw]          = useState(() => {
    // Atalhos do manifest (?atalho=taloes|mobilidade|mercados): ler já no
    // inicializador — sobrevive a qualquer remontagem/corrida no boot.
    if (typeof window !== "undefined") {
      try {
        const a = new URLSearchParams(window.location.search).get("atalho");
        if (a && NAV_IDS.includes(a)) return a;
      } catch {}
    }
    return "inicio";
  });
  const [dir, setDir]             = useState("right");
  const [bounce, setBounce]       = useState(null);
  const [verAvisos, setVerAvisos]       = useState(false);
  const [verDefs, setVerDefs]           = useState(false);
  const [subTabTaloes, setSubTabTaloes] = useState("compras");
  const [garantiasAviso, setGarantiasAviso] = useState([]);
  const [syncTick, setSyncTick]         = useState(0);
  const [modalInstalarAberto, setModalInstalarAberto] = useState(false);
  const [modalConta, setModalConta] = useState(false);
  const [retrato, setRetrato] = useState(null);          // retrato do mês anterior, se houver dados
  const [bannerRetrato, setBannerRetrato] = useState(null); // só dias 1-7 e ainda não visto
  const [retratoAberto, setRetratoAberto] = useState(false);
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
      if (session) {
        try { localStorage.removeItem("poupeja_convidado_local"); } catch {}
        setUser(sessionParaUser(session));
      } else {
        let convidadoLocal = false;
        try { convidadoLocal = !!localStorage.getItem("poupeja_convidado_local"); } catch {}
        setUser(convidadoLocal ? { id: null, nome: "Convidado", email: null, convidado: true, local: true } : null);
      }
      setHydrated(true);
    });
    calcGarantiasAviso();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (session) {
        try { localStorage.removeItem("poupeja_convidado_local"); } catch {}
        setUser(sessionParaUser(session));
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
      // sem sessão e sem SIGNED_OUT explícito → não mexe (preserva convidado local)
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
    if (user?.convidado) return; // push personalizado é exclusivo de contas registadas
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
          evento("push_subscribed");
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

  /* Retrato do mês: banner nos primeiros 7 dias; acessível sempre via Poupança */
  useEffect(() => {
    if (!user) return;
    try {
      setRetrato(calcularRetrato());
      setBannerRetrato(retratoPorVer());
    } catch {}
  }, [user?.id, syncTick]);

  /* Referral: capturar ?ref= de quem convidou + guardar o uid próprio p/ partilhas */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      // ?atalho= é tratado no initializer do useState do tab e fica no URL
      // de propósito: o reload do service worker na 1ª visita recarrega a
      // página, e o parâmetro tem de sobreviver. Na PWA instalada (único
      // sítio onde os atalhos existem) a barra de endereço nem é visível.
      if (ref && !localStorage.getItem("poupeja_ref")) {
        localStorage.setItem("poupeja_ref", ref.slice(0, 16));
        evento("referral_visit", { ref: ref.slice(0, 16) });
        params.delete("ref");
        const q = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : ""));
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (!user?.id) return;
    try { localStorage.setItem("poupeja_uid", user.id.slice(0, 8)); } catch {}
  }, [user?.id]);

  /* Instalação da PWA confirmada → evento de analytics */
  useEffect(() => {
    const onInstalled = () => evento("app_installed", { platform: installModo || "desconhecido" });
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [installModo]);

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
    if (user?.convidado && typeof window !== "undefined" &&
        !window.confirm("Estás em modo convidado. Se saíres, não consegues voltar a esta conta nem aos dados dela. Sair mesmo?")) {
      return;
    }
    pararSync();
    try { localStorage.removeItem("poupeja_convidado_local"); } catch {}
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
    ecra(newTab);
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
            {[...NAV, ...NAV_SECUNDARIO].map(it => {
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
            onCriarConta={() => setModalConta(true)}
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
                {tab === "inicio"     && <EcraInicio user={user} setTab={go} goGarantias={goGarantias} onAbrirAvisos={() => { calcGarantiasAviso(); setVerAvisos(true); }} onAbrirDefinicoes={() => { setDir("up"); setVerDefs(true); setTabRaw("inicio"); }} onCriarConta={() => setModalConta(true)} retratoDisponivel={bannerRetrato} onAbrirRetrato={() => setRetratoAberto(true)} avisosCount={garantiasAviso.length} />}
                {tab === "mercados"   && <SecaoMercados setTab={go} />}
                {tab === "lojas"      && <SecaoLojas />}
                {tab === "mobilidade" && <SecaoMobilidade />}
                {tab === "poupanca"   && <SecaoPoupanca setTab={go} retrato={retrato} onAbrirRetrato={() => setRetratoAberto(true)} />}
                {tab === "apoios"     && <SecaoApoios />}
                {tab === "contas"     && <SecaoContas />}
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
              className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-md border-t z-40"
              style={{ background: "var(--pj-nav)", borderColor: "var(--pj-border)", boxShadow: "0 -4px 24px rgba(20,35,28,0.07)", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-1 py-1.5">
                {NAV.map(it => {
                  const active = tab === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => navClick(it.id)}
                      className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-colors duration-150"
                      style={{ background: active ? "var(--pj-brand-wash)" : "transparent" }}
                    >
                      <it.icon
                        size={18}
                        className={`transition-colors duration-150 ${bounce === it.id ? "nav-icon-active" : ""}`}
                        style={{ color: active ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                      <span className="text-[10px] font-semibold transition-colors duration-150"
                        style={{ color: active ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
                        {it.label}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full transition-all duration-200"
                        style={{ background: "var(--pj-brand-ink)", opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(0)" }}
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
        {retratoAberto && retrato && (
          <RetratoMes retrato={retrato} onFechar={() => { setRetratoAberto(false); setBannerRetrato(null); }} />
        )}

        {modalConta && user?.convidado && (
          <ModalCriarConta
            local={!!user?.local}
            onFechar={() => setModalConta(false)}
            onConvertido={(nome, email) => setUser(u => ({ ...u, nome, email }))}
          />
        )}

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
