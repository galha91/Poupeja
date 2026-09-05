import React from "react";
import { ShieldCheck, Bell, Tag, X, Lightbulb, ChevronRight } from "lucide-react";

export default function PainelAvisos({ avisos = {}, onFechar, onAbrirTaloes }) {
  const garantias = avisos.garantias || [];

  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(20,35,28,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="mt-auto rounded-t-3xl max-h-[80vh] overflow-y-auto no-scrollbar"
        style={{ background: "var(--pj-card)" }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between rounded-t-3xl"
          style={{ background: "var(--pj-card)", borderBottom: "1px solid var(--pj-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
              <Bell size={16} style={{ color: "var(--pj-brand-ink)" }} />
            </div>
            <p className="font-display text-base" style={{ fontWeight: 600, color: "var(--pj-text)" }}>Avisos</p>
            {garantias.length > 0 && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#cf5a3c", color: "#fff" }}
              >
                {garantias.length}
              </span>
            )}
          </div>
          <button
            onClick={onFechar}
            className="press pj-tap w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--pj-subtle)" }}
          >
            <X size={15} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">

          {/* Garantias urgentes */}
          {garantias.map((g, i) => {
            const urgente = g.restam <= 14;
            const cor = urgente ? "#cf5a3c" : "#0b6b4f";
            return (
              <button
                key={i}
                onClick={onAbrirTaloes}
                className="press pj-tap w-full text-left rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "var(--pj-card)", border: `1px solid ${urgente ? "rgba(207,90,60,0.35)" : "var(--pj-border)"}` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: urgente ? "rgba(207,90,60,0.12)" : "var(--pj-subtle)" }}
                >
                  <ShieldCheck size={20} style={{ color: cor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: cor }}>
                    Garantia a terminar
                  </p>
                  <p className="font-display text-sm leading-snug mt-0.5" style={{ fontWeight: 600, color: "var(--pj-text)" }}>
                    {g.produto}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>
                    {g.restam === 0 ? "Acaba hoje" : `Acaba daqui a ${g.restam} dias`}
                  </p>
                </div>
                <ChevronRight size={15} className="flex-shrink-0" style={{ color: "var(--pj-text-faint)" }} />
              </button>
            );
          })}

          {/* Tip folhetos */}
          <div className="rounded-2xl p-4 flex gap-3" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
              <Lightbulb size={17} style={{ color: "var(--pj-brand-ink)" }} />
            </div>
            <div>
              <p className="uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Dica</p>
              <p className="text-sm font-semibold mt-0.5 leading-relaxed" style={{ color: "var(--pj-text-muted)" }}>
                Compara os folhetos antes de ir às compras e poupa nos artigos da semana.
              </p>
            </div>
          </div>

          {/* Novidade */}
          <div className="rounded-2xl p-4 flex gap-3" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
              <Tag size={17} style={{ color: "var(--pj-brand-ink)" }} />
            </div>
            <div>
              <p className="uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Novidade</p>
              <p className="text-sm font-semibold mt-0.5 leading-relaxed" style={{ color: "var(--pj-text-muted)" }}>
                Já podes guardar talões de compras e garantias na secção "Os meus talões".
              </p>
            </div>
          </div>

          {/* Estado vazio */}
          {garantias.length === 0 && (
            <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <ShieldCheck size={28} className="mb-2" style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text-muted)" }}>Sem garantias a terminar</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>Avisamos-te quando alguma estiver perto do fim.</p>
            </div>
          )}

          <p className="text-[10px] text-center pb-2" style={{ color: "var(--pj-text-faint)" }}>
            As notificações automáticas chegam com a app instalável.
          </p>
        </div>
      </div>
    </div>
  );
}
