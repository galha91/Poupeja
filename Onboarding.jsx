import { useState } from "react";
import { Receipt, Tag, ShieldCheck, ArrowRight, Fuel } from "lucide-react";

const PASSOS = [
  {
    icon: Receipt,
    emoji: "🧾",
    titulo: "Fotografa o talão,\nnós fazemos as contas",
    sub: "Tira uma foto ao talão do supermercado e o PoupeJá lê os produtos e quanto poupaste — automaticamente.",
    grad: "linear-gradient(160deg,#064e3b 0%,#059669 60%,#34d399 100%)",
  },
  {
    icon: Fuel,
    emoji: "⛽",
    titulo: "Combustíveis, postos EV\ne folhetos num só sítio",
    sub: "Preços reais perto de ti, postos de carregamento com disponibilidade em tempo real e os folhetos de todos os supermercados.",
    grad: "linear-gradient(160deg,#1e3a8a 0%,#2563eb 60%,#60a5fa 100%)",
  },
  {
    icon: ShieldCheck,
    emoji: "🛡️",
    titulo: "Garantias digitais,\nnunca mais percas uma",
    sub: "Guarda os talões das compras grandes e recebe avisos antes de a garantia expirar. Grátis, para sempre.",
    grad: "linear-gradient(160deg,#5b21b6 0%,#7c3aed 60%,#a78bfa 100%)",
  },
];

export default function Onboarding({ onConcluido }) {
  const [passo, setPasso] = useState(0);
  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  function avancar() {
    if (ultimo) onConcluido();
    else setPasso(passo + 1);
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: p.grad }}>
      {/* Saltar */}
      <div className="flex justify-end px-5 pt-12">
        <button onClick={onConcluido} className="press text-white/60 text-[13px] font-bold px-3 py-1.5">
          Saltar
        </button>
      </div>

      {/* Ilustração */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          key={passo}
          className="w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 anim-up"
          style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
        >
          <span style={{ fontSize: 52 }}>{p.emoji}</span>
        </div>

        <h1 key={`t-${passo}`} className="text-[26px] font-black text-white leading-tight whitespace-pre-line anim-up">
          {p.titulo}
        </h1>
        <p key={`s-${passo}`} className="text-white/75 text-[14px] leading-relaxed mt-4 max-w-xs anim-up">
          {p.sub}
        </p>
      </div>

      {/* Dots + CTA */}
      <div className="px-6 pb-12 flex flex-col items-center gap-6" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom, 1rem) + 2rem)" }}>
        <div className="flex gap-2">
          {PASSOS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === passo ? 24 : 8,
                height: 8,
                background: i === passo ? "#ffffff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>

        <button
          onClick={avancar}
          className="press w-full max-w-xs py-4 rounded-2xl bg-white font-black text-[15px] flex items-center justify-center gap-2"
          style={{ color: "#0f172a" }}
        >
          {ultimo ? "Começar a poupar" : "Seguinte"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
