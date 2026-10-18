import { useState } from "react";
import { evento } from "./lib/analytics";

/*
 * Email semanal de combustível do concelho desta página, sem conta.
 * Consentimento explícito (caixa por marcar); cancelamento num toque em
 * cada email. É um pedido diferente do dos folhetos, e vai noutro dia.
 */
// `onFeito`: avisa quem a usa (o Início guarda-o para não voltar a oferecer).
// `destaqueAlerta`: o Início vende primeiro o alerta de sexta (a caixa continua por marcar).
export default function SubscreverCombustivel({ concelho, nome, onFeito, destaqueAlerta }) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [alerta, setAlerta] = useState(false);
  const [erro, setErro] = useState("");
  const [a, setA] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!aceito) return setErro("Marca a caixa para receberes o email.");
    setA(true);
    try {
      const r = await fetch("/api/subscrever-combustivel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, concelho, consentimento: true, alerta }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível guardar.");
      evento("subscrever_combustivel", { concelho, alerta });
      setOk(true);
      onFeito?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setA(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl px-5 py-5" style={{ background: "var(--pj-brand-wash)", border: "1px solid var(--pj-border)" }} aria-label={`Receber o combustível de ${nome} por email`}>
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>
        {destaqueAlerta ? "Sabe antes de o combustível subir" : `O combustível de ${nome} no teu email`}
      </h2>
      <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.55, marginTop: 6 }}>
        {destaqueAlerta
          ? `Às segundas, os postos mais baratos de ${nome}. Se marcares a segunda caixa, também um aviso à sexta quando o combustível sobe na semana seguinte, para abasteceres antes. Sem conta, grátis, cancelas num toque.`
          : `Um email por semana, à segunda-feira, com os postos mais baratos de ${nome} e se o preço subiu ou desceu. Sem conta, grátis, cancelas num toque.`}
      </p>
      {ok ? (
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 12 }}>Feito! Recebes o primeiro na próxima segunda-feira.</p>
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
            <span>Aceito receber este email semanal. Ver <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Política de Privacidade</a>.</span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6, fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            <input type="checkbox" checked={alerta} onChange={e => setAlerta(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Avisa-me também à sexta-feira quando o Governo anunciar que os combustíveis sobem na semana seguinte, para abastecer antes.</span>
          </label>
          {erro && <p role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-danger)", marginTop: 8 }}>{erro}</p>}
        </form>
      )}
    </section>
  );
}
