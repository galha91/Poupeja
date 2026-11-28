import { useEffect, useRef, useState } from "react";
import { Link2, Type, Camera, ClipboardPaste, Sparkles, Clock, Users, ArrowRight, ExternalLink, RotateCcw, PiggyBank, Check, Loader2 } from "lucide-react";
import IngredientesReceita from "./IngredientesReceita";
import { formatarTempo, rendimento } from "./lib/receitas/motor";
import { primeiroLink } from "./lib/receitaVideo";
import { evento } from "./lib/analytics";

/*
 * Importar uma receita de um vídeo (TikTok), de um texto ou de uma
 * fotografia, ver quanto custa com os preços de hoje, a versão mais
 * barata e pô-la na lista de compras. Usado em /receitas/importar, que é
 * também o destino da partilha do Android (share_target do manifest).
 *
 * As últimas receitas importadas ficam neste dispositivo (localStorage),
 * para não se pagar duas vezes a mesma leitura.
 */
const LS = "poupeja_receitas_importadas";
const MAX_GUARDADAS = 12;
const MODOS = [
  { id: "link", nome: "Link", Icone: Link2 },
  { id: "texto", nome: "Texto", Icone: Type },
  { id: "foto", nome: "Fotografia", Icone: Camera },
];
const ETAPAS = ["A abrir a receita…", "A arrumar os ingredientes…", "A procurar os preços de hoje…", "A procurar trocas mais baratas…"];

