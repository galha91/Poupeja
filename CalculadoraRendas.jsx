import { useState } from "react";
import { calcularAtualizacao, COEFICIENTE_2027 } from "./lib/rendas";
import { estiloCartao } from "./PaginasPrecos";

/*
 * "Quanto sobe a minha renda em 2027?" para a página pública
 * /atualizacao-de-rendas. Tudo no browser; nada é guardado.
 */
const estiloCampo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const estiloRotuloCampo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dataPt = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function textoCarta(r) {
  const efeito = r.efeito ? dataPt(r.efeito) : "[data do aniversário do contrato]";
  return [
    "Exmo(a). Senhor(a) [nome do inquilino]",
    "",
    "Assunto: atualização da renda para 2027",
    "",
    `Na qualidade de senhorio do imóvel sito em [morada], venho comunicar que, nos termos do artigo 1077.º do Código Civil, vou atualizar a renda com o coeficiente de ${String(COEFICIENTE_2027).replace(".", ",")}, fixado pelo Aviso do INE n.º 24199/2026/2, de 1 de outubro.`,
    "",
    `A renda atual é de ${eur(r.renda)} € e passa a ser de ${eur(r.nova)} € por mês, a partir de ${efeito}, até nova atualização.`,
    "",
    "Com os melhores cumprimentos,",
    "[nome do senhorio], [local], [data]",
    "",
    "Enviar por carta registada com aviso de receção, ou entregar em mão com assinatura do inquilino a confirmar a receção.",
  ].join("\n");
}

export default function CalculadoraRendas() {
  const [renda, setRenda] = useState("");
  const [inicio, setInicio] = useState("");
  const [copiado, setCopiado] = useState(false);
  const r = renda === "" ? null : calcularAtualizacao({ renda: Number(String(renda).replace(",", ".")), inicio });
  const linha = (rotulo, v) => (
    <div className="flex justify-between" style={{ gap: 10 }}><span>{rotulo}</span><span>{eur(v)} €</span></div>
  );
  const copiar = async () => {
    try { await navigator.clipboard.writeText(textoCarta(r)); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch {}
  };

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label htmlFor="r-renda" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Renda mensal atual (€)</span>
          <input id="r-renda" type="number" inputMode="decimal" min={0} step={10} placeholder="ex.: 750" value={renda} onChange={(e) => setRenda(e.target.value)} style={estiloCampo} />
        </label>
        <label htmlFor="r-inicio" style={{ display: "block" }}>
          <span style={estiloRotuloCampo}>Início do contrato (opcional)</span>
          <input id="r-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={estiloCampo} />
        </label>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!r && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve a renda que pagas ou cobras hoje.</p>}
        {r && r.data === "adiada" && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>
            <strong>Este contrato não se atualiza em 2027.</strong> Um contrato que começa em {r.inicioAno} só se atualiza ao fim do 1.º ano, em {r.inicioAno + 1}, com o coeficiente desse ano.
          </p>
        )}
        {r && r.data !== "adiada" && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Renda máxima em 2027</p>
            <p className="pj-num font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{eur(r.nova)} €</p>
            <div className="pj-num" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              {linha("Aumento por mês", r.aumentoMensal)}
              {linha("Aumento por ano", r.aumentoAnual)}
            </div>
            {r.data === "2027" && (
              <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.6 }}>
                A renda nova só pode valer a partir de <strong>{dataPt(r.efeito)}</strong>. O senhorio tem de enviar a carta até <strong>{dataPt(r.comunicarAte)}</strong>, para o inquilino a receber 30 dias antes.
              </p>
            )}
            {!r.data && (
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 10, lineHeight: 1.6 }}>
                Escreve a data de início do contrato para ver quando a renda nova começa e até quando o senhorio tem de avisar.
              </p>
            )}
            <button type="button" onClick={copiar} className="pj-tap" style={{ marginTop: 14, padding: "11px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0, cursor: "pointer" }}>
              {copiado ? "Carta copiada" : "Copiar modelo de carta ao inquilino"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
