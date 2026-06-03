import { useState, useEffect } from "react";
import { Tag, ExternalLink, RefreshCw, AlertCircle, ChevronRight, Star } from "lucide-react";

const LOJA_CORES = {
  Continente:"#e63329", "Pingo Doce":"#009a3e", Lidl:"#0050aa",
  Aldi:"#1a3b6f", "Intermarché":"#e2001a",
};
const LOJA_DOMINIOS = {
  Continente:"continente.pt", "Pingo Doce":"pingodoce.pt", Lidl:"lidl.pt",
  Aldi:"aldi.pt", "Intermarché":"intermarche.pt",
};

function LogoLoja({ loja, size }) {
  const s = size || 36;
  const cor = LOJA_CORES[loja] || "#888";
  const dominio = LOJA_DOMINIOS[loja];
  const [nivel, setNivel] = useState(0);
  const iniciais = loja.slice(0, 2).toUpperCase();
  const fontes = dominio ? [
    "https://www.google.com/s2/favicons?domain=" + dominio + "&sz=64",
    "https://logo.clearbit.com/" + dominio,
  ] : [];
  return (
    <div className="rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: s, height: s, backgroundColor: cor + "18", border: "1.5px solid " + cor + "33" }}>
      {nivel < fontes.length ? (
        <img src={fontes[nivel]} alt={loja}
          onError={function(){ setNivel(function(n){ return n + 1; }); }}
          style={{ width: s * 0.72, height: s * 0.72, objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: s * 0.32, fontWeight: 900, color: cor }}>{iniciais}</span>
      )}
    </div>
  );
}

export default function SecaoFolhetos() {
  const [folhetos, setFolhetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState("");
  const [filtro, setFiltro] = useState("Todas");

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

  const lojas = ["Todas", ...Object.keys(LOJA_CORES)];
  const filtrados = filtro === "Todas" ? folhetos : folhetos.filter(function(f){ return f.loja === filtro; });
  const destaques = folhetos.filter(function(f){ return f.destaque; });

  function abrirFolheto(url) {
    window.open(url, "_blank");
  }

  return (
    <div className="pb-6">

      {/* Header */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
        <div className="px-4 pt-4 pb-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Folhetos Semanais</span>
              </div>
              <p className="text-xl font-black">Promoções em Destaque</p>
              <p className="text-xs opacity-75 mt-0.5">
                {atualizadoEm ? "Atualizado em " + atualizadoEm : "A carregar..."}
              </p>
            </div>
            <button onClick={carregar} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Logos das lojas */}
        <div className="bg-white/10 px-4 py-2.5 flex items-center gap-3">
          {Object.keys(LOJA_CORES).map(function(loja){
            return (
              <div key={loja} className="flex flex-col items-center gap-1">
                <LogoLoja loja={loja} size={30} />
                <p className="text-[8px] text-white/70 font-semibold">{loja.split(" ")[0]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Destaques */}
      {!loading && destaques.length > 0 && (
        <div className="px-4 mb-4">
          <p className="text-xs font-black text-slate-600 mb-2 flex items-center gap-1">
            <Star size={12} className="text-amber-500" /> Em destaque esta semana
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {destaques.map(function(f){
              const cor = LOJA_CORES[f.loja] || "#888";
              return (
                <button key={f.id}
                  onClick={function(){ abrirFolheto(f.url); }}
                  className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm active:scale-95 transition-all text-left">
                  {/* Capa ou placeholder */}
                  <div className="w-full h-24 flex items-center justify-center relative"
                    style={{ backgroundColor: cor + "12" }}>
                    {f.capa ? (
                      <img src={f.capa} alt={f.titulo}
                        className="w-full h-full object-cover"
                        onError={function(e){ e.target.style.display="none"; }} />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <LogoLoja loja={f.loja} size={40} />
                        <p className="text-[9px] font-bold" style={{ color: cor }}>{f.loja}</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cor }}>
                        NOVO
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-black text-slate-800 leading-tight">{f.titulo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{f.validade}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <ExternalLink size={10} style={{ color: cor }} />
                      <p className="text-[10px] font-black" style={{ color: cor }}>Ver folheto</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtro por loja */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {lojas.map(function(loja){
            const ativo = filtro === loja;
            const cor = LOJA_CORES[loja];
            return (
              <button key={loja}
                onClick={function(){ setFiltro(loja); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: ativo ? (cor || "#2563eb") : "white",
                  color: ativo ? "white" : "#64748b",
                  border: ativo ? "none" : "1px solid #e2e8f0",
                }}>
                {loja !== "Todas" && <LogoLoja loja={loja} size={16} />}
                {loja}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista folhetos */}
      {loading ? (
        <div className="px-4 flex flex-col gap-3">
          {[1,2,3].map(function(i){
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded mb-2" />
                    <div className="h-2 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : erro ? (
        <div className="mx-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">Erro ao carregar folhetos</p>
          <button onClick={carregar} className="mt-2 text-xs font-black text-red-600 bg-red-100 px-4 py-2 rounded-xl">
            Tentar novamente
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="mx-4 bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
          <Tag size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-500">Sem folhetos disponíveis</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-2.5">
          {filtrados.map(function(f){
            const cor = LOJA_CORES[f.loja] || "#888";
            return (
              <button key={f.id}
                onClick={function(){ abrirFolheto(f.url); }}
                className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left active:scale-95 transition-all">
                <div className="flex items-center gap-3">
                  <LogoLoja loja={f.loja} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm leading-tight">{f.titulo}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: cor }}>{f.loja}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{f.validade}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {f.categorias && f.categorias.map(function(cat){
                        return (
                          <span key={cat} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {cat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cor + "15" }}>
                      <ExternalLink size={16} style={{ color: cor }} />
                    </div>
                    <p className="text-[9px] font-black" style={{ color: cor }}>Abrir</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Nota de atualização */}
      {!loading && !erro && (
        <div className="mx-4 mt-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-[10px] text-blue-700 font-semibold text-center">
            📅 Folhetos atualizados manualmente · Última atualização: {atualizadoEm || "—"}
          </p>
        </div>
      )}
    </div>
  );
}
