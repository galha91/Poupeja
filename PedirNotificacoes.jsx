import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";

/*
 * Convite para ativar os avisos, com o motivo à frente. O pedido nativo do
 * navegador só aparece depois de a pessoa tocar em "Ativar avisos": se a
 * recusar lá, fica bloqueado para sempre; com "Agora não" voltamos a
 * perguntar mais tarde (ver lib/pushSoft.js).
 */
export default function PedirNotificacoes({ onAtivar, onAdiar }) {
  const [aPedir, setAPedir] = useState(false);

  async function ativar() {
    setAPedir(true);
    try { await onAtivar(); } finally { setAPedir(false); }
  }

  return (
    <div role="dialog" aria-label="Ativar avisos"
      style={{ position: "fixed", left: 12, right: 12, bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", zIndex: 60, maxWidth: 456, margin: "0 auto",
        padding: 14, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 8px 28px rgba(0,0,0,.18)" }}>
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center flex-none" style={{ width: 38, height: 38, borderRadius: 12, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
          <Bell size={20} aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pj-text)" }}>Recebe avisos que te poupam dinheiro</div>
          <div style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.4, marginTop: 2 }}>
            Gasóleo a descer, folhetos novos à quinta e alertas dos teus artigos. Sem spam: só quando há poupança.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
        <button onClick={ativar} disabled={aPedir} className="pj-tap press flex items-center justify-center gap-1.5 flex-1"
          style={{ padding: "10px 14px", borderRadius: 999, border: 0, fontSize: 14, fontWeight: 700, background: "var(--pj-brand)", color: "#fff" }}>
          {aPedir ? <><Loader2 size={14} className="animate-spin" aria-hidden /> A ativar</> : "Ativar avisos"}
        </button>
        <button onClick={onAdiar} disabled={aPedir} className="pj-tap"
          style={{ padding: "10px 14px", borderRadius: 999, border: 0, fontSize: 14, fontWeight: 600, background: "transparent", color: "var(--pj-text-muted)" }}>
          Agora não
        </button>
      </div>
    </div>
  );
}
