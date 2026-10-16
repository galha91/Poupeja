import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, ShoppingCart, Check, ChefHat, Minus, Plus, Star, ChevronLeft, ChevronRight, Timer, Pause, Play, RotateCcw, Info } from "lucide-react";
import { ingredientesPara, minutosDoPasso, emojiIngrediente, formatarTempo, DIETAS } from "./lib/receitas/motor";
import { evento } from "./lib/analytics";

/*
 * Uma receita: porções, nutrição, ingredientes, passos e o modo "Cozinhar"
 * (um passo de cada vez, letra grande, temporizador, ecrã sempre ligado).
 *
 * As estrelas ficam no dispositivo e ensinam o plano: receitas com 4-5
 * estrelas voltam mais vezes, as de 1-2 quase nunca.
 */

export const LS_AVALIACOES = "poupeja_ementas_avaliacoes";

export function lerAvaliacoes() {
  try { return JSON.parse(localStorage.getItem(LS_AVALIACOES) || "{}") || {}; } catch { return {}; }
}
function guardarAvaliacao(id, dados) {
  const todas = lerAvaliacoes();
  todas[id] = { ...todas[id], ...dados, em: new Date().toISOString() };
  try { localStorage.setItem(LS_AVALIACOES, JSON.stringify(todas)); } catch {}
  return todas[id];
}

const ROT = "text-[11px] font-semibold uppercase tracking-[0.09em]";

export function BadgeCusto({ custo, claro = false }) {
  return (
    <span className="font-semibold" style={{ fontSize: 12, color: claro ? "#fff" : "var(--pj-brand-ink)" }}>
      {"€".repeat(custo)}<span style={{ color: claro ? "rgba(255,255,255,0.4)" : "#cfccbf" }}>{"€".repeat(3 - custo)}</span>
    </span>
  );
}

function Estrelas({ valor, onChange, tamanho = 26 }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)} className="pj-tap press" style={{ background: "none", border: 0, padding: 2 }}>
          <Star size={tamanho} fill={n <= (valor || 0) ? "#e0a526" : "none"} style={{ color: n <= (valor || 0) ? "#e0a526" : "var(--pj-border)" }} />
        </button>
      ))}
    </div>
  );
}

/* ─────────────── Modo cozinhar ─────────────── */

