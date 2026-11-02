import { useEffect, useRef, useState } from "react";
import { CalendarClock, Check } from "lucide-react";
import { evento } from "./lib/analytics";
import { idConvidadoAtual } from "./lib/convidado";

/*
 * Depois de comparar a lista: "lembra-me no dia das compras". Um email por
 * semana, no dia escolhido, com a lista e um botão para comparar outra vez
 * (pages/api/lembrete-compras.js). Sem conta, com consentimento explícito.
 * Com o lembrete feito, a lista guardada no servidor acompanha a da app.
 */

const LS = "poupeja_lembrete_compras";
const LS_EMAIL = "poupeja_email_alertas"; // o mesmo email dos alertas de preço
const CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const nomes = (itens) => itens.map((i) => i.nome);

export default function LembreteCompras({ itens = [] }) {
  const [lembrete, setLembrete] = useState(null);   // { id, t, dia, email }
  const [lido, setLido] = useState(false);
  const [dia, setDia] = useState(6);
  const [email, setEmail] = useState("");
  const [aceito, setAceito] = useState(false);
  const [estado, setEstado] = useState("");          // "" | a-guardar | erro texto
  const enviada = useRef("");

  useEffect(() => {
    try { setLembrete(JSON.parse(ler(LS) || "null")); } catch {}
    setEmail(ler(LS_EMAIL) || "");
    setLido(true);
  }, []);

  // Com lembrete, a lista no servidor acompanha a da app (sem pedidos repetidos).
  useEffect(() => {
    if (!lembrete) return;
    const chave = JSON.stringify(nomes(itens));
    if (chave === enviada.current) return;
    enviada.current = chave;
    fetch(`/api/lembrete-compras?s=${encodeURIComponent(lembrete.id)}&t=${encodeURIComponent(lembrete.t)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itens: nomes(itens) }), keepalive: true,
    }).catch(() => {});
  }, [lembrete, itens]);

  async function criar(e) {
    e.preventDefault();
    if (!aceito) return setEstado("Marca a caixa para receberes o lembrete.");
    setEstado("a-guardar");
    try {
      const r = await fetch("/api/lembrete-compras", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dia, itens: nomes(itens), consentimento: true, convidado: idConvidadoAtual() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível guardar.");
      const novo = { id: j.id, t: j.t, dia, email: email.trim() };
      try { localStorage.setItem(LS, JSON.stringify(novo)); localStorage.setItem(LS_EMAIL, email.trim()); } catch {}
      enviada.current = JSON.stringify(nomes(itens));
      setLembrete(novo);
      setEstado("");
      evento("lembrete_compras_criado", { tipo: LONGOS[dia - 1] });
    } catch (err) {
      setEstado(err.message);
    }
  }

  function cancelar() {
    if (!lembrete) return;
    fetch(`/api/lembrete-compras?s=${encodeURIComponent(lembrete.id)}&t=${encodeURIComponent(lembrete.t)}`, { method: "DELETE", keepalive: true }).catch(() => {});
    try { localStorage.removeItem(LS); } catch {}
    setLembrete(null);
    evento("lembrete_compras_cancelado", {});
  }

  if (!lido) return null;

  const caixa = { margin: "4px 16px 20px", padding: 14, borderRadius: 16, background: "var(--pj-brand-wash)" };

  if (lembrete) {
    return (
      <div style={caixa} className="flex items-start gap-2.5">
        <Check size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5 }}>
          Lembramos-te à <b>{LONGOS[lembrete.dia - 1]}</b> de manhã, em {lembrete.email}, com esta lista.{" "}
          <button onClick={cancelar} className="pj-tap" style={{ background: "transparent", border: 0, padding: 0, fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", textDecoration: "underline" }}>Cancelar</button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={criar} style={caixa} aria-label="Lembrete do dia das compras">
      <p className="flex items-center gap-1.5" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>
        <CalendarClock size={16} style={{ color: "var(--pj-brand-ink)" }} /> Lembra-me no dia das compras
      </p>
      <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 3, lineHeight: 1.45 }}>
        Um email por semana, de manhã, com a tua lista e um botão para comparar outra vez. Sem conta.
      </p>
      <div className="flex gap-1 mt-3" role="radiogroup" aria-label="Dia das compras">
        {CURTOS.map((d, i) => (
          <button key={d} type="button" role="radio" aria-checked={dia === i + 1} onClick={() => setDia(i + 1)} className="pj-tap flex-1"
            style={{ minHeight: 36, borderRadius: 10, border: 0, fontSize: 12.5, fontWeight: 600, background: dia === i + 1 ? "var(--pj-brand)" : "var(--pj-card)", color: dia === i + 1 ? "#fff" : "var(--pj-text-muted)" }}>
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2.5">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o.teu@email.pt" autoComplete="email" aria-label="Email"
          style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 12, fontSize: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
        <button type="submit" disabled={estado === "a-guardar"} className="pj-tap press"
          style={{ flexShrink: 0, padding: "0 16px", borderRadius: 12, border: 0, background: "var(--pj-brand)", color: "#fff", fontSize: 14, fontWeight: 600, opacity: estado === "a-guardar" ? 0.7 : 1 }}>
          {estado === "a-guardar" ? "…" : "Lembrar"}
        </button>
      </div>
      <label className="flex items-start gap-2 mt-2" style={{ fontSize: 11.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
        <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} style={{ marginTop: 2 }} />
        <span>Aceito receber este lembrete por email. Cancelo num toque em cada email. <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", textDecoration: "underline" }}>Privacidade</a></span>
      </label>
      {estado && estado !== "a-guardar" && <p role="alert" style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-danger)", marginTop: 6 }}>{estado}</p>}
    </form>
  );
}
