import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { eur } from "./lib/formato";
import { lerRegistos, somarPeriodos, COMO_CALCULAMOS } from "./lib/poupancaListas";
import { TEXTO_COBERTURA } from "./lib/cobertura";

/*
 * "Quanto poupaste" com a lista otimizada — semana e mês.
 * Separado da poupança dos talões (que é real, lida do talão): isto é uma
 * estimativa e diz-se. O cartão partilhável só é carregado ao tocar.
 */
export default function PoupancaListas({ setTab }) {
  const [soma, setSoma] = useState(null);
  const [verComo, setVerComo] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [aGerar, setAGerar] = useState(false);

  useEffect(() => { setSoma(somarPeriodos(lerRegistos())); }, []);
  if (!soma) return null;

  async function partilhar() {
    setAGerar(true);
    try {
      const { partilharCartao } = await import("./lib/cartaoPoupanca");
      const usarSemana = soma.mes <= 0 || (soma.semana > 0 && soma.semana === soma.mes);
      const r = await partilharCartao({ valor: usarSemana ? soma.semana : soma.mes, periodo: usarSemana ? "esta semana" : "este mês" });
      if (r === "descarregado") { setFeedback("Imagem descarregada ✓"); setTimeout(() => setFeedback(""), 2500); }
    } finally { setAGerar(false); }
  }

  const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };

  if (soma.total <= 0) {
    return (
      <div className="px-6 mb-6">
        <p style={rotulo}>Com a lista otimizada</p>
        <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.5, marginTop: 8 }}>
          Compara a tua lista de compras e escolhe onde comprar: a poupança estimada aparece aqui, por semana e por mês.
        </p>
        <button onClick={() => setTab("lista")} className="pj-tap press mt-3"
          style={{ background: "var(--pj-subtle)", color: "var(--pj-text)", fontSize: 12.5, fontWeight: 700, padding: "10px 14px", borderRadius: 12, border: 0 }}>
          Abrir a lista de compras
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 mb-6">
      <p style={rotulo}>Com a lista otimizada</p>
      <div className="grid grid-cols-2 gap-3" style={{ marginTop: 10 }}>
        {[["Esta semana", soma.semana], ["Este mês", soma.mes]].map(([t, v]) => (
          <div key={t}>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>{t}</p>
            <p className="font-display pj-num" style={{ fontSize: 28, fontWeight: 500, color: "var(--pj-text)", letterSpacing: "-0.02em", marginTop: 2 }}>
              {eur(v, 2)} €
            </p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--pj-text-faint)", lineHeight: 1.5, marginTop: 6 }}>
        Estimativa. {TEXTO_COBERTURA.estimativa.replace("Estimativa que considera", "Considera")}{" "}
        <button onClick={() => setVerComo((v) => !v)} aria-expanded={verComo} className="pj-tap"
          style={{ background: "transparent", border: 0, padding: 0, fontSize: 12, color: "var(--pj-text-faint)", textDecoration: "underline", textUnderlineOffset: 2 }}>
          Como calculamos?
        </button>
      </p>
      {verComo && (
        <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.55, marginTop: 8 }}>
          {COMO_CALCULAMOS} Fica guardado neste dispositivo (e na tua conta, se tiveres sessão iniciada); não guardamos os nomes dos artigos.
        </p>
      )}
      <button onClick={partilhar} disabled={aGerar} className="pj-tap press inline-flex items-center mt-3"
        style={{ gap: 6, background: "var(--pj-subtle)", color: "var(--pj-text)", fontSize: 12.5, fontWeight: 700, padding: "10px 14px", borderRadius: 12, border: 0 }}>
        <Share2 size={13} /> {feedback || (aGerar ? "A preparar…" : "Partilhar")}
      </button>
    </div>
  );
}
