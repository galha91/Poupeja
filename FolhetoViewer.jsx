import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import LogoLoja from "./LogoLoja";

/*
 * Folheto de uma loja dentro da app, em ecrã inteiro. Só para as cadeias
 * cujo site deixa ser mostrado assim (lib/folhetos-embed); as outras
 * abrem no site da loja, como antes.
 *
 * Voltar (botão do telemóvel incluído) fecha o folheto e deixa a pessoa onde
 * estava: abrir mete uma entrada no histórico, e o "voltar" gasta-a.
 */
export default function FolhetoViewer({ folheto, onFechar }) {
  const [lista, setLista] = useState(null);   // null = a procurar o folheto em vigor
  const [ativo, setAtivo] = useState(0);
  const [pronto, setPronto] = useState(false);
  const fechado = useRef(false);

  const fechar = () => {
    if (fechado.current) return;
    fechado.current = true;
    onFechar();
  };

  // Voltar do telemóvel / do browser fecha o folheto.
  useEffect(() => {
    try { window.history.pushState({ folheto: true }, ""); } catch {}
    const aoVoltar = () => fechar();
    const aoTecla = (e) => { if (e.key === "Escape") voltar(); };
    window.addEventListener("popstate", aoVoltar);
    window.addEventListener("keydown", aoTecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", aoVoltar);
      window.removeEventListener("keydown", aoTecla);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O botão da app gasta a entrada de histórico; se já não existe, fecha logo.
  function voltar() {
    if (window.history.state?.folheto) window.history.back();
    else fechar();
  }

  // O endereço do folheto em vigor lê-se da página da loja (muda todas as semanas).
  useEffect(() => {
    let vivo = true;
    fetch(`/api/folheto-viewer?loja=${encodeURIComponent(folheto.loja)}`)
      .then((r) => (r.ok ? r.json() : { folhetos: [] }))
      .then((j) => { if (vivo) setLista(j.folhetos || []); })
      .catch(() => { if (vivo) setLista([]); });
    return () => { vivo = false; };
  }, [folheto.loja]);

  useEffect(() => { setPronto(false); }, [ativo, lista]);

  const atual = lista?.[ativo];
  const abrirNoSite = () => window.open(folheto.url || atual?.url, "_blank", "noopener");

  // No <body>: os ecrãs da app têm animações com transform, e dentro de um
  // ancestral assim o "position: fixed" deixa de ser relativo ao ecrã.
  return createPortal(
    <div
      role="dialog"
      aria-label={`Folheto ${folheto.loja}`}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", background: "var(--pj-surface)" }}
    >
      {/* Cabeçalho */}
      <div style={{ background: "var(--pj-card)", borderBottom: "1px solid var(--pj-border)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center" style={{ gap: 10, padding: "10px 12px" }}>
          <button onClick={voltar} aria-label="Voltar" className="pj-tap flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--pj-subtle)", color: "var(--pj-text)", flex: "none" }}>
            <ArrowLeft size={18} />
          </button>
          <LogoLoja loja={folheto.loja} size={32} radius={9} bg="#eeece4" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="font-display truncate" style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.2 }}>{folheto.loja}</p>
            <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.2 }}>Folheto desta semana</p>
          </div>
          <button onClick={abrirNoSite} className="pj-tap flex items-center" style={{ gap: 5, fontSize: 12, fontWeight: 600, color: "var(--pj-brand-ink)", padding: "8px 10px", borderRadius: 10, flex: "none" }}>
            No site <ExternalLink size={13} />
          </button>
        </div>

        {/* Vários folhetos (Semanal Super/Contact/Mini, Continente/Madeira/Açores…) */}
        {lista?.length > 1 && (
          <div className="flex overflow-x-auto scrollbar-none" style={{ gap: 8, padding: "0 12px 10px" }}>
            {lista.map((f, i) => (
              <button
                key={f.url}
                onClick={() => setAtivo(i)}
                className="pj-tap flex-shrink-0"
                style={{
                  fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 999,
                  background: i === ativo ? "var(--pj-brand)" : "var(--pj-subtle)",
                  color: i === ativo ? "#fff" : "var(--pj-text-muted)",
                }}
              >
                {f.titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, background: "#fff" }}>
        {lista === null && <Aviso carregando>A abrir o folheto…</Aviso>}

        {lista !== null && !atual && (
          <Aviso>
            <AlertCircle size={26} style={{ color: "var(--pj-danger)", marginBottom: 8 }} />
            <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Não conseguimos abrir o folheto aqui</p>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", margin: "6px 0 14px" }}>Podes vê-lo no site da {folheto.loja}.</p>
            <button onClick={abrirNoSite} className="pj-tap" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--pj-brand)", padding: "10px 20px", borderRadius: 12 }}>
              Abrir no site
            </button>
          </Aviso>
        )}

        {atual && (
          <>
            {!pronto && <Aviso carregando>A abrir o folheto…</Aviso>}
            <iframe
              key={atual.url}
              src={atual.url}
              title={`Folheto ${folheto.loja} — ${atual.titulo}`}
              onLoad={() => setPronto(true)}
              // Sem allow-top-navigation: o folheto não consegue tirar a pessoa da app.
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "#fff", opacity: pronto ? 1 : 0 }}
            />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Aviso({ children, carregando }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ position: "absolute", inset: 0, padding: 24, background: "var(--pj-surface)", zIndex: 1, pointerEvents: carregando ? "none" : "auto" }}>
      {carregando && <div className="animate-spin" style={{ width: 26, height: 26, borderRadius: 999, border: "3px solid var(--pj-subtle)", borderTopColor: "var(--pj-brand)", marginBottom: 12 }} />}
      {typeof children === "string" ? <p style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>{children}</p> : children}
    </div>
  );
}
