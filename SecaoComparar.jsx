import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ExternalLink, Plus, Check, RefreshCw, Store, ChevronDown, Info } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { valorComparacao, melhoresPorLoja, termoDePesquisa } from "./lib/comparacao";
import CompararLista from "./CompararLista";
import { NOMES_ARTIGOS } from "./SecaoListaCompras";

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
const LOJAS_COMPARADAS = [
  { nome: "Continente", cobertura: "Todos os produtos" },
  { nome: "Pingo Doce", cobertura: "Todos os produtos" },
  { nome: "Auchan", cobertura: "Todos os produtos" },
  { nome: "Lidl", cobertura: "Só promoções da semana", parcial: true },
];

const normalizar = (q) => String(q || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
const semAcentos = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Sugestões enquanto se escreve: o catálogo da lista de compras (~250
// artigos com nomes que as lojas reconhecem). Primeiro os que começam
// pelo que se escreveu, depois os que o contêm.
const CATALOGO = [...new Set(NOMES_ARTIGOS.map(termoDePesquisa))].filter(Boolean);
function sugerir(texto) {
  const t = semAcentos(texto.trim());
  if (t.length < 2) return [];
  const comeca = CATALOGO.filter((n) => semAcentos(n).startsWith(t));
  const contem = CATALOGO.filter((n) => !semAcentos(n).startsWith(t) && semAcentos(n).includes(t));
  return [...comeca, ...contem].slice(0, 6);
}

function lerListaPendente() {
  try { return JSON.parse(localStorage.getItem(LS_LISTA) || "[]").filter((i) => !i.feito && i.nome); } catch { return []; }
}

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

/*
 * O número que interessa a quem compra, conforme o produto:
 * - ervas frescas (modo "embalagem"): o preço do molho, com o €/kg ao lado;
 * - vendido ao peso: o preço do kg — é o que está na etiqueta da loja;
 * - o resto: o preço por kg / L / ovo / rolo / lavagem, com o da embalagem ao lado.
 * A comparação usa sempre o mesmo número que aparece em grande.
 */

function comoMostrar(p, modo) {
  const porUnid = `${eur(p.precoUnidade, 2)} €/${p.nomeUnidade || p.unidade}`;
  if (modo === "embalagem") {
    return { valor: p.preco, sufixo: "", detalhe: [p.quantidade, porUnid].filter(Boolean).join(" · ") };
  }
  if (p.aoPeso) {
    return { valor: p.precoUnidade, sufixo: "/kg", detalhe: p.precoPeca ? `Ao peso · ≈ ${eur(p.precoPeca, 2)} € cada` : "Vendido ao peso" };
  }
  const embalagem = p.precoUnidade !== p.preco ? `${eur(p.preco, 2)} €` : null;
  return { valor: p.precoUnidade, sufixo: `/${p.nomeUnidade || p.unidade}`, detalhe: [embalagem, p.quantidade].filter(Boolean).join(" · ") };
}

function textoPreco(p, modo) {
  const m = comoMostrar(p, modo);
  return `${eur(m.valor, 2)} €${m.sufixo}`;
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

function Vencedor({ p, segundo, empatados = [], modo, onLista, naLista }) {
  const v = valorComparacao(p, modo);
  const v2 = segundo ? valorComparacao(segundo, modo) : null;
  const poupanca = segundo && (modo === "embalagem" || segundo.unidade === p.unidade) && v2 > v
    ? Math.round((1 - v / v2) * 100)
    : null;
  const m = comoMostrar(p, modo);
  const desc = descontoPct(p);
  return (
    <div className="anim-up" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ background: "var(--pj-brand)", color: "#fff", padding: "8px 16px", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>
        {/* Mesmo preço em várias lojas: dizer isso, não coroar a primeira. */}
        {empatados.length > 1
          ? `Mesmo preço no ${empatados.map((e) => e.lojaNome).join(", ").replace(/, ([^,]*)$/, " e no $1")}`
          : `Mais barato hoje · ${p.lojaNome}`}
      </div>
      <div style={{ padding: 16 }}>
        <div className="flex items-start gap-3">
          <Foto p={p} size={72} radius={12} />
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.3 }}>{p.nome}</p>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 3 }}>
              {p.marca}
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
            <Preco valor={m.valor} casas={2} tamanho={34} />
            {m.sufixo && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", marginLeft: 4 }}>{m.sufixo}</span>}
            {m.detalhe && <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 4 }}>{m.detalhe}</p>}
          </div>
          {poupanca >= 3 && empatados.length <= 1 && (
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
function PorLoja({ lojas, melhores, modo, min, empate = false }) {
  return (
    <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
      {lojas.map((l, i) => {
        const p = melhores[l.id];
        const diff = p && min != null ? Math.round((valorComparacao(p, modo) - min) * 100) : 0;
        const m = p ? comoMostrar(p, modo) : null;
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
                {!l.ok ? "Não respondeu agora" : p ? [p.nome, p.aoPeso ? "ao peso" : p.quantidade].filter(Boolean).join(" · ") : "Não tem este artigo"}
              </span>
            </span>
            {p ? (
              <span className="text-right flex-none">
                <Preco valor={m.valor} casas={2} tamanho={18} cor={diff === 0 ? "var(--pj-brand-ink)" : "var(--pj-text)"} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--pj-text-faint)", marginLeft: 2 }}>{m.sufixo}</span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: diff === 0 ? "var(--pj-brand)" : "var(--pj-text-faint)", marginTop: 2 }}>
                  {diff === 0 ? (empate ? "mesmo preço" : "o mais barato") : `+${eur(diff / 100, 2)} €${m.sufixo}`}
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

function LinhaProduto({ p, primeira, modo }) {
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
          {[p.marca, p.aoPeso ? "ao peso" : p.quantidade].filter(Boolean).map((t) => <span key={t}>· {t}</span>)}
          {desc ? <Etiqueta tom="promo">−{desc}%</Etiqueta> : null}
          {p.onde === "loja" ? <Etiqueta tom="loja">Na loja</Etiqueta> : null}
        </span>
      </span>
      <span className="text-right flex-none">
        <span className="pj-num" style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--pj-text)" }}>{textoPreco(p, modo)}</span>
        <span className="pj-num" style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 2 }}>
          {modo === "embalagem"
            ? `${eur(p.precoUnidade, 2)} €/${p.nomeUnidade || p.unidade}`
            : p.aoPeso ? (p.precoPeca ? `≈ ${eur(p.precoPeca, 2)} € cada` : "")
            : p.precoUnidade !== p.preco ? `${eur(p.preco, 2)} €` : ""}
        </span>
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

  const [listaCompras, setListaCompras] = useState([]);
  const [focado, setFocado] = useState(false);
  useEffect(() => { setRecentes(lerRecentes()); setListaCompras(lerListaPendente()); }, []);
  const sugestoes = focado && normalizar(texto) !== pesquisa ? sugerir(texto) : [];

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
    // Não se compara €/kg com €/un; ao molho (ervas) compara-se a embalagem.
    const { modo, principais, melhores, ranking } = melhoresPorLoja(dados);
    const lista = filtro ? dados.produtos.filter((p) => p.loja === filtro) : dados.produtos;
    const minimo = ranking[0] ? valorComparacao(ranking[0], modo) : null;
    return {
      vencedor: ranking[0] || null,
      empatados: ranking.filter((p) => Math.abs(valorComparacao(p, modo) - minimo) < 0.005),
      segundo: ranking.find((p) => p.loja !== ranking[0]?.loja) || null,
      melhores,
      modo,
      min: ranking[0] ? valorComparacao(ranking[0], modo) : null,
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
          Escreve um produto e comparamos o preço da forma como ele se compra: ao kg, ao litro, à unidade ou ao molho.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); procurar(texto); }} className="mt-4 flex gap-2">
          <label className="flex-1 flex items-center gap-2" style={{ minWidth: 0, background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 14, padding: "0 12px" }}>
            <Search size={17} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} />
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onFocus={() => setFocado(true)}
              // Atraso: deixa o toque numa sugestão chegar antes de a lista fechar.
              onBlur={() => setTimeout(() => setFocado(false), 150)}
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

        {sugestoes.length > 0 && (
          <div className="mt-2" role="listbox" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 14, overflow: "hidden" }}>
            {sugestoes.map((s, i) => (
              <button key={s} role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => { setFocado(false); procurar(s); }}
                className="pj-tap w-full text-left flex items-center gap-2"
                style={{ padding: "10px 14px", fontSize: 14, color: "var(--pj-text)", background: "transparent", border: 0, borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                <Search size={14} style={{ color: "var(--pj-text-faint)" }} /> {s}
              </button>
            ))}
          </div>
        )}

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

      {estado === "inicio" && listaCompras.length >= 2 && (
        <div className="px-4 mt-5">
          <CompararLista itens={listaCompras} />
        </div>
      )}

      {estado === "inicio" && (
        <div className="px-4 mt-5">
          {/* Dizer à partida o que se compara — e que o Lidl só traz promoções. */}
          <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)", padding: "14px 16px 6px" }}>Supermercados que comparamos</p>
            {LOJAS_COMPARADAS.map((l) => (
              <div key={l.nome} className="flex items-center gap-3" style={{ padding: "9px 16px", borderTop: "1px solid var(--pj-subtle)" }}>
                <LogoLoja loja={l.nome} size={32} radius={8} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: l.parcial ? "var(--pj-warn)" : "var(--pj-brand-ink)" }}>{l.cobertura}</span>
              </div>
            ))}
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
              empatados={vista.empatados}
              modo={vista.modo}
              naLista={naLista}
              onLista={() => { if (juntarALista(pesquisa.charAt(0).toUpperCase() + pesquisa.slice(1))) { setNaLista(true); evento("comparar_para_lista"); } }}
            />

            <section>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--pj-text-muted)", margin: "0 2px 8px" }}>
                O melhor preço em cada supermercado
              </h3>
              <PorLoja lojas={dados.lojas} melhores={vista.melhores} modo={vista.modo} min={vista.min} empate={vista.empatados.length > 1} />
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
                {vista.principais.map((p, i) => <LinhaProduto key={`${p.loja}-${p.id}-${i}`} p={p} primeira={i === 0} modo={vista.modo} />)}
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
                      {vista.outros.map((p, i) => <LinhaProduto key={`o-${p.loja}-${p.id}-${i}`} p={p} primeira={i === 0} modo={vista.modo} />)}
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
