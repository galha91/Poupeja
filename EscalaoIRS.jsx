import { useState } from "react";
import { escalaoDe, DEDUCAO_ESPECIFICA } from "./lib/irs";
import { estiloCartao } from "./PaginasPrecos";
import { evento } from "./lib/analytics";

/*
 * "Em que escalão fico?" para a página pública /irs. De propósito, mostra
 * só o escalão: o valor a pagar ou a receber (com deduções, dependentes e
 * retenções) é o simulador da app. O botão deixa o rendimento já escrito
 * no simulador (mesma chave de localStorage que a SecaoIRS usa).
 */
const eur = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
const pct = (t) => `${(t * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`;

function abrirSimulador(rendimento) {
  try {
    const atual = JSON.parse(localStorage.getItem("poupeja_irs") || "{}");
    if (rendimento > 0) localStorage.setItem("poupeja_irs", JSON.stringify({ ...atual, rendimento: String(rendimento) }));
  } catch {}
  evento("abrir_poupeja", { origem: "seo", tipo: "irs", transport_type: "beacon" });
}

export default function EscalaoIRS() {
  const [bruto, setBruto] = useState("");
  const b = Number(String(bruto).replace(/\s/g, "").replace(",", "."));
  const coletavel = b > 0 ? Math.max(0, b - DEDUCAO_ESPECIFICA) : 0;
  const e = b > 0 ? escalaoDe(coletavel) : null;

  return (
    <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
      <label htmlFor="irs-bruto" style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", marginBottom: 6 }}>
          Quanto ganhas por ano, em bruto? (trabalho por conta de outrem)
        </span>
        <input id="irs-bruto" type="number" inputMode="decimal" min={0} step={500} placeholder="ex.: 21000" value={bruto}
          onChange={(ev) => setBruto(ev.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
      </label>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--pj-subtle)" }} aria-live="polite">
        {!e && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6 }}>Escreve o teu salário bruto anual (14 meses, se for o caso) para veres o escalão.</p>}
        {e && (
          <>
            <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Ficas no</p>
            <p className="pj-num font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>
              {e.numero}.º escalão · {pct(e.taxa)}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              Rendimento coletável de cerca de {eur(coletavel)} € (o bruto menos a dedução específica de {eur(DEDUCAO_ESPECIFICA)} €).
              Os {pct(e.taxa)} só se aplicam à parte acima de {eur(e.de)} €, por isso pagas menos do que isso em média.
            </p>
          </>
        )}
        <a href="/?atalho=irs" onClick={() => abrirSimulador(b)} className="pj-tap flex items-center justify-between no-underline mt-4 rounded-2xl px-5 py-4" style={{ background: "var(--pj-brand)", color: "#fff" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e ? "Ver quanto vais pagar ou receber" : "Abrir o simulador de IRS"}</span>
          <span aria-hidden="true">→</span>
        </a>
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          O simulador conta dependentes, despesas de saúde, educação, casa e o que já te retiveram. Grátis, sem conta.
        </p>
      </div>
    </div>
  );
}
