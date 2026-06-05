import { useState, useEffect } from "react";
import { User, Fuel, MapPin, Store, Bell, ShieldCheck, Info, ChevronRight, Check, ArrowLeft, Heart, FileText, Mail } from "lucide-react";

const SUPERMERCADOS = ["Continente", "Pingo Doce", "Lidl", "Aldi", "Intermarché", "Auchan", "Minipreço"];
const COMBUSTIVEIS = ["Gasolina 95", "Gasóleo", "GPL"];

function lerPrefs() {
  try {
    const raw = localStorage.getItem("poupeja_prefs");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    nome: "",
    email: "",
    combustivel: "Gasolina 95",
    distancia: 10,
    favoritos: ["Continente", "Pingo Doce"],
    avisoGarantias: true,
    avisoPrecos: true,
    diasGarantia: 60,
  };
}

function guardarPrefs(p) {
  try { localStorage.setItem("poupeja_prefs", JSON.stringify(p)); } catch (e) {}
}

export default function SecaoDefinicoes({ onVoltar }) {
  const [prefs, setPrefs] = useState(lerPrefs());
  const [guardado, setGuardado] = useState(false);

  useEffect(function(){
    guardarPrefs(prefs);
    setGuardado(true);
    const t = setTimeout(function(){ setGuardado(false); }, 1500);
    return function(){ clearTimeout(t); };
  }, [prefs]);

  function set(campo, valor) {
    setPrefs(function(p){
      const novo = Object.assign({}, p);
      novo[campo] = valor;
      return novo;
    });
  }

  function toggleFavorito(s) {
    setPrefs(function(p){
      const novo = Object.assign({}, p);
      if (novo.favoritos.indexOf(s) >= 0) {
        novo.favoritos = novo.favoritos.filter(function(x){ return x !== s; });
      } else {
        novo.favoritos = novo.favoritos.concat([s]);
      }
      return novo;
    });
  }

  return (
    <div className="pb-28 pt-4">
      <button onClick={onVoltar} className="mx-4 mb-3 flex items-center gap-1 text-sm font-bold text-slate-500">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Cabeçalho */}
      <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative" style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)", boxShadow:"0 12px 30px -10px rgba(37,99,235,0.5)" }}>
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10"/>
        <div className="px-5 pt-5 pb-5 text-white relative z-10">
          <p className="text-2xl font-black">Definições</p>
          <p className="text-xs opacity-80 mt-1">Personaliza a tua experiência</p>
        </div>
      </div>

      {/* Indicador de guardado */}
      {guardado && (
        <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
          <Check size={14} className="text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Guardado</span>
        </div>
      )}

      {/* PERFIL */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Perfil</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <input
                value={prefs.nome}
                onChange={function(e){ set("nome", e.target.value); }}
                placeholder="O teu nome"
                className="w-full text-sm font-black text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-bold"
              />
              <input
                value={prefs.email}
                onChange={function(e){ set("email", e.target.value); }}
                placeholder="O teu email"
                className="w-full text-xs text-slate-500 outline-none placeholder:text-slate-300 mt-0.5"
              />
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50">
            <p className="text-[10px] text-slate-400">Para já fica guardado só neste telemóvel. Com conta, ficará disponível em qualquer aparelho.</p>
          </div>
        </div>
      </div>

      {/* PREFERÊNCIAS */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Preferências</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Combustível */}
          <div className="p-4 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Fuel size={16} className="text-orange-500" />
              <p className="text-sm font-black text-slate-800">Combustível habitual</p>
            </div>
            <div className="flex gap-2">
              {COMBUSTIVEIS.map(function(c){
                const ativo = prefs.combustivel === c;
                return (
                  <button key={c} onClick={function(){ set("combustivel", c); }}
                    className={"flex-1 py-2 rounded-xl text-xs font-bold transition-all " + (ativo ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500")}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distância */}
          <div className="p-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                <p className="text-sm font-black text-slate-800">Distância máxima</p>
              </div>
              <span className="text-sm font-black text-emerald-600">{prefs.distancia} km</span>
            </div>
            <input type="range" min="1" max="50" value={prefs.distancia}
              onChange={function(e){ set("distancia", parseInt(e.target.value)); }}
              className="w-full accent-emerald-600" />
          </div>

          {/* Favoritos */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-blue-600" />
              <p className="text-sm font-black text-slate-800">Supermercados favoritos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUPERMERCADOS.map(function(s){
                const ativo = prefs.favoritos.indexOf(s) >= 0;
                return (
                  <button key={s} onClick={function(){ toggleFavorito(s); }}
                    className={"px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 " + (ativo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                    {ativo && <Check size={11} />} {s}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* AVISOS */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Avisos</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-amber-600" />
              <p className="text-sm font-bold text-slate-800">Avisos de garantias</p>
            </div>
            <button onClick={function(){ set("avisoGarantias", !prefs.avisoGarantias); }}
              className={"w-12 h-7 rounded-full transition-all relative " + (prefs.avisoGarantias ? "bg-emerald-500" : "bg-slate-200")}>
              <span className={"absolute top-1 w-5 h-5 rounded-full bg-white transition-all " + (prefs.avisoGarantias ? "left-6" : "left-1")}/>
            </button>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Avisos de preços</p>
            </div>
            <button onClick={function(){ set("avisoPrecos", !prefs.avisoPrecos); }}
              className={"w-12 h-7 rounded-full transition-all relative " + (prefs.avisoPrecos ? "bg-emerald-500" : "bg-slate-200")}>
              <span className={"absolute top-1 w-5 h-5 rounded-full bg-white transition-all " + (prefs.avisoPrecos ? "left-6" : "left-1")}/>
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-800">Avisar garantia com antecedência</p>
              <span className="text-sm font-black text-amber-600">{prefs.diasGarantia} dias</span>
            </div>
            <input type="range" min="15" max="120" step="15" value={prefs.diasGarantia}
              onChange={function(e){ set("diasGarantia", parseInt(e.target.value)); }}
              className="w-full accent-amber-500" />
          </div>

        </div>
      </div>

      {/* SOBRE */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-1">Sobre</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Versão</p>
            </div>
            <span className="text-xs font-bold text-slate-400">1.0.0</span>
          </div>
          <button className="w-full p-4 flex items-center justify-between border-b border-slate-50 active:bg-slate-50">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Termos e privacidade</p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
          <button className="w-full p-4 flex items-center justify-between active:bg-slate-50">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Contacto e ajuda</p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-300 text-center mt-2">PoupeJá · feito em Portugal</p>
    </div>
  );
}
