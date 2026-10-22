import { useState } from "react";
import { simular } from "./lib/credito";
import { estiloCartao } from "./PaginasPrecos";

/*
 * Simulador de crédito habitação para a página pública /credito-habitacao.
 * As mesmas contas da secção Contas da app (lib/credito), com a Euribor do
 * mês já preenchida. Tudo no browser; nada é guardado nem enviado.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

function Campo({ id, rotulo, valor, onChange, passo, min, max, sufixo }) {
  return (
    <label htmlFor={id} style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 }}>{rotulo}</span>
      <span className="flex items-center" style={{ gap: 8 }}>
        <input id={id} type="number" inputMode="decimal" value={valor} step={passo} min={min} max={max}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
        <span style={{ fontSize: 14, color: "var(--pj-text-muted)", width: 34 }}>{sufixo}</span>
      </span>
    </label>
  );
}

export default function SimuladorCredito({ euribores }) {
  const inicial = euribores.find((e) => e.id === "6M") || euribores[0];
  const [capital, setCapital] = useState("150000");
  const [anos, setAnos] = useState("30");
  const [spread, setSpread] = useState("1");
  const [indexante, setIndexante] = useState(inicial?.id || "manual");
  const [euriborManual, setEuriborManual] = useState(inicial ? String(inicial.valor) : "2.5");
  const euribor = indexante === "manual" ? Number(euriborManual) : euribores.find((e) => e.id === indexante)?.valor ?? 0;
  const c = Math.max(Number(capital) || 0, 0), a = Math.min(Math.max(Number(anos) || 0, 1), 50), s = Math.max(Number(spread) || 0, 0);
  const r = c > 0 ? simular({ capital: c, anos: a, spread: s, euribor }) : null;
  // E se a Euribor subir ou descer 1 ponto?
  const mais = c > 0 ? simular({ capital: c, anos: a, spread: s, euribor: euribor + 1 }) : null;
  const menos = c > 0 ? simular({ capital: c, anos: a, spread: s, euribor: Math.max(euribor - 1, 0) }) : null;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <Campo id="capital" rotulo="Valor em dívida" valor={capital} onChange={setCapital} passo={1000} min={0} sufixo="€" />
        <Campo id="anos" rotulo="Prazo" valor={anos} onChange={setAnos} passo={1} min={1} max={50} sufixo="anos" />
        <Campo id="spread" rotulo="Spread" valor={spread} onChange={setSpread} passo={0.05} min={0} sufixo="%" />
        <label htmlFor="indexante" style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 }}>Euribor</span>
          <select id="indexante" value={indexante} onChange={(e) => setIndexante(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}>
            {euribores.map((e) => <option key={e.id} value={e.id}>{e.curto} · {e.valor.toLocaleString("pt-PT", { minimumFractionDigits: 3 })}%</option>)}
            <option value="manual">Outro valor</option>
          </select>
        </label>
        {indexante === "manual" && <Campo id="euribor" rotulo="Euribor (outro valor)" valor={euriborManual} onChange={setEuriborManual} passo={0.05} sufixo="%" />}
      </div>

      {r && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
          <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Prestação mensal</p>
          <p className="pj-num font-display" style={{ fontSize: 36, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.prestacao)} €</p>
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 4, lineHeight: 1.6 }}>
            Taxa de {r.taxa.toLocaleString("pt-PT", { maximumFractionDigits: 3 })}% · {eur0(r.juros)} € de juros em {a} anos.
          </p>
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
            Se a Euribor subir 1 ponto: <strong style={{ color: "var(--pj-text)" }}>{eur(mais.prestacao)} €</strong> (+{eur(mais.prestacao - r.prestacao)} €).
            {euribor >= 1 && <> Se descer 1 ponto: <strong style={{ color: "var(--pj-text)" }}>{eur(menos.prestacao)} €</strong>.</>}
          </p>
        </div>
      )}
    </div>
  );
}