function bip() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {}
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch {}
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Ingredientes que o passo menciona ("Coze a batata…" → Batata 500 g). */
function doPasso(texto, ingredientes) {
  const t = semAcento(texto);
  return ingredientes.filter((i) => {
    if (i.u === "q.b.") return false;
    const raiz = semAcento(i.nome.split(/[ (]/)[0]).replace(/s$/, "").slice(0, 6);
    return raiz.length >= 3 && t.includes(raiz);
  });
}

function ModoCozinhar({ receita, ingredientes, onFechar, onAvaliar }) {
  const n = receita.passos.length;
  const [i, setI] = useState(0);
  const [fim, setFim] = useState(false);
  const [timer, setTimer] = useState(null); // { total, resta, corre, passo }
  const [estrelas, setEstrelas] = useState(0);

  // Ecrã sempre ligado enquanto se cozinha (onde o browser deixa).
  useEffect(() => {
    let lock = null;
    const pedir = async () => { try { lock = await navigator.wakeLock?.request("screen"); } catch {} };
    pedir();
    const voltar = () => { if (document.visibilityState === "visible") pedir(); };
    document.addEventListener("visibilitychange", voltar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("visibilitychange", voltar);
      try { lock?.release(); } catch {}
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (!timer?.corre) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (!t || !t.corre) return t;
        if (t.resta <= 1) { bip(); return { ...t, resta: 0, corre: false, acabou: true }; }
        return { ...t, resta: t.resta - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer?.corre]);

  const passo = receita.passos[i];
  const min = minutosDoPasso(passo);
  const usados = doPasso(passo, ingredientes);

  function seguinte() {
    if (i < n - 1) setI(i + 1);
    else { setFim(true); evento("receita_cozinhada", { id: receita.id }); }
  }

  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 60, background: "var(--pj-surface)", paddingTop: "env(safe-area-inset-top)", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      role="dialog" aria-modal="true" aria-label={`A cozinhar: ${receita.nome}`}>
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-5" style={{ minHeight: 0 }}>
        <div className="flex gap-1.5 pt-4" aria-hidden="true">
          {receita.passos.map((_, k) => (
            <span key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: fim || k <= i ? "var(--pj-brand)" : "var(--pj-border)", transition: "background .2s" }} />
          ))}
        </div>
        <div className="flex items-center justify-between pt-3">
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--pj-text-muted)" }}>{receita.emoji} {receita.nome}</p>
          <button onClick={onFechar} aria-label="Sair do modo cozinhar" className="pj-tap flex items-center justify-center flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 14, background: "var(--pj-subtle)", border: 0 }}>
            <X size={18} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        {fim ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span style={{ fontSize: 64 }}>🎉</span>
            <p className="font-display mt-3" style={{ fontSize: 26, fontWeight: 600, color: "var(--pj-text)" }}>Bom apetite!</p>
            <p className="mt-2" style={{ fontSize: 14, color: "var(--pj-text-muted)", maxWidth: 280 }}>
              Que tal ficou? As estrelas ajudam a escolher os próximos planos.
            </p>
            <div className="mt-5"><Estrelas valor={estrelas} onChange={setEstrelas} tamanho={34} /></div>
            <button onClick={() => { if (estrelas) onAvaliar({ estrelas, feita: true }); onFechar(); }}
              className="pj-tap press mt-8 w-full flex items-center justify-center"
              style={{ minHeight: 52, borderRadius: 16, fontSize: 15, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0 }}>
              {estrelas ? "Guardar e fechar" : "Fechar"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pt-6" style={{ minHeight: 0 }}>
              <p className={ROT} style={{ color: "var(--pj-brand-ink)" }}>Passo {i + 1} de {n}</p>
              <p className="font-display mt-3" aria-live="polite" style={{ fontSize: 25, lineHeight: 1.35, fontWeight: 500, color: "var(--pj-text)" }}>{passo}</p>

              {usados.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {usados.map((u) => (
                    <span key={u.key} className="text-[13px] font-semibold" style={{ padding: "6px 12px", borderRadius: 12, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text-strong)" }}>
                      {emojiIngrediente(u.nome)} {u.nome} · {u.qtd}
                    </span>
                  ))}
                </div>
              )}

              {(min || (timer && timer.passo === i)) && (
                <div className="mt-6 rounded-2xl p-4" style={{ background: timer?.acabou && timer.passo === i ? "var(--pj-warn-wash)" : "var(--pj-brand-wash)" }}>
                  {timer && timer.passo === i ? (
                    <div className="flex items-center gap-3">
                      <span className="font-display tabular-nums" style={{ fontSize: 36, fontWeight: 600, color: timer.acabou ? "var(--pj-warn)" : "var(--pj-brand-ink)", flex: 1 }}>
                        {timer.acabou ? "Tempo!" : mmss(timer.resta)}
                      </span>
                      {!timer.acabou && (
                        <button onClick={() => setTimer((t) => ({ ...t, corre: !t.corre }))} aria-label={timer.corre ? "Pausar" : "Continuar"}
                          className="pj-tap flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--pj-brand)", border: 0 }}>
                          {timer.corre ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
                        </button>
                      )}
                      <button onClick={() => setTimer(null)} aria-label="Repor temporizador"
                        className="pj-tap flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                        <RotateCcw size={18} style={{ color: "var(--pj-text-muted)" }} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setTimer({ total: min * 60, resta: min * 60, corre: true, passo: i })}
                      className="pj-tap w-full flex items-center justify-center gap-2" style={{ minHeight: 44, background: "none", border: 0, fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                      <Timer size={18} /> Iniciar temporizador de {min} min
                    </button>
                  )}
                </div>
              )}
              {timer && timer.passo !== i && (
                <button onClick={() => setI(timer.passo)} className="pj-tap mt-4 text-[13px] font-semibold flex items-center gap-1.5"
                  style={{ background: "none", border: 0, color: timer.acabou ? "var(--pj-warn)" : "var(--pj-text-muted)" }}>
                  <Timer size={14} /> Passo {timer.passo + 1}: {timer.acabou ? "tempo!" : mmss(timer.resta)}
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Passo anterior"
                className="pj-tap press flex items-center justify-center" style={{ width: 60, minHeight: 56, borderRadius: 16, background: "var(--pj-subtle)", border: 0, opacity: i === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={22} style={{ color: "var(--pj-text-strong)" }} />
              </button>
              <button onClick={seguinte} className="pj-tap press flex-1 flex items-center justify-center gap-1.5"
                style={{ minHeight: 56, borderRadius: 16, fontSize: 16, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0 }}>
                {i < n - 1 ? <>Seguinte <ChevronRight size={20} /></> : <>Terminei <Check size={20} /></>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ─────────────── Detalhe ─────────────── */

export default function ReceitaDetalhe({ receita, pessoasIniciais = 4, dietasDaPessoa = [], onFechar, onAdicionar, onVerLista, legenda }) {
  const [pessoas, setPessoas] = useState(pessoasIniciais);
  const [adicionado, setAdicionado] = useState(0);
  const [cozinhar, setCozinhar] = useState(false);
  const [aval, setAval] = useState(() => lerAvaliacoes()[receita.id] || {});
  const [nota, setNota] = useState(aval.nota || "");
  // Esc fecha o que estiver por cima: o modo cozinhar, senão a receita.
  const fechar = useRef(onFechar);
  fechar.current = cozinhar ? () => setCozinhar(false) : onFechar;

  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") fechar.current(); };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = overflow; };
  }, []);

  const ingredientes = ingredientesPara(receita, pessoas);
  const aComprar = ingredientes.filter((i) => !i.despensa);
  const n = receita.nutricao;
  const rotulos = receita.ingredientes.filter((i) => i.rotulo).map((i) => i.nome);
  const pedeRotulo = rotulos.length > 0 && dietasDaPessoa.some((d) => d === "sem-gluten" || d === "sem-lactose");
  const dietas = DIETAS.filter((d) => receita.dietas.includes(d.id) && !(d.id === "pescetariano" && receita.veg) && !(d.id === "vegetariano" && receita.vegano));

  async function adicionar() {
    const novos = await onAdicionar(aComprar);
    setAdicionado(novos || -1);
    evento("ementa_lista", { id: receita.id });
  }

  function avaliar(dados) {
    setAval(guardarAvaliacao(receita.id, dados));
  }

  // O modo cozinhar fica FORA do fundo escuro: os cliques nos portais sobem
  // pela árvore do React, e um toque no "Seguinte" fechava a receita.
  return createPortal(
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.55)", backdropFilter: "blur(3px)" }} onClick={onFechar}>
      <div role="dialog" aria-modal="true" aria-label={receita.nome}
        className="w-full max-w-md rounded-t-3xl px-5 pt-5 no-scrollbar"
        style={{ maxHeight: "92vh", overflowY: "auto", background: "var(--pj-surface)", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 34, width: 60, height: 60, borderRadius: 18, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>{receita.emoji}</span>
            <div style={{ minWidth: 0 }}>
              {legenda && <p className={ROT} style={{ color: "var(--pj-brand-ink)" }}>{legenda}</p>}
              <p className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.2 }}>{receita.nome}</p>
              <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
                <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatarTempo(receita.tempoMin)}</span>
                <BadgeCusto custo={receita.custo} />
                {receita.airfryer && <span className="inline-flex items-center gap-1"><ChefHat size={11} /> air fryer</span>}
                {aval.estrelas ? <span className="inline-flex items-center gap-0.5"><Star size={11} fill="#e0a526" style={{ color: "#e0a526" }} /> {aval.estrelas}</span> : null}
              </p>
            </div>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="pj-tap flex items-center justify-center flex-shrink-0"
            style={{ width: 40, height: 40, borderRadius: 14, background: "var(--pj-subtle)", border: 0 }}>
            <X size={16} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-5">
          <button onClick={() => setCozinhar(true)} className="pj-tap press flex-1 flex items-center justify-center gap-2"
            style={{ minHeight: 50, borderRadius: 16, fontSize: 14.5, fontWeight: 600, background: "var(--pj-text)", color: "var(--pj-surface)", border: 0 }}>
            <ChefHat size={17} /> Cozinhar
          </button>
          {adicionado !== 0 ? (
            <button onClick={onVerLista} className="pj-tap press flex-1 flex items-center justify-center gap-1.5"
              style={{ minHeight: 50, borderRadius: 16, fontSize: 13.5, fontWeight: 600, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", border: 0 }}>
              <Check size={15} /> {adicionado === -1 ? "Já na lista" : `${adicionado} na lista`} · ver
            </button>
          ) : (
            <button onClick={adicionar} className="pj-tap press flex-1 flex items-center justify-center gap-2"
              style={{ minHeight: 50, borderRadius: 16, fontSize: 14, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0 }}>
              <ShoppingCart size={16} /> Lista de compras
            </button>
          )}
        </div>

        {/* Nutrição por pessoa */}
        <div className="mt-5 rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { v: n.kcal, u: "", l: "kcal", c: "var(--pj-text)" },
              { v: n.p, u: "g", l: "Proteína", c: "var(--pj-cat-ocre)" },
              { v: n.hc, u: "g", l: "Hidratos", c: "var(--pj-cat-verde)" },
              { v: n.g, u: "g", l: "Gordura", c: "var(--pj-cat-azul)" },
            ].map((x) => (
              <div key={x.l}>
                <p className="font-display tabular-nums" style={{ fontSize: 21, fontWeight: 600, color: x.c }}>{x.v}{x.u}</p>
                <p style={{ fontSize: 11, color: "var(--pj-text-muted)" }}>{x.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center" style={{ fontSize: 11, color: "var(--pj-text-faint)", lineHeight: 1.5 }}>
            Por pessoa · {String(n.fib).replace(".", ",")} g de fibra · valores aproximados, calculados a partir dos ingredientes
          </p>
        </div>

        {dietas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {dietas.map((d) => (
              <span key={d.id} className="text-[11.5px] font-semibold" style={{ padding: "4px 10px", borderRadius: 10, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
                {d.emoji} {d.nome}
              </span>
            ))}
          </div>
        )}
        {pedeRotulo && (
          <p className="flex gap-2 mt-3 rounded-xl p-3" style={{ fontSize: 12, lineHeight: 1.5, background: "var(--pj-warn-wash)", color: "var(--pj-warn)" }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Confirma no rótulo: {rotulos.join(", ").toLowerCase()} — a composição muda de marca para marca.</span>
          </p>
        )}

        {/* Ingredientes */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <p className={ROT} style={{ color: "var(--pj-text-faint)" }}>Ingredientes</p>
          <div className="flex items-center gap-1" role="group" aria-label="Pessoas">
            <button onClick={() => setPessoas(Math.max(1, pessoas - 1))} aria-label="Menos uma pessoa" className="pj-tap flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 11, background: "var(--pj-subtle)", border: 0 }}>
              <Minus size={14} style={{ color: "var(--pj-text-strong)" }} />
            </button>
            <span className="tabular-nums text-center" style={{ minWidth: 74, fontSize: 13, fontWeight: 600, color: "var(--pj-text)" }}>{pessoas} pessoa{pessoas > 1 ? "s" : ""}</span>
            <button onClick={() => setPessoas(Math.min(12, pessoas + 1))} aria-label="Mais uma pessoa" className="pj-tap flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 11, background: "var(--pj-subtle)", border: 0 }}>
              <Plus size={14} style={{ color: "var(--pj-text-strong)" }} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {ingredientes.map((ing, i) => (
            <div key={ing.key} className="flex items-center justify-between gap-3 px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ fontSize: 13.5, fontWeight: ing.despensa ? 500 : 600, color: ing.despensa ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                {emojiIngrediente(ing.nome)} {ing.nome}{ing.despensa ? " · da despensa" : ""}
              </span>
              <span className="flex-shrink-0 tabular-nums" style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>{ing.qtd}</span>
            </div>
          ))}
        </div>

        {/* Preparação */}
        <p className={`${ROT} mt-6 mb-2`} style={{ color: "var(--pj-text-faint)" }}>Preparação</p>
        <ol className="flex flex-col gap-2.5" style={{ paddingLeft: 0, listStyle: "none" }}>
          {receita.passos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center mt-0.5" style={{ background: "var(--pj-brand)" }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, color: "var(--pj-text-strong)", lineHeight: 1.55 }}>{p}</span>
            </li>
          ))}
        </ol>

        {/* Concluído? */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <p className="font-display" style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-text)" }}>Já fizeste?</p>
          <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>As estrelas ajudam a escolher os próximos planos.</p>
          <div className="mt-2"><Estrelas valor={aval.estrelas} onChange={(e) => avaliar({ estrelas: e, feita: true })} /></div>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} onBlur={() => nota !== (aval.nota || "") && avaliar({ nota: nota.slice(0, 300) })}
            placeholder="Nota para ti: menos sal, juntar chouriço…" rows={2} maxLength={300}
            className="w-full mt-3 outline-none" style={{ fontSize: 14, padding: "10px 12px", borderRadius: 12, background: "var(--pj-surface)", border: "1px solid var(--pj-border)", color: "var(--pj-text)", resize: "none" }} />
        </div>
      </div>
    </div>
    {cozinhar && (
      <ModoCozinhar receita={receita} ingredientes={ingredientes} onFechar={() => setCozinhar(false)} onAvaliar={avaliar} />
    )}
    </>,
    document.body
  );
}
