import { useState, useEffect } from "react";
import CARROS_EV from "./data/carrosEV";
import {
  Fuel, Battery, Zap, MapPin, Navigation, RefreshCw,
  AlertCircle, Bell, Plus, Trash2,
  Check, Info, X, TrendingDown, Car, Clock,
} from "lucide-react";

/* ─── ícones dos conectores EV ─── */
const CONECTOR_ICONS = {
  "Tipo 2": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 36">
      <polygon points="13,2 23,2 34,13 34,23 23,34 13,34 2,23 2,13" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="18" cy="9"  r="2.2" fill="#64748b"/>
      <circle cx="11" cy="14" r="2.2" fill="#64748b"/>
      <circle cx="25" cy="14" r="2.2" fill="#64748b"/>
      <circle cx="11" cy="22" r="2.2" fill="#64748b"/>
      <circle cx="25" cy="22" r="2.2" fill="#64748b"/>
      <circle cx="15" cy="28" r="2.2" fill="#64748b"/>
      <circle cx="21" cy="28" r="2.2" fill="#64748b"/>
    </svg>
  ),
  "CCS2": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 40">
      <polygon points="12,2 24,2 34,12 34,22 24,30 12,30 2,22 2,12" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="18" cy="8"  r="1.8" fill="#3b82f6"/>
      <circle cx="12" cy="13" r="1.8" fill="#3b82f6"/>
      <circle cx="24" cy="13" r="1.8" fill="#3b82f6"/>
      <circle cx="12" cy="20" r="1.8" fill="#3b82f6"/>
      <circle cx="24" cy="20" r="1.8" fill="#3b82f6"/>
      <rect x="2" y="32" width="32" height="8" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.8"/>
      <circle cx="11" cy="36" r="2.8" fill="#3b82f6"/>
      <circle cx="25" cy="36" r="2.8" fill="#3b82f6"/>
    </svg>
  ),
  "CHAdeMO": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#fef3c7" stroke="#d97706" strokeWidth="1.8"/>
      <circle cx="18" cy="18" r="6"  fill="none"    stroke="#d97706" strokeWidth="1.5"/>
      <circle cx="18" cy="4"   r="2.2" fill="#d97706"/>
      <circle cx="28" cy="8"   r="2.2" fill="#d97706"/>
      <circle cx="32" cy="18"  r="2.2" fill="#d97706"/>
      <circle cx="28" cy="28"  r="2.2" fill="#d97706"/>
      <circle cx="18" cy="32"  r="2.2" fill="#d97706"/>
      <circle cx="8"  cy="28"  r="2.2" fill="#d97706"/>
      <circle cx="4"  cy="18"  r="2.2" fill="#d97706"/>
      <circle cx="8"  cy="8"   r="2.2" fill="#d97706"/>
    </svg>
  ),
  "CCS1": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 40">
      <circle cx="18" cy="16" r="14" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.8"/>
      <circle cx="13" cy="12" r="2"  fill="#7c3aed"/>
      <circle cx="23" cy="12" r="2"  fill="#7c3aed"/>
      <circle cx="13" cy="20" r="2"  fill="#7c3aed"/>
      <circle cx="23" cy="20" r="2"  fill="#7c3aed"/>
      <rect x="6"  cy="14" x="6"  y="32" width="24" height="7" rx="3.5" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.8"/>
      <circle cx="11" cy="35.5" r="2.5" fill="#7c3aed"/>
      <circle cx="25" cy="35.5" r="2.5" fill="#7c3aed"/>
    </svg>
  ),
  "Tipo 1": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.8"/>
      <circle cx="12" cy="13" r="2.2" fill="#16a34a"/>
      <circle cx="24" cy="13" r="2.2" fill="#16a34a"/>
      <circle cx="12" cy="22" r="2.2" fill="#16a34a"/>
      <circle cx="24" cy="22" r="2.2" fill="#16a34a"/>
      <rect x="16" y="24" width="4" height="6" rx="2" fill="#16a34a"/>
    </svg>
  ),
  "Tesla": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 36">
      <rect width="36" height="36" rx="10" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5"/>
      <path d="M9 10 L27 10 L27 12 L20 12 L20 28 L16 28 L16 12 L9 12 Z" fill="#dc2626"/>
      <path d="M13 10 L23 10 Q27 10 27 10 L18 14 Q9 10 9 10 Z" fill="#dc2626"/>
    </svg>
  ),
  "Schuko": (s = 36) => (
    <svg width={s} height={s} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.8"/>
      <circle cx="12" cy="18" r="3"  fill="#94a3b8"/>
      <circle cx="24" cy="18" r="3"  fill="#94a3b8"/>
    </svg>
  ),
};

