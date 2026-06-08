import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";

export default function BannerInstalar() {
  const [visivel, setVisivel]             = useState(false);
  const [isIOS, setIsIOS]                 = useState(false);
  const [deferredPrompt, setDeferred]     = useState(null);
  const [instrucoesIOS, setInstrucoesIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Já está instalada — não mostrar
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return;

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setVisivel(true), 1500);
    } else {
      const handler = (e) => {
        e.preventDefault();
        setDeferred(e);
        setVisivel(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

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

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-24 left-0 right-0 z-50 px-4 anim-up">
        <div
          className="max-w-md mx-auto bg-white rounded-3xl p-4 flex items-center gap-3"
          style={{ boxShadow: "0 8px 40px -8px rgba(15,23,42,0.2)", border: "1px solid #e8eaed" }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
          >
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-800 text-[14px] leading-tight">Instala o PoupeJá</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Disponível para iOS e Android · Grátis</p>
          </div>
          <button
            onClick={instalar}
            className="press flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-black text-[13px]"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 4px 12px -4px rgba(5,150,105,0.5)" }}
          >
            <Download size={14} /> Instalar
          </button>
        </div>
      </div>

      {/* Modal iOS */}
      {instrucoesIOS && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setInstrucoesIOS(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-6" />
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
              >
                <Smartphone size={22} className="text-white" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-base">Instalar no iPhone / iPad</p>
                <p className="text-[12px] text-slate-400">3 passos simples</p>
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
                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-white text-sm mt-0.5"
                    style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
                  >
                    {p.n}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-[13px]">{p.titulo}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInstrucoesIOS(false)}
              className="press w-full py-3.5 rounded-2xl text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.45)" }}
            >
              Percebi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
