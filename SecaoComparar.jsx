import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ExternalLink, Plus, Check, RefreshCw, Store, ChevronDown, Info, ScanBarcode } from "lucide-react";
import dynamic from "next/dynamic";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { valorComparacao, melhoresPorLoja, termoDePesquisa } from "./lib/comparacao";
import CompararLista from "./CompararLista";
import { LinhaHistorico, CriarAlerta, ListaAlertas, BotaoAlerta, alertaDe } from "./AlertasPreco";
import { ITENS, CATEGORIAS as CATS_CATALOGO, itemPorNome } from "./data/catalogo-lista";

// Direto dos dados (sem a pesquisa tolerante da lista): é o que este ecrã precisa.
const NOME_CATEGORIA = Object.fromEntries(CATS_CATALOGO.map((c) => [c.id, c.nome]));
import { NotaCobertura } from "./Cobertura";
import { N_COMPARADAS } from "./lib/cobertura";

// A câmara e o leitor só se descarregam quando alguém toca no botão.
const LeitorCodigoBarras = dynamic(() => import("./LeitorCodigoBarras"), { ssr: false });

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
// Os exemplos que abrem o Mercado a quem chega (um por dia, à vez): artigos
// que toda a gente compra e que existem nas cadeias comparadas.
const EXEMPLOS = ["leite meio gordo", "ovos", "azeite", "arroz agulha"];
// Nota ao lado do nome da loja, onde o preço não é o da loja online.
const NOTA_LOJA = { lidl: "só promoções em loja", aldi: "preço de loja" };

