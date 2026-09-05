import { useState, useEffect } from "react";
import { Target, Pencil, Trash2, X, PartyPopper } from "lucide-react";
import { evento } from "./lib/analytics";

/*
 * Meta de poupança — "Estou a poupar para…"
 * O progresso é a poupança REAL dos talões desde a criação da meta.
 * Guardado em poupeja_meta (sincronizado; o cron-avisos envia push nos marcos).
 */
const EMOJIS = ["🏝️", "🎁", "🚗", "🏠", "🎓", "💻", "👶", "✈️", "💍", "🐷"];

function lerMeta() {
  try { return JSON.parse(localStorage.getItem("poupeja_meta") || "null"); } catch { return null; }
}
function guardarMeta(m) {
  try {
    if (m) localStorage.setItem("poupeja_meta", JSON.stringify(m));
    else localStorage.removeItem("poupeja_meta");
  } catch {}
}
function progressoDesde(criadoEm) {
  try {
    const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
    return taloes
      .filter(t => t.tipo === "compra" && t.valorPoupado != null)
      .filter(t => ((t.dataCompra || (t.criadoEm || "").slice(0, 10)) || "") >= criadoEm)
      .reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
  } catch { return 0; }
}

export default function MetaPoupanca({ syncTick = 0 }) {
  const [meta, setMeta] = useState(null);
  const [editar, setEditar] = useState(false);
  const [fNome, setFNome] = useState("");
  const [fValor, setFValor] = useState("");
  const [fEmoji, setFEmoji] = useState("🏝️");

  useEffect(() => { setMeta(lerMeta()); }, [syncTick]);

  function abrirForm() {
    if (meta) { setFNome(meta.nome); setFValor(String(meta.valor)); setFEmoji(meta.emoji || "🏝️"); }
    else { setFNome(""); setFValor(""); setFEmoji("🏝️"); }
    setEditar(true);
  }

  function submeter(e) {
    e.preventDefault();
    const valor = parseFloat(String(fValor).replace(",", "."));
    if (!fNome.trim() || !valor || valor <= 0) return;
    const nova = {
      nome: fNome.trim().slice(0, 40),
      valor: Math.round(valor * 100) / 100,
      emoji: fEmoji,
      criadoEm: meta?.criadoEm || new Date().toISOString().slice(0, 10),
    };
    guardarMeta(nova);
    setMeta(nova);
    setEditar(false);
    evento(meta ? "meta_editada" : "meta_criada", { valor: nova.valor });
  }

  function remover() {
    guardarMeta(null);
    setMeta(null);
    setEditar(false);
  }

  const progresso = meta ? progressoDesde(meta.criadoEm) : 0;
  const pct = meta ? Math.min(Math.round((progresso / meta.valor) * 100), 100) : 0;
  const completa = meta && progresso >= meta.valor;

  return (
    <div className="px-4 mb-5 anim-up anim-up-1">
      {!meta ? (
        <button onClick={abrirForm} className="pj-tap press w-full text-left flex items-center rounded-2xl px-4 py-3.5"
          style={{ gap: 12, background: "var(--pj-card)", border: "1.5px dashed var(--pj-brand-soft)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
            <Target size={18} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>Estou a poupar para…</p>
            <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>Define uma meta e vê a poupança real a enchê-la</p>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: completa ? "var(--pj-brand-wash)" : "var(--pj-card)", border: `1px solid ${completa ? "#0b6b4f44" : "var(--pj-border)"}` }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>{meta.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{meta.nome}</p>
              <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1 }}>
                {completa
                  ? <>Meta alcançada! €{meta.valor.toFixed(2).replace(".", ",")} poupados 🎉</>
                  : <>€{progresso.toFixed(2).replace(".", ",")} de €{meta.valor.toFixed(2).replace(".", ",")} · desde {new Date(meta.criadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</>}
              </p>
            </div>
            <span className="font-display flex-shrink-0" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{pct}%</span>
            <button onClick={abrirForm} aria-label="Editar meta" className="pj-tap w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
              <Pencil size={13} style={{ color: "var(--pj-text-muted)" }} />
            </button>
          </div>
          <div className="mt-3" style={{ height: 6, borderRadius: 4, background: "var(--pj-border)", overflow: "hidden" }}>
            <div className="pj-bar" style={{ height: "100%", width: `${pct}%`, "--pj-final-width": `${pct}%`, background: "var(--pj-brand)", borderRadius: 4 }} />
          </div>
          {completa && (
            <button onClick={remover} className="pj-tap mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--pj-brand-ink)" }}>
              <PartyPopper size={13} /> Concluir e criar nova meta
            </button>
          )}
        </div>
      )}

      {editar && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(20,35,28,0.55)" }} onClick={() => setEditar(false)}>
          <form onSubmit={submeter} className="w-full rounded-t-3xl px-5 pt-5 pb-9" style={{ background: "var(--pj-card)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--pj-text)" }}>{meta ? "Editar meta" : "Nova meta de poupança"}</p>
              <button type="button" onClick={() => setEditar(false)} aria-label="Fechar" className="pj-tap w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
                <X size={15} style={{ color: "var(--pj-text-muted)" }} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setFEmoji(e)}
                  className="pj-tap w-11 h-11 rounded-xl text-xl flex items-center justify-center"
                  style={fEmoji === e ? { border: "1.5px solid var(--pj-brand)", background: "var(--pj-brand-wash)" } : { border: "1px solid var(--pj-border)", background: "var(--pj-surface)" }}>
                  {e}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Para quê? (ex: Férias no Algarve)" value={fNome} onChange={e => setFNome(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-[14px] mb-3 focus:outline-none"
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            <input type="number" inputMode="decimal" step="0.01" min="1" placeholder="Quanto? (ex: 300)" value={fValor} onChange={e => setFValor(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl text-[14px] mb-4 focus:outline-none"
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            <button type="submit" className="pj-tap w-full py-4 rounded-2xl text-white font-semibold" style={{ background: "var(--pj-brand)" }}>
              {meta ? "Guardar alterações" : "Começar a encher o jarro 🐷"}
            </button>
            {meta && (
              <button type="button" onClick={remover} className="pj-tap w-full py-2.5 mt-2 inline-flex items-center justify-center gap-1.5 font-semibold text-[13px]" style={{ color: "#a8432f" }}>
                <Trash2 size={13} /> Apagar meta
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
