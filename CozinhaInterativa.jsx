import { useId, useMemo, useRef } from "react";
import { contarCompativeis, EQUIPAMENTOS, receitas } from "./lib/receitas/motor";

/*
 * "Liga o que tens" — uma cozinha portuguesa desenhada à mão (SVG, sem
 * imagens), com azulejos na parede, que se percorre a deslizar. Cada
 * aparelho é um interruptor: desligado fica cinzento; ligado ganha cor e
 * vida (chama no fogão, luz no forno e no micro-ondas, torradas a saltar,
 * vapor na panela de pressão…). Cada aparelho desligado diz quantas
 * receitas desbloqueia.
 *
 * A lista por baixo faz o mesmo que tocar no desenho (teclado, leitor de
 * ecrã, quem prefere ler) e leva a cozinha até ao aparelho tocado.
 */

const LARGURA = 1040;
const ESCALA = 0.95;

/* Centro de cada aparelho no desenho, para levar a vista até ele. */
const CENTRO = {
  fogao: 94, forno: 94, "panela-pressao": 220, chaleira: 282, microondas: 379, torradeira: 479,
  sanduicheira: 550, varinha: 617, liquidificadora: 675, robo: 758, airfryer: 854, slowcooker: 956,
  processador: 241, fritadeira: 350, grelhador: 490,
};

function total(prefs) {
  const c = contarCompativeis(prefs);
  return c.pratos + (prefs.sopa ? c.sopas : 0);
}

/* Área de toque de cada aparelho (x, y, largura, altura): o desenho tem
   buracos (entre a tampa e o vapor, à volta da asa) e o toque não pode cair neles. */
const AREA = {
  fogao: [10, 128, 170, 80], forno: [10, 210, 170, 88], "panela-pressao": [186, 120, 68, 82], chaleira: [252, 132, 56, 70],
  microondas: [314, 128, 130, 74], torradeira: [450, 140, 62, 62], sanduicheira: [510, 150, 84, 52],
  varinha: [592, 84, 52, 118], liquidificadora: [646, 96, 58, 106], robo: [712, 86, 94, 116],
  airfryer: [808, 92, 96, 110], slowcooker: [906, 132, 102, 70],
  processador: [204, 216, 74, 80], fritadeira: [298, 230, 112, 66], grelhador: [416, 236, 160, 60],
};

function Aparelho({ id, ligado, onToggle, nome, children }) {
  const [x, y, w, h] = AREA[id];
  const tecla = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); }
  };
  return (
    <g role="button" tabIndex={0} aria-pressed={ligado} aria-label={`${nome}: ${ligado ? "ligado" : "desligado"}`}
      onClick={() => onToggle(id)} onKeyDown={tecla}
      className={`pj-ap ${ligado ? "pj-ap-on" : ""}`} style={{ cursor: "pointer" }}>
      <title>{nome}</title>
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      {children}
    </g>
  );
}

function Led({ x, y, ligado }) {
  return <circle cx={x} cy={y} r="3.2" fill={ligado ? "#3ddc84" : "#9a9a92"} className={ligado ? "pj-led" : ""} />;
}

