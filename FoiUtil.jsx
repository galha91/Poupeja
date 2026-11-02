import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { evento } from "./lib/analytics";

/*
 * "Isto foi útil?" no fim da comparação da lista. Uma pergunta de um toque,
 * no máximo de 14 em 14 dias por aparelho; com "não", pede (opcional) o que
 * faltou. As respostas aparecem no /admin (Uso → Opinião).
 */
const LS = "poupeja_feedback_lista";
const INTERVALO = 14 * 864e5;

function enviar(corpo) {
  fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), keepalive: true }).catch(() => {});
}

export default function FoiUtil({ contexto = "lista" }) {
  const [mostrar, setMostrar] = useState(false);
  const [passo, setPasso] = useState("pergunta"); // pergunta | porque | obrigado
  const [texto, setTexto] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem("poupeja_nao_contar") === "1") return;
      const ultimo = Number(localStorage.getItem(LS) || 0);
      if (Date.now() - ultimo > INTERVALO) setMostrar(true);
    } catch {}
  }, []);
  if (!mostrar) return null;

  function responder(util) {
    try { localStorage.setItem(LS, String(Date.now())); } catch {}
    evento("feedback_util", { tipo: util ? "sim" : "nao" });
    if (util) { enviar({ contexto, util: true }); setPasso("obrigado"); }
    else setPasso("porque");
  }

  const caixa = { margin: "8px 16px 4px", padding: "12px 14px", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)" };
  const botao = { display: "inline-flex", alignItems: "center", gap: 6, minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid var(--pj-border)", background: "var(--pj-surface)", fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" };

  if (passo === "obrigado") return <p style={{ ...caixa, fontSize: 13, color: "var(--pj-brand-ink)", fontWeight: 600 }}>Obrigado! Ajuda-nos a melhorar.</p>;

  if (passo === "porque") {
    return (
      <form style={caixa} onSubmit={(e) => { e.preventDefault(); enviar({ contexto, util: false, texto }); setPasso("obrigado"); }}>
        <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>
          O que faltou? <span style={{ fontWeight: 400, color: "var(--pj-text-faint)" }}>(opcional)</span>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={280} rows={2} placeholder="Ex.: faltou um supermercado, um produto não apareceu…"
            style={{ display: "block", width: "100%", marginTop: 8, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--pj-border)", background: "var(--pj-surface)", fontSize: 13.5, color: "var(--pj-text)", resize: "none" }} />
        </label>
        <button type="submit" className="pj-tap press" style={{ ...botao, marginTop: 8, background: "var(--pj-brand)", color: "#fff", border: 0 }}>Enviar</button>
      </form>
    );
  }

  return (
    <div style={caixa} className="flex items-center justify-between gap-3">
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>Isto foi útil?</p>
      <div className="flex gap-2">
        <button onClick={() => responder(true)} className="pj-tap press" style={botao} aria-label="Sim, foi útil"><ThumbsUp size={15} /> Sim</button>
        <button onClick={() => responder(false)} className="pj-tap press" style={botao} aria-label="Não foi útil"><ThumbsDown size={15} /> Não</button>
      </div>
    </div>
  );
}
