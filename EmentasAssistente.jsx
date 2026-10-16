import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X, Minus, Plus, Search, Check } from "lucide-react";
import {
  DIETAS, VONTADES, MAX_VONTADES, INGREDIENTES, PREFS_PADRAO,
  contarCompativeis, porRefeicao, faixaMaxima, emojiIngrediente,
} from "./lib/receitas/motor";
import { EVITAR_POPULARES } from "./lib/receitas/ingredientes";
import CozinhaInterativa from "./CozinhaInterativa";

/*
 * "Planeia a minha semana" — seis perguntas curtas, uma por ecrã, e o
 * plano sai no fim. Tudo opcional menos as pessoas e o orçamento; o
 * botão diz "Saltar" quando não se escolheu nada.
 *
 * As respostas ficam no dispositivo (não sincronizam: restrições
 * alimentares podem dizer algo sobre a saúde de quem as escolhe).
 */

const PASSOS = ["casa", "orcamento", "vontades", "dietas", "evitar", "cozinha"];

const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const euros = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: v < 10 ? 2 : 0, maximumFractionDigits: 2 });

function Titulo({ children, sub }) {
  return (
    <div className="mb-5">
      <h2 className="font-display" style={{ fontSize: 25, fontWeight: 600, lineHeight: 1.2, color: "var(--pj-text)", letterSpacing: "-0.01em" }}>{children}</h2>
      {sub && <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function Cartao({ ativo, onClick, emoji, titulo, desc, desativado }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo} disabled={desativado}
      className="pj-tap press text-left rounded-2xl p-3.5 flex flex-col gap-1.5 relative"
      style={{
        minHeight: 104, border: `1.5px solid ${ativo ? "var(--pj-brand)" : "var(--pj-border)"}`,
        background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)", opacity: desativado ? 0.45 : 1,
      }}>
      {ativo && (
        <span className="absolute flex items-center justify-center" style={{ top: 10, right: 10, width: 20, height: 20, borderRadius: 10, background: "var(--pj-brand)" }}>
          <Check size={12} color="#fff" strokeWidth={3} />
        </span>
      )}
      <span style={{ fontSize: 30, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</span>
      {desc && <span style={{ fontSize: 11.5, color: "var(--pj-text-muted)", lineHeight: 1.35 }}>{desc}</span>}
    </button>
  );
}

function Contador({ valor, min, max, onChange, rotulo }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={rotulo}>
      <button type="button" onClick={() => onChange(Math.max(min, valor - 1))} disabled={valor <= min} aria-label={`Menos — ${rotulo}`}
        className="pj-tap press flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 16, background: "var(--pj-subtle)", border: 0, opacity: valor <= min ? 0.4 : 1 }}>
        <Minus size={18} style={{ color: "var(--pj-text-strong)" }} />
      </button>
      <span className="font-display tabular-nums text-center" style={{ fontSize: 34, fontWeight: 600, minWidth: 44, color: "var(--pj-text)" }}>{valor}</span>
      <button type="button" onClick={() => onChange(Math.min(max, valor + 1))} disabled={valor >= max} aria-label={`Mais — ${rotulo}`}
        className="pj-tap press flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 16, background: "var(--pj-subtle)", border: 0, opacity: valor >= max ? 0.4 : 1 }}>
        <Plus size={18} style={{ color: "var(--pj-text-strong)" }} />
      </button>
    </div>
  );
}

function Extra({ ativo, onClick, emoji, titulo, desc }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={!!ativo}
      className="pj-tap press w-full text-left flex items-center gap-3 rounded-2xl p-4"
      style={{ border: `1.5px solid ${ativo ? "var(--pj-brand)" : "var(--pj-border)"}`, background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)" }}>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span className="flex-1">
        <span className="block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</span>
        <span className="block" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>{desc}</span>
      </span>
      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24, borderRadius: 8, background: ativo ? "var(--pj-brand)" : "var(--pj-subtle)" }}>
        {ativo && <Check size={14} color="#fff" strokeWidth={3} />}
      </span>
    </button>
  );
}

const alternar = (lista, id) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