function Vapor({ xs, y, cor = "#c7ccd1", alto = 16 }) {
  return (
    <g className="pj-so-on">
      {xs.map((x) => (
        <path key={x} className="pj-vapor" d={`M${x} ${y} q-4 -${alto / 2} 0 -${alto} q4 -${alto / 2} 0 -${alto}`} fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Visor({ x, y, w = 26, h = 13, on, texto }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#15181a" />
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif"
        fill={on ? "#ffb347" : "#3d4247"}>{on ? texto : "– –"}</text>
    </g>
  );
}

export default function CozinhaInterativa({ prefs, onChange }) {
  const uid = useId().replace(/:/g, "");
  const vista = useRef(null);
  const equip = prefs.equip;
  const on = (id) => equip.includes(id);
  const alternar = (id) => onChange(on(id) ? equip.filter((e) => e !== id) : [...equip, id]);

  const agora = useMemo(() => total(prefs), [prefs]);
  const info = useMemo(() => Object.fromEntries(EQUIPAMENTOS.map((a) => [a.id, {
    ganho: on(a.id) ? 0 : total({ ...prefs, equip: [...equip, a.id] }) - agora,
    usam: receitas().filter((r) => r.equip.flat().includes(a.id)).length,
  }])), [prefs, agora]); // eslint-disable-line react-hooks/exhaustive-deps

  function irPara(id) {
    const el = vista.current;
    if (!el) return;
    el.scrollTo({ left: CENTRO[id] * ESCALA - el.clientWidth / 2, behavior: "smooth" });
  }

  const ap = (id) => ({ id, nome: EQUIPAMENTOS.find((e) => e.id === id).nome, ligado: on(id), onToggle: alternar });

  return (
    <div>
      <style>{`
        .pj-ap { transition: filter .35s, opacity .35s; filter: grayscale(1); opacity: .6; outline: none; }
        .pj-ap-on { filter: none; opacity: 1; }
        .pj-ap:focus-visible { filter: drop-shadow(0 0 3px #0b6b4f) drop-shadow(0 0 1px #0b6b4f); opacity: 1; }
        .pj-ap .pj-so-on { opacity: 0; transition: opacity .3s; }
        .pj-ap-on .pj-so-on { opacity: 1; }
        .pj-ap .pj-so-off { transition: opacity .3s; }
        .pj-ap-on .pj-so-off { opacity: 0; }
        .pj-ap-on .pj-chama { animation: pj-chama .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
        .pj-ap-on .pj-vapor { animation: pj-vapor 2.4s ease-out infinite; }
        .pj-ap-on .pj-vapor:nth-of-type(2) { animation-delay: .8s; }
        .pj-ap-on .pj-vapor:nth-of-type(3) { animation-delay: 1.6s; }
        .pj-ap-on .pj-brilho { animation: pj-brilho 1.8s ease-in-out infinite; }
        .pj-ap-on .pj-vibra { animation: pj-vibra .12s linear infinite; }
        .pj-ap-on .pj-gira { animation: pj-gira 1s linear infinite; transform-box: fill-box; transform-origin: center; }
        .pj-ap-on .pj-bolha { animation: pj-bolha 1.1s ease-in infinite; }
        .pj-ap-on .pj-bolha:nth-of-type(2) { animation-delay: .35s; }
        .pj-ap-on .pj-bolha:nth-of-type(3) { animation-delay: .7s; }
        .pj-ap .pj-torra { transition: transform .5s cubic-bezier(.3,1.6,.5,1); }
        .pj-ap-on .pj-torra { transform: translateY(-12px); }
        .pj-led { animation: pj-brilho 1.4s ease-in-out infinite; }
        @keyframes pj-chama { from { transform: scaleY(.8) } to { transform: scaleY(1.15) } }
        @keyframes pj-vapor { 0% { opacity: 0; transform: translateY(6px) } 30% { opacity: .7 } 100% { opacity: 0; transform: translateY(-22px) } }
        @keyframes pj-brilho { 0%,100% { opacity: .75 } 50% { opacity: 1 } }
        @keyframes pj-vibra { 0% { transform: translateX(-.6px) } 50% { transform: translateX(.6px) } 100% { transform: translateX(-.6px) } }
        @keyframes pj-gira { to { transform: rotate(360deg) } }
        @keyframes pj-bolha { 0% { opacity: 0; transform: translateY(4px) } 40% { opacity: 1 } 100% { opacity: 0; transform: translateY(-8px) } }
        @keyframes pj-salta { 0% { transform: scale(1) } 40% { transform: scale(1.12) } 100% { transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) {
          .pj-ap-on .pj-chama, .pj-ap-on .pj-vapor, .pj-ap-on .pj-brilho, .pj-ap-on .pj-vibra, .pj-ap-on .pj-gira, .pj-ap-on .pj-bolha, .pj-led { animation: none; }
          .pj-ap-on .pj-vapor, .pj-ap-on .pj-bolha { opacity: .5; }
          .pj-ap .pj-torra { transition: none; }
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
        <div ref={vista} className="overflow-x-auto no-scrollbar" style={{ scrollSnapType: "x proximity" }}>
          <svg viewBox={`0 0 ${LARGURA} 300`} width={LARGURA * ESCALA} height={300 * ESCALA} style={{ display: "block", maxWidth: "none" }}
            aria-label="Cozinha: toca nos aparelhos que tens">
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

            {/* Parede, prateleiras, bancada e armários */}
            <rect x="0" y="0" width={LARGURA} height="200" fill={`url(#az${uid})`} />
            <rect x="0" y="0" width={LARGURA} height="200" fill="#f6f0e2" opacity="0.18" />
            <rect x="330" y="58" width="150" height="7" rx="2" fill="#a77b4f" />
            <rect x="340" y="36" width="16" height="22" rx="3" fill="#c96f3b" />
            <rect x="362" y="40" width="14" height="18" rx="3" fill="#e9d9b8" stroke="#b9a37c" />
            <circle cx="404" cy="48" r="10" fill="#7a9a4b" />
            <rect x="398" y="48" width="12" height="10" rx="2" fill="#b0623b" />
            <rect x="430" y="42" width="30" height="16" rx="3" fill="#2f5d9e" />
            <rect x="760" y="40" width="200" height="7" rx="2" fill="#a77b4f" />
            <rect x="772" y="20" width="18" height="20" rx="3" fill="#e9d9b8" stroke="#b9a37c" />
            <rect x="796" y="24" width="14" height="16" rx="3" fill="#c96f3b" />
            <circle cx="930" cy="30" r="9" fill="#7a9a4b" />
            <rect x="925" y="30" width="10" height="10" rx="2" fill="#b0623b" />
            <rect x="586" y="66" width="2" height="16" fill="#8b6b4a" />
            <circle cx="587" cy="96" r="13" fill="#5f6f7a" stroke="#3f4a52" strokeWidth="2" />

            <rect x="0" y="200" width={LARGURA} height="12" fill="#b88a5b" />
            <rect x="0" y="212" width={LARGURA} height="88" fill="#e7ddc9" />
            {/* nicho aberto por baixo da bancada */}
            <rect x="186" y="216" width="394" height="80" rx="4" fill="#d6c7a8" />
            <rect x="186" y="292" width="394" height="4" fill="#b8a582" />
            {[592, 702, 812, 922].map((x) => (
              <g key={x}>
                <rect x={x} y="220" width="102" height="72" rx="4" fill="#ddd1b8" stroke="#c9bb9d" />
                <rect x={x + 46} y="250" width="10" height="3" rx="1.5" fill="#9b8a6a" />
              </g>
            ))}

            {/* FORNO */}
            <Aparelho {...ap("forno")}>
              <rect x="14" y="214" width="160" height="82" rx="6" fill="#3d4246" />
              <rect x="24" y="238" width="140" height="6" rx="3" fill="#c7cbcf" />
              <rect x="32" y="250" width="124" height="38" rx="5" fill="#1d2023" />
              <rect className="pj-so-on pj-brilho" x="32" y="250" width="124" height="38" rx="5" fill={`url(#fn${uid})`} />
              <rect className="pj-so-on" x="52" y="275" width="84" height="3" rx="1.5" fill="#8a4a1f" opacity="0.6" />
              <Led x={160} y={226} ligado={on("forno")} />
            </Aparelho>

            {/* FOGÃO */}
            <Aparelho {...ap("fogao")}>
              <rect x="14" y="194" width="160" height="10" rx="3" fill="#2a2d30" />
              <ellipse cx="54" cy="196" rx="24" ry="3.5" fill="#55595d" />
              <ellipse cx="134" cy="196" rx="20" ry="3" fill="#55595d" />
              <g className="pj-so-on">
                {[40, 48, 56, 64].map((x) => <path key={x} className="pj-chama" d={`M${x} 196 Q${x + 3} 188 ${x + 6} 196 Z`} fill="#3b82f6" />)}
                {[124, 132, 140].map((x) => <path key={x} className="pj-chama" d={`M${x} 196 Q${x + 2.5} 189 ${x + 5} 196 Z`} fill="#60a5fa" />)}
              </g>
              <rect x="28" y="160" width="52" height="30" rx="5" fill="#b8bec4" stroke="#7d858c" strokeWidth="1.5" />
              <rect x="24" y="156" width="60" height="6" rx="3" fill="#9aa2a9" />
              <rect x="48" y="150" width="12" height="6" rx="2" fill="#555b60" />
              <rect x="16" y="166" width="12" height="4" rx="2" fill="#555b60" />
              <rect x="80" y="166" width="12" height="4" rx="2" fill="#555b60" />
              <Vapor xs={[40, 54, 68]} y={146} />
              <ellipse cx="134" cy="190" rx="22" ry="5" fill="#33373a" />
              <rect x="154" y="187" width="22" height="4" rx="2" fill="#4a3426" />
              <Led x={166} y={199} ligado={on("fogao")} />
            </Aparelho>

            {/* PANELA DE PRESSÃO (elétrica) */}
            <Aparelho {...ap("panela-pressao")}>
              <rect x="192" y="146" width="56" height="54" rx="12" fill="#c9ced3" stroke="#8d949a" strokeWidth="1.5" />
              <ellipse cx="220" cy="148" rx="30" ry="8" fill="#3a3f44" />
              <rect x="226" y="134" width="8" height="10" rx="2" fill="#1e2124" />
              <Visor x={207} y={168} on={on("panela-pressao")} texto="P 25" />
              <Vapor xs={[230]} y={130} alto={14} />
              <Led x={241} y={190} ligado={on("panela-pressao")} />
            </Aparelho>

            {/* CHALEIRA ELÉTRICA */}
            <Aparelho {...ap("chaleira")}>
              <rect x="262" y="194" width="40" height="6" rx="2" fill="#3a3f44" />
              <path d="M266 194 L270 160 Q282 152 294 160 L298 194 Z" fill="#e6e1d6" stroke="#9aa2a9" strokeWidth="1.5" />
              <path d="M266 170 L256 160 L258 156 L268 164" fill="#e6e1d6" stroke="#9aa2a9" strokeWidth="1.5" />
              <path d="M296 166 Q308 172 298 186" fill="none" stroke="#3a3f44" strokeWidth="4" strokeLinecap="round" />
              <rect className="pj-so-on pj-brilho" x="268" y="186" width="28" height="5" rx="2" fill="#4ea3ff" />
              <Vapor xs={[256]} y={152} alto={12} />
              <Led x={282} y={197} ligado={on("chaleira")} />
            </Aparelho>

            {/* MICRO-ONDAS */}
            <Aparelho {...ap("microondas")}>
              <rect x="318" y="132" width="122" height="68" rx="6" fill="#d9dcdf" stroke="#a8adb2" strokeWidth="1.5" />
              <rect x="326" y="140" width="80" height="52" rx="4" fill="#2a2d30" />
              <rect className="pj-so-on pj-brilho" x="326" y="140" width="80" height="52" rx="4" fill="#ffd48a" />
              <ellipse className="pj-so-on" cx="366" cy="184" rx="26" ry="3" fill="#d9a35b" />
              <path className="pj-so-on" d="M354 182 h24 l-3 -9 h-18 Z" fill="#e85d4a" />
              <Visor x={410} y={142} w={24} on={on("microondas")} texto="1:30" />
              <circle cx="422" cy="170" r="6" fill="#bcc1c6" stroke="#8d949a" />
              <Led x={422} y={188} ligado={on("microondas")} />
            </Aparelho>

            {/* TORRADEIRA */}
            <Aparelho {...ap("torradeira")}>
              <g className="pj-torra">
                <rect x="462" y="160" width="14" height="22" rx="4" fill="#d9a35b" />
                <rect x="482" y="160" width="14" height="22" rx="4" fill="#d9a35b" />
              </g>
              <rect x="454" y="168" width="50" height="32" rx="9" fill="#b8bec4" stroke="#8d949a" strokeWidth="1.5" />
              <rect x="461" y="168" width="16" height="3" rx="1.5" fill="#3a3f44" />
              <rect x="481" y="168" width="16" height="3" rx="1.5" fill="#3a3f44" />
              <rect x="503" y="178" width="5" height="9" rx="2" fill="#3a3f44" />
              <rect className="pj-so-on pj-brilho" x="462" y="190" width="34" height="3" rx="1.5" fill="#ff7a2f" />
              <Led x={460} y={194} ligado={on("torradeira")} />
            </Aparelho>

            {/* TOSTEIRA / SANDUICHEIRA */}
            <Aparelho {...ap("sanduicheira")}>
              <rect x="516" y="186" width="68" height="14" rx="5" fill="#2e3236" />
              <rect x="514" y="174" width="72" height="13" rx="6" fill="#3a3f44" />
              <rect x="580" y="178" width="10" height="5" rx="2" fill="#1e2124" />
              <rect className="pj-so-on pj-brilho" x="520" y="185" width="60" height="2.5" rx="1" fill="#ff9a3c" />
              <Vapor xs={[540, 560]} y={170} alto={10} />
              <Led x={524} y={193} ligado={on("sanduicheira")} />
            </Aparelho>

            {/* VARINHA, num copo */}
            <Aparelho {...ap("varinha")}>
              <g transform="translate(400 0)">
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
              </g>
            </Aparelho>

            {/* LIQUIDIFICADORA */}
            <Aparelho {...ap("liquidificadora")}>
              <rect x="652" y="176" width="46" height="24" rx="5" fill="#3d7a5c" />
              <circle cx="675" cy="188" r="5" fill="#e6e1d6" />
              <path d="M656 176 L660 118 H690 L694 176 Z" fill="#ffffff" fillOpacity="0.55" stroke="#9aa2a9" strokeWidth="1.5" />
              <rect x="658" y="112" width="34" height="8" rx="3" fill="#3a3f44" />
              <path className="pj-so-on" d="M659 172 L661 140 H689 L691 172 Z" fill="#e8743b" opacity="0.85" />
              <g className="pj-so-off">
                <circle cx="668" cy="166" r="5" fill="#d64545" />
                <circle cx="680" cy="168" r="4" fill="#7a9a4b" />
                <circle cx="674" cy="158" r="4" fill="#d64545" />
              </g>
              <ellipse className="pj-so-on pj-gira" cx="675" cy="158" rx="9" ry="9" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="5 6" />
              <Led x={690} y={188} ligado={on("liquidificadora")} />
            </Aparelho>

            {/* ROBÔ DE COZINHA */}
            <Aparelho {...ap("robo")}>
              <rect x="716" y="150" width="84" height="50" rx="10" fill="#f2f2f0" stroke="#c7cbcf" strokeWidth="1.5" />
              <rect x="728" y="112" width="44" height="40" rx="6" fill="#c7cbcf" stroke="#9aa2a9" strokeWidth="1.5" />
              <rect x="724" y="106" width="52" height="8" rx="4" fill="#9aa2a9" />
              <rect x="744" y="98" width="12" height="8" rx="2" fill="#6b7278" />
              <path d="M772 120 q12 2 10 18 q-1 8 -10 8" fill="none" stroke="#9aa2a9" strokeWidth="4" />
              <Visor x={740} y={164} w={30} h={14} on={on("robo")} texto="100°" />
              <circle cx="786" cy="171" r="6" fill="#d9dcdf" stroke="#9aa2a9" />
              <Vapor xs={[750]} y={94} alto={12} />
              <Led x={726} y={190} ligado={on("robo")} />
            </Aparelho>

            {/* AIR FRYER */}
            <Aparelho {...ap("airfryer")}>
              <g transform="translate(556 0)">
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
              </g>
            </Aparelho>

            {/* PANELA DE COZEDURA LENTA */}
            <Aparelho {...ap("slowcooker")}>
              <rect x="914" y="160" width="84" height="40" rx="18" fill="#8c4a33" />
              <rect x="910" y="174" width="8" height="6" rx="2" fill="#3a3f44" />
              <rect x="994" y="174" width="8" height="6" rx="2" fill="#3a3f44" />
              <ellipse cx="956" cy="160" rx="42" ry="8" fill="#d9dcdf" fillOpacity="0.85" stroke="#9aa2a9" strokeWidth="1.5" />
              <rect x="950" y="148" width="12" height="7" rx="3" fill="#3a3f44" />
              <rect x="938" y="182" width="36" height="12" rx="3" fill="#15181a" />
              <text x="956" y="191" textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="system-ui, sans-serif"
                fill={on("slowcooker") ? "#ffb347" : "#3d4247"}>{on("slowcooker") ? "LOW 4h" : "– –"}</text>
              <Vapor xs={[940, 972]} y={146} alto={12} />
              <Led x={986} y={188} ligado={on("slowcooker")} />
            </Aparelho>

            {/* No nicho: PICADORA, FRITADEIRA, GRELHADOR */}
            <Aparelho {...ap("processador")}>
              <rect x="208" y="264" width="66" height="28" rx="6" fill="#f2f2f0" stroke="#c7cbcf" strokeWidth="1.5" />
              <path d="M214 264 L218 226 H264 L268 264 Z" fill="#ffffff" fillOpacity="0.55" stroke="#9aa2a9" strokeWidth="1.5" />
              <rect x="216" y="220" width="50" height="7" rx="3" fill="#6b7278" />
              <g className="pj-gira"><path d="M241 252 l-12 3 M241 252 l12 -3" stroke="#6b7278" strokeWidth="3" strokeLinecap="round" /></g>
              <g className="pj-so-on">
                {[[226, 258], [252, 256], [236, 244], [248, 246], [232, 238]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill="#7a9a4b" />)}
              </g>
              <Led x={262} y={278} ligado={on("processador")} />
            </Aparelho>

            <Aparelho {...ap("fritadeira")}>
              <rect x="302" y="236" width="96" height="56" rx="8" fill="#c7cbcf" stroke="#8d949a" strokeWidth="1.5" />
              <rect x="314" y="246" width="56" height="24" rx="4" fill="#3a3f44" />
              <g className="pj-so-on">
                {[326, 342, 358].map((x) => <circle key={x} className="pj-bolha" cx={x} cy={262} r="3" fill="#f2c14e" />)}
              </g>
              <rect x="376" y="250" width="30" height="5" rx="2.5" fill="#3a3f44" />
              <circle cx="386" cy="280" r="5" fill="#e85d4a" />
              <Led x={316} y={282} ligado={on("fritadeira")} />
            </Aparelho>

            <Aparelho {...ap("grelhador")}>
              <rect x="420" y="276" width="140" height="16" rx="5" fill="#2e3236" />
              <path d="M424 270 L556 262 L556 252 L424 260 Z" fill="#3a3f44" />
              {[440, 460, 480, 500, 520, 540].map((x) => (
                <line key={x} x1={x} y1="279" x2={x + 8} y2="279" stroke="#55595d" strokeWidth="2" />
              ))}
              <g className="pj-so-on pj-brilho">
                {[440, 460, 480, 500, 520, 540].map((x) => <line key={x} x1={x} y1="279" x2={x + 8} y2="279" stroke="#ff7a2f" strokeWidth="2" />)}
              </g>
              <rect x="556" y="270" width="16" height="5" rx="2.5" fill="#1e2124" />
              <Vapor xs={[470, 510]} y={250} alto={10} />
              <Led x={428} y={286} ligado={on("grelhador")} />
            </Aparelho>
          </svg>
        </div>
        <p className="text-center py-2.5" style={{ fontSize: 12, color: "#6b5d45", background: "#efe6d2" }}>
          👆 Toca nos aparelhos que tens · desliza para ver a cozinha toda →
        </p>
      </div>

      {/* Os mesmos interruptores, em texto */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {EQUIPAMENTOS.map((a) => {
          const ligado = on(a.id);
          const { ganho, usam } = info[a.id];
          return (
            <button key={a.id} type="button" onClick={() => { alternar(a.id); irPara(a.id); }} aria-pressed={ligado}
              className="pj-tap press flex items-center gap-2 px-3 text-left"
              style={{ minHeight: 48, borderRadius: 14, border: `1.5px solid ${ligado ? "var(--pj-brand)" : "var(--pj-border)"}`, background: ligado ? "var(--pj-brand-wash)" : "var(--pj-card)" }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: ligado ? "#2fbf71" : "var(--pj-border)", boxShadow: ligado ? "0 0 6px #3ddc84" : "none" }} />
              <span className="flex-1" style={{ minWidth: 0 }}>
                <span className="block" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: ligado ? "var(--pj-brand-ink)" : "var(--pj-text-strong)" }}>{a.curto}</span>
                {a.desc && <span className="block truncate" style={{ fontSize: 10.5, color: "var(--pj-text-faint)" }}>{a.desc}</span>}
              </span>
              <span className="tabular-nums flex-shrink-0" style={{ fontSize: 11, fontWeight: 600, color: ganho > 0 ? "var(--pj-accent)" : ligado ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}
                title={ganho > 0 ? `Desbloqueia ${ganho} receitas` : `${usam} receitas usam este aparelho`}>
                {ganho > 0 ? `+${ganho}` : ligado ? "✓" : `${usam} rec.`}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
        <strong style={{ color: "var(--pj-accent)" }}>+N</strong> = receitas novas que esse aparelho desbloqueia. Muitos substituem-se uns aos outros: o forno e a air fryer, a varinha e a liquidificadora, a tosteira e o grelhador.
      </p>
    </div>
  );
}
