import { useState } from "react";
import { evento } from "./lib/analytics";

/*
 * Resumo semanal dos folhetos por email, sem conta. Consentimento explícito
 * (caixa por marcar) e cancelamento num toque em cada email.
 */
export default function SubscreverFolhetos({ origem = "pagina" }) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState("");
  const [a, setA] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!aceito) return setErro("Marca a caixa para receberes o resumo.");
    setA(true);
    try {
      const r = await fetch("/api/subscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origem, consentimento: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível guardar.");
      evento("subscrever_folhetos", { origem });
      setOk(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setA(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl px-5 py-5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }} aria-label="Receber os folhetos por email">
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Folhetos de segunda-feira no teu email</h2>
      <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.55, marginTop: 6 }}>
        Um email por semana com os folhetos novos. Sem conta, grátis, cancelas num toque.
      </p>
      {ok ? (
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 12 }}>Feito! Recebes o próximo resumo na segunda-feira.</p>
      ) : (
        <form onSubmit={enviar} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="o.teu@email.pt" autoComplete="email" aria-label="Email"
              style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}
            />
            <button type="submit" disabled={a} className="pj-tap"
              style={{ padding: "12px 18px", borderRadius: 12, background: "var(--pj-brand)", color: "#fff", fontWeight: 600, fontSize: 14, opacity: a ? 0.7 : 1 }}>
              {a ? "…" : "Subscrever"}
            </button>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Aceito receber o resumo semanal por email. Ver <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Política de Privacidade</a>.</span>
          </label>
          {erro && <p role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-danger)", marginTop: 8 }}>{erro}</p>}
        </form>
      )}
    </section>
  );
}
