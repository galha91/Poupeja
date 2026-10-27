import { useState } from "react";
import { verificarDesconto } from "./lib/seoBlackFriday";
import { euros } from "./lib/seoFormato";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Este desconto é verdadeiro?" para a página pública /black-friday.
 * Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };

// "12,5" e "12.5" valem o mesmo; vazio fica vazio.
const numero = (t) => (String(t).trim() === "" ? null : Number(String(t).replace(/\s/g, "").replace(",", ".")));

const VEREDITO = {
  real: { titulo: "O desconto bate certo", cor: "var(--pj-brand-ink)" },
  inflacionado: { titulo: "O desconto é menor do que dizem", cor: "var(--pj-warn)" },
  falso: { titulo: "Não há desconto nenhum", cor: "var(--pj-danger)" },
  "sem-desconto": { titulo: "O preço riscado não é mais alto", cor: "var(--pj-text-muted)" },
};

function Campo({ id, rotulo, valor, mudar, ajuda }) {
  return (
    <label htmlFor={id} style={{ display: "block" }}>
      <span style={estiloRotuloCampo}>{rotulo}</span>
      <input id={id} inputMode="decimal" autoComplete="off" placeholder="0,00 €" value={valor} onChange={(e) => mudar(e.target.value)} style={estiloCampo} />
      {ajuda && <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 4 }}>{ajuda}</span>}
    </label>
  );
}

export default function CalculadoraDesconto() {
  const [agora, setAgora] = useState("");
  const [riscado, setRiscado] = useState("");
  const [minimo, setMinimo] = useState("");
  const r = verificarDesconto({ agora: numero(agora), riscado: numero(riscado), minimo30: numero(minimo) });
  const v = r && VEREDITO[r.estado];

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <Campo id="bf-agora" rotulo="Preço com desconto" valor={agora} mudar={setAgora} />
        <Campo id="bf-riscado" rotulo="Preço riscado («antes»)" valor={riscado} mudar={setRiscado} />
        <Campo id="bf-minimo" rotulo="Mais barato que viste (30 dias)" valor={minimo} mudar={setMinimo} ajuda="Opcional. Na mesma loja, no último mês." />
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && (
          <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>
            Escreve o preço com desconto e o preço riscado. Se te lembras de o ter visto mais barato no último mês, junta esse preço.
          </p>
        )}
        {r && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{v.titulo}</p>
            <p className="pj-num font-display" style={{ fontSize: 30, fontWeight: 600, color: v.cor, marginTop: 4 }}>
              {r.real}% <span style={{ fontSize: 15, fontWeight: 500, color: "var(--pj-text-muted)" }}>de desconto real</span>
            </p>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              {r.estado === "real" && `Poupas ${euros(r.poupancaReal)} €. Confirma que o riscado é mesmo o preço mais baixo dos últimos 30 dias: é o que a lei exige.`}
              {r.estado === "inflacionado" && `Anunciam ${r.anunciado}%, mas como já esteve a ${euros(r.referencia)} €, o desconto real é de ${r.real}% (${euros(r.poupancaReal)} €). Pela lei, o preço riscado devia ser ${euros(r.referencia)} €.`}
              {r.estado === "falso" && `Anunciam ${r.anunciado}%, mas já esteve a ${euros(r.referencia)} €, o mesmo ou menos do que agora. Podes reclamar no Livro de Reclamações.`}
              {r.estado === "sem-desconto" && "Confirma os preços: o riscado tem de ser mais alto do que o preço com desconto."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
