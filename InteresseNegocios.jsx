import { useState } from "react";
import { evento } from "./lib/analytics";
import { idConvidadoAtual } from "./lib/convidado";
import { TIPOS_NEGOCIO, DISPOSICOES } from "./lib/cabazNegocios";

/*
 * Lista de espera do PoupeJá Negócios. Três perguntas: o email, o tipo de
 * negócio e quanto pagaria por mês. Consentimento explícito (caixa por
 * marcar). No GA4 só segue o tipo e a faixa de preço, nunca o email.
 */
const campo = { width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const rotulo = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)", marginTop: 14, marginBottom: 6 };

export default function InteresseNegocios({ origem = "negocios" }) {
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagaria, setPagaria] = useState("");
  const [aceito, setAceito] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");
  const [a, setA] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!tipo) return setErro("Escolhe o tipo de negócio.");
    if (!pagaria) return setErro("Diz-nos quanto pagarias por mês.");
    if (!aceito) return setErro("Marca a caixa para seres avisado.");
    setA(true);
    try {
      const r = await fetch("/api/negocios-interesse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo, pagaria, origem, consentimento: true, convidado: idConvidadoAtual() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível guardar.");
      evento("negocios_interesse", { tipo, pagaria });
      setOk(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setA(false);
    }
  }

  return (
    <section id="lista-de-espera" className="mt-8 rounded-2xl px-5 py-5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }} aria-label="Lista de espera do PoupeJá Negócios">
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Quero ser avisado quando abrir</h2>
      <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.55, marginTop: 6 }}>
        O PoupeJá Negócios ainda não está aberto. Deixa o email e diz-nos o que vale para ti: é com as respostas que decidimos se avança.
      </p>
      {ok ? (
        <p role="status" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 12 }}>Feito! Escrevemos-te quando abrir.</p>
      ) : (
        <form onSubmit={enviar}>
          <label style={rotulo} htmlFor="neg-email">Email do negócio</label>
          <input id="neg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="geral@oteunegocio.pt" autoComplete="email" style={campo} />

          <label style={rotulo} htmlFor="neg-tipo">Tipo de negócio</label>
          <select id="neg-tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)} style={campo}>
            <option value="">Escolhe…</option>
            {TIPOS_NEGOCIO.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>

          <label style={rotulo} htmlFor="neg-pagaria">Quanto pagarias por mês?</label>
          <select id="neg-pagaria" required value={pagaria} onChange={(e) => setPagaria(e.target.value)} style={campo}>
            <option value="">Escolhe…</option>
            {DISPOSICOES.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>

          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Aceito ser avisado por email sobre o PoupeJá Negócios. Ver <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Política de Privacidade</a>.</span>
          </label>
          {erro && <p role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-danger)", marginTop: 8 }}>{erro}</p>}
          <button type="submit" disabled={a} className="pj-tap"
            style={{ width: "100%", marginTop: 14, padding: "13px 18px", borderRadius: 12, background: "var(--pj-brand)", color: "#fff", fontWeight: 600, fontSize: 14.5, opacity: a ? 0.7 : 1 }}>
            {a ? "A guardar…" : "Entrar na lista de espera"}
          </button>
        </form>
      )}
    </section>
  );
}
