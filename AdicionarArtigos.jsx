import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronDown, Search, Check, Plus } from "lucide-react";
import { CATEGORIAS, ITENS, MAIS_COMUNS, itemPorNome } from "./data/catalogo-lista";
import { pesquisarCatalogo, correspondeExato } from "./lib/pesquisaCatalogo";

/*
 * Adicionar à lista — carregado só quando se abre (o catálogo vem junto).
 *
 * Um toque adiciona, outro toque tira. Primeiro o que se usa mais (mais
 * comuns e recentes); o resto por categoria, recolhido. A pesquisa aceita
 * erros, e o que não estiver no catálogo entra como artigo livre.
 * Sem ícones por artigo: só o nome, como numa lista em papel.
 */

const LS_RECENTES = "poupeja_lista_recentes";
const MAX_RECENTES = 12;

function lerRecentes() {
  try {
    const l = JSON.parse(localStorage.getItem(LS_RECENTES) || "[]");
    if (Array.isArray(l) && l.length) return l;
    // Sem histórico ainda: o que já se comparou no "Comparar preços".
    return JSON.parse(localStorage.getItem("poupeja_pesquisas_precos") || "[]").map((q) => itemPorNome(q)?.nome || q.charAt(0).toUpperCase() + q.slice(1));
  } catch { return []; }
}
export function lembrarRecente(nome) {
  try {
    const l = JSON.parse(localStorage.getItem(LS_RECENTES) || "[]");
    const novos = [nome, ...l.filter((n) => n.toLowerCase() !== nome.toLowerCase())].slice(0, MAX_RECENTES);
    localStorage.setItem(LS_RECENTES, JSON.stringify(novos));
  } catch {}
}

const rotulo = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" };

