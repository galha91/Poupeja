import { useState, useEffect, useRef } from "react";
import { Bookmark, BookmarkPlus, Check, ChevronLeft, ChevronRight, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { adicionar, agruparPorCategoria, alterarQty, retirar } from "./lib/listaCompras";
import { NOMES_SUGERIDOS, MAX_NOME, alterarArtigos, apagarLista, guardarLista, nArtigos, porNome, quando, renomearLista } from "./lib/listasGuardadas";
import { evento } from "./lib/analytics";

/*
 * As minhas listas: o conteúdo da folha com as listas guardadas.
 *
 * Duas vistas na mesma folha:
 *   - a lista de listas, com "Guardar a lista atual" no topo e "Usar" em
 *     cada uma (junta à lista de compras de um toque);
 *   - o detalhe de uma lista: os artigos (dá para tirar, juntar e mudar
 *     quantidades), juntar ou substituir a lista de compras, mudar o nome,
 *     atualizar com a lista atual e apagar.
 *
 * Quem guarda é o ecrã da lista (onMudar): aqui só se decide o quê.
 * Apagar e atualizar pedem confirmação no sítio, e apagar tem "Anular".
 */

const rotulo = { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" };
const campo = { height: 46, padding: "0 14px", borderRadius: 12, fontSize: 16, color: "var(--pj-text)", background: "var(--pj-surface)", border: "1px solid var(--pj-border)" };
const botaoPrincipal = (ativo = true) => ({ minHeight: 46, padding: "0 16px", borderRadius: 12, border: 0, fontSize: 14.5, fontWeight: 600, background: ativo ? "var(--pj-brand)" : "var(--pj-subtle)", color: ativo ? "#fff" : "var(--pj-text-faint)" });
const botaoSecundario = { minHeight: 46, padding: "0 16px", borderRadius: 12, fontSize: 14.5, fontWeight: 600, background: "transparent", border: "1px solid var(--pj-border)", color: "var(--pj-text)" };
const botaoTexto = (cor = "var(--pj-text-muted)") => ({ minHeight: 44, padding: "0 10px", background: "transparent", border: 0, fontSize: 14, fontWeight: 600, color: cor });

export default function ListasGuardadas({ listas, itens, inicio = null, onMudar, onUsar, carregarCatalogo }) {
  const [abertaId, setAbertaId] = useState(inicio?.detalhe || null);
  const [aviso, setAviso] = useState(null);    // { texto, anular? }
  const avisoTimer = useRef(null);
  const aberta = abertaId && listas.find(l => l.id === abertaId);

  useEffect(() => () => clearTimeout(avisoTimer.current), []);
  function avisar(texto, anular = null) {
    clearTimeout(avisoTimer.current);
    setAviso({ texto, anular });
    avisoTimer.current = setTimeout(() => setAviso(null), 5000);
  }

  return (
    <div style={{ padding: "4px 16px 20px" }}>
      {aberta ? (
        <Detalhe key={aberta.id} lista={aberta} listas={listas} itens={itens} onMudar={onMudar} onUsar={onUsar}
          carregarCatalogo={carregarCatalogo}
          onVoltar={() => setAbertaId(null)}
          onApagada={(antes) => {
            setAbertaId(null);
            avisar(`«${aberta.nome}» apagada`, () => onMudar(antes));
          }} />
      ) : (
        <Indice listas={listas} itens={itens} guardarLogo={inicio?.modo === "guardar"} onMudar={onMudar} onUsar={onUsar}
          onAbrir={setAbertaId} avisar={avisar} />
      )}

      {aviso && (
        <div role="status" className="sticky flex items-center justify-between"
          style={{ bottom: 12, marginTop: 16, gap: 8, padding: "4px 4px 4px 16px", minHeight: 48, borderRadius: 14, background: "var(--pj-text)", color: "var(--pj-surface)" }}>
          <span className="truncate" style={{ fontSize: 14 }}>{aviso.texto}</span>
          {aviso.anular && (
            <button onClick={() => { aviso.anular(); setAviso(null); }} className="pj-tap flex-none"
              style={{ minHeight: 44, padding: "0 14px", background: "transparent", border: 0, fontSize: 14, fontWeight: 700, color: "var(--pj-surface)" }}>
              Anular
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── A lista de listas ─────────────────────────────────────────── */
function Indice({ listas, itens, guardarLogo, onMudar, onUsar, onAbrir, avisar }) {
  const [aGuardar, setAGuardar] = useState(guardarLogo && itens.length > 0);
  const [nome, setNome] = useState("");
  const [nova, setNova] = useState(null);     // id da que acabou de ser guardada (realce)
  const inputRef = useRef(null);
  const existe = porNome(listas, nome);
  const sugeridos = NOMES_SUGERIDOS.filter(n => !porNome(listas, n));

  useEffect(() => { if (aGuardar) inputRef.current?.focus(); }, [aGuardar]);

  function guardar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    const novas = guardarLista(listas, nome, itens);
    onMudar(novas);
    evento("lista_guardada", { atualiza: !!existe, artigos: novas[0].itens.length });
    setNova(novas[0].id);
    setAGuardar(false);
    setNome("");
    avisar(existe ? `«${novas[0].nome}» atualizada` : `«${novas[0].nome}» guardada`);
  }

  return (
    <>
      {/* Guardar a lista atual */}
      {itens.length > 0 && (aGuardar ? (
        <form onSubmit={guardar} style={{ marginTop: 10, padding: 14, borderRadius: 16, background: "var(--pj-brand-wash)" }}>
          <label htmlFor="pj-lista-guardar" style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>
            Guardar a lista atual
          </label>
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2, marginBottom: 10 }}>
            {nArtigos(itens.length)}. Dá-lhe um nome para a encontrares depois.
          </p>
          <input id="pj-lista-guardar" ref={inputRef} value={nome} onChange={e => setNome(e.target.value)} maxLength={MAX_NOME}
            onKeyDown={e => e.key === "Escape" && (e.stopPropagation(), setAGuardar(false))}
            placeholder="Ex.: Semanal" autoComplete="off" enterKeyHint="done" className="w-full focus:outline-none" style={{ ...campo, background: "var(--pj-card)" }} />
          {existe ? (
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8, lineHeight: 1.45 }}>
              Já tens uma lista «{existe.nome}». Ao guardar, fica com os artigos da lista atual.
            </p>
          ) : !nome.trim() && sugeridos.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 10 }}>
              {sugeridos.map(n => (
                <button key={n} type="button" onClick={() => { setNome(n); inputRef.current?.focus(); }} className="pj-tap"
                  style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text-muted)" }}>
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end" style={{ gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => { setAGuardar(false); setNome(""); }} className="pj-tap" style={botaoTexto()}>Cancelar</button>
            <button type="submit" disabled={!nome.trim()} className="pj-tap" style={botaoPrincipal(!!nome.trim())}>
              {existe ? "Substituir" : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAGuardar(true)} className="pj-tap w-full flex items-center text-left"
          style={{ marginTop: 10, gap: 12, minHeight: 60, padding: "10px 14px", borderRadius: 16, border: "1.5px dashed var(--pj-border)", background: "transparent" }}>
          <span aria-hidden className="flex items-center justify-center flex-none" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
            <BookmarkPlus size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Guardar a lista atual</span>
            <span style={{ display: "block", fontSize: 13, color: "var(--pj-text-muted)", marginTop: 1 }}>{nArtigos(itens.length)}</span>
          </span>
          <Plus size={18} aria-hidden className="flex-none" style={{ color: "var(--pj-brand-ink)" }} />
        </button>
      ))}

      {/* As listas */}
      {listas.length > 0 ? (
        <>
          <h3 style={{ ...rotulo, padding: "22px 2px 8px" }}>
            {listas.length === 1 ? "1 lista guardada" : `${listas.length} listas guardadas`}
          </h3>
          <ul className="flex flex-col" style={{ gap: 10 }}>
            {listas.map(l => (
              <li key={l.id} className="flex items-stretch" style={{ listStyle: "none", borderRadius: 16, background: "var(--pj-card)", border: `1px solid ${l.id === nova ? "var(--pj-brand-ink)" : "var(--pj-border)"}`, transition: "border-color .4s ease" }}>
                <button onClick={() => onAbrir(l.id)} className="pj-tap flex-1 min-w-0 text-left" aria-label={`Abrir a lista ${l.nome}, ${nArtigos(l.itens.length)}`}
                  style={{ padding: "12px 4px 12px 14px", background: "transparent", border: 0 }}>
                  <span className="flex items-center" style={{ gap: 4 }}>
                    <span className="truncate" style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</span>
                    <ChevronRight size={16} aria-hidden className="flex-none" style={{ color: "var(--pj-text-faint)" }} />
                  </span>
                  <span className="truncate" style={{ display: "block", fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>
                    {nArtigos(l.itens.length)} · {quando(l)}
                  </span>
                  {l.itens.length > 0 && (
                    <span className="truncate" style={{ display: "block", fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 2 }}>
                      {l.itens.slice(0, 4).map(a => a.nome).join(", ")}{l.itens.length > 4 ? "…" : ""}
                    </span>
                  )}
                </button>
                <div className="flex items-center flex-none" style={{ padding: "0 10px 0 4px" }}>
                  <button onClick={() => onUsar(l, "juntar")} disabled={!l.itens.length} aria-label={`Usar a lista ${l.nome}`} className="pj-tap"
                    style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: 0, fontSize: 14, fontWeight: 600, background: l.itens.length ? "var(--pj-brand-wash)" : "var(--pj-subtle)", color: l.itens.length ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
                    Usar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 12, lineHeight: 1.45, padding: "0 2px" }}>
            «Usar» junta os artigos à lista de compras, sem apagar o que lá está. Abre uma lista para a editar ou substituir a lista atual.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center text-center" style={{ padding: "32px 12px 8px" }}>
          <span aria-hidden className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 18, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
            <Bookmark size={26} />
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-text)", marginTop: 14 }}>Ainda não tens listas guardadas</h3>
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.5, marginTop: 6, maxWidth: 300 }}>
            {itens.length
              ? "Guarda a lista da semana, a do mês ou outra que repitas. Da próxima vez, voltas a usá-la de um toque."
              : "Junta artigos à lista de compras e guarda-a aqui: a semanal, a mensal, a do churrasco… Da próxima vez, é um toque."}
          </p>
        </div>
      )}
    </>
  );
}

/* ── O detalhe de uma lista ────────────────────────────────────── */
function Detalhe({ lista, listas, itens, onMudar, onUsar, onVoltar, onApagada, carregarCatalogo }) {
  const [renomear, setRenomear] = useState(false);
  const [nome, setNome] = useState(lista.nome);
  const [confirmar, setConfirmar] = useState(null);   // "apagar" | "atualizar"
  const [texto, setTexto] = useState("");
  const voltarRef = useRef(null);
  const nomeRef = useRef(null);

  // Os artigos da lista guardada, com um id só para desenhar (não se guarda).
  const artigos = lista.itens.map((a, i) => ({ ...a, id: i, feito: false }));
  const grupos = agruparPorCategoria(artigos);
  const outra = porNome(listas, nome);
  const nomeInvalido = !nome.trim() || (outra && outra.id !== lista.id);

  useEffect(() => { voltarRef.current?.focus(); }, []);
  useEffect(() => { if (renomear) nomeRef.current?.select(); }, [renomear]);

  const mudarArtigos = (novos) => onMudar(alterarArtigos(listas, lista.id, novos));

  function guardarNome(e) {
    e.preventDefault();
    if (nomeInvalido) return;
    onMudar(renomearLista(listas, lista.id, nome));
    setRenomear(false);
  }

  async function juntarArtigo(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    const doCatalogo = (await carregarCatalogo())?.doCatalogo;
    mudarArtigos(adicionar(artigos, texto, { id: artigos.length, doCatalogo }));
    setTexto("");
  }

  return (
    <>
      <button ref={voltarRef} onClick={onVoltar} className="pj-tap flex items-center" style={{ ...botaoTexto(), gap: 4, marginLeft: -10, marginTop: 4 }}>
        <ChevronLeft size={18} /> Todas as listas
      </button>

      {/* Nome */}
      {renomear ? (
        <form onSubmit={guardarNome} style={{ marginTop: 6 }}>
          <label htmlFor="pj-lista-nome" className="sr-only">Nome da lista</label>
          <div className="flex items-center" style={{ gap: 8 }}>
            <input id="pj-lista-nome" ref={nomeRef} value={nome} onChange={e => setNome(e.target.value)} maxLength={MAX_NOME}
              onKeyDown={e => e.key === "Escape" && (e.stopPropagation(), setRenomear(false), setNome(lista.nome))}
              autoComplete="off" enterKeyHint="done" className="flex-1 min-w-0 focus:outline-none" style={campo} />
            <button type="submit" disabled={nomeInvalido} className="pj-tap flex-none" style={botaoPrincipal(!nomeInvalido)}>Guardar</button>
          </div>
          {outra && outra.id !== lista.id && (
            <p role="alert" style={{ fontSize: 13, color: "var(--pj-danger)", marginTop: 6 }}>Já tens uma lista com este nome.</p>
          )}
        </form>
      ) : (
        <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
          <h3 className="truncate" style={{ fontSize: 22, fontWeight: 700, color: "var(--pj-text)", letterSpacing: "-0.01em" }}>{lista.nome}</h3>
          <button onClick={() => setRenomear(true)} aria-label="Mudar o nome" className="pj-tap flex items-center justify-center flex-none"
            style={{ width: 40, height: 40, background: "transparent", border: 0, color: "var(--pj-text-faint)" }}>
            <Pencil size={16} />
          </button>
        </div>
      )}
      <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{nArtigos(lista.itens.length)} · {quando(lista)}</p>

      {/* Usar */}
      <div className="flex flex-col" style={{ gap: 8, marginTop: 16 }}>
        <button onClick={() => onUsar(lista, "juntar")} disabled={!lista.itens.length} className="pj-tap w-full flex items-center justify-center" style={{ ...botaoPrincipal(lista.itens.length > 0), gap: 8, minHeight: 50, borderRadius: 14 }}>
          <Plus size={18} aria-hidden /> Juntar à lista de compras
        </button>
        {itens.length > 0 && lista.itens.length > 0 && (
          <button onClick={() => onUsar(lista, "substituir")} className="pj-tap w-full" style={{ ...botaoSecundario, minHeight: 50, borderRadius: 14 }}>
            Substituir a lista atual ({nArtigos(itens.length)})
          </button>
        )}
      </div>

      {/* Artigos */}
      <h4 style={{ ...rotulo, padding: "24px 2px 8px" }}>Artigos</h4>
      <form onSubmit={juntarArtigo} className="flex items-center" style={{ gap: 8 }}>
        <label htmlFor="pj-lista-guardada-artigo" className="sr-only">Juntar artigo a esta lista</label>
        <input id="pj-lista-guardada-artigo" value={texto} onChange={e => { setTexto(e.target.value); carregarCatalogo(); }}
          placeholder="Juntar artigo a esta lista…" autoComplete="off" enterKeyHint="done" className="flex-1 min-w-0 focus:outline-none" style={campo} />
        <button type="submit" disabled={!texto.trim()} aria-label="Juntar artigo" className="pj-tap flex items-center justify-center flex-none"
          style={{ ...botaoPrincipal(!!texto.trim()), width: 46, padding: 0 }}>
          <Plus size={18} />
        </button>
      </form>

      {!artigos.length && (
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", marginTop: 12 }}>Esta lista ainda não tem artigos.</p>
      )}
      {grupos.map(g => (
        <section key={g.categoria || "todos"} style={{ marginTop: 10 }} aria-label={g.categoria || "Artigos"}>
          {g.categoria && <h5 style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-faint)", padding: "6px 2px 0" }}>{g.categoria}</h5>}
          <ul>
            {g.itens.map((a, i) => {
              const qty = a.qty || 1;
              return (
                <li key={a.id} className="flex items-center" style={{ listStyle: "none", minHeight: 50, gap: 4, borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 15.5, color: "var(--pj-text)", paddingLeft: 2 }}>{a.nome}</span>
                  <div className="flex items-center flex-none" style={{ gap: 2 }}>
                    <button onClick={() => mudarArtigos(alterarQty(artigos, a.id, -1))} disabled={qty <= 1} aria-label={`Menos ${a.nome}`} className="pj-tap flex items-center justify-center"
                      style={{ width: 36, height: 36, borderRadius: 10, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text)", opacity: qty <= 1 ? 0.4 : 1 }}>
                      <Minus size={14} />
                    </button>
                    <span className="pj-num text-center" aria-label={`Quantidade: ${qty}`} style={{ minWidth: 30, fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{qty}</span>
                    <button onClick={() => mudarArtigos(alterarQty(artigos, a.id, 1))} aria-label={`Mais ${a.nome}`} className="pj-tap flex items-center justify-center"
                      style={{ width: 36, height: 36, borderRadius: 10, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text)" }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => mudarArtigos(retirar(artigos, [a.id]).itens)} aria-label={`Tirar ${a.nome} desta lista`} className="pj-tap flex items-center justify-center flex-none"
                    style={{ width: 44, height: 44, marginRight: -10, background: "transparent", border: 0, color: "var(--pj-text-faint)" }}>
                    <X size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Gerir */}
      <div style={{ marginTop: 24, paddingTop: 8, borderTop: "1px solid var(--pj-border)" }}>
        {confirmar ? (
          <div role="alertdialog" aria-label={confirmar === "apagar" ? "Apagar a lista" : "Atualizar a lista"} style={{ marginTop: 8, padding: 14, borderRadius: 14, background: confirmar === "apagar" ? "var(--pj-danger-wash)" : "var(--pj-brand-wash)" }}>
            <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.45 }}>
              {confirmar === "apagar"
                ? <>Apagar a lista «{lista.nome}»? A lista de compras não muda.</>
                : <>Trocar os {nArtigos(lista.itens.length)} de «{lista.nome}» pelos {nArtigos(itens.length)} da lista de compras atual?</>}
            </p>
            <div className="flex justify-end" style={{ gap: 8, marginTop: 10 }}>
              <button onClick={() => setConfirmar(null)} className="pj-tap" style={botaoTexto()}>Cancelar</button>
              {confirmar === "apagar" ? (
                <button onClick={() => { const antes = listas; onMudar(apagarLista(listas, lista.id)); onApagada(antes); }} className="pj-tap"
                  style={{ ...botaoPrincipal(), background: "var(--pj-danger)" }}>
                  Apagar
                </button>
              ) : (
                <button onClick={() => { mudarArtigos(itens); setConfirmar(null); evento("lista_guardada", { atualiza: true, artigos: itens.length }); }} className="pj-tap" style={botaoPrincipal()}>
                  Atualizar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {itens.length > 0 && (
              <button onClick={() => setConfirmar("atualizar")} className="pj-tap flex items-center" style={{ ...botaoTexto("var(--pj-text)"), gap: 12, minHeight: 48, padding: "0 2px" }}>
                <Check size={18} aria-hidden style={{ color: "var(--pj-text-muted)" }} /> Atualizar com a lista de compras atual
              </button>
            )}
            <button onClick={() => setConfirmar("apagar")} className="pj-tap flex items-center" style={{ ...botaoTexto("var(--pj-danger)"), gap: 12, minHeight: 48, padding: "0 2px" }}>
              <Trash2 size={18} aria-hidden /> Apagar lista
            </button>
          </div>
        )}
      </div>
    </>
  );
}
