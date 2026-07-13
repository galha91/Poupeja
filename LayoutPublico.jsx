import { ArrowRight } from "lucide-react";

/*
 * Layout das páginas públicas de SEO (/combustiveis, /folhetos, /apoios).
 * Conteúdo server-rendered visível ao Google, com o estilo editorial da app
 * e um caminho claro para instalar/abrir o PoupeJá.
 */
export default function LayoutPublico({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f6f5f0", color: "#14231c" }}>
      <header className="mx-auto flex items-center justify-between px-5 py-4" style={{ maxWidth: 720 }}>
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/icon-192.png" alt="PoupeJá" width={34} height={34} style={{ borderRadius: 9 }} />
          <span className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "#14231c" }}>PoupeJá</span>
        </a>
        <a
          href="/"
          className="pj-tap inline-flex items-center gap-1.5 no-underline"
          style={{ background: "#0b6b4f", color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 12 }}
        >
          Abrir a app <ArrowRight size={14} />
        </a>
      </header>

      <main className="mx-auto px-5 pb-16" style={{ maxWidth: 720 }}>{children}</main>

      <footer className="mx-auto px-5 pb-12" style={{ maxWidth: 720 }}>
        <div style={{ height: 1, background: "#e4e2d8", marginBottom: 20 }} />
        <nav className="flex flex-wrap gap-x-5 gap-y-2" style={{ fontSize: 13, fontWeight: 500 }}>
          <a href="/" style={{ color: "#0b6b4f" }}>Abrir o PoupeJá</a>
          <a href="/instalar" style={{ color: "#5c6b62" }}>Instalar a app</a>
          <a href="/combustiveis" style={{ color: "#5c6b62" }}>Combustíveis</a>
          <a href="/folhetos" style={{ color: "#5c6b62" }}>Folhetos</a>
          <a href="/receitas" style={{ color: "#5c6b62" }}>Receitas baratas</a>
          <a href="/apoios" style={{ color: "#5c6b62" }}>Apoios do Estado</a>
          <a href="/privacidade" style={{ color: "#5c6b62" }}>Privacidade</a>
        </nav>
        <p style={{ fontSize: 12, color: "#8a978e", marginTop: 14 }}>
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
      style={{ background: "#0b6b4f", color: "#fff" }}
    >
      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{texto}</span>
      <ArrowRight size={18} />
    </a>
  );
}
