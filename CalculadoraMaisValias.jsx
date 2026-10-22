import { useState } from "react";
import { calcularMaisValia } from "./lib/maisValias";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto pago de mais-valias na venda da casa?" para a página pública
 * /mais-valias. Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const estiloGrelha = { gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s) => (s === "" ? 0 : Number(String(s).replace(",", ".")));
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function Numero({ id, rotulo, valor, onChange, placeholder, passo = 1000 }) {
  return (
    <label htmlFor={id} style={{ display: "block" }}>
      <span style={estiloRotuloCampo}>{rotulo}</span>
      <input id={id} type="number" inputMode="decimal" min={0} step={passo} placeholder={placeholder} value={valor} onChange={(e) => onChange(e.target.value)} style={estiloCampo} />
    </label>
  );
}

export default function CalculadoraMaisValias() {
  const [venda, setVenda] = useState("");
  const [compra, setCompra] = useState("");
  const [ano, setAno] = useState("");
  const [mesCompra, setMesCompra] = useState("1");
  const [mesVenda, setMesVenda] = useState("12");
  const [dCompra, setDCompra] = useState("");
  const [obras, setObras] = useState("");
  const [dVenda, setDVenda] = useState("");
  const [propria, setPropria] = useState(false);
  const [tipo, setTipo] = useState("hpp");
  const [reinvestido, setReinvestido] = useState("");
  const [divida, setDivida] = useState("");
  const [outros, setOutros] = useState("");
  const r = venda !== "" && compra !== "" && ano !== "" ? calcularMaisValia({
    venda: num(venda), compra: num(compra), anoCompra: Number(ano), mesCompra: Number(mesCompra), mesVenda: Number(mesVenda),
    despesasCompra: num(dCompra), obras: num(obras), despesasVenda: num(dVenda),
    habitacaoPropria: propria, reinvestimento: tipo, reinvestido: num(reinvestido), divida: num(divida), outrosRendimentos: num(outros),
  }) : null;
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={estiloGrelha}>
        <Numero id="m-venda" rotulo="Vendes por (€)" valor={venda} onChange={setVenda} placeholder="ex.: 300000" />
        <Numero id="m-compra" rotulo="Compraste por (€)" valor={compra} onChange={setCompra} placeholder="ex.: 150000" />
        <label htmlFor="m-ano" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Ano da compra</span>
          <input id="m-ano" type="number" inputMode="numeric" min={1900} max={2026} placeholder="ex.: 2008" value={ano} onChange={(e) => setAno(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="m-mes-c" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Mês da compra</span>
          <select id="m-mes-c" value={mesCompra} onChange={(e) => setMesCompra(e.target.value)} style={estiloCampo}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label htmlFor="m-mes-v" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Mês da venda (em 2026)</span>
          <select id="m-mes-v" value={mesVenda} onChange={(e) => setMesVenda(e.target.value)} style={estiloCampo}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 mt-4" style={estiloGrelha}>
        <Numero id="m-dcompra" rotulo="Despesas da compra: IMT, selo, escritura (€)" valor={dCompra} onChange={setDCompra} placeholder="opcional" passo={100} />
        <Numero id="m-obras" rotulo="Obras dos últimos 12 anos (€)" valor={obras} onChange={setObras} placeholder="opcional" passo={100} />
        <Numero id="m-dvenda" rotulo="Despesas da venda: comissão (€)" valor={dVenda} onChange={setDVenda} placeholder="opcional" passo={100} />
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>Vais reinvestir o dinheiro da venda?</p>
        <label className="flex items-start" style={{ gap: 10, marginTop: 10, fontSize: 14, color: "var(--pj-text)", cursor: "pointer", lineHeight: 1.4 }}>
          <input type="checkbox" checked={propria} onChange={(e) => setPropria(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, marginTop: 1 }} />
          <span>Esta casa era a minha habitação própria e permanente nos últimos 12 meses</span>
        </label>
        <div className="grid gap-4 mt-4" style={estiloGrelha}>
          <label htmlFor="m-tipo" style={{ display: "block" }}>
            <span style={estiloRotuloCampo}>Onde reinvestes</span>
            <select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} style={estiloCampo}>
              <option value="hpp">Outra casa para viver</option>
              <option value="arrendamento">Casa para arrendamento acessível</option>
              <option value="poupanca">Seguro ou PPR (65 anos ou reformado)</option>
            </select>
          </label>
          <Numero id="m-reinv" rotulo="Quanto reinvestes (€)" valor={reinvestido} onChange={setReinvestido} placeholder="ex.: 250000" />
          <Numero id="m-divida" rotulo="Crédito da casa ainda em dívida (€)" valor={divida} onChange={setDivida} placeholder="opcional" />
          <Numero id="m-outros" rotulo="Outros rendimentos brutos no ano (€)" valor={outros} onChange={setOutros} placeholder="para o escalão" />
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o preço de venda, o de compra e o ano da compra.</p>}
        {r && r.naoSujeito && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>
            <strong>Casas compradas antes de 1989 não pagam mais-valias.</strong> Continuas a ter de declarar a venda no IRS.
          </p>
        )}
        {r && !r.naoSujeito && r.maisValia <= 0 && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>
            <strong>Sem mais-valia, não pagas imposto.</strong> Com a correção e as despesas, a venda dá {eur(r.maisValia)} €. Declaras a venda na mesma.
          </p>
        )}
        {r && !r.naoSujeito && r.maisValia > 0 && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>IRS estimado da venda</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.imposto)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {linha("Compra corrigida pela inflação", r.aquisicaoCorrigida)}
              {r.despesas > 0 && linha("Despesas e obras", r.despesas)}
              {linha("Mais-valia", r.maisValia)}
              {linha("Entra no IRS (50%)", r.entraNoIrs)}
              {r.excluido > 0 && linha("Excluído pelo reinvestimento", r.excluido)}
              {linha("Rendimento tributável", r.tributavel)}
            </div>
            {r.coeficiente > 1 && (
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Coeficiente de correção: {String(r.coeficiente).replace(".", ",")}. Só conta com mais de 24 meses entre a compra e a venda.
              </p>
            )}
            {!r.elegivelReinvestimento && num(reinvestido) > 0 && (
              <p style={{ fontSize: 13.5, color: "var(--pj-text)", marginTop: 8, lineHeight: 1.6 }}>
                Para reinvestir numa casa ou num seguro tinha de ser a tua habitação própria e permanente nos últimos 12 meses.
              </p>
            )}
            {r.elegivelReinvestimento && r.fracaoExcluida < 1 && (
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Para não pagar nada tens de reinvestir {eur(r.aReinvestir)} €, o valor da venda sem a dívida do crédito.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