const normalizar = (q) => String(q || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
const semAcentos = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Sugestões enquanto se escreve: o catálogo da lista de compras (~250
// artigos com nomes que as lojas reconhecem). Primeiro os que começam
// pelo que se escreveu, depois os que o contêm.
// O termo de pesquisa de cada artigo do catálogo (o que as lojas reconhecem).
const CATALOGO = [...new Set(ITENS.map((i) => i.q))].filter(Boolean);
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
/*
 * Com `produto`, o artigo fica com esse produto escolhido (loja + id) e
 * com o termo da pesquisa onde ele apareceu, para a comparação da lista o
 * voltar a encontrar.
 */
function juntarALista(nome, produto = null, q = null) {
  try {
    const itens = JSON.parse(localStorage.getItem(LS_LISTA) || "[]");
    const escolha = produto?.id ? { escolha: { loja: produto.loja, id: String(produto.id), nome: produto.nome }, ...(q ? { q } : {}) } : {};
    const existe = itens.find((i) => i.nome.toLowerCase() === nome.toLowerCase() && !i.feito);
    const novos = existe
      ? itens.map((i) => (i === existe ? { ...i, ...(produto ? escolha : { qty: (i.qty || 1) + 1 }) } : i))
      : [{ id: Date.now() + Math.random(), nome: itemPorNome(nome)?.nome || nome, emoji: "", categoria: NOME_CATEGORIA[itemPorNome(nome)?.cat] || "", qty: 1, feito: false, ...(itemPorNome(nome) ? { q: itemPorNome(nome).q } : {}), ...escolha }, ...itens];
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

/*
 * Aviso de embalagem (lib/reduflacao): "encolheu" quando o mesmo produto
 * passou a trazer menos e se paga mais por kg; "familia" quando a
 * embalagem grande sai mais cara ao kg do que a pequena.
 */
function textoAvisoEmbalagem(aviso, unidade) {
  if (!aviso) return null;
  const u = unidade || "unidade";
  if (aviso.tipo === "encolheu") {
    return {
      rotulo: "Embalagem encolheu",
      texto: `Era ${aviso.antes.qtd}, agora ${aviso.agora.qtd}. Pagas +${aviso.pct}% por ${u}.`,
    };
  }
  return {
    rotulo: "Grande não compensa",
    texto: `Esta embalagem sai ${aviso.pct}% mais cara por ${u} do que a de ${aviso.alternativa.qtd}.`,
  };
}

function AvisoEmbalagem({ p, grande = false }) {
  const a = textoAvisoEmbalagem(p.aviso, p.nomeUnidade || p.unidade);
  if (!a) return null;
  return (
    <span role="note" style={{ display: "block", marginTop: grande ? 10 : 5, padding: grande ? "8px 10px" : "5px 8px", borderRadius: 10, background: "var(--pj-warn-wash)", color: "var(--pj-warn)", fontSize: grande ? 12.5 : 11.5, lineHeight: 1.35 }}>
      <strong style={{ fontWeight: 700 }}>{a.rotulo}.</strong> {a.texto}
    </span>
  );
}

function Vencedor({ p, segundo, empatados = [], modo, onLista, naLista, q, historico }) {
  const [alertaAberto, setAlertaAberto] = useState(false);
  const [alerta, setAlerta] = useState(() => alertaDe(q));
  const [avisoAlerta, setAvisoAlerta] = useState("");
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
          : `${p.lojaNome} · o mais barato entre os supermercados comparados`}
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

        <AvisoEmbalagem p={p} grande />

        <LinhaHistorico historico={historico} valorAtual={v} unidade={modo === "embalagem" ? "embalagem" : p.nomeUnidade || p.unidade} />

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
          <BotaoAlerta ativo={!!alerta} aberto={alertaAberto} onClick={() => { setAlertaAberto((a) => !a); setAvisoAlerta(""); }} />
        </div>

        {alertaAberto && (
          <CriarAlerta
            q={q}
            valorAtual={v}
            unidade={modo === "embalagem" ? "embalagem" : p.nomeUnidade || p.unidade}
            modo={modo}
            onFechar={() => setAlertaAberto(false)}
            onGuardado={(novo, estadoPush) => {
              setAlerta(novo);
              setAlertaAberto(false);
              setAvisoAlerta(!novo ? "Alerta apagado."
                : estadoPush === "ativo" ? `Alerta criado. Avisamos quando baixar de ${eur(novo.alvo, 2)} €.`
                : "Alerta guardado — ativa as notificações para receberes o aviso.");
            }}
          />
        )}
        {avisoAlerta && !alertaAberto && (
          <p role="status" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 10 }}>{avisoAlerta}</p>
        )}
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
                {l.nome}{NOTA_LOJA[l.id] && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--pj-text-faint)" }}> · {NOTA_LOJA[l.id]}</span>}
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

function LinhaProduto({ p, primeira, modo, onLista, naLista }) {
  const desc = descontoPct(p);
  return (
    <div className="flex items-center" style={{ borderTop: primeira ? "none" : "1px solid var(--pj-subtle)" }}>
    <a href={p.url || undefined} target="_blank" rel="noopener noreferrer"
      className="pj-tap no-underline flex items-center gap-3 flex-1 min-w-0"
      style={{ padding: "10px 4px 10px 14px" }}>
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
        <AvisoEmbalagem p={p} />
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
    {onLista && p.id && (
      <button onClick={() => onLista(p)} disabled={naLista} aria-label={naLista ? `${p.nome} está na lista` : `Pôr ${p.nome} na lista`}
        className="pj-tap flex items-center justify-center flex-none"
        style={{ width: 36, height: 36, margin: "0 10px 0 4px", borderRadius: 10, border: 0, background: naLista ? "var(--pj-brand-wash)" : "var(--pj-subtle)", color: naLista ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
        {naLista ? <Check size={15} /> : <Plus size={15} />}
      </button>
    )}
    </div>
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
  const [marca, setMarca] = useState("todas"); // todas | propria | outras
  const [verOutros, setVerOutros] = useState(false);
  const [naLista, setNaLista] = useState(false);
  const [produtosNaLista, setProdutosNaLista] = useState(() => new Set());
  // "+" num resultado: este produto, mesmo que não seja o mais barato.
  function produtoParaLista(p) {
    const nome = pesquisa.charAt(0).toUpperCase() + pesquisa.slice(1);
    if (!juntarALista(nome, p, pesquisa)) return;
    setProdutosNaLista((s) => new Set(s).add(`${p.loja}|${p.id}`));
    setNaLista(true);
    evento("comparar_produto_para_lista", { loja: p.loja });
  }
  const [exemplo, setExemplo] = useState(false); // o resultado à vista é o exemplo do dia
  const [temCamara, setTemCamara] = useState(false);
  const [lerCodigo, setLerCodigo] = useState(false);
  const [lido, setLido] = useState(null); // { nome, codigo } do último código lido
  useEffect(() => { setTemCamara(!!navigator.mediaDevices?.getUserMedia); }, []);
  const pedido = useRef(0);

  const [listaCompras, setListaCompras] = useState([]);
  const [focado, setFocado] = useState(false);
  /*
   * Quem abre o Mercado pela primeira vez via uma caixa de pesquisa e um
   * ecrã vazio. Sem pesquisas anteriores, sem lista para comparar e sem
   * vir de um alerta, mostra-se já uma comparação feita — o exemplo do
   * dia. É o mesmo para toda a gente nesse dia, por isso sai da cache da
   * CDN e não pesa nos supermercados. Não conta como pesquisa da pessoa
   * (nem fica nos recentes, nem no evento comparar_pesquisa).
   */
  useEffect(() => {
    const rec = lerRecentes();
    const lista = lerListaPendente();
    setRecentes(rec);
    setListaCompras(lista);
    let vemDeAlerta = false;
    try { vemDeAlerta = new URLSearchParams(window.location.search).has("q"); } catch {}
    if (!rec.length && lista.length < 2 && !vemDeAlerta) {
      const dia = Math.floor(Date.now() / 86400000);
      procurar(EXEMPLOS[dia % EXEMPLOS.length], { exemplo: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aberto por uma notificação de alerta (/?atalho=mercados&q=azeite):
  // mostra logo essa pesquisa e limpa o q do endereço.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (!q) return;
      params.delete("q");
      const resto = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (resto ? `?${resto}` : ""));
      procurar(q);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sugestoes = focado && normalizar(texto) !== pesquisa ? sugerir(texto) : [];

  async function procurar(termo, { exemplo: eExemplo = false } = {}) {
    const q = normalizar(termo);
    if (q.length < 2) return;
    // O exemplo não escreve na caixa: fica vazia, a convidar a pesquisar.
    if (!eExemplo) setTexto(q);
    setExemplo(eExemplo);
    setPesquisa(q);
    setEstado("a-carregar");
    setErro("");
    setFiltro(null);
    setVerOutros(false);
    setNaLista(false);
    setProdutosNaLista(new Set());
    const n = ++pedido.current;
    evento(eExemplo ? "comparar_exemplo" : "comparar_pesquisa", { q });
    try {
      const r = await fetch(`/api/precos-supermercado?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (n !== pedido.current) return; // chegou uma pesquisa mais recente
      // Sem lista de produtos não há nada para mostrar (e o ecrã partia ao tentar).
      if (!Array.isArray(j.produtos)) throw new Error(j.erro || "Não foi possível pesquisar agora.");
      // O exemplo só aparece se tiver resultados: um "Não encontrámos" no
      // ecrã de quem nada pesquisou parecia um erro da app.
      if (eExemplo && !j.produtos.length) throw new Error("exemplo vazio");
      setDados(j);
      setEstado("pronto");
      if (!eExemplo) setRecentes(guardarRecente(q));
    } catch (e) {
      if (n !== pedido.current) return;
      // Um exemplo que falha não vira um erro no ecrã de quem nada pediu.
      if (eExemplo) { setExemplo(false); setEstado("inicio"); return; }
      setErro(e.message || "Não foi possível pesquisar agora.");
      setEstado("erro");
    }
  }

  const vista = useMemo(() => {
    if (!dados) return null;
    // Não se compara €/kg com €/un; ao molho (ervas) compara-se a embalagem.
    // O filtro de marca vale para tudo — o "mais barato" passa a ser o mais
    // barato de marca própria (ou de outras marcas).
    const produtos = marca === "todas" ? dados.produtos
      : dados.produtos.filter((p) => (marca === "propria" ? p.marcaPropria : !p.marcaPropria));
    const { modo, principais, melhores, ranking } = melhoresPorLoja({ ...dados, produtos });
    const lista = filtro ? produtos.filter((p) => p.loja === filtro) : produtos;
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
  }, [dados, filtro, marca]);

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
            {/* Na loja: ler o código de barras em vez de escrever */}
            {temCamara && (
              <button type="button" onClick={() => { setLerCodigo(true); evento("codigo_barras", { acao: "abrir" }); }}
                aria-label="Ler código de barras" className="pj-tap flex items-center justify-center flex-none rounded-lg"
                style={{ width: 36, height: 36, marginRight: -6, color: "var(--pj-text-muted)", background: "transparent", border: 0 }}>
                <ScanBarcode size={19} />
              </button>
            )}
          </label>
          <button type="submit" disabled={normalizar(texto).length < 2 || estado === "a-carregar"} className="pj-tap press"
            style={{ flexShrink: 0, background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 14, padding: "0 16px", fontSize: 14, fontWeight: 600, opacity: normalizar(texto).length < 2 ? 0.5 : 1 }}>
            Comparar
          </button>
        </form>

        {lerCodigo && (
          <LeitorCodigoBarras
            onFechar={() => setLerCodigo(false)}
            onNome={(nome, codigo) => { setLerCodigo(false); setLido({ nome, codigo }); procurar(nome); }}
          />
        )}
        {lido && lido.nome === pesquisa && (
          <p className="mt-2" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>
            Código {lido.codigo} · a comparar «{lido.nome}». Se não for bem isto, escreve o nome.
          </p>
        )}

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

      {estado === "inicio" && (
        <div className="px-4 mt-5 empty:hidden">
          <ListaAlertas onAbrir={(q) => procurar(q)} />
        </div>
      )}

      {estado === "inicio" && listaCompras.length >= 2 && (
        <div className="px-4 mt-5">
          <CompararLista itens={listaCompras} nota={false} />
        </div>
      )}

      {estado === "inicio" && (
        <div className="px-4 mt-3">
          {/* Discreto: uma linha; o pormenor abre ao tocar (lib/cobertura). */}
          <NotaCobertura />
        </div>
      )}

      {estado === "a-carregar" && (
        <>
          <p className="px-4 mt-4" style={{ fontSize: 12.5, color: "var(--pj-text-faint)" }}>A ver os preços de «{pesquisa}» em {N_COMPARADAS} supermercados…</p>
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

      {exemplo && estado === "pronto" && (
        <p className="px-4 mt-4" style={{ fontSize: 12.5, color: "var(--pj-text-faint)" }}>
          Exemplo de hoje: <strong style={{ color: "var(--pj-text-muted)", fontWeight: 600 }}>{pesquisa}</strong>. Escreve outro produto acima.
        </p>
      )}

      {estado === "pronto" && vista && dados.produtos.some((p) => p.marcaPropria) && dados.produtos.some((p) => !p.marcaPropria) && (
        <div className="px-4 mt-4">
          {/* Marca própria (a "marca branca") vs. as outras — muda também o vencedor. */}
          <div className="flex gap-1 p-1 rounded-xl" role="radiogroup" aria-label="Marca" style={{ background: "var(--pj-subtle)" }}>
            {[["todas", "Todas"], ["propria", "Marca própria"], ["outras", "Outras marcas"]].map(([id, rotulo]) => (
              <button key={id} role="radio" aria-checked={marca === id} onClick={() => { setMarca(id); evento("comparar_marca", { marca: id }); }}
                className="pj-tap press flex-1" style={{ padding: "8px 0", borderRadius: 9, border: 0, fontSize: 12.5, fontWeight: 600,
                  background: marca === id ? "var(--pj-card)" : "transparent", color: marca === id ? "var(--pj-text)" : "var(--pj-text-faint)",
                  boxShadow: marca === id ? "0 1px 3px rgba(20,35,28,0.08)" : "none" }}>
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {estado === "pronto" && vista && (
        vista.vencedor ? (
          <div className="px-4 mt-4 flex flex-col gap-4">
            <Vencedor
              key={pesquisa}
              p={vista.vencedor}
              segundo={vista.segundo}
              empatados={vista.empatados}
              modo={vista.modo}
              q={pesquisa}
              historico={marca === "todas" ? dados.historico : null}
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
                {vista.principais.map((p, i) => <LinhaProduto key={`${p.loja}-${p.id}-${i}`} p={p} primeira={i === 0} modo={vista.modo} onLista={produtoParaLista} naLista={produtosNaLista.has(`${p.loja}|${p.id}`)} />)}
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
                Preços verificados {tempoDesde(dados.obtidoEm)}. Continente, Pingo Doce e Auchan: preços da loja online
                (na loja física podem ser diferentes). Aldi e Lidl: preços de loja; no Lidl só aparecem as promoções desta semana e da próxima.
              </span>
            </p>
            <NotaCobertura style={{ padding: "0 2px" }} />
          </div>
        ) : (
          <div className="px-4 mt-5">
            <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, padding: 16 }}>
              {marca !== "todas" ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>
                    Sem resultados de {marca === "propria" ? "marca própria" : "outras marcas"} para «{pesquisa}».
                  </p>
                  <button onClick={() => setMarca("todas")} className="pj-tap mt-2" style={{ background: "transparent", border: 0, padding: 0, fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                    Ver todas as marcas
                  </button>
                </>
              ) : <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Não encontrámos «{pesquisa}».</p>
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                Experimenta uma palavra mais simples, como «arroz» em vez de «arroz agulha extra longo».
              </p>
              </>}
            </div>
          </div>
        )
      )}
    </div>
  );
}
