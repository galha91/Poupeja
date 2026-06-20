import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Tag, ShoppingCart, Clock } from "lucide-react";

const LOJA_CORES = {
  Continente: "#e63329", "Pingo Doce": "#009a3e",
  Lidl: "#0050aa", Aldi: "#1a3b6f", "Intermarché": "#e2001a",
  Auchan: "#d6180b", "E.Leclerc": "#0066b2",
  "El Corte Inglés": "#006400", Froiz: "#c8102e",
};
const LOJA_DOMINIOS = {
  Continente:        "continente.pt",
  "Pingo Doce":      "pingodoce.pt",
  Lidl:              "lidl.pt",
  Aldi:              "aldi.pt",
  Auchan:            "auchan.pt",
  "El Corte Inglés": "elcorteingles.pt",
  Froiz:             "froiz.pt",
};
const LOJA_LOCAL = {
  "Intermarché": "/logos/intermarche.svg",
  "E.Leclerc":   "/logos/eleclerc.svg",
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

function LogoLoja({ loja, size }) {
  const s = size || 56;
  const cor = LOJA_CORES[loja] || "#888";
  const localSvg = LOJA_LOCAL[loja];
  const dominio = LOJA_DOMINIOS[loja];
  const [nivel, setNivel] = useState(0);
  const [localFalhou, setLocalFalhou] = useState(false);
  const iniciais = loja.slice(0, 2).toUpperCase();
  const fontes = dominio ? [
    `https://www.google.com/s2/favicons?domain=${dominio}&sz=128`,
    `https://logo.clearbit.com/${dominio}`,
  ] : [];

  return (
    <div
      className="rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: s, height: s, background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
    >
      {localSvg && !localFalhou ? (
        <img
          src={localSvg}
          alt={loja}
          onError={() => setLocalFalhou(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      ) : nivel < fontes.length ? (
        <img
          src={fontes[nivel]}
          alt={loja}
          onError={() => setNivel(n => n + 1)}
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center rounded-2xl"
          style={{ background: cor }}
        >
          <span style={{ fontSize: s * 0.3, fontWeight: 900, color: "white" }}>{iniciais}</span>
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card p-5 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-slate-100" />
      <div className="h-2.5 w-20 bg-slate-100 rounded-full" />
      <div className="h-2 w-14 bg-slate-50 rounded-full" />
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
    <div className="pb-6">

      {/* Hero */}
      <div
        className="mx-4 mb-5 rounded-3xl p-5 relative overflow-hidden anim-up"
        style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#60a5fa 100%)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.45)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-10 bottom-4 opacity-10 pointer-events-none">
          <ShoppingCart size={64} />
        </div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Tag size={11} /> Supermercados
            </p>
            <p className="text-2xl font-black text-white leading-tight">Folhetos da semana</p>
            <p className="text-[12px] text-white/70 mt-1">Toca num supermercado para ver as promoções</p>
            <div className="mt-3 flex items-center gap-1.5">
              <Clock size={11} className="text-white/50" />
              <span className="text-[10px] text-white/50">Atualizado automaticamente</span>
            </div>
          </div>
          <button
            onClick={carregar}
            className="press w-9 h-9 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <RefreshCw size={15} className={`text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mx-4 mb-4 card p-5 text-center border-red-100 anim-up">
          <AlertCircle size={28} className="text-red-300 mx-auto mb-2" />
          <p className="text-sm font-black text-red-600 mb-3">Não conseguimos carregar os folhetos</p>
          <button onClick={carregar} className="press text-xs font-black text-white bg-red-500 px-5 py-2.5 rounded-xl">
            Tentar de novo
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
          : folhetos.map(f => {
              const cor = LOJA_CORES[f.loja] || "#888";
              const tagline = LOJA_TAGLINE[f.loja] || "Ver folheto";
              return (
                <button
                  key={f.id}
                  onClick={() => window.open(f.url, "_blank")}
                  className="press card p-5 flex flex-col items-center gap-3 relative overflow-hidden anim-up"
                >
                  {/* color bar top */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[18px]" style={{ background: cor }} />

                  <LogoLoja loja={f.loja} size={64} />

                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800">{f.loja}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: cor + "18" }}>
                      <span className="text-[10px] font-black" style={{ color: cor }}>{tagline}</span>
                    </div>
                    {f.validade && (
                      <p className="mt-1 text-[10px] text-slate-400 flex items-center justify-center gap-1">
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
        <p className="text-[10px] text-slate-400 text-center mt-5 px-4">
          Os folhetos abrem no site oficial de cada supermercado, sempre atualizados.
        </p>
      )}
    </div>
  );
}
