import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  Download, Share, Plus, Check, CheckCircle2, Bell, Zap,
  WifiOff, Home, Smartphone, Monitor, ArrowRight, MoreVertical,
} from "lucide-react";

/*
 * Página dedicada de instalação — poupeja.com/instalar
 * Link limpo e partilhável (WhatsApp, redes) que leva a pessoa
 * a instalar a PWA com o mínimo de fricção:
 *   • Android / Chrome / desktop → botão que dispara o popup nativo (1 toque)
 *   • iPhone / Safari            → guia passo-a-passo (a Apple não deixa 1-clique)
 *   • Já instalada               → estado de sucesso + abrir a app
 */

const BENEFICIOS = [
  { Icon: Bell,    texto: "Folhetos dos supermercados no telemóvel toda a semana" },
  { Icon: Zap,     texto: "Abre num instante, como uma app — sem passar pelo browser" },
  { Icon: WifiOff, texto: "Funciona offline — listas e contas sempre à mão" },
  { Icon: Home,    texto: "Ícone no ecrã inicial, igual a qualquer outra app" },
];

export default function Instalar() {
  const [modo, setModo] = useState(null); // null | "ios" | "android" | "desktop" | "instalado"
  const [aInstalar, setAInstalar] = useState(false);
  const promptRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Já está instalada / a correr em modo standalone
    const jaInstalada = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (jaInstalada()) { setModo("instalado"); return; }

    const ua = navigator.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua) ||
      // iPad com iPadOS 13+ reporta-se como Mac com toque
      (/Macintosh/.test(ua) && "ontouchend" in document);
    const isAndroid = /android/i.test(ua);

    if (isIos) { setModo("ios"); return; }

    // Android / desktop: à espera do evento nativo. Enquanto não chega,
    // mostramos já o ecrã certo com um fallback.
    setModo(isAndroid ? "android" : "desktop");

    const handler = (e) => {
      e.preventDefault();
      promptRef.current = e;
      setModo((m) => (m === "instalado" ? m : (isAndroid ? "android" : "desktop")));
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalada = () => { promptRef.current = null; setModo("instalado"); };
    window.addEventListener("appinstalled", onInstalada);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalada);
    };
  }, []);

  async function instalar() {
    const p = promptRef.current;
    if (!p) return; // sem prompt disponível — o rodapé explica porquê
    setAInstalar(true);
    try {
      p.prompt();
      await p.userChoice;
    } catch (_) {}
    promptRef.current = null;
    setAInstalar(false);
  }

  return (
    <>
      <Head>
        <title>Instalar o PoupeJá — grátis, num toque</title>
        <meta name="description" content="Instala o PoupeJá no teu telemóvel: folhetos, poupança e contas sempre à mão. Grátis, sem loja de apps." />
        <meta name="theme-color" content="#0b6b4f" />
        <meta property="og:title" content="Instalar o PoupeJá" />
        <meta property="og:description" content="A tua carteira digital portuguesa — num toque no ecrã inicial." />
        <meta property="og:image" content="/og.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="min-h-screen flex flex-col items-center px-5 py-10">
        <div className="w-full max-w-md flex flex-col items-center">

          {/* Ícone + nome */}
          <div className="anim-up flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center overflow-hidden"
              style={{ background: "#0b6b4f", boxShadow: "0 12px 30px -8px rgba(11,107,79,0.45)" }}
            >
              {/* icon.svg existe em /public */}
              <img src="/icon.svg" alt="PoupeJá" className="w-12 h-12" />
            </div>
            <h1 className="font-display mt-4 text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>PoupeJá</h1>
            <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--text-muted)" }}>
              A tua carteira digital portuguesa
            </p>
          </div>

          {/* Benefícios */}
          <div className="anim-up anim-up-1 w-full mt-8 grid gap-2.5">
            {BENEFICIOS.map(({ Icon, texto }, i) => (
              <div key={i} className="card flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#eeece4" }}>
                  <Icon size={17} style={{ color: "#0b6b4f" }} />
                </div>
                <p className="text-[13.5px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{texto}</p>
              </div>
            ))}
          </div>

          {/* Zona de ação por plataforma */}
          <div className="anim-up anim-up-2 w-full mt-7">
            {modo === "instalado" && <EstadoInstalado />}
            {(modo === "android" || modo === "desktop") && (
              <AcaoInstalar
                modo={modo}
                aInstalar={aInstalar}
                temPrompt={!!promptRef.current}
                onInstalar={instalar}
              />
            )}
            {modo === "ios" && <GuiaIos />}
            {modo === null && (
              <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            )}
          </div>

          {/* Rodapé */}
          <p className="mt-8 text-center text-[12px]" style={{ color: "var(--text-faint)" }}>
            100% grátis · sem loja de apps · não ocupa espaço
          </p>
          <a
            href="/"
            className="mt-3 text-[13px] font-bold flex items-center gap-1"
            style={{ color: "#0b6b4f" }}
          >
            Ir para o site <ArrowRight size={14} />
          </a>
        </div>
      </main>
    </>
  );
}

