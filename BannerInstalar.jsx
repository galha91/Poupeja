import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";

// inline=true → card integrado no layout (para a landing screen, sem fixed)
// inline=false (default) → banner flutuante fixed no fundo do ecrã
export default function BannerInstalar({ inline = false }) {
  const [visivel, setVisivel]             = useState(false);
  const [isIOS, setIsIOS]                 = useState(false);
  const [deferredPrompt, setDeferred]     = useState(null);
  const [instrucoesIOS, setInstrucoesIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return;

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setVisivel(true), inline ? 0 : 1500);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferred(e);
        setVisivel(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, [inline]);

  function instalar() {
    if (isIOS) {
      setInstrucoesIOS(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === "accepted") setVisivel(false);
        setDeferred(null);
      });
    }
  }

  if (!visivel) return null;

  const card = (
    <div
      className="rounded-3xl p-4 flex items-center gap-3"
      style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 6px 20px -12px rgba(20,35,28,0.18)" }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center"
        style={{ background: "var(--pj-brand)" }}
      >
        <Smartphone size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] leading-tight" style={{ color: "var(--pj-text)" }}>Instala o PoupeJá</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>Disponível para iOS e Android · Grátis</p>
      </div>
      <button
        onClick={instalar}
        className="press pj-tap flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-[13px]"
        style={{ background: "var(--pj-brand)" }}
      >
        <Download size={14} /> Instalar
      </button>
    </div>
  );

  return (
    <>
      {inline
        ? <div className="w-full anim-up">{card}</div>
        : <div className="fixed bottom-24 left-0 right-0 z-50 px-4 anim-up"><div className="max-w-md mx-auto">{card}</div></div>
      }

      {/* Modal iOS — instruções de instalação */}
      {instrucoesIOS && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(20,35,28,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setInstrucoesIOS(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6 pb-10"
            style={{ background: "var(--pj-card)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "var(--pj-border)" }} />
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--pj-brand)" }}
              >
                <Smartphone size={22} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: "var(--pj-text)" }}>Instalar no iPhone / iPad</p>
                <p className="text-[12px]" style={{ color: "var(--pj-text-faint)" }}>3 passos simples</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {[
                { n: 1, titulo: "Toca no ícone de partilha", sub: "O botão □↑ na barra inferior do Safari" },
                { n: 2, titulo: 'Seleciona "Adicionar ao ecrã principal"', sub: "Faz scroll para baixo na lista de opções" },
                { n: 3, titulo: 'Toca em "Adicionar"', sub: "O PoupeJá fica no teu ecrã como uma app" },
              ].map(p => (
                <div key={p.n} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-semibold text-white text-sm mt-0.5"
                    style={{ background: "var(--pj-brand)" }}
                  >
                    {p.n}
                  </div>
                  <div>
                    <p className="font-semibold text-[13px]" style={{ color: "var(--pj-text)" }}>{p.titulo}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>{p.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInstrucoesIOS(false)}
              className="press pj-tap w-full py-3.5 rounded-2xl text-white font-semibold text-sm"
              style={{ background: "var(--pj-brand)" }}
            >
              Percebi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
