import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ExternalLink, Plus, Check, RefreshCw, Store, ChevronDown, Info } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";

/*
 * "Onde está mais barato?" — escreve-se o artigo, a app pergunta aos
 * supermercados e mostra o mais barato por kg / L / unidade.
 *
 * A comparação é SEMPRE pelo preço por unidade: 3 kg a 2,97 € ganha a
 * 1 kg a 1,49 €, e é isso que interessa a quem vai comprar.
 */

const LS_RECENTES = "poupeja_pesquisas_precos";
const LS_LISTA = "poupeja_lista_compras";
const SUGESTOES = ["laranjas", "leite meio gordo", "ovos", "arroz agulha", "azeite", "bananas", "frango", "café moído"];
const UNIDADE = { kg: "kg", l: "L", un: "un" };

const normalizar = (q) => String(q || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);

function lerRecentes() {
  try { return JSON.parse(localStorage.getItem(LS_RECENTES) || "[]"); } catch { return []; }
}
function guardarRecente(q) {
  try {
    const l = [q, ...lerRecentes().filter((x) => x !== q)].slice(0, 6);
    localStorage.setItem(LS_RECENTES, JSON.stringify(l));
    return l;
  } catch { return []; }
}

/* A lista de compras vive no localStorage (ver SecaoListaCompras). */
function juntarALista(nome) {
  try {
    const itens = JSON.parse(localStorage.getItem(LS_LISTA) || "[]");
    const existe = itens.find((i) => i.nome.toLowerCase() === nome.toLowerCase() && !i.feito);
    const novos = existe
      ? itens.map((i) => (i === existe ? { ...i, qty: (i.qty || 1) + 1 } : i))
      : [{ id: Date.now() + Math.random(), nome, emoji: "🛒", categoria: "", qty: 1, feito: false }, ...itens];
    localStorage.setItem(LS_LISTA, JSON.stringify(novos));
    return true;
  } catch { return false; }
}

function porUnidade(p) {
  return `${eur(p.precoUnidade, 2)} €/${UNIDADE[p.unidade] || p.unidade}`;
}

function descontoPct(p) {
  if (!p.precoAntigo || p.precoAntigo <= p.preco) return null;
  return Math.round((1 - p.preco / p.precoAntigo) * 100);
}

function tempoDesde(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return `há ${h} h`;
}

/* ── Peças ── */

/* A foto vem do site da loja; se não carregar, fica o logótipo da loja. */
function Foto({ p, size, radius }) {
  const [falhou, setFalhou] = useState(false);
  if (!p.imagem || falhou) return <LogoLoja loja={p.lojaNome} size={size} radius={radius} />;
  return (
    <img src={p.imagem} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)}
      style={{ width: size, height: size, objectFit: "contain", borderRadius: radius, background: "#fff", flexShrink: 0 }} />
  );
}

