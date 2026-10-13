import { useState, useRef } from "react";
import { eur } from "./lib/formato";

/*
 * Gráfico de 30 dias do preço médio de um combustível — uma série só.
 *
 * Uma linha de 2px na cor da marca (passa 3:1 contra o cartão, em claro e
 * em escuro), grelha recessiva de 1px, sem legenda (o título diz o que é).
 * Ao passar o dedo/rato: linha vertical, ponto, e a linha de leitura por
 * cima do gráfico passa a mostrar a média e o mínimo desse dia. Por baixo, os valores em tabela para quem não vê o
 * gráfico (leitores de ecrã, impressão).
 *
 * `serie`: [{ dia: "AAAA-MM-DD", media, minimo }], por ordem de dia.
 */
const L = 360, A = 150;                          // caixa do SVG (escala com a largura)
const M = { top: 12, right: 12, bottom: 22, left: 44 };
const fmtDia = (d, mes = "short") => new Date(`${d}T12:00:00`).toLocaleDateString("pt-PT", { day: "numeric", month: mes });

export default function GraficoPreco({ serie, titulo }) {
  const [ativo, setAtivo] = useState(null);
  const ref = useRef(null);
  if (!serie || serie.length < 7) return null; // menos de uma semana não é tendência nenhuma

  const valores = serie.map(p => p.media);
  let lo = Math.min(...valores), hi = Math.max(...valores);
  const folga = Math.max((hi - lo) * 0.15, 0.01); // nunca uma linha colada ao topo ou ao fundo
  lo -= folga; hi += folga;
  const w = L - M.left - M.right, h = A - M.top - M.bottom;
  const x = (i) => M.left + (serie.length === 1 ? w / 2 : (i / (serie.length - 1)) * w);
  const y = (v) => M.top + (1 - (v - lo) / (hi - lo)) * h;
  const caminho = serie.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.media).toFixed(1)}`).join("");
  const area = `${caminho}L${x(serie.length - 1).toFixed(1)},${M.top + h}L${x(0).toFixed(1)},${M.top + h}Z`;
  const marcas = [lo + folga, (lo + hi) / 2, hi - folga];

  function mover(e) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * L;
    const i = Math.round(((px - M.left) / w) * (serie.length - 1));
    setAtivo(Math.min(serie.length - 1, Math.max(0, i)));
  }

  const p = ativo != null ? serie[ativo] : null;
  const primeiro = serie[0], ultimo = serie[serie.length - 1];
  const diff = Math.round((ultimo.media - primeiro.media) * 1000) / 10;

  return (
    <figure className="rounded-2xl p-4 mt-6" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", margin: 0 }}>
      <figcaption>
        <p className="font-display" style={{ fontSize: 17, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</p>
        <p className="pj-num" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>
          Média por litro, últimos {serie.length} dias ·{" "}
          {Math.abs(diff) < 0.5 ? "praticamente igual" : `${diff < 0 ? "desceu" : "subiu"} ${Math.abs(diff).toFixed(1).replace(".", ",")} cênt.`} desde {fmtDia(primeiro.dia)}
        </p>
      </figcaption>

      {/* Leitura do dia: fora do gráfico, para não tapar nada. Sem toque,
          mostra o último dia; ao passar o dedo, o dia apontado. */}
      <p className="pj-num" role="status" style={{ fontSize: 12.5, color: "var(--pj-text)", marginTop: 10, minHeight: 18 }}>
        <strong style={{ fontWeight: 600 }}>{fmtDia((p || ultimo).dia, "long")}</strong>
        {" · "}média €{eur((p || ultimo).media, 3)}
        <span style={{ color: "var(--pj-text-muted)" }}> · mais barato €{eur((p || ultimo).minimo, 3)}</span>
      </p>

      <div style={{ position: "relative", marginTop: 4 }}>
        <svg ref={ref} viewBox={`0 0 ${L} ${A}`} width="100%" role="img"
          aria-label={`${titulo}: de €${eur(primeiro.media, 3)} a ${fmtDia(primeiro.dia, "long")} para €${eur(ultimo.media, 3)} a ${fmtDia(ultimo.dia, "long")}`}
          style={{ display: "block", touchAction: "pan-y", color: "var(--pj-brand-ink)" }}
          onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setAtivo(null)}>
          {marcas.map((v, i) => (
            <g key={i}>
              <line x1={M.left} x2={L - M.right} y1={y(v)} y2={y(v)} stroke="var(--pj-border)" strokeWidth="1" />
              <text x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--pj-text-faint)" className="pj-num">€{eur(v, 3)}</text>
            </g>
          ))}
          <text x={M.left} y={A - 6} fontSize="10" fill="var(--pj-text-faint)">{fmtDia(primeiro.dia)}</text>
          <text x={L - M.right} y={A - 6} fontSize="10" fill="var(--pj-text-faint)" textAnchor="end">{fmtDia(ultimo.dia)}</text>

          <path d={area} fill="currentColor" opacity="0.08" />
          <path d={caminho} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* O último ponto, para se ver onde a linha acaba */}
          <circle cx={x(serie.length - 1)} cy={y(ultimo.media)} r="4" fill="currentColor" stroke="var(--pj-card)" strokeWidth="2" />

          {p && (
            <g>
              <line x1={x(ativo)} x2={x(ativo)} y1={M.top} y2={M.top + h} stroke="var(--pj-text-faint)" strokeWidth="1" />
              <circle cx={x(ativo)} cy={y(p.media)} r="5" fill="currentColor" stroke="var(--pj-card)" strokeWidth="2" />
            </g>
          )}
        </svg>

      </div>

      <details style={{ marginTop: 8 }}>
        <summary className="pj-tap" style={{ fontSize: 12, color: "var(--pj-text-muted)", cursor: "pointer" }}>Ver os valores</summary>
        <table className="pj-num" style={{ width: "100%", fontSize: 12, marginTop: 6, borderCollapse: "collapse", color: "var(--pj-text)" }}>
          <thead>
            <tr style={{ color: "var(--pj-text-faint)", textAlign: "left" }}><th style={{ fontWeight: 600 }}>Dia</th><th style={{ fontWeight: 600, textAlign: "right" }}>Média</th><th style={{ fontWeight: 600, textAlign: "right" }}>Mais barato</th></tr>
          </thead>
          <tbody>
            {serie.slice().reverse().map(l => (
              <tr key={l.dia} style={{ borderTop: "1px solid var(--pj-subtle)" }}>
                <td style={{ padding: "4px 0" }}>{fmtDia(l.dia)}</td>
                <td style={{ textAlign: "right" }}>€{eur(l.media, 3)}</td>
                <td style={{ textAlign: "right" }}>€{eur(l.minimo, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
