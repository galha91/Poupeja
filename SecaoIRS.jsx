import { useState, useEffect, useMemo } from "react";
import {
  Calculator, TrendingUp, TrendingDown, Info, Users,
  Heart, GraduationCap, Home, Building2, ShoppingCart, Wallet,
} from "lucide-react";

// IRS 2025 (Continente) — rendimento coletável anual
// [limite_superior, taxa, parcela_a_abater]
const ESCALOES_IRS_2025 = [
  { ate: 8059,     taxa: 0.13,  abater: 0 },
  { ate: 12160,    taxa: 0.165, abater: 282.07 },
  { ate: 17233,    taxa: 0.22,  abater: 950.91 },
  { ate: 22306,    taxa: 0.25,  abater: 1467.91 },
  { ate: 28400,    taxa: 0.32,  abater: 3028.38 },
  { ate: 41629,    taxa: 0.355, abater: 4022.43 },
  { ate: 44987,    taxa: 0.435, abater: 7353.76 },
  { ate: 83696,    taxa: 0.45,  abater: 8028.38 },
  { ate: Infinity, taxa: 0.48,  abater: 10539.00 },
];

const DEDUCAO_ESPECIFICA = 4104;

const fmt = (v) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const ESTADO_INICIAL = {
  rendimento: "",
  estadoCivil: "solteiro",
  tributacao: "separada",
  dependentes: "0",
  retido: "",
  despGerais: "",
  saude: "",
  educacao: "",
  habitacao: "",
  lares: "",
};