/* ─── cálculo de tempo de carregamento ─── */
function calcTempo(bateriaKwh, de, ate, chargerKw, carMaxKw) {
  if (!chargerKw || !carMaxKw || ate <= de) return null;
  const kw = Math.min(chargerKw, carMaxKw);
  if (!kw) return null;
  // Curva realista: 100% potência até 80%, depois cai para ~35%
  const low  = Math.max(0, Math.min(ate, 80) - Math.max(de, 0));
  const high = Math.max(0, ate - Math.max(de, 80));
  const timeH = (low / 100 * bateriaKwh + high / 100 * bateriaKwh / 0.35) / kw;
  const mins = Math.round(timeH * 60);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/* ─── inline SVG logos para marcas sem logo no Clearbit ─── */
const BRAND_LOGOS = {
  prio: (s) => (
    <svg viewBox="0 0 44 44" width={s} height={s}>
      <rect width="44" height="44" rx="10" fill="#00a04b"/>
      <path d="M22 7 C20 12 13 19 13 25 C13 29.97 17.03 34 22 34 C26.97 34 31 29.97 31 25 C31 19 24 12 22 7Z" fill="white"/>
      <text x="22" y="41" textAnchor="middle" fill="white" fontWeight="900" fontSize="7" fontFamily="Arial,sans-serif" letterSpacing="0.5">prio</text>
    </svg>
  ),
  plenergy: (s) => (
    <svg viewBox="0 0 44 44" width={s} height={s}>
      <rect width="44" height="44" rx="10" fill="#ff6600"/>
      <text x="22" y="21" textAnchor="middle" fill="white" fontWeight="900" fontSize="13" fontFamily="Arial,sans-serif">PL</text>
      <text x="22" y="33" textAnchor="middle" fill="white" fontWeight="700" fontSize="7.5" fontFamily="Arial,sans-serif" letterSpacing="0.5">ENERGY</text>
    </svg>
  ),
  eclerc: (s) => (
    <svg viewBox="0 0 44 44" width={s} height={s}>
      <rect width="44" height="44" rx="10" fill="#003189"/>
      <text x="22" y="25" textAnchor="middle" fill="white" fontWeight="900" fontSize="16" fontFamily="Arial,sans-serif">E.</text>
      <text x="22" y="35" textAnchor="middle" fill="white" fontWeight="700" fontSize="6.5" fontFamily="Arial,sans-serif" letterSpacing="0.3">Leclerc</text>
    </svg>
  ),
};

/* ─── brand logo domains for Clearbit / Google favicons ─── */
const BRAND_DOMAINS = {
  galp:        "galp.com",
  bp:          "bp.com",
  shell:       "shell.com",
  repsol:      "repsol.com",
  cepsa:       "cepsa.com",
  moeve:       "moeve.com",
  prio:        "prioenergy.pt",
  intermarche: "intermarche.pt",
  auchan:      "auchan.pt",
  petroprix:   "petroprix.com",
  total:       "totalenergies.com",
  esso:        "esso.com",
};

const POSTO_CORES = {
  galp: "#e63329", bp: "#007a33", repsol: "#ff6b00", intermarché: "#e2001a",
  intermarche: "#e2001a", cepsa: "#0077c8", moeve: "#00a39b", prio: "#6dc82a",
  esso: "#e60000", shell: "#f7a600", auchan: "#e2001a", petroprix: "#003087",
  total: "#e30613", totalenergies: "#e30613", "prio energy": "#6dc82a",
  plenergy: "#ff6600", eclerc: "#003189",
};

function resolverMarca(nome) {
  if (!nome) return { cor: "#64748b", logoKey: null };
  const key = nome.toLowerCase().trim();
  const ALIASES = {
    "intermarché": "intermarche", "intermarche": "intermarche",
    "prio energy": "prio", "totalenergies": "total",
    "moeve": "moeve", "cepsa": "cepsa",
    "e.leclerc": "eclerc", "e. leclerc": "eclerc", "leclerc": "eclerc",
    "plenergy": "plenergy", "pl energy": "plenergy",
  };
  const ALL_KEYS = new Set([...Object.keys(BRAND_LOGOS), ...Object.keys(BRAND_DOMAINS)]);
  const logoKey = ALIASES[key]
    || (ALL_KEYS.has(key) ? key : null)
    || [...ALL_KEYS].find(k => key.startsWith(k) || k.startsWith(key.split(" ")[0]))
    || null;
  const cor = POSTO_CORES[logoKey || key] || "#64748b";
  return { cor, logoKey };
}
const EST = {
  "disponível": { dot: "bg-emerald-500", txt: "text-emerald-600", label: "Disponível", border: "border-emerald-100" },
  "ocupado":    { dot: "bg-red-500",     txt: "text-red-500",     label: "Ocupado",    border: "border-red-100" },
  "manutenção": { dot: "bg-orange-400",  txt: "text-orange-500",  label: "Manutenção", border: "border-orange-100" },
};

/* ─── micro components ─── */
function TabBar({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`press flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            value === o.id ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
          }`}
        >
          <o.icon size={13} /> {o.label}
        </button>
      ))}
    </div>
  );
}

