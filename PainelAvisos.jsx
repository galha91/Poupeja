import React from "react";
import { ShieldCheck, Bell, Tag, X, Lightbulb, ChevronRight } from "lucide-react";

export default function PainelAvisos({ avisos = {}, onFechar, onAbrirTaloes }) {
  const garantias = avisos.garantias || [];

  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="mt-auto bg-slate-50 rounded-t-3xl max-h-[80vh] overflow-y-auto no-scrollbar"
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell size={16} className="text-blue-600" />
            </div>
            <p className="text-base font-black text-slate-900">Avisos</p>
            {garantias.length > 0 && (
              <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {garantias.length}
              </span>
            )}
          </div>
          <button onClick={onFechar} className="press w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">

          {/* Garantias urgentes */}
          {garantias.map((g, i) => (
            <button
              key={i}
              onClick={onAbrirTaloes}
              className="press w-full text-left bg-white rounded-2xl p-4 border border-amber-100 flex items-center gap-3"
              style={{ boxShadow: "0 4px 16px -4px rgba(217,119,6,0.15)" }}
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Garantia a terminar</p>
                <p className="text-sm font-black text-slate-900 leading-snug mt-0.5">{g.produto}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {g.restam === 0 ? "Acaba hoje" : `Acaba daqui a ${g.restam} dias`}
                </p>
              </div>
              <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}

          {/* Tip folhetos */}
          <div className="rounded-2xl p-4 flex gap-3" style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)", border: "1.5px solid #c7d2fe" }}>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={17} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Dica</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">
                Compara os folhetos antes de ir às compras e poupa nos artigos da semana.
              </p>
            </div>
          </div>

          {/* Novidade */}
          <div className="bg-white rounded-2xl p-4 flex gap-3 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Tag size={17} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Novidade</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">
                Já podes guardar talões de compras e garantias na secção "Os meus talões".
              </p>
            </div>
          </div>

          {/* Estado vazio */}
          {garantias.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
              <ShieldCheck size={28} className="text-slate-200 mb-2" />
              <p className="text-sm font-black text-slate-500">Sem garantias a terminar</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Avisamos-te quando alguma estiver perto do fim.</p>
            </div>
          )}

          <p className="text-[10px] text-slate-300 text-center pb-2">
            As notificações automáticas chegam com a app instalável.
          </p>
        </div>
      </div>
    </div>
  );
}
