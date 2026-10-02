import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Minus, Plus, Share2, Trash2, X } from "lucide-react";
import { N_COMPARADAS } from "./lib/cobertura";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { agruparPorCategoria, adicionar, alterarQty, retirar, repor, semAcentos, jaComparados as listaComparados, MAX_ARTIGOS } from "./lib/listaCompras";
import { lerResumo, guardarResumo } from "./lib/resumoLista";

/*
 * Lista de compras.
 *
 * Uma lista de papel bem feita: caixa à esquerda, nome, quantidade à
 * direita. Sem ícones por artigo — eram metade emoji, metade inicial num
 * círculo, e tudo o que vinha do Comparar levava 🛒.
 *
 * Por ordem de importância:
 *   1. o campo "Adicionar artigo…", sempre no topo (sem mudar de ecrã);
 *   2. a lista, por categoria quando há 2 ou mais;
 *   3. a ação principal, em baixo: onde fica mais barata (lista otimizada).
 * Partilhar fica no cabeçalho, como ação secundária.
 *
 * Nada depende de hover: toca-se na linha para marcar, na quantidade
 * para a mudar (e remover); deslizar para a esquerda também remove.
 * Remover e limpar têm "Anular" durante uns segundos.
 *
 * O resultado da comparação (ResultadoLista) só se descarrega ao comparar.
 */

const ResultadoLista = dynamic(() => import("./ResultadoLista"), { ssr: false, loading: () => null });

const LS_KEY = "poupeja_lista_compras";
const ANULAR_MS = 5000;

function lerItens() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function guardarItens(itens) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(itens)); } catch {}
}


const LS_SHARE_KEY = "poupeja_lista_partilhada_id";

/*
 * O ID é a ÚNICA barreira desta lista: quem o tiver lê e escreve, sem conta.
 *
 * Era Math.random().toString(36).slice(2, 10) — e o Math.random não é
 * criptográfico. É um gerador previsível: quem observe alguns resultados
 * consegue, em princípio, reconstruir o estado interno e prever os
 * seguintes. Para um ID que é a única chave de uma lista, isso chega para
 * ser má ideia.
 *
 * (O comprimento, esse, era estável: em 20 000 amostras deu sempre 8
 * caracteres. O problema era mesmo a previsibilidade, não o tamanho.)
 *
 * Agora vem do gerador criptográfico do browser, com 12 caracteres. O
 * espaço de procura passa de 36^8 ≈ 2,8×10¹² para 36^12 ≈ 4,7×10¹⁸, e
 * deixa de haver padrão a explorar. Os IDs de 8 caracteres já emitidos
 * continuam a funcionar — o servidor aceita de 6 a 32.
 */
function gerarShareId() {
  const alfabeto = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  // % 36 sobre 256 tem um enviesamento residual (256 não é múltiplo de 36),
  // irrelevante aqui: o que interessa é não ser previsível, e não é.
  return Array.from(bytes, b => alfabeto[b % alfabeto.length]).join("");
}

const rotulo = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" };

