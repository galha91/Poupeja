import { Sparkles, ArrowRight } from "lucide-react";

/*
 * Entrada para /receitas/importar: na secção Receitas da app e na página
 * /receitas. Pequeno de propósito, para não puxar o importador inteiro.
 */
export default function CartaoImportar({ onde, className = "", style = {} }) {
  return (
    <a href="/receitas/importar" data-onde={onde} className={`pj-tap no-underline flex items-center rounded-2xl ${className}`}
      style={{ gap: 14, padding: "16px 18px", background: "var(--pj-card)", border: "1.5px solid var(--pj-brand-soft)", color: "var(--pj-text)", ...style }}>
      <span className="flex items-center justify-center rounded-xl" style={{ flexShrink: 0, width: 42, height: 42, background: "var(--pj-brand)", color: "#fff" }}>
        <Sparkles size={20} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="block" style={{ fontSize: 15.5, fontWeight: 700 }}>Viste uma receita no TikTok?</span>
        <span className="block" style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>Cola o link ou fotografa-a e vê quanto custa</span>
      </span>
      <ArrowRight size={18} color="var(--pj-brand-ink)" />
    </a>
  );
}
