import { useState } from "react";
import { Camera, Upload, Receipt, ShieldCheck, ShoppingCart, Calendar, Store, ChevronRight, Plus, X, Clock, AlertTriangle, Check, Trash2, FileText, TrendingUp } from "lucide-react";

const COMPRAS_EXEMPLO = [
  { id:1, loja:"Continente", data:"2026-06-02", total:23.47, itens:8 },
  { id:2, loja:"Pingo Doce", data:"2026-05-28", total:41.10, itens:14 },
  { id:3, loja:"Lidl", data:"2026-05-24", total:18.65, itens:6 },
  { id:4, loja:"Continente", data:"2026-05-19", total:52.30, itens:19 },
];

const GARANTIAS_EXEMPLO = [
  { id:1, produto:"Máquina de Lavar Bosch", loja:"Worten", data:"2024-07-15", anos:2, preco:449.00 },
  { id:2, produto:"Telemóvel Samsung A55", loja:"Fnac", data:"2025-11-20", anos:2, preco:379.00 },
  { id:3, produto:"Aspirador Dyson", loja:"MediaMarkt", data:"2026-03-10", anos:2, preco:299.00 },
];

const LOJA_CORES = {
  Continente:"#e63329", "Pingo Doce":"#009a3e", Lidl:"#0050aa", Aldi:"#1a3b6f",
  "Intermarché":"#e2001a", Worten:"#e30613", Fnac:"#e1a300", MediaMarkt:"#df0000",
};

function diasRestantesGarantia(dataCompra, anos) {
  const inicio = new Date(dataCompra);
  const fim = new Date(inicio);
  fim.setFullYear(fim.getFullYear() + anos);
  const hoje = new Date();
  const dias = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
  return { dias: dias, fim: fim };
}

function formatarData(d) {
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const dt = new Date(d);
  return dt.getDate() + " " + meses[dt.getMonth()] + " " + dt.getFullYear();
}

export default function SecaoTaloes() {
  const [aba, setAba] = useState("compras");
  const [adicionar, setAdicionar] = useState(false);

  const totalMes = COMPRAS_EXEMPLO
    .filter(function(c){ return c.data >= "2026-06-01"; })
    .reduce(function(s,c){ return s + c.total; }, 0);

  return (
    <div className="pb-28 pt-4">

      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        <button onClick={function(){ setAba("compras"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (aba === "compras" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <ShoppingCart size={14} /> Compras
        </button>
        <button onClick={function(){ setAba("garantias"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (aba === "garantias" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <ShieldCheck size={14} /> Garantias
        </button>
      </div>

      {aba === "compras" && (
        <div>
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative" style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow:"0 12px 30px -10px rgba(37,99,235,0.5)" }}>
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10"/>
            <div className="p-5 text-white relative z-10">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={13}/> Gasto este mês</p>
              <p className="text-4xl font-black mt-1">{totalMes.toFixed(2)}€</p>
              <p className="text-xs opacity-75 mt-1">{COMPRAS_EXEMPLO.length} talões guardados</p>
            </div>
          </div>

          <button onClick={function(){ setAdicionar(true); }}
            className="mx-4 mb-4 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
            <Camera size={18}/> Guardar talão de compras
          </button>

          <p className="px-4 text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Histórico</p>
          <div className="px-4 flex flex-col gap-2.5">
            {COMPRAS_EXEMPLO.map(function(c){
              const cor = LOJA_CORES[c.loja] || "#888";
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor + "15" }}>
                    <Receipt size={20} style={{ color: cor }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">{c.loja}</p>
                    <p className="text-[11px] text-slate-400">{formatarData(c.data)} · {c.itens} artigos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{c.total.toFixed(2)}€</p>
                    <ChevronRight size={14} className="text-slate-300 ml-auto"/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {aba === "garantias" && (
        <div>
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative" style={{ background:"linear-gradient(135deg,#047857,#10b981)", boxShadow:"0 12px 30px -10px rgba(5,150,105,0.5)" }}>
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10"/>
            <div className="p-5 text-white relative z-10">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck size={13}/> Garantias ativas</p>
              <p className="text-4xl font-black mt-1">{GARANTIAS_EXEMPLO.length}</p>
              <p className="text-xs opacity-75 mt-1">talões guardados em segurança</p>
            </div>
          </div>

          <button onClick={function(){ setAdicionar(true); }}
            className="mx-4 mb-4 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ background:"linear-gradient(135deg,#047857,#10b981)" }}>
            <Camera size={18}/> Guardar talão de garantia
          </button>

          <p className="px-4 text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Os teus produtos</p>
          <div className="px-4 flex flex-col gap-2.5">
            {GARANTIAS_EXEMPLO.map(function(g){
              const cor = LOJA_CORES[g.loja] || "#888";
              const info = diasRestantesGarantia(g.data, g.anos);
              const expirada = info.dias < 0;
              const aacabar = info.dias >= 0 && info.dias <= 60;
              return (
                <div key={g.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor + "15" }}>
                      <FileText size={20} style={{ color: cor }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm leading-tight">{g.produto}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{g.loja} · {formatarData(g.data)}</p>
                    </div>
                    <p className="font-black text-slate-800 text-sm">{g.preco.toFixed(2)}€</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    {expirada ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-400">
                        <Clock size={12}/> Garantia terminada
                      </span>
                    ) : aacabar ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600">
                        <AlertTriangle size={12}/> Acaba em {info.dias} dias
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
                        <Check size={12}/> Garantia válida
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">até {formatarData(info.fim)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-4 mt-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex gap-2">
            <ShieldCheck size={15} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Guarda aqui os talões dos eletrodomésticos e tens sempre a prova de compra à mão quando precisares de acionar a garantia.
            </p>
          </div>
        </div>
      )}

      {adicionar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background:"rgba(0,0,0,0.4)" }} onClick={function(){ setAdicionar(false); }}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8" onClick={function(e){ e.stopPropagation(); }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-black text-slate-800">Guardar talão</p>
              <button onClick={function(){ setAdicionar(false); }} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="flex flex-col gap-3">
              <button className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all" style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                <Camera size={20}/> Tirar foto
              </button>
              <button className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all bg-white border-2 border-slate-100 text-slate-600">
                <Upload size={20}/> Escolher da galeria
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">A foto fica guardada com segurança no teu histórico.</p>
          </div>
        </div>
      )}

    </div>
  );
}
