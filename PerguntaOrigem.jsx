import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { responderComoConheceu } from "./lib/convidado";
import { evento } from "./lib/analytics";

/*
 * "Como conheceste o PoupeJá?" — uma vez por browser, só a convidados, com
 * um toque. A maior parte das visitas chega como "direto" (as apps do
 * Instagram e do WhatsApp escondem de onde vem a pessoa); isto responde.
 * Aparece ao fim de 30 segundos, depois de decidido o aviso de cookies,
 * para não se sobrepor a nada. Fechar no X também conta como respondido.
 */
const CHAVE = "poupeja_como_conheceu";
const OPCOES = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["amigo", "Amigo ou família"], ["google", "Google"], ["outro", "Outro"],
];

export default function PerguntaOrigem() {
  const [ver, setVer] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE)) return;
      if (localStorage.getItem("poupeja_nao_contar") === "1") return;
    } catch { return; }
    const t = setTimeout(() => {
      try { if (localStorage.getItem(CHAVE) || localStorage.getItem("poupeja_cookies") === null) return; } catch { return; }
      setVer(true);
      evento("como_conheceu", { passo: "mostrado" });
    }, 30000);
    return () => clearTimeout(t);
  }, []);

  function fechar(resposta) {
    try { localStorage.setItem(CHAVE, resposta || "fechado"); } catch {}
    if (resposta) responderComoConheceu(resposta);
    evento("como_conheceu", { passo: resposta ? "respondeu" : "fechou", resposta: resposta || null });
    setVer(false);
  }

  if (!ver) return null;
  return (
    <div role="dialog" aria-label="Como conheceste o PoupeJá?"
      style={{ position: "fixed", left: 12, right: 12, bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", zIndex: 60, maxWidth: 456, margin: "0 auto",
        padding: 14, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 8px 28px rgba(0,0,0,.18)" }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pj-text)" }}>Como conheceste o PoupeJá?</div>
          <div style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.4, marginTop: 2 }}>Um toque. Ajuda-nos a chegar a mais gente.</div>
        </div>
        <button onClick={() => fechar(null)} aria-label="Fechar" className="pj-tap" style={{ padding: 4, color: "var(--pj-text-faint)" }}>
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
        {OPCOES.map(([id, rotulo]) => (
          <button key={id} onClick={() => fechar(id)} className="pj-tap press"
            style={{ padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", border: "1px solid var(--pj-border)" }}>
            {rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
