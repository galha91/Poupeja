import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, X, Check, Minus, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import CompararLista from "./CompararLista";
import { evento } from "./lib/analytics";

// O catálogo (~230 artigos) só é carregado quando se vai adicionar.
const AdicionarArtigos = dynamic(() => import("./AdicionarArtigos"), { ssr: false, loading: () => <div className="px-4 pt-2" style={{ height: 400 }} /> });

const LS_KEY = "poupeja_lista_compras";

function IconeArtigo({ nome, size = 30, className = "" }) {
  // Sem emojis: metade dos artigos tinha um, a outra metade não, e a
  // lista parecia montada à pressa. A inicial é igual para todos.
  const inicial = (nome || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-display font-semibold ${className}`}
      style={{ width: size, height: size, background: "var(--pj-subtle)", color: "var(--pj-brand-ink)", fontSize: Math.round(size * 0.46) }}
    >
      {inicial}
    </span>
  );
}


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

export default function SecaoListaCompras() {
  const [itens, setItens]       = useState(lerItens);
  const [modo, setModo]         = useState("lista"); // "lista" | "adicionar"
  const [listaId, setListaId]   = useState(() => {
    try { return localStorage.getItem(LS_SHARE_KEY) || null; } catch { return null; }
  });
  const [copiado, setCopiado]   = useState(false);
  const [criandoLink, setCriandoLink] = useState(false);
  const ultimoPull     = useRef(null);   // JSON do último estado vindo do servidor
  const primeiraRender = useRef(true);
  const pushTimer      = useRef(null);

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

  // Abre o menu de partilha nativo do telemóvel (WhatsApp, Mensagens…).
  // Se não houver partilha nativa (ex: desktop), copia o link.
  async function abrirPartilha(url) {
    // O url é passado em separado; não o repetir no texto (senão aparece duplicado).
    const texto = "🛒 A nossa lista de compras no PoupeJá — abre e edita comigo:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Lista de compras — PoupeJá", text: texto, url });
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
    } catch { alert("Erro ao criar link. Tenta novamente."); }
    finally { setCriandoLink(false); }
  }

  function pararPartilha() {
    localStorage.removeItem(LS_SHARE_KEY);
    setListaId(null);
  }

  async function copiarLink() {
    await abrirPartilha(`${window.location.origin}/lista/${listaId}`);
  }

  const pendentes = itens.filter(i => !i.feito);
  const feitos    = itens.filter(i => i.feito);
  const progresso = itens.length ? (feitos.length / itens.length) * 100 : 0;

  function adicionarItem(nome, cat = "", q = "") {
    // Primeiro artigo de uma lista vazia = lista criada (GA4).
    if (!itens.some(i => !i.feito)) evento("lista_criada", { origem: q ? "catalogo" : "texto" });
    setItens(prev => {
      const existe = prev.find(i => i.nome.toLowerCase() === nome.toLowerCase() && !i.feito);
      if (existe) return prev;
      return [{ id: Date.now() + Math.random(), nome, emoji: "", categoria: cat, qty: 1, feito: false, ...(q ? { q } : {}) }, ...prev];
    });
  }

  // Catálogo: um toque adiciona, outro toque tira (só dos por comprar).
  function alternarCatalogo(it) {
    const existe = itens.find(i => i.nome.toLowerCase() === it.nome.toLowerCase() && !i.feito);
    if (existe) setItens(prev => prev.filter(i => i.id !== existe.id));
    else adicionarItem(it.nome, it.cat, it.q);
  }
  function adicionarLivre(nome, alternar = false) {
    const existe = itens.find(i => i.nome.toLowerCase() === nome.toLowerCase() && !i.feito);
    if (existe && alternar) setItens(prev => prev.filter(i => i.id !== existe.id));
    else if (!existe) adicionarItem(nome.charAt(0).toUpperCase() + nome.slice(1));
  }

  function marcar(id) {
    setItens(prev => prev.map(i => i.id === id ? { ...i, feito: !i.feito } : i));
  }

  function remover(id) {
    setItens(prev => prev.filter(i => i.id !== id));
  }

  function alterarQty(id, delta) {
    setItens(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nova = Math.max(1, (i.qty || 1) + delta);
      return { ...i, qty: nova };
    }));
  }

  function limparFeitos() {
    setItens(prev => prev.filter(i => !i.feito));
  }

  if (modo === "adicionar") {
    return (
      <AdicionarArtigos
        naLista={new Set(pendentes.map(i => i.nome.toLowerCase()))}
        onAlternar={alternarCatalogo}
        onLivre={adicionarLivre}
        onFechar={() => setModo("lista")}
      />
    );
  }

  // ── MODO LISTA ──
  return (
    <div className="pb-28 no-scrollbar">

      {/* Header */}
      <div className="mx-4 mb-5 pt-2 anim-up">
        <p className="flex items-center gap-1.5 mb-2" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
          <ShoppingCart size={11} style={{ color: "var(--pj-brand-ink)" }} /> Lista de compras
        </p>
        <div className="flex items-end gap-3 mb-4">
          <span className="font-display leading-none" style={{ fontSize: "48px", fontWeight: 600, color: "var(--pj-text)" }}>{pendentes.length}</span>
          <p className="text-sm font-medium pb-1.5" style={{ color: "var(--pj-text-muted)" }}>{pendentes.length === 1 ? "artigo por comprar" : "artigos por comprar"}</p>
        </div>
        {itens.length > 0 && (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pj-subtle)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progresso}%`, background: "var(--pj-brand)" }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--pj-text-faint)" }}>{feitos.length} de {itens.length} comprados</p>
          </>
        )}

        {/* Partilha */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {!listaId ? (
            <button
              onClick={partilhar}
              disabled={criandoLink}
              className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-xl"
              style={{ background: "var(--pj-brand)", color: "#fff" }}
            >
              <Share2 size={13} /> {criandoLink ? "A criar…" : "Partilhar com a família"}
            </button>
          ) : (
            <>
              <button
                onClick={copiarLink}
                className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-xl"
                style={{ background: "var(--pj-brand)", color: "#fff" }}
              >
                <Share2 size={13} /> {copiado ? "Copiado ✓" : "Partilhar"}
              </button>
              <button
                onClick={pararPartilha}
                className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl"
                style={{ background: "var(--pj-subtle)", color: "var(--pj-text-muted)", border: "1px solid var(--pj-border)" }}
              >
                <X size={12} /> Parar partilha
              </button>
            </>
          )}
        </div>
        {listaId && (
          <p className="text-[10px] mt-2 flex items-center gap-1.5" style={{ color: "var(--pj-text-faint)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--pj-brand)" }} />
            Lista partilhada — sincroniza automaticamente
          </p>
        )}
      </div>
      <div className="mx-4 mb-5" style={{ borderTop: "1px solid var(--pj-border)" }} />

      {/* Onde fica mais barata — com 2 ou mais artigos por comprar */}
      {pendentes.length >= 2 && (
        <div className="px-4 mb-5 anim-up">
          <CompararLista itens={pendentes} />
        </div>
      )}

      {/* Botão adicionar */}
      <div className="px-4 mb-5 anim-up anim-up-1">
        <button
          onClick={() => setModo("adicionar")}
          className="pj-tap press w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--pj-brand)" }}
        >
          <Plus size={18} /> Adicionar artigos
        </button>
      </div>

      {/* Empty state */}
      {itens.length === 0 && (
        <div className="mx-4 p-10 flex flex-col items-center text-center anim-up anim-up-2 rounded-2xl" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--pj-subtle)" }}>
            <ShoppingCart size={28} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <p className="font-display text-sm font-semibold mb-1" style={{ color: "var(--pj-text)" }}>Lista vazia</p>
          <p className="text-[12px]" style={{ color: "var(--pj-text-faint)" }}>Toca em "Adicionar artigos" para começar</p>
        </div>
      )}

      {/* Pendentes — grelha */}
      {pendentes.length > 0 && (
        <div className="px-4 mb-5 anim-up anim-up-2">
          <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Por comprar ({pendentes.length})</p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
            {pendentes.map(it => {
              return (
                <div key={it.id} className="relative flex flex-col rounded-2xl" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                  <button
                    onClick={() => marcar(it.id)}
                    aria-label={`Marcar ${it.nome} como comprado`}
                    className="pj-tap press w-full flex flex-col items-center gap-1.5"
                    style={{ padding: "14px 8px 6px", background: "transparent", border: 0 }}
                  >
                    <IconeArtigo nome={it.nome} size={30} />
                    <p className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--pj-text)" }}>{it.nome}</p>
                  </button>
                  {/* Quantidade — dentro do cartão e sempre à mão (não há "hover" no telemóvel). */}
                  <div className="flex items-center justify-center mt-auto" style={{ paddingBottom: 6 }}>
                    <button onClick={() => alterarQty(it.id, -1)} aria-label={`Menos ${it.nome}`} disabled={(it.qty || 1) <= 1}
                      className="pj-tap flex items-center justify-center" style={{ width: 32, height: 32, background: "transparent", border: 0, color: "var(--pj-text-faint)", opacity: (it.qty || 1) <= 1 ? 0.35 : 1 }}>
                      <Minus size={12} />
                    </button>
                    <span className="text-[12px] font-semibold text-center pj-num" style={{ minWidth: 18, color: it.qty > 1 ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>{it.qty || 1}</span>
                    <button onClick={() => alterarQty(it.id, 1)} aria-label={`Mais ${it.nome}`}
                      className="pj-tap flex items-center justify-center" style={{ width: 32, height: 32, background: "transparent", border: 0, color: "var(--pj-text-faint)" }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => remover(it.id)}
                    aria-label={`Tirar ${it.nome} da lista`}
                    className="pj-tap press absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--pj-subtle)", border: "1px solid var(--pj-border)" }}
                  >
                    <X size={9} style={{ color: "var(--pj-text-muted)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feitos */}
      {feitos.length > 0 && (
        <div className="px-4 anim-up anim-up-3">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Comprados ({feitos.length})</p>
            <button onClick={limparFeitos} className="pj-tap press text-[11px] font-semibold" style={{ color: "var(--pj-text-muted)" }}>Limpar tudo</button>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5" style={{ opacity: 0.55 }}>
            {feitos.map(it => (
              <button key={it.id} onClick={() => marcar(it.id)}
                className="pj-tap press p-3.5 flex flex-col items-center gap-1.5 relative rounded-2xl"
                style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-subtle)" }}>
                <IconeArtigo nome={it.nome} size={30} className="grayscale" />
                <p className="text-[11px] font-medium text-center leading-tight line-through" style={{ color: "var(--pj-text-faint)" }}>{it.nome}</p>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--pj-brand)" }}>
                  <Check size={11} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
