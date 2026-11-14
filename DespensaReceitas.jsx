import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, ShoppingCart, X } from "lucide-react";
import { ingredientesParaTer, oQuePossoCozinhar, emojiIngrediente, formatarTempo } from "./lib/receitas/motor";

/*
 * "O que posso cozinhar?" — a pessoa diz o que tem em casa e vê as
 * receitas que o aproveitam, as que pedem menos compras primeiro. O que
 * falta entra na Lista de Compras num toque.
 *
 * O que se marca aqui é o mesmo "já tenho" das compras do plano (uma só
 * despensa, guardada no dispositivo por quem usa este componente).
 */

const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ATALHOS = 14;
const PRIMEIRAS = 6;

export default function DespensaReceitas({ tenho, onMudar, prefs, onAbrir, onAdicionar }) {
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState("");
  const [todas, setTodas] = useState(false);
  const [juntas, setJuntas] = useState({}); // id da receita → quantos artigos entraram na lista

  const opcoes = useMemo(() => ingredientesParaTer(), []);
  const marcados = new Set(tenho);
  const alternar = (key) => {
    onMudar(marcados.has(key) ? tenho.filter((k) => k !== key) : [...tenho, key]);
    setJuntas({});
  };

  const termo = semAcento(q.trim());
  const visiveis = termo
    ? opcoes.filter((o) => semAcento(o.nome).includes(termo)).slice(0, 24)
    : [...opcoes.filter((o) => marcados.has(o.key)), ...opcoes.filter((o) => !marcados.has(o.key)).slice(0, ATALHOS)];

  // Jantares e sopas: é a pergunta de quem abre o frigorífico ao fim do dia.
  const resultados = useMemo(() => oQuePossoCozinhar(tenho, { prefs, tipos: ["prato", "sopa"] }), [tenho, prefs]);
  const mostrados = todas ? resultados.slice(0, 30) : resultados.slice(0, PRIMEIRAS);

  async function juntar(x) {
    const n = await onAdicionar(x.falta);
    setJuntas((j) => ({ ...j, [x.r.id]: n || -1 }));
  }

  return (
    <div className="mx-4 mb-8 rounded-2xl" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <button onClick={() => setAberto(!aberto)} aria-expanded={aberto}
        className="pj-tap press w-full text-left flex items-center gap-3 p-4" style={{ background: "none", border: 0 }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 24, width: 48, height: 48, borderRadius: 14, background: "var(--pj-surface)" }}>🧺</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="block font-semibold" style={{ fontSize: 14.5, color: "var(--pj-text)" }}>O que posso cozinhar?</span>
          <span className="block" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.45, marginTop: 2 }}>
            {tenho.length
              ? `${tenho.length} ingrediente${tenho.length !== 1 ? "s" : ""} em casa · ${resultados.length} receita${resultados.length !== 1 ? "s" : ""} que os aproveitam`
              : "Diz o que tens em casa: usa o que há, compra só o que falta."}
          </span>
        </span>
        <ChevronDown size={18} style={{ color: "var(--pj-text-faint)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {aberto && (
        <div className="px-4 pb-4">
          <label className="flex items-center gap-2 px-3 rounded-xl" style={{ minHeight: 44, background: "var(--pj-surface)", border: "1px solid var(--pj-border)" }}>
            <Search size={15} style={{ color: "var(--pj-text-faint)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar ingrediente"
              aria-label="Procurar ingrediente que tens em casa"
              style={{ flex: 1, minWidth: 0, background: "none", border: 0, outline: "none", fontSize: 14, color: "var(--pj-text)" }} />
            {q && (
              <button onClick={() => setQ("")} aria-label="Limpar pesquisa" className="pj-tap flex items-center justify-center" style={{ width: 32, height: 32, background: "none", border: 0 }}>
                <X size={15} style={{ color: "var(--pj-text-faint)" }} />
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {visiveis.map((o) => {
              const sim = marcados.has(o.key);
              return (
                <button key={o.key} onClick={() => alternar(o.key)} aria-pressed={sim}
                  className="pj-tap press inline-flex items-center gap-1 text-[12.5px] font-semibold"
                  style={{ minHeight: 36, padding: "0 11px", borderRadius: 12, border: `1px solid ${sim ? "var(--pj-brand)" : "var(--pj-border)"}`, background: sim ? "var(--pj-brand-wash)" : "var(--pj-card)", color: sim ? "var(--pj-brand-ink)" : "var(--pj-text-strong)" }}>
                  {sim ? <Check size={12} /> : <span aria-hidden="true">{emojiIngrediente(o.nome)}</span>} {o.nome}
                </button>
              );
            })}
            {!visiveis.length && <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>Nenhum ingrediente das receitas com esse nome.</p>}
          </div>
          {!termo && (
            <p className="mt-2" style={{ fontSize: 11, color: "var(--pj-text-faint)", lineHeight: 1.5 }}>
              Azeite, sal, açúcar e outros básicos contam-se como havendo sempre.
              {tenho.length > 0 && (
                <> · <button onClick={() => { onMudar([]); setJuntas({}); }} className="font-semibold" style={{ background: "none", border: 0, padding: 0, color: "var(--pj-text-muted)", textDecoration: "underline" }}>Limpar tudo</button></>
              )}
            </p>
          )}

          {tenho.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {mostrados.map((x) => {
                const n = juntas[x.r.id];
                return (
                  <div key={x.r.id} className="rounded-xl flex items-center" style={{ border: "1px solid var(--pj-subtle)" }}>
                    <button onClick={() => onAbrir(x.r)} className="pj-tap press flex-1 text-left flex items-center gap-3 p-2.5" style={{ minWidth: 0, background: "none", border: 0 }}>
                      <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: "var(--pj-surface)" }}>{x.r.emoji}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="block truncate font-semibold" style={{ fontSize: 13.5, color: "var(--pj-text)" }}>{x.r.nome}</span>
                        <span className="block" style={{ fontSize: 11.5, lineHeight: 1.4, color: x.falta.length ? "var(--pj-text-muted)" : "var(--pj-brand-ink)", fontWeight: x.falta.length ? 400 : 600 }}>
                          {x.falta.length
                            ? `Falta: ${x.falta.slice(0, 3).map((i) => i.nome.toLowerCase()).join(", ")}${x.falta.length > 3 ? ` e mais ${x.falta.length - 3}` : ""}`
                            : "Tens tudo em casa"}
                          {" · "}{formatarTempo(x.r.tempoMin)}
                        </span>
                      </span>
                    </button>
                    {x.falta.length > 0 && (
                      <button onClick={() => juntar(x)} disabled={!!n}
                        aria-label={n ? "O que falta já está na lista" : `Juntar à lista o que falta para ${x.r.nome}`}
                        className="pj-tap press flex items-center justify-center flex-shrink-0 mr-1.5"
                        style={{ width: 40, height: 40, borderRadius: 12, border: 0, background: n ? "var(--pj-brand-wash)" : "var(--pj-subtle)" }}>
                        {n ? <Check size={16} style={{ color: "var(--pj-brand-ink)" }} /> : <ShoppingCart size={15} style={{ color: "var(--pj-text-strong)" }} />}
                      </button>
                    )}
                  </div>
                );
              })}
              {!resultados.length && (
                <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
                  Nenhuma receita {prefs ? "que sirva às tuas preferências " : ""}usa estes ingredientes. Marca mais alguns.
                </p>
              )}
              {!todas && resultados.length > PRIMEIRAS && (
                <button onClick={() => setTodas(true)} className="pj-tap text-[12.5px] font-semibold" style={{ minHeight: 40, background: "none", border: 0, color: "var(--pj-text-muted)" }}>
                  Ver mais {Math.min(30, resultados.length) - PRIMEIRAS} receitas
                </button>
              )}
              {resultados.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--pj-text-faint)", lineHeight: 1.5 }}>
                  <ShoppingCart size={10} className="inline -mt-0.5" /> junta à lista de compras só o que falta para essa receita.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
