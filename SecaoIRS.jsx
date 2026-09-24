import { useState, useEffect, useMemo } from "react";
import {
  Calculator, TrendingUp, TrendingDown, Info, Users,
  Heart, GraduationCap, Home, Building2, ShoppingCart, Wallet,
} from "lucide-react";

/*
 * IRS 2026 (Continente) — rendimentos de 2026, declarados em 2027.
 *
 * Tabela do art. 68.º do CIRS na redação da Lei 73-A/2025 (OE 2026),
 * copiada do Portal das Finanças em 24/09/2026.
 *
 * A que aqui estava dizia "2025" mas era a tabela ORIGINAL de 2025 (Lei
 * 45-A/2024): já tinha sido revista em Julho de 2025 (Lei 55-A/2025) e
 * outra vez pelo OE 2026. Duas actualizações atrás.
 *
 * Só se guardam limites e taxas, que é o que a lei publica. A parcela a
 * abater calcula-se — é o que garante a continuidade entre escalões — e
 * assim não há um terceiro número por escalão para se desalinhar.
 */
const TABELA_ART68_2026 = [
  { ate: 8342,     taxa: 0.125 },
  { ate: 12587,    taxa: 0.157 },
  { ate: 17838,    taxa: 0.212 },
  { ate: 23089,    taxa: 0.241 },
  { ate: 29397,    taxa: 0.311 },
  { ate: 43090,    taxa: 0.349 },
  { ate: 46566,    taxa: 0.431 },
  { ate: 86634,    taxa: 0.446 },
  { ate: Infinity, taxa: 0.48  },
];

export const ESCALOES_IRS = TABELA_ART68_2026.reduce((acc, e, i) => {
  const ant = acc[i - 1];
  const abater = ant ? ant.abater + ant.ate * (e.taxa - ant.taxa) : 0;
  acc.push({ ...e, abater });
  return acc;
}, []);

// Art. 25.º, n.º 1, a): 8,54 × IAS. IAS 2026 = 537,13 € (Portaria 480-A/2025/1).
const IAS_2026 = 537.13;
const DEDUCAO_ESPECIFICA = Math.round(8.54 * IAS_2026 * 100) / 100; // 4587,09 €

