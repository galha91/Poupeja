import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { ShoppingCart, Check, Plus, X, Minus } from "lucide-react";

function gerarId() { return Date.now() + Math.random(); }

export default function ListaPartilhada({ id }) {
  const [itens, setItens]         = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState(false);
  const [novoItem, setNovoItem]   = useState("");
  const [copiado, setCopiado]     = useState(false);
  const aplicandoPull             = useRef(false);
  const pushTimer                 = useRef(null);

  async function pull() {
    try {
      const r = await fetch(`/api/lista-partilhada/${id}`);
      if (!r.ok) { setErro(true); return; }
      const data = await r.json();
      if (Array.isArray(data.itens)) {
        aplicandoPull.current = true;
        setItens(data.itens);
        setTimeout(() => { aplicandoPull.current = false; }, 50);
      }
    } catch { setErro(true); }
    finally { setCarregando(false); }
  }

  function push(novosItens) {
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

  function atualizar(fn) {
    setItens(prev => {
      const next = fn(prev);
      if (!aplicandoPull.current) push(next);
      return next;
    });
  }

  function toggle(itemId) {
    atualizar(prev => prev.map(i => i.id === itemId ? { ...i, feito: !i.feito } : i));
  }
  function remover(itemId) {
    atualizar(prev => prev.filter(i => i.id !== itemId));
  }
  function adicionar() {
    const nome = novoItem.trim();
    if (!nome) return;
    atualizar(prev => [{ id: gerarId(), nome, emoji: "🛒", qty: 1, feito: false }, ...prev]);
    setNovoItem("");
  }

  useEffect(() => { pull(); }, []);

  // Poll a cada 10 segundos para apanhar mudanças de outros
  useEffect(() => {
    const t = setInterval(pull, 10000);
    return () => clearInterval(t);
  }, []);

  async function copiarLink() {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  const pendentes = itens.filter(i => !i.feito);
  const feitos    = itens.filter(i => i.feito);
  const progresso = itens.length ? (feitos.length / itens.length) * 100 : 0;

  return (
    <>
      <Head>
        <title>Lista de compras partilhada — PoupeJá</title>
        <meta name="description" content="Lista de compras partilhada via PoupeJá" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </Head>

      <div className="min-h-screen bg-slate-50 pb-32">

        {/* Header */}
        <div
          className="px-4 pt-12 pb-5"
          style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#a855f7)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-sm">🐷</span>
            </div>
            <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">PoupeJá</span>
          </div>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <ShoppingCart size={11} /> Lista de compras partilhada
          </p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-5xl font-black text-white leading-none">{pendentes.length}</span>
            <p className="text-white/70 text-sm font-bold pb-1">
              {pendentes.length === 1 ? "artigo por comprar" : "artigos por comprar"}
            </p>
          </div>
          {itens.length > 0 && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
              </div>
              <p className="text-[10px] text-white/50 mt-1.5">{feitos.length} de {itens.length} comprados</p>
            </>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pt-4">

          {/* Adicionar item */}
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Adicionar artigo…"
              value={novoItem}
              onChange={e => setNovoItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && adicionar()}
            />
            <button
              onClick={adicionar}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              <Plus size={20} />
            </button>
          </div>

          {carregando && (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {!carregando && erro && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
              <p className="text-sm font-black text-red-600">Lista não encontrada</p>
              <p className="text-xs text-red-400 mt-1">O link pode ter expirado ou estar errado.</p>
            </div>
          )}

          {!carregando && !erro && itens.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center text-center">
              <ShoppingCart size={28} className="text-violet-300 mb-3" />
              <p className="text-sm font-black text-slate-600">Lista vazia</p>
              <p className="text-xs text-slate-400 mt-1">Adiciona artigos acima</p>
            </div>
          )}

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Por comprar ({pendentes.length})</p>
              <div className="flex flex-col gap-2">
                {pendentes.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0 transition-colors"
                    />
                    <span className="text-xl flex-shrink-0">{item.emoji || "🛒"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{item.nome}</p>
                      {item.qty > 1 && <p className="text-[11px] text-slate-400">×{item.qty}</p>}
                    </div>
                    <button onClick={() => remover(item.id)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feitos */}
          {feitos.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Comprado ({feitos.length})</p>
              <div className="flex flex-col gap-2">
                {feitos.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3 opacity-50"
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={14} className="text-white" />
                    </button>
                    <span className="text-xl flex-shrink-0">{item.emoji || "🛒"}</span>
                    <p className="text-sm font-black text-slate-500 line-through flex-1 truncate">{item.nome}</p>
                    <button onClick={() => remover(item.id)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <X size={13} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA copiar link + abrir app */}
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
            <div className="px-4 py-4">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">PoupeJá</p>
              <p className="text-[14px] font-black text-white leading-snug mb-3">
                Poupa nas compras do dia a dia com a família
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={copiarLink}
                  className="px-4 py-2 rounded-xl bg-white/20 text-white text-[12px] font-black border border-white/20"
                >
                  {copiado ? "Copiado ✓" : "📋 Copiar link"}
                </button>
                <a
                  href="/"
                  className="px-4 py-2 rounded-xl bg-white text-emerald-700 text-[12px] font-black"
                >
                  Abrir PoupeJá →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { id: params.id || "" } };
}
