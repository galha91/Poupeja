import { useEffect, useId, useState } from "react";
import { ChevronRight, ArrowRight, CalendarDays, UtensilsCrossed } from "lucide-react";

/*
 * O destaque das Ementas — para saltar à vista no Início da app e nas
 * páginas públicas. A faixa de azulejos é a mesma da cozinha interativa
 * (CozinhaInterativa.jsx): é a imagem de marca da secção.
 *
 * O selo "Novo" fica até a pessoa abrir as Ementas pela primeira vez
 * (SecaoEmentas marca LS_VISTO).
 */

export const LS_VISTO = "poupeja_ementas_visto";
const LS_PLANO = "poupeja_ementas_plano";

export function jaViuEmentas() {
  try { return !!localStorage.getItem(LS_VISTO); } catch { return true; }
}
export function marcarEmentasVistas() {
  try { localStorage.setItem(LS_VISTO, "1"); } catch {}
}

/* Faixa de azulejos azul-cobalto, em SVG (sem imagens). */
export function Azulejos({ altura = 28, opacidade = 1 }) {
  const id = `az${useId().replace(/:/g, "")}`;
  return (
    <svg width="100%" height={altura} aria-hidden="true" style={{ display: "block", opacity: opacidade }}>
      <defs>
        <pattern id={id} width={altura} height={altura} patternUnits="userSpaceOnUse" viewBox="0 0 30 30">
          <rect width="30" height="30" fill="#fbf8f1" />
          <path d="M15 4 C19 9 19 11 15 15 C11 11 11 9 15 4 Z M15 26 C11 21 11 19 15 15 C19 19 19 21 15 26 Z M4 15 C9 11 11 11 15 15 C11 19 9 19 4 15 Z M26 15 C21 19 19 19 15 15 C19 11 21 11 26 15 Z" fill="#2f5d9e" />
          <circle cx="15" cy="15" r="2.2" fill="#e3b341" />
          <path d="M0 0 L5 0 L0 5 Z M30 0 L25 0 L30 5 Z M0 30 L5 30 L0 25 Z M30 30 L25 30 L30 25 Z" fill="#2f5d9e" />
        </pattern>
      </defs>
      <rect width="100%" height={altura} fill={`url(#${id})`} />
    </svg>
  );
}

function SeloNovo() {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{ padding: "3px 8px", borderRadius: 8, background: "#e3b341", color: "#2a2208" }}>
      Novo
    </span>
  );
}

/*
 * Cartão grande do Início da app. Sem plano: o convite. Com plano: o
 * jantar de hoje (o mais útil a esta hora) e quantos dias faltam.
 * O motor das receitas só descarrega se houver plano — não pesa no arranque.
 */
