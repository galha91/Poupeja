import { useState } from "react";
import { calcularRecibosVerdes } from "./lib/recibosVerdes";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto me sobra dos recibos verdes?" para a página pública
 * /recibos-verdes. Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CalculadoraRecibos() {
  const [mensal, setMensal] = useState("");
  const [tipo, setTipo] = useState("profissional");
  const [inicio, setInicio] = useState("0");
  const [retem, setRetem] = useState(true);
  const m = Number(String(mensal).replace(",", "."));
  const r = m > 0 ? calcularRecibosVerdes({ mensal: m, tipo, inicio: Number(inicio), retem }) : null;
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="r-mensal" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Faturas por mês, sem IVA (€)</span>
          <input id="r-mensal" type="number" inputMode="decimal" min={0} step={100} placeholder="ex.: 2000" value={mensal} onChange={(e) => setMensal(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="r-tipo" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Tipo de atividade</span>
          <select id="r-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} style={estiloCampo}>
            <option value="profissional">Profissão da lista do art. 151.º</option>
            <option value="servicos">Outros serviços</option>
          </select>
        </label>
        <label htmlFor="r-inicio" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Atividade aberta</span>
          <select id="r-inicio" value={inicio} onChange={(e) => setInicio(e.target.value)} style={estiloCampo}>
            <option value="0">Há mais de 2 anos</option>
            <option value="2">No 2.º ano</option>
            <option value="1">Este ano (1.º ano)</option>
          </select>
        </label>
      </div>
      <label className="flex items-start" style={{ gap: 10, marginTop: 14, fontSize: 14, color: "var(--pj-text)", cursor: "pointer", lineHeight: 1.4 }}>
        <input type="checkbox" checked={retem} onChange={(e) => setRetem(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, marginTop: 1 }} />
        <span>Os clientes são empresas e retêm IRS na fonte</span>
      </label>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve quanto faturas por mês, em média, sem IVA.</p>}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Sobra-te por mês, em média</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.liquidoMes)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {linha("Segurança Social", r.ssMes)}
              {linha("IRS (estimativa)", r.irsMes)}
            </div>
            <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
              Guarda <strong>{eur(r.guardarMes)} €</strong> por mês para impostos, {String(r.percentagem).replace(".", ",")}% do que faturas.
            </p>
            {retem && (
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Os clientes já retêm {eur(r.retidoMes)} € por mês de IRS. {r.acerto > 0 ? `No fim do ano pagas mais ${eur(r.acerto)} €.` : `No fim do ano recebes de volta cerca de ${eur(-r.acerto)} €.`}
              </p>
            )}
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              {r.iva > 0
                ? `Acima de 15 000 € por ano cobras IVA de 23%: na fatura de ${eur(m)} € somas ${eur(m * 0.23)} € que entregas ao Estado.`
                : "Até 15 000 € por ano podes ficar isento de IVA."}
              {Number(inicio) === 1 && " No 1.º ano não pagas Segurança Social."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
