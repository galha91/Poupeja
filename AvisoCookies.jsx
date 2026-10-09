import { useEffect, useState } from "react";
import { escolhaCookies, aplicarEscolha, retomarEscolha } from "./lib/cookies";

/* Faixa pequena, uma vez só. Recusar é tão fácil como aceitar. */
export default function AvisoCookies() {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    retomarEscolha();
    setVer(escolhaCookies() === null);
  }, []);
  if (!ver) return null;
  function escolher(e) { aplicarEscolha(e); setVer(false); }
  const botao = { padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 };
  return (
    <div role="dialog" aria-label="Cookies" style={{
      position: "fixed", left: 12, right: 12, bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", zIndex: 60,
      maxWidth: 520, margin: "0 auto", padding: "12px 14px", borderRadius: 14,
      background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 6px 24px rgba(20,35,28,0.18)",
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <p style={{ flex: "1 1 220px", fontSize: 12.5, lineHeight: 1.45, color: "var(--pj-text-muted)", margin: 0 }}>
        Usamos cookies de medição e de lojas parceiras para melhorar o PoupeJá.{" "}
        <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Saber mais</a>
      </p>
      <button onClick={() => escolher("nao")} className="pj-tap" style={{ ...botao, color: "var(--pj-text-muted)", border: "1px solid var(--pj-border)" }}>Recusar</button>
      <button onClick={() => escolher("sim")} className="pj-tap" style={{ ...botao, background: "var(--pj-brand)", color: "#fff" }}>Aceitar</button>
    </div>
  );
}
