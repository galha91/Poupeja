import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Tag, ShoppingCart, Clock } from "lucide-react";
import LogoLoja from "./LogoLoja";

const LOJA_CORES = {
  Continente: "#e63329", "Pingo Doce": "#009a3e",
  Lidl: "#0050aa", Aldi: "#1a3b6f", "Intermarché": "#e2001a",
  Auchan: "#d6180b", "E.Leclerc": "#0066b2",
  "El Corte Inglés": "#006400", Froiz: "#c8102e",
};
const LOJA_TAGLINE = {
  Continente: "Folheto semanal",
  "Pingo Doce": "Promoções da semana",
  Lidl: "Ofertas semanais",
  Aldi: "Super preços",
  "Intermarché": "Folheto em vigor",
  Auchan: "Folheto semanal",
  "E.Leclerc": "Promoções da semana",
  "El Corte Inglés": "Ofertas do supermercado",
  Froiz: "Folheto em vigor",
};

function CardSkeleton() {
  return (
    <div
      className="p-4 flex flex-col items-center gap-3 animate-pulse"
      style={{ background: "var(--pj-card)", borderRadius: 16, border: "1px solid var(--pj-border)" }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--pj-subtle)" }} />
      <div style={{ height: 10, width: 80, borderRadius: 999, background: "var(--pj-subtle)" }} />
      <div style={{ height: 8, width: 56, borderRadius: 999, background: "var(--pj-border)" }} />
    </div>
  );
}

export default function SecaoFolhetos() {
  const [folhetos, setFolhetos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState(false);

  function carregar() {
    setLoading(true);
    setErro(false);
    fetch("/api/folhetos")
      .then(r => r.json())
      .then(json => {
        setFolhetos(json.folhetos || []);
        setLoading(false);
      })
      .catch(() => { setErro(true); setLoading(false); });
  }

  useEffect(() => { carregar(); }, []);

  return (
    <div className="pb-6" style={{ background: "var(--pj-surface)" }}>

      {/* Cabeçalho editorial */}
      <div className="px-4 pt-5 pb-4 anim-up" style={{ borderBottom: "1px solid var(--pj-border)" }}>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p
              className="flex items-center gap-1.5 mb-2"
              style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}
            >
              <Tag size={11} style={{ color: "var(--pj-brand-ink)" }} /> Supermercados
            </p>
            <h2
              className="font-display"
              style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em", lineHeight: 1.2 }}
            >
              Folhetos da semana
            </h2>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4 }}>
              Toca num supermercado para ver as promoções
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <Clock size={11} style={{ color: "var(--pj-text-faint)" }} />
              <span style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>Atualizado automaticamente</span>
            </div>
          </div>
          <button
            onClick={carregar}
            className="pj-tap flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 14, background: "var(--pj-subtle)", color: "var(--pj-text-strong)" }}
            aria-label="Atualizar folhetos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div
          className="mx-4 mt-4 p-5 text-center anim-up"
          style={{ background: "var(--pj-card)", borderRadius: 16, border: "1px solid var(--pj-border)" }}
        >
          <AlertCircle size={28} style={{ color: "#b0574f" }} className="mx-auto mb-2" />
          <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", marginBottom: 12 }}>
            Não conseguimos carregar os folhetos
          </p>
          <button
            onClick={carregar}
            className="pj-tap"
            style={{ fontSize: 13, fontWeight: 600, color: "white", background: "var(--pj-brand)", padding: "10px 20px", borderRadius: 12 }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
          : folhetos.map(f => {
              const cor = LOJA_CORES[f.loja] || "#888";
              const tagline = LOJA_TAGLINE[f.loja] || "Ver folheto";
              return (
                <button
                  key={f.id}
                  onClick={() => window.open(f.url, "_blank")}
                  className="pj-tap p-4 flex flex-col items-center gap-3 relative overflow-hidden anim-up text-left"
                  style={{ background: "var(--pj-card)", borderRadius: 16, border: "1px solid var(--pj-border)", boxShadow: "0 1px 2px rgba(20,35,28,0.04)" }}
                >
                  <LogoLoja loja={f.loja} size={56} radius={14} bg="#fbfaf6" />

                  <div className="text-center">
                    <p
                      className="font-display"
                      style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em" }}
                    >
                      {f.loja}
                    </p>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1"
                      style={{ padding: "3px 10px", borderRadius: 999, background: "var(--pj-subtle)" }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 600, color: cor }}>{tagline}</span>
                    </div>
                    {f.validade && (
                      <p
                        className="mt-1 flex items-center justify-center gap-1"
                        style={{ fontSize: 10, color: "var(--pj-text-faint)" }}
                      >
                        <Clock size={9} />
                        {f.validade}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
      </div>

      {/* Nota rodapé */}
      {!loading && !erro && (
        <p className="text-center mt-5 px-4" style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>
          Os folhetos abrem no site oficial de cada supermercado, sempre atualizados.
        </p>
      )}
    </div>
  );
}
