import { useState } from "react";
import { APARELHOS, PRECO_KWH, aparelhoPorId, custoAparelho } from "./lib/consumoEletrico";
import { euros } from "./lib/seoFormato";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto gasta este aparelho?" para a página pública
 * /consumo-eletrodomesticos. Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };

// "0,21" e "0.21" valem o mesmo.
const numero = (t) => Number(String(t).replace(/\s/g, "").replace(",", "."));
const texto = (v) => String(v).replace(".", ",");

function Campo({ id, rotulo, valor, mudar }) {
  return (
    <label htmlFor={id} style={{ display: "block" }}>
      <span style={estiloRotuloCampo}>{rotulo}</span>
      <input id={id} inputMode="decimal" autoComplete="off" value={valor} onChange={(e) => mudar(e.target.value)} style={estiloCampo} />
    </label>
  );
}

export default function CalculadoraConsumo() {
  const inicial = APARELHOS[0];
  const [aparelho, setAparelho] = useState(inicial.id);
  const [watts, setWatts] = useState(texto(inicial.watts));
  const [horas, setHoras] = useState(texto(inicial.horasDia));
  const [dias, setDias] = useState(texto(inicial.diasMes));
  const [preco, setPreco] = useState(texto(PRECO_KWH));

  function escolher(id) {
    setAparelho(id);
    const a = aparelhoPorId(id);
    if (!a) return; // "Outro": fica o que lá está
    setWatts(texto(a.watts));
    setHoras(texto(a.horasDia));
    setDias(texto(a.diasMes));
  }

  const r = custoAparelho({ watts: numero(watts), horasDia: numero(horas), diasMes: numero(dias), precoKwh: numero(preco) });
  const nota = aparelhoPorId(aparelho)?.nota;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <label htmlFor="c-aparelho" style={{ display: "block" }}>
        <span style={estiloRotuloCampo}>Aparelho</span>
        <select id="c-aparelho" value={aparelho} onChange={(e) => escolher(e.target.value)} style={estiloCampo}>
          {APARELHOS.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          <option value="outro">Outro</option>
        </select>
      </label>
      {nota && <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 4 }}>{nota}. Muda os valores se o teu for diferente.</p>}

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
        <Campo id="c-watts" rotulo="Potência (W)" valor={watts} mudar={(v) => { setWatts(v); setAparelho("outro"); }} />
        <Campo id="c-horas" rotulo="Horas por dia" valor={horas} mudar={(v) => { setHoras(v); setAparelho("outro"); }} />
        <Campo id="c-dias" rotulo="Dias por mês" valor={dias} mudar={(v) => { setDias(v); setAparelho("outro"); }} />
        <Campo id="c-preco" rotulo="Preço do kWh (€)" valor={preco} mudar={setPreco} />
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && (
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>
            Confirma os valores: potência até 10 000 W, até 24 horas por dia e até 31 dias por mês.
          </p>
        )}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Custa por mês</p>
            <p className="pj-num font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{euros(r.mes)} €</p>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              {euros(r.ano)} € por ano · {texto(r.kwhMes)} kWh por mês · {euros(r.porHora)} € por cada hora ligado.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
