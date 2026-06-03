import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

const LOJA_CORES = {
  Continente:"#e63329", "Pingo Doce":"#009a3e", Lidl:"#0050aa",
  Aldi:"#1a3b6f", "Intermarché":"#e2001a",
};
const LOJA_DOMINIOS = {
  Continente:"continente.pt", "Pingo Doce":"pingodoce.pt", Lidl:"lidl.pt",
  Aldi:"aldi.pt", "Intermarché":"intermarche.pt",
};

function LogoLoja({ loja, size }) {
  const s = size || 56;
  const cor = LOJA_CORES[loja] || "#888";
  const dominio = LOJA_DOMINIOS[loja];
  const [nivel, setNivel] = useState(0);
  const iniciais = loja.slice(0, 2).toUpperCase();
  const fontes = dominio ? [
    "https://www.google.com/s2/favicons?domain=" + dominio + "&sz=128",
    "https://logo.clearbit.com/" + dominio,
  ] : [];
  return (
    <div className="rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-white"
      style={{ width: s, height: s, padding: s*0.16, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      {nivel < fontes.length ? (
        <img src={fontes[nivel]} alt={loja}
          onError={function(){ setNivel(function(n){ return n+1; }); }}
          style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
      ) : (
        <span style={{ fontSize: s*0.3, fontWeight:900, color:cor }}>{iniciais}</span>
      )}
    </div>
  );
}

export default function SecaoFolhetos() {
  const [folhetos, setFolhetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState("");

  function carregar() {
    setLoading(true);
    setErro(false);
    fetch("/api/folhetos")
      .then(function(r){ return r.json(); })
      .then(function(json){
        setFolhetos(json.folhetos || []);
        setAtualizadoEm(json.atualizadoEm || "");
        setLoading(false);
      })
      .catch(function(){
        setErro(true);
        setLoading(false);
      });
  }

  useEffect(function(){ carregar(); }, []);

  function abrirFolheto(url) {
    window.open(url, "_blank");
  }

  return (
    <div className="pb-6">

      {/* Header */}
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative"
        style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow:"0 12px 30px -10px rgba(37,99,235,0.5)" }}>
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10"/>
        <div className="px-5 pt-5 pb-5 text-white relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-black">Folhetos da semana</p>
              <p className="text-xs opacity-80 mt-1">Toca num supermercado para abrir o folheto</p>
            </div>
            <button onClick={carregar} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Estado de erro */}
      {erro && (
        <div className="mx-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center mb-4">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">Erro ao carregar folhetos</p>
          <button onClick={carregar} className="mt-2 text-xs font-black text-red-600 bg-red-100 px-4 py-2 rounded-xl">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grelha de logótipos */}
      {loading ? (
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1,2,3,4].map(function(i){
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-200"/>
                <div className="h-3 w-20 bg-slate-100 rounded"/>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {folhetos.map(function(f){
            const cor = LOJA_CORES[f.loja] || "#888";
            return (
              <button key={f.id}
                onClick={function(){ abrirFolheto(f.url); }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col items-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: cor }}/>
                <LogoLoja loja={f.loja} size={64} />
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800">{f.loja}</p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <ExternalLink size={11} style={{ color: cor }} />
                    <span className="text-[11px] font-black" style={{ color: cor }}>Ver folheto</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Nota de atualização */}
      {!loading && !erro && atualizadoEm && (
        <div className="mx-4 mt-5">
          <p className="text-[10px] text-slate-400 text-center">
            Os folhetos abrem no site oficial de cada supermercado, sempre atualizados.
          </p>
        </div>
      )}
    </div>
  );
}