export default function EmentasAssistente({ inicial, onFechar, onConcluir }) {
  const [p, setP] = useState(() => ({ ...PREFS_PADRAO, ...(inicial || {}) }));
  const [passo, setPasso] = useState(0);
  const [busca, setBusca] = useState("");
  const [aGerar, setAGerar] = useState(false);
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));

  const fechar = useRef(onFechar);
  fechar.current = onFechar;
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e) => { if (e.key === "Escape") fechar.current(); };
    document.addEventListener("keydown", tecla);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", tecla); };
  }, []);

  const id = PASSOS[passo];
  const compat = useMemo(() => contarCompativeis(p), [p]);
  const pessoa = porRefeicao(p);
  const faixa = faixaMaxima(p);

  const candidatosEvitar = useMemo(() => {
    const t = semAcento(busca.trim());
    const todos = Object.entries(INGREDIENTES).filter(([, i]) => !i.desp);
    if (!t) return EVITAR_POPULARES.map((k) => [k, INGREDIENTES[k]]);
    return todos.filter(([k, i]) => semAcento(i.nome).includes(t) || k.includes(t)).slice(0, 16);
  }, [busca]);

  function avancar() {
    if (passo < PASSOS.length - 1) { setPasso(passo + 1); return; }
    setAGerar(true);
    // Uma pausa curta: o plano sai em milissegundos, mas assim percebe-se que algo aconteceu.
    setTimeout(() => onConcluir(p), 900);
  }

  const vazio =
    (id === "vontades" && !p.vontades.length) ||
    (id === "dietas" && !p.dietas.length) ||
    (id === "evitar" && !p.evitar.length);
  const ultimo = passo === PASSOS.length - 1;
  const semPratos = ultimo && compat.pratos === 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--pj-surface)", paddingTop: "env(safe-area-inset-top)", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      role="dialog" aria-modal="true" aria-label="Planear a semana">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-5" style={{ minHeight: 0 }}>

        {aGerar ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="flex gap-2 text-[40px]" aria-hidden="true">
              {["🥕", "🍗", "🐟", "🫘"].map((e, k) => (
                <span key={k} style={{ animation: `pj-salto 0.9s ${k * 0.12}s ease-in-out infinite` }}>{e}</span>
              ))}
            </div>
            <p className="font-display mt-6" style={{ fontSize: 23, fontWeight: 600, color: "var(--pj-text)" }}>A escolher receitas para ti…</p>
            <p className="mt-2" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", maxWidth: 290, lineHeight: 1.5 }}>
              Entre {compat.pratos} pratos que servem à tua casa — sem repetir a proteína dois dias seguidos e a aproveitar ingredientes entre receitas.
            </p>
            <style>{`@keyframes pj-salto { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }`}</style>
          </div>
        ) : (
          <>
            {/* Barra de topo: voltar, progresso, fechar */}
            <div className="flex items-center gap-3 pt-3">
              <button onClick={() => (passo ? setPasso(passo - 1) : onFechar())} aria-label={passo ? "Voltar" : "Fechar"}
                className="pj-tap flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 14, background: "transparent", border: 0 }}>
                {passo ? <ArrowLeft size={20} style={{ color: "var(--pj-text-strong)" }} /> : <X size={20} style={{ color: "var(--pj-text-strong)" }} />}
              </button>
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "var(--pj-border)" }}
                role="progressbar" aria-valuemin={1} aria-valuemax={PASSOS.length} aria-valuenow={passo + 1} aria-label={`Pergunta ${passo + 1} de ${PASSOS.length}`}>
                <div style={{ height: "100%", width: `${((passo + 1) / PASSOS.length) * 100}%`, background: "var(--pj-brand)", borderRadius: 999, transition: "width .25s" }} />
              </div>
              <span className="tabular-nums flex-shrink-0" style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text-faint)", width: 30, textAlign: "right" }}>{passo + 1}/{PASSOS.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-4" style={{ minHeight: 0 }}>
              {id === "casa" && (
                <>
                  {inicial && (
                    <button type="button" onClick={() => setP({ ...PREFS_PADRAO })}
                      className="pj-tap mb-4 text-[12.5px] font-semibold" style={{ minHeight: 36, background: "none", border: 0, padding: 0, color: "var(--pj-brand-ink)" }}>
                      ↺ Limpar as escolhas anteriores
                    </button>
                  )}
                  <Titulo sub="Ajustamos as quantidades de cada receita.">Para quantas pessoas cozinhas?</Titulo>
                  <Contador valor={p.pessoas} min={1} max={8} onChange={(v) => set("pessoas", v)} rotulo="pessoas" />

                  <p className="font-display mt-9" style={{ fontSize: 18, fontWeight: 600, color: "var(--pj-text)" }}>Quantos jantares queres planear?</p>
                  <div className="flex gap-2 mt-3">
                    {[3, 4, 5, 6, 7].map((n) => (
                      <button key={n} type="button" onClick={() => set("jantares", n)} aria-pressed={p.jantares === n}
                        className="pj-tap press flex-1 font-display tabular-nums"
                        style={{ minHeight: 52, borderRadius: 14, fontSize: 18, fontWeight: 600,
                          border: `1.5px solid ${p.jantares === n ? "var(--pj-brand)" : "var(--pj-border)"}`,
                          background: p.jantares === n ? "var(--pj-brand-wash)" : "var(--pj-card)",
                          color: p.jantares === n ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8 }}>A começar à segunda-feira.</p>

                  <p className="font-display mt-9" style={{ fontSize: 18, fontWeight: 600, color: "var(--pj-text)" }}>Queres juntar mais alguma coisa?</p>
                  <div className="flex flex-col gap-2.5 mt-3">
                    <Extra ativo={p.sopa} onClick={() => set("sopa", !p.sopa)} emoji="🥣"
                      titulo="Uma sopa para a semana" desc="Uma panela que dá para todos os jantares — barata e enche." />
                    <Extra ativo={p.pequenoAlmoco} onClick={() => set("pequenoAlmoco", !p.pequenoAlmoco)} emoji="🥞"
                      titulo="Pequenos-almoços" desc="Três ideias para ir alternando durante a semana." />
                    <Extra ativo={p.sobremesa} onClick={() => set("sobremesa", !p.sobremesa)} emoji="🍮"
                      titulo="Uma sobremesa para o fim de semana" desc="Doçaria de casa: arroz-doce, bolo de laranja, pudim…" />
                  </div>
                </>
              )}

              {id === "orcamento" && (
                <>
                  <Titulo sub="Quanto queres gastar, no máximo, nas compras do plano.">Qual é o teu orçamento semanal?</Titulo>
                  <div className="text-center mt-8">
                    <p className="font-display tabular-nums" style={{ fontSize: 52, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1 }}>{p.orcamento} €</p>
                    <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 6 }}>esta semana</p>
                  </div>
                  <input type="range" min={10} max={150} step={5} value={p.orcamento} onChange={(e) => set("orcamento", Number(e.target.value))}
                    aria-label="Orçamento semanal em euros" className="w-full mt-8" style={{ accentColor: "var(--pj-brand)", height: 32 }} />
                  <div className="flex justify-between" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}><span>10 €</span><span>150 €</span></div>

                  <div className="mt-8 rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                    <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                      Dá cerca de <strong>{euros(pessoa)} €</strong> por pessoa, por jantar.
                    </p>
                    <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                      {faixa === 1 && "Vamos dar prioridade às receitas mais baratas (€): sopas, arroz, leguminosas, ovos e frango."}
                      {faixa === 2 && "Receitas € e €€ — já entra carne picada, bacalhau e peixe congelado."}
                      {faixa === 3 && "Há folga: entram também receitas €€€, como o salmão."}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
                      No fim comparamos a lista nos supermercados e vês o custo real.
                    </p>
                  </div>
                </>
              )}

              {id === "vontades" && (
                <>
                  <Titulo sub={`Escolhe até ${MAX_VONTADES}. Ou salta — há de tudo um pouco.`}>Do que estás com vontade?</Titulo>
                  <div className="grid grid-cols-2 gap-2.5">
                    {VONTADES.map((v) => {
                      const ativo = p.vontades.includes(v.id);
                      return (
                        <Cartao key={v.id} ativo={ativo} emoji={v.emoji} titulo={v.nome} desc={v.desc}
                          desativado={!ativo && p.vontades.length >= MAX_VONTADES}
                          onClick={() => set("vontades", alternar(p.vontades, v.id))} />
                      );
                    })}
                  </div>
                </>
              )}

              {id === "dietas" && (
                <>
                  <Titulo sub="Só entram receitas que cumprem todas as que escolheres.">Alguma restrição alimentar?</Titulo>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DIETAS.map((d) => (
                      <Cartao key={d.id} ativo={p.dietas.includes(d.id)} emoji={d.emoji} titulo={d.nome}
                        onClick={() => set("dietas", alternar(p.dietas, d.id))} />
                    ))}
                  </div>
                  {p.dietas.includes("sem-ovo-cru") && (
                    <p className="mt-4 rounded-xl p-3" style={{ fontSize: 12, lineHeight: 1.55, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
                      Ficam de fora a mousse tradicional, a baba de camelo e outras sobremesas com ovo cru — há versões sem ovo de quase todas.
                    </p>
                  )}
                  {(p.dietas.includes("sem-gluten") || p.dietas.includes("sem-lactose")) && (
                    <p className="mt-4 rounded-xl p-3" style={{ fontSize: 12, lineHeight: 1.55, background: "var(--pj-warn-wash)", color: "var(--pj-warn)" }}>
                      As receitas são escolhidas pelos ingredientes. Em processados (chouriço, salsichas, caril…) a composição muda de marca para marca — confirma sempre o rótulo, sobretudo em caso de doença celíaca ou alergia.
                    </p>
                  )}
                </>
              )}

              {id === "evitar" && (
                <>
                  <Titulo sub="Receitas com estes ingredientes ficam de fora.">Há algo que não comes?</Titulo>
                  <label className="flex items-center gap-2 px-3.5 rounded-2xl" style={{ minHeight: 48, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                    <Search size={16} style={{ color: "var(--pj-text-faint)" }} />
                    <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar ingrediente…" aria-label="Procurar ingrediente"
                      className="flex-1 outline-none" style={{ fontSize: 16, background: "transparent", border: 0, color: "var(--pj-text)" }} />
                  </label>

                  {p.evitar.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {p.evitar.map((k) => (
                        <button key={k} type="button" onClick={() => set("evitar", p.evitar.filter((x) => x !== k))}
                          className="pj-tap press flex items-center gap-1.5 text-[13px] font-semibold"
                          style={{ padding: "7px 12px", borderRadius: 12, background: "var(--pj-danger-wash)", color: "var(--pj-danger-strong)", border: "1px solid var(--pj-danger-border)" }}>
                          {INGREDIENTES[k]?.nome || k} <X size={13} />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] mt-5 mb-3" style={{ color: "var(--pj-text-faint)" }}>{busca ? "Resultados" : "Populares"}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {candidatosEvitar.map(([k, i]) => {
                      const ativo = p.evitar.includes(k);
                      return (
                        <button key={k} type="button" onClick={() => set("evitar", alternar(p.evitar, k))} aria-pressed={ativo}
                          className="pj-tap press flex flex-col items-center gap-1 rounded-2xl py-2.5 px-1"
                          style={{ border: `1.5px solid ${ativo ? "var(--pj-danger)" : "transparent"}`, background: ativo ? "var(--pj-danger-wash)" : "transparent" }}>
                          <span style={{ fontSize: 28, filter: ativo ? "grayscale(0.6)" : "none" }}>{emojiIngrediente(i.nome)}</span>
                          <span className="text-center" style={{ fontSize: 11, lineHeight: 1.25, color: ativo ? "var(--pj-danger-strong)" : "var(--pj-text-muted)", fontWeight: ativo ? 600 : 500 }}>{i.nome.replace(/ \(.*\)/, "")}</span>
                        </button>
                      );
                    })}
                  </div>
                  {busca && !candidatosEvitar.length && (
                    <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8 }}>Nenhuma receita usa “{busca}”.</p>
                  )}
                </>
              )}

              {id === "cozinha" && (
                <>
                  <Titulo sub="Liga os aparelhos que tens — só entram receitas que consegues fazer.">O que tens na cozinha?</Titulo>
                  <CozinhaInterativa prefs={p} onChange={(equip) => set("equip", equip)} />
                  {semPratos && (
                    <p className="mt-3" style={{ fontSize: 13, color: "var(--pj-danger)" }}>
                      Nenhum prato serve a esta combinação — liga mais um aparelho ou tira uma restrição.
                    </p>
                  )}
                </>
              )}
            </div>

            <button onClick={avancar} disabled={semPratos}
              className="pj-tap press w-full flex items-center justify-center"
              style={{ minHeight: 54, borderRadius: 18, fontSize: 15.5, fontWeight: 600, border: 0,
                background: semPratos ? "var(--pj-border)" : vazio ? "var(--pj-subtle)" : "var(--pj-text)",
                color: semPratos ? "var(--pj-text-faint)" : vazio ? "var(--pj-text-strong)" : "var(--pj-surface)" }}>
              {ultimo ? "Gerar o meu plano" : vazio ? "Saltar" : "Avançar"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