// Art. 78.º-E: limite da dedução com rendas em 2026 — 900 € pela norma
// transitória do DL 97/2026 (1000 € a partir de 2027). Rendimentos baixos
// podem ter limite maior (n.º 4); o simulador fica pelo geral.
const LIMITE_RENDAS = 900;

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
      ESCALOES_IRS.find((e) => base <= e.ate) ||
      ESCALOES_IRS[ESCALOES_IRS.length - 1];
    const coleta = Math.max(0, (base * escalao.taxa - escalao.abater) * quociente);

    const multTitular = conjunta ? 2 : 1;
    const dGerais = Math.min(num(form.despGerais) * 0.35, 250 * multTitular);
    const dSaude = Math.min(num(form.saude) * 0.15, 1000);
    const dEducacao = Math.min(num(form.educacao) * 0.30, 800);
    const dHabitacao = Math.min(num(form.habitacao) * 0.15, LIMITE_RENDAS);
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
    color: "var(--pj-text-faint)",
  };
  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-[color:var(--pj-border)] bg-white text-sm outline-none pj-tap focus:border-[color:var(--pj-brand)] focus:ring-2 focus:ring-[#0b6b4f]/10";
  const inputStyle = { color: "var(--pj-text)", accentColor: "var(--pj-brand-ink)" };

  return (
    <div className="pb-28" style={{ background: "var(--pj-surface)" }}>
      {/* Header (flat) */}
      <div className="anim-up mx-4 mt-6 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--pj-subtle)" }}
          >
            <Calculator size={22} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <div>
            <p style={LABEL}>Estimativa fiscal</p>
            <p
              className="font-display"
              style={{ fontSize: 24, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.15 }}
            >
              Simulador de IRS
            </p>
            <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>
              Rendimentos de 2026, a declarar em 2027
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-5" style={{ borderTop: "1px solid var(--pj-border)" }} />

      {/* Formulário */}
      <div
        className="anim-up mx-4 mb-4 rounded-2xl p-5"
        style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
      >
        <p
          className="font-display mb-4 flex items-center gap-2"
          style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-text)" }}
        >
          <Wallet size={16} style={{ color: "var(--pj-brand-ink)" }} /> Os teus dados
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

        <div className="mt-5 mb-4" style={{ borderTop: "1px solid var(--pj-subtle)" }} />
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
                style={{ background: "var(--pj-subtle)" }}
              >
                <d.icon size={16} style={{ color: "var(--pj-brand-ink)" }} />
              </div>
              <div className="flex-1">
                <span
                  className="block mb-1 leading-tight"
                  style={{ fontSize: 12, color: "var(--pj-text-muted)" }}
                >
                  {d.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form[d.campo]}
                  onChange={set(d.campo)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[color:var(--pj-border)] bg-white text-sm outline-none pj-tap focus:border-[color:var(--pj-brand)] focus:ring-2 focus:ring-[#0b6b4f]/10"
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
            style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
          >
            <p style={LABEL}>IRS anual estimado</p>
            <p
              className="font-display"
              style={{ fontSize: 40, fontWeight: 600, color: "var(--pj-text)", marginTop: 4, lineHeight: 1.05 }}
            >
              {fmt(calc.irsFinal)}
            </p>
            <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 6 }}>
              Taxa efetiva de {calc.taxaEfetiva.toFixed(1)}%
            </p>
          </div>

          {/* Reembolso / a pagar */}
          {calc.temRetido && (
            <div
              className="anim-up mx-4 mb-4 rounded-2xl p-5"
              style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--pj-subtle)" }}
                >
                  {reembolso ? (
                    <TrendingUp size={22} style={{ color: "var(--pj-brand-ink)" }} />
                  ) : (
                    <TrendingDown size={22} style={{ color: "#b4531f" }} />
                  )}
                </div>
                <div>
                  <p style={{ ...LABEL, color: reembolso ? "var(--pj-brand-ink)" : "#b4531f" }}>
                    {reembolso ? "Reembolso estimado" : "Valor a pagar"}
                  </p>
                  <p
                    className="font-display"
                    style={{
                      fontSize: 28,
                      fontWeight: 600,
                      color: reembolso ? "var(--pj-brand-ink)" : "#b4531f",
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
            style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
          >
            <p
              className="font-display mb-4 flex items-center gap-2"
              style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-text)" }}
            >
              <Users size={16} style={{ color: "var(--pj-brand-ink)" }} /> Desdobramento
            </p>
            <div className="flex flex-col">
              {[
                { label: "Rendimento coletável", valor: fmt(calc.rendimentoColetavel) },
                { label: "Coleta", valor: fmt(calc.coleta) },
                { label: "Total deduções", valor: "− " + fmt(calc.totalDeducoes) },
                { label: "IRS final", valor: fmt(calc.irsFinal), forte: true },
                { label: "Taxa efetiva", valor: calc.taxaEfetiva.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%" },
              ].map((r, i, arr) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-2.5"
                  style={
                    i < arr.length - 1 ? { borderBottom: "1px solid var(--pj-subtle)" } : undefined
                  }
                >
                  <span
                    className={r.forte ? "font-display" : ""}
                    style={{
                      fontSize: 14,
                      fontWeight: r.forte ? 600 : 500,
                      color: r.forte ? "var(--pj-text)" : "var(--pj-text-muted)",
                    }}
                  >
                    {r.label}
                  </span>
                  <span
                    className={r.forte ? "font-display" : ""}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: r.forte ? "var(--pj-brand-ink)" : "var(--pj-text)",
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
        style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
      >
        <Info size={16} style={{ color: "var(--pj-text-faint)" }} className="flex-shrink-0 mt-0.5" />
        <p style={{ fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>
          ⚠️ Esta é uma estimativa simplificada para te orientares. O valor real
          depende de outros fatores. Confirma sempre no Portal das Finanças.
        </p>
      </div>
    </div>
  );
}
