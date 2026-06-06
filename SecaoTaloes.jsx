import { useState } from "react";
import {
  Camera, Upload, Receipt, ShieldCheck, ShoppingCart,
  ChevronRight, X, Clock, AlertTriangle, Check, FileText,
  TrendingUp, Plus, Package,
} from "lucide-react";

const COMPRAS = [
  { id: 1, loja: "Continente",  data: "2026-06-02", total: 23.47, itens: 8 },
  { id: 2, loja: "Pingo Doce",  data: "2026-05-28", total: 41.10, itens: 14 },
  { id: 3, loja: "Lidl",        data: "2026-05-24", total: 18.65, itens: 6 },
  { id: 4, loja: "Continente",  data: "2026-05-19", total: 52.30, itens: 19 },
];

const GARANTIAS = [
  { id: 1, produto: "Máquina de Lavar Bosch", loja: "Worten",    data: "2024-07-15", anos: 2, preco: 449.00 },
  { id: 2, produto: "Telemóvel Samsung A55",  loja: "Fnac",      data: "2025-11-20", anos: 2, preco: 379.00 },
  { id: 3, produto: "Aspirador Dyson",         loja: "MediaMarkt",data: "2026-03-10", anos: 2, preco: 299.00 },
];

const CORES = {
  Continente: "#e63329", "Pingo Doce": "#009a3e", Lidl: "#0050aa",
  Aldi: "#1a3b6f", "Intermarché": "#e2001a",
  Worten: "#e30613", Fnac: "#e1a300", MediaMarkt: "#df0000",
};

function diasGarantia(dataCompra, anos) {
  const fim = new Date(dataCompra);
  fim.setFullYear(fim.getFullYear() + anos);
  const dias = Math.ceil((fim - new Date()) / (1000 * 60 * 60 * 24));
  return { dias, fim };
}

function fmtData(d) {
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const dt = new Date(d);
  return `${dt.getDate()} ${meses[dt.getMonth()]} ${dt.getFullYear()}`;
}

function ModalGuardar({ onFechar }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-black text-slate-900">Guardar talão</p>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X size={17} className="text-slate-500" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <button
            className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.5)" }}
          >
            <Camera size={20} /> Tirar foto ao talão
          </button>
          <button className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all bg-white border-2 border-slate-100 text-slate-600">
            <Upload size={20} /> Escolher da galeria
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-4">
          A foto fica guardada em segurança no teu histórico.
        </p>
      </div>
    </div>
  );
}

export default function SecaoTaloes() {
  const [aba, setAba]         = useState("compras");
  const [modal, setModal]     = useState(false);

  const totalMes = COMPRAS
    .filter(c => c.data >= "2026-06-01")
    .reduce((s, c) => s + c.total, 0);

  return (
    <div className="pb-28">

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        {[
          { id: "compras",   label: "Compras",   icon: ShoppingCart },
          { id: "garantias", label: "Garantias", icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              aba === t.id
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══ COMPRAS ══ */}
      {aba === "compras" && (
        <div className="anim-up">
          {/* Hero */}
          <div
            className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 16px 40px -12px rgba(37,99,235,0.45)" }}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={11} /> Gasto este mês
            </p>
            <p className="text-4xl font-black text-white mt-1">{totalMes.toFixed(2)} €</p>
            <p className="text-xs text-white/60 mt-0.5">{COMPRAS.length} talões guardados</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}
          >
            <Camera size={17} /> Guardar novo talão
          </button>

          {/* Lista */}
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Histórico de compras</p>
          <div className="px-4 flex flex-col gap-2.5">
            {COMPRAS.map(c => {
              const cor = CORES[c.loja] || "#888";
              return (
                <div key={c.id} className="card p-4 flex items-center gap-3 press active:scale-[0.98] cursor-pointer">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cor}18` }}
                  >
                    <Receipt size={19} style={{ color: cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">{c.loja}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtData(c.data)} · {c.itens} artigos</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-slate-800 text-sm">{c.total.toFixed(2)} €</p>
                    <ChevronRight size={13} className="text-slate-300 ml-auto mt-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ GARANTIAS ══ */}
      {aba === "garantias" && (
        <div className="anim-up">
          {/* Hero */}
          <div
            className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 16px 40px -12px rgba(5,150,105,0.45)" }}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={11} /> Garantias ativas
            </p>
            <p className="text-4xl font-black text-white mt-1">{GARANTIAS.length}</p>
            <p className="text-xs text-white/60 mt-0.5">produtos protegidos</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.4)" }}
          >
            <Camera size={17} /> Guardar talão de garantia
          </button>

          {/* Lista */}
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Os teus produtos</p>
          <div className="px-4 flex flex-col gap-2.5">
            {GARANTIAS.map(g => {
              const cor = CORES[g.loja] || "#888";
              const { dias, fim } = diasGarantia(g.data, g.anos);
              const expirada = dias < 0;
              const urgente  = dias >= 0 && dias <= 60;

              return (
                <div key={g.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${cor}18` }}
                    >
                      <Package size={19} style={{ color: cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm leading-snug">{g.produto}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{g.loja} · Comprado a {fmtData(g.data)}</p>
                      <p className="text-[12px] font-black text-slate-700 mt-0.5">{g.preco.toFixed(2)} €</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    {expirada ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-400">
                        <Clock size={11} /> Garantia terminada
                      </span>
                    ) : urgente ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600">
                        <AlertTriangle size={11} /> Acaba em {dias} dias
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
                        <Check size={11} /> Garantia válida
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">até {fmtData(fim)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="mx-4 mt-4 rounded-2xl p-3.5 flex gap-2.5" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Guarda os talões dos eletrodomésticos e tens sempre prova de compra à mão quando precisares de acionar a garantia.
            </p>
          </div>
        </div>
      )}

      {modal && <ModalGuardar onFechar={() => setModal(false)} />}
    </div>
  );
}
