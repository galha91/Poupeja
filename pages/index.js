import React, { useState } from "react";
import ComparadorPrecos from "../Comparador";
import SecaoFolhetos from "../SecaoFolhetos";
import SecaoLojas from "../SecaoLojas";
import SecaoMobilidade from "../SecaoMobilidade";
import SecaoTaloes from "../SecaoTaloes";
import SecaoDefinicoes from "../SecaoDefinicoes";
import { Home, ShoppingCart, Store, Fuel, PiggyBank, Bell, CreditCard, Users, Search, ChevronRight, TrendingDown, Zap, ShoppingBag, BarChart2, Star, ArrowRight, Wallet, Tag, Battery, Package, Shirt, Smartphone, MapPin, CheckCircle, Clock, Plus, Minus, X, Camera, Trash2, RefreshCw, Trophy, Target, ChevronDown, ChevronUp, Navigation, Layers, Coffee, Droplet, BarChart, Upload, AlertCircle, Info, ArrowLeft, Receipt, ShieldCheck, AlertTriangle } from "lucide-react";

const SUPER_CORES = {Continente:"#e63329","Pingo Doce":"#009a3e",Lidl:"#0050aa",Aldi:"#1a3b6f","Intermarché":"#e2001a"};
const NAV = [{id:"inicio",label:"Início",icon:Home},{id:"mercados",label:"Mercado",icon:ShoppingCart},{id:"lojas",label:"Lojas",icon:Store},{id:"mobilidade",label:"Mobilidade",icon:Fuel},{id:"poupanca",label:"Poupança",icon:PiggyBank}];

const GARANTIAS = [
  { id:1, produto:"Máquina de Lavar Bosch", data:"2024-07-15", anos:2 },
  { id:2, produto:"Telemóvel Samsung A55", data:"2025-11-20", anos:2 },
  { id:3, produto:"Aspirador Dyson", data:"2026-03-10", anos:2 },
];
function garantiasAAcabar(dias){
  const limite = dias || 60;
  const hoje = new Date();
  return GARANTIAS.map(function(g){
    const fim = new Date(g.data);
    fim.setFullYear(fim.getFullYear() + g.anos);
    const restam = Math.ceil((fim - hoje) / (1000*60*60*24));
    return { produto:g.produto, restam:restam };
  }).filter(function(g){ return g.restam >= 0 && g.restam <= limite; });
}

