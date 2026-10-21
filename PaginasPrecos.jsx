import { ArrowRight } from "lucide-react";
import { evento } from "./lib/analytics";
import { euros, porUnidade, dataCurta, SEM_PRECOS_ONLINE } from "./lib/seoFormato";

/*
 * Peças das páginas públicas de preços (/precos, /comparar). Mesmo estilo
 * das outras páginas públicas (LayoutPublico): cartões, var(--pj-*), o
 * verde só no vencedor.
 */

export const estiloRotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
export const estiloH1 = { fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 };
export const estiloH2 = { fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 12 };
export const estiloTexto = { fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 };
export const estiloCartao = { background: "var(--pj-card)", border: "1px solid var(--pj-border)" };
const estiloLink = { color: "var(--pj-brand-ink)", textDecoration: "underline", textUnderlineOffset: 2 };

/* "Atualizado a 21 out 2026" — a data dos preços, nunca a do render. */
export function Atualizado({ dia, prefixo = "Atualizado a" }) {
  if (!dia) return <span>Sem preços recentes</span>;
  return <time dateTime={dia}>{prefixo} {dataCurta(dia)}</time>;
}

/*
 * O botão que leva à app. Conta no GA4 como abrir_poupeja, com a origem
 * (que página) e o tipo — só isso, nunca o artigo nem valores.
 */
export function BotaoAbrirPoupeja({ href, texto, tipo }) {
  return (
    <a
      href={href}
      onClick={() => evento("abrir_poupeja", { origem: "seo", tipo })}
      className="pj-tap flex items-center justify-between no-underline mt-8 rounded-2xl px-5 py-4"
      style={{ background: "var(--pj-brand)", color: "#fff" }}
    >
      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{texto}</span>
      <ArrowRight size={18} />
    </a>
  );
}

/* Preços de um artigo, uma linha por cadeia; a primeira é a mais barata. */
export function TabelaPrecos({ ofertas, unidade }) {
  const u = porUnidade(unidade);
  const cab = { fontSize: 11, fontWeight: 600, color: "var(--pj-text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left" };
  return (
    <div className="rounded-2xl overflow-hidden mt-6" style={estiloCartao}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th scope="col" style={cab}>Cadeia</th>
            <th scope="col" style={{ ...cab, textAlign: "right" }}>Embalagem</th>
            <th scope="col" style={{ ...cab, textAlign: "right" }}>{u ? `Preço €${u}` : "Preço"}</th>
          </tr>
        </thead>
        <tbody>
          {ofertas.map((o, i) => (
            <tr key={o.loja} style={{ borderTop: "1px solid var(--pj-subtle)", background: i === 0 ? "var(--pj-brand-wash)" : "transparent" }}>
              <td style={{ padding: "12px", borderLeft: `3px solid ${i === 0 ? "var(--pj-brand)" : "transparent"}` }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>
                  {o.lojaNome}{i === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--pj-brand-ink)", marginLeft: 8 }}>MAIS BARATO</span>}
                </span>
                {o.produto && <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 2 }}>{o.produto}</span>}
              </td>
              <td className="pj-num" style={{ padding: "12px", textAlign: "right", fontSize: 13.5, color: "var(--pj-text-muted)", whiteSpace: "nowrap" }}>
                {o.preco > 0 ? `${euros(o.preco)} €` : "—"}
              </td>
              <td className="pj-num font-display" style={{ padding: "12px", textAlign: "right", fontSize: 17, fontWeight: 600, color: i === 0 ? "var(--pj-brand-ink)" : "var(--pj-text)", whiteSpace: "nowrap" }}>
                {euros(o.valor)} €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* "Comparamos apenas cadeias com preços online: …" — sempre visível. */
export function NotaCadeias({ lojas }) {
  return (
    <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 12 }}>
      Comparamos apenas cadeias com preços online: {lojas.join(", ")}.
      {" "}{SEM_PRECOS_ONLINE.join(", ")} e outras não publicam preços, por isso não entram.
      Preços vistos nos sites das lojas; na loja física podem ser diferentes.
    </p>
  );
}

/* Uma lista de links em "pílulas", como em /folhetos/[loja]. */
export function Pilulas({ itens }) {
  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((it) => (
        <a key={it.href} href={it.href} className="pj-tap no-underline"
          style={{ fontSize: 13, fontWeight: 600, color: it.fraco ? "var(--pj-text-muted)" : "var(--pj-brand-ink)", ...estiloCartao, borderRadius: 12, padding: "8px 14px" }}>
          {it.texto}
        </a>
      ))}
    </div>
  );
}

/*
 * Lista de artigos com o vencedor e o preço, para os hubs. Cada linha é um
 * link para a página do artigo.
 */