function Etiqueta({ children, tom = "brand" }) {
  const cores = {
    brand: { bg: "var(--pj-brand-wash)", fg: "var(--pj-brand-ink)" },
    promo: { bg: "var(--pj-danger-wash)", fg: "var(--pj-danger-strong)" },
    loja: { bg: "var(--pj-warn-wash)", fg: "var(--pj-warn)" },
  }[tom];
  return (
    <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: cores.bg, color: cores.fg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Vencedor({ p, segundo, onLista, naLista }) {
  const poupanca = segundo && segundo.unidade === p.unidade && segundo.precoUnidade > p.precoUnidade
    ? Math.round((1 - p.precoUnidade / segundo.precoUnidade) * 100)
    : null;
  const desc = descontoPct(p);
  return (
    <div className="anim-up" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ background: "var(--pj-brand)", color: "#fff", padding: "8px 16px", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>
        Mais barato hoje · {p.lojaNome}
      </div>
      <div style={{ padding: 16 }}>
        <div className="flex items-start gap-3">
          <Foto p={p} size={72} radius={12} />
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.3 }}>{p.nome}</p>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 3 }}>
              {[p.marca, p.quantidade].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {desc ? <Etiqueta tom="promo">−{desc}%</Etiqueta> : null}
              {p.promo ? <Etiqueta tom="promo">{p.promo}</Etiqueta> : null}
              {p.onde === "loja" ? <Etiqueta tom="loja">Na loja{p.periodo ? ` · ${p.periodo}` : ""}</Etiqueta> : null}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mt-4 gap-3">
          <div>
            <Preco valor={p.precoUnidade} casas={2} tamanho={34} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", marginLeft: 4 }}>/{UNIDADE[p.unidade]}</span>
            <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 4 }}>
              {p.precoUnidade !== p.preco ? `${eur(p.preco, 2)} €${p.quantidade ? ` · ${p.quantidade}` : ""}` : p.unidade === "kg" ? "Vendido ao peso" : p.quantidade}
            </p>
          </div>
          {poupanca >= 3 && (
            <p className="text-right" style={{ fontSize: 12.5, color: "var(--pj-brand-ink)", fontWeight: 600, lineHeight: 1.35 }}>
              {poupanca}% mais barato<br />que no {segundo.lojaNome}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => evento("comparar_abrir_loja", { loja: p.loja })}
              className="pj-tap press flex-1 no-underline flex items-center justify-center gap-1.5"
              style={{ background: "var(--pj-brand)", color: "#fff", fontSize: 13.5, fontWeight: 600, padding: "11px 0", borderRadius: 12 }}>
              Ver no {p.lojaNome} <ExternalLink size={14} />
            </a>
          )}
          <button onClick={onLista} disabled={naLista} className="pj-tap press flex items-center justify-center gap-1.5"
            style={{ background: "var(--pj-subtle)", color: "var(--pj-text)", fontSize: 13.5, fontWeight: 600, padding: "11px 14px", borderRadius: 12, border: 0 }}>
            {naLista ? <><Check size={14} /> Na lista</> : <><Plus size={14} /> Lista</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Uma linha por supermercado: o melhor que cada um tem. É a resposta
   directa a "em que loja compro isto?". */
function PorLoja({ lojas, melhores, unidade, min }) {
  return (
    <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
      {lojas.map((l, i) => {
        const p = melhores[l.id];
        const diff = p && min != null ? Math.round((p.precoUnidade - min) * 100) : 0;
        return (
          <a key={l.id} href={p?.url || undefined} target="_blank" rel="noopener noreferrer"
            className="pj-tap no-underline flex items-center gap-3"
            style={{ padding: "11px 14px", borderTop: i ? "1px solid var(--pj-subtle)" : "none", pointerEvents: p?.url ? "auto" : "none",
              background: p && diff === 0 ? "var(--pj-brand-wash)" : "transparent",
              borderLeft: `3px solid ${p && diff === 0 ? "var(--pj-brand)" : "transparent"}` }}>
            <LogoLoja loja={l.nome} size={34} radius={9} />
            <span className="min-w-0 flex-1">
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>
                {l.nome}{l.id === "lidl" && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--pj-text-faint)" }}> · só promoções em loja</span>}
              </span>
              <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {!l.ok ? "Não respondeu agora" : p ? [p.nome, p.quantidade].filter(Boolean).join(" · ") : "Não tem este artigo"}
              </span>
            </span>
            {p ? (
              <span className="text-right flex-none">
                <Preco valor={p.precoUnidade} casas={2} tamanho={18} cor={diff === 0 ? "var(--pj-brand-ink)" : "var(--pj-text)"} />
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: diff === 0 ? "var(--pj-brand)" : "var(--pj-text-faint)", marginTop: 2 }}>
                  {diff === 0 ? "o mais barato" : `+${eur(diff / 100, 2)} €/${UNIDADE[unidade]}`}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: 13, color: "var(--pj-text-faint)" }}>—</span>
            )}
          </a>
        );
      })}
    </div>
  );
}

function LinhaProduto({ p, primeira }) {
  const desc = descontoPct(p);
  return (
    <a href={p.url || undefined} target="_blank" rel="noopener noreferrer"
      className="pj-tap no-underline flex items-center gap-3"
      style={{ padding: "10px 14px", borderTop: primeira ? "none" : "1px solid var(--pj-subtle)" }}>
      <Foto p={p} size={44} radius={8} />
      <span className="min-w-0 flex-1">
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {p.nome}
        </span>
        <span className="flex flex-wrap items-center gap-1.5" style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 3 }}>
          <strong style={{ color: "var(--pj-text-muted)", fontWeight: 600 }}>{p.lojaNome}</strong>
          {[p.marca, p.quantidade].filter(Boolean).map((t) => <span key={t}>· {t}</span>)}
          {desc ? <Etiqueta tom="promo">−{desc}%</Etiqueta> : null}
          {p.onde === "loja" ? <Etiqueta tom="loja">Na loja</Etiqueta> : null}
        </span>
      </span>
      <span className="text-right flex-none">
        <span className="pj-num" style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--pj-text)" }}>{porUnidade(p)}</span>
        <span className="pj-num" style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 2 }}>{eur(p.preco, 2)} €</span>
      </span>
    </a>
  );
}

