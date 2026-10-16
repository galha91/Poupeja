import { useId, useMemo } from "react";
import { contarCompativeis } from "./lib/receitas/motor";

/*
 * "Liga o que tens" — uma cozinha portuguesa desenhada à mão (SVG, sem
 * imagens), com azulejos na parede. Cada aparelho é um interruptor:
 * desligado fica cinzento; ligado ganha cor e vida (chama no fogão, luz
 * no forno, visor na air fryer, a varinha a vibrar). Ao lado de cada
 * aparelho desligado diz-se quantas receitas ele desbloqueia.
 *
 * Os botões por baixo fazem o mesmo que tocar no desenho: servem quem
 * usa leitor de ecrã ou teclado, e quem prefere ler a apontar.
 */

const APARELHOS = [
  { id: "fogao", nome: "Fogão" },
  { id: "forno", nome: "Forno" },
  { id: "airfryer", nome: "Air fryer" },
  { id: "varinha", nome: "Varinha" },
];

function total(prefs) {
  const c = contarCompativeis(prefs);
  return c.pratos + (prefs.sopa ? c.sopas : 0);
}

function Aparelho({ id, ligado, onToggle, nome, children }) {
  const tecla = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); }
  };
  return (
    <g role="button" tabIndex={0} aria-pressed={ligado} aria-label={`${nome}: ${ligado ? "ligado" : "desligado"}`}
      onClick={() => onToggle(id)} onKeyDown={tecla}
      className={`pj-ap ${ligado ? "pj-ap-on" : ""}`} style={{ cursor: "pointer" }}>
      {children}
    </g>
  );
}

function Led({ x, y, ligado }) {
  return <circle cx={x} cy={y} r="3.2" fill={ligado ? "#3ddc84" : "#9a9a92"} className={ligado ? "pj-led" : ""} />;
}

