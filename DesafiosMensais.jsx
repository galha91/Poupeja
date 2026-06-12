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
      <div
        className="rounded-3xl p-5 relative overflow-hidden mb-3"
        style={{
          background: `linear-gradient(135deg,${desafio.cor}ee,${desafio.cor})`,
          boxShadow: `0 20px 50px -15px ${desafio.cor}66`,
        }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-4 bottom-3 text-6xl opacity-15 pointer-events-none select-none">{desafio.emoji}</div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={11} /> Desafio do mês
            </p>
            {!completo && (
              <span className="text-[10px] font-black text-white/80 bg-white/15 px-2.5 py-1 rounded-full">
                {diasRestantes === 0 ? "Último dia!" : `Faltam ${diasRestantes} dias`}
              </span>
            )}
          </div>

          <p className="text-xl font-black text-white leading-tight">{desafio.emoji} {desafio.nome}</p>
          <p className="text-[12px] text-white/75 mt-1">
            {completo
              ? `Conseguiste! Poupaste €${totalMes.toFixed(2)} este mês 🎉`
              : `Poupa €${desafio.meta} nas compras até ao fim do mês`}
          </p>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-white">€{totalMes.toFixed(2)}</span>
              <span className="text-[11px] font-bold text-white/60">€{desafio.meta}</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(pct, 3)}%`, background: completo ? "#fbbf24" : "rgba(255,255,255,0.9)" }}
              />
            </div>
            <p className="text-[10px] text-white/60 mt-1.5 font-bold">
              {completo ? "🏆 Desafio completo — partilha a tua vitória!" : `${pct}% — ${semTaloes ? "guarda o primeiro talão para começar" : "continua, estás no bom caminho!"}`}
            </p>
          </div>

          {/* Ações */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {semTaloes ? (
              <button
                onClick={() => setTab("taloes")}
                className="press inline-flex items-center gap-1.5 bg-white text-xs font-black px-4 py-2 rounded-xl"
                style={{ color: desafio.cor }}
              >
                <Sparkles size={12} /> Começar agora
              </button>
            ) : (
              <button
                onClick={() => comFeedback(partilharDesafio, estado)}
                className="press inline-flex items-center gap-1.5 bg-white text-xs font-black px-4 py-2 rounded-xl"
                style={{ color: desafio.cor }}
              >
                <Share2 size={12} /> {feedback || (completo ? "Partilhar vitória" : "Partilhar progresso")}
              </button>
            )}
            <button
              onClick={() => comFeedback(desafiarAmigo, estado)}
              className="press inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-black px-3.5 py-2 rounded-xl border border-white/20"
            >
              <Swords size={12} /> Desafiar um amigo
            </button>
          </div>

          {/* Dica */}
          <p className="text-[10px] text-white/55 mt-3 leading-relaxed">💡 {desafio.dica}</p>
        </div>
      </div>

      {/* ── Streak + Nível ── */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: streak > 0 ? "#fff7ed" : "#f8fafc" }}
          >
            <Flame size={20} className={streak > 0 ? "text-orange-500" : "text-slate-300"} />
          </div>
          <div>
            <p className="text-lg font-black text-slate-800 leading-none">{streak}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {streak === 1 ? "semana seguida" : "semanas seguidas"}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-lg">
            {nivel.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-slate-800 leading-tight truncate">{nivel.nome}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {nivel.proximo ? `€${(nivel.proximo.min - estado.totalGeral).toFixed(0)} p/ ${nivel.proximo.nome}` : "Nível máximo!"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Conquistas ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-500" /> Conquistas
          </p>
          <span className="text-[10px] font-black text-slate-400">{nFeitas}/{conquistas.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {conquistas.map(c => (
            <button
              key={c.id}
              onClick={() => setConquistaAberta(conquistaAberta === c.id ? null : c.id)}
              className="press flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
              style={{ background: c.feito ? "#fffbeb" : "#f8fafc", opacity: c.feito ? 1 : 0.55 }}
            >
              <span className="text-xl" style={{ filter: c.feito ? "none" : "grayscale(1)" }}>
                {c.feito ? c.emoji : <Lock size={16} className="text-slate-300 mx-auto" />}
              </span>
              <span className={`text-[8px] font-black text-center leading-tight px-0.5 ${c.feito ? "text-amber-700" : "text-slate-400"}`}>
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
            <div className="mt-3 p-3 rounded-xl flex items-center justify-between gap-2" style={{ background: c.feito ? "#fffbeb" : "#f8fafc" }}>
              <p className="text-[11px] font-bold text-slate-600">
                {c.emoji} <strong>{c.nome}</strong> — {c.desc} {c.feito ? "✓" : ""}
              </p>
              {c.feito && (
                <button
                  onClick={() => comFeedback(partilharConquista, c)}
                  className="press flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2.5 py-1.5 rounded-lg"
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
            className="press w-full flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-base">💶</div>
              <div>
                <p className="text-[12px] font-black text-slate-800 leading-tight">Desafio das 52 Semanas</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {estado52.ativo
                    ? `€${estado52.total} de €1.378 · ${estado52.semanas.size}/52 semanas`
                    : "O desafio mais famoso de Portugal — €1.378 num ano"}
                </p>
              </div>
            </div>
            {aberto52 ? <ChevronUp size={16} className="text-slate-300 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-300 flex-shrink-0" />}
          </button>

          {aberto52 && (
            <div className="mt-4 anim-up">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Semana 1 guarda <strong>€1</strong>, semana 2 guarda <strong>€2</strong>… semana 52 guarda <strong>€52</strong>.
                No fim do ano tens <strong>€1.378</strong> de lado. Toca nas semanas que já cumpriste:
              </p>

              {/* Barra */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max((estado52.total / 1378) * 100, estado52.total > 0 ? 2 : 0)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mb-3">
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
                      className="press aspect-square rounded-lg flex items-center justify-center text-[9px] font-black transition-all"
                      style={{
                        background: feita ? "#10b981" : atual ? "#d1fae5" : "#f1f5f9",
                        color: feita ? "#fff" : atual ? "#059669" : "#94a3b8",
                        border: atual && !feita ? "1.5px solid #10b981" : "1.5px solid transparent",
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
                  className="press w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-xl"
                >
                  <Share2 size={12} /> {feedback52 || "Partilhar o meu progresso"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center mt-4">
        Tudo calculado a partir dos teus talões. Guarda talões para subir de nível 🚀
      </p>
    </div>
  );
}