export function ListaArtigos({ artigos, mostrarLoja = true }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
      {artigos.map((a, i) => (
        <a key={a.slug} href={`/precos/${a.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline"
          style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{a.nome}</span>
            {a.contexto && <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>{a.contexto}</span>}
            {!a.contexto && mostrarLoja && a.vencedor && (
              <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>
                Mais barato no {a.vencedor.lojaNome}{a.pct >= 1 ? ` · ${a.pct}% abaixo do 2.º` : ""}
              </span>
            )}
          </span>
          {a.vencedor
            ? <span className="pj-num font-display flex-shrink-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)", whiteSpace: "nowrap" }}>{euros(a.vencedor.valor)} €{porUnidade(a.unidade)}</span>
            : <span style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>ver</span>}
        </a>
      ))}
    </div>
  );
}

export function Migalhas({ passos }) {
  return (
    <p style={estiloRotulo}>
      {passos.map((p, i) => (
        <span key={p.path}>
          {i > 0 && " · "}
          {i < passos.length - 1
            ? <a href={p.path} className="pj-alvo" style={{ color: "var(--pj-text-faint)" }}>{p.nome}</a>
            : p.nome}
        </span>
      ))}
    </p>
  );
}

export { estiloLink };

/*
 * Histórico do melhor preço de cada dia. Um SVG estático, sem JavaScript
 * (o gráfico dos combustíveis tem leitura ao toque e fala em médias por
 * litro com 3 casas; aqui não há média, há o mais barato do dia). Com
 * menos de 7 dias não é tendência nenhuma e não aparece.
 */
const GL = 360, GA = 140, GM = { top: 12, right: 12, bottom: 22, left: 44 };
const fmtDia = (d) => { const [, m, dd] = d.split("-").map(Number); return `${dd}/${String(m).padStart(2, "0")}`; };

export function GraficoHistorico({ serie, unidade }) {
  if (!serie || serie.length < 7) return null;
  const u = porUnidade(unidade);
  const v = serie.map((p) => p.media);
  let lo = Math.min(...v), hi = Math.max(...v);
  const folga = Math.max((hi - lo) * 0.15, 0.01);
  lo -= folga; hi += folga;
  const w = GL - GM.left - GM.right, h = GA - GM.top - GM.bottom;
  const x = (i) => GM.left + (i / (serie.length - 1)) * w;
  const y = (val) => GM.top + (1 - (val - lo) / (hi - lo)) * h;
  const caminho = serie.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.media).toFixed(1)}`).join("");
  const primeiro = serie[0], ultimo = serie[serie.length - 1];
  const diff = Math.round((ultimo.media - primeiro.media) * 100) / 100;
  const marcas = [lo + folga, hi - folga];
  return (
    <figure className="rounded-2xl p-4 mt-6" style={{ ...estiloCartao, margin: 0, marginTop: 24 }}>
      <figcaption>
        <p className="font-display" style={{ fontSize: 17, fontWeight: 600, color: "var(--pj-text)" }}>Histórico de preço</p>
        <p className="pj-num" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>
          Melhor preço de cada dia{u ? ` (€${u})` : ""}, {serie.length} dias ·{" "}
          {Math.abs(diff) < 0.01 ? "praticamente igual" : `${diff < 0 ? "desceu" : "subiu"} ${euros(Math.abs(diff))} €`} desde {fmtDia(primeiro.dia)}
        </p>
      </figcaption>
      <svg viewBox={`0 0 ${GL} ${GA}`} width="100%" role="img" style={{ display: "block", marginTop: 8, color: "var(--pj-brand-ink)" }}
        aria-label={`De ${euros(primeiro.media)} € a ${fmtDia(primeiro.dia)} para ${euros(ultimo.media)} € a ${fmtDia(ultimo.dia)}`}>
        {marcas.map((m, i) => (
          <g key={i}>
            <line x1={GM.left} x2={GL - GM.right} y1={y(m)} y2={y(m)} stroke="var(--pj-border)" strokeWidth="1" />
            <text x={GM.left - 6} y={y(m)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--pj-text-faint)">{euros(m)}</text>
          </g>
        ))}
        <text x={GM.left} y={GA - 6} fontSize="10" fill="var(--pj-text-faint)">{fmtDia(primeiro.dia)}</text>
        <text x={GL - GM.right} y={GA - 6} fontSize="10" fill="var(--pj-text-faint)" textAnchor="end">{fmtDia(ultimo.dia)}</text>
        <path d={caminho} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(serie.length - 1)} cy={y(ultimo.media)} r="4" fill="currentColor" stroke="var(--pj-card)" strokeWidth="2" />
      </svg>
      <details style={{ marginTop: 8 }}>
        <summary className="pj-tap" style={{ fontSize: 12, color: "var(--pj-text-muted)", cursor: "pointer" }}>Ver os valores</summary>
        <table className="pj-num" style={{ width: "100%", fontSize: 12, marginTop: 6, borderCollapse: "collapse", color: "var(--pj-text)" }}>
          <tbody>
            {serie.slice().reverse().map((l) => (
              <tr key={l.dia} style={{ borderTop: "1px solid var(--pj-subtle)" }}>
                <td style={{ padding: "4px 0" }}>{fmtDia(l.dia)}</td>
                <td style={{ textAlign: "right" }}>{euros(l.media)} €{u}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
