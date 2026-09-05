import { useState, useEffect } from "react";
import { Home, Bell, Smartphone, WifiOff, Download, Zap, X } from "lucide-react";

/* ─── Convite a instalar — leva à página /instalar (ou instala já no Android) ─── */
export function ModalInstalar({ modo, onFechar, onInstalarAndroid }) {
  if (!modo) return null;

  const beneficios = [
    { Icon: Bell,    texto: "Notificações dos folhetos toda a segunda-feira de manhã" },
    { Icon: Zap,     texto: "Acesso instantâneo — abre como uma app, sem abrir o browser" },
    { Icon: WifiOff, texto: "Funciona sem internet — consulta as listas e contas offline" },
    { Icon: Home,    texto: "Ícone no ecrã inicial, como qualquer outra app" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(20,35,28,0.55)" }} onClick={onFechar}>
      <div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{ maxHeight: "92vh", overflowY: "auto", background: "var(--pj-card)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--pj-border)" }} />
        </div>

        {/* Cabeçalho */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
            <Smartphone size={20} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "var(--pj-text-faint)" }}>
              {modo === "ios" ? "iOS (Safari)" : "Android"}
            </p>
            <p className="font-display text-[17px] font-semibold leading-tight" style={{ color: "var(--pj-text)" }}>Instalar o PoupeJá</p>
          </div>
          <button onClick={onFechar} className="pj-tap ml-auto w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }} aria-label="Fechar">
            <X size={16} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        <div className="mx-5" style={{ height: 1, background: "var(--pj-border)" }} />

        {/* Benefícios */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mb-3" style={{ color: "var(--pj-text-faint)" }}>Porque vale a pena</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {beneficios.map((b, i) => (
              <div key={i} className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "var(--pj-subtle)" }}>
                <b.Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--pj-brand-ink)" }} />
                <p className="text-[11px] font-semibold leading-snug" style={{ color: "var(--pj-text)" }}>{b.texto}</p>
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
                className="pj-tap w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2"
                style={{ background: "var(--pj-brand)" }}
              >
                <Download size={18} /> Instalar agora — é grátis
              </button>
              <a href="/instalar" className="pj-tap w-full py-3 rounded-2xl font-semibold text-sm text-center" style={{ background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}>
                Ver o guia completo
              </a>
            </>
          ) : (
            <a
              href="/instalar"
              className="pj-tap w-full py-4 rounded-2xl text-white font-semibold text-base text-center flex items-center justify-center gap-2"
              style={{ background: "var(--pj-brand)" }}
            >
              <Download size={18} /> Ver como instalar
            </a>
          )}
          <button
            onClick={onFechar}
            className="pj-tap w-full py-2.5 font-semibold text-sm"
            style={{ color: "var(--pj-text-faint)" }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Hook de deteção de plataforma de instalação ─── */
export function useInstallDetect() {
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
export function BarraInstalacao({ modo, onAbrir, onInstalarDireto }) {
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