export default function CozinhaInterativa({ prefs, onChange }) {
  const uid = useId().replace(/:/g, "");
  const equip = prefs.equip;
  const on = (id) => equip.includes(id);
  const alternar = (id) => onChange(on(id) ? equip.filter((e) => e !== id) : [...equip, id]);

  const agora = useMemo(() => total(prefs), [prefs]);
  const ganho = useMemo(() => Object.fromEntries(APARELHOS.map((a) => [
    a.id, on(a.id) ? 0 : total({ ...prefs, equip: [...equip, a.id] }) - agora,
  ])), [prefs, agora]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <style>{`
        .pj-ap { transition: filter .35s, opacity .35s; filter: grayscale(1); opacity: .62; outline: none; }
        .pj-ap-on { filter: none; opacity: 1; }
        .pj-ap:focus-visible { filter: drop-shadow(0 0 3px #0b6b4f) drop-shadow(0 0 1px #0b6b4f); opacity: 1; }
        .pj-ap .pj-so-on { opacity: 0; transition: opacity .3s; }
        .pj-ap-on .pj-so-on { opacity: 1; }
        .pj-ap-on .pj-chama { animation: pj-chama .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
        .pj-ap-on .pj-vapor { animation: pj-vapor 2.4s ease-out infinite; }
        .pj-ap-on .pj-vapor:nth-of-type(2) { animation-delay: .8s; }
        .pj-ap-on .pj-vapor:nth-of-type(3) { animation-delay: 1.6s; }
        .pj-ap-on .pj-brilho { animation: pj-brilho 1.8s ease-in-out infinite; }
        .pj-ap-on .pj-vibra { animation: pj-vibra .12s linear infinite; }
        .pj-ap-on .pj-gira { animation: pj-gira 1s linear infinite; transform-box: fill-box; transform-origin: center; }
        .pj-led { animation: pj-brilho 1.4s ease-in-out infinite; }
        @keyframes pj-chama { from { transform: scaleY(.8) } to { transform: scaleY(1.15) } }
        @keyframes pj-vapor { 0% { opacity: 0; transform: translateY(6px) } 30% { opacity: .7 } 100% { opacity: 0; transform: translateY(-22px) } }
        @keyframes pj-brilho { 0%,100% { opacity: .75 } 50% { opacity: 1 } }
        @keyframes pj-vibra { 0% { transform: translateX(-.6px) } 50% { transform: translateX(.6px) } 100% { transform: translateX(-.6px) } }
        @keyframes pj-gira { to { transform: rotate(360deg) } }
        @keyframes pj-salta { 0% { transform: scale(1) } 40% { transform: scale(1.12) } 100% { transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) {
          .pj-ap-on .pj-chama, .pj-ap-on .pj-vapor, .pj-ap-on .pj-brilho, .pj-ap-on .pj-vibra, .pj-ap-on .pj-gira, .pj-led { animation: none; }
          .pj-ap-on .pj-vapor { opacity: .5; }
        }
      `}</style>

      {/* Contador vivo */}
      <div className="flex items-baseline gap-2 mb-3" aria-live="polite">
        <span key={agora} className="font-display tabular-nums" style={{ fontSize: 30, fontWeight: 600, color: agora ? "var(--pj-brand-ink)" : "var(--pj-danger)", display: "inline-block", animation: "pj-salta .35s" }}>
          {agora}
        </span>
        <span style={{ fontSize: 14, color: "var(--pj-text-muted)" }}>receita{agora !== 1 ? "s" : ""} com o que tens ligado</span>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--pj-border)", background: "#f6f0e2" }}>
        <svg viewBox="0 0 360 300" width="100%" style={{ display: "block" }} aria-label="Cozinha: toca nos aparelhos que tens">
          <defs>
            {/* Azulejo: flor de quatro pétalas em azul cobalto */}
            <pattern id={`az${uid}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#fbf8f1" />
              <rect width="30" height="30" fill="none" stroke="#d9d2c2" strokeWidth="0.8" />
              <path d="M15 4 C19 9 19 11 15 15 C11 11 11 9 15 4 Z M15 26 C11 21 11 19 15 15 C19 19 19 21 15 26 Z M4 15 C9 11 11 11 15 15 C11 19 9 19 4 15 Z M26 15 C21 19 19 19 15 15 C19 11 21 11 26 15 Z" fill="#2f5d9e" />
              <circle cx="15" cy="15" r="2.2" fill="#e3b341" />
              <path d="M0 0 L5 0 L0 5 Z M30 0 L25 0 L30 5 Z M0 30 L5 30 L0 25 Z M30 30 L25 30 L30 25 Z" fill="#2f5d9e" />
            </pattern>
            <linearGradient id={`fn${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffcf6b" />
              <stop offset="1" stopColor="#ff7a2f" />
            </linearGradient>
          </defs>

          {/* Parede de azulejos e prateleira */}
          <rect x="0" y="0" width="360" height="200" fill={`url(#az${uid})`} />
          <rect x="0" y="0" width="360" height="200" fill="#f6f0e2" opacity="0.18" />
          <rect x="196" y="58" width="150" height="7" rx="2" fill="#a77b4f" />
          <rect x="206" y="36" width="16" height="22" rx="3" fill="#c96f3b" />
          <rect x="228" y="40" width="14" height="18" rx="3" fill="#e9d9b8" stroke="#b9a37c" />
          <circle cx="268" cy="48" r="10" fill="#7a9a4b" />
          <rect x="262" y="48" width="12" height="10" rx="2" fill="#b0623b" />
          {/* Panos de cozinha / louça pendurada */}
          <rect x="300" y="65" width="2" height="14" fill="#8b6b4a" />
          <circle cx="301" cy="92" r="13" fill="#5f6f7a" stroke="#3f4a52" strokeWidth="2" />

          {/* Bancada e armários */}
          <rect x="0" y="200" width="360" height="12" fill="#b88a5b" />
          <rect x="0" y="212" width="360" height="88" fill="#e7ddc9" />
          <rect x="185" y="220" width="80" height="72" rx="4" fill="#ddd1b8" stroke="#c9bb9d" />
          <rect x="272" y="220" width="80" height="72" rx="4" fill="#ddd1b8" stroke="#c9bb9d" />
          <rect x="220" y="250" width="10" height="3" rx="1.5" fill="#9b8a6a" />
          <rect x="306" y="250" width="10" height="3" rx="1.5" fill="#9b8a6a" />

          {/* FORNO (por baixo da bancada) */}
          <Aparelho id="forno" nome="Forno" ligado={on("forno")} onToggle={alternar}>
            <rect x="14" y="214" width="160" height="82" rx="6" fill="#3d4246" />
            <rect x="24" y="238" width="140" height="6" rx="3" fill="#c7cbcf" />
            <rect x="32" y="250" width="124" height="38" rx="5" fill="#1d2023" />
            <rect className="pj-so-on pj-brilho" x="32" y="250" width="124" height="38" rx="5" fill={`url(#fn${uid})`} />
            <rect className="pj-so-on" x="52" y="275" width="84" height="3" rx="1.5" fill="#8a4a1f" opacity="0.6" />
            <Led x={160} y={226} ligado={on("forno")} />
          </Aparelho>

          {/* FOGÃO (placa na bancada, com um tacho) */}
          <Aparelho id="fogao" nome="Fogão" ligado={on("fogao")} onToggle={alternar}>
            <rect x="14" y="194" width="160" height="10" rx="3" fill="#2a2d30" />
            <ellipse cx="54" cy="196" rx="24" ry="3.5" fill="#55595d" />
            <ellipse cx="134" cy="196" rx="20" ry="3" fill="#55595d" />
            <g className="pj-so-on">
              {[40, 48, 56, 64].map((x) => (
                <path key={x} className="pj-chama" d={`M${x} 196 Q${x + 3} 188 ${x + 6} 196 Z`} fill="#3b82f6" />
              ))}
              {[124, 132, 140].map((x) => (
                <path key={x} className="pj-chama" d={`M${x} 196 Q${x + 2.5} 189 ${x + 5} 196 Z`} fill="#60a5fa" />
              ))}
            </g>
            {/* tacho */}
            <rect x="28" y="160" width="52" height="30" rx="5" fill="#b8bec4" stroke="#7d858c" strokeWidth="1.5" />
            <rect x="24" y="156" width="60" height="6" rx="3" fill="#9aa2a9" />
            <rect x="48" y="150" width="12" height="6" rx="2" fill="#555b60" />
            <rect x="16" y="166" width="12" height="4" rx="2" fill="#555b60" />
            <rect x="80" y="166" width="12" height="4" rx="2" fill="#555b60" />
            <g className="pj-so-on">
              {[40, 54, 68].map((x) => (
                <path key={x} className="pj-vapor" d={`M${x} 146 q-5 -8 0 -16 q5 -8 0 -16`} fill="none" stroke="#c7ccd1" strokeWidth="3" strokeLinecap="round" />
              ))}
            </g>
            {/* sertã */}
            <ellipse cx="134" cy="190" rx="22" ry="5" fill="#33373a" />
            <rect x="154" y="187" width="22" height="4" rx="2" fill="#4a3426" />
            <Led x={166} y={199} ligado={on("fogao")} />
          </Aparelho>

          {/* VARINHA, num copo */}
          <Aparelho id="varinha" nome="Varinha" ligado={on("varinha")} onToggle={alternar}>
            <g className="pj-vibra">
              <rect x="207" y="96" width="20" height="38" rx="8" fill="#e85d4a" />
              <rect x="211" y="104" width="12" height="4" rx="2" fill="#fff" opacity="0.7" />
              <rect x="213" y="132" width="8" height="40" rx="3" fill="#c7cbcf" />
              <path d="M207 170 h20 l-3 8 h-14 Z" fill="#9aa2a9" />
              <g className="pj-so-on">
                <path d="M200 110 l-6 -3 M200 118 l-7 0 M234 110 l6 -3 M234 118 l7 0" stroke="#e85d4a" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
            <rect x="198" y="150" width="38" height="50" rx="5" fill="#ffffff" fillOpacity="0.55" stroke="#9aa2a9" strokeWidth="1.5" />
            <rect className="pj-so-on" x="200" y="172" width="34" height="26" rx="3" fill="#f2a65a" opacity="0.8" />
            <Led x={230} y={104} ligado={on("varinha")} />
          </Aparelho>

          {/* AIR FRYER */}
          <Aparelho id="airfryer" nome="Air fryer" ligado={on("airfryer")} onToggle={alternar}>
            <rect x="256" y="116" width="84" height="84" rx="18" fill="#2e3236" />
            <rect x="264" y="152" width="68" height="40" rx="9" fill="#3c4146" stroke="#1e2124" />
            <rect x="286" y="166" width="24" height="5" rx="2.5" fill="#1e2124" />
            <circle cx="298" cy="136" r="11" fill="#15181a" />
            <text x="298" y="139.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="system-ui, sans-serif"
              fill={on("airfryer") ? "#ffb347" : "#4c5257"}>{on("airfryer") ? "180°" : "– –"}</text>
            <g className="pj-so-on">
              <path className="pj-vapor" d="M276 112 q-4 -7 0 -14" fill="none" stroke="#c7ccd1" strokeWidth="3" strokeLinecap="round" />
              <path className="pj-vapor" d="M320 112 q4 -7 0 -14" fill="none" stroke="#c7ccd1" strokeWidth="3" strokeLinecap="round" />
              <circle className="pj-gira" cx="298" cy="136" r="13.5" fill="none" stroke="#ffb347" strokeWidth="1.5" strokeDasharray="4 5" />
            </g>
            <Led x={330} y={128} ligado={on("airfryer")} />
          </Aparelho>
        </svg>
        <p className="text-center py-2.5" style={{ fontSize: 12, color: "#6b5d45", background: "#efe6d2" }}>
          👆 Toca nos aparelhos que tens para os ligar
        </p>
      </div>

      {/* Os mesmos interruptores, em texto */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {APARELHOS.map((a) => {
          const ligado = on(a.id);
          return (
            <button key={a.id} type="button" onClick={() => alternar(a.id)} aria-pressed={ligado}
              className="pj-tap press flex items-center gap-2.5 px-3 text-left"
              style={{ minHeight: 48, borderRadius: 14, border: `1.5px solid ${ligado ? "var(--pj-brand)" : "var(--pj-border)"}`, background: ligado ? "var(--pj-brand-wash)" : "var(--pj-card)" }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: ligado ? "#2fbf71" : "var(--pj-border)", boxShadow: ligado ? "0 0 6px #3ddc84" : "none" }} />
              <span className="flex-1" style={{ fontSize: 13.5, fontWeight: 600, color: ligado ? "var(--pj-brand-ink)" : "var(--pj-text-strong)" }}>{a.nome}</span>
              <span className="tabular-nums" style={{ fontSize: 11.5, fontWeight: 600, color: ligado ? "var(--pj-brand-ink)" : ganho[a.id] > 0 ? "var(--pj-accent)" : "var(--pj-text-faint)" }}>
                {ligado ? "ligado" : ganho[a.id] > 0 ? `+${ganho[a.id]}` : "—"}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
        “+N” = receitas que esse aparelho desbloqueia. O forno e a air fryer substituem-se um ao outro.
      </p>
    </div>
  );
}
