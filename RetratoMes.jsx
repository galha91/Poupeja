import { useState } from "react";
import { X, Share2, Receipt, Flame, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { marcarRetratoVisto } from "./lib/retrato";
import { evento } from "./lib/analytics";

/*
 * Retrato do mês — modal "Wrapped" com os números reais do mês anterior
 * e partilha de 1 toque (link /p com cartão OG dinâmico).
 */
export default function RetratoMes({ retrato, onFechar }) {
  const [feedback, setFeedback] = useState("");
  if (!retrato) return null;
  const { mes, total, nTaloes, melhorPoupanca, tendencia, streak, desafio } = retrato;
  const totalFmt = total.toFixed(2).replace(".", ",");

  function fechar() {
    marcarRetratoVisto(mes.chave);
    onFechar();
  }

  async function partilhar() {
    evento("share", { content_type: "retrato" });
    let ref = "";
    try { ref = localStorage.getItem("poupeja_uid") || ""; } catch {}
    const url = `https://poupejá.com/p?v=retrato&mes=${encodeURIComponent(mes.nome)}&total=${total.toFixed(2)}&taloes=${nTaloes}&streak=${streak}${ref ? `&ref=${ref}` : ""}`;
    const texto = `O meu retrato de ${mes.nome} no PoupeJá 🐷 €${totalFmt} poupados · ${nTaloes} tal${nTaloes !== 1 ? "ões" : "ão"}${streak >= 2 ? ` · ${streak} semanas seguidas` : ""}. Vê o teu:`;
    if (navigator.share) {
      try { await navigator.share({ title: "PoupeJá", text: texto, url }); return; }
      catch (e) { if (e?.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      setFeedback("Link copiado ✓");
      setTimeout(() => setFeedback(""), 2500);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.6)", backdropFilter: "blur(4px)" }} onClick={fechar}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden" style={{ maxHeight: "92vh", overflowY: "auto", background: "#0b6b4f" }} onClick={e => e.stopPropagation()}>

        {/* Cartão principal — verde profundo, número gigante */}
        <div className="px-7 pt-8 pb-6 text-center relative">
          <button onClick={fechar} aria-label="Fechar" className="pj-tap absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <X size={16} className="text-white" />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#a7cbbb" }}>🎁 O teu retrato de</p>
          <p className="font-display capitalize text-white" style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}>{mes.nome}</p>
          <div className="font-display text-white flex items-baseline justify-center" style={{ fontSize: 76, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: 18 }}>
            <span style={{ fontSize: 36, color: "#a7cbbb", marginRight: 4, fontWeight: 400 }}>€</span>
            {Math.floor(total)}
            <span style={{ fontSize: 36, color: "#a7cbbb", fontWeight: 400 }}>,{String(Math.round((total % 1) * 100)).padStart(2, "0")}</span>
          </div>
          <p className="text-[13px] font-semibold mt-1" style={{ color: "#a7cbbb" }}>poupados num só mês</p>
          {tendencia != null && tendencia !== 0 && (
            <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }}>
              {tendencia > 0 ? <TrendingUp size={13} className="text-white" /> : <TrendingDown size={13} style={{ color: "#fbbf24" }} />}
              <span className="text-[12px] font-semibold text-white">{tendencia > 0 ? "+" : ""}{tendencia}% vs. mês anterior</span>
            </div>
          )}
        </div>

        {/* Estatísticas — painel claro */}
        <div className="rounded-t-3xl px-6 pt-6 pb-9" style={{ background: "#f6f5f0" }}>
          {(() => { const stats = [
              { Icon: Receipt, valor: String(nTaloes), rotulo: nTaloes !== 1 ? "talões" : "talão" },
              ...(streak >= 1 ? [{ Icon: Flame, valor: String(streak), rotulo: streak !== 1 ? "semanas seguidas" : "semana" }] : []),
              { Icon: TrendingUp, valor: `€${melhorPoupanca.toFixed(2).replace(".", ",")}`, rotulo: "melhor compra" },
            ]; return (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                <s.Icon size={16} className="mx-auto" style={{ color: "#0b6b4f" }} />
                <p className="font-display mt-1.5" style={{ fontSize: 20, fontWeight: 600, color: "#14231c" }}>{s.valor}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#8a978e" }}>{s.rotulo}</p>
              </div>
            ))}
          </div>
            ); })()}

          {desafio && (
            <div className="flex items-center gap-3 mt-4 rounded-2xl px-4 py-3" style={{ background: desafio.completo ? "#eef3ef" : "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <Trophy size={17} style={{ color: desafio.completo ? "#0b6b4f" : "#8a978e" }} />
              <p className="text-[12.5px] font-semibold flex-1" style={{ color: "#14231c" }}>
                {desafio.completo
                  ? <>Completaste o desafio “{desafio.nome}” {desafio.emoji}</>
                  : <>Desafio “{desafio.nome}”: €{total.toFixed(0)} de €{desafio.meta}</>}
              </p>
            </div>
          )}

          <button onClick={partilhar} className="pj-tap w-full py-4 mt-5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ background: "#0b6b4f" }}>
            <Share2 size={17} /> {feedback || "Partilhar o meu retrato"}
          </button>
          <button onClick={fechar} className="pj-tap w-full py-2.5 mt-2 font-semibold text-[13px]" style={{ color: "#8a978e" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
