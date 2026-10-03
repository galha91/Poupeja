import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/*
 * Peças pequenas, partilhadas pelas Renovações, Prazos e Garantias.
 * Regras: toques com pelo menos 44px, labels ligados aos campos, uma ação
 * principal por ecrã, notas legais em texto pequeno e suave.
 */

export const ROTULO = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--pj-text-muted)" };
const CAMPO = {
  width: "100%", minHeight: 48, padding: "0 14px", borderRadius: 14, fontSize: 16,
  background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)", outline: "none",
};

export function Campo({ label, opcional, erro, ajuda, as = "input", children, ...props }) {
  const id = useId();
  const Tag = as;
  return (
    <div>
      <label htmlFor={id} style={ROTULO}>
        {label}{opcional && <span style={{ fontWeight: 400, color: "var(--pj-text-faint)" }}> (opcional)</span>}
      </label>
      <Tag
        id={id}
        aria-invalid={erro ? true : undefined}
        style={{ ...CAMPO, marginTop: 6, borderColor: erro ? "var(--pj-danger)" : "var(--pj-border)" }}
        {...props}
      >
        {children}
      </Tag>
      {ajuda && <p style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 4, lineHeight: 1.5 }}>{ajuda}</p>}
    </div>
  );
}

export function BotaoPrincipal({ children, className = "", style, ...props }) {
  return (
    <button
      className={`press pj-tap w-full flex items-center justify-center gap-2 ${className}`}
      style={{ minHeight: 52, borderRadius: 16, fontSize: 15, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function BotaoSecundario({ children, className = "", style, ...props }) {
  return (
    <button
      className={`press pj-tap flex items-center justify-center gap-1.5 ${className}`}
      style={{ minHeight: 44, padding: "0 14px", borderRadius: 14, fontSize: 13, fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-strong)", border: 0, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

/** Escolhas curtas (tipo, duração, perfil). */
export function Chip({ ativo, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={!!ativo}
      className="press pj-tap"
      style={{
        minHeight: 44, padding: "0 14px", borderRadius: 14, fontSize: 13, fontWeight: 600,
        border: `1px solid ${ativo ? "var(--pj-brand)" : "var(--pj-border)"}`,
        background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)",
        color: ativo ? "var(--pj-brand-ink)" : "var(--pj-text-muted)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/** A nota discreta — uma por ecrã. */
export function Nota({ children, className = "", style }) {
  return (
    <p className={className} style={{ fontSize: 11, lineHeight: 1.6, color: "var(--pj-text-faint)", ...style }}>
      {children}
    </p>
  );
}

export function Erro({ children }) {
  if (!children) return null;
  return <p role="alert" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-danger)" }}>{children}</p>;
}

export function LinkExterno({ href, children, style }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: "var(--pj-brand-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, ...style }}>
      {children}
    </a>
  );
}

/** Folha que sobe de baixo — para formulários e detalhes. Fecha com Esc e no fundo. */
export function Folha({ titulo, onFechar, children }) {
  const ref = useRef(null);
  // Guardado numa ref: os pais passam funções novas a cada render, e o
  // efeito não pode correr outra vez (roubava o foco a cada tecla).
  const fechar = useRef(onFechar);
  fechar.current = onFechar;
  useEffect(() => {
    const anterior = document.activeElement;
    ref.current?.focus();
    const tecla = e => { if (e.key === "Escape") fechar.current(); };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, []);

  // Portal para o <body>: dentro do ecrã, um antepassado animado (transform)
  // prendia a folha por baixo da barra de navegação.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.45)" }} onClick={onFechar}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto no-scrollbar outline-none"
        style={{ background: "var(--pj-surface)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 pt-5 pb-3" style={{ background: "var(--pj-surface)", zIndex: 1 }}>
          <h2 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="pj-tap flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 14, background: "var(--pj-subtle)", border: 0 }}>
            <X size={18} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function EstadoVazio({ Icone, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      {Icone && (
        <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: 18, background: "var(--pj-subtle)" }}>
          <Icone size={24} style={{ color: "var(--pj-brand-ink)" }} />
        </div>
      )}
      <p className="font-display" style={{ fontSize: 17, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</p>
      {texto && <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)", marginTop: 6, maxWidth: 300 }}>{texto}</p>}
      {children}
    </div>
  );
}

export function Cartao({ children, className = "", style, ...props }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", ...style }} {...props}>
      {children}
    </div>
  );
}
