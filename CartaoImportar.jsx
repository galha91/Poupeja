import { useState } from "react";
import { Sparkles, ClipboardPaste, ArrowRight } from "lucide-react";
import { evento } from "./lib/analytics";

/*
 * Entrada para /receitas/importar: no Início e nas Receitas da app e em
 * /receitas. "Colar link" lê o link copiado (do TikTok) e abre logo a
 * receita importada; sem acesso à área de transferência, abre a página.
 * Pequeno de propósito, para não puxar o importador inteiro.
 */
export default function CartaoImportar({ onde, className = "", style = {} }) {
  const [a_abrir, setAbrir] = useState(false);
  async function colar() {
    evento("receita_importar_cartao", { onde, acao: "colar" });
    setAbrir(true);
    let texto = "";
    try { texto = (await navigator.clipboard.readText()) || ""; } catch {}
    const link = texto.match(/https?:\/\/[^\s<>"']+/i)?.[0];
    window.location.href = link ? `/receitas/importar?url=${encodeURIComponent(link)}` : "/receitas/importar";
  }
  return (
    <div className={`rounded-2xl ${className}`} style={{ padding: 16, background: "var(--pj-brand)", color: "#fff", boxShadow: "0 8px 24px rgba(11,107,79,0.22)", ...style }}>
      <a href="/receitas/importar" onClick={() => evento("receita_importar_cartao", { onde, acao: "abrir" })} className="no-underline flex items-center" style={{ gap: 12, color: "#fff" }}>
        <span className="flex items-center justify-center rounded-xl" style={{ flexShrink: 0, width: 40, height: 40, background: "rgba(255,255,255,0.16)" }}>
          <Sparkles size={19} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="flex items-center" style={{ gap: 8, fontSize: 15.5, fontWeight: 700 }}>
            Viste uma receita no TikTok?
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 6, background: "#f2a93b", color: "#3b2408" }}>NOVO</span>
          </span>
          <span className="block" style={{ fontSize: 13, opacity: 0.88, marginTop: 2 }}>Vê quanto custa e a versão mais barata</span>
        </span>
        <ArrowRight size={18} />
      </a>
      <button type="button" onClick={colar} disabled={a_abrir} className="pj-tap press w-full flex items-center justify-center rounded-xl"
        style={{ marginTop: 12, minHeight: 46, gap: 8, border: 0, background: "#fff", color: "var(--pj-brand-ink)", fontSize: 14.5, fontWeight: 700 }}>
        <ClipboardPaste size={16} /> {a_abrir ? "A abrir…" : "Colar o link copiado"}
      </button>
    </div>
  );
}
