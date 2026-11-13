import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { evento } from "./lib/analytics";
import { criarAlertaEmail, lerEmail } from "./AlertasPreco";
import { euros, porUnidade } from "./lib/seoFormato";

/*
 * "Avisa-me quando baixar", por email, na própria página pública do preço.
 *
 * Quem chega do Google a /precos/<artigo> vê o preço e vai-se embora: o
 * botão antigo mandava para a app criar o alerta lá (1 toque em 14 dias,
 * nenhum alerta criado). Aqui basta o email, sem sair da página e sem
 * conta. A referência é o melhor preço de hoje; o cron-alertas-email avisa
 * quando descer.
 *
 * `promo: true` de propósito: a página não sabe se o preço de hoje é de
 * promoção, e assim o aviso só sai com uma descida a sério (nunca um
 * "entrou em promoção" de um preço que já lá estava).
 */
export default function AlertaPrecoPublico({ q, nome, valor, unidade, hrefApp }) {
  const [email, setEmail] = useState("");
  const [aceito, setAceito] = useState(false);
  const [estado, setEstado] = useState(""); // "" | a-guardar | feito | texto de erro
  useEffect(() => { setEmail(lerEmail()); }, []);

  async function guardar(e) {
    e.preventDefault();
    if (!aceito) return setEstado("Marca a caixa para receberes o aviso.");
    setEstado("a-guardar");
    try {
      await criarAlertaEmail({ email, q, tipo: "vigiar", unidade, modo: unidade === "embalagem" ? "embalagem" : "unidade", valorAtual: valor, promo: true });
      evento("alerta_email_criado", { origem: "seo" });
      setEstado("feito");
    } catch (err) {
      setEstado(err.message);
    }
  }

  const caixa = { background: "var(--pj-brand-wash)" };
  const artigo = nome.toLowerCase();

  if (estado === "feito") {
    return (
      <section className="mt-6 rounded-2xl px-5 py-4 flex items-start gap-2.5" style={caixa} role="status">
        <Check size={18} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
          Feito. Mandamos um email para <b>{email.trim()}</b> quando {artigo} descer dos {euros(valor)} €{porUnidade(unidade)}.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl px-5 py-4" style={caixa} aria-label={`Aviso de preço de ${artigo}`}>
      <h2 className="flex items-center gap-2" style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>
        <Bell size={17} style={{ color: "var(--pj-brand-ink)" }} aria-hidden /> Avisa-me quando baixar
      </h2>
      <p style={{ fontSize: 13, color: "var(--pj-text-muted)", lineHeight: 1.5, marginTop: 4 }}>
        Hoje o mais barato está a {euros(valor)} €{porUnidade(unidade)}. Recebes um email quando descer em qualquer cadeia. Sem conta.
      </p>
      <form onSubmit={guardar} style={{ marginTop: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o.teu@email.pt" autoComplete="email" aria-label="Email"
            style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
          <button type="submit" disabled={estado === "a-guardar"} className="pj-tap"
            style={{ flexShrink: 0, padding: "12px 18px", borderRadius: 12, border: 0, background: "var(--pj-brand)", color: "#fff", fontWeight: 600, fontSize: 14, opacity: estado === "a-guardar" ? 0.7 : 1 }}>
            {estado === "a-guardar" ? "…" : "Avisar"}
          </button>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontSize: 12, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
          <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Aceito receber por email os avisos deste artigo. Cancelo num toque em cada email. <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Privacidade</a></span>
        </label>
        {estado && estado !== "a-guardar" && <p role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-danger)", marginTop: 6 }}>{estado}</p>}
      </form>
      {hrefApp && (
        <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 10 }}>
          Preferes escolher o preço?{" "}
          <a href={hrefApp} rel="nofollow" onClick={() => evento("abrir_poupeja", { origem: "seo", tipo: "alerta", transport_type: "beacon" })}
            style={{ color: "var(--pj-brand-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Define um alerta na app
          </a>
        </p>
      )}
    </section>
  );
}
