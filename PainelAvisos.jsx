import { ShieldCheck, Bell, Tag, X, Lightbulb } from "lucide-react";

export default function PainelAvisos({ avisos, onFechar, onAbrirTaloes }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background:"rgba(15,23,42,0.4)" }} onClick={onFechar}>
      <div className="mt-auto bg-slate-50 rounded-t-3xl max-h-[80vh] overflow-y-auto" onClick={function(e){ e.stopPropagation(); }}>

        {/* Cabeçalho */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <p className="text-base font-black text-slate-900">Avisos</p>
          </div>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">

          {/* Garantias a acabar */}
          {avisos.garantias && avisos.garantias.length > 0 && avisos.garantias.map(function(g, i){
            return (
              <button key={"g"+i} onClick={onAbrirTaloes}
                className="w-full text-left bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:scale-95 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"#fef3c7" }}>
                  <ShieldCheck size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Garantia a terminar</p>
                  <p className="text-sm font-black text-slate-800 leading-tight">{g.produto}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{g.restam === 0 ? "Acaba hoje" : "Acaba daqui a " + g.restam + " dias"}</p>
                </div>
              </button>
            );
          })}

          {/* Dica do dia */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Dica</p>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">Compara os folhetos antes de ir às compras e poupa nos artigos da semana.</p>
            </div>
          </div>

          {/* Novidade */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Tag size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Novidade</p>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">Já podes guardar os teus talões de compras e garantias na secção "Os meus talões".</p>
            </div>
          </div>

          {/* Estado vazio de garantias */}
          {(!avisos.garantias || avisos.garantias.length === 0) && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center">
              <ShieldCheck size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">Sem garantias a terminar</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Avisamos-te quando alguma estiver perto do fim.</p>
            </div>
          )}

          <p className="text-[10px] text-slate-300 text-center mt-1 mb-2">Os avisos no telemóvel chegam quando abres a app. Notificações automáticas virão com a app instalável.</p>

        </div>
      </div>
    </div>
  );
}