export default function SecaoIRS() {
  const [form, setForm] = useState(ESTADO_INICIAL);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("poupeja_irs");
      if (raw) setForm({ ...ESTADO_INICIAL, ...JSON.parse(raw) });
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("poupeja_irs", JSON.stringify(form));
    } catch (_) {}
  }, [form]);

  const set = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const calc = useMemo(() => {
    const bruto = num(form.rendimento);
    const casado = form.estadoCivil === "casado";
    const conjunta = casado && form.tributacao === "conjunta";
    const deps = Math.max(0, Math.min(10, Math.round(num(form.dependentes))));
    const retido = num(form.retido);

    const rendimentoColetavel = Math.max(0, bruto - DEDUCAO_ESPECIFICA);
    const quociente = conjunta ? 2 : 1;

    const base = rendimentoColetavel / quociente;
    const escalao =
      ESCALOES_IRS_2025.find((e) => base <= e.ate) ||
      ESCALOES_IRS_2025[ESCALOES_IRS_2025.length - 1];
    const coleta = Math.max(0, (base * escalao.taxa - escalao.abater) * quociente);

    const multTitular = conjunta ? 2 : 1;
    const dGerais = Math.min(num(form.despGerais) * 0.35, 250 * multTitular);
    const dSaude = Math.min(num(form.saude) * 0.15, 1000);
    const dEducacao = Math.min(num(form.educacao) * 0.30, 800);
    const dHabitacao = Math.min(num(form.habitacao) * 0.15, 600);
    const dLares = Math.min(num(form.lares) * 0.25, 403.75);
    const dDependentes = deps * 600;

    const totalDeducoes =
      dDependentes + dGerais + dSaude + dEducacao + dHabitacao + dLares;

    const irsFinal = Math.max(0, coleta - totalDeducoes);
    const temRetido = form.retido !== "" && retido > 0;
    const resultado = retido - irsFinal;
    const taxaEfetiva = bruto > 0 ? (irsFinal / bruto) * 100 : 0;

    return {
      bruto,
      rendimentoColetavel,
      coleta,
      totalDeducoes,
      irsFinal,
      temRetido,
      retido,
      resultado,
      taxaEfetiva,
      casado,
      preenchido: bruto > 0,
    };
  }, [form]);

  const reembolso = calc.resultado >= 0;

  return (
    <div className="pb-28">
      {/* Hero */}
      <div
        className="anim-up mx-4 mt-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)",
          boxShadow: "0 20px 50px -15px rgba(124,58,237,0.45)",
        }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Calculator size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">
              Estimativa fiscal
            </p>
            <p className="text-xl font-black text-white">Simulador de IRS</p>
            <p className="text-[11px] text-white/60 mt-0.5">
              Estima o teu IRS antes da hora
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="anim-up mx-4 mb-4 card p-5">
        <p className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Wallet size={15} className="text-purple-500" /> Os teus dados
        </p>

        <label className="block mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
            Rendimento bruto anual (€)
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={form.rendimento}
            onChange={set("rendimento")}
            placeholder="Ex: 20000"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
          />
        </label>

        <label className="block mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
            Estado civil
          </span>
          <select
            value={form.estadoCivil}
            onChange={set("estadoCivil")}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
          >
            <option value="solteiro">Solteiro/Não casado</option>
            <option value="casado">Casado/Unido de facto</option>
          </select>
        </label>

        {calc.casado && (
          <label className="block mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Tributação
            </span>
            <select
              value={form.tributacao}
              onChange={set("tributacao")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
            >
              <option value="separada">Separada</option>
              <option value="conjunta">Conjunta</option>
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Dependentes
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="10"
              value={form.dependentes}
              onChange={set("dependentes")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              IRS retido (€)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={form.retido}
              onChange={set("retido")}
              placeholder="Opcional"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
            />
          </label>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-5 mb-3">
          Despesas dedutíveis
        </p>
        <div className="flex flex-col gap-3">
          {[
            { campo: "despGerais", label: "Despesas gerais familiares (€)", icon: ShoppingCart },
            { campo: "saude", label: "Saúde (€)", icon: Heart },
            { campo: "educacao", label: "Educação (€)", icon: GraduationCap },
            { campo: "habitacao", label: "Habitação — renda ou juros (€)", icon: Home },
            { campo: "lares", label: "Lares (€)", icon: Building2 },
          ].map((d) => (
            <label key={d.campo} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                <d.icon size={16} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-medium text-slate-500 block mb-1 leading-tight">
                  {d.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form[d.campo]}
                  onChange={set(d.campo)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {calc.preenchido && (
        <>
          {/* IRS estimado */}
          <div
            className="anim-up mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)",
              boxShadow: "0 20px 50px -15px rgba(124,58,237,0.4)",
            }}
          >
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest relative z-10">
              IRS anual estimado
            </p>
            <p className="text-5xl font-black text-white mt-1 relative z-10">
              {fmt(calc.irsFinal)}
            </p>
            <p className="text-[12px] text-white/60 mt-1 relative z-10">
              Taxa efetiva de {calc.taxaEfetiva.toFixed(1)}%
            </p>
          </div>

          {/* Reembolso / a pagar */}
          {calc.temRetido && (
            <div
              className={`anim-up mx-4 mb-4 card p-5 border ${
                reembolso ? "border-emerald-200" : "border-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    reembolso ? "bg-emerald-50" : "bg-amber-50"
                  }`}
                >
                  {reembolso ? (
                    <TrendingUp size={22} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={22} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      reembolso ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {reembolso ? "Reembolso estimado" : "Valor a pagar"}
                  </p>
                  <p
                    className={`text-3xl font-black ${
                      reembolso ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {fmt(Math.abs(calc.resultado))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desdobramento */}
          <div className="anim-up mx-4 mb-4 card p-5">
            <p className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <Users size={15} className="text-purple-500" /> Desdobramento
            </p>
            <div className="flex flex-col">
              {[
                { label: "Rendimento coletável", valor: fmt(calc.rendimentoColetavel) },
                { label: "Coleta", valor: fmt(calc.coleta) },
                { label: "Total deduções", valor: "− " + fmt(calc.totalDeducoes) },
                { label: "IRS final", valor: fmt(calc.irsFinal), forte: true },
                { label: "Taxa efetiva", valor: calc.taxaEfetiva.toFixed(1) + "%" },
              ].map((r, i, arr) => (
                <div
                  key={r.label}
                  className={`flex items-center justify-between py-2.5 ${
                    i < arr.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <span
                    className={`text-sm ${
                      r.forte ? "font-black text-slate-800" : "font-medium text-slate-500"
                    }`}
                  >
                    {r.label}
                  </span>
                  <span
                    className={`text-sm ${
                      r.forte ? "font-black text-purple-600" : "font-bold text-slate-700"
                    }`}
                  >
                    {r.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="anim-up mx-4 mb-4 rounded-2xl p-4 bg-amber-50 border border-amber-100 flex gap-2.5">
        <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          ⚠️ Esta é uma estimativa simplificada para te orientares. O valor real
          depende de outros fatores. Confirma sempre no Portal das Finanças.
        </p>
      </div>
    </div>
  );
}
