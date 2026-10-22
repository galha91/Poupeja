import { useState } from "react";
import { calcularImt } from "./lib/imt";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto pago de IMT e Imposto do Selo?" para a página pública /imt.
 * Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s) => Number(String(s).replace(/\s/g, "").replace(",", "."));

export default function CalculadoraImt() {
  const [valor, setValor] = useState("");
  const [destino, setDestino] = useState("hpp");
  const [regiao, setRegiao] = useState("continente");
  const [compradores, setCompradores] = useState("1");
  const [jovens, setJovens] = useState("0");
  const [emprestimo, setEmprestimo] = useState("");
  const n = Number(compradores);
  const r = valor === "" ? null : calcularImt({
    valor: num(valor), destino, regiao, compradores: n,
    jovens: Math.min(Number(jovens), n), emprestimo: emprestimo === "" ? 0 : num(emprestimo),
  });
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="i-valor" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Preço da casa (€)</span>
          <input id="i-valor" type="number" inputMode="decimal" min={0} step={1000} placeholder="ex.: 250000" value={valor} onChange={(e) => setValor(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="i-destino" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Para quê</span>
          <select id="i-destino" value={destino} onChange={(e) => setDestino(e.target.value)} style={estiloCampo}>
            <option value="hpp">Para viver (habitação própria)</option>
            <option value="habitacao">Segunda casa ou arrendar</option>
            <option value="rustico">Terreno rústico</option>
            <option value="outro">Loja, escritório ou terreno urbano</option>
          </select>
        </label>
        <label htmlFor="i-regiao" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Onde</span>
          <select id="i-regiao" value={regiao} onChange={(e) => setRegiao(e.target.value)} style={estiloCampo}>
            <option value="continente">Continente</option>
            <option value="ilhas">Açores ou Madeira</option>
          </select>
        </label>
        <label htmlFor="i-comp" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Compradores</span>
          <select id="i-comp" value={compradores} onChange={(e) => setCompradores(e.target.value)} style={estiloCampo}>
            <option value="1">1</option>
            <option value="2">2 (casal, em partes iguais)</option>
          </select>
        </label>
        {destino === "hpp" && (
          <label htmlFor="i-jovens" style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Até 35 anos e 1.ª casa</span>
            <select id="i-jovens" value={Math.min(Number(jovens), n)} onChange={(e) => setJovens(e.target.value)} style={estiloCampo}>
              <option value="0">Ninguém</option>
              <option value="1">{n === 1 ? "Sim" : "Um dos dois"}</option>
              {n === 2 && <option value="2">Os dois</option>}
            </select>
          </label>
        )}
        <label htmlFor="i-emp" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Crédito à habitação (€, opcional)</span>
          <input id="i-emp" type="number" inputMode="decimal" min={0} step={1000} placeholder="ex.: 200000" value={emprestimo} onChange={(e) => setEmprestimo(e.target.value)} style={estiloCampo} />
        </label>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o preço. Se o valor patrimonial (VPT) for maior, usa esse.</p>}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Pagas em impostos</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.total)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {linha("IMT", r.imt)}
              {linha("Imposto do Selo da compra (0,8%)", r.selo)}
              {r.seloCredito > 0 && linha("Imposto do Selo do crédito (0,6%)", r.seloCredito)}
            </div>
            {r.poupancaJovem > 0 && (
              <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
                O IMT Jovem poupa-te <strong>{eur(r.poupancaJovem)} €</strong>.
              </p>
            )}
            {r.jovemSemBeneficio && (
              <p style={{ fontSize: 13.5, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
                Acima de {regiao === "ilhas" ? "826 228" : "660 982"} € o IMT Jovem já não se aplica.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
