import { useState } from "react";
import { Receipt, Tag, ShieldCheck, ArrowRight, Fuel } from "lucide-react";

const PASSOS = [
  {
    icon: Receipt,
    emoji: "🧾",
    titulo: "Fotografa o talão,\nnós fazemos as contas",
    sub: "Tira uma foto ao talão do supermercado e o PoupeJá lê os produtos e quanto poupaste — automaticamente.",
  },
  {
    icon: Fuel,
    emoji: "⛽",
    titulo: "Combustíveis, postos EV\ne folhetos num só sítio",
    sub: "Preços reais perto de ti, postos de carregamento com disponibilidade em tempo real e os folhetos de todos os supermercados.",
  },
  {
    icon: ShieldCheck,
    emoji: "🛡️",
    titulo: "Garantias digitais,\nnunca mais percas uma",
    sub: "Guarda os talões das compras grandes e recebe avisos antes de a garantia expirar. Grátis, para sempre.",
  },
]; // (campo `icon` mantido para uso futuro; ilustração atual usa `emoji`)

export default function Onboarding({ onConcluido }) {
  const [passo, setPasso] = useState(0);
  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  function avancar() {
    if (ultimo) onConcluido();
    else setPasso(passo + 1);
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#f6f5f0" }}>
      {/* Saltar */}
      <div className="flex justify-end px-5 pt-12">
        <button onClick={onConcluido} className="press pj-tap text-[13px] font-semibold px-3 py-1.5" style={{ color: "#8a978e" }}>
          Saltar
        </button>
      </div>

      {/* Ilustração */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          key={passo}
          className="w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 anim-up"
          style={{ background: "#eeece4", border: "1px solid #e4e2d8" }}
        >
          <span style={{ fontSize: 52 }}>{p.emoji}</span>
        </div>

        <h1
          key={`t-${passo}`}
          className="font-display text-[26px] leading-tight whitespace-pre-line anim-up"
          style={{ color: "#14231c", fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          {p.titulo}
        </h1>
        <p key={`s-${passo}`} className="text-[14px] leading-relaxed mt-4 max-w-xs anim-up" style={{ color: "#5c6b62" }}>
          {p.sub}
        </p>
      </div>

      {/* Dots + CTA */}
      <div className="px-6 pb-12 flex flex-col items-center gap-6" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom, 1rem) + 2rem)" }}>
        <div className="flex gap-2">
          {PASSOS.map((_, i) => (
            <div
              key={i}
              className="pj-tap rounded-full transition-all duration-300"
              style={{
                width: i === passo ? 24 : 8,
                height: 8,
                background: i === passo ? "#0b6b4f" : "#e4e2d8",
              }}
            />
          ))}
        </div>

        <button
          onClick={avancar}
          className="press pj-tap w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2"
          style={{ background: "#0b6b4f" }}
        >
          {ultimo ? "Começar a poupar" : "Seguinte"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
