import { useState } from "react";
import { calcularAbono } from "./lib/abono";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto recebo de abono?" para a página pública /abono-de-familia.
 * Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const IDADES = { ate3: "Até 3 anos", de3a6: "3 a 6 anos", mais6: "Mais de 6 anos" };

export default function CalculadoraAbono() {
  const [rendimento, setRendimento] = useState("");
  const [ano, setAno] = useState("2025");
  const [idades, setIdades] = useState(["mais6"]);
  const [monoparental, setMonoparental] = useState(false);
  const mudarIdade = (i, v) => setIdades((l) => l.map((x, j) => (j === i ? v : x)));
  const mudarNumero = (n) => setIdades((l) => Array.from({ length: n }, (_, i) => l[i] || "mais6"));
  const r = rendimento === "" ? null : calcularAbono({ rendimentoAnual: Number(String(rendimento).replace(",", ".")), idades, monoparental, anoRendimentos: Number(ano) });

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="a-rend" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Rendimento bruto anual da casa (€)</span>
          <input id="a-rend" type="number" inputMode="decimal" min={0} step={500} placeholder="ex.: 18000" value={rendimento} onChange={(e) => setRendimento(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="a-ano" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>O pedido</span>
          <select id="a-ano" value={ano} onChange={(e) => setAno(e.target.value)} style={estiloCampo}>
            <option value="2025">Pedido novo em 2026 (rendimentos de 2025)</option>
            <option value="2024">Já recebo (rendimentos de 2024)</option>
          </select>
        </label>
        <label htmlFor="a-n" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Filhos com direito a abono</span>
          <select id="a-n" value={idades.length} onChange={(e) => mudarNumero(Number(e.target.value))} style={estiloCampo}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {idades.map((idade, i) => (
          <label key={i} htmlFor={`a-idade-${i}`} style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Idade do {i + 1}.º filho</span>
            <select id={`a-idade-${i}`} value={idade} onChange={(e) => mudarIdade(i, e.target.value)} style={estiloCampo}>
              {Object.entries(IDADES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </label>
        ))}
      </div>
      <label className="flex items-center" style={{ gap: 10, marginTop: 14, fontSize: 14, color: "var(--pj-text)", cursor: "pointer" }}>
        <input type="checkbox" checked={monoparental} onChange={(e) => setMonoparental(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0 }} />
        <span>Família monoparental (só uma pessoa responsável)</span>
      </label>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o rendimento bruto de todos os que vivem em casa, num ano inteiro.</p>}
        {r && r.escalao === 5 && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>
            <strong>5.º escalão: sem direito a abono.</strong> O rendimento de referência é de {eur(r.referencia)} €, acima do limite do 4.º escalão.
          </p>
        )}
        {r && r.escalao < 5 && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{r.escalao}.º escalão · recebes por mês</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.total)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {r.criancas.map((c, i) => (
                <div key={i} className="flex justify-between"><span>{i + 1}.º filho ({IDADES[c.idade].toLowerCase()})</span><span>{eur(c.valor)} €</span></div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              Rendimento de referência: {eur(r.referencia)} € (o rendimento a dividir pelo número de filhos com abono mais um).
              {r.escalao === 4 && r.criancas.some((c) => c.idade === "mais6") && " No 4.º escalão o abono acaba aos 6 anos."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
