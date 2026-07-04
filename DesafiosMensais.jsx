import { useState, useEffect } from "react";
import { Trophy, Flame, Share2, Swords, Lock, Sparkles, ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  calcularEstado, calcularConquistas, nivelAtual,
  partilharDesafio, desafiarAmigo, partilharConquista,
  lerDesafio52, alternarSemana52, semanaDoAno, partilharDesafio52,
} from "./lib/desafios";

export default function DesafiosMensais({ setTab }) {
  const [estado, setEstado] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [conquistaAberta, setConquistaAberta] = useState(null);
  const [estado52, setEstado52] = useState(null);
  const [aberto52, setAberto52] = useState(false);
  const [feedback52, setFeedback52] = useState("");

  useEffect(() => {
    setEstado(calcularEstado());
    setEstado52(lerDesafio52());
  }, []);

  if (!estado) return null;

  const { desafio, totalMes, progresso, completo, diasRestantes, streak } = estado;
  const conquistas = calcularConquistas(estado);
  const nFeitas = conquistas.filter(c => c.feito).length;
  const nivel = nivelAtual(estado.totalGeral);
  const pct = Math.round(progresso * 100);
  const semTaloes = estado.nTaloes === 0;

  async function comFeedback(fn, ...args) {
    const r = await fn(...args);
    if (r === "copiado") {
      setFeedback("Copiado ✓");
      setTimeout(() => setFeedback(""), 2500);
    }
  }

  return (
    <div className="px-4 anim-up anim-up-3">

      {/* ── Desafio do mês ── */}
      <div className="card p-5 relative overflow-hidden mb-3">
        <div
          className="absolute right-3 bottom-2 text-6xl opacity-[0.07] pointer-events-none select-none"
        >
          {desafio.emoji}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase flex items-center gap-1.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
              <Trophy size={11} /> Desafio do mês
            </p>
            {!completo && (
              <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ fontWeight: 600, background: "#eeece4", color: "#5c6b62" }}>
                {diasRestantes === 0 ? "Último dia!" : `Faltam ${diasRestantes} dias`}
              </span>
            )}
          </div>

          <p className="font-display leading-tight" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c", letterSpacing: "-0.01em" }}>
            {desafio.emoji} {desafio.nome}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#5c6b62" }}>
            {completo
              ? `Conseguiste! Poupaste €${totalMes.toFixed(2)} este mês 🎉`
              : `Poupa €${desafio.meta} nas compras até ao fim do mês`}
          </p>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-display text-[13px]" style={{ fontWeight: 600, color: "#14231c" }}>€{totalMes.toFixed(2)}</span>
              <span className="text-[11px]" style={{ fontWeight: 600, color: "#8a978e" }}>€{desafio.meta}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#e4e2d8" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(pct, 3)}%`, background: completo ? "#0b6b4f" : desafio.cor }}
              />
            </div>
            <p className="text-[10px] mt-1.5" style={{ fontWeight: 600, color: "#8a978e" }}>
              {completo ? "🏆 Desafio completo — partilha a tua vitória!" : `${pct}% — ${semTaloes ? "guarda o primeiro talão para começar" : "continua, estás no bom caminho!"}`}
            </p>
          </div>

          {/* Ações */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {semTaloes ? (
              <button
                onClick={() => setTab("taloes")}
                className="press pj-tap inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl"
                style={{ fontWeight: 600, background: desafio.cor, color: "#fff" }}
              >
                <Sparkles size={12} /> Começar agora
              </button>
            ) : (
              <button
                onClick={() => comFeedback(partilharDesafio, estado)}
                className="press pj-tap inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl"
                style={{ fontWeight: 600, background: desafio.cor, color: "#fff" }}
              >
                <Share2 size={12} /> {feedback || (completo ? "Partilhar vitória" : "Partilhar progresso")}
              </button>
            )}
            <button
              onClick={() => comFeedback(desafiarAmigo, estado)}
              className="press pj-tap inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl"
              style={{ fontWeight: 600, background: "#eeece4", color: "#5c6b62" }}
            >
              <Swords size={12} /> Desafiar um amigo
            </button>
          </div>

          {/* Dica */}
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "#8a978e" }}>💡 {desafio.dica}</p>
        </div>
      </div>

      {/* ── Streak + Nível ── */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: streak > 0 ? "#eaf1ec" : "#eeece4" }}
          >
            <Flame size={20} style={{ color: streak > 0 ? "#0b6b4f" : "#8a978e" }} />
          </div>
          <div>
            <p className="font-display leading-none" style={{ fontSize: "18px", fontWeight: 600, color: "#14231c" }}>{streak}</p>
            <p className="text-[10px] mt-0.5" style={{ fontWeight: 600, color: "#8a978e" }}>
              {streak === 1 ? "semana seguida" : "semanas seguidas"}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: "#eeece4" }}>
            {nivel.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] leading-tight truncate" style={{ fontWeight: 700, color: "#14231c" }}>{nivel.nome}</p>
            <p className="text-[10px] mt-0.5" style={{ fontWeight: 600, color: "#8a978e" }}>
              {nivel.proximo ? `€${(nivel.proximo.min - estado.totalGeral).toFixed(0)} p/ ${nivel.proximo.nome}` : "Nível máximo!"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Conquistas ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] flex items-center gap-1.5" style={{ fontWeight: 700, color: "#14231c" }}>
            <Trophy size={13} style={{ color: "#0b6b4f" }} /> Conquistas
          </p>
          <span className="text-[10px]" style={{ fontWeight: 700, color: "#8a978e" }}>{nFeitas}/{conquistas.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {conquistas.map(c => (
            <button
              key={c.id}
              onClick={() => setConquistaAberta(conquistaAberta === c.id ? null : c.id)}
              className="press pj-tap flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{ background: "#eeece4", opacity: c.feito ? 1 : 0.55 }}
            >
              <span className="text-xl" style={{ filter: c.feito ? "none" : "grayscale(1)" }}>
                {c.feito ? c.emoji : <Lock size={16} style={{ color: "#8a978e" }} className="mx-auto" />}
              </span>
              <span className="text-[8px] text-center leading-tight px-0.5" style={{ fontWeight: 700, color: c.feito ? "#0b6b4f" : "#8a978e" }}>
                {c.nome}
              </span>
            </button>
          ))}
        </div>

        {/* Detalhe da conquista selecionada */}
        {conquistaAberta && (() => {
          const c = conquistas.find(x => x.id === conquistaAberta);
          if (!c) return null;
          return (
            <div className="mt-3 p-3 rounded-xl flex items-center justify-between gap-2" style={{ background: "#eeece4" }}>
              <p className="text-[11px]" style={{ fontWeight: 600, color: "#5c6b62" }}>
                {c.emoji} <strong style={{ color: "#14231c" }}>{c.nome}</strong> — {c.desc} {c.feito ? "✓" : ""}
              </p>
              {c.feito && (
                <button
                  onClick={() => comFeedback(partilharConquista, c)}
                  className="press pj-tap flex-shrink-0 inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg"
                  style={{ fontWeight: 700, color: "#0b6b4f", background: "#eaf1ec" }}
                >
                  <Share2 size={10} /> Partilhar
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Desafio das 52 Semanas ── */}
      {estado52 && (
        <div className="card p-4 mt-3 overflow-hidden">
          <button
            onClick={() => setAberto52(a => !a)}
            className="press pj-tap w-full flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: "#eeece4" }}>💶</div>
              <div>
                <p className="text-[12px] leading-tight" style={{ fontWeight: 700, color: "#14231c" }}>Desafio das 52 Semanas</p>
                <p className="text-[10px] mt-0.5" style={{ fontWeight: 600, color: "#8a978e" }}>
                  {estado52.ativo
                    ? `€${estado52.total} de €1.378 · ${estado52.semanas.size}/52 semanas`
                    : "O desafio mais famoso de Portugal — €1.378 num ano"}
                </p>
              </div>
            </div>
            {aberto52 ? <ChevronUp size={16} style={{ color: "#8a978e" }} className="flex-shrink-0" /> : <ChevronDown size={16} style={{ color: "#8a978e" }} className="flex-shrink-0" />}
          </button>

          {aberto52 && (
            <div className="mt-4 anim-up">
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: "#5c6b62" }}>
                Semana 1 guarda <strong style={{ color: "#14231c" }}>€1</strong>, semana 2 guarda <strong style={{ color: "#14231c" }}>€2</strong>… semana 52 guarda <strong style={{ color: "#14231c" }}>€52</strong>.
                No fim do ano tens <strong style={{ color: "#14231c" }}>€1.378</strong> de lado. Toca nas semanas que já cumpriste:
              </p>

              {/* Barra */}
              <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "#e4e2d8" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max((estado52.total / 1378) * 100, estado52.total > 0 ? 2 : 0)}%`, background: "#0b6b4f" }}
                />
              </div>
              <p className="text-[10px] mb-3" style={{ fontWeight: 600, color: "#8a978e" }}>
                €{estado52.total} guardados · estamos na semana {semanaDoAno()} do ano
              </p>

              {/* Grelha 52 semanas */}
              <div className="grid grid-cols-9 gap-1 sm:gap-1.5 mb-4">
                {Array.from({ length: 52 }, (_, i) => i + 1).map(n => {
                  const feita = estado52.semanas.has(n);
                  const atual = n === semanaDoAno();
                  return (
                    <button
                      key={n}
                      onClick={() => setEstado52(alternarSemana52(n))}
                      className="press pj-tap aspect-square rounded-lg flex items-center justify-center text-[9px] transition-all"
                      style={{
                        fontWeight: 700,
                        background: feita ? "#0b6b4f" : atual ? "#eaf1ec" : "#eeece4",
                        color: feita ? "#fff" : atual ? "#0b6b4f" : "#8a978e",
                        border: atual && !feita ? "1.5px solid #0b6b4f" : "1.5px solid transparent",
                      }}
                    >
                      {feita ? <Check size={11} strokeWidth={3.5} /> : n}
                    </button>
                  );
                })}
              </div>

              {estado52.ativo && (
                <button
                  onClick={async () => {
                    const r = await partilharDesafio52(estado52);
                    if (r === "copiado") { setFeedback52("Copiado ✓"); setTimeout(() => setFeedback52(""), 2500); }
                  }}
                  className="press pj-tap w-full inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 rounded-xl"
                  style={{ fontWeight: 700, background: "#0b6b4f", color: "#fff" }}
                >
                  <Share2 size={12} /> {feedback52 || "Partilhar o meu progresso"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-center mt-4" style={{ color: "#8a978e" }}>
        Tudo calculado a partir dos teus talões. Guarda talões para subir de nível 🚀
      </p>
    </div>
  );
}
