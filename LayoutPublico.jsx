import { ArrowRight } from "lucide-react";

/*
 * Layout das páginas públicas de SEO (/combustiveis, /folhetos, /apoios).
 * Conteúdo server-rendered visível ao Google, com o estilo editorial da app
 * e um caminho claro para instalar/abrir o PoupeJá.
 */
export default function LayoutPublico({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--pj-surface)", color: "var(--pj-text)" }}>
      <header className="mx-auto flex items-center justify-between px-5 py-4" style={{ maxWidth: 720 }}>
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/icon-192.png" alt="PoupeJá" width={34} height={34} style={{ borderRadius: 9 }} />
          <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)" }}>PoupeJá</span>
        </a>
        <a
          href="/"
          className="pj-tap inline-flex items-center gap-1.5 no-underline"
          style={{ background: "var(--pj-brand)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 12 }}
        >
          Abrir a app <ArrowRight size={14} />
        </a>
      </header>

      <main className="mx-auto px-5 pb-16" style={{ maxWidth: 720 }}>{children}</main>

      <footer className="mx-auto px-5 pb-12" style={{ maxWidth: 720 }}>
        <div style={{ height: 1, background: "var(--pj-border)", marginBottom: 20 }} />
        <nav className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 13, fontWeight: 500 }}>
          <a href="/" style={{ color: "var(--pj-brand-ink)" }}>Abrir o PoupeJá</a>
          <a href="/instalar" style={{ color: "var(--pj-text-muted)" }}>Instalar a app</a>
          <a href="/combustiveis" style={{ color: "var(--pj-text-muted)" }}>Combustíveis</a>
          <a href="/folhetos" style={{ color: "var(--pj-text-muted)" }}>Folhetos</a>
          <a href="/receitas" style={{ color: "var(--pj-text-muted)" }}>Receitas baratas</a>
          <a href="/apoios" style={{ color: "var(--pj-text-muted)" }}>Apoios do Estado</a>
          <a href="/privacidade" style={{ color: "var(--pj-text-muted)" }}>Privacidade</a>
        </nav>
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 14 }}>
          PoupeJá — a app de poupança portuguesa. 100% grátis, sem loja de apps.
        </p>
      </footer>
    </div>
  );
}

export function CtaApp({ texto = "Vê isto e muito mais na app — grátis" }) {
  return (
    <a
      href="/instalar"
      className="pj-tap flex items-center justify-between no-underline mt-8 rounded-2xl px-5 py-4"
      style={{ background: "var(--pj-brand)", color: "#fff" }}
    >
      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{texto}</span>
      <ArrowRight size={18} />
    </a>
  );
}