const lerGuardadas = () => { try { const v = JSON.parse(localStorage.getItem(LS) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
function guardar(item) {
  try {
    const lista = [item, ...lerGuardadas().filter((g) => g.receita?.titulo !== item.receita?.titulo)].slice(0, MAX_GUARDADAS);
    localStorage.setItem(LS, JSON.stringify(lista));
    return lista;
  } catch { return []; }
}
const euros = (v) => `${v.toFixed(2).replace(".", ",")} €`;

export default function ImportarReceita({ partilhado = "" }) {
  const [modo, setModo] = useState("link");
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState("pronto"); // pronto | a-ler | feito
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null); // { receita, origem }
  const [guardadas, setGuardadas] = useState([]);
  const ficheiro = useRef(null);
  const topo = useRef(null);

  useEffect(() => { setGuardadas(lerGuardadas()); }, []);

  // Veio de "Partilhar → PoupeJá": começa logo.
  useEffect(() => {
    if (!partilhado) return;
    const soLink = primeiroLink(partilhado);
    if (soLink && partilhado.replace(soLink, "").trim().length < 120) { setModo("link"); setValor(soLink); importar({ link: soLink }, "partilha"); }
    else { setModo("texto"); setValor(partilhado); importar({ texto: partilhado }, "partilha"); }
  }, [partilhado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (estado !== "a-ler") return;
    setEtapa(0);
    const t = setInterval(() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [estado]);

  async function importar(corpo, como) {
    setErro(null);
    setEstado("a-ler");
    try {
      const r = await fetch("/api/receita-video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok || dados.erro || !dados.receita) {
        setErro(dados.erro || "Não consegui ler a receita. Tenta de novo.");
        if (dados.pedirTexto) setModo("texto");
        setEstado("pronto");
        evento("receita_importar_erro", { como });
        return;
      }
      setResultado({ receita: dados.receita, origem: dados.origem || null });
      setGuardadas(guardar({ receita: dados.receita, origem: dados.origem || null, em: Date.now() }));
      setEstado("feito");
      evento("receita_importada", { como, fonte: dados.origem?.fonte || "texto", custo: dados.receita.custo ? "sim" : "nao" });
      setTimeout(() => topo.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setErro("Sem ligação. Confirma a internet e tenta de novo.");
      setEstado("pronto");
    }
  }

  async function colar() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setValor(t);
    } catch { setErro("O browser não deixou colar. Carrega no campo e cola à mão."); }
  }

  async function escolherFoto(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const { comprimirImagem } = await import("./lib/imagem");
    const imagem = await comprimirImagem(f, 1600, 0.75).catch(() => null);
    if (imagem) importar({ imagem }, "foto");
  }

  function submeter(e) {
    e.preventDefault();
    const v = valor.trim();
    if (!v) return setErro(modo === "link" ? "Cola o link do vídeo." : "Cola o texto da receita.");
    importar(modo === "link" ? { link: v } : { texto: v }, modo);
  }

  if (estado === "feito" && resultado) {
    return <Resultado {...resultado} topo={topo} outra={() => { setResultado(null); setValor(""); setEstado("pronto"); }} />;
  }

  const a_ler = estado === "a-ler";
  return (
    <div>
      <div role="tablist" aria-label="De onde vem a receita" className="flex rounded-2xl" style={{ background: "var(--pj-subtle)", padding: 4, gap: 4 }}>
        {MODOS.map(({ id, nome, Icone }) => (
          <button key={id} role="tab" type="button" aria-selected={modo === id} onClick={() => { setModo(id); setErro(null); }}
            className="pj-tap flex-1 flex items-center justify-center rounded-xl"
            style={{ minHeight: 42, gap: 6, border: 0, fontSize: 14, fontWeight: 600, background: modo === id ? "var(--pj-card)" : "transparent", color: modo === id ? "var(--pj-text)" : "var(--pj-text-muted)", boxShadow: modo === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            <Icone size={15} /> {nome}
          </button>
        ))}
      </div>

      {modo === "foto" ? (
        <div style={{ marginTop: 14 }}>
          <input ref={ficheiro} type="file" accept="image/*" capture="environment" onChange={escolherFoto} hidden />
          <button type="button" disabled={a_ler} onClick={() => ficheiro.current?.click()} className="pj-tap press w-full flex flex-col items-center justify-center rounded-2xl"
            style={{ minHeight: 150, gap: 8, background: "var(--pj-card)", border: "2px dashed var(--pj-border)", color: "var(--pj-text)" }}>
            <Camera size={30} color="var(--pj-brand-ink)" />
            <span style={{ fontSize: 15.5, fontWeight: 600 }}>Fotografar ou escolher imagem</span>
            <span style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>Um livro de receitas, uma revista, um caderno ou uma captura de ecrã</span>
          </button>
        </div>
      ) : (
        <form onSubmit={submeter} style={{ marginTop: 14 }}>
          <label htmlFor="receita-entrada" className="sr-only">{modo === "link" ? "Link do vídeo" : "Texto da receita"}</label>
          <div className="relative">
            {modo === "link" ? (
              <input id="receita-entrada" type="url" inputMode="url" autoComplete="off" value={valor} onChange={(e) => setValor(e.target.value)} disabled={a_ler}
                placeholder="https://www.tiktok.com/@…/video/…" className="w-full rounded-2xl"
                style={{ minHeight: 56, padding: "0 108px 0 16px", fontSize: 15.5, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }} />
            ) : (
              <textarea id="receita-entrada" value={valor} onChange={(e) => setValor(e.target.value)} disabled={a_ler} rows={7} maxLength={5000}
                placeholder="Cola aqui a descrição do vídeo, do Reel ou da página da receita…" className="w-full rounded-2xl"
                style={{ padding: "14px 16px", fontSize: 15, lineHeight: 1.5, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)", resize: "vertical" }} />
            )}
            {!valor && (
              <button type="button" onClick={colar} className="pj-tap absolute inline-flex items-center rounded-xl"
                style={{ right: 8, top: modo === "link" ? 9 : "auto", bottom: modo === "link" ? "auto" : 12, height: 38, padding: "0 12px", gap: 6, border: 0, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", fontSize: 13.5, fontWeight: 600 }}>
                <ClipboardPaste size={15} /> Colar
              </button>
            )}
          </div>
          <button type="submit" disabled={a_ler} className="pj-tap press w-full flex items-center justify-center rounded-2xl"
            style={{ marginTop: 12, minHeight: 54, gap: 8, background: "var(--pj-brand)", color: "#fff", border: 0, fontWeight: 600, fontSize: 16 }}>
            {a_ler ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {a_ler ? ETAPAS[etapa] : "Ver a receita e quanto custa"}
          </button>
        </form>
      )}

      {a_ler && modo === "foto" && (
        <p className="flex items-center justify-center" aria-live="polite" style={{ gap: 8, marginTop: 14, fontSize: 14, color: "var(--pj-text-muted)" }}>
          <Loader2 size={16} className="animate-spin" /> {ETAPAS[etapa]}
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-xl" style={{ marginTop: 12, padding: "10px 14px", fontSize: 14, background: "var(--pj-warn-wash)", border: "1px solid var(--pj-warn-border)", color: "var(--pj-warn)" }}>{erro}</p>
      )}

      <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 12, lineHeight: 1.5 }}>
        {modo === "link"
          ? "Links do TikTok abrem sozinhos. No Android, também podes carregar em Partilhar no vídeo e escolher o PoupeJá. Do Instagram ou do YouTube, usa o separador Texto."
          : modo === "texto" ? "Funciona com a descrição de um Reel, de um vídeo do YouTube ou com uma receita de um blog."
          : "A fotografia é lida e não fica guardada."}
      </p>

      {guardadas.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pj-text-faint)", marginBottom: 8 }}>As tuas receitas importadas</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            {guardadas.map((g, i) => (
              <button key={i} type="button" onClick={() => { setResultado({ receita: g.receita, origem: g.origem }); setEstado("feito"); }}
                className="pj-tap w-full flex items-center justify-between text-left px-4 py-3" style={{ border: 0, background: "transparent", borderTop: i ? "1px solid var(--pj-subtle)" : 0, gap: 10 }}>
                <span style={{ minWidth: 0 }}>
                  <span className="block truncate" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{g.receita?.titulo}</span>
                  <span style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
                    {g.origem?.autor ? `@${g.origem.autor.replace(/^@/, "")}` : g.origem?.fonte === "foto" ? "Da fotografia" : "Do texto"}
                    {g.receita?.custo ? ` · ≈ ${euros(g.receita.custo.total / g.receita.porcoes)}/pessoa` : ""}
                  </span>
                </span>
                <ArrowRight size={16} color="var(--pj-brand-ink)" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Resultado({ receita, origem, outra, topo }) {
  const [aplicadas, setAplicadas] = useState([]); // chaves "de" das trocas aplicadas
  const trocas = receita.trocas || [];
  const ingredientes = receita.ingredientes.map((i) => {
    const t = trocas.find((x) => x.de === i.key && aplicadas.includes(x.de));
    return t ? { ...i, key: t.para, nome: t.nomePara, compra: t.compraPara || null } : i;
  });
  const poupado = trocas.filter((t) => aplicadas.includes(t.de)).reduce((s, t) => s + t.poupa, 0);
  const total = receita.custo?.total ? Math.max(0, receita.custo.total - poupado) : null;
  const porPessoa = total ? total / receita.porcoes : null;
  const cobertura = receita.custo ? receita.custo.comPreco / Math.max(1, receita.custo.contados) : 0;

  return (
    <article ref={topo} style={{ scrollMarginTop: 16 }}>
      <p className="inline-flex items-center rounded-full" style={{ gap: 6, padding: "5px 11px", fontSize: 12.5, fontWeight: 600, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>
        <Check size={13} /> Receita importada
      </p>
      <h2 className="font-display" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 600, marginTop: 10 }}>{receita.titulo}</h2>
      {origem?.autor && (
        <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 6 }}>
          Receita de{" "}
          {origem.autorUrl ? <a href={origem.autorUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>@{origem.autor.replace(/^@/, "")}</a> : <strong>@{origem.autor.replace(/^@/, "")}</strong>}
          {origem.link && <> · <a href={origem.link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center" style={{ gap: 3, color: "var(--pj-brand-ink)" }}>ver o vídeo original <ExternalLink size={12} /></a></>}
        </p>
      )}

      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
        {receita.tempoMin && <Chip><Clock size={13} /> {formatarTempo(receita.tempoMin)}</Chip>}
        <Chip><Users size={13} /> {rendimento(receita.porcoes, receita.un)}</Chip>
      </div>

      {porPessoa ? (
        <div className="rounded-2xl" style={{ marginTop: 16, padding: "18px 20px", background: "var(--pj-brand)", color: "#fff" }}>
          <p style={{ fontSize: 13, opacity: 0.85 }}>Com os preços de hoje</p>
          <p className="font-display tabular-nums" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>
            ≈ {euros(porPessoa)} <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.9 }}>por pessoa</span>
          </p>
          <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            ≈ {euros(total)} a receita toda{cobertura < 1 ? ` · ${receita.custo.comPreco} de ${receita.custo.contados} ingredientes com preço` : ""}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl" style={{ marginTop: 16, padding: "14px 16px", fontSize: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text-muted)" }}>
          Ainda não há preços suficientes para estimar o custo. Põe os ingredientes na lista e compara os supermercados.
        </p>
      )}

      {trocas.length > 0 && (
        <section className="rounded-2xl" style={{ marginTop: 14, padding: "16px 18px", background: "var(--pj-accent-wash)", border: "1px solid var(--pj-border)" }}>
          <h3 className="flex items-center" style={{ gap: 8, fontSize: 15.5, fontWeight: 700, color: "var(--pj-accent)" }}><PiggyBank size={18} /> Versão mais barata</h3>
          {trocas.map((t) => {
            const on = aplicadas.includes(t.de);
            return (
              <div key={t.de} className="flex items-center justify-between" style={{ gap: 12, marginTop: 10 }}>
                <span style={{ fontSize: 14, color: "var(--pj-text)" }}>
                  {t.nomeDe} → <strong>{t.nomePara}</strong>
                  <span className="block tabular-nums" style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>poupas ≈ {euros(t.poupa)}</span>
                </span>
                <button type="button" aria-pressed={on} onClick={() => setAplicadas((a) => (on ? a.filter((x) => x !== t.de) : [...a, t.de]))}
                  className="pj-tap rounded-xl" style={{ flexShrink: 0, minHeight: 38, padding: "0 14px", fontSize: 13.5, fontWeight: 600, border: on ? 0 : "1px solid var(--pj-border)", background: on ? "var(--pj-accent)" : "var(--pj-card)", color: on ? "#fff" : "var(--pj-text)" }}>
                  {on ? "Trocado" : "Trocar"}
                </button>
              </div>
            );
          })}
        </section>
      )}

      <IngredientesReceita key={aplicadas.join(",")} receita={{ id: "importada", porcoes: receita.porcoes, un: receita.un, ingredientes }} />

      {receita.passos?.length > 0 && (
        <>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 30, marginBottom: 12 }}>Como fazer</h3>
          <ol className="flex flex-col" style={{ gap: 12, listStyle: "none", padding: 0 }}>
            {receita.passos.map((p, i) => (
              <li key={i} className="flex" style={{ gap: 12 }}>
                <span className="flex items-center justify-center rounded-full tabular-nums" style={{ flexShrink: 0, width: 28, height: 28, fontSize: 13, fontWeight: 700, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}>{i + 1}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--pj-text)", paddingTop: 3 }}>{p}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 20, lineHeight: 1.5 }}>
        Lida automaticamente: confirma os ingredientes antes de ir às compras. O custo é uma estimativa com o melhor preço de hoje de cada ingrediente; na lista vês o total em cada supermercado.
      </p>
      <button type="button" onClick={outra} className="pj-tap w-full flex items-center justify-center rounded-2xl"
        style={{ marginTop: 16, minHeight: 48, gap: 8, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)", fontWeight: 600, fontSize: 14.5 }}>
        <RotateCcw size={16} /> Importar outra receita
      </button>
    </article>
  );
}

function Chip({ children }) {
  return <span className="inline-flex items-center rounded-full" style={{ gap: 5, padding: "5px 11px", fontSize: 13, color: "var(--pj-text-muted)", background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>{children}</span>;
}