/* ── Uma linha da lista ─────────────────────────────────────────── */
function Linha({ item, primeira, editando, onMarcar, onEditar, onQty, onRemover }) {
  const [dx, setDx] = useState(0);
  const toque = useRef(null);

  // Deslizar para a esquerda remove. Só conta se o gesto for sobretudo
  // horizontal — o resto é deslocar a página.
  function inicio(e) { const t = e.touches[0]; toque.current = { x: t.clientX, y: t.clientY, h: null }; }
  function mover(e) {
    const s = toque.current; if (!s) return;
    const t = e.touches[0]; const ddx = t.clientX - s.x; const ddy = t.clientY - s.y;
    if (s.h === null && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) s.h = Math.abs(ddx) > Math.abs(ddy);
    if (s.h) setDx(Math.min(0, ddx));
  }
  function fim() {
    const s = toque.current; toque.current = null;
    if (s?.h && dx < -90) { onRemover(); return; }
    setDx(0);
  }

  const feito = item.feito;
  const qty = item.qty || 1;
  return (
    <li className="relative" style={{ listStyle: "none", overflow: "hidden", borderTop: primeira ? "none" : "1px solid var(--pj-subtle)" }}>
      {dx < 0 && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-end" style={{ background: "var(--pj-danger-wash)", color: "var(--pj-danger)", paddingRight: 18, fontSize: 13, fontWeight: 600 }}>
          Remover
        </div>
      )}
      <div className="relative flex items-center" onTouchStart={inicio} onTouchMove={mover} onTouchEnd={fim}
        style={{ minHeight: 52, background: "var(--pj-surface)", transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform .2s" }}>
        <button onClick={editando ? onEditar : onMarcar} className="pj-tap flex items-center flex-1 min-w-0 text-left"
          style={{ gap: 14, minHeight: 52, padding: "0 4px 0 0", background: "transparent", border: 0 }}
          aria-pressed={feito} aria-label={`${item.nome}${qty > 1 ? `, ${qty}` : ""}${feito ? ", comprado" : ""}`}>
          <span aria-hidden className="flex items-center justify-center flex-none"
            style={{ width: 22, height: 22, borderRadius: 7, border: feito ? 0 : "1.5px solid var(--pj-text-faint)", background: feito ? "var(--pj-brand)" : "transparent" }}>
            {feito && <Check size={14} strokeWidth={3} color="#fff" />}
          </span>
          <span className="truncate" style={{ fontSize: 15.5, fontWeight: 500, color: feito ? "var(--pj-text-faint)" : "var(--pj-text)", textDecoration: feito ? "line-through" : "none" }}>
            {item.nome}
          </span>
        </button>

        {!feito && (editando ? (
          <div className="flex items-center flex-none" style={{ gap: 2 }}>
            <button onClick={() => onQty(-1)} disabled={qty <= 1} aria-label={`Menos ${item.nome}`} className="pj-tap flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text)", opacity: qty <= 1 ? 0.4 : 1 }}>
              <Minus size={16} />
            </button>
            <span className="pj-num text-center" aria-live="polite" style={{ width: 30, fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{qty}</span>
            <button onClick={() => onQty(1)} aria-label={`Mais ${item.nome}`} className="pj-tap flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text)" }}>
              <Plus size={16} />
            </button>
            <button onClick={onRemover} aria-label={`Remover ${item.nome}`} className="pj-tap flex items-center justify-center"
              style={{ width: 44, height: 44, marginLeft: 4, borderRadius: 12, background: "transparent", border: 0, color: "var(--pj-danger)" }}>
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <button onClick={onEditar} aria-label={`Quantidade de ${item.nome}: ${qty}. Alterar`} className="pj-tap pj-num flex items-center justify-end flex-none"
            style={{ minWidth: 44, height: 44, padding: "0 2px 0 8px", background: "transparent", border: 0, fontSize: 14, fontWeight: qty > 1 ? 600 : 500, color: qty > 1 ? "var(--pj-text)" : "var(--pj-text-faint)" }}>
            {qty > 1 ? `${qty}×` : "1"}
          </button>
        ))}
      </div>
    </li>
  );
}