function Esqueleto() {
  return (
    <div className="px-4 mt-4 flex flex-col gap-3 animate-pulse">
      <div style={{ height: 230, borderRadius: 20, background: "var(--pj-subtle)" }} />
      <div style={{ height: 180, borderRadius: 18, background: "var(--pj-subtle)" }} />
    </div>
  );
}

/* ── Ecrã ── */

export default function SecaoComparar() {
  const [texto, setTexto] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [dados, setDados] = useState(null);
  const [estado, setEstado] = useState("inicio"); // inicio | a-carregar | pronto | erro
  const [erro, setErro] = useState("");
  const [recentes, setRecentes] = useState([]);
  const [filtro, setFiltro] = useState(null); // id da loja ou null
  const [verOutros, setVerOutros] = useState(false);
  const [naLista, setNaLista] = useState(false);
  const pedido = useRef(0);

  useEffect(() => { setRecentes(lerRecentes()); }, []);

  async function procurar(termo) {
    const q = normalizar(termo);
    if (q.length < 2) return;
    setTexto(q);
    setPesquisa(q);
    setEstado("a-carregar");
    setErro("");
    setFiltro(null);
    setVerOutros(false);
    setNaLista(false);
    const n = ++pedido.current;
    evento("comparar_pesquisa", { q });
    try {
      const r = await fetch(`/api/precos-supermercado?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (n !== pedido.current) return; // chegou uma pesquisa mais recente
      if (!r.ok && !j.produtos) throw new Error(j.erro || "Não foi possível pesquisar agora.");
      setDados(j);
      setEstado("pronto");
      setRecentes(guardarRecente(q));
    } catch (e) {
      if (n !== pedido.current) return;
      setErro(e.message || "Não foi possível pesquisar agora.");
      setEstado("erro");
    }
  }

  const vista = useMemo(() => {
    if (!dados) return null;
    const principais = dados.produtos.filter((p) => p.relevancia === 2);
    const base = principais.length ? principais : dados.produtos;
    const unidade = base[0]?.unidade;
    const comparaveis = base.filter((p) => p.unidade === unidade);
    const melhores = {};
    for (const p of comparaveis) if (!melhores[p.loja]) melhores[p.loja] = p;
    const ranking = Object.values(melhores).sort((a, b) => a.precoUnidade - b.precoUnidade);
    const lista = filtro ? dados.produtos.filter((p) => p.loja === filtro) : dados.produtos;
    return {
      vencedor: ranking[0] || null,
      segundo: ranking.find((p) => p.loja !== ranking[0]?.loja) || null,
      melhores,
      unidade,
      min: ranking[0]?.precoUnidade ?? null,
      principais: lista.filter((p) => (principais.length ? p.relevancia === 2 : true)),
      outros: principais.length ? lista.filter((p) => p.relevancia !== 2) : [],
    };
  }, [dados, filtro]);

  return (
    <div className="pb-6" style={{ background: "var(--pj-surface)" }}>
      {/* Cabeçalho + pesquisa */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid var(--pj-border)" }}>
        <p className="flex items-center gap-1.5 mb-2" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
          <Store size={11} style={{ color: "var(--pj-brand-ink)" }} /> Comparar preços
        </p>
        <h2 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          Onde está mais barato?
        </h2>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4 }}>
          Escreve um produto e comparamos o preço por kg, litro ou unidade.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); procurar(texto); }} className="mt-4 flex gap-2">
          <label className="flex-1 flex items-center gap-2" style={{ minWidth: 0, background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 14, padding: "0 12px" }}>
            <Search size={17} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: laranjas, leite, azeite…"
              enterKeyHint="search"
              autoComplete="off"
              aria-label="Produto a comparar"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: "none", fontSize: 16, padding: "12px 0", color: "var(--pj-text)" }}
            />
          </label>
          <button type="submit" disabled={normalizar(texto).length < 2 || estado === "a-carregar"} className="pj-tap press"
            style={{ flexShrink: 0, background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 14, padding: "0 16px", fontSize: 14, fontWeight: 600, opacity: normalizar(texto).length < 2 ? 0.5 : 1 }}>
            Comparar
          </button>
        </form>

        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar" style={{ marginRight: -16, paddingRight: 16 }}>
          {(recentes.length ? recentes : SUGESTOES).map((s) => (
            <button key={s} onClick={() => procurar(s)} className="pj-tap press flex-none"
              style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--pj-border)",
                background: s === pesquisa ? "var(--pj-brand-wash)" : "var(--pj-card)", color: s === pesquisa ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {estado === "inicio" && (
        <div className="px-4 mt-5">
          <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Onde vamos procurar</p>
            <div className="flex items-center gap-2 mt-3">
              {["Continente", "Pingo Doce", "Auchan", "Lidl"].map((l) => <LogoLoja key={l} loja={l} size={40} radius={10} />)}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 12, lineHeight: 1.55 }}>
              Preços das lojas online do Continente, Pingo Doce e Auchan, e as promoções da semana nas lojas Lidl.
            </p>
          </div>
        </div>
      )}

      {estado === "a-carregar" && (
        <>
          <p className="px-4 mt-4" style={{ fontSize: 12.5, color: "var(--pj-text-faint)" }}>A ver os preços de «{pesquisa}» em 4 supermercados…</p>
          <Esqueleto />
        </>
      )}

      {estado === "erro" && (
        <div className="px-4 mt-5">
          <div style={{ background: "var(--pj-danger-wash)", border: "1px solid var(--pj-danger-border)", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-danger-strong)" }}>{erro}</p>
            <button onClick={() => procurar(pesquisa)} className="pj-tap press mt-3 flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-danger-strong)", background: "transparent", border: 0, padding: 0 }}>
              <RefreshCw size={14} /> Tentar outra vez
            </button>
          </div>
        </div>
      )}

      {estado === "pronto" && vista && (
        vista.vencedor ? (
          <div className="px-4 mt-4 flex flex-col gap-4">
            <Vencedor
              p={vista.vencedor}
              segundo={vista.segundo}
              naLista={naLista}
              onLista={() => { if (juntarALista(pesquisa.charAt(0).toUpperCase() + pesquisa.slice(1))) { setNaLista(true); evento("comparar_para_lista"); } }}
            />

            <section>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--pj-text-muted)", margin: "0 2px 8px" }}>
                O melhor preço em cada supermercado
              </h3>
              <PorLoja lojas={dados.lojas} melhores={vista.melhores} unidade={vista.unidade} min={vista.min} />
            </section>

            <section>
              <div className="flex items-center justify-between" style={{ margin: "0 2px 8px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--pj-text-muted)" }}>Todos os resultados</h3>
              </div>
              <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
                {[{ id: null, nome: "Todos" }, ...dados.lojas.filter((l) => l.ok && l.total)].map((l) => (
                  <button key={l.id ?? "todos"} onClick={() => setFiltro(l.id)} className="pj-tap press flex-none"
                    style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999, border: "1px solid var(--pj-border)",
                      background: filtro === l.id ? "var(--pj-text)" : "var(--pj-card)", color: filtro === l.id ? "var(--pj-card)" : "var(--pj-text-muted)" }}>
                    {l.nome}{l.id ? ` · ${l.total}` : ""}
                  </button>
                ))}
              </div>
              <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
                {vista.principais.map((p, i) => <LinhaProduto key={`${p.loja}-${p.id}-${i}`} p={p} primeira={i === 0} />)}
                {!vista.principais.length && (
                  <p style={{ padding: 14, fontSize: 13, color: "var(--pj-text-faint)" }}>Sem resultados diretos nesta loja.</p>
                )}
              </div>

              {vista.outros.length > 0 && (
                <>
                  <button onClick={() => setVerOutros((v) => !v)} className="pj-tap press w-full flex items-center justify-center gap-1 mt-3"
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", background: "transparent", border: 0, padding: "6px 0" }}>
                    {verOutros ? "Esconder" : "Ver"} produtos relacionados ({vista.outros.length})
                    <ChevronDown size={15} style={{ transform: verOutros ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </button>
                  {verOutros && (
                    <div className="mt-2" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
                      {vista.outros.map((p, i) => <LinhaProduto key={`o-${p.loja}-${p.id}-${i}`} p={p} primeira={i === 0} />)}
                    </div>
                  )}
                </>
              )}
            </section>

            <p className="flex gap-1.5" style={{ fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.5, margin: "0 2px" }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Preços das lojas online, verificados {tempoDesde(dados.obtidoEm)}. Nas lojas físicas podem ser diferentes.
                No Lidl só aparecem os artigos em promoção esta semana ou na próxima.
              </span>
            </p>
          </div>
        ) : (
          <div className="px-4 mt-5">
            <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Não encontrámos «{pesquisa}».</p>
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                Experimenta uma palavra mais simples, como «arroz» em vez de «arroz agulha extra longo».
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
