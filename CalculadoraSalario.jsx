import { useState } from "react";
import { salarioLiquido } from "./lib/salario";
import { estiloCartao } from "./PaginasPrecos";
import { evento } from "./lib/analytics";

/*
 * Bruto → líquido para a página pública /salario-liquido. Mostra o mês;
 * o "vou receber ou pagar IRS?" fica no simulador da app, que abre com o
 * rendimento anual e o IRS retido já escritos (chave poupeja_irs).
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

function abrirSimulador(r, situacao, dependentes) {
  try {
    const atual = JSON.parse(localStorage.getItem("poupeja_irs") || "{}");
    localStorage.setItem("poupeja_irs", JSON.stringify({
      ...atual,
      rendimento: String(Math.round(r.bruto * 14)),
      retido: String(Math.round(r.irs * 14)),
      estadoCivil: situacao === "nao-casado" ? "solteiro" : "casado",
      dependentes: String(dependentes),
    }));
  } catch {}
  evento("abrir_poupeja", { origem: "seo", tipo: "salario", transport_type: "beacon" });
}

export default function CalculadoraSalario() {
  const [bruto, setBruto] = useState("");
  const [situacao, setSituacao] = useState("nao-casado");
  const [dependentes, setDependentes] = useState("0");
  const [irsJovem, setIrsJovem] = useState("0");
  const [deficiencia, setDeficiencia] = useState(false);
  const r = salarioLiquido(Number(String(bruto).replace(/\s/g, "").replace(",", ".")), {
    situacao, dependentes: Number(dependentes), irsJovemAno: Number(irsJovem), deficiencia,
  });

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="s-bruto" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Salário bruto mensal (€)</span>
          <input id="s-bruto" type="number" inputMode="decimal" min={0} step={50} placeholder="ex.: 1500" value={bruto} onChange={(e) => setBruto(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="s-sit" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Situação</span>
          <select id="s-sit" value={situacao} onChange={(e) => setSituacao(e.target.value)} style={estiloCampo}>
            <option value="nao-casado">Solteiro, divorciado ou viúvo</option>
            <option value="casado-dois">Casado, os dois com rendimentos</option>
            <option value="casado-unico">Casado, só um com rendimentos</option>
          </select>
        </label>
        <label htmlFor="s-dep" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Dependentes</span>
          <select id="s-dep" value={dependentes} onChange={(e) => setDependentes(e.target.value)} style={estiloCampo}>
            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n === 5 ? "5 ou mais" : n}</option>)}
          </select>
        </label>
        <label htmlFor="s-jovem" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>IRS Jovem (até 35 anos)</span>
          <select id="s-jovem" value={irsJovem} onChange={(e) => setIrsJovem(e.target.value)} style={estiloCampo}>
            <option value="0">Não</option>
            <option value="1">1.º ano a trabalhar (100% isento)</option>
            <option value="2">2.º ao 4.º ano (75%)</option>
            <option value="5">5.º ao 7.º ano (50%)</option>
            <option value="8">8.º ao 10.º ano (25%)</option>
          </select>
        </label>
      </div>
      <label className="flex items-center" style={{ gap: 10, marginTop: 14, fontSize: 14, color: "var(--pj-text)", cursor: "pointer" }}>
        <input type="checkbox" checked={deficiencia} onChange={(e) => setDeficiencia(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0 }} />
        <span>Tenho incapacidade igual ou superior a 60%</span>
      </label>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o salário bruto que está no contrato.</p>}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Recebes por mês</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.liquido)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              <div className="flex justify-between"><span>Bruto</span><span>{eur(r.bruto)} €</span></div>
              <div className="flex justify-between"><span>Segurança Social (11%)</span><span>− {eur(r.ss)} €</span></div>
              <div className="flex justify-between"><span>Retenção de IRS (tabela {r.tabela}{irsJovem !== "0" ? ", IRS Jovem" : ""})</span><span>− {eur(r.irs)} €</span></div>
            </div>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              Por ano, com subsídios de férias e de Natal: cerca de <strong style={{ color: "var(--pj-text)" }}>{eur0(r.liquido * 14)} €</strong> líquidos.
            </p>
            <a href="/?atalho=irs" rel="nofollow" onClick={() => abrirSimulador(r, situacao, dependentes)} className="pj-tap flex items-center justify-between no-underline mt-4 rounded-2xl px-5 py-4" style={{ background: "var(--pj-brand)", color: "#fff" }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>Vais receber ou pagar IRS? Vê na app</span>
              <span aria-hidden="true">→</span>
            </a>
            <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
              O simulador abre com o teu rendimento anual e o IRS retido já preenchidos. Grátis, sem conta.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
