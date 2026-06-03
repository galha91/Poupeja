import { useState, useEffect } from "react";
import { Fuel, Battery, Zap, MapPin, Navigation, RefreshCw, AlertCircle, Wifi, WifiOff, Bell, Plus, Trash2, Check, Info, X } from "lucide-react";

const POSTO_CORES = {
  Galp:"#e63329", BP:"#007a33", Repsol:"#ff6b00", "Intermarché":"#e2001a",
  Cepsa:"#0077c8", Prio:"#6dc82a", Esso:"#e60000", Shell:"#f7a600",
};
const POSTO_DOMINIOS = {
  Galp:"galp.com", BP:"bp.com", Repsol:"repsol.pt", "Intermarché":"intermarche.pt",
  Cepsa:"cepsa.pt", Prio:"prioenergy.pt", Esso:"esso.com", Shell:"shell.pt",
};
const EST_CONFIG = {
  "disponível": { dot:"bg-emerald-500", txt:"text-emerald-600", label:"Disponível", bd:"border-emerald-200" },
  "ocupado":    { dot:"bg-red-500",     txt:"text-red-500",     label:"Ocupado",    bd:"border-red-100"     },
  "manutenção": { dot:"bg-orange-400",  txt:"text-orange-500",  label:"Manutenção", bd:"border-orange-100"  },
};

function LogoPosto({ posto, size }) {
  const s = size || 32;
  const cor = POSTO_CORES[posto] || "#64748b";
  const dominio = POSTO_DOMINIOS[posto];
  const [nivel, setNivel] = useState(0);
  const iniciais = posto.slice(0, 2).toUpperCase();
  const fontes = dominio ? [
    "https://www.google.com/s2/favicons?domain=" + dominio + "&sz=64",
    "https://logo.clearbit.com/" + dominio,
    "https://icon.horse/icon/" + dominio,
  ] : [];
  return (
    <div className="rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: s, height: s, backgroundColor: cor + "18", border: "1.5px solid " + cor + "33" }}>
      {nivel < fontes.length ? (
        <img src={fontes[nivel]} alt={posto} onError={() => setNivel(function(n){ return n + 1; })}
          style={{ width: s * 0.72, height: s * 0.72, objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: s * 0.32, fontWeight: 900, color: cor }}>{iniciais}</span>
      )}
    </div>
  );
}