/* ── O ecrã ─────────────────────────────────────────────────────── */
export default function SecaoListaCompras({ onVoltar }) {
  const [itens, setItens]       = useState(lerItens);
  const [texto, setTexto]       = useState("");
  const [focado, setFocado]     = useState(false);
  const [editando, setEditando] = useState(null);
  const [verComprados, setVerComprados] = useState(false);
  const [anular, setAnular]     = useState(null);   // { texto, removidos }
  const [listaId, setListaId]   = useState(() => {
    try { return localStorage.getItem(LS_SHARE_KEY) || null; } catch { return null; }
  });
  const [verPartilha, setVerPartilha] = useState(false);
  const [copiado, setCopiado]   = useState(false);
  const [criandoLink, setCriandoLink] = useState(false);
  const [topo, setTopo]         = useState(null); // null = campo não fica preso
  // Comparação: estado do bloco de baixo e do resultado.
  const [comparacao, setComparacao] = useState({ estado: "inicio", feitos: 0, linhas: null });
  const [resumo, setResumo]     = useState(null);
  const [verResultado, setVerResultado] = useState(false);
  const inputRef       = useRef(null);
  const ultimoPull     = useRef(null);   // JSON do último estado vindo do servidor
  const primeiraRender = useRef(true);
  const pushTimer      = useRef(null);
  const anularTimer    = useRef(null);

  function push(novosItens, id) {
    if (!id) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/lista-partilhada/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itens: novosItens }),
        });
      } catch {}
    }, 800);
  }

  async function pull(id) {
    if (!id) return;
    try {
      const r = await fetch(`/api/lista-partilhada/${id}`);
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data.itens)) {
        ultimoPull.current = JSON.stringify(data.itens);
        setItens(data.itens);
      }
    } catch {}
  }

  // Pull inicial quando há lista partilhada
  useEffect(() => { if (listaId) pull(listaId); }, []);

  // Poll a cada 15s para apanhar mudanças de outros membros
  useEffect(() => {
    if (!listaId) return;
    const t = setInterval(() => pull(listaId), 15000);
    return () => clearInterval(t);
  }, [listaId]);

  useEffect(() => {
    guardarItens(itens);
    // Não enviar no primeiro render (evita sobrepor o servidor com o estado
    // local antigo antes do pull inicial). Depois, só envia se for uma edição
    // real — ou seja, se o estado diferir do último recebido do servidor.
    if (primeiraRender.current) { primeiraRender.current = false; return; }
    if (listaId && JSON.stringify(itens) !== ultimoPull.current) push(itens, listaId);
  }, [itens]);

  // O campo fica preso logo abaixo do cabeçalho da app. Precisa de
  // overflow-x: clip no <main> (ver .pj-main); sem ele, fica no sítio.
  const [noBrowser, setNoBrowser] = useState(false);
  useEffect(() => {
    setNoBrowser(true);
    if (!window.CSS?.supports?.("overflow-x", "clip")) return;
    const h = document.querySelector("header");
    setTopo(h && getComputedStyle(h).position === "sticky" ? h.offsetHeight : 0);
  }, []);

  // Catálogo (autocomplete, nomes e categorias): à parte, só quando se
  // começa a escrever ou se junta um artigo. Não pesa na abertura da lista.
  // (Os artigos vindos do Comparar já trazem a categoria.)
  const [catalogo, setCatalogo] = useState(null);
  const pedidoCatalogo = useRef(null);
  function carregarCatalogo() {
    if (!pedidoCatalogo.current) {
      pedidoCatalogo.current = import("./lib/catalogoLista").then(m => {
        setCatalogo(m);
        setItens(prev => m.preencherCategorias(prev));
        return m;
      }).catch(() => { pedidoCatalogo.current = null; return null; });
    }
    return pedidoCatalogo.current;
  }
  // Lista vazia: o campo já vem focado.
  useEffect(() => { if (!itens.length) inputRef.current?.focus(); }, []);

  useEffect(() => () => { clearTimeout(anularTimer.current); clearTimeout(pushTimer.current); }, []);

  // Abre o menu de partilha nativo do telemóvel (WhatsApp, Mensagens…).
  // Se não houver partilha nativa (ex: desktop), copia o link.
  async function abrirPartilha(url) {
    // O url é passado em separado; não o repetir no texto (senão aparece duplicado).
    const texto = "A nossa lista de compras no PoupeJá — abre e edita comigo:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Lista de compras — PoupeJá", text: texto, url });
        evento("share", { content_type: "lista" });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return; // utilizador fechou o menu
      }
    }
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  async function partilhar() {
    setCriandoLink(true);
    const id = listaId || gerarShareId();
    try {
      const r = await fetch(`/api/lista-partilhada/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens }),
      });
      if (!r.ok) throw new Error();
      localStorage.setItem(LS_SHARE_KEY, id);
      setListaId(id);
      await abrirPartilha(`${window.location.origin}/lista/${id}`);
    } catch { alert("Não foi possível criar o link. Tenta outra vez."); }
    finally { setCriandoLink(false); }
  }

  function pararPartilha() {
    localStorage.removeItem(LS_SHARE_KEY);
    setListaId(null);
    setVerPartilha(false);
  }

  const pendentes = itens.filter(i => !i.feito);
  const feitos    = itens.filter(i => i.feito);
  const grupos    = useMemo(() => agruparPorCategoria(pendentes), [itens]);

  // Produtos já comparados no "Comparar preços" — os nomes que as lojas reconhecem.
  const [comparados] = useState(() => {
    try { return JSON.parse(localStorage.getItem("poupeja_pesquisas_precos") || "[]"); } catch { return []; }
  });
  // Com a lista vazia, o "Já comparaste" aparece por baixo, à vista (não em menu).
  // O menu só aparece enquanto se escreve: com o campo vazio não tapa a lista.
  const sugestoes = focado && texto.trim() && catalogo ? catalogo.sugerir(texto, { comparados }) : [];
  const jaComparados = !itens.length && !texto.trim() ? listaComparados(comparados) : [];

  // ── Ações ──
  async function juntar(nome) {
    if (!String(nome || "").trim()) return;
    setTexto("");
    inputRef.current?.focus();
    // O nome e a categoria certos vêm do catálogo (já carregado, quase sempre).
    const doCatalogo = (catalogo || await carregarCatalogo())?.doCatalogo;
    // Primeiro artigo de uma lista vazia = lista criada (GA4).
    if (!pendentes.length) evento("lista_criada", { origem: doCatalogo?.(nome) ? "catalogo" : "texto" });
    setItens(prev => adicionar(prev, nome, { doCatalogo }));
  }

  function marcar(id) {
    setEditando(null);
    setItens(prev => prev.map(i => i.id === id ? { ...i, feito: !i.feito } : i));
  }

  function tirar(ids, frase) {
    setEditando(null);
    const r = retirar(itens, ids);
    setItens(r.itens);
    clearTimeout(anularTimer.current);
    setAnular({ texto: frase, removidos: r.removidos });
    anularTimer.current = setTimeout(() => setAnular(null), ANULAR_MS);
  }

  function desfazer() {
    if (!anular) return;
    clearTimeout(anularTimer.current);
    const { removidos } = anular;
    setItens(prev => repor(prev, removidos));
    setAnular(null);
  }

  // ── Comparar (lista otimizada) ──
  // O último resultado (desta lista, de hoje) — `resumo` só serve para redesenhar.
  const resumoAtual = useMemo(() => lerResumo(pendentes), [itens, resumo]);
  // Os artigos mudaram desde a última comparação: o resultado em memória já não vale.
  const chaveAtual = JSON.stringify(pendentes.map(i => [i.nome, i.qty || 1]));
  const linhasValidas = comparacao.linhas && comparacao.chave === chaveAtual;

  async function comparar(forcar = false) {
    if (linhasValidas && !forcar) { setVerResultado(true); return; }
    // As pesquisas e o resultado só se descarregam aqui, ao comparar.
    import("./ResultadoLista");
    setVerResultado(false);
    const artigos = pendentes.slice(0, MAX_ARTIGOS);
    setComparacao({ estado: "a-carregar", feitos: 0, linhas: null });
    const { compararArtigos } = await import("./CompararLista");
    const linhas = await compararArtigos(artigos, () => setComparacao(c => ({ ...c, feitos: c.feitos + 1 })));
    setComparacao({ estado: "pronto", feitos: artigos.length, linhas, chave: chaveAtual });
    setVerResultado(true);
  }

  function aoResumo(r) {
    setResumo(guardarResumo(pendentes, r));
  }

  const nPend = pendentes.length;
  const aComparar = comparacao.estado === "a-carregar";
  const temAcao = nPend >= 2;

  return (
    <div className="pj-lista" style={{ paddingBottom: temAcao ? 176 : 112 }}>

      {/* Cabeçalho: voltar e partilhar (ação secundária) */}
      <div className="flex items-center justify-between px-2" style={{ minHeight: 48 }}>
        <button onClick={onVoltar} className="pj-tap flex items-center" style={{ gap: 6, minHeight: 44, padding: "0 10px", background: "transparent", border: 0, fontSize: 14, fontWeight: 600, color: "var(--pj-text-muted)" }}>
          <ArrowLeft size={17} /> Voltar
        </button>
        {itens.length > 0 && (
          <button onClick={listaId ? () => setVerPartilha(v => !v) : partilhar} disabled={criandoLink} aria-expanded={listaId ? verPartilha : undefined}
            className="pj-tap flex items-center" style={{ gap: 7, minHeight: 44, padding: "0 12px", background: "transparent", border: 0, fontSize: 14, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
            {listaId
              ? <><span aria-hidden className="rounded-full" style={{ width: 7, height: 7, background: "var(--pj-brand-ink)" }} /> Partilhada</>
              : <><Share2 size={16} /> {criandoLink ? "A criar link…" : "Partilhar"}</>}
          </button>
        )}
      </div>
      {listaId && verPartilha && (
        <div className="mx-4 mb-2 flex items-center justify-between" style={{ gap: 8, padding: "6px 6px 6px 14px", borderRadius: 12, background: "var(--pj-brand-wash)" }}>
          <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.4 }}>Quem tiver o link vê e edita esta lista.</p>
          <div className="flex flex-none">
            <button onClick={() => abrirPartilha(`${window.location.origin}/lista/${listaId}`)} className="pj-tap" style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: 0, fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
              {copiado ? "Copiado" : "Enviar link"}
            </button>
            <button onClick={pararPartilha} className="pj-tap" style={{ minHeight: 44, padding: "0 10px", background: "transparent", border: 0, fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)" }}>
              Parar
            </button>
          </div>
        </div>
      )}

      {/* Adicionar — sempre no topo */}
      <div className={`${topo === null ? "relative" : "sticky"} z-20 px-4`} style={{ top: topo ?? undefined, paddingTop: 6, paddingBottom: 10, background: "var(--pj-surface)" }}>
        <form onSubmit={e => { e.preventDefault(); juntar(texto); }} className="relative" role="search">
          <label htmlFor="pj-lista-adicionar" className="sr-only">Adicionar artigo</label>
          <Plus size={18} aria-hidden className="absolute" style={{ left: 14, top: 15, color: "var(--pj-text-faint)" }} />
          <input
            id="pj-lista-adicionar"
            ref={inputRef}
            type="text"
            value={texto}
            onChange={e => { setTexto(e.target.value); carregarCatalogo(); }}
            onFocus={() => { setFocado(true); setEditando(null); }}
            onBlur={() => setFocado(false)}
            onKeyDown={e => e.key === "Escape" && (setTexto(""), e.currentTarget.blur())}
            placeholder="Adicionar artigo…"
            autoComplete="off"
            enterKeyHint="done"
            role="combobox"
            aria-expanded={sugestoes.length > 0}
            aria-controls="pj-lista-sugestoes"
            className="w-full focus:outline-none"
            style={{ height: 48, padding: "0 44px 0 42px", borderRadius: 14, fontSize: 16, color: "var(--pj-text)", background: "var(--pj-card)", border: `1px solid ${focado ? "var(--pj-brand-ink)" : "var(--pj-border)"}` }}
          />
          {texto && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setTexto("")} aria-label="Limpar texto" className="pj-tap absolute flex items-center justify-center"
              style={{ right: 2, top: 2, width: 44, height: 44, background: "transparent", border: 0, color: "var(--pj-text-faint)" }}>
              <X size={16} />
            </button>
          )}
        </form>

        {sugestoes.length > 0 && (
          <ul id="pj-lista-sugestoes" role="listbox" aria-label="Sugestões" className="absolute left-4 right-4"
            style={{ marginTop: 6, padding: "4px 0", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 12px 32px -12px rgba(20,35,28,0.28)" }}>
            {sugestoes.map(s => {
              const na = pendentes.find(i => semAcentos(i.nome) === semAcentos(s.nome));
              return (
                <li key={s.nome} role="option" aria-selected={false}>
                  {/* onMouseDown: o campo não perde o foco (o teclado fica aberto) */}
                  <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => juntar(s.nome)}
                    className="pj-tap w-full flex items-center justify-between text-left" style={{ minHeight: 44, padding: "0 14px", background: "transparent", border: 0, gap: 12 }}>
                    <span className="truncate" style={{ fontSize: 15, color: "var(--pj-text)" }}>{s.nome}</span>
                    <span className="flex-none" style={{ fontSize: 12.5, color: "var(--pj-text-faint)" }}>
                      {na ? `Na lista${(na.qty || 1) > 1 ? ` · ${na.qty}×` : ""}` : s.origem === "comparados" ? "Já comparaste" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Lista vazia */}
      {!itens.length && (
        <div className="px-4">
          <p className="px-1" style={{ marginTop: 14, fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            A lista está vazia. Escreve o primeiro artigo — com dois ou mais, vemos onde fica mais barata.
          </p>
          {jaComparados.length > 0 && (
            <>
              <h3 style={{ ...rotulo, padding: "22px 4px 4px" }}>Já comparaste</h3>
              <ul>
                {jaComparados.map((s, i) => (
                  <li key={s.nome} style={{ listStyle: "none", borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                    <button onMouseDown={e => e.preventDefault()} onClick={() => juntar(s.nome)} className="pj-tap w-full flex items-center text-left"
                      style={{ gap: 12, minHeight: 48, padding: "0 4px", background: "transparent", border: 0, fontSize: 15, color: "var(--pj-text)" }}>
                      <Plus size={16} aria-hidden style={{ color: "var(--pj-brand-ink)" }} /> {s.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {itens.length > 0 && !nPend && (
        <p className="px-5" style={{ marginTop: 18, fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
          Tudo comprado.
        </p>
      )}

      {/* Por comprar */}
      {grupos.map(g => (
        <section key={g.categoria || "todos"} className="px-4" style={{ marginTop: g.categoria ? 14 : 4 }} aria-label={g.categoria || "Por comprar"}>
          {g.categoria && <h3 style={{ ...rotulo, padding: "6px 0 2px" }}>{g.categoria}</h3>}
          <ul>
            {g.itens.map((it, i) => (
              <Linha key={it.id} item={it} primeira={!i} editando={editando === it.id}
                onMarcar={() => marcar(it.id)}
                onEditar={() => setEditando(e => e === it.id ? null : it.id)}
                onQty={d => setItens(prev => alterarQty(prev, it.id, d))}
                onRemover={() => tirar([it.id], `«${it.nome}» removido`)} />
            ))}
          </ul>
        </section>
      ))}

      {/* Comprados — recolhidos */}
      {feitos.length > 0 && (
        <section className="px-4" style={{ marginTop: 22 }}>
          <div className="flex items-center justify-between" style={{ borderTop: "1px solid var(--pj-border)" }}>
            <button onClick={() => setVerComprados(v => !v)} aria-expanded={verComprados} className="pj-tap flex items-center"
              style={{ gap: 6, minHeight: 48, background: "transparent", border: 0, fontSize: 14, fontWeight: 600, color: "var(--pj-text-muted)" }}>
              Comprados ({feitos.length})
              <ChevronDown size={16} style={{ transform: verComprados ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            <button onClick={() => tirar(feitos.map(i => i.id), feitos.length === 1 ? "1 artigo limpo" : `${feitos.length} artigos limpos`)} className="pj-tap"
              style={{ minHeight: 44, padding: "0 4px 0 12px", background: "transparent", border: 0, fontSize: 14, fontWeight: 600, color: "var(--pj-text-muted)" }}>
              Limpar
            </button>
          </div>
          {verComprados && (
            <ul>
              {feitos.map((it, i) => (
                <Linha key={it.id} item={it} primeira={!i} editando={false} onMarcar={() => marcar(it.id)} onEditar={() => {}} onQty={() => {}}
                  onRemover={() => tirar([it.id], `«${it.nome}» removido`)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Em baixo: "Anular" e a ação principal. Vão para o <body>: o separador
          anima com transform, e um position: fixed lá dentro ficava preso a ele. */}
      {noBrowser && (temAcao || anular) && createPortal(
        <div className="pj-acao-lista fixed z-30 inset-x-0 pointer-events-none">
          <div className="max-w-md mx-auto px-4 flex flex-col pointer-events-auto" style={{ gap: 8 }}>
            {anular && (
              <div role="status" className="flex items-center justify-between" style={{ gap: 8, padding: "4px 4px 4px 16px", borderRadius: 14, background: "var(--pj-text)", color: "var(--pj-surface)" }}>
                <span className="truncate" style={{ fontSize: 14 }}>{anular.texto}</span>
                <button onClick={desfazer} className="pj-tap flex-none" style={{ minHeight: 44, padding: "0 14px", background: "transparent", border: 0, fontSize: 14, fontWeight: 700, color: "var(--pj-surface)" }}>
                  Anular
                </button>
              </div>
            )}
            {temAcao && (
              <button onClick={() => comparar()} disabled={aComparar} className="pj-tap press w-full text-left flex items-center relative overflow-hidden"
                style={{ gap: 12, minHeight: 64, padding: "12px 16px", borderRadius: 16, border: 0, background: "var(--pj-brand)", color: "#fff", boxShadow: "0 10px 28px -12px rgba(11,107,79,0.6)" }}>
                <span className="flex-1 min-w-0">
                  {aComparar ? (
                    <span role="status" style={{ display: "block", fontSize: 15, fontWeight: 600 }}>A ver os preços… {comparacao.feitos} de {Math.min(nPend, MAX_ARTIGOS)}</span>
                  ) : resumoAtual ? (
                    <>
                      <span className="truncate" style={{ display: "block", fontSize: 15, fontWeight: 600 }}>
                        Mais barata no {resumoAtual.nome} · <span className="pj-num">{eur(resumoAtual.total, 2)} €</span>
                      </span>
                      <span style={{ display: "block", fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                        {resumoAtual.poupanca >= 0.01 ? <>Poupas <span className="pj-num">{eur(resumoAtual.poupanca, 2)} €</span> · ver detalhe</> : "Ver detalhe"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Onde fica mais barata?</span>
                      <span style={{ display: "block", fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                        Comparar {Math.min(nPend, MAX_ARTIGOS)} artigos em {N_COMPARADAS} supermercados
                      </span>
                    </>
                  )}
                </span>
                {!aComparar && <ChevronRight size={20} aria-hidden className="flex-none" />}
                {aComparar && (
                  <span aria-hidden className="absolute left-0 bottom-0" style={{ height: 3, background: "rgba(255,255,255,0.75)", transition: "width .3s", width: `${Math.round((comparacao.feitos / Math.max(1, Math.min(nPend, MAX_ARTIGOS))) * 100)}%` }} />
                )}
              </button>
            )}
          </div>
        </div>
      , document.body)}

      {/* Resultado — folha por cima da lista */}
      {verResultado && comparacao.linhas && createPortal(
        <FolhaResultado onFechar={() => setVerResultado(false)}>
          <ResultadoLista linhas={comparacao.linhas} moldura={false} onResumo={aoResumo}
            onAtualizar={() => comparar(true)} />
        </FolhaResultado>,
        document.body,
      )}
    </div>
  );

}

/* Folha de baixo para o resultado: fecha com o X, o fundo ou Esc. */
function FolhaResultado({ onFechar, children }) {
  const fecharRef = useRef(null);
  useEffect(() => {
    fecharRef.current?.focus();
    const tecla = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = antes; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="pj-resultado-titulo">
      <div className="absolute inset-0" onClick={onFechar} style={{ background: "rgba(20,35,28,0.45)" }} />
      <div className="relative w-full max-w-md overflow-y-auto" style={{ maxHeight: "88vh", borderRadius: "20px 20px 0 0", background: "var(--pj-card)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between" style={{ padding: "6px 6px 6px 16px", background: "var(--pj-card)", borderBottom: "1px solid var(--pj-subtle)" }}>
          <h2 id="pj-resultado-titulo" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Onde fica mais barata</h2>
          <button ref={fecharRef} onClick={onFechar} aria-label="Fechar" className="pj-tap flex items-center justify-center"
            style={{ width: 44, height: 44, background: "transparent", border: 0, color: "var(--pj-text-muted)" }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
