import { useState } from "react";
import { valorSubsidio, duracaoSubsidio } from "./lib/desemprego";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto recebo de subsídio de desemprego e durante quanto tempo?" para
 * a página pública /subsidio-desemprego. Tudo no browser.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

export default function CalculadoraDesemprego() {
  const [salario, setSalario] = useState("");
  const [situacao, setSituacao] = useState("nao-casado");
  const [dependentes, setDependentes] = useState("0");
  const [acrescimo, setAcrescimo] = useState(false);
  const [idade, setIdade] = useState("");
  const [meses, setMeses] = useState("24");
  const [anos20, setAnos20] = useState("0");
  const s = Number(String(salario).replace(",", "."));
  const rr = s > 0 ? Math.round((s * 14) / 12 * 100) / 100 : 0;
  const v = rr ? valorSubsidio({ rr, situacao, dependentes: Number(dependentes), acrescimo }) : null;
  const d = idade !== "" ? duracaoSubsidio({ idade: Number(idade), meses: Number(meses), anos20: Number(anos20) }) : null;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="d-sal" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Salário bruto mensal (€)</span>
          <input id="d-sal" type="number" inputMode="decimal" min={0} step={50} placeholder="ex.: 1200" value={salario} onChange={(e) => setSalario(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="d-idade" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Idade</span>
          <input id="d-idade" type="number" inputMode="numeric" min={16} max={70} placeholder="ex.: 35" value={idade} onChange={(e) => setIdade(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="d-meses" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Meses de descontos</span>
          <select id="d-meses" value={meses} onChange={(e) => setMeses(e.target.value)} style={estiloCampo}>
            <option value="6">Menos de 12</option>
            <option value="12">12 a 14</option>
            <option value="15">15 a 23</option>
            <option value="24">24 ou mais</option>
          </select>
        </label>
        <label htmlFor="d-anos" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Anos de descontos nos últimos 20</span>
          <select id="d-anos" value={anos20} onChange={(e) => setAnos20(e.target.value)} style={estiloCampo}>
            <option value="0">Menos de 5</option>
            <option value="5">5 a 9</option>
            <option value="10">10 a 14</option>
            <option value="15">15 a 19</option>
            <option value="20">20</option>
          </select>
        </label>
        <label htmlFor="d-sit" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Situação (para o IRS)</span>
          <select id="d-sit" value={situacao} onChange={(e) => setSituacao(e.target.value)} style={estiloCampo}>
            <option value="nao-casado">Solteiro, divorciado ou viúvo</option>
            <option value="casado-dois">Casado, os dois com rendimentos</option>
            <option value="casado-unico">Casado, só um com rendimentos</option>
          </select>
        </label>
        <label htmlFor="d-dep" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Dependentes</span>
          <select id="d-dep" value={dependentes} onChange={(e) => setDependentes(e.target.value)} style={estiloCampo}>
            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n === 5 ? "5 ou mais" : n}</option>)}
          </select>
        </label>
      </div>
      <label className="flex items-start" style={{ gap: 10, marginTop: 14, fontSize: 14, color: "var(--pj-text)", cursor: "pointer", lineHeight: 1.4 }}>
        <input type="checkbox" checked={acrescimo} onChange={(e) => setAcrescimo(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, marginTop: 1 }} />
        <span>O cônjuge também está desempregado e há filhos a cargo, ou sou o único responsável pelos filhos (+10%)</span>
      </label>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!v && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o salário bruto e a idade.</p>}
        {v && !(idade !== "" && !d) && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Recebes por mês</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(v.valor)} €</p>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              Remuneração de referência {eur(v.rr)} € (o salário com subsídios a dividir por 12). 65% seriam {eur(v.bruto)} €; aplica-se o limite: {v.limite}.
              {acrescimo && " Já com o acréscimo de 10%."}
            </p>
          </>
        )}
        {v && idade !== "" && !d && (
          <p style={{ fontSize: 13.5, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
            <strong>Com menos de 12 meses de descontos nos últimos 24 não há subsídio de desemprego.</strong> Podes ter direito ao subsídio social de desemprego.
          </p>
        )}
        {v && d && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
            Durante <strong>{d.dias} dias</strong> (cerca de {String(d.meses).replace(".", ",")} meses){d.extra ? `, já com ${d.extra} dias a mais pelos anos de descontos` : ""}.
            No total, cerca de <strong>{eur0((v.valor * d.dias) / 30)} €</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