function Chip({ nome, ativo, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={ativo} className="pj-tap press inline-flex items-center"
      style={{ gap: 6, minHeight: 40, padding: "0 14px", borderRadius: 999, fontSize: 13.5, fontWeight: ativo ? 600 : 500,
        border: `1px solid ${ativo ? "var(--pj-brand-soft)" : "var(--pj-border)"}`,
        background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)", color: ativo ? "var(--pj-brand-ink)" : "var(--pj-text)" }}>
      {ativo && <Check size={14} />}
      {nome}
    </button>
  );
}

export default function AdicionarArtigos({ naLista, onAlternar, onLivre, onFechar }) {
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState({});
  const [recentes] = useState(lerRecentes);
  const inputRef = useRef(null);

  const tem = (nome) => naLista.has(nome.toLowerCase());
  const resultados = useMemo(() => pesquisarCatalogo(busca, ITENS), [busca]);
  const texto = busca.trim();
  const exato = resultados.find((it) => correspondeExato(texto, it));
  const nNaLista = naLista.size;

  function alternar(it) {
    onAlternar(it);
    lembrarRecente(it.nome);
  }

  function submeter(e) {
    e.preventDefault();
    if (texto.length < 2) return;
    if (exato) { if (!tem(exato.nome)) alternar(exato); }
    else { onLivre(texto); lembrarRecente(texto); }
    setBusca("");
    inputRef.current?.focus();
  }

  const recentesVisiveis = recentes.slice(0, MAX_RECENTES);

  return (
    <div className="pb-28">
      <div className="flex items-center gap-2 px-4 pt-1 mb-4">
        <button onClick={onFechar} aria-label="Voltar à lista" className="pj-tap press flex items-center justify-center flex-none"
          style={{ width: 40, height: 40, borderRadius: 12, background: "var(--pj-subtle)", border: 0 }}>
          <ChevronLeft size={18} style={{ color: "var(--pj-text-muted)" }} />
        </button>
        <form onSubmit={submeter} className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--pj-text-faint)" }} />
          <input ref={inputRef} type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar ou escrever um artigo" aria-label="Procurar ou escrever um artigo"
            enterKeyHint="done" autoComplete="off"
            className="w-full focus:outline-none"
            style={{ padding: "11px 12px 11px 34px", borderRadius: 14, fontSize: 16, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }} />
        </form>
        <button onClick={onFechar} className="pj-tap flex-none"
          style={{ minHeight: 40, padding: "0 4px", background: "transparent", border: 0, fontSize: 13.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
          {nNaLista ? `Lista (${nNaLista})` : "Lista"}
        </button>
      </div>

      {texto.length >= 2 ? (
        <div className="px-4">
          <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 16, overflow: "hidden" }}>
            {resultados.map((it, i) => {
              const ativo = tem(it.nome);
              return (
                <button key={it.id} onClick={() => alternar(it)} aria-pressed={ativo} className="pj-tap w-full text-left flex items-center gap-3"
                  style={{ padding: "12px 14px", background: "transparent", border: 0, borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                  <span className="flex-1 min-w-0" style={{ fontSize: 14, color: "var(--pj-text)", fontWeight: ativo ? 600 : 500 }}>
                    {it.nome}
                    {it.un && <span style={{ fontSize: 12, color: "var(--pj-text-faint)", fontWeight: 500 }}> · {it.un}</span>}
                  </span>
                  <span className="flex items-center justify-center flex-none"
                    style={{ width: 24, height: 24, borderRadius: 999, background: ativo ? "var(--pj-brand)" : "transparent", border: ativo ? 0 : "1.5px solid var(--pj-border)" }}>
                    {ativo && <Check size={14} color="#fff" />}
                  </span>
                </button>
              );
            })}
            {/* Não está no catálogo (ou é outra coisa): entra como artigo livre, no fim. */}
            {!exato && (
              <button onClick={submeter} className="pj-tap w-full text-left flex items-center gap-3"
                style={{ padding: "12px 14px", background: "transparent", border: 0, borderTop: resultados.length ? "1px solid var(--pj-subtle)" : "none", fontSize: 14, color: "var(--pj-brand-ink)", fontWeight: 600 }}>
                <Plus size={16} /> Adicionar «{texto}»
              </button>
            )}
          </div>
          {resultados.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 10, lineHeight: 1.5 }}>
              Toca para adicionar; toca outra vez para tirar.
            </p>
          )}
        </div>
      ) : (
        <>
          <section className="px-4 mb-6">
            <h3 style={{ ...rotulo, marginBottom: 10 }}>Mais comuns</h3>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {MAIS_COMUNS.map((it) => <Chip key={it.id} nome={it.nome} ativo={tem(it.nome)} onClick={() => alternar(it)} />)}
            </div>
          </section>

          {recentesVisiveis.length > 0 && (
            <section className="px-4 mb-6">
              <h3 style={{ ...rotulo, marginBottom: 10 }}>Usados recentemente</h3>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {recentesVisiveis.map((nome) => {
                  const it = itemPorNome(nome) || { nome, livre: true };
                  return <Chip key={nome} nome={it.nome} ativo={tem(it.nome)} onClick={() => (it.livre ? onLivre(nome, true) : alternar(it))} />;
                })}
              </div>
            </section>
          )}

          <section className="px-4">
            <h3 style={{ ...rotulo, marginBottom: 4 }}>Todas as categorias</h3>
            {CATEGORIAS.map((c) => {
              const aberta = !!abertas[c.id];
              const n = c.itens.filter((it) => tem(it.nome)).length;
              return (
                <div key={c.id} style={{ borderBottom: "1px solid var(--pj-subtle)" }}>
                  <button onClick={() => setAbertas((a) => ({ ...a, [c.id]: !a[c.id] }))} aria-expanded={aberta}
                    className="pj-tap w-full flex items-center justify-between"
                    style={{ minHeight: 48, background: "transparent", border: 0, padding: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>
                      {c.nome}
                      {n > 0 && <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}> · {n} na lista</span>}
                    </span>
                    <ChevronDown size={17} style={{ color: "var(--pj-text-faint)", transform: aberta ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </button>
                  {/* Só se desenha o que está aberto. */}
                  {aberta && (
                    <div className="flex flex-wrap" style={{ gap: 8, paddingBottom: 14 }}>
                      {c.itens.map((it) => <Chip key={it.nome} nome={it.nome} ativo={tem(it.nome)} onClick={() => alternar(itemPorNome(it.nome))} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
