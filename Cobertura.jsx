import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { COMPARADAS, NAO_INCLUIDAS, TEXTO_COBERTURA } from "./lib/cobertura";
import { evento } from "./lib/analytics";

/*
 * Cobertura da comparação — discreta de propósito.
 *
 * Uma linha pequena junto aos resultados ("Comparamos 5 supermercados ·
 * Ver quais"); os pormenores só no painel que abre ao tocar. Sem banners
 * nem avisos: quem quer saber, toca; quem não quer, nem repara.
 * Tudo sai de lib/cobertura.
 */

const LS_SUGESTOES = "poupeja_sugestoes_cadeias";
function lerSugestoes() {
  try { return JSON.parse(localStorage.getItem(LS_SUGESTOES) || "[]"); } catch { return []; }
}

export function NotaCobertura({ className = "", style }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        onClick={() => { setAberto(true); evento("cobertura_ver"); }}
        className={`pj-tap ${className}`}
        style={{ background: "transparent", border: 0, padding: "10px 2px", fontSize: 12, color: "var(--pj-text-faint)", textAlign: "left", ...style }}
      >
        {TEXTO_COBERTURA.linha} · <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>Ver quais</span>
      </button>
      {/* Portal: os ecrãs vivem dentro de um contentor animado (transform),
          e aí um "fixed" deixava de cobrir o ecrã inteiro. */}
      {aberto && createPortal(<PainelCobertura onFechar={() => setAberto(false)} />, document.body)}
    </>
  );
}

export function PainelCobertura({ onFechar }) {
  const [sugeridas, setSugeridas] = useState([]);
  useEffect(() => { setSugeridas(lerSugestoes()); }, []);
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  function sugerir(c) {
    evento("sugerir_supermercado", { cadeia: c.id });
    const l = [...new Set([...sugeridas, c.id])];
    setSugeridas(l);
    try { localStorage.setItem(LS_SUGESTOES, JSON.stringify(l)); } catch {}
  }

  const titulo = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)", margin: "20px 0 6px" };
  const linha = { padding: "10px 0", borderTop: "1px solid var(--pj-subtle)" };

  return (
    <div onClick={onFechar} className="fixed inset-0 flex flex-col" style={{ background: "rgba(20,35,28,0.55)", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-cobertura"
        className="mt-auto w-full max-w-md mx-auto rounded-t-3xl max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{ background: "var(--pj-card)", padding: "20px 20px 28px" }}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="titulo-cobertura" className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--pj-text)" }}>
            Que supermercados comparamos?
          </h2>
          <button onClick={onFechar} aria-label="Fechar" className="pj-tap flex items-center justify-center flex-none"
            style={{ width: 36, height: 36, borderRadius: 12, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.55, marginTop: 8 }}>
          Só conseguimos comparar supermercados com preços online. Os outros ficam de fora — nunca inventamos nem estimamos preços.
          Por isso, «o mais barato» quer dizer {TEXTO_COBERTURA.maisBarato}.
        </p>

        <p style={titulo}>Comparamos ({COMPARADAS.length})</p>
        {COMPARADAS.map((c) => (
          <div key={c.id} className="flex items-baseline justify-between gap-3" style={linha}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{c.nome}</span>
            <span style={{ fontSize: 12, color: c.estado === "parcial" ? "var(--pj-warn)" : "var(--pj-text-faint)", textAlign: "right" }}>{c.nota}</span>
          </div>
        ))}

        <p style={titulo}>Ainda não incluídos</p>
        {NAO_INCLUIDAS.map((c) => {
          const feito = sugeridas.includes(c.id);
          return (
            <div key={c.id} className="flex items-center justify-between gap-3" style={linha}>
              <span className="min-w-0">
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{c.nome}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>{c.motivo}</span>
              </span>
              <button onClick={() => !feito && sugerir(c)} disabled={feito} className="pj-tap flex-none"
                aria-label={feito ? `Já pediste o ${c.nome}` : `Sugerir o ${c.nome}`}
                style={{ minHeight: 36, padding: "0 12px", borderRadius: 10, border: "1px solid var(--pj-border)", background: "transparent",
                  fontSize: 12, fontWeight: 600, color: feito ? "var(--pj-text-faint)" : "var(--pj-brand-ink)" }}>
                {feito ? "Pedido ✓" : "Sugerir"}
              </button>
            </div>
          );
        })}
        <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.5, marginTop: 14 }}>
          «Sugerir» só conta o interesse (anónimo) para sabermos que cadeias acrescentar primeiro.
        </p>
      </div>
    </div>
  );
}