function FonteBadge({ fonte, atualizadoEm }) {
  if (!fonte) return null;
  const hora = atualizadoEm
    ? new Date(atualizadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div className="mx-4 mt-4 mb-2 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <p className="text-[10px] text-slate-400">{fonte}{hora ? ` · ${hora}` : ""}</p>
    </div>
  );
}

function LogoPosto({ posto, size = 44 }) {
  const s = size;
  const { cor, logoKey } = resolverMarca(posto);
  const [nivel, setNivel] = useState(0);
  const iniciais = posto.slice(0, 2).toUpperCase();
  if (logoKey && BRAND_LOGOS[logoKey]) {
    return (
      <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: s, height: s }}>
        {BRAND_LOGOS[logoKey](s)}
      </div>
    );
  }
  const dominio = logoKey && BRAND_DOMAINS[logoKey];
  const fontes = dominio ? [
    `https://logo.clearbit.com/${dominio}?size=80`,
    `https://www.google.com/s2/favicons?domain=${dominio}&sz=128`,
  ] : [];
  return (
    <div
      className="rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: s, height: s, backgroundColor: cor + "18", border: `1.5px solid ${cor}33` }}
    >
      {nivel < fontes.length ? (
        <img
          src={fontes[nivel]} alt={posto}
          onError={() => setNivel(n => n + 1)}
          style={{ width: s * 0.72, height: s * 0.72, objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: s * 0.32, fontWeight: 900, color: cor }}>{iniciais}</span>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {[0, 150, 300].map(d => (
        <div key={d} className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
      <span className="text-xs text-white/60 ml-1">A carregar...</span>
    </div>
  );
}

function ErroCard({ onRetry, mensagem }) {
  return (
    <div className="mx-4 card p-5 text-center">
      <AlertCircle size={28} className="text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-black text-slate-500 mb-1">API temporariamente indisponível</p>
      {mensagem && <p className="text-[10px] text-slate-400 mb-3 font-mono">{mensagem}</p>}
      <button onClick={onRetry} className="press text-xs font-black text-white bg-slate-700 px-5 py-2.5 rounded-xl">
        Tentar de novo
      </button>
    </div>
  );
}

/* ═══ Combustíveis ═══ */
function SubCombustiveis() {
  const [estacoes, setEstacoes]     = useState([]);
  const [tipos, setTipos]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);
  const [fonte, setFonte]           = useState("");
  const [atualizado, setAtualizado] = useState(null);
  const [tipo, setTipo]             = useState("Gasolina 95");
  const [loc, setLoc]               = useState(null);
  const [locNome, setLocNome]       = useState(null);
  const [locPedido, setLocPedido]   = useState(false);
  const [raio, setRaio]             = useState(30);

  function obterLocalizacao() {
    if (!navigator.geolocation) return;
    setLocPedido(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocNome("A tua localização");
      },
      () => { setLocNome("Localização negada"); }
    );
  }

  function carregar(latArg, lonArg, raioArg) {
    const useLat  = latArg  ?? loc?.lat;
    const useLon  = lonArg  ?? loc?.lon;
    const useRaio = raioArg ?? raio;
    setLoading(true); setErro(null);
    const url = useLat && useLon
      ? `/api/combustiveis?lat=${useLat}&lon=${useLon}&raio=${useRaio}`
      : "/api/combustiveis";
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setErro(json.erro || "Sem dados"); setLoading(false); return; }
        const items = json.estacoes || json.dados || [];
        setEstacoes(items);
        setTipos(json.tipos || [...new Set(items.map(e => e.tipoLabel || e.tipo).filter(Boolean))]);
        setFonte(json.fonte || "");
        setAtualizado(json.atualizadoEm);
        setLoading(false);
      })
      .catch(e => { setErro(e.message); setLoading(false); });
  }

  useEffect(() => { obterLocalizacao(); }, []);
  useEffect(() => {
    if (loc) carregar(loc.lat, loc.lon, raio);
  }, [loc]);
  useEffect(() => {
    if (!loc && !locPedido) carregar();
  }, []);

  const tiposDisponiveis = tipos.length ? tipos : [...new Set(estacoes.map(e => e.tipoLabel || e.tipo).filter(Boolean))];
  const tipoAtivo   = tiposDisponiveis.includes(tipo) ? tipo : (tiposDisponiveis[0] || "Gasolina 95");
  const filtrados   = estacoes
    .filter(e => (e.tipoLabel || e.tipo) === tipoAtivo)
    .sort((a, b) => {
      if (Math.abs(a.preco - b.preco) > 0.001) return a.preco - b.preco;
      const dA = a.distancia !== null ? parseFloat(a.distancia) : 9999;
      const dB = b.distancia !== null ? parseFloat(b.distancia) : 9999;
      return dA - dB;
    });
  const maisBarato  = filtrados[0];
  const maisProximo = filtrados.reduce((best, e) => {
    const dE = parseFloat(e.distancia ?? 9999);
    const dB = parseFloat(best?.distancia ?? 9999);
    return dE < dB ? e : best;
  }, null);
  const keyMaisProximo = maisProximo ? `${maisProximo.nome}__${maisProximo.distancia}` : null;
  const keyMaisBarato  = maisBarato  ? `${maisBarato.nome}__${maisBarato.preco}` : null;
  const melhor      = maisProximo;
  const min         = maisBarato?.preco || 0;
  const max         = filtrados.reduce((m, e) => Math.max(m, e.preco), 0);

  return (
    <div>
      {/* Hero */}
      <div
        className="mx-4 mb-4 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#c2410c,#f97316)", boxShadow: "0 20px 50px -15px rgba(234,88,12,0.45)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="px-5 pt-5 pb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fuel size={16} className="text-white/70" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                {locNome ? `Raio 30 km · DGEG` : "Melhor preço · DGEG"}
              </span>
            </div>
            <button onClick={() => carregar()} className="press w-8 h-8 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
              <RefreshCw size={14} className={`text-white ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? <LoadingDots /> : melhor ? (
            <>
              <p className="text-[13px] font-semibold text-white/80">{tipoAtivo}</p>
              <p className="text-4xl font-black text-white mt-0.5">
                {melhor.preco.toFixed(3)} €
                <span className="text-base font-semibold text-white/60 ml-1">/litro</span>
              </p>
              <p className="text-[12px] text-white/60 mt-0.5 flex items-center gap-1">
                <TrendingDown size={12} />
                {melhor.nome || melhor.posto}
                {melhor.distancia && <span className="ml-1">· {melhor.distancia} km</span>}
              </p>
            </>
          ) : (
            <p className="text-sm text-white/60 py-3">Sem dados disponíveis</p>
          )}

          {locNome && (
            <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
              <MapPin size={11} /> {locNome}
            </p>
          )}
        </div>

        {/* Tipo selector */}
        {!loading && tiposDisponiveis.length > 0 && (
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {tiposDisponiveis.map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`press flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tipoAtivo === t ? "bg-white text-orange-600" : "bg-white/15 text-white/80 border border-white/20"
                }`}
              >{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Controlos */}
      {loc && (
        <div className="mx-4 mb-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
              <MapPin size={13} className="text-orange-500" /> Raio de pesquisa
            </p>
            <span className="text-lg font-black text-orange-500">{raio} km</span>
          </div>
          <input
            type="range" min="5" max="30" step="5" value={raio}
            onChange={e => setRaio(parseInt(e.target.value))}
            onMouseUp={() => carregar(loc.lat, loc.lon, raio)}
            onTouchEnd={() => carregar(loc.lat, loc.lon, raio)}
            className="w-full mb-3" style={{ accentColor: "#f97316" }}
          />
          <div className="flex justify-between text-[9px] text-slate-400 mb-3">
            <span>5 km</span><span>15 km</span><span>30 km</span>
          </div>
          <button
            onClick={obterLocalizacao}
            className="press w-full py-2.5 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100 flex items-center justify-center gap-1.5"
          >
            <MapPin size={13} /> Atualizar localização
          </button>
        </div>
      )}

      {/* Botão localização (se ainda não autorizou) */}
      {!loc && !loading && (
        <div className="mx-4 mb-4">
          <button
            onClick={obterLocalizacao}
            className="press w-full py-3 rounded-2xl bg-orange-50 text-orange-700 text-sm font-black border border-orange-100 flex items-center justify-center gap-2"
          >
            <MapPin size={15} /> Usar a minha localização
          </button>
        </div>
      )}

      {/* Lista */}
      {erro ? <ErroCard onRetry={() => carregar()} mensagem={erro} /> : (
        <div className="px-4 flex flex-col gap-2.5">
          {filtrados.map((c, i) => {
            const isBest = i === 0;
            const nome   = c.nome || c.posto || "";
            const marca  = c.marca || c.posto || "";
            const cor    = POSTO_CORES[marca] || "#64748b";
            const pct    = Math.max(12, 100 - ((c.preco - min) / (max - min || 1)) * 82);
            return (
              <div key={c.id || `${nome}-${i}`}
                className={`card p-4 ${isBest ? "border-orange-200 ring-1 ring-orange-100" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <LogoPosto posto={marca} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-black text-slate-800 text-sm truncate max-w-[160px]">{nome}</p>
                      {`${c.nome}__${c.distancia}` === keyMaisProximo && (
                        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Mais próximo</span>
                      )}
                      {`${c.nome}__${c.preco}` === keyMaisBarato && (
                        <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Mais barato</span>
                      )}
                    </div>
                    {c.municipio && <p className="text-[10px] text-slate-400 mb-1">{c.municipio}</p>}
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: isBest ? "#f97316" : cor + "99" }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-slate-800">{c.preco.toFixed(3)}</p>
                    <p className="text-[9px] text-slate-400">€ / litro</p>
                    {c.distancia && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end mt-0.5">
                        <MapPin size={9} /> {c.distancia} km
                      </p>
                    )}
                    {!isBest && (
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">+{(c.preco - min).toFixed(3)} €</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FonteBadge fonte={fonte} atualizadoEm={atualizado} />
    </div>
  );
}