function Badge({children,color="blue"}){
  const c={blue:"bg-blue-100 text-blue-700",green:"bg-green-100 text-green-700",orange:"bg-orange-100 text-orange-700",red:"bg-red-100 text-red-700",gray:"bg-slate-100 text-slate-500",yellow:"bg-yellow-100 text-yellow-700",purple:"bg-purple-100 text-purple-700"};
  return <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c[color]}`}>{children}</span>;
}

function EcraInicio({setTab}){
  const total = 117;
  const features = [
    {icon:Receipt,title:"Os meus talões",desc:"Guarda compras e garantias num só sítio",grad:"from-blue-500 to-blue-600",destino:"taloes"},
    {icon:ShoppingBag,title:"Cesto inteligente",desc:"Descobre onde a tua lista fica mais barata",grad:"from-emerald-500 to-emerald-600",destino:"mercados"},
    {icon:Bell,title:"Avisos de preço",desc:"Dizemos-te quando o preço de algo baixa",grad:"from-slate-700 to-slate-900",destino:"mobilidade"},
    {icon:CreditCard,title:"Cartões de pontos",desc:"Tem os teus cartões sempre à mão",grad:"from-amber-500 to-orange-500",destino:null},
    {icon:Users,title:"Modo Família",desc:"Juntem as contas de casa num só lugar",grad:"from-teal-500 to-teal-600",destino:null},
  ];
  
  const avisosGarantia = garantiasAAcabar(60);
  const [verAviso, setVerAviso] = useState(true);

  return(
    <div className="pb-28">
      {verAviso && avisosGarantia.length > 0 && (
        <div className="px-4 pt-3">
          <button onClick={()=>setTab("taloes")} className="w-full text-left rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-all relative overflow-hidden" style={{background:"linear-gradient(135deg,#b45309,#d97706)",boxShadow:"0 8px 24px -8px rgba(217,119,6,0.5)"}}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><ShieldCheck size={20} className="text-white"/></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-wider">Garantia a terminar</p>
              <p className="text-sm font-black text-white leading-tight">{avisosGarantia[0].produto}</p>
              <p className="text-[11px] text-white/80 mt-0.5">Acaba {avisosGarantia[0].restam === 0 ? "hoje" : "daqui a " + avisosGarantia[0].restam + " dias"}{avisosGarantia.length > 1 ? " · +" + (avisosGarantia.length-1) + " a acabar" : ""}</p>
            </div>
            <span onClick={(e)=>{e.stopPropagation();setVerAviso(false);}} className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><X size={15} className="text-white"/></span>
          </button>
        </div>
      )}
      <div className="px-4 pt-3 pb-4">
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)"}}>
          <div className="p-5 text-white relative">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full"/>
            <div className="absolute right-5 bottom-5 opacity-15"><PiggyBank size={80}/></div>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wider">O teu assistente de poupança</p>
            <p className="text-3xl font-black mt-1">Poupe<span className="text-cyan-300">Já</span></p>
            <p className="text-sm opacity-80 mt-1">Este mês já poupaste</p>
            <p className="text-4xl font-black text-cyan-300">€ {total}</p>
            <button onClick={()=>setTab("poupanca")} className="mt-3 bg-white text-blue-700 text-xs font-black px-4 py-2 rounded-xl inline-flex items-center gap-1.5">
              Ver detalhes <ArrowRight size={12}/>
            </button>
          </div>
          <div className="bg-white/10 px-5 py-3 flex gap-4">
            {[{label:"Supermercado",value:"€47",icon:ShoppingCart},{label:"Combustível",value:"€23",icon:Fuel},{label:"Lojas",value:"€47",icon:Store}].map((s,i)=>(
              <div key={i} className="flex-1 text-center">
                <div className="flex justify-center mb-1"><s.icon size={14} className="text-white/60"/></div>
                <p className="text-sm font-black text-white">{s.value}</p>
                <p className="text-[9px] text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <p className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5"><Star size={14} className="text-amber-500"/>O que podes fazer aqui</p>
        <div className="flex flex-col gap-2.5">
          {features.map((f,i)=>(
            <button key={i} onClick={()=>f.destino&&setTab(f.destino)} className={`bg-gradient-to-r ${f.grad} rounded-2xl p-4 text-white text-left shadow-md active:scale-95 transition-all flex items-center gap-4`}>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><f.icon size={22}/></div>
              <div className="flex-1"><p className="text-sm font-black leading-tight">{f.title}</p><p className="text-[11px] opacity-75 mt-0.5">{f.desc}</p></div>
              <ChevronRight size={18} className="opacity-60 flex-shrink-0"/>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <p className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5"><Zap size={14} className="text-blue-500"/>Atalhos</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[{icon:Tag,label:"Folhetos",color:"text-blue-600 bg-blue-50",tab:"mercados"},{icon:BarChart2,label:"Comparar",color:"text-indigo-600 bg-indigo-50",tab:"mercados"},{icon:Shirt,label:"Moda",color:"text-violet-600 bg-violet-50",tab:"lojas"},{icon:Smartphone,label:"Eletrónica",color:"text-slate-700 bg-slate-100",tab:"lojas"},{icon:Fuel,label:"Combustíveis",color:"text-orange-600 bg-orange-50",tab:"mobilidade"},{icon:Battery,label:"Postos EV",color:"text-emerald-600 bg-emerald-50",tab:"mobilidade"}].map((it,i)=>(
            <button key={i} onClick={()=>setTab(it.tab)} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${it.color}`}><it.icon size={22}/></div>
              <span className="text-[10px] font-black text-slate-700">{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Tag size={18} className="text-amber-600"/></div>
        <div>
          <p className="text-xs font-black text-amber-800">Dica do dia</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">Vê os folhetos antes de ir às compras</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tens todos num só sítio, sempre a postos</p>
          <button onClick={()=>setTab("mercados")} className="mt-2 text-xs text-orange-600 font-black flex items-center gap-1">Ver folhetos <ChevronRight size={10}/></button>
        </div>
      </div>
    </div>
  );
}