export function CartaoEmentasInicio({ onAbrir }) {
  const [hoje, setHoje] = useState(null); // { r, n } | { semJantar, n } | null
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    setNovo(!jaViuEmentas());
    let plano = null;
    try { plano = JSON.parse(localStorage.getItem(LS_PLANO) || "null"); } catch {}
    if (!plano?.dias?.length) return;
    const dia = (new Date().getDay() + 6) % 7; // 0 = segunda
    const n = plano.dias.filter((d) => d.id).length;
    const entrada = plano.dias.find((d) => d.dia === dia && d.id);
    if (!entrada) { setHoje({ semJantar: true, n }); return; }
    import("./lib/receitas/motor")
      .then((m) => { const r = m.receitaPorId(entrada.id); setHoje(r ? { r, n, tempo: m.formatarTempo(r.tempoMin) } : { semJantar: true, n }); })
      .catch(() => {});
  }, []);

  const comPlano = !!hoje;
  return (
    <button onClick={onAbrir} className="pj-tap press w-full text-left anim-up overflow-hidden"
      style={{ marginTop: 14, borderRadius: 20, background: "var(--pj-brand)", border: 0, padding: 0, boxShadow: "0 8px 24px rgba(11,107,79,0.25)" }}>
      <Azulejos altura={26} />
      <span className="block" style={{ padding: "14px 16px 16px" }}>
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#a7cbbb" }}>
            {hoje?.r ? "Hoje ao jantar" : comPlano ? "O teu plano da semana" : "Ementas da semana"}
          </span>
          {novo && <SeloNovo />}
        </span>

        {hoje?.r ? (
          <span className="flex items-center gap-3 mt-2">
            <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 30, width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,0.12)" }}>{hoje.r.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="block font-display" style={{ fontSize: 19, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{hoje.r.nome}</span>
              <span className="block" style={{ fontSize: 12.5, color: "#d5e7de", marginTop: 3 }}>{hoje.tempo} · toca para cozinhar passo a passo</span>
            </span>
            <ChevronRight size={20} style={{ color: "#a7cbbb", flexShrink: 0 }} />
          </span>
        ) : comPlano ? (
          <span className="flex items-center gap-3 mt-2">
            <UtensilsCrossed size={26} aria-hidden="true" style={{ color: "#d5e7de", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <span className="block font-display" style={{ fontSize: 19, fontWeight: 600, color: "#fff" }}>Hoje não há jantar no plano</span>
              <span className="block" style={{ fontSize: 12.5, color: "#d5e7de", marginTop: 3 }}>{hoje.n} jantares planeados · ver ou gerar um novo</span>
            </span>
            <ChevronRight size={20} style={{ color: "#a7cbbb", flexShrink: 0 }} />
          </span>
        ) : (
          <>
            <span className="block font-display mt-1.5" style={{ fontSize: 21, fontWeight: 600, color: "#fff", lineHeight: 1.22 }}>
              O que é o jantar esta semana? Nós planeamos.
            </span>
            <span className="block" style={{ fontSize: 13, color: "#d5e7de", marginTop: 6, lineHeight: 1.45 }}>
              Liga os aparelhos que tens, diz o orçamento e o que não comes — sai o plano, a lista de compras e onde fica mais barata.
            </span>
            <span className="flex items-center justify-between mt-3.5" style={{ gap: 10 }}>
              <span style={{ fontSize: 12.5, color: "#d5e7de" }}>Grátis, sem criar conta</span>
              <span className="inline-flex items-center gap-1.5 flex-shrink-0"
                style={{ padding: "9px 14px", borderRadius: 12, background: "#fff", color: "var(--pj-brand-ink)", fontSize: 13.5, fontWeight: 700 }}>
                <CalendarDays size={15} /> Planear
              </span>
            </span>
          </>
        )}
      </span>
    </button>
  );
}

/*
 * Faixa para as páginas públicas (folhetos, combustíveis, apoios…):
 * leva direto ao planeador na app, que funciona sem conta.
 */
export function DestaqueEmentasPublico() {
  return (
    <a href="/?atalho=ementas" className="pj-tap block no-underline overflow-hidden mt-10"
      style={{ borderRadius: 22, background: "var(--pj-brand)", color: "#fff", boxShadow: "0 10px 28px rgba(11,107,79,0.22)" }}>
      <Azulejos altura={30} />
      <div style={{ padding: "18px 20px 20px" }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#a7cbbb" }}>Ementas da semana</span>
          <SeloNovo />
        </div>
        <p className="font-display" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2, marginTop: 8 }}>
          As ementas da semana, feitas à medida da tua casa
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 14, color: "#d5e7de", lineHeight: 1.7 }}>
          <li>✓ Liga os aparelhos que tens — da air fryer ao robô de cozinha</li>
          <li>✓ Orçamento, restrições e o que não comes</li>
          <li>✓ Lista de compras somada e preços reais nos supermercados</li>
        </ul>
        <div className="flex items-center justify-between mt-4" style={{ gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "#a7cbbb" }}>Mais de 100 receitas · grátis, sem conta</span>
          <span className="inline-flex items-center gap-1.5 flex-shrink-0"
            style={{ padding: "11px 16px", borderRadius: 14, background: "#fff", color: "var(--pj-brand-ink)", fontSize: 14, fontWeight: 700 }}>
            Criar o meu plano <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}
