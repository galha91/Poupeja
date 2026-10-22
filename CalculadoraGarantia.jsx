import { useEffect, useState } from "react";
import { calcularGarantia, MAX_REPARACOES } from "./lib/seoGarantias";
import { hojeIso, dataExtenso } from "./lib/datas";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Até quando vai a minha garantia?" para a página pública /garantias.
 * Tudo no browser; nada é guardado nem enviado. O "hoje" só se lê depois
 * de montar, para o HTML estático não depender do dia em que foi gerado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };

export default function CalculadoraGarantia() {
  const [hoje, setHoje] = useState(null);
  const [dataCompra, setDataCompra] = useState("");
  const [estado, setEstado] = useState("novo");
  const [reparacoes, setReparacoes] = useState("0");
  useEffect(() => { setHoje(hojeIso()); }, []);
  const r = hoje && dataCompra ? calcularGarantia({ dataCompra, estado, reparacoes }, hoje) : null;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="g-data" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Data da compra (entrega)</span>
          <input id="g-data" type="date" value={dataCompra} max={hoje || undefined} onChange={(e) => setDataCompra(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="g-estado" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>O produto era</span>
          <select id="g-estado" value={estado} onChange={(e) => setEstado(e.target.value)} style={estiloCampo}>
            <option value="novo">Novo ou recondicionado</option>
            <option value="usado">Usado</option>
            <option value="usado-18">Usado, com garantia reduzida por escrito</option>
          </select>
        </label>
        <label htmlFor="g-rep" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Reparações já feitas</span>
          <select id="g-rep" value={reparacoes} onChange={(e) => setReparacoes(e.target.value)} style={estiloCampo}>
            {Array.from({ length: MAX_REPARACOES + 1 }, (_, i) => <option key={i} value={String(i)}>{i === MAX_REPARACOES ? `${i} ou mais` : i}</option>)}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && (
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>
            {dataCompra && hoje ? "A data não pode ser no futuro." : "Escolhe a data em que recebeste o produto."}
          </p>
        )}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
              {r.valida ? "A garantia vai até" : "A garantia acabou a"}
            </p>
            <p className="pj-num font-display" style={{ fontSize: 30, fontWeight: 600, color: r.valida ? "var(--pj-brand-ink)" : "var(--pj-text-muted)", marginTop: 4 }}>
              {dataExtenso(r.fim)}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              {r.valida ? `Faltam ${r.dias} dia${r.dias !== 1 ? "s" : ""}` : `Há ${-r.dias} dia${r.dias !== -1 ? "s" : ""}`} · {r.meses} meses de garantia
              {r.reparacoes > 0 ? `, com ${r.reparacoes * 6} meses a mais pelas reparações` : ""}.
            </p>
            <ul style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.7, paddingLeft: 18, listStyle: "disc" }}>
              {r.antigo && <li>Compra anterior a 2022: aplica-se o regime antigo, de 2 anos.</li>}
              {r.rejeicao && <li><strong style={{ color: "var(--pj-text)" }}>Ainda estás no 1.º mês</strong> (até {dataExtenso(r.fimRejeicao)}): se tem defeito, podes pedir logo outro igual ou o dinheiro de volta.</li>}
              {r.valida && (r.presuncao
                ? <li>Até {dataExtenso(r.fimPresuncao)}, um defeito presume-se de origem: é a loja que tem de provar o contrário.</li>
                : <li>Desde {dataExtenso(r.fimPresuncao)} és tu que tens de mostrar que o defeito é de origem (um relatório técnico ajuda).</li>)}
              {!r.valida && <li>A garantia comercial (da marca ou da loja) pode ser mais longa: vê o certificado.</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
