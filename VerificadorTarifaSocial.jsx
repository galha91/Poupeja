import { useState } from "react";
import { PRESTACOES, VALOR_TARIFA, MAX_PESSOAS, verificarTarifaSocial } from "./lib/seoTarifaSocial";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Tenho direito à tarifa social?" para a página pública /tarifa-social.
 * Tudo no browser; nada é guardado nem enviado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NOMES = { luz: "Eletricidade", gas: "Gás natural", internet: "Internet" };

function motivo(tipo, r) {
  if (r.tem) {
    if (r.porque === "prestacao") return `Por receberes: ${r.prestacao.toLowerCase()}.`;
    return `O rendimento está abaixo do limite de ${eur(r.limite)} €.`;
  }
  if (r.porque === "rendimento-acima") return `O rendimento passa o limite de ${eur(r.limite)} € em ${eur(r.falta)} €.`;
  if (r.porque === "abono-escalao") return "No gás, o abono só conta se for do 1.º escalão.";
  if (r.porque === "falta-rendimento") return "Sem prestação: indica o rendimento do agregado para vermos.";
  return tipo === "gas" ? "No gás natural só se tem direito através de uma prestação social." : "Sem prestação e sem rendimento indicado.";
}

export default function VerificadorTarifaSocial() {
  const [prestacoes, setPrestacoes] = useState([]);
  const [escalao, setEscalao] = useState("1");
  const [rendimento, setRendimento] = useState("");
  const [semRendimento, setSemRendimento] = useState("0");
  const alternar = (id) => setPrestacoes((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const tocado = prestacoes.length > 0 || rendimento !== "";
  const r = verificarTarifaSocial({ prestacoes, escalaoAbono: Number(escalao), rendimento: rendimento === "" ? null : Number(String(rendimento).replace(",", ".")), semRendimento });

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <fieldset>
        <legend style={estiloRotuloCampo}>Recebes alguma destas prestações?</legend>
        {PRESTACOES.map((p) => (
          <label key={p.id} className="flex items-start" style={{ gap: 10, padding: "8px 0", fontSize: 14.5, color: "var(--pj-text)", lineHeight: 1.4, cursor: "pointer" }}>
            <input type="checkbox" checked={prestacoes.includes(p.id)} onChange={() => alternar(p.id)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
            <span>{p.nome}</span>
          </label>
        ))}
      </fieldset>
      {prestacoes.includes("abono") && (
        <label htmlFor="t-escalao" style={{ display: "block", marginTop: 10 }}>
          <span style={estiloRotuloCampo}>Escalão do abono</span>
          <select id="t-escalao" value={escalao} onChange={(e) => setEscalao(e.target.value)} style={estiloCampo}>
            <option value="1">1.º escalão</option>
            <option value="2">2.º escalão ou acima</option>
          </select>
        </label>
      )}

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="t-rend" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Rendimento anual do agregado (€)</span>
          <input id="t-rend" type="number" inputMode="decimal" min={0} step={100} placeholder="ex.: 7000" value={rendimento} onChange={(e) => setRendimento(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="t-sem" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Pessoas sem rendimentos (contigo)</span>
          <select id="t-sem" value={semRendimento} onChange={(e) => setSemRendimento(e.target.value)} style={estiloCampo}>
            {Array.from({ length: MAX_PESSOAS + 1 }, (_, i) => <option key={i} value={String(i)}>{i}</option>)}
          </select>
        </label>
      </div>
      <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
        Rendimento total do ano, como na declaração de IRS (tu e os dependentes). Conta-te a ti se não tiveste rendimentos.
      </p>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!tocado && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Marca as prestações que recebes ou escreve o rendimento.</p>}
        {tocado && ["luz", "gas", "internet"].map((tipo) => (
          <div key={tipo} style={{ padding: "10px 0", borderTop: tipo !== "luz" ? "1px solid var(--pj-subtle)" : "none" }}>
            <p className="flex items-center justify-between" style={{ gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{NOMES[tipo]}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r[tipo].tem ? "var(--pj-brand-ink)" : "var(--pj-text-faint)", whiteSpace: "nowrap" }}>
                {r[tipo].tem ? "Tens direito" : "Sem direito"}
              </span>
            </p>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2, lineHeight: 1.5 }}>
              {motivo(tipo, r[tipo])}
              {r[tipo].tem && <> {tipo === "internet" ? `Pagas ${VALOR_TARIFA.internet.preco}.` : `Desconto de ${String(VALOR_TARIFA[tipo].pct).replace(".", ",")}%.`}</>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