function SecaoPoupanca(){
  const total = 117;
  const historico = [{mes:"Mar",valor:98},{mes:"Abr",valor:112},{mes:"Mai",valor:117},{mes:"Jun",valor:total}];
  const maxH = Math.max(...historico.map(h=>h.valor));
  
  return(
    <div className="pb-28">
      <div className="mx-4 mt-0 mb-4 rounded-2xl overflow-hidden shadow-xl" style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)"}}>
        <div className="p-5 text-white relative">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full"/>
          <p className="text-sm font-bold opacity-80 flex items-center gap-1.5"><PiggyBank size={13}/>O que já poupaste este mês</p>
          <p className="text-5xl font-black mt-1">€ {total}</p>
          <p className="text-sm opacity-70 mt-1 flex items-center gap-1">Continua assim e ainda poupas mais</p>
          <div className="flex gap-2 mt-4 relative z-10">
            <button className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/30 flex items-center gap-1"><BarChart size={11}/>Relatório</button>
            <button className="bg-white text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Target size={11}/>Objetivos</button>
          </div>
        </div>
        <div className="bg-white/10 px-5 pb-4 pt-2">
          <p className="text-[10px] text-white/60 mb-2 font-black uppercase tracking-wide">Histórico</p>
          <div className="flex items-end gap-2 h-10">
            {historico.map((h,i)=>(
              <div key={h.mes} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{height:`${(h.valor/maxH)*40}px`,backgroundColor:i===historico.length-1?"#fff":"rgba(255,255,255,0.4)"}}/>
                <p className="text-[8px] text-white/60">{h.mes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-2"><p className="text-sm font-black text-slate-700 flex items-center gap-1.5"><Zap size={13} className="text-blue-500"/>Onde tens poupado</p></div>
      <div className="px-4 flex flex-col gap-2.5 mb-4">
        {[{categoria:"Supermercado",economia:47,icon:ShoppingCart,cor:"text-blue-600"},{categoria:"Combustível",economia:23,icon:Fuel,cor:"text-orange-600"},{categoria:"Eletricidade",economia:12,icon:Battery,cor:"text-yellow-600"},{categoria:"Refeições",economia:35,icon:Coffee,cor:"text-amber-600"}].map((p,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><p.icon size={20} className={p.cor}/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="font-black text-slate-800 text-sm">{p.categoria}</p><span className="text-lg font-black text-emerald-600">€ {p.economia}</span></div>
              </div>
            </div>
            <div className="mt-2 flex gap-1">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{width:"100%"}}/></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4">
        <div className="flex items-center gap-2 mb-2"><Trophy size={17} className="text-amber-600"/><p className="text-sm font-black text-amber-800">Desafio de Junho</p><Badge color="yellow">Em curso</Badge></div>
        <p className="text-xs text-amber-700 mb-3">Aproveita os folhetos da semana e chega aos €100 poupados.</p>
        <div className="flex justify-between text-xs text-amber-700 mb-1 font-bold"><span>€ 38</span><span>Meta: € 100</span></div>
        <div className="h-3 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-amber-500" style={{width:"38%"}}/></div>
      </div>
    </div>
  );
}

function SecaoMercados() {
  const [sub, setSub] = React.useState("folhetos");
  return (
    <div className="pb-28 pt-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        <button onClick={() => setSub("folhetos")}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (sub === "folhetos" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          📰 Folhetos
        </button>
        <button onClick={() => setSub("comparar")}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (sub === "comparar" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          🏷️ Comparar
        </button>
      </div>
      {sub === "folhetos" && <SecaoFolhetos />}
      {sub === "comparar" && <ComparadorPrecos />}
    </div>
  );
}

export default function PoupeJa(){
  const [tab,setTab]=useState("inicio");
  const [verAvisos,setVerAvisos]=useState(false);
  const [verDefinicoes,setVerDefinicoes]=useState(false);
  const titulos={
    inicio:{t:"Olá! Bem-vindo de volta",s:"Vamos poupar nas compras de hoje?"},
    mercados:{t:"Supermercados",s:"Folhetos e comparação de preços"},
    lojas:{t:"Lojas",s:"Moda e eletrónica com desconto"},
    mobilidade:{t:"Mobilidade",s:"Combustíveis e pontos de carregamento"},
    poupanca:{t:"A tua poupança",s:"Vê quanto tens poupado nas compras"},
    taloes:{t:"Os meus talões",s:"As tuas compras e garantias num só sítio"},
  };
  const info=titulos[tab];
  
  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',system-ui,sans-serif;box-sizing:border-box}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        body{margin:0;background:#f1f5f9}
      `}</style>
      <div className="min-h-screen bg-slate-100 max-w-md mx-auto relative">
        {verDefinicoes ? (
          <SecaoDefinicoes onVoltar={()=>setVerDefinicoes(false)} />
        ) : (
        <>
        <div className="bg-white border-b border-slate-100 px-4 pt-10 pb-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm"><PiggyBank size={18} color="white"/></div>
              <span className="text-xl font-black tracking-tight text-slate-900">Poupe<span className="text-blue-600">Já</span></span>
              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-md">PT</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={()=>setVerAvisos(true)} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100"><Bell size={16} className="text-slate-500"/></button>
              <button onClick={()=>{setVerDefinicoes(true);setTab("inicio");}} className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><Users size={16} className="text-blue-600"/></button>
            </div>
          </div>
          <h1 className="text-base font-black text-slate-900 leading-tight">{info.t}</h1>
          <p className="text-[10px] text-slate-400 font-medium">{info.s}</p>
        </div>

        <main>
          {tab==="inicio"&&<EcraInicio setTab={setTab}/>}
          {tab==="mercados"&&<SecaoMercados/>}
          {tab==="lojas"&&<SecaoLojas/>}
          {tab==="mobilidade"&&<SecaoMobilidade/>}
          {tab==="poupanca"&&<SecaoPoupanca/>}
          {tab==="taloes"&&<div className="pt-4"><button onClick={()=>setTab("inicio")} className="mx-4 mb-2 flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Voltar</button><SecaoTaloes/></div>}
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-1 py-1.5 z-40 shadow-lg">
          <div className="flex items-center justify-around">
            {NAV.map(it=>(
              <button key={it.id} onClick={()=>setTab(it.id)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${tab===it.id?"bg-blue-50":""}`}>
                <it.icon size={20} className={tab===it.id?"text-blue-600":"text-slate-400"}/>
                <span className={`text-[9px] font-black ${tab===it.id?"text-blue-600":"text-slate-400"}`}>{it.label}</span>
              </button>
            ))}
          </div>
        </nav>
        </>
        )}

        {verAvisos && (
          <div onClick={()=>setVerAvisos(false)} style={{position:"fixed",inset:0,zIndex:50,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"white",padding:"24px",borderRadius:"16px",maxWidth:"80%"}}>
              <p style={{fontWeight:900,fontSize:"18px",color:"#1e293b"}}>Avisos</p>
              <p style={{fontSize:"14px",color:"#64748b",marginTop:"8px"}}>O painel está a abrir! Toca para fechar.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
