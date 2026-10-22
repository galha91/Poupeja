import { useState } from "react";
import { calcularCompensacao, SIMULADOR_ACT } from "./lib/indemnizacao";
import { estiloCartao, estiloLink } from "./PaginasPrecos";

/*
 * "Quanto recebo se for despedido?" para a página pública
 * /indemnizacao-despedimento. Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
const duracao = (meses) => {
  const m = Math.floor(meses + 1e-9);
  const a = Math.floor(m / 12);
  const r = m % 12;
  return [a ? `${a} ${a === 1 ? "ano" : "anos"}` : "", r ? `${r} ${r === 1 ? "mês" : "meses"}` : ""].filter(Boolean).join(" e ") || "menos de um mês";
};

export default function CalculadoraIndemnizacao() {
  const [tipo, setTipo] = useState("coletivo");
  const [retribuicao, setRetribuicao] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const r = retribuicao === "" ? null : calcularCompensacao({ tipo, retribuicao: Number(String(retribuicao).replace(",", ".")), inicio, fim });
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="i-tipo" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Como acaba o contrato</span>
          <select id="i-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} style={estiloCampo}>
            <option value="coletivo">Despedimento coletivo, fim do posto ou inadaptação</option>
            <option value="termo">Fim de contrato a termo (decisão da empresa)</option>
            <option value="justa-causa">Saio com justa causa (culpa da empresa)</option>
          </select>
        </label>
        <label htmlFor="i-retr" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Ordenado base + diuturnidades (€/mês)</span>
          <input id="i-retr" type="number" inputMode="decimal" min={0} step={50} placeholder="ex.: 1500" value={retribuicao} onChange={(e) => setRetribuicao(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="i-inicio" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Primeiro dia do contrato</span>
          <input id="i-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="i-fim" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Último dia do contrato</span>
          <input id="i-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={estiloCampo} />
        </label>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o ordenado e as datas do contrato. Só conta o ordenado base e as diuturnidades, sem subsídios.</p>}
        {r && r.foraDoAmbito && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>
            <strong>Contratos a termo anteriores a outubro de 2013 têm regras antigas que esta calculadora não cobre.</strong> Usa o <a href={SIMULADOR_ACT} target="_blank" rel="noopener noreferrer" style={estiloLink}>simulador oficial da ACT</a>.
          </p>
        )}
        {r && r.tipo === "justa-causa" && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Indemnização, de</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.minimoLegal)} € a {eur(r.maximoLegal)} €</p>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              Antiguidade de {duracao(r.antiguidadeMeses)}. O valor exato, entre 15 e 45 dias por ano, depende do ordenado e da gravidade do que a empresa fez. Nunca é menos de três meses.
            </p>
          </>
        )}
        {r && r.partes && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Compensação</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.total)} €</p>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>Antiguidade de {duracao(r.antiguidadeMeses)}.</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {r.partes.map((p, i) => (
                <div key={i}>{linha(`${num(p.dias)} dias por ano, ${num(Math.round(p.meses * 100) / 100)} meses`, p.valor)}</div>
              ))}
            </div>
            {r.limitado && <p style={{ fontSize: 13, color: "var(--pj-text)", marginTop: 8, lineHeight: 1.6 }}>O total foi limitado a 12 meses de ordenado ({eur(r.teto)} €).</p>}
            {r.subminimo && <p style={{ fontSize: 13, color: "var(--pj-text)", marginTop: 8, lineHeight: 1.6 }}>Subiu para o mínimo de três meses de ordenado.</p>}
            {r.retribuicao > r.tetoRetribuicao && <p style={{ fontSize: 13, color: "var(--pj-text)", marginTop: 8, lineHeight: 1.6 }}>O ordenado conta até {eur(r.tetoRetribuicao)} € (20 vezes o salário mínimo) nas parcelas recentes.</p>}
          </>
        )}
        {r && !r.foraDoAmbito && (
          <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 12, lineHeight: 1.6 }}>
            Valor bruto, sem férias nem subsídios por receber. Confirma no <a href={SIMULADOR_ACT} target="_blank" rel="noopener noreferrer" style={estiloLink}>simulador oficial da ACT</a>.
          </p>
        )}
      </div>
    </div>
  );
}
