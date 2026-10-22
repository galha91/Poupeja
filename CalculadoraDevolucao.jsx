import { useEffect, useState } from "react";
import { calcularDevolucao } from "./lib/seoDevolucoes";
import { hojeIso, dataExtenso } from "./lib/datas";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Até quando posso devolver?" para a página pública /devolucoes.
 * Tudo no browser; nada é guardado. O "hoje" só se lê depois de montar,
 * para o HTML estático não depender do dia em que foi gerado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };

export default function CalculadoraDevolucao() {
  const [hoje, setHoje] = useState(null);
  const [dataRececao, setDataRececao] = useState("");
  const [onde, setOnde] = useState("online");
  const [informado, setInformado] = useState("sim");
  useEffect(() => { setHoje(hojeIso()); }, []);
  const r = hoje && dataRececao ? calcularDevolucao({ dataRececao, onde, informado: informado === "sim" }, hoje) : null;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="d-data" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Dia em que recebeste</span>
          <input id="d-data" type="date" value={dataRececao} max={hoje || undefined} onChange={(e) => setDataRececao(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="d-onde" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Onde compraste</span>
          <select id="d-onde" value={onde} onChange={(e) => setOnde(e.target.value)} style={estiloCampo}>
            <option value="online">Online, telefone ou catálogo</option>
            <option value="casa">Vendedor em casa ou excursão</option>
          </select>
        </label>
        <label htmlFor="d-info" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>A loja avisou que podias desistir?</span>
          <select id="d-info" value={informado} onChange={(e) => setInformado(e.target.value)} style={estiloCampo}>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && (
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>
            {dataRececao && hoje ? "A data não pode ser no futuro." : "Escolhe o dia em que recebeste a encomenda (a última parte, se veio separada)."}
          </p>
        )}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
              {r.aberto ? "Podes desistir até" : "O prazo acabou a"}
            </p>
            <p className="pj-num font-display" style={{ fontSize: 30, fontWeight: 600, color: r.aberto ? "var(--pj-brand-ink)" : "var(--pj-text-muted)", marginTop: 4 }}>
              {dataExtenso(r.fim)}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              {r.aberto
                ? (r.faltam === 0 ? "Hoje é o último dia: envia o aviso hoje." : `Faltam ${r.faltam} dia${r.faltam !== 1 ? "s" : ""}. Basta enviares o aviso dentro do prazo.`)
                : `Há ${-r.faltam} dia${r.faltam !== -1 ? "s" : ""}. Se o produto tem defeito, ainda tens a garantia de 3 anos.`}
              {r.alargado && " Como a loja não te informou, o prazo cresceu 12 meses."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
