import { useState, useEffect } from "react";
import {
  Fuel, Battery, Zap, MapPin, Navigation, RefreshCw,
  AlertCircle, Bell, Plus, Trash2,
  Check, Info, X, TrendingDown,
} from "lucide-react";

/* ─── lookup maps ─── */
const POSTO_CORES = {
  Galp: "#e63329", BP: "#007a33", Repsol: "#ff6b00", "Intermarché": "#e2001a",
  Cepsa: "#0077c8", Prio: "#6dc82a", Esso: "#e60000", Shell: "#f7a600",
};
const POSTO_DOMINIOS = {
  Galp: "galp.com", BP: "bp.com", Repsol: "repsol.pt", "Intermarché": "intermarche.pt",
  Cepsa: "cepsa.pt", Prio: "prioenergy.pt", Esso: "esso.com", Shell: "shell.pt",
};
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
  const cor = POSTO_CORES[posto] || "#64748b";
  const dominio = POSTO_DOMINIOS[posto];
  const [nivel, setNivel] = useState(0);
  const iniciais = posto.slice(0, 2).toUpperCase();
  const fontes = dominio ? [
    `https://www.google.com/s2/favicons?domain=${dominio}&sz=64`,
    `https://logo.clearbit.com/${dominio}`,
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
          style={{ width: s * 0.68, height: s * 0.68, objectFit: "contain" }}
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
  const maisProximo = [...filtrados].sort((a, b) =>
    parseFloat(a.distancia ?? 9999) - parseFloat(b.distancia ?? 9999)
  )[0];
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
                      {c.id === maisProximo?.id && (
                        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Mais próximo</span>
                      )}
                      {c.id === maisBarato?.id && (
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
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Rede MOBI.E</span>
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
        <p className="text-[10px] text-slate-400">{filtrados.length} postos · Dados MOBI.E em tempo real</p>
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
            const est = EST[posto.estado] || EST["disponível"];
            const kwNum = parseInt(posto.potencia);
            const kwCls = kwNum >= 100
              ? "text-purple-600 bg-purple-50 border-purple-200"
              : kwNum >= 50
                ? "text-blue-600 bg-blue-50 border-blue-200"
                : "text-emerald-700 bg-emerald-50 border-emerald-200";
            return (
              <div key={posto.id || i} className={`card p-4 ${est.border}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${kwCls}`}>
                    <Zap size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-800 leading-tight">{posto.nome}</p>
                    {posto.morada && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {posto.morada}{posto.cidade ? `, ${posto.cidade}` : ""}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">{posto.operador}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border ${kwCls}`}>
                        <Zap size={9} /> {posto.potencia}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        {posto.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span className={`w-2 h-2 rounded-full ${est.dot}${posto.estado === "disponível" ? " animate-pulse" : ""}`} />
                      <span className={`text-[11px] font-black ${est.txt}`}>{est.label}</span>
                    </div>
                    {posto.distancia && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 justify-end">
                        <MapPin size={9} /> {posto.distancia} km
                      </p>
                    )}
                  </div>
                </div>

                {/* Tomadas */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                    <span className="font-medium">Tomadas disponíveis</span>
                    <span className={`font-black ${posto.livres > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {posto.livres}/{posto.slots} livres
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(posto.slots, 12) }).map((_, si) => (
                      <div
                        key={si}
                        className={`flex-1 h-2 rounded-full ${
                          si < posto.livres ? "bg-emerald-400" : posto.estado === "manutenção" ? "bg-orange-300" : "bg-red-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    className={`press flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${
                      posto.estado === "disponível"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}
                  >
                    <Navigation size={12} /> Navegar
                  </button>
                  <button className="press flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center justify-center gap-1">
                    <Bell size={12} /> Alertar
                  </button>
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
