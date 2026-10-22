import { useState } from "react";
import { calcularIuc, categoriaIuc } from "./lib/iuc";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto paga o meu carro de IUC?" para a página pública /iuc. Tudo no
 * browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s) => Number(String(s).replace(",", "."));

export default function CalculadoraIuc() {
  const [combustivel, setCombustivel] = useState("gasolina");
  const [ano, setAno] = useState("");
  const [mes, setMes] = useState("7");
  const [cilindrada, setCilindrada] = useState("");
  const [co2, setCo2] = useState("");
  const [norma, setNorma] = useState("wltp");
  const [voltagem, setVoltagem] = useState("");
  const a = ano === "" ? null : Number(ano);
  const cat = a ? categoriaIuc(a, Number(mes)) : null;
  const r = a && a > 1900 ? calcularIuc({
    combustivel, ano: a, mes: Number(mes), cilindrada: num(cilindrada), co2: co2 === "" ? "" : num(co2), norma, voltagem: num(voltagem),
  }) : null;
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );
  const falta = a && !r && !(combustivel === "eletrico" && cat === "B");

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="u-comb" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Combustível</span>
          <select id="u-comb" value={combustivel} onChange={(e) => setCombustivel(e.target.value)} style={estiloCampo}>
            <option value="gasolina">Gasolina (ou híbrido a gasolina)</option>
            <option value="gasoleo">Gasóleo (ou híbrido a gasóleo)</option>
            <option value="eletrico">Elétrico</option>
          </select>
        </label>
        <label htmlFor="u-ano" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Ano da 1.ª matrícula</span>
          <input id="u-ano" type="number" inputMode="numeric" min={1900} max={2100} placeholder="ex.: 2018" value={ano} onChange={(e) => setAno(e.target.value)} style={estiloCampo} />
        </label>
        {a === 2007 && (
          <label htmlFor="u-mes" style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Mês da matrícula</span>
            <select id="u-mes" value={mes} onChange={(e) => setMes(e.target.value)} style={estiloCampo}>
              <option value="6">Antes de julho</option>
              <option value="7">Julho ou depois</option>
            </select>
          </label>
        )}
        {combustivel !== "eletrico" && (
          <label htmlFor="u-cil" style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Cilindrada (cm³)</span>
            <input id="u-cil" type="number" inputMode="numeric" min={0} placeholder="ex.: 1598" value={cilindrada} onChange={(e) => setCilindrada(e.target.value)} style={estiloCampo} />
          </label>
        )}
        {combustivel === "eletrico" && cat === "A" && (
          <label htmlFor="u-volt" style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Voltagem total</span>
            <input id="u-volt" type="number" inputMode="numeric" min={0} placeholder="ex.: 120" value={voltagem} onChange={(e) => setVoltagem(e.target.value)} style={estiloCampo} />
          </label>
        )}
        {combustivel !== "eletrico" && cat === "B" && (
          <>
            <label htmlFor="u-co2" style={{ display: "block" }}>
              <span style={estiloRotuloCampo}>Emissões de CO₂ (g/km)</span>
              <input id="u-co2" type="number" inputMode="numeric" min={0} placeholder="ex.: 120" value={co2} onChange={(e) => setCo2(e.target.value)} style={estiloCampo} />
            </label>
            <label htmlFor="u-norma" style={{ display: "block" }}>
              <span style={estiloRotuloCampo}>Medido pela norma</span>
              <select id="u-norma" value={norma} onChange={(e) => setNorma(e.target.value)} style={estiloCampo}>
                <option value="wltp">WLTP (carros novos desde 2020)</option>
                <option value="nedc">NEDC (carros até 2018)</option>
              </select>
            </label>
          </>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!a && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o ano da matrícula. Está no livrete e no DUA.</p>}
        {falta && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Falta {cat === "B" && combustivel !== "eletrico" ? "a cilindrada e as emissões de CO₂ (estão no livrete ou no certificado de conformidade)" : "a cilindrada"}.</p>}
        {r && r.motivo && <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}><strong>{r.motivo}</strong></p>}
        {r && !r.motivo && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>IUC por ano</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.devido)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {r.categoria === "A" ? (
                <>
                  {linha("Imposto do escalão", r.base)}
                  {r.adicional > 0 && linha("Taxa adicional do gasóleo", r.adicional)}
                </>
              ) : (
                <>
                  {linha("Cilindrada", r.taxaCilindrada)}
                  {linha("Emissões de CO₂", r.taxaCo2)}
                  {r.adicionalCo2 > 0 && linha("Adicional de CO₂ (matrícula desde 2017)", r.adicionalCo2)}
                  <div className="flex justify-between" style={{ gap: 10 }}><span>Agravamento pela idade do carro</span><span>× {String(r.coeficiente).replace(".", ",")}</span></div>
                  {r.adicionalGasoleo > 0 && linha("Taxa adicional do gasóleo", r.adicionalGasoleo)}
                </>
              )}
            </div>
            {r.valor !== r.devido && (
              <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
                Abaixo de 10 € não se paga: a cobrança é de zero, mas continuas a ter de fazer a declaração no Portal das Finanças.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