/* ═══ Postos EV ═══ */
// Agrupa carros por marca para o select
const MARCAS_EV = CARROS_EV.reduce((acc, c) => {
  (acc[c.marca] = acc[c.marca] || []).push(c);
  return acc;
}, {});

function SubPostosEV() {
  const [postos, setPostos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(false);
  const [fonte, setFonte]           = useState("");
  const [atualizado, setAtualizado] = useState(null);
  const [raio, setRaio]             = useState(10);
  const [filtroEstado, setFiltro]   = useState("todos");
  const [loc, setLoc]               = useState({ lat: 38.7169, lon: -9.1395 });
  const [locNome, setLocNome]       = useState("Lisboa (padrão)");
  // Simulador
  const [carroId, setCarroId]       = useState("");
  const [batDe, setBatDe]           = useState(20);
  const [batAte, setBatAte]         = useState(80);
  const [simOpen, setSimOpen]       = useState(false);
  const carro = CARROS_EV.find(c => c.id === carroId) || null;

  function obterLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocNome("A tua localização");
      },
      () => {}
    );
  }

  function carregar() {
    setLoading(true); setErro(false);
    fetch(`/api/ev?lat=${loc.lat}&lon=${loc.lon}&raio=${raio}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setErro(true); setLoading(false); return; }
        setPostos(json.postos || []);
        setFonte(json.fonte || "");
        setAtualizado(json.atualizadoEm);
        setLoading(false);
      })
      .catch(() => { setErro(true); setLoading(false); });
  }

  useEffect(() => { obterLocalizacao(); }, []);
  useEffect(() => { carregar(); }, [loc.lat, loc.lon, raio]);

  const filtrados = postos
    .filter(p => filtroEstado === "todos" || p.estado === filtroEstado)
    .sort((a, b) => parseFloat(a.distancia || 99) - parseFloat(b.distancia || 99));

  const counts = {
    disponível: postos.filter(p => p.estado === "disponível").length,
    ocupado:    postos.filter(p => p.estado === "ocupado").length,
    manutenção: postos.filter(p => p.estado === "manutenção").length,
  };

  return (
    <div>
      {/* Hero */}
      <div
        className="mx-4 mb-4 rounded-3xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 20px 50px -15px rgba(5,150,105,0.45)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="px-5 pt-5 pb-5 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-white/70" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Postos EV</span>
            </div>
            <button onClick={carregar} className="press w-8 h-8 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
              <RefreshCw size={14} className={`text-white ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-xl font-black text-white">Postos de Carregamento EV</p>
          <p className="text-[12px] text-white/60 mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> {locNome}
          </p>

          {loading ? <LoadingDots /> : (
            <div className="flex gap-5 mt-4">
              {[
                { label: "Disponíveis", value: counts.disponível, color: "text-emerald-300" },
                { label: "Ocupados",    value: counts.ocupado,    color: "text-red-300" },
                { label: "Manutenção",  value: counts.manutenção, color: "text-orange-300" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controlos */}
      <div className="mx-4 mb-4 card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
            <MapPin size={13} className="text-emerald-600" /> Raio de pesquisa
          </p>
          <span className="text-lg font-black text-emerald-600">{raio} km</span>
        </div>
        <input
          type="range" min="1" max="50" value={raio}
          onChange={e => setRaio(parseInt(e.target.value))}
          className="w-full mb-3" style={{ accentColor: "#059669" }}
        />
        <div className="flex justify-between text-[9px] text-slate-400 mb-3">
          <span>1 km</span><span>25 km</span><span>50 km</span>
        </div>
        <button
          onClick={obterLocalizacao}
          className="press w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 flex items-center justify-center gap-1.5"
        >
          <MapPin size={13} /> Usar a minha localização atual
        </button>
      </div>

      {/* Simulador de carregamento */}
      <div className="mx-4 mb-3 rounded-2xl border border-slate-100 overflow-hidden bg-white">
        <button
          onClick={() => setSimOpen(v => !v)}
          className="press w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Car size={14} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-slate-700">
                {carro ? carro.marca + " " + carro.modelo : "Simular carregamento"}
              </p>
              {carro && (
                <p className="text-[10px] text-slate-400">{batDe}% → {batAte}% · {carro.bateria} kWh</p>
              )}
            </div>
          </div>
          <span className="text-slate-400 text-xs">{simOpen ? "▲" : "▼"}</span>
        </button>

        {simOpen && (
          <div className="px-4 pb-4 border-t border-slate-50">
            {/* Seletor de carro */}
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mt-3 mb-1.5">O meu carro</p>
            <select
              value={carroId}
              onChange={e => setCarroId(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-3"
            >
              <option value="">— Selecionar modelo —</option>
              {Object.keys(MARCAS_EV).sort().map(marca => (
                <optgroup key={marca} label={marca}>
                  {MARCAS_EV[marca].map(c => (
                    <option key={c.id} value={c.id}>{c.modelo} ({c.bateria} kWh)</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Percentagem de bateria */}
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Bateria</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] text-slate-400 mb-1">De</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range" min={0} max={99} step={5} value={batDe}
                    onChange={e => { const v = parseInt(e.target.value); setBatDe(v); if (v >= batAte) setBatAte(Math.min(v + 5, 100)); }}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-black text-emerald-600 w-8 text-right">{batDe}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-slate-400 mb-1">Até</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range" min={1} max={100} step={5} value={batAte}
                    onChange={e => { const v = parseInt(e.target.value); setBatAte(v); if (v <= batDe) setBatDe(Math.max(v - 5, 0)); }}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-black text-emerald-600 w-8 text-right">{batAte}%</span>
                </div>
              </div>
            </div>
            {carro && (
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                {((batAte - batDe) / 100 * carro.bateria).toFixed(1)} kWh a carregar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "todos",      label: "Todos" },
          { id: "disponível", label: "Disponível" },
          { id: "ocupado",    label: "Ocupado" },
          { id: "manutenção", label: "Manutenção" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`press flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === f.id
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-500 border border-slate-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[10px] text-slate-400">{filtrados.length} postos · {fonte || "Dados EV em tempo real"}</p>
      </div>

      {/* Lista postos */}
      {erro ? <ErroCard onRetry={carregar} /> : loading ? (
        <div className="px-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded mb-2" />
                  <div className="h-2 bg-slate-50 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="mx-4 card p-6 text-center">
          <Battery size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-black text-slate-400">Sem postos neste raio</p>
          <p className="text-xs text-slate-300 mt-0.5">Aumenta o raio de pesquisa</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {filtrados.map((posto, i) => {
            const est    = EST[posto.estado] || EST["disponível"];
            const kwNum  = posto.potenciaNum || parseInt(posto.potencia) || 0;
            const kwCls  = kwNum >= 150 ? "text-purple-600 bg-purple-50 border-purple-200"
                         : kwNum >= 50  ? "text-blue-600 bg-blue-50 border-blue-200"
                         : "text-emerald-700 bg-emerald-50 border-emerald-200";
            const kwLabel = kwNum >= 150 ? "Ultra-Rápido" : kwNum >= 50 ? "Rápido" : "Normal";

            const ultimaStr = (() => {
              if (!posto.ultimaAtualizacao) return null;
              const d = new Date(posto.ultimaAtualizacao);
              if (isNaN(d)) return null;
              const diff = Math.round((Date.now() - d) / 60000);
              if (diff < 1)  return "agora mesmo";
              if (diff < 60) return `há ${diff} min`;
              const h = Math.round(diff / 60);
              if (h < 24)   return `há ${h}h`;
              return `há ${Math.round(h / 24)}d`;
            })();

            return (
              <div key={posto.id || i} className={`card overflow-hidden border ${est.border}`}>
                {/* Header com status */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                  posto.estado === "disponível" ? "bg-emerald-50" :
                  posto.estado === "ocupado"    ? "bg-red-50" : "bg-orange-50"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${est.dot}${posto.estado === "disponível" ? " animate-pulse" : ""}`} />
                    <span className={`text-[11px] font-black ${est.txt}`}>{est.label}</span>
                    {posto.temTempoReal && (
                      <span className="text-[9px] text-slate-400 font-medium">· tempo real</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ultimaStr && (
                      <span className="text-[9px] text-slate-400">atualizado {ultimaStr}</span>
                    )}
                    {posto.distancia && (
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                        <MapPin size={9} /> {posto.distancia} km
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {/* Nome + operador + velocidade */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border gap-0 ${kwCls}`}>
                      <Zap size={14} />
                      <span className="text-[8px] font-black leading-none">{kwLabel}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-800 leading-tight">{posto.nome}</p>
                      {posto.morada && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {posto.morada}{posto.cidade ? `, ${posto.cidade}` : ""}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">{posto.operador}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`px-2 py-1 rounded-lg border text-center ${kwCls}`}>
                        <p className="text-sm font-black leading-none">{kwNum || "?"}</p>
                        <p className="text-[8px] font-bold leading-none mt-0.5">kW</p>
                      </div>
                    </div>
                  </div>

                  {/* Conectores por tipo */}
                  {posto.conectores?.length > 0 ? (
                    <div className="mb-3 flex flex-col gap-2">
                      {posto.conectores.map((c, ci) => {
                        const livre = c.livres > 0;
                        const statusCls = livre
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50";
                        const icon = CONECTOR_ICONS[c.tipo];
                        // Tempo estimado com o carro selecionado
                        const carMaxKw = carro
                          ? (c.corrente === "DC"
                              ? (carro.conectorDC === c.tipo ? carro.maxDC : null)
                              : carro.maxAC)
                          : null;
                        const tempo = carro && carMaxKw
                          ? calcTempo(carro.bateria, batDe, batAte, c.kw || 22, carMaxKw)
                          : null;
                        return (
                          <div key={ci} className={`flex items-center gap-3 px-3 py-2 rounded-2xl border ${statusCls}`}>
                            {icon ? (
                              <div className="flex-shrink-0">{icon(34)}</div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                                <Zap size={16} className="text-slate-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-black text-slate-800">{c.tipo}</p>
                              <p className="text-[10px] text-slate-400">{c.corrente}{c.kw > 0 ? ` · ${c.kw} kW` : ""}</p>
                              {tempo && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock size={9} className="text-emerald-600" />
                                  <span className="text-[10px] font-black text-emerald-600">{tempo}</span>
                                </div>
                              )}
                              {carro && c.corrente === "DC" && carro.conectorDC !== c.tipo && (
                                <p className="text-[9px] text-red-400 font-bold mt-0.5">Incompatível</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              {c.total > 0 ? (
                                <>
                                  <p className={`text-[13px] font-black ${livre ? "text-emerald-600" : "text-red-500"}`}>
                                    {c.livres}/{c.total}
                                  </p>
                                  <p className="text-[9px] text-slate-400">livres</p>
                                </>
                              ) : (
                                <span className={`text-[10px] font-black ${livre ? "text-emerald-600" : "text-slate-400"}`}>
                                  {livre ? "Disponível" : "—"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : posto.tipo ? (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        {posto.tipo}
                      </span>
                    </div>
                  ) : null}

                  {/* Tomadas */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                      <span className="font-medium">Tomadas</span>
                      <span className={`font-black ${posto.livres > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {posto.livres} livre{posto.livres !== 1 ? "s" : ""} de {posto.slots}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(posto.slots, 12) }).map((_, si) => (
                        <div key={si} className={`flex-1 h-2.5 rounded-full ${
                          si < posto.livres
                            ? "bg-emerald-400"
                            : posto.estado === "manutenção"
                              ? "bg-orange-300"
                              : "bg-red-300"
                        }`} />
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button className={`press flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${
                      posto.estado === "disponível"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}>
                      <Navigation size={12} /> Navegar
                    </button>
                    <button className="press flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center justify-center gap-1">
                      <Bell size={12} /> Alertar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <FonteBadge fonte={fonte} atualizadoEm={atualizado} />
    </div>
  );
}

/* ═══ Avisos ═══ */
function SubAvisos() {
  const [avisos, setAvisos]           = useState([]);
  const [tipo, setTipo]               = useState("combustivel");
  const [combTipo, setCombTipo]       = useState("Gasolina 95");
  const [precoAlvo, setPrecoAlvo]     = useState("1.65");
  const [distAlvo, setDistAlvo]       = useState("5");
  const [criar, setCriar]             = useState(false);
  const [disparados, setDisparados]   = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("poupeja_avisos");
      if (raw) setAvisos(JSON.parse(raw));
    } catch (_) {}
  }, []);

  function guardar(lista) {
    setAvisos(lista);
    try { localStorage.setItem("poupeja_avisos", JSON.stringify(lista)); } catch (_) {}
  }

  function adicionar() {
    const novo = tipo === "combustivel"
      ? { id: Date.now(), tipo: "combustivel", combTipo, precoAlvo: parseFloat(precoAlvo) }
      : { id: Date.now(), tipo: "carregamento", distAlvo: parseInt(distAlvo) };
    guardar([novo, ...avisos]);
    setCriar(false);
  }

  useEffect(() => {
    if (!avisos.length) { setDisparados([]); return; }
    let ativo = true;
    Promise.all([
      fetch("/api/combustiveis").then(r => r.json()).catch(() => ({})),
      fetch("/api/ev?lat=38.7169&lon=-9.1395&raio=50").then(r => r.json()).catch(() => ({})),
    ]).then(([resComb, resEV]) => {
      if (!ativo) return;
      const comb   = resComb.dados  || [];
      const postos = resEV.postos   || [];
      const novos  = [];
      avisos.forEach(a => {
        if (a.tipo === "combustivel") {
          const best = comb.filter(c => c.tipo === a.combTipo).sort((x, y) => x.preco - y.preco)[0];
          if (best && best.preco <= a.precoAlvo)
            novos.push({ id: a.id, texto: `${a.combTipo} a ${best.preco.toFixed(3)}€ no ${best.posto}` });
        } else {
          const livres = postos.filter(p => p.estado === "disponível" && parseFloat(p.distancia || 99) <= a.distAlvo);
          if (livres.length)
            novos.push({ id: a.id, texto: `${livres.length} posto(s) livre(s) a menos de ${a.distAlvo} km` });
        }
      });
      setDisparados(novos);
    });
    return () => { ativo = false; };
  }, [avisos]);

  return (
    <div>
      {/* Hero */}
      <div
        className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.4)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bell size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Os teus avisos</p>
            <p className="text-xl font-black text-white">Avisa-me quando valer a pena</p>
            <p className="text-[11px] text-white/60 mt-0.5">Combustíveis e postos de carregamento</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mx-4 mb-4 rounded-xl p-3 bg-blue-50 border border-blue-100 flex gap-2">
        <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Os avisos são verificados ao abrir a app. Notificações automáticas chegam com a versão instalável (em breve).
        </p>
      </div>

      {/* Disparados */}
      {disparados.map(d => (
        <div key={d.id} className="mx-4 mb-3 rounded-2xl p-4 border border-emerald-200 bg-emerald-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Aviso ativado</p>
            <p className="text-sm font-bold text-emerald-800">{d.texto}</p>
          </div>
        </div>
      ))}

      {/* CTA criar */}
      {!criar && (
        <div className="mx-4 mb-4">
          <button
            onClick={() => setCriar(true)}
            className="press w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}
          >
            <Plus size={17} /> Criar novo aviso
          </button>
        </div>
      )}

      {/* Form criar */}
      {criar && (
        <div className="mx-4 mb-4 card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-slate-800">Novo aviso</p>
            <button onClick={() => setCriar(false)} className="press w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <X size={15} className="text-slate-500" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { id: "combustivel",  icon: Fuel,    label: "Combustível", grad: "linear-gradient(135deg,#c2410c,#f97316)" },
              { id: "carregamento", icon: Battery, label: "Carregamento", grad: "linear-gradient(135deg,#064e3b,#059669)" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`press flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  tipo === t.id ? "text-white" : "bg-slate-50 text-slate-500"
                }`}
                style={tipo === t.id ? { background: t.grad } : {}}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {tipo === "combustivel" ? (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {["Gasolina 95", "Gasóleo", "GPL Auto"].map(t => (
                  <button
                    key={t}
                    onClick={() => setCombTipo(t)}
                    className={`press px-3 py-1.5 rounded-xl text-xs font-bold ${
                      combTipo === t ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Avisar abaixo de (€/litro)</p>
              <input
                type="number" step="0.001" value={precoAlvo}
                onChange={e => setPrecoAlvo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-800 focus:outline-none focus:border-orange-400"
                placeholder="1.650"
              />
            </>
          ) : (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Avisar com posto livre até (km)</p>
              <input
                type="number" step="1" value={distAlvo}
                onChange={e => setDistAlvo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-800 focus:outline-none focus:border-emerald-400"
                placeholder="5"
              />
            </>
          )}

          <button
            onClick={adicionar}
            className="press w-full mt-4 py-3 rounded-xl text-white font-black"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
          >
            Guardar aviso
          </button>
        </div>
      )}

      {/* Lista avisos */}
      <div className="mx-4 flex flex-col gap-2.5">
        {avisos.length === 0 && !criar ? (
          <div className="card p-6 text-center">
            <Bell size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-400">Ainda não tens avisos</p>
            <p className="text-xs text-slate-300 mt-0.5">Cria um para saberes quando o preço baixa</p>
          </div>
        ) : avisos.map(a => {
          const ativo = disparados.some(d => d.id === a.id);
          const cor = a.tipo === "combustivel" ? "#ea580c" : "#059669";
          const Icone = a.tipo === "combustivel" ? Fuel : Battery;
          return (
            <div
              key={a.id}
              className={`card p-4 flex items-center gap-3 ${ativo ? "border-emerald-200" : ""}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cor + "18" }}>
                <Icone size={19} style={{ color: cor }} />
              </div>
              <div className="flex-1 min-w-0">
                {a.tipo === "combustivel" ? (
                  <>
                    <p className="font-black text-slate-800 text-sm">{a.combTipo}</p>
                    <p className="text-xs text-slate-400">Avisar abaixo de {a.precoAlvo?.toFixed(3)} €/litro</p>
                  </>
                ) : (
                  <>
                    <p className="font-black text-slate-800 text-sm">Posto de carregamento</p>
                    <p className="text-xs text-slate-400">Posto livre até {a.distAlvo} km</p>
                  </>
                )}
                {ativo && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    <Check size={8} /> Condição cumprida agora
                  </span>
                )}
              </div>
              <button
                onClick={() => guardar(avisos.filter(x => x.id !== a.id))}
                className="press w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"
              >
                <Trash2 size={15} className="text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Root ═══ */
export default function SecaoMobilidade() {
  const [sub, setSub] = useState("combustiveis");
  return (
    <div className="pb-28 pt-4">
      <TabBar
        value={sub}
        onChange={setSub}
        options={[
          { id: "combustiveis", icon: Fuel,    label: "Combustíveis" },
          { id: "ev",           icon: Battery, label: "Postos EV" },
          { id: "avisos",       icon: Bell,    label: "Avisos" },
        ]}
      />
      {sub === "combustiveis" && <SubCombustiveis />}
      {sub === "ev"           && <SubPostosEV />}
      {sub === "avisos"       && <SubAvisos />}
    </div>
  );
}