/* ─── Android / desktop: botão 1-toque quando disponível + guia visual sempre presente ─── */
function AcaoInstalar({ modo, aInstalar, temPrompt, onInstalar }) {
  return (
    <div className="flex flex-col gap-3">
      {temPrompt && (
        <button
          onClick={onInstalar}
          disabled={aInstalar}
          className="pj-tap w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: "#0b6b4f" }}
        >
          {aInstalar ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              A instalar…
            </>
          ) : (
            <>
              <Download size={19} /> Instalar agora — é grátis
            </>
          )}
        </button>
      )}

      {modo === "android" ? (
        <GuiaAndroid comBotaoAcima={temPrompt} />
      ) : (
        !temPrompt && <GuiaDesktop />
      )}
    </div>
  );
}

const PASSO_ICON_BG = "#eeece4";
const PASSO_NUM_BG  = "#0b6b4f";

function Passo({ Icon, numero, titulo, desc }) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PASSO_ICON_BG }}>
          <Icon size={18} style={{ color: "#0b6b4f" }} />
        </div>
        <span
          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-white text-[10px] font-semibold flex items-center justify-center"
          style={{ background: PASSO_NUM_BG }}
        >
          {numero}
        </span>
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{titulo}</p>
        <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── iPhone / Safari: guia passo-a-passo ─── */
function GuiaIos() {
  const passos = [
    { Icon: Share, titulo: "Toca em Partilhar", desc: "O ícone na barra do Safari (uma caixa com uma seta ↑ para cima)." },
    { Icon: Plus,  titulo: "“Adicionar ao Ecrã Inicial”", desc: "Faz scroll na lista e toca nesta opção." },
    { Icon: Check, titulo: "Toca em “Adicionar”", desc: "No canto superior direito. O ícone aparece logo no teu ecrã." },
  ];
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#0b6b4f" }}>
        <Smartphone size={16} className="text-white" />
        <p className="text-[13px] font-semibold text-white">Instalar no iPhone (Safari)</p>
      </div>
      <div className="p-4 flex flex-col gap-3.5">
        {passos.map((p, i) => <Passo key={i} {...p} numero={i + 1} />)}
      </div>
      <div className="mx-4 mb-4 px-3.5 py-2.5 rounded-xl" style={{ background: "#eeece4" }}>
        <p className="text-[11.5px] font-medium leading-relaxed" style={{ color: "#a8432f" }}>
          <strong>Tem de ser no Safari.</strong> Se abriste este link no Chrome, Instagram ou noutra app, toca em ⋯ → “Abrir no Safari” primeiro.
        </p>
      </div>
    </div>
  );
}

/* ─── Android: guia passo-a-passo (mesma qualidade visual do iOS) ─── */
function GuiaAndroid({ comBotaoAcima }) {
  const passos = [
    { Icon: MoreVertical, titulo: "Abre o menu ⋮", desc: "No canto superior direito do Chrome." },
    { Icon: Plus,         titulo: "“Instalar aplicação”", desc: "Ou “Adicionar ao ecrã principal”, consoante a versão do Chrome." },
    { Icon: Check,        titulo: "Confirma a instalação", desc: "O ícone do PoupeJá aparece logo no teu ecrã inicial." },
  ];
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#0b6b4f" }}>
        <Smartphone size={16} className="text-white" />
        <p className="text-[13px] font-semibold text-white">
          {comBotaoAcima ? "Ou instala pelo menu do Chrome" : "Instalar no Android (Chrome)"}
        </p>
      </div>
      <div className="p-4 flex flex-col gap-3.5">
        {passos.map((p, i) => <Passo key={i} {...p} numero={i + 1} />)}
      </div>
    </div>
  );
}

/* ─── Desktop: guia curto (Chrome/Edge) ─── */
function GuiaDesktop() {
  return (
    <div className="card p-5 text-center">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#eeece4" }}>
        <Monitor size={20} style={{ color: "#0b6b4f" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Instalar a partir do browser</p>
      <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        No Chrome ou Edge, clica no ícone de instalar (⊕) na barra de endereço, ou no menu ⋮ → “Instalar PoupeJá”.
      </p>
    </div>
  );
}

/* ─── Já instalada ─── */
function EstadoInstalado() {
  return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#eeece4" }}>
        <CheckCircle2 size={28} style={{ color: "#0b6b4f" }} />
      </div>
      <p className="font-display text-base font-semibold" style={{ color: "var(--text-primary)" }}>Já tens o PoupeJá instalado</p>
      <p className="text-[13px] mt-1.5" style={{ color: "var(--text-muted)" }}>Está no teu ecrã inicial, pronto a usar.</p>
      <a
        href="/"
        className="pj-tap inline-flex items-center justify-center gap-2 mt-4 w-full py-3.5 rounded-2xl text-white font-semibold text-[15px]"
        style={{ background: "#0b6b4f" }}
      >
        Abrir o PoupeJá <ArrowRight size={17} />
      </a>
    </div>
  );
}
