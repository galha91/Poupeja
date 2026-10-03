import React from "react";
import { ShieldCheck, Bell, X, ChevronRight, RefreshCw, CalendarClock } from "lucide-react";

/*
 * O sino: garantias a acabar, contas a renovar e prazos do Estado com
 * lembrete (ver lib/avisos). Tocar num aviso abre o ecrã de onde ele vem.
 */
const TIPO = {
  garantia: { Icone: ShieldCheck,   rotulo: "Garantia a acabar" },
  conta:    { Icone: RefreshCw,     rotulo: "Conta a renovar" },
  prazo:    { Icone: CalendarClock, rotulo: "Prazo a chegar" },
};

function quando(a) {
  if (a.dias === 0) return "Hoje";
  if (a.dias === 1) return "Amanhã";
  return `Daqui a ${a.dias} dias`;
}

export default function PainelAvisos({ avisos = [], onFechar, onAbrir }) {
  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(20,35,28,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Avisos"
        className="mt-auto rounded-t-3xl max-h-[80vh] overflow-y-auto no-scrollbar"
        style={{ background: "var(--pj-card)" }}
      >
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between rounded-t-3xl"
          style={{ background: "var(--pj-card)", borderBottom: "1px solid var(--pj-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
              <Bell size={16} style={{ color: "var(--pj-brand-ink)" }} />
            </div>
            <p className="font-display text-base" style={{ fontWeight: 600, color: "var(--pj-text)" }}>Avisos</p>
            {avisos.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--pj-danger)", color: "#fff" }}>
                {avisos.length}
              </span>
            )}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="press pj-tap rounded-xl flex items-center justify-center"
            style={{ width: 44, height: 44, background: "var(--pj-subtle)" }}
          >
            <X size={16} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-2">
          {avisos.map(a => {
            const t = TIPO[a.tipo] || TIPO.prazo;
            const urgente = a.dias <= 14;
            const cor = urgente ? "var(--pj-danger)" : "var(--pj-brand-ink)";
            return (
              <button
                key={a.id}
                onClick={() => onAbrir?.(a)}
                className="press pj-tap w-full text-left rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", minHeight: 64 }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
                  <t.Icone size={20} style={{ color: cor }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12, fontWeight: 600, color: cor }}>{t.rotulo}</p>
                  <p className="text-sm leading-snug mt-0.5 truncate" style={{ fontWeight: 600, color: "var(--pj-text)" }}>{a.titulo}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>{quando(a)}</p>
                </div>
                <ChevronRight size={15} className="flex-shrink-0" style={{ color: "var(--pj-text-faint)" }} aria-hidden="true" />
              </button>
            );
          })}

          {avisos.length === 0 && (
            <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ border: "1px solid var(--pj-border)" }}>
              <Bell size={26} className="mb-2" style={{ color: "var(--pj-text-faint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--pj-text-muted)" }}>Nada por agora</p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>
                Avisamos aqui antes de uma garantia acabar, de uma conta renovar ou de um prazo do Estado com lembrete.
              </p>
            </div>
          )}

          <p className="text-[11px] text-center pt-2 pb-1 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>
            Para seres avisado com a app fechada, usa "Adicionar ao calendário" em cada lembrete.
          </p>
        </div>
      </div>
    </div>
  );
}