function BadgeFonte({ fallback, fonte, atualizadoEm }) {
  const hora = atualizadoEm ? new Date(atualizadoEm).toLocaleTimeString("pt-PT", { hour:"2-digit", minute:"2-digit" }) : "--:--";
  return (
    <div className={"mx-4 mt-4 mb-2 rounded-xl p-2.5 border flex items-center gap-2 " + (fallback ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100")}>
      {fallback ? (
        <WifiOff size={13} className="text-orange-500 flex-shrink-0" />
      ) : (
        <Wifi size={13} className="text-emerald-600 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={"text-[10px] font-bold " + (fallback ? "text-orange-700" : "text-emerald-700")}>
          {fallback ? "Dados de referência — API temporariamente indisponível" : ("Dados reais · " + fonte)}
        </p>
        <p className="text-[9px] text-slate-400">Atualizado às {hora}</p>
      </div>
    </div>
  );
}

function SubCombustiveis() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [fonte, setFonte] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [tipo, setTipo] = useState("Gasolina 95");
  const [erro, setErro] = useState(false);

  function carregar() {
    setLoading(true);
    setErro(false);
    fetch("/api/combustiveis")
      .then(function(r){ return r.json(); })
      .then(function(json){
        setDados(json.dados || []);
        setFallback(json.fallback || false);
        setFonte(json.fonte || "");
        setAtualizadoEm(json.atualizadoEm);
        setLoading(false);
      })
      .catch(function(){
        setErro(true);
        setLoading(false);
      });
  }

  useEffect(function(){ carregar(); }, []);

  const tipos = [];
  dados.forEach(function(c){ if(c.tipo && !tipos.includes(c.tipo)) tipos.push(c.tipo); });
  const tipoAtivo = tipos.includes(tipo) ? tipo : (tipos[0] || "Gasolina 95");
  const filtrados = dados.filter(function(c){ return c.tipo === tipoAtivo; }).sort(function(a,b){ return a.preco - b.preco; });
  const melhor = filtrados[0];
  const minimo = filtrados[0] ? filtrados[0].preco : 0;
  const maximo = filtrados[filtrados.length-1] ? filtrados[filtrados.length-1].preco : 0;

  return (
    <div>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#ea580c,#f97316)" }}>
        <div className="px-4 pt-4 pb-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Fuel size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Melhor preço hoje</span>
            </div>
            <button onClick={carregar} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          {loading ? (
            <div className="py-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
              <p className="text-xs opacity-75 ml-1">A carregar dados DGEG...</p>
            </div>
          ) : melhor ? (
            <div>
              <p className="text-xl font-black">{tipoAtivo}</p>
              <p className="text-4xl font-black mt-1">{melhor.preco.toFixed(3)}€</p>
              <p className="text-xs opacity-75">por litro · {melhor.posto}</p>
            </div>
          ) : (
            <p className="text-sm opacity-75 py-2">Sem dados disponíveis</p>
          )}
        </div>
      </div>

      {!loading && tipos.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {tipos.map(function(t){
              return (
                <button key={t} onClick={function(){ setTipo(t); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ backgroundColor: tipoAtivo === t ? "#ea580c" : "white", color: tipoAtivo === t ? "white" : "#64748b", border: tipoAtivo === t ? "none" : "1px solid #e2e8f0" }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {erro ? (
        <div className="mx-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">Erro ao carregar dados</p>
          <button onClick={carregar} className="mt-2 text-xs font-black text-red-600 bg-red-100 px-4 py-2 rounded-xl">Tentar novamente</button>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-2.5">
          {filtrados.map(function(c, i){
            const isBest = i === 0;
            const cor = POSTO_CORES[c.posto] || "#64748b";
            return (
              <div key={c.posto + "-" + i}
                className={"bg-white rounded-2xl p-4 border shadow-sm " + (isBest ? "border-orange-200 ring-1 ring-orange-100" : "border-slate-100")}>
                <div className="flex items-center gap-3">
                  <LogoPosto posto={c.posto} size={44} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-800">{c.posto}</p>
                      {isBest && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🏆 Mais barato</span>}
                      {c.totalPostos && <span className="text-[9px] text-slate-400">{c.totalPostos} postos</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.tipo}</p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: (Math.max(10, 100 - ((c.preco - minimo) / (maximo - minimo || 1)) * 85)) + "%",
                        backgroundColor: isBest ? "#ea580c" : (cor + "88"),
                      }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-slate-800">{c.preco.toFixed(3)}</p>
                    <p className="text-[10px] text-slate-400">€/litro</p>
                    {!isBest && <p className="text-[10px] text-red-400 font-bold mt-0.5">+{(c.preco - minimo).toFixed(3)}€</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <BadgeFonte fallback={fallback} fonte={fonte} atualizadoEm={atualizadoEm} />
    </div>
  );
}

function SubPostosEV() {
  const [postos, setPostos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [fonte, setFonte] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [raio, setRaio] = useState(10);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [localizacao, setLocalizacao] = useState({ lat: 38.7169, lon: -9.1395 });
  const [locNome, setLocNome] = useState("Lisboa (padrão)");

  function obterLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        setLocalizacao({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocNome("A tua localização");
      },
      function(){}
    );
  }

  function carregar() {
    setLoading(true);
    setErro(false);
    fetch("/api/ev?lat=" + localizacao.lat + "&lon=" + localizacao.lon + "&raio=" + raio)
      .then(function(r){ return r.json(); })
      .then(function(json){
        setPostos(json.postos || []);
        setFallback(json.fallback || false);
        setFonte(json.fonte || "");
        setAtualizadoEm(json.atualizadoEm);
        setLoading(false);
      })
      .catch(function(){
        setErro(true);
        setLoading(false);
      });
  }

  useEffect(function(){ obterLocalizacao(); }, []);
  useEffect(function(){ carregar(); }, [localizacao.lat, localizacao.lon, raio]);

  const postosFiltrados = postos
    .filter(function(p){ return filtroEstado === "todos" || p.estado === filtroEstado; })
    .sort(function(a,b){ return parseFloat(a.distancia||99) - parseFloat(b.distancia||99); });

  const counts = {
    "disponível": postos.filter(function(p){ return p.estado === "disponível"; }).length,
    "ocupado":    postos.filter(function(p){ return p.estado === "ocupado"; }).length,
    "manutenção": postos.filter(function(p){ return p.estado === "manutenção"; }).length,
  };

  return (
    <div>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
        <div className="px-4 pt-4 pb-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Rede MOBI.E</span>
            </div>
            <button onClick={carregar} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="text-xl font-black">Postos de Carregamento EV</p>
          <p className="text-xs opacity-75 mt-0.5">{locNome}</p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
              <p className="text-xs opacity-75 ml-1">A carregar MOBI.E...</p>
            </div>
          ) : (
            <div className="flex gap-4 mt-3">
              <div className="text-center"><p className="text-2xl font-black">{counts["disponível"]}</p><p className="text-[10px] opacity-75">Disponíveis</p></div>
              <div className="text-center"><p className="text-2xl font-black">{counts["ocupado"]}</p><p className="text-[10px] opacity-75">Ocupados</p></div>
              <div className="text-center"><p className="text-2xl font-black">{counts["manutenção"]}</p><p className="text-[10px] opacity-75">Manutenção</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-black text-slate-700 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-600" />Raio de pesquisa</p>
          <span className="text-xl font-black text-emerald-600">{raio} km</span>
        </div>
        <input type="range" min="1" max="50" step="1" value={raio}
          onChange={function(e){ setRaio(parseInt(e.target.value)); }}
          className="w-full cursor-pointer mb-1" style={{ accentColor:"#059669" }} />
        <div className="flex justify-between text-[10px] text-slate-400 mb-3">
          <span>1 km</span><span>25 km</span><span>50 km</span>
        </div>
        <button onClick={obterLocalizacao}
          className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 flex items-center justify-center gap-1.5">
          <MapPin size={13} /> Usar a minha localização atual
        </button>
      </div>

      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[{id:"todos",label:"Todos"},{id:"disponível",label:"✅ Disponível"},{id:"ocupado",label:"🔴 Ocupado"},{id:"manutenção",label:"🔧 Manutenção"}].map(function(f){
            return (
              <button key={f.id} onClick={function(){ setFiltroEstado(f.id); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: filtroEstado === f.id ? "#059669" : "white", color: filtroEstado === f.id ? "white" : "#64748b", border: filtroEstado === f.id ? "none" : "1px solid #e2e8f0" }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mb-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[10px] text-slate-400">{postosFiltrados.length} postos · Dados MOBI.E em tempo real</p>
      </div>

      {erro ? (
        <div className="mx-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">Erro ao carregar postos</p>
          <button onClick={carregar} className="mt-2 text-xs font-black text-red-600 bg-red-100 px-4 py-2 rounded-xl">Tentar novamente</button>
        </div>
      ) : loading ? (
        <div className="px-4 flex flex-col gap-3">
          {[1,2,3].map(function(i){
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="flex-1"><div className="h-3 bg-slate-200 rounded mb-2" /><div className="h-2 bg-slate-100 rounded w-2/3" /></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {postosFiltrados.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
              <Battery size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">Sem postos neste raio</p>
              <p className="text-xs text-slate-400 mt-1">Aumenta o raio de pesquisa</p>
            </div>
          ) : postosFiltrados.map(function(posto, i){
            const est = EST_CONFIG[posto.estado] || EST_CONFIG["disponível"];
            const kwNum = parseInt(posto.potencia);
            const kwCor = kwNum >= 100 ? "text-purple-600 bg-purple-50 border-purple-200" : kwNum >= 50 ? "text-blue-600 bg-blue-50 border-blue-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";
            return (
              <div key={posto.id || i} className={"bg-white rounded-2xl p-4 border shadow-sm " + est.bd}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={"w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border " + kwCor}>
                    <Zap size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-800 leading-tight">{posto.nome}</p>
                    {posto.morada && <p className="text-[10px] text-slate-400 mt-0.5">{posto.morada}{posto.cidade ? ", " + posto.cidade : ""}</p>}
                    <p className="text-[10px] text-slate-400">{posto.operador}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className={"inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border " + kwCor}>
                        <Zap size={9} /> {posto.potencia}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">{posto.tipo}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span className={"w-2 h-2 rounded-full " + est.dot + (posto.estado === "disponível" ? " animate-pulse" : "")} />
                      <span className={"text-[11px] font-black " + est.txt}>{est.label}</span>
                    </div>
                    {posto.distancia && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 justify-end">
                        <MapPin size={9} /> {posto.distancia} km
                      </p>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Tomadas</span>
                    <span className={"font-bold " + (posto.livres > 0 ? "text-emerald-600" : "text-red-500")}>{posto.livres}/{posto.slots} livres</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(posto.slots, 12) }).map(function(_, si){
                      return (
                        <div key={si} className={"flex-1 h-2.5 rounded-full " + (si < posto.livres ? "bg-emerald-400" : posto.estado === "manutenção" ? "bg-orange-300" : "bg-red-300")} />
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={"flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 " + (posto.estado === "disponível" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                    <Navigation size={12} /> Navegar
                  </button>
                  <button className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center justify-center gap-1">
                    <Zap size={12} /> Alertar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <BadgeFonte fallback={fallback} fonte={fonte} atualizadoEm={atualizadoEm} />
    </div>
  );
}

/* ═══ AVISOS (combustível + carregamento) ════════════════ */
function SubAvisos() {
  const [avisos, setAvisos] = useState([]);
  const [tipo, setTipo] = useState("combustivel");
  const [combustivelTipo, setCombustivelTipo] = useState("Gasolina 95");
  const [precoAlvo, setPrecoAlvo] = useState("1.65");
  const [distanciaAlvo, setDistanciaAlvo] = useState("5");
  const [criar, setCriar] = useState(false);
  const [disparados, setDisparados] = useState([]);

  useEffect(function(){
    try {
      const guardado = window.localStorage.getItem("poupeja_avisos");
      if (guardado) setAvisos(JSON.parse(guardado));
    } catch (e) {}
  }, []);

  function guardar(lista) {
    setAvisos(lista);
    try { window.localStorage.setItem("poupeja_avisos", JSON.stringify(lista)); } catch (e) {}
  }

  function adicionar() {
    const novo = tipo === "combustivel"
      ? { id: Date.now(), tipo:"combustivel", combustivelTipo: combustivelTipo, precoAlvo: parseFloat(precoAlvo) }
      : { id: Date.now(), tipo:"carregamento", distanciaAlvo: parseInt(distanciaAlvo) };
    guardar([novo].concat(avisos));
    setCriar(false);
  }

  function remover(id) {
    guardar(avisos.filter(function(a){ return a.id !== id; }));
  }

  useEffect(function(){
    if (avisos.length === 0) { setDisparados([]); return; }
    let ativo = true;

    Promise.all([
      fetch("/api/combustiveis").then(function(r){ return r.json(); }).catch(function(){ return {}; }),
      fetch("/api/ev?lat=38.7169&lon=-9.1395&raio=50").then(function(r){ return r.json(); }).catch(function(){ return {}; }),
    ]).then(function(res){
      if (!ativo) return;
      const comb = res[0].dados || [];
      const postos = res[1].postos || [];
      const novosDisparos = [];

      avisos.forEach(function(a){
        if (a.tipo === "combustivel") {
          const maisBarato = comb
            .filter(function(c){ return c.tipo === a.combustivelTipo; })
            .sort(function(x,y){ return x.preco - y.preco; })[0];
          if (maisBarato && maisBarato.preco <= a.precoAlvo) {
            novosDisparos.push({ id: a.id, texto: a.combustivelTipo + " está a " + maisBarato.preco.toFixed(3) + "€ no " + maisBarato.posto });
          }
        } else {
          const livres = postos.filter(function(p){
            return p.estado === "disponível" && parseFloat(p.distancia || 99) <= a.distanciaAlvo;
          });
          if (livres.length > 0) {
            novosDisparos.push({ id: a.id, texto: livres.length + " posto(s) livre(s) a menos de " + a.distanciaAlvo + " km" });
          }
        }
      });
      setDisparados(novosDisparos);
    });

    return function(){ ativo = false; };
  }, [avisos]);

  return (
    <div>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#2563eb,#3b82f6)" }}>
        <div className="px-4 pt-4 pb-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Os teus avisos</span>
          </div>
          <p className="text-xl font-black">Avisa-me quando valer a pena</p>
          <p className="text-xs opacity-75 mt-0.5">Para combustíveis e pontos de carregamento</p>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl p-3 bg-blue-50 border border-blue-100 flex gap-2">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Os avisos são verificados sempre que abres a app. Para receberes notificações com a app fechada, será preciso a aplicação para o telemóvel (em breve).
        </p>
      </div>

      {disparados.length > 0 && (
        <div className="mx-4 mb-4 flex flex-col gap-2">
          {disparados.map(function(d){
            return (
              <div key={d.id} className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aviso ativado</p>
                  <p className="text-sm font-bold text-emerald-800">{d.texto}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!criar && (
        <div className="mx-4 mb-4">
          <button onClick={function(){ setCriar(true); }}
            className="w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#2563eb,#3b82f6)" }}>
            <Plus size={18} /> Criar novo aviso
          </button>
        </div>
      )}

      {criar && (
        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-slate-800">Novo aviso</p>
            <button onClick={function(){ setCriar(false); }} className="text-slate-400"><X size={18} /></button>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={function(){ setTipo("combustivel"); }}
              className={"flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all " + (tipo === "combustivel" ? "text-white" : "text-slate-500 bg-slate-50")}
              style={ tipo === "combustivel" ? { background:"linear-gradient(135deg,#ea580c,#f97316)" } : {}}>
              <Fuel size={14} /> Combustível
            </button>
            <button onClick={function(){ setTipo("carregamento"); }}
              className={"flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all " + (tipo === "carregamento" ? "text-white" : "text-slate-500 bg-slate-50")}
              style={ tipo === "carregamento" ? { background:"linear-gradient(135deg,#059669,#10b981)" } : {}}>
              <Battery size={14} /> Carregamento
            </button>
          </div>

          {tipo === "combustivel" ? (
            <div>
              <label className="text-[11px] font-bold text-slate-500">Tipo de combustível</label>
              <div className="flex gap-2 mt-1.5 mb-3 flex-wrap">
                {["Gasolina 95","Gasóleo","GPL Auto"].map(function(t){
                  return (
                    <button key={t} onClick={function(){ setCombustivelTipo(t); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={ combustivelTipo === t ? { background:"#ea580c", color:"white" } : { background:"#f1f5f9", color:"#64748b" }}>
                      {t}
                    </button>
                  );
                })}
              </div>
              <label className="text-[11px] font-bold text-slate-500">Avisar quando descer abaixo de (€/litro)</label>
              <input type="number" step="0.001" value={precoAlvo}
                onChange={function(e){ setPrecoAlvo(e.target.value); }}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-800 focus:outline-none focus:border-orange-400"
                placeholder="1.650" />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-500">Avisar quando houver posto livre até (km)</label>
              <input type="number" step="1" value={distanciaAlvo}
                onChange={function(e){ setDistanciaAlvo(e.target.value); }}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-800 focus:outline-none focus:border-emerald-400"
                placeholder="5" />
            </div>
          )}

          <button onClick={adicionar}
            className="w-full mt-4 py-3 rounded-xl text-white font-black active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#2563eb,#3b82f6)" }}>
            Guardar aviso
          </button>
        </div>
      )}

      <div className="mx-4 flex flex-col gap-2.5">
        {avisos.length === 0 && !criar ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
            <Bell size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">Ainda não tens avisos</p>
            <p className="text-xs text-slate-400 mt-1">Cria um para saberes quando o preço baixa</p>
          </div>
        ) : avisos.map(function(a){
          const ativo = disparados.some(function(d){ return d.id === a.id; });
          const cor = a.tipo === "combustivel" ? "#ea580c" : "#059669";
          const Icone = a.tipo === "combustivel" ? Fuel : Battery;
          return (
            <div key={a.id} className={"bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 " + (ativo ? "border-emerald-200" : "border-slate-100")}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor + "15" }}>
                <Icone size={20} style={{ color: cor }} />
              </div>
              <div className="flex-1 min-w-0">
                {a.tipo === "combustivel" ? (
                  <div>
                    <p className="font-black text-slate-800 text-sm">{a.combustivelTipo}</p>
                    <p className="text-xs text-slate-400">Avisar abaixo de {a.precoAlvo.toFixed(3)}€/litro</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-black text-slate-800 text-sm">Posto de carregamento</p>
                    <p className="text-xs text-slate-400">Avisar com posto livre até {a.distanciaAlvo} km</p>
                  </div>
                )}
                {ativo && <span className="inline-block mt-1 text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Condição cumprida agora</span>}
              </div>
              <button onClick={function(){ remover(a.id); }} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SecaoMobilidade() {
  const [sub, setSub] = useState("combustiveis");
  return (
    <div className="pb-28 pt-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        <button onClick={function(){ setSub("combustiveis"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (sub === "combustiveis" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <Fuel size={14} /> Combustíveis
        </button>
        <button onClick={function(){ setSub("ev"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (sub === "ev" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <Battery size={14} /> Postos EV
        </button>
        <button onClick={function(){ setSub("avisos"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (sub === "avisos" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <Bell size={14} /> Avisos
        </button>
      </div>
      {sub === "combustiveis" && <SubCombustiveis />}
      {sub === "ev" && <SubPostosEV />}
      {sub === "avisos" && <SubAvisos />}
    </div>
  );
}
