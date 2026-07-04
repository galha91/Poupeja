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

  const LABEL = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "#8a978e",
  };
  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-[#e4e2d8] bg-white text-sm outline-none pj-tap focus:border-[#0b6b4f] focus:ring-2 focus:ring-[#0b6b4f]/10";
  const inputStyle = { color: "#14231c", accentColor: "#0b6b4f" };

  return (
    <div className="pb-28" style={{ background: "#f6f5f0" }}>
      {/* Header (flat) */}
      <div className="anim-up mx-4 mt-6 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#eeece4" }}
          >
            <Calculator size={22} style={{ color: "#0b6b4f" }} />
          </div>
          <div>
            <p style={LABEL}>Estimativa fiscal</p>
            <p
              className="font-display"
              style={{ fontSize: 24, fontWeight: 600, color: "#14231c", lineHeight: 1.15 }}
            >
              Simulador de IRS
            </p>
            <p style={{ fontSize: 12, color: "#5c6b62", marginTop: 2 }}>
              Estima o teu IRS antes da hora
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-5" style={{ borderTop: "1px solid #e4e2d8" }} />

      {/* Formulário */}
      <div
        className="anim-up mx-4 mb-4 rounded-2xl p-5"
        style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
      >
        <p
          className="font-display mb-4 flex items-center gap-2"
          style={{ fontSize: 16, fontWeight: 600, color: "#14231c" }}
        >
          <Wallet size={16} style={{ color: "#0b6b4f" }} /> Os teus dados
        </p>

        <label className="block mb-3">
          <span className="block mb-1.5" style={LABEL}>
            Rendimento bruto anual (€)
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={form.rendimento}
            onChange={set("rendimento")}
            placeholder="Ex: 20000"
            className={inputCls}
            style={inputStyle}
          />
        </label>

        <label className="block mb-3">
          <span className="block mb-1.5" style={LABEL}>
            Estado civil
          </span>
          <select
            value={form.estadoCivil}
            onChange={set("estadoCivil")}
            className={inputCls}
            style={inputStyle}
          >
            <option value="solteiro">Solteiro/Não casado</option>
            <option value="casado">Casado/Unido de facto</option>
          </select>
        </label>

        {calc.casado && (
          <label className="block mb-3">
            <span className="block mb-1.5" style={LABEL}>
              Tributação
            </span>
            <select
              value={form.tributacao}
              onChange={set("tributacao")}
              className={inputCls}
              style={inputStyle}
            >
              <option value="separada">Separada</option>
              <option value="conjunta">Conjunta</option>
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="block mb-1.5" style={LABEL}>
              Dependentes
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="10"
              value={form.dependentes}
              onChange={set("dependentes")}
              className={inputCls}
              style={inputStyle}
            />
          </label>
          <label className="block">
            <span className="block mb-1.5" style={LABEL}>
              IRS retido (€)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={form.retido}
              onChange={set("retido")}
              placeholder="Opcional"
              className={inputCls}
              style={inputStyle}
            />
          </label>
        </div>

        <div className="mt-5 mb-4" style={{ borderTop: "1px solid #eeece4" }} />
        <p style={{ ...LABEL, marginBottom: 12 }}>Despesas dedutíveis</p>
        <div className="flex flex-col gap-3">
          {[
            { campo: "despGerais", label: "Despesas gerais familiares (€)", icon: ShoppingCart },
            { campo: "saude", label: "Saúde (€)", icon: Heart },
            { campo: "educacao", label: "Educação (€)", icon: GraduationCap },
            { campo: "habitacao", label: "Habitação — renda ou juros (€)", icon: Home },
            { campo: "lares", label: "Lares (€)", icon: Building2 },
          ].map((d) => (
            <label key={d.campo} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#eeece4" }}
              >
                <d.icon size={16} style={{ color: "#0b6b4f" }} />
              </div>
              <div className="flex-1">
                <span
                  className="block mb-1 leading-tight"
                  style={{ fontSize: 12, color: "#5c6b62" }}
                >
                  {d.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form[d.campo]}
                  onChange={set(d.campo)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2d8] bg-white text-sm outline-none pj-tap focus:border-[#0b6b4f] focus:ring-2 focus:ring-[#0b6b4f]/10"
                  style={inputStyle}
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
            className="anim-up mx-4 mb-4 rounded-2xl p-5"
            style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
          >
            <p style={LABEL}>IRS anual estimado</p>
            <p
              className="font-display"
              style={{ fontSize: 40, fontWeight: 600, color: "#14231c", marginTop: 4, lineHeight: 1.05 }}
            >
              {fmt(calc.irsFinal)}
            </p>
            <p style={{ fontSize: 12, color: "#5c6b62", marginTop: 6 }}>
              Taxa efetiva de {calc.taxaEfetiva.toFixed(1)}%
            </p>
          </div>

          {/* Reembolso / a pagar */}
          {calc.temRetido && (
            <div
              className="anim-up mx-4 mb-4 rounded-2xl p-5"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#eeece4" }}
                >
                  {reembolso ? (
                    <TrendingUp size={22} style={{ color: "#0b6b4f" }} />
                  ) : (
                    <TrendingDown size={22} style={{ color: "#b4531f" }} />
                  )}
                </div>
                <div>
                  <p style={{ ...LABEL, color: reembolso ? "#0b6b4f" : "#b4531f" }}>
                    {reembolso ? "Reembolso estimado" : "Valor a pagar"}
                  </p>
                  <p
                    className="font-display"
                    style={{
                      fontSize: 28,
                      fontWeight: 600,
                      color: reembolso ? "#0b6b4f" : "#b4531f",
                      marginTop: 2,
                      lineHeight: 1.05,
                    }}
                  >
                    {fmt(Math.abs(calc.resultado))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desdobramento */}
          <div
            className="anim-up mx-4 mb-4 rounded-2xl p-5"
            style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
          >
            <p
              className="font-display mb-4 flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 600, color: "#14231c" }}
            >
              <Users size={16} style={{ color: "#0b6b4f" }} /> Desdobramento
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
                  className="flex items-center justify-between py-2.5"
                  style={
                    i < arr.length - 1 ? { borderBottom: "1px solid #eeece4" } : undefined
                  }
                >
                  <span
                    className={r.forte ? "font-display" : ""}
                    style={{
                      fontSize: 14,
                      fontWeight: r.forte ? 600 : 500,
                      color: r.forte ? "#14231c" : "#5c6b62",
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    className={r.forte ? "font-display" : ""}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: r.forte ? "#0b6b4f" : "#14231c",
                    }}
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
      <div
        className="anim-up mx-4 mb-4 rounded-2xl p-4 flex gap-2.5"
        style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
      >
        <Info size={16} style={{ color: "#8a978e" }} className="flex-shrink-0 mt-0.5" />
        <p style={{ fontSize: 12, color: "#5c6b62", lineHeight: 1.6 }}>
          ⚠️ Esta é uma estimativa simplificada para te orientares. O valor real
          depende de outros fatores. Confirma sempre no Portal das Finanças.
        </p>
      </div>
    </div>
  );
}
