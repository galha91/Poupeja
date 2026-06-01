import { useState, useRef, useEffect } from "react";

/* ═══ DADOS ═══════════════════════════════════════════════════════════════════ */
const LOGO = (domain, fb) => ({ domain, fb });

const SUPER_LOJAS = [
  { id:1, nome:"Continente",  cor:"#e63329", logo:LOGO("continente.pt","🛒"), folhetos:[
    {titulo:"Frescos em Destaque",validade:"até 1 Jun",desconto:"40%",img:"🥩",categoria:"Frescos"},
    {titulo:"Higiene & Beleza",   validade:"até 3 Jun",desconto:"30%",img:"🧴",categoria:"Higiene"},
    {titulo:"Bebidas & Sumos",    validade:"até 1 Jun",desconto:"2×1",img:"🥤",categoria:"Bebidas"},
  ]},
  { id:2, nome:"Pingo Doce",  cor:"#009a3e", logo:LOGO("pingodoce.pt","🐟"), folhetos:[
    {titulo:"Talho da Semana",    validade:"até 2 Jun",desconto:"35%",img:"🥦",categoria:"Frescos"},
    {titulo:"Padaria Artesanal",  validade:"até 1 Jun",desconto:"20%",img:"🥐",categoria:"Padaria"},
  ]},
  { id:3, nome:"Lidl",        cor:"#0050aa", logo:LOGO("lidl.pt","🦁"), folhetos:[
    {titulo:"Semana Italiana",    validade:"até 4 Jun",desconto:"50%",img:"🍝",categoria:"Especial"},
    {titulo:"Frutas & Legumes",   validade:"até 1 Jun",desconto:"25%",img:"🍊",categoria:"Frescos"},
    {titulo:"Bazar da Semana",    validade:"até 4 Jun",desconto:"60%",img:"🔧",categoria:"Bazar"},
  ]},
  { id:4, nome:"Aldi",        cor:"#1a3b6f", logo:LOGO("aldi.pt","🏪"), folhetos:[
    {titulo:"Especial Verão",     validade:"até 5 Jun",desconto:"45%",img:"☀️",categoria:"Especial"},
    {titulo:"Vinhos Selecionados",validade:"até 3 Jun",desconto:"30%",img:"🍷",categoria:"Bebidas"},
  ]},
  { id:5, nome:"Intermarché", cor:"#e2001a", logo:LOGO("intermarche.pt","🐡"), folhetos:[
    {titulo:"Peixe Fresco",       validade:"até 1 Jun",desconto:"40%",img:"🐠",categoria:"Frescos"},
    {titulo:"Queijos e Enchidos", validade:"até 2 Jun",desconto:"25%",img:"🧀",categoria:"Charcutaria"},
  ]},
];

const SUPER_PRODUTOS = [
  {id:1,nome:"Leite meio-gordo UHT 1L",   categoria:"Lacticínios",img:"🥛",precos:[
    {loja:"Continente",valor:0.89,emPromo:false},{loja:"Pingo Doce",valor:0.85,emPromo:true},
    {loja:"Lidl",valor:0.79,emPromo:false},{loja:"Aldi",valor:0.75,emPromo:false},{loja:"Intermarché",valor:0.82,emPromo:false}]},
  {id:2,nome:"Frango inteiro 1 kg",        categoria:"Carnes",    img:"🍗",precos:[
    {loja:"Continente",valor:2.49,emPromo:true},{loja:"Pingo Doce",valor:2.69,emPromo:false},
    {loja:"Lidl",valor:2.29,emPromo:false},{loja:"Aldi",valor:2.19,emPromo:false},{loja:"Intermarché",valor:2.39,emPromo:true}]},
  {id:3,nome:"Azeite virgem extra 750 ml", categoria:"Óleos",     img:"🫒",precos:[
    {loja:"Continente",valor:4.99,emPromo:false},{loja:"Pingo Doce",valor:4.79,emPromo:true},
    {loja:"Lidl",valor:4.29,emPromo:false},{loja:"Aldi",valor:3.99,emPromo:false},{loja:"Intermarché",valor:4.49,emPromo:true}]},
  {id:4,nome:"Pão de forma fatiado 500g",  categoria:"Padaria",   img:"🍞",precos:[
    {loja:"Continente",valor:1.39,emPromo:false},{loja:"Pingo Doce",valor:1.29,emPromo:false},
    {loja:"Lidl",valor:0.99,emPromo:false},{loja:"Aldi",valor:0.95,emPromo:false},{loja:"Intermarché",valor:1.15,emPromo:true}]},
  {id:5,nome:"Iogurte natural 4×125g",     categoria:"Lacticínios",img:"🥣",precos:[
    {loja:"Continente",valor:1.19,emPromo:false},{loja:"Pingo Doce",valor:0.99,emPromo:true},
    {loja:"Lidl",valor:0.89,emPromo:false},{loja:"Aldi",valor:0.85,emPromo:false},{loja:"Intermarché",valor:1.05,emPromo:false}]},
  {id:6,nome:"Água mineral 6×1.5L",        categoria:"Bebidas",   img:"💧",precos:[
    {loja:"Continente",valor:2.29,emPromo:false},{loja:"Pingo Doce",valor:1.99,emPromo:true},
    {loja:"Lidl",valor:1.79,emPromo:false},{loja:"Aldi",valor:1.69,emPromo:false},{loja:"Intermarché",valor:1.89,emPromo:false}]},
  {id:7,nome:"Arroz agulha 1 kg",          categoria:"Cereais",   img:"🍚",precos:[
    {loja:"Continente",valor:1.49,emPromo:false},{loja:"Pingo Doce",valor:1.39,emPromo:false},
    {loja:"Lidl",valor:1.19,emPromo:false},{loja:"Aldi",valor:1.09,emPromo:false},{loja:"Intermarché",valor:1.29,emPromo:true}]},
  {id:8,nome:"Detergente roupa líquido 2L",categoria:"Limpeza",   img:"🧺",precos:[
    {loja:"Continente",valor:6.99,emPromo:true},{loja:"Pingo Doce",valor:7.29,emPromo:false},
    {loja:"Lidl",valor:5.49,emPromo:false},{loja:"Aldi",valor:4.99,emPromo:false},{loja:"Intermarché",valor:6.19,emPromo:true}]},
  {id:9,nome:"Manteiga com sal 250g",       categoria:"Lacticínios",img:"🧈",precos:[
    {loja:"Continente",valor:2.19,emPromo:false},{loja:"Pingo Doce",valor:1.99,emPromo:false},
    {loja:"Lidl",valor:1.79,emPromo:false},{loja:"Aldi",valor:1.69,emPromo:false},{loja:"Intermarché",valor:1.89,emPromo:true}]},
  {id:10,nome:"Ovos grandes M 12 un.",      categoria:"Frescos",   img:"🥚",precos:[
    {loja:"Continente",valor:2.49,emPromo:false},{loja:"Pingo Doce",valor:2.29,emPromo:true},
    {loja:"Lidl",valor:2.09,emPromo:false},{loja:"Aldi",valor:1.99,emPromo:false},{loja:"Intermarché",valor:2.19,emPromo:false}]},
  {id:11,nome:"Café moído 250g",            categoria:"Bebidas",   img:"☕",precos:[
    {loja:"Continente",valor:2.89,emPromo:true},{loja:"Pingo Doce",valor:2.69,emPromo:false},
    {loja:"Lidl",valor:2.29,emPromo:false},{loja:"Aldi",valor:2.19,emPromo:false},{loja:"Intermarché",valor:2.49,emPromo:false}]},
  {id:12,nome:"Massa esparguete 500g",      categoria:"Cereais",   img:"🍝",precos:[
    {loja:"Continente",valor:0.99,emPromo:false},{loja:"Pingo Doce",valor:0.89,emPromo:false},
    {loja:"Lidl",valor:0.69,emPromo:false},{loja:"Aldi",valor:0.65,emPromo:false},{loja:"Intermarché",valor:0.79,emPromo:true}]},
];

const MODA_LOJAS = [
  {id:1,nome:"Zara",cor:"#1a1a1a",logo:LOGO("zara.com","🖤"),categorias:["Mulher","Homem","Criança"],promocoes:[
    {titulo:"Sale Verão — Mulher",desconto:"50%",img:"👗",validade:"até 15 Jun",categoria:"Mulher"},
    {titulo:"Coleção Homem SS25",desconto:"30%",img:"👔",validade:"até 10 Jun",categoria:"Homem"},
  ]},
  {id:2,nome:"H&M",cor:"#e50010",logo:LOGO("hm.com","🔴"),categorias:["Mulher","Homem","Criança"],promocoes:[
    {titulo:"20% em toda a loja",desconto:"20%",img:"👚",validade:"até 5 Jun",categoria:"Todos"},
    {titulo:"Criança — Verão",desconto:"25%",img:"🎒",validade:"até 20 Jun",categoria:"Criança"},
  ]},
  {id:3,nome:"Mango",cor:"#b8934a",logo:LOGO("mango.com","🥭"),categorias:["Mulher","Homem"],promocoes:[
    {titulo:"Outlet até -70%",desconto:"70%",img:"👒",validade:"até 20 Jun",categoria:"Mulher"},
  ]},
  {id:4,nome:"Pull&Bear",cor:"#333",logo:LOGO("pullandbear.com","🐻"),categorias:["Mulher","Homem"],promocoes:[
    {titulo:"Sale — Básicos",desconto:"40%",img:"👕",validade:"até 8 Jun",categoria:"Homem"},
    {titulo:"Jeans Collection",desconto:"25%",img:"👖",validade:"até 12 Jun",categoria:"Todos"},
  ]},
  {id:5,nome:"Stradivarius",cor:"#8b6914",logo:LOGO("stradivarius.com","⭐"),categorias:["Mulher"],promocoes:[
    {titulo:"Summer Vibes",desconto:"35%",img:"🌸",validade:"até 7 Jun",categoria:"Mulher"},
  ]},
  {id:6,nome:"Bershka",cor:"#ff6b35",logo:LOGO("bershka.com","🎨"),categorias:["Mulher","Homem"],promocoes:[
    {titulo:"Street Style Sale",desconto:"45%",img:"🧢",validade:"até 14 Jun",categoria:"Todos"},
  ]},
];

const ELEC_LOJAS = [
  {id:1,nome:"Fnac",cor:"#f7a600",logo:LOGO("fnac.pt","📚")},
  {id:2,nome:"Worten",cor:"#e30613",logo:LOGO("worten.pt","🔌")},
  {id:3,nome:"MediaMarkt",cor:"#cc0000",logo:LOGO("mediamarkt.pt","📺")},
  {id:4,nome:"PC Diga",cor:"#0066cc",logo:LOGO("pcdiga.com","💻")},
  {id:5,nome:"El Corte Inglés",cor:"#006633",logo:LOGO("elcorteingles.pt","🏬")},
];
const ELEC_CORES = {Fnac:"#f7a600",Worten:"#e30613",MediaMarkt:"#cc0000","PC Diga":"#0066cc","El Corte Inglés":"#006633"};

const ELEC_PROMOCOES = [
  {loja:"Fnac",titulo:"MacBook Air M3",desconto:"15%",img:"💻",validade:"até 2 Jun",categoria:"Computadores"},
  {loja:"Fnac",titulo:"Headphones Sony WH-1000",desconto:"30%",img:"🎧",validade:"até 5 Jun",categoria:"Áudio"},
  {loja:"Worten",titulo:'TV Samsung 55" QLED',desconto:"25%",img:"📺",validade:"até 3 Jun",categoria:"TV"},
  {loja:"Worten",titulo:"Máquina de Lavar Bosch",desconto:"20%",img:"🧺",validade:"até 1 Jun",categoria:"Eletrodomésticos"},
  {loja:"MediaMarkt",titulo:"iPhone 16 Pro",desconto:"10%",img:"📱",validade:"até 7 Jun",categoria:"Smartphones"},
  {loja:"MediaMarkt",titulo:"PS5 Slim + Jogo",desconto:"15%",img:"🎮",validade:"até 10 Jun",categoria:"Gaming"},
  {loja:"PC Diga",titulo:"Teclado Mecânico Keychron",desconto:"40%",img:"⌨️",validade:"até 4 Jun",categoria:"Periféricos"},
  {loja:"El Corte Inglés",titulo:"Robot Aspirador Roomba",desconto:"35%",img:"🤖",validade:"até 6 Jun",categoria:"Eletrodomésticos"},
];

const ELEC_PRODUTOS = [
  {id:1,nome:"iPhone 16 128GB",categoria:"Smartphones",img:"📱",precos:[
    {loja:"Fnac",valor:929,emPromo:false},{loja:"Worten",valor:919,emPromo:true},{loja:"MediaMarkt",valor:899,emPromo:true},{loja:"PC Diga",valor:909,emPromo:false},{loja:"El Corte Inglés",valor:939,emPromo:false}]},
  {id:2,nome:"Samsung Galaxy S25 256GB",categoria:"Smartphones",img:"📱",precos:[
    {loja:"Fnac",valor:849,emPromo:false},{loja:"Worten",valor:829,emPromo:true},{loja:"MediaMarkt",valor:819,emPromo:false},{loja:"PC Diga",valor:839,emPromo:false},{loja:"El Corte Inglés",valor:859,emPromo:false}]},
  {id:3,nome:'MacBook Air M3 13"',categoria:"Computadores",img:"💻",precos:[
    {loja:"Fnac",valor:1199,emPromo:true},{loja:"Worten",valor:1229,emPromo:false},{loja:"MediaMarkt",valor:1189,emPromo:false},{loja:"PC Diga",valor:1179,emPromo:true},{loja:"El Corte Inglés",valor:1249,emPromo:false}]},
  {id:4,nome:"Sony WH-1000XM5",categoria:"Áudio",img:"🎧",precos:[
    {loja:"Fnac",valor:289,emPromo:true},{loja:"Worten",valor:299,emPromo:false},{loja:"MediaMarkt",valor:279,emPromo:false},{loja:"PC Diga",valor:269,emPromo:true},{loja:"El Corte Inglés",valor:319,emPromo:false}]},
  {id:5,nome:'Samsung TV 55" QLED',categoria:"TV",img:"📺",precos:[
    {loja:"Fnac",valor:699,emPromo:false},{loja:"Worten",valor:679,emPromo:true},{loja:"MediaMarkt",valor:649,emPromo:true},{loja:"PC Diga",valor:689,emPromo:false},{loja:"El Corte Inglés",valor:729,emPromo:false}]},
  {id:6,nome:"PlayStation 5 Slim",categoria:"Gaming",img:"🎮",precos:[
    {loja:"Fnac",valor:449,emPromo:false},{loja:"Worten",valor:439,emPromo:true},{loja:"MediaMarkt",valor:429,emPromo:true},{loja:"PC Diga",valor:449,emPromo:false},{loja:"El Corte Inglés",valor:459,emPromo:false}]},
  {id:7,nome:'iPad Pro 11" M4',categoria:"Tablets",img:"📟",precos:[
    {loja:"Fnac",valor:1099,emPromo:false},{loja:"Worten",valor:1079,emPromo:false},{loja:"MediaMarkt",valor:1059,emPromo:true},{loja:"PC Diga",valor:1089,emPromo:false},{loja:"El Corte Inglés",valor:1129,emPromo:false}]},
  {id:8,nome:"AirPods Pro 2ª Geração",categoria:"Áudio",img:"🎵",precos:[
    {loja:"Fnac",valor:249,emPromo:true},{loja:"Worten",valor:239,emPromo:false},{loja:"MediaMarkt",valor:229,emPromo:true},{loja:"PC Diga",valor:245,emPromo:false},{loja:"El Corte Inglés",valor:259,emPromo:false}]},
];

const COMBUSTIVEIS = [
  {posto:"Galp",tipo:"Gasolina 95",preco:"1.729",variacao:-0.02,icone:"⛽"},
  {posto:"BP",tipo:"Gasolina 95",preco:"1.719",variacao:-0.01,icone:"⛽"},
  {posto:"Repsol",tipo:"Gasolina 95",preco:"1.699",variacao:+0.01,icone:"⛽"},
  {posto:"Galp",tipo:"Gasóleo",preco:"1.619",variacao:-0.03,icone:"🛢️"},
  {posto:"BP",tipo:"Gasóleo",preco:"1.609",variacao:-0.02,icone:"🛢️"},
  {posto:"Intermarché",tipo:"Gasóleo",preco:"1.579",variacao:-0.01,icone:"🛢️"},
  {posto:"Galp",tipo:"GPL Auto",preco:"0.889",variacao:0.00,icone:"♻️"},
  {posto:"Repsol",tipo:"GPL Auto",preco:"0.879",variacao:-0.01,icone:"♻️"},
];

const POSTOS_EV = [
  {nome:"MOBI.E — Marquês de Pombal",potencia:"50 kW",tipo:"CCS / CHAdeMO",estado:"disponível",distancia:0.3,operador:"EDP Comercial",slots:2,livres:2},
  {nome:"MOBI.E — Parque Eduardo VII",potencia:"22 kW",tipo:"Tipo 2",estado:"disponível",distancia:0.7,operador:"EDP Comercial",slots:4,livres:3},
  {nome:"MOBI.E — Colombo",potencia:"150 kW",tipo:"CCS",estado:"ocupado",distancia:1.2,operador:"Galp EV",slots:6,livres:0},
  {nome:"MOBI.E — Saldanha",potencia:"11 kW",tipo:"Tipo 2",estado:"disponível",distancia:1.5,operador:"EDP Comercial",slots:2,livres:1},
  {nome:"MOBI.E — Vasco da Gama",potencia:"50 kW",tipo:"CCS / CHAdeMO",estado:"disponível",distancia:2.1,operador:"Ionity",slots:4,livres:2},
  {nome:"MOBI.E — Oriente",potencia:"350 kW",tipo:"CCS",estado:"manutenção",distancia:2.8,operador:"Ionity",slots:8,livres:0},
  {nome:"MOBI.E — Benfica",potencia:"22 kW",tipo:"Tipo 2",estado:"disponível",distancia:3.4,operador:"EDP Comercial",slots:3,livres:2},
  {nome:"MOBI.E — Cascais",potencia:"75 kW",tipo:"CCS",estado:"disponível",distancia:4.1,operador:"Galp EV",slots:4,livres:1},
];

const POUPANCAS_DATA = [
  {categoria:"Supermercado",economia:47,dica:"Compra no Lidl para produtos de marca branca",icone:"🛒",prioridade:"alta"},
  {categoria:"Combustível",economia:23,dica:"Abastece na Intermarché — poupas €0,15/L vs. Galp",icone:"⛽",prioridade:"alta"},
  {categoria:"Eletricidade",economia:12,dica:"Usa tarifa vazia (22h–08h) para carregares em casa",icone:"🔋",prioridade:"média"},
  {categoria:"Refeições",economia:35,dica:"Aproveita folhetos Pingo Doce para os frescos",icone:"🍽️",prioridade:"média"},
];

const CARTOES_DATA = [
  {id:1,nome:"Cartão Continente",cor:"#e63329",logo:"🛒",pontos:1240,validade:"Dez 2025",cashback:"€12,40",beneficios:[
    "Descontos exclusivos toda a semana",
    "Pontos em dobro às 4ªs feiras",
    "10% de desconto na Farmácia",
  ],proximoDesconto:"€5 disponível com 500 pontos"},
  {id:2,nome:"Poupa Mais (PD)",cor:"#009a3e",logo:"🐟",pontos:870,validade:"Jun 2026",cashback:"€8,70",beneficios:[
    "Preços especiais para portadores",
    "Acumulação automática de pontos",
    "Ofertas personalizadas",
  ],proximoDesconto:"€3 disponível com 300 pontos"},
  {id:3,nome:"Cartão FNAC",cor:"#f7a600",logo:"📚",pontos:320,validade:"Mar 2026",cashback:"€3,20",beneficios:[
    "Acesso antecipado a promoções",
    "Pontos em livros, música e tech",
    "Descontos em eventos culturais",
  ],proximoDesconto:"€2 disponível com 200 pontos"},
  {id:4,nome:"Worten Club",cor:"#e30613",logo:"🔌",pontos:150,validade:"Set 2025",cashback:"€1,50",beneficios:[
    "Cashback em eletrodomésticos",
    "Garantia estendida gratuita",
    "Acesso a vendas privadas",
  ],proximoDesconto:"€5 disponível com 500 pontos"},
];

const FAMILIA_MEMBROS = [
  {id:1,nome:"Tu",avatar:"👤",poupanca:47,cor:"#2563eb"},
  {id:2,nome:"Parceiro/a",avatar:"👤",poupanca:38,cor:"#7c3aed"},
  {id:3,nome:"Filho/a",avatar:"🧒",poupanca:12,cor:"#059669"},
];

const SUPER_CORES = {Continente:"#e63329","Pingo Doce":"#009a3e",Lidl:"#0050aa",Aldi:"#1a3b6f","Intermarché":"#e2001a"};
const NAV = [{id:"inicio",label:"Início",icon:"🏠"},{id:"mercados",label:"Mercados",icon:"🛒"},{id:"lojas",label:"Lojas",icon:"🛍️"},{id:"mobilidade",label:"Mobilidade",icon:"⛽"},{id:"poupanca",label:"Poupança",icon:"💶"}];

/* ═══ UTILITÁRIOS ══════════════════════════════════════════ */
function Badge({children,color="blue"}){
  const c={blue:"bg-blue-100 text-blue-700",green:"bg-green-100 text-green-700",orange:"bg-orange-100 text-orange-700",
           red:"bg-red-100 text-red-700",gray:"bg-gray-100 text-gray-500",yellow:"bg-yellow-100 text-yellow-700",purple:"bg-purple-100 text-purple-700"};
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c[color]}`}>{children}</span>;
}

function SubNav({items,active,setActive}){
  return(
    <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mx-4 mt-3 mb-3">
      {items.map(it=>(
        <button key={it.id} onClick={()=>setActive(it.id)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${active===it.id?"bg-white shadow-sm text-gray-900":"text-gray-500"}`}>
          <span>{it.icon}</span><span className="hidden sm:inline">{it.label}</span><span className="sm:hidden">{it.label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

function LogoImg({logo,size="w-7 h-7",rounded="rounded-lg"}){
  const [err,setErr]=useState(false);
  if(!logo||err) return <span className={`${size} ${rounded} flex items-center justify-center text-base`}>{logo?.fb||"🏪"}</span>;
  return <img src={`https://logo.clearbit.com/${logo.domain}`} alt="" onError={()=>setErr(true)} className={`${size} ${rounded} object-contain bg-white p-0.5`}/>;
}

/* ═══ 1. CESTO INTELIGENTE ════════════════════════════════ */
function CestoInteligente(){
  const [cesto,setCesto]=useState([]);
  const [busca,setBusca]=useState("");
  const [mostrarResultados,setMostrarResultados]=useState(false);

  const sugestoes=busca.length>1?SUPER_PRODUTOS.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())).slice(0,5):[];

  const adicionar=(prod)=>{
    setCesto(prev=>{
      const ex=prev.find(c=>c.produto.id===prod.id);
      if(ex) return prev.map(c=>c.produto.id===prod.id?{...c,qtd:c.qtd+1}:c);
      return [...prev,{produto:prod,qtd:1}];
    });
    setBusca(""); setMostrarResultados(false);
  };

  const alterar=(id,delta)=>setCesto(prev=>prev.map(c=>c.produto.id===id?{...c,qtd:Math.max(0,c.qtd+delta)}:c).filter(c=>c.qtd>0));

  const lojas=["Continente","Pingo Doce","Lidl","Aldi","Intermarché"];
  const totais=lojas.map(loja=>{
    let total=0,nd=0;
    cesto.forEach(({produto,qtd})=>{
      const p=produto.precos.find(x=>x.loja===loja);
      if(p) total+=p.valor*qtd; else nd++;
    });
    return {loja,total,nd};
  }).sort((a,b)=>a.total-b.total);

  const melhorTotal=totais[0]?.total||0;
  const piorTotal=totais[totais.length-1]?.total||0;
  const poupanca=(piorTotal-melhorTotal).toFixed(2);

  return(
    <div className="pb-4">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>
        <div className="p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🧺</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Funcionalidade Exclusiva</span></div>
          <p className="text-xl font-black">Cesto Inteligente</p>
          <p className="text-xs opacity-75 mt-0.5">Adiciona produtos e descobre em qual supermercado o teu cesto fica mais barato</p>
        </div>
      </div>

      <div className="px-4 mb-3 relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Adicionar produto ao cesto..." value={busca}
            onChange={e=>{setBusca(e.target.value);setMostrarResultados(true);}}
            onFocus={()=>setMostrarResultados(true)}
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"/>
        </div>
        {mostrarResultados&&sugestoes.length>0&&(
          <div className="absolute left-4 right-4 top-14 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
            {sugestoes.map(p=>(
              <button key={p.id} onClick={()=>adicionar(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0 text-left">
                <span className="text-xl">{p.img}</span>
                <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{p.nome}</p><p className="text-[10px] text-gray-400">{p.categoria}</p></div>
                <span className="text-xs font-black text-green-600">+ Adicionar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {cesto.length===0&&(
        <div className="mx-4 bg-green-50 rounded-2xl p-8 text-center border border-green-100">
          <p className="text-4xl mb-2">🧺</p>
          <p className="text-sm font-bold text-gray-700">O teu cesto está vazio</p>
          <p className="text-xs text-gray-400 mt-1">Pesquisa e adiciona produtos acima</p>
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            {["Leite","Ovos","Frango","Arroz","Azeite"].map(s=>(
              <button key={s} onClick={()=>{setBusca(s);setMostrarResultados(true);}}
                className="bg-white border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {cesto.length>0&&(
        <>
          <div className="px-4 mb-3">
            <p className="text-xs font-black text-gray-600 mb-2">{cesto.length} produto{cesto.length!==1?"s":""} no cesto</p>
            <div className="flex flex-col gap-2">
              {cesto.map(({produto,qtd})=>{
                const min=Math.min(...produto.precos.map(p=>p.valor));
                return(
                  <div key={produto.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                    <span className="text-2xl">{produto.img}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-tight truncate">{produto.nome}</p>
                      <p className="text-[10px] text-green-600 font-semibold">a partir de {min.toFixed(2)} €</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>alterar(produto.id,-1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">-</button>
                      <span className="text-sm font-black w-4 text-center">{qtd}</span>
                      <button onClick={()=>alterar(produto.id,+1)} className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-sm font-bold text-white">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white mb-3 shadow-md">
              <p className="text-xs opacity-80 mb-0.5">💡 Poupança máxima se escolheres o mais barato</p>
              <p className="text-3xl font-black">€ {poupanca}</p>
              <p className="text-xs opacity-75">vs. o supermercado mais caro para este cesto</p>
            </div>
            <p className="text-xs font-black text-gray-600 mb-2">Ranking — melhor cesto completo</p>
            <div className="flex flex-col gap-2">
              {totais.map((t,i)=>{
                const loja=SUPER_LOJAS.find(l=>l.nome===t.nome)||{cor:"#888",logo:null};
                const pct=melhorTotal>0?((t.total-melhorTotal)/(piorTotal-melhorTotal||1))*100:0;
                return(
                  <div key={t.loja} className={`bg-white rounded-2xl p-3.5 border shadow-sm ${i===0?"border-green-300 ring-1 ring-green-200":"border-gray-100"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i===0?"bg-green-500 text-white":"bg-gray-100 text-gray-500"}`}>{i+1}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-sm text-gray-800">{t.loja}</p>
                          {i===0&&<Badge color="green">🏆 Mais barato</Badge>}
                          {t.nd>0&&<Badge color="orange">{t.nd} sem preço</Badge>}
                        </div>
                      </div>
                      <p className={`text-lg font-black ${i===0?"text-green-600":"text-gray-800"}`}>{t.total.toFixed(2)} €</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${Math.max(10,100-pct)}%`,backgroundColor:SUPER_CORES[t.loja]||"#888"}}/>
                    </div>
                    {i>0&&<p className="text-[10px] text-gray-400 text-right mt-1">+€{(t.total-melhorTotal).toFixed(2)} vs. mais barato</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ 2. LEITURA DE TALÃO ═════════════════════════════════ */
function LeituraTalao(){
  const [fase,setFase]=useState("inicio");
  const [imagemPreview,setImagemPreview]=useState(null);
  const [resultado,setResultado]=useState(null);
  const [erro,setErro]=useState(null);
  const inputRef=useRef(null);

  const toBase64=file=>new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(",")[1]);
    r.onerror=rej;
    r.readAsDataURL(file);
  });

  const analisar=async(file)=>{
    setFase("analisando"); setErro(null);
    const preview=URL.createObjectURL(file);
    setImagemPreview(preview);
    try{
      const b64=await toBase64(file);
      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},
            {type:"text",text:`Analisa este talão de supermercado português. 
Extrai todos os produtos com os preços pagos e o nome da loja.
Responde APENAS em JSON válido sem markdown:
{"loja":"nome da loja ou Desconhecida","total_pago":0.00,"produtos":[{"nome":"produto","preco_pago":0.00,"quantidade":1}]}`}
          ]}]
        })
      });
      const data=await resp.json();
      const txt=data.content.find(b=>b.type==="text")?.text||"{}";
      const clean=txt.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      let poupancaTotal=0;
      const produtosComComparacao=parsed.produtos.map(p=>{
        const match=SUPER_PRODUTOS.find(sp=>sp.nome.toLowerCase().split(" ").some(w=>w.length>3&&p.nome.toLowerCase().includes(w)));
        if(match){
          const min=Math.min(...match.precos.map(x=>x.valor));
          const dif=p.preco_pago-min;
          if(dif>0) poupancaTotal+=dif*p.quantidade;
          return {...p,match,min,poupancaUnitaria:Math.max(0,dif)};
        }
        return {...p,match:null};
      });
      setResultado({...parsed,produtos:produtosComComparacao,poupancaTotal});
      setFase("resultado");
    }catch(e){
      setErro("Não foi possível analisar o talão. Tenta com uma imagem mais nítida.");
      setFase("inicio");
    }
  };

  return(
    <div className="pb-4">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
        <div className="p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">📸</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">IA + Câmara</span></div>
          <p className="text-xl font-black">Leitura de Talão</p>
          <p className="text-xs opacity-75 mt-0.5">Fotografa o teu talão e a IA calcula quanto podias ter poupado</p>
        </div>
      </div>

      {fase==="inicio"&&(
        <div className="px-4">
          {erro&&<div className="bg-red-50 border border-red-100 rounded-2xl p-3 mb-3 text-xs text-red-700 font-semibold">{erro}</div>}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-3">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3 border border-purple-100">📄</div>
            <p className="text-sm font-black text-gray-800 mb-1">Como funciona</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">A IA lê o teu talão, identifica os produtos e compara com os preços atuais nos outros supermercados. Descobre quanto pouparias se comprasses noutro sítio.</p>
            <div className="flex flex-col gap-2">
              <button onClick={()=>inputRef.current?.click()}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white shadow-md"
                style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
                📸 Tirar foto ao talão
              </button>
              <button onClick={()=>inputRef.current?.click()}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700">
                🖼️ Escolher da galeria
              </button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={e=>e.target.files?.[0]&&analisar(e.target.files[0])}/>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100">
            <p className="text-[10px] text-purple-700 font-semibold text-center">🔒 A imagem é processada apenas para análise e não é guardada</p>
          </div>
        </div>
      )}

      {fase==="analisando"&&(
        <div className="px-4 text-center py-8">
          {imagemPreview&&<img src={imagemPreview} alt="talão" className="w-32 h-40 object-cover rounded-2xl mx-auto mb-4 shadow-md"/>}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
          </div>
          <p className="text-sm font-black text-gray-700">A IA está a analisar o teu talão...</p>
          <p className="text-xs text-gray-400 mt-1">Isto demora apenas alguns segundos</p>
        </div>
      )}

      {fase==="resultado"&&resultado&&(
        <div className="px-4">
          <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl p-4 text-white mb-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Talão de: {resultado.loja}</p>
                <p className="text-xs opacity-80 mt-0.5">Total pago: <strong>€ {resultado.total_pago?.toFixed(2)||"—"}</strong></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-80">Podias ter poupado</p>
                <p className="text-2xl font-black">€ {resultado.poupancaTotal?.toFixed(2)||"0.00"}</p>
              </div>
            </div>
          </div>
          <p className="text-xs font-black text-gray-600 mb-2">{resultado.produtos?.length||0} produtos identificados</p>
          <div className="flex flex-col gap-2 mb-4">
            {resultado.produtos?.map((p,i)=>(
              <div key={i} className={`bg-white rounded-2xl p-3 border shadow-sm ${p.poupancaUnitaria>0?"border-orange-200":"border-gray-100"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.match?.img||"🛍️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-tight truncate">{p.nome}</p>
                    <p className="text-[10px] text-gray-400">Pagaste: {p.preco_pago?.toFixed(2)} €{p.quantidade>1?` × ${p.quantidade}`:""}</p>
                  </div>
                  {p.poupancaUnitaria>0?(
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-green-600 font-bold">{p.min?.toFixed(2)} € (Lidl)</p>
                      <p className="text-[10px] text-orange-500 font-black">-€{p.poupancaUnitaria.toFixed(2)}</p>
                    </div>
                  ):<Badge color="green">✓ Bom preço</Badge>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={()=>{setFase("inicio");setResultado(null);setImagemPreview(null);}}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-black">
            📸 Analisar outro talão
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ 3. ALERTAS DE PREÇO ════════════════════════════════ */
function AlertasPreco(){
  const todosProdutos=[...SUPER_PRODUTOS.map(p=>({...p,tipo:"super"})),...ELEC_PRODUTOS.map(p=>({...p,tipo:"elec"}))];
  const [alertas,setAlertas]=useState([
    {id:1,produto:ELEC_PRODUTOS[0],precoAlvo:850,ativo:true,disparado:false,tipo:"elec"},
    {id:2,produto:SUPER_PRODUTOS[2],precoAlvo:3.99,ativo:true,disparado:true,tipo:"super"},
  ]);
  const [mostrarForm,setMostrarForm]=useState(false);
  const [buscaAlerta,setBuscaAlerta]=useState("");
  const [prodSel,setProdSel]=useState(null);
  const [precoAlvo,setPrecoAlvo]=useState("");

  const sugestoesAlerta=buscaAlerta.length>1?todosProdutos.filter(p=>p.nome.toLowerCase().includes(buscaAlerta.toLowerCase())).slice(0,5):[];

  const adicionarAlerta=()=>{
    if(!prodSel||!precoAlvo) return;
    setAlertas(prev=>[...prev,{id:Date.now(),produto:prodSel,precoAlvo:parseFloat(precoAlvo),ativo:true,disparado:false,tipo:prodSel.tipo||"super"}]);
    setMostrarForm(false); setBuscaAlerta(""); setProdSel(null); setPrecoAlvo("");
  };

  return(
    <div className="pb-4">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)"}}>
        <div className="p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🔔</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Notificações Inteligentes</span></div>
          <p className="text-xl font-black">Alertas de Preço</p>
          <p className="text-xs opacity-75 mt-0.5">Define o preço que queres pagar — avisamos quando acontecer</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <button onClick={()=>setMostrarForm(!mostrarForm)}
          className="w-full py-3 rounded-xl text-sm font-black text-white shadow-md flex items-center justify-center gap-2"
          style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)"}}>
          + Criar novo alerta de preço
        </button>
      </div>

      {mostrarForm&&(
        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
          <p className="text-sm font-black text-gray-800 mb-3">🔔 Novo alerta</p>
          <div className="relative mb-3">
            <input type="text" placeholder="Pesquisar produto..." value={buscaAlerta}
              onChange={e=>setBuscaAlerta(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {sugestoesAlerta.length>0&&(
              <div className="absolute left-0 right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 z-20">
                {sugestoesAlerta.map(p=>(
                  <button key={p.id} onClick={()=>{setProdSel(p);setBuscaAlerta(p.nome);}}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0">
                    <span>{p.img}</span><p className="text-xs font-semibold text-gray-800 flex-1">{p.nome}</p>
                    <p className="text-xs text-green-600 font-bold">{Math.min(...p.precos.map(x=>x.valor)).toFixed(2)} €</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {prodSel&&(
            <div className="bg-blue-50 rounded-xl p-2.5 mb-3 flex items-center gap-2">
              <span>{prodSel.img}</span>
              <p className="text-xs font-bold text-blue-800 flex-1">{prodSel.nome}</p>
              <p className="text-xs text-blue-600">Atual: {Math.min(...prodSel.precos.map(x=>x.valor)).toFixed(2)} €</p>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">€</span>
              <input type="number" placeholder="Preço alvo" value={precoAlvo}
                onChange={e=>setPrecoAlvo(e.target.value)} step="0.01"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <button onClick={adicionarAlerta} disabled={!prodSel||!precoAlvo}
              className="px-4 py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 disabled:opacity-40">
              Criar
            </button>
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-2.5">
        {alertas.length===0&&(
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm font-bold text-gray-600">Nenhum alerta ativo</p>
            <p className="text-xs text-gray-400 mt-1">Cria o teu primeiro alerta acima</p>
          </div>
        )}
        {alertas.map(a=>{
          const precoAtual=Math.min(...a.produto.precos.map(p=>p.valor));
          const poupanca=(precoAtual-a.precoAlvo).toFixed(2);
          return(
            <div key={a.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${a.disparado?"border-green-300 ring-1 ring-green-200":"border-gray-100"}`}>
              {a.disparado&&(
                <div className="bg-green-50 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-xs font-black text-green-700">🎉 Alerta disparado! O preço baixou.</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.produto.img}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-800 leading-tight">{a.produto.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">Alvo: <span className="font-black text-blue-600">{a.precoAlvo.toFixed(2)} €</span></p>
                    <p className="text-xs text-gray-500">Atual: <span className="font-black text-gray-700">{precoAtual.toFixed(2)} €</span></p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {a.disparado?<Badge color="green">✅ Ativo</Badge>:<Badge color="gray">⏳ A aguardar</Badge>}
                  <button onClick={()=>setAlertas(prev=>prev.filter(x=>x.id!==a.id))}
                    className="block mt-1 ml-auto text-[10px] text-red-400 font-semibold">Remover</button>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all"
                  style={{width:`${Math.min(100,Math.max(5,(a.precoAlvo/precoAtual)*100))}%`}}/>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">0 €</span>
                <span className="text-[10px] text-blue-600 font-bold">alvo: {a.precoAlvo.toFixed(2)} €</span>
                <span className="text-[10px] text-gray-400">atual: {precoAtual.toFixed(2)} €</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ 4. CARTÕES DE FIDELIZAÇÃO ══════════════════════════ */
function CartoesFidelizacao(){
  const [cartaoAberto,setCartaoAberto]=useState(null);
  return(
    <div className="pb-4">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#b45309,#d97706)"}}>
        <div className="p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">💳</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Todos os teus cartões</span></div>
          <p className="text-xl font-black">Cartões de Fidelização</p>
          <p className="text-xs opacity-75 mt-0.5">Pontos, cashback e benefícios de todos os teus cartões num só lugar</p>
        </div>
      </div>

      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
        <p className="text-xs font-black text-gray-600 mb-2">💰 Total acumulado em todos os cartões</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-amber-700">{CARTOES_DATA.reduce((a,c)=>a+c.pontos,0).toLocaleString()}</p>
            <p className="text-[9px] text-gray-500">pontos totais</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-green-700">€ {CARTOES_DATA.reduce((a,c)=>a+parseFloat(c.cashback.replace("€","")),0).toFixed(2)}</p>
            <p className="text-[9px] text-gray-500">cashback total</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-blue-700">{CARTOES_DATA.length}</p>
            <p className="text-[9px] text-gray-500">cartões ativos</p>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {CARTOES_DATA.map(c=>(
          <div key={c.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <button onClick={()=>setCartaoAberto(cartaoAberto===c.id?null:c.id)}
              className="w-full p-4 flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border"
                style={{backgroundColor:c.cor+"15",borderColor:c.cor+"33"}}>
                <LogoImg logo={{domain:c.nome.toLowerCase().includes("continente")?"continente.pt":c.nome.toLowerCase().includes("pingo")?"pingodoce.pt":c.nome.toLowerCase().includes("fnac")?"fnac.pt":"worten.pt",fb:c.logo}} size="w-10 h-10" rounded="rounded-lg"/>
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-800 text-sm">{c.nome}</p>
                <p className="text-[10px] text-gray-400">Válido: {c.validade}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{color:c.cor}}>{c.pontos.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">pontos</p>
              </div>
              <span className="text-gray-400 ml-1">{cartaoAberto===c.id?"▲":"▼"}</span>
            </button>

            <div className="px-4 pb-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{width:`${Math.min(100,(c.pontos/1500)*100)}%`,backgroundColor:c.cor}}/>
              </div>
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>{c.proximoDesconto}</span>
                <span className="font-bold text-green-600">{c.cashback} cashback</span>
              </div>
            </div>

            {cartaoAberto===c.id&&(
              <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                <p className="text-[10px] font-black text-gray-600 mb-2 uppercase tracking-wide">Benefícios ativos</p>
                {c.beneficios.map((b,i)=>(
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5"
                      style={{backgroundColor:c.cor+"20",color:c.cor}}>✓</span>
                    <p className="text-xs text-gray-600">{b}</p>
                  </div>
                ))}
                <button className="w-full mt-2 py-2 rounded-xl text-xs font-black text-white"
                  style={{backgroundColor:c.cor}}>
                  Abrir app do cartão →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mx-4 mt-3 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
        <p className="text-2xl mb-1">➕</p>
        <p className="text-xs font-black text-gray-600">Adicionar novo cartão</p>
        <p className="text-[10px] text-gray-400">Ligar mais cartões de fidelização</p>
      </div>
    </div>
  );
}

/* ═══ 5. MODO FAMÍLIA ════════════════════════════════════ */
function ModoFamilia(){
  const [membros,setMembros]=useState(FAMILIA_MEMBROS);
  const [orcamento,setOrcamento]=useState(300);
  const [gastoPartilhado,setGastoPartilhado]=useState([
    {descricao:"Compras Continente",valor:87.40,membro:1,data:"28 Mai",categoria:"🛒"},
    {descricao:"Gasolina BP",valor:65.00,membro:2,data:"27 Mai",categoria:"⛽"},
    {descricao:"Fnac — Livros",valor:23.90,membro:3,data:"26 Mai",categoria:"📚"},
    {descricao:"Pingo Doce",valor:54.20,membro:1,data:"25 Mai",categoria:"🛒"},
    {descricao:"MediaMarkt",valor:349.00,membro:2,data:"24 Mai",categoria:"📱"},
  ]);

  const totalGasto=gastoPartilhado.reduce((a,g)=>a+g.valor,0);
  const totalPoupanca=membros.reduce((a,m)=>a+m.poupanca,0);
  const pctOrcamento=Math.min(100,(totalGasto/orcamento)*100);

  return(
    <div className="pb-4">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#0f766e,#0d9488)"}}>
        <div className="p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">👨‍👩‍👧</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Exclusivo PoupeJá</span></div>
          <p className="text-xl font-black">Modo Família</p>
          <p className="text-xs opacity-75 mt-0.5">Orçamento partilhado, poupança conjunta e despesas do agregado familiar</p>
        </div>
      </div>

      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-teal-100 shadow-sm">
        <p className="text-xs font-black text-gray-600 mb-3">🏆 Poupança do agregado — Junho</p>
        <div className="flex items-end gap-2 mb-3">
          {membros.map(m=>(
            <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-xs font-black" style={{color:m.cor}}>€{m.poupanca}</p>
              <div className="w-full rounded-t-lg" style={{height:`${(m.poupanca/60)*60}px`,backgroundColor:m.cor,minHeight:"8px"}}/>
              <p className="text-[9px] text-gray-500 text-center">{m.nome}</p>
            </div>
          ))}
          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-xs font-black text-teal-600">€{totalPoupanca}</p>
            <div className="w-full rounded-t-lg bg-teal-500" style={{height:"60px"}}/>
            <p className="text-[9px] text-gray-500 text-center font-bold">Total</p>
          </div>
        </div>
        <div className="bg-teal-50 rounded-xl p-2.5 text-center border border-teal-100">
          <p className="text-2xl font-black text-teal-700">€ {totalPoupanca}</p>
          <p className="text-[10px] text-teal-600">poupança total do agregado este mês</p>
        </div>
      </div>

      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-gray-700">📊 Orçamento familiar mensal</p>
          <span className="text-sm font-black text-teal-600">€ {orcamento}</span>
        </div>
        <input type="range" min="100" max="1000" step="50" value={orcamento}
          onChange={e=>setOrcamento(parseInt(e.target.value))}
          className="w-full mb-2 cursor-pointer" style={{accentColor:"#0d9488"}}/>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full transition-all ${pctOrcamento>90?"bg-red-400":pctOrcamento>70?"bg-orange-400":"bg-teal-500"}`}
            style={{width:`${pctOrcamento}%`}}/>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400">Gasto: <strong className={pctOrcamento>90?"text-red-500":"text-gray-700"}>€{totalGasto.toFixed(0)}</strong></span>
          <span className="text-gray-400">Disponível: <strong className="text-green-600">€{Math.max(0,orcamento-totalGasto).toFixed(0)}</strong></span>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-gray-700">👤 Membros da família</p>
          <button className="text-xs text-teal-600 font-black">+ Convidar</button>
        </div>
        <div className="flex gap-2">
          {membros.map(m=>(
            <div key={m.id} className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-xl border-2"
                style={{backgroundColor:m.cor+"15",borderColor:m.cor+"44"}}>{m.avatar}</div>
              <p className="text-[10px] font-black text-gray-700">{m.nome}</p>
              <p className="text-xs font-black mt-0.5" style={{color:m.cor}}>€{m.poupanca}</p>
              <p className="text-[9px] text-gray-400">poupados</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4">
        <p className="text-xs font-black text-gray-700 mb-2">🧾 Despesas recentes do agregado</p>
        <div className="flex flex-col gap-2">
          {gastoPartilhado.slice(0,5).map((g,i)=>{
            const mem=membros.find(m=>m.id===g.membro);
            return(
              <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100">{g.categoria}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800">{g.descricao}</p>
                  <p className="text-[10px] text-gray-400">{g.data} · {mem?.nome}</p>
                </div>
                <p className="text-sm font-black text-gray-800">{g.valor.toFixed(2)} €</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ COMPARADOR GENÉRICO ════════════════════════════════ */
function Comparador({produtos,coresLoja,casas=2,sugestaoFn,ctxHeader}){
  const [busca,setBusca]=useState("");
  const [detalhe,setDetalhe]=useState(null);
  const [ordem,setOrdem]=useState("asc");
  const filtrados=produtos.filter(p=>p.nome.toLowerCase().includes(busca.toLowerCase())||p.categoria.toLowerCase().includes(busca.toLowerCase()));
  const semRes=busca.length>1&&filtrados.length===0;
  const sugeridos=semRes?(sugestaoFn?sugestaoFn(busca):produtos.slice(0,4)):[];

  function DetalheModal({produto}){
    const precos=[...produto.precos].sort((a,b)=>ordem==="asc"?a.valor-b.valor:b.valor-a.valor);
    const min=Math.min(...produto.precos.map(p=>p.valor));
    const max=Math.max(...produto.precos.map(p=>p.valor));
    return(
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-y-auto" style={{fontFamily:"'DM Sans',sans-serif"}}>
        <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={()=>setDetalhe(null)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600">←</button>
          <div className="flex-1 min-w-0"><p className="font-black text-gray-900 text-sm truncate">{produto.nome}</p><p className="text-[10px] text-gray-400">{produto.categoria}</p></div>
          <span className="text-3xl">{produto.img}</span>
        </div>
        <div className="px-4 py-3 pb-24">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white mb-4 shadow-lg">
            <p className="text-xs opacity-80 mb-0.5">💡 Poupas até</p>
            <p className="text-3xl font-black">€ {(max-min).toFixed(casas)}</p>
            <p className="text-xs opacity-75">escolhendo a loja mais barata</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-600">{precos.length} lojas comparadas</p>
            <button onClick={()=>setOrdem(o=>o==="asc"?"desc":"asc")} className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {ordem==="asc"?"↑ Mais barato":"↓ Mais caro"}
            </button>
          </div>
          <div className="flex flex-col gap-2.5 mb-4">
            {precos.map((p,i)=>{
              const isBest=p.valor===min; const isWorst=p.valor===max;
              const pct=((p.valor-min)/(max-min||1))*100;
              return(
                <div key={p.loja} className={`bg-white rounded-2xl p-4 border shadow-sm ${isBest?"border-green-300 ring-1 ring-green-200":"border-gray-100"}`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isBest?"bg-green-500 text-white":"bg-gray-100 text-gray-500"}`}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-gray-800">{p.loja}</p>
                        {isBest&&<Badge color="green">🏆 Melhor</Badge>}
                        {isWorst&&<Badge color="red">💸 Mais caro</Badge>}
                        {p.emPromo&&<Badge color="orange">🔥 Promoção</Badge>}
                      </div>
                    </div>
                    <p className={`text-xl font-black ${isBest?"text-green-600":"text-gray-800"}`}>{p.valor.toFixed(casas)} €</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full" style={{width:`${Math.max(4,100-pct)}%`,backgroundColor:isBest?"#22c55e":(coresLoja[p.loja]||"#888")+"cc"}}/>
                  </div>
                  {!isBest&&<p className="text-[10px] text-gray-400 text-right">+€{(p.valor-min).toFixed(casas)} ({Math.round(((p.valor-min)/min)*100)}% mais caro)</p>}
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-700 mb-3">📊 Comparação visual</p>
            <div className="flex items-end gap-2 h-20">
              {[...produto.precos].sort((a,b)=>a.valor-b.valor).map(p=>{
                const h=30+((p.valor-min)/(max-min||1))*70;
                return(
                  <div key={p.loja} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-bold text-gray-600">{p.valor.toFixed(casas)}</p>
                    <div className="w-full rounded-t-lg" style={{height:`${h}%`,backgroundColor:coresLoja[p.loja]||"#888",opacity:p.valor===min?1:0.55}}/>
                    <p className="text-[8px] text-gray-500">{p.loja.split(" ")[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
      {detalhe&&<DetalheModal produto={detalhe}/>}
      {ctxHeader}
      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Pesquisar produto..." value={busca} onChange={e=>setBusca(e.target.value)}
            className="w-full pl-9 pr-8 py-3 rounded-xl bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"/>
          {busca&&<button onClick={()=>setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">✕</button>}
        </div>
      </div>
      {semRes?(
        <div className="px-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 text-center">
            <p className="text-2xl mb-1">🔎</p>
            <p className="text-sm font-bold text-amber-800">Sem resultados para "{busca}"</p>
            <p className="text-xs text-amber-600 mt-0.5">Talvez te interesse algo semelhante:</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {sugeridos.map(produto=>{
              const min=Math.min(...produto.precos.map(p=>p.valor));
              const max=Math.max(...produto.precos.map(p=>p.valor));
              const melhor=produto.precos.find(p=>p.valor===min);
              return(
                <button key={produto.id} onClick={()=>setDetalhe(produto)} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm text-left active:scale-95 transition-all w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">{produto.img}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 leading-tight">{produto.nome}</p>
                      <div className="flex gap-1 mt-1"><Badge color="yellow">{produto.categoria}</Badge><Badge color="green">🏆 {melhor.loja}</Badge></div>
                    </div>
                    <div className="text-right"><p className="text-base font-black text-green-600">{min.toFixed(casas)} €</p><p className="text-[10px] text-orange-500 font-bold">Poupa € {(max-min).toFixed(casas)}</p></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ):(
        <div className="px-4 flex flex-col gap-2.5">
          {filtrados.map(produto=>{
            const min=Math.min(...produto.precos.map(p=>p.valor));
            const max=Math.max(...produto.precos.map(p=>p.valor));
            const melhor=produto.precos.find(p=>p.valor===min);
            return(
              <button key={produto.id} onClick={()=>setDetalhe(produto)} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-95 transition-all w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">{produto.img}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 leading-tight">{produto.nome}</p>
                    <div className="flex gap-1 mt-1 flex-wrap"><Badge color="gray">{produto.categoria}</Badge><Badge color="green">🏆 {melhor.loja}</Badge></div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-green-600">{min.toFixed(casas)} €</p>
                    <p className="text-[10px] text-gray-400">Poupa até</p>
                    <p className="text-xs font-bold text-orange-500">€ {(max-min).toFixed(casas)}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 h-1.5">
                  {produto.precos.map(p=><div key={p.loja} className="flex-1 rounded-full" style={{backgroundColor:coresLoja[p.loja]||"#888",opacity:p.valor===min?1:0.3}}/>)}
                </div>
                <p className="text-[10px] text-gray-400 text-right mt-1">Toca para comparar →</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ SECÇÃO MERCADOS ════════════════════════════════════ */
function SecaoMercados(){
  const [sub,setSub]=useState("promocoes");
  const [lojaFiltro,setLojaFiltro]=useState(null);

  const sugestaoSuper=(q)=>{
    const cat=SUPER_PRODUTOS.find(p=>p.categoria.toLowerCase().includes(q.toLowerCase().slice(0,3)));
    return SUPER_PRODUTOS.filter(p=>cat&&p.categoria===cat.categoria).slice(0,4)||SUPER_PRODUTOS.slice(0,4);
  };

  const ctxSuper=(
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#2563eb)"}}>
      <div className="px-4 pt-4 pb-3 text-white">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🛒</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Comparador de Preços</span></div>
        <p className="text-xl font-black">Supermercados</p>
        <p className="text-xs opacity-75 mt-0.5">Compara o mesmo produto em 5 cadeias nacionais</p>
      </div>
      <div className="bg-white/10 px-4 py-2.5 flex items-center gap-3">
        {SUPER_LOJAS.map(l=>(
          <div key={l.id} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm"><LogoImg logo={l.logo} size="w-7 h-7" rounded="rounded-lg"/></div>
            <p className="text-[8px] text-white/70 font-semibold">{l.nome.split(" ")[0]}</p>
          </div>
        ))}
        <div className="ml-auto text-right"><p className="text-lg font-black text-white">{SUPER_PRODUTOS.length}</p><p className="text-[9px] text-white/60">produtos</p></div>
      </div>
    </div>
  );

  return(
    <div className="pb-28">
      <SubNav items={[
        {id:"promocoes",icon:"📰",label:"Promoções"},
        {id:"comparar", icon:"🏷️",label:"Comparar"},
        {id:"cesto",    icon:"🧺",label:"Cesto"},
        {id:"talao",    icon:"📸",label:"Talão IA"},
      ]} active={sub} setActive={setSub}/>

      {sub==="promocoes"&&(
        <>
          <div className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-md relative" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <div className="p-4 text-white relative z-10">
              <p className="text-xs font-semibold opacity-80">🔥 Esta semana em destaque</p>
              <p className="text-xl font-black">Promoções em 5 cadeias</p>
              <p className="text-xs opacity-70">Folhetos atualizados todos os dias</p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center text-5xl opacity-20">🛒</div>
          </div>
          <div className="px-4 mb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button onClick={()=>setLojaFiltro(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${!lojaFiltro?"bg-blue-600 text-white":"bg-white text-gray-600 border border-gray-200"}`}>Todas</button>
              {SUPER_LOJAS.map(l=>(
                <button key={l.id} onClick={()=>setLojaFiltro(lojaFiltro===l.id?null:l.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${lojaFiltro===l.id?"text-white":"bg-white text-gray-600 border border-gray-200"}`}
                  style={lojaFiltro===l.id?{backgroundColor:l.cor}:{}}>
                  <LogoImg logo={l.logo} size="w-4 h-4" rounded="rounded-md"/>{l.nome}
                </button>
              ))}
            </div>
          </div>
          {(lojaFiltro?SUPER_LOJAS.filter(l=>l.id===lojaFiltro):SUPER_LOJAS).map(loja=>(
            <div key={loja.id} className="mb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <LogoImg logo={loja.logo} size="w-7 h-7" rounded="rounded-lg"/>
                <span className="font-black text-sm text-gray-800">{loja.nome}</span>
                <Badge color="blue">{loja.folhetos.length} promoções</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {loja.folhetos.map((f,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className="w-full h-16 rounded-xl flex items-center justify-center text-3xl" style={{backgroundColor:loja.cor+"12"}}>{f.img}</div>
                    <div><p className="text-xs font-bold text-gray-800 leading-tight">{f.titulo}</p><p className="text-[10px] text-gray-400 mt-0.5">{f.validade}</p></div>
                    <div className="flex items-center justify-between"><Badge color="gray">{f.categoria}</Badge><span className="text-sm font-black" style={{color:loja.cor}}>-{f.desconto}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {sub==="comparar"&&<Comparador produtos={SUPER_PRODUTOS} coresLoja={SUPER_CORES} casas={2} sugestaoFn={sugestaoSuper} ctxHeader={ctxSuper}/>}
      {sub==="cesto"&&<CestoInteligente/>}
      {sub==="talao"&&<LeituraTalao/>}
    </div>
  );
}

/* ═══ SECÇÃO LOJAS ═══════════════════════════════════════ */
function SecaoLojas(){
  const [tipo,setTipo]=useState("moda");
  const [subModa,setSubModa]=useState("promocoes");
  const [subElec,setSubElec]=useState("promocoes");
  const [filtroModa,setFiltroModa]=useState(null);
  const [filtroElec,setFiltroElec]=useState(null);

  const sugestaoElec=(q)=>{
    const cat=ELEC_PRODUTOS.find(p=>p.categoria.toLowerCase().includes(q.toLowerCase().slice(0,3)));
    return ELEC_PRODUTOS.filter(p=>cat&&p.categoria===cat.categoria).slice(0,4)||ELEC_PRODUTOS.slice(0,4);
  };

  const ctxElec=(
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)"}}>
      <div className="px-4 pt-4 pb-3 text-white">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">📱</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Comparador de Preços</span></div>
        <p className="text-xl font-black">Eletrónica & Eletrodomésticos</p>
        <p className="text-xs opacity-75 mt-0.5">Fnac · Worten · MediaMarkt · PC Diga · El Corte Inglés</p>
      </div>
      <div className="bg-white/10 px-4 py-2.5 flex items-center gap-3">
        {ELEC_LOJAS.map(l=>(
          <div key={l.id} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm"><LogoImg logo={l.logo} size="w-7 h-7" rounded="rounded-lg"/></div>
            <p className="text-[8px] text-white/70 font-semibold">{l.nome.split(" ")[0]}</p>
          </div>
        ))}
        <div className="ml-auto text-right"><p className="text-lg font-black text-white">{ELEC_PRODUTOS.length}</p><p className="text-[9px] text-white/60">produtos</p></div>
      </div>
    </div>
  );

  return(
    <div className="pb-28">
      <SubNav items={[{id:"moda",icon:"👗",label:"Moda"},{id:"eletronica",icon:"📱",label:"Eletrónica"}]} active={tipo} setActive={setTipo}/>

      {tipo==="moda"&&(
        <>
          <SubNav items={[{id:"promocoes",icon:"🏷️",label:"Promoções"},{id:"guia",icon:"🗺️",label:"Guia"}]} active={subModa} setActive={setSubModa}/>
          {subModa==="promocoes"&&(
            <>
              <div className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-md relative" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
                <div className="p-4 text-white relative z-10">
                  <p className="text-xs font-semibold opacity-80">👗 Sale em curso</p>
                  <p className="text-xl font-black">Promoções de Moda</p>
                  <p className="text-xs opacity-70 mt-0.5">Zara · H&M · Mango · Pull&Bear e mais</p>
                </div>
                <div className="absolute right-2 top-0 bottom-0 flex items-center text-5xl opacity-20">👗</div>
              </div>
              <div className="px-4 mb-3">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={()=>setFiltroModa(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${!filtroModa?"bg-purple-600 text-white":"bg-white text-gray-600 border border-gray-200"}`}>Todas</button>
                  {MODA_LOJAS.map(l=>(
                    <button key={l.id} onClick={()=>setFiltroModa(filtroModa===l.id?null:l.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroModa===l.id?"text-white":"bg-white text-gray-600 border border-gray-200"}`}
                      style={filtroModa===l.id?{backgroundColor:l.cor}:{}}>
                      <LogoImg logo={l.logo} size="w-4 h-4" rounded="rounded-md"/>{l.nome}
                    </button>
                  ))}
                </div>
              </div>
              {(filtroModa?MODA_LOJAS.filter(l=>l.id===filtroModa):MODA_LOJAS).map(loja=>(
                <div key={loja.id} className="mb-4 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LogoImg logo={loja.logo} size="w-7 h-7" rounded="rounded-lg"/>
                    <span className="font-black text-sm text-gray-800">{loja.nome}</span>
                    <Badge color="purple">{loja.promocoes.length} promoções</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {loja.promocoes.map((p,i)=>(
                      <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform">
                        <div className="w-full h-16 rounded-xl flex items-center justify-center text-3xl" style={{backgroundColor:loja.cor+"12"}}>{p.img}</div>
                        <div><p className="text-xs font-bold text-gray-800 leading-tight">{p.titulo}</p><p className="text-[10px] text-gray-400">{p.validade}</p></div>
                        <div className="flex items-center justify-between"><Badge color="gray">{p.categoria}</Badge><span className="text-sm font-black" style={{color:loja.cor}}>-{p.desconto}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
          {subModa==="guia"&&(
            <div className="px-4 flex flex-col gap-3">
              {MODA_LOJAS.map(l=>(
                <div key={l.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <LogoImg logo={l.logo} size="w-12 h-12" rounded="rounded-xl"/>
                    <div className="flex-1"><p className="font-black text-gray-800">{l.nome}</p><div className="flex gap-1 mt-1">{l.categorias.map(c=><Badge key={c} color="gray">{c}</Badge>)}</div></div>
                    <div className="text-right"><p className="text-xs font-bold text-purple-600">{l.promocoes.length} promos</p></div>
                  </div>
                  <button className="w-full mt-3 py-2 rounded-xl text-xs font-bold border border-purple-100 bg-purple-50 text-purple-700">🗺️ Ver loja mais próxima</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tipo==="eletronica"&&(
        <>
          <SubNav items={[{id:"promocoes",icon:"📰",label:"Promoções"},{id:"comparar",icon:"🏷️",label:"Comparar"}]} active={subElec} setActive={setSubElec}/>
          {subElec==="promocoes"&&(
            <>
              <div className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-md relative" style={{background:"linear-gradient(135deg,#0f172a,#1e3a8a)"}}>
                <div className="p-4 text-white relative z-10">
                  <p className="text-xs font-semibold opacity-80">📱 Tecnologia em promoção</p>
                  <p className="text-xl font-black">Fnac · Worten · MediaMarkt</p>
                  <p className="text-xs opacity-70">PC Diga · El Corte Inglés</p>
                </div>
                <div className="absolute right-2 top-0 bottom-0 flex items-center text-5xl opacity-15">📱</div>
              </div>
              <div className="px-4 mb-3">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={()=>setFiltroElec(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${!filtroElec?"bg-gray-900 text-white":"bg-white text-gray-600 border border-gray-200"}`}>Todas</button>
                  {ELEC_LOJAS.map(l=>(
                    <button key={l.id} onClick={()=>setFiltroElec(filtroElec===l.id?null:l.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroElec===l.id?"text-white":"bg-white text-gray-600 border border-gray-200"}`}
                      style={filtroElec===l.id?{backgroundColor:l.cor}:{}}>
                      <LogoImg logo={l.logo} size="w-4 h-4" rounded="rounded-md"/>{l.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 grid grid-cols-2 gap-2.5">
                {ELEC_PROMOCOES.filter(p=>!filtroElec||p.loja===ELEC_LOJAS.find(l=>l.id===filtroElec)?.nome).map((p,i)=>{
                  const li=ELEC_LOJAS.find(l=>l.nome===p.loja);
                  return(
                    <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform">
                      <div className="w-full h-16 rounded-xl flex items-center justify-center text-3xl" style={{backgroundColor:(li?.cor||"#888")+"15"}}>{p.img}</div>
                      <div><p className="text-xs font-bold text-gray-800 leading-tight">{p.titulo}</p><p className="text-[10px] text-gray-400">{p.loja} · {p.validade}</p></div>
                      <div className="flex items-center justify-between"><Badge color="gray">{p.categoria}</Badge><span className="text-sm font-black" style={{color:li?.cor||"#333"}}>-{p.desconto}</span></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {subElec==="comparar"&&<Comparador produtos={ELEC_PRODUTOS} coresLoja={ELEC_CORES} casas={0} sugestaoFn={sugestaoElec} ctxHeader={ctxElec}/>}
        </>
      )}
    </div>
  );
}

/* ═══ SECÇÃO MOBILIDADE ══════════════════════════════════ */
function SecaoMobilidade(){
  const [sub,setSub]=useState("combustiveis");
  const [tipo,setTipo]=useState("Gasolina 95");
  const [raio,setRaio]=useState(5);
  const [filtroEV,setFiltroEV]=useState("todos");

  const tipos=[...new Set(COMBUSTIVEIS.map(c=>c.tipo))];
  const filtCombus=COMBUSTIVEIS.filter(c=>c.tipo===tipo).sort((a,b)=>parseFloat(a.preco)-parseFloat(b.preco));
  const postosVis=POSTOS_EV.filter(p=>p.distancia<=raio).filter(p=>filtroEV==="todos"||p.estado===filtroEV).sort((a,b)=>a.distancia-b.distancia);
  const estConf={disponível:{dot:"bg-green-500",txt:"text-green-600",label:"Disponível",bd:"border-green-200"},
                  ocupado:{dot:"bg-red-500",txt:"text-red-500",label:"Ocupado",bd:"border-red-100"},
                  manutenção:{dot:"bg-orange-400",txt:"text-orange-500",label:"Manutenção",bd:"border-orange-100"}};
  return(
    <div className="pb-28">
      <SubNav items={[{id:"combustiveis",icon:"⛽",label:"Combustíveis"},{id:"ev",icon:"⚡",label:"Postos EV"}]} active={sub} setActive={setSub}/>
      {sub==="combustiveis"&&(
        <>
          <div className="mx-4 mt-0 mb-4 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-4 text-white shadow-md">
            <p className="text-xs font-semibold opacity-80 mb-1">💡 Melhor preço hoje</p>
            <p className="text-2xl font-black">{filtCombus[0]?.preco} €/L</p>
            <p className="text-sm opacity-90">{filtCombus[0]?.posto} · {tipo}</p>
            <p className="text-[11px] opacity-70 mt-1">Atualizado às 08:00 — Fonte: DGEG</p>
          </div>
          <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {tipos.map(t=><button key={t} onClick={()=>setTipo(t)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tipo===t?"bg-orange-500 text-white":"bg-white text-gray-600 border border-gray-200"}`}>{t}</button>)}
          </div>
          <div className="px-4 flex flex-col gap-2.5">
            {filtCombus.map((c,i)=>(
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 ${i===0?"border-orange-200 ring-1 ring-orange-200":"border-gray-100"}`}>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">{c.icone}</div>
                <div className="flex-1"><p className="font-bold text-sm text-gray-800">{c.posto}</p><p className="text-[11px] text-gray-400">{c.tipo}</p></div>
                <div className="text-right">
                  <p className="text-lg font-black">{c.preco}<span className="text-xs font-normal text-gray-400"> €/L</span></p>
                  <p className={`text-[11px] font-bold ${c.variacao<0?"text-green-600":c.variacao>0?"text-red-500":"text-gray-400"}`}>{c.variacao<0?"▼":c.variacao>0?"▲":"●"} {c.variacao!==0?Math.abs(c.variacao).toFixed(2):"estável"}</p>
                </div>
                {i===0&&<span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-lg">TOP</span>}
              </div>
            ))}
          </div>
        </>
      )}
      {sub==="ev"&&(
        <>
          <div className="mx-4 mt-0 mb-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><p className="text-sm font-black text-gray-700">📍 Raio de pesquisa</p><span className="text-xl font-black text-blue-600">{raio} km</span></div>
            <input type="range" min="0.5" max="10" step="0.5" value={raio} onChange={e=>setRaio(parseFloat(e.target.value))} className="w-full cursor-pointer" style={{accentColor:"#2563eb"}}/>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>0.5 km</span><span>5 km</span><span>10 km</span></div>
            <p className="text-[11px] text-center text-gray-500 mt-2"><strong className="text-blue-600">{postosVis.length}</strong> postos num raio de <strong>{raio} km</strong></p>
          </div>
          <div className="grid grid-cols-3 gap-2 mx-4 mb-3">
            {[["disponível","text-green-600","bg-green-50","border-green-100"],["ocupado","text-red-500","bg-red-50","border-red-100"],["manutenção","text-orange-500","bg-orange-50","border-orange-100"]].map(([e,tc,bg,bc])=>(
              <div key={e} className={`${bg} border ${bc} rounded-2xl p-3 text-center`}><p className={`text-xl font-black ${tc}`}>{postosVis.filter(p=>p.estado===e).length}</p><p className="text-[10px] text-gray-500 capitalize">{e}</p></div>
            ))}
          </div>
          <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {["todos","disponível","ocupado","manutenção"].map(f=>(
              <button key={f} onClick={()=>setFiltroEV(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${filtroEV===f?"bg-green-600 text-white":"bg-white text-gray-600 border border-gray-200"}`}>
                {f==="todos"?"Todos":f==="disponível"?"✅ Disponível":f==="ocupado"?"🔴 Ocupado":"🔧 Manutenção"}
              </button>
            ))}
          </div>
          <div className="mx-4 mb-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><p className="text-[10px] text-gray-400">Disponibilidade em tempo real · MOBI.E</p></div>
          <div className="px-4 flex flex-col gap-3">
            {postosVis.map((posto,i)=>{
              const est=estConf[posto.estado];
              const kwNum=parseInt(posto.potencia);
              const kwCor=kwNum>=100?"text-purple-600 bg-purple-50 border-purple-200":kwNum>=50?"text-blue-600 bg-blue-50 border-blue-200":"text-green-700 bg-green-50 border-green-200";
              return(
                <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border ${est.bd}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${kwCor}`}>⚡</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-800 leading-tight">{posto.nome}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{posto.operador}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${kwCor}`}>⚡ {posto.potencia}</span>
                        <Badge color="gray">{posto.tipo}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end"><span className={`w-2 h-2 rounded-full ${est.dot} ${posto.estado==="disponível"?"animate-pulse":""}`}></span><span className={`text-[11px] font-black ${est.txt}`}>{est.label}</span></div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{posto.distancia} km</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Tomadas</span><span className={`font-bold ${posto.livres>0?"text-green-600":"text-red-500"}`}>{posto.livres}/{posto.slots} livres</span></div>
                    <div className="flex gap-1">{Array.from({length:posto.slots}).map((_,si)=><div key={si} className={`flex-1 h-2.5 rounded-full ${si<posto.livres?"bg-green-400":posto.estado==="manutenção"?"bg-orange-300":"bg-red-300"}`}/>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2 rounded-xl text-xs font-bold border ${posto.estado==="disponível"?"bg-green-50 text-green-700 border-green-100":"bg-gray-50 text-gray-400 border-gray-100"}`}>🗺️ Navegar</button>
                    <button className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">🔔 Alertar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ SECÇÃO POUPANÇA ════════════════════════════════════ */
function SecaoPoupanca(){
  const [sub,setSub]=useState("dashboard");
  const total=POUPANCAS_DATA.reduce((a,p)=>a+p.economia,0);
  const historico=[{mes:"Mar",valor:98},{mes:"Abr",valor:112},{mes:"Mai",valor:117},{mes:"Jun",valor:total}];
  const maxH=Math.max(...historico.map(h=>h.valor));

  return(
    <div className="pb-28">
      <SubNav items={[
        {id:"dashboard",icon:"💶",label:"Dashboard"},
        {id:"alertas",  icon:"🔔",label:"Alertas"},
        {id:"cartoes",  icon:"💳",label:"Cartões"},
        {id:"familia",  icon:"👨‍👩‍👧",label:"Família"},
      ]} active={sub} setActive={setSub}/>

      {sub==="dashboard"&&(
        <>
          <div className="mx-4 mt-0 mb-4 rounded-2xl overflow-hidden shadow-xl" style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)"}}>
            <div className="p-5 text-white relative">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full"/>
              <p className="text-sm font-bold opacity-80">💶 Poupança estimada — Junho</p>
              <p className="text-5xl font-black mt-1">€ {total}</p>
              <p className="text-sm opacity-70 mt-1">vs. mês anterior +€{total-117} <span className="text-green-300 font-bold">(+{Math.round(((total-117)/117)*100)}%)</span></p>
              <div className="flex gap-2 mt-4 relative z-10">
                <button className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/30">📊 Relatório</button>
                <button className="bg-white text-blue-700 text-xs font-bold px-3 py-2 rounded-xl">🎯 Objetivos</button>
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
          <div className="px-4 mb-2"><p className="text-sm font-black text-gray-700">💡 Como poupaste este mês</p></div>
          <div className="px-4 flex flex-col gap-2.5 mb-4">
            {POUPANCAS_DATA.map((p,i)=>(
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl border border-blue-100">{p.icone}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><p className="font-black text-gray-800 text-sm">{p.categoria}</p><span className="text-lg font-black text-green-600">€ {p.economia}</span></div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{p.dica}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge color={p.prioridade==="alta"?"red":"orange"}>{p.prioridade==="alta"?"🔥 Alta":"⏳ Média"}</Badge>
                  <button className="text-[11px] text-blue-600 font-bold">Ver dica →</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mx-4 bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-xl">🏆</span><p className="text-sm font-black text-amber-800">Desafio de Junho</p><Badge color="yellow">Em curso</Badge></div>
            <p className="text-xs text-amber-700 mb-3">Poupa €100 usando folhetos do Lidl e Aldi.</p>
            <div className="flex justify-between text-xs text-amber-700 mb-1 font-bold"><span>€ 38</span><span>Meta: € 100</span></div>
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{width:"38%"}}/></div>
          </div>
          <div className="px-4">
            <p className="text-sm font-black text-gray-700 mb-2">🏅 Conquistas</p>
            <div className="grid grid-cols-3 gap-2">
              {[{i:"🥇",l:"Poupador Sénior",d:"+€100 num mês",a:true},{i:"🛒",l:"Caçador Deals",d:"10 promos usadas",a:true},{i:"⚡",l:"Utilizador EV",d:"5 carregamentos",a:false}].map((c,i)=>(
                <div key={i} className={`rounded-2xl p-3 text-center border ${c.a?"bg-blue-50 border-blue-100":"bg-gray-50 border-gray-100 opacity-50"}`}>
                  <p className="text-2xl">{c.i}</p>
                  <p className="text-[10px] font-black text-gray-700 mt-1 leading-tight">{c.l}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {sub==="alertas"&&<AlertasPreco/>}
      {sub==="cartoes"&&<CartoesFidelizacao/>}
      {sub==="familia"&&<ModoFamilia/>}
    </div>
  );
}

/* ═══ ECRÃ INICIAL ═══════════════════════════════════════ */
function EcraInicio({setTab}){
  const total=POUPANCAS_DATA.reduce((a,p)=>a+p.economia,0);
  return(
    <div className="pb-28">
      <div className="px-4 pt-3 pb-4">
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)"}}>
          <div className="p-5 text-white relative">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full"/>
            <div className="absolute right-6 bottom-0 text-7xl opacity-20">💶</div>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wider">O teu assistente de poupança</p>
            <p className="text-3xl font-black mt-1">Poupe<span className="text-cyan-300">Já</span></p>
            <p className="text-sm opacity-80 mt-1">Este mês já poupaste</p>
            <p className="text-4xl font-black text-cyan-300">€ {total}</p>
            <button onClick={()=>setTab("poupanca")} className="mt-3 bg-white text-blue-700 text-xs font-black px-4 py-2 rounded-xl inline-flex items-center gap-1">Ver poupança →</button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <p className="text-sm font-black text-gray-700 mb-2">✨ Funcionalidades exclusivas</p>
        <div className="flex flex-col gap-2">
          {[
            {icon:"🧺",title:"Cesto Inteligente",desc:"Descobre em qual supermercado o teu cesto fica mais barato",cor:"from-green-500 to-emerald-600",tab:"mercados"},
            {icon:"📸",title:"Leitura de Talão IA",desc:"Fotografa o talão e vê quanto podias ter poupado",cor:"from-purple-500 to-violet-600",tab:"mercados"},
            {icon:"🔔",title:"Alertas de Preço",desc:"Avisa-te quando um produto baixar para o teu preço alvo",cor:"from-slate-700 to-slate-900",tab:"poupanca"},
            {icon:"💳",title:"Cartões de Fidelização",desc:"Todos os teus pontos e cashback num só lugar",cor:"from-amber-500 to-orange-500",tab:"poupanca"},
            {icon:"👨‍👩‍👧",title:"Modo Família",desc:"Orçamento partilhado e poupança conjunta do agregado",cor:"from-teal-500 to-green-600",tab:"poupanca"},
          ].map((f,i)=>(
            <button key={i} onClick={()=>setTab(f.tab)}
              className={`bg-gradient-to-r ${f.cor} rounded-2xl p-4 text-white text-left shadow-md active:scale-95 transition-all flex items-center gap-4`}>
              <span className="text-3xl flex-shrink-0">{f.icon}</span>
              <div><p className="text-sm font-black leading-tight">{f.title}</p><p className="text-[11px] opacity-75 mt-0.5">{f.desc}</p></div>
              <span className="ml-auto opacity-60 text-lg">→</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <p className="text-sm font-black text-gray-700 mb-2">⚡ Acesso rápido</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            {icon:"📰",label:"Folhetos",tab:"mercados"},{icon:"🏷️",label:"Comparar",tab:"mercados"},
            {icon:"👗",label:"Moda",tab:"lojas"},{icon:"📱",label:"Eletrónica",tab:"lojas"},
            {icon:"⛽",label:"Combustíveis",tab:"mobilidade"},{icon:"⚡",label:"Postos EV",tab:"mobilidade"},
          ].map((it,i)=>(
            <button key={i} onClick={()=>setTab(it.tab)} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <span className="text-2xl">{it.icon}</span>
              <span className="text-[10px] font-black text-gray-700">{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-xs font-black text-amber-800 mb-1">💡 Dica do dia</p>
        <p className="text-sm font-bold text-gray-800">Bazar Lidl com 60% de desconto esta semana!</p>
        <p className="text-[10px] text-gray-500 mt-1">Válido até 4 de Junho · Sem cartão necessário</p>
        <button onClick={()=>setTab("mercados")} className="mt-2 text-xs text-orange-600 font-black">Ver folheto →</button>
      </div>
    </div>
  );
}

/* ═══ APP PRINCIPAL ══════════════════════════════════════ */
export default function PoupeJa(){
  const [tab,setTab]=useState("inicio");
  const titulos={
    inicio:{t:"Olá, bem-vindo! 👋",s:"Portugal · 28 maio 2025"},
    mercados:{t:"Supermercados",s:"Promoções · Comparar · Cesto · Talão IA"},
    lojas:{t:"Lojas",s:"Moda · Eletrónica · Promoções"},
    mobilidade:{t:"Mobilidade",s:"Combustíveis & Postos EV"},
    poupanca:{t:"A Tua Poupança",s:"Dashboard · Alertas · Cartões · Família"},
  };
  const info=titulos[tab];
  const secoes={
    inicio:<EcraInicio setTab={setTab}/>,
    mercados:<SecaoMercados/>,
    lojas:<SecaoLojas/>,
    mobilidade:<SecaoMobilidade/>,
    poupanca:<SecaoPoupanca/>,
  };
  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{font-family:'DM Sans',sans-serif;box-sizing:border-box}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        body{margin:0;background:#f1f5f9}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;background:#e2e8f0;outline:none;width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;cursor:pointer;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,.35);background:#2563eb}
      `}</style>
      <div className="min-h-screen bg-slate-100 max-w-md mx-auto relative">
        <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-gray-900" style={{fontFamily:"'Sora',sans-serif"}}>Poupe<span className="text-blue-600">Já</span></span>
              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-md">PT</span>
            </div>
            <div className="flex gap-1.5">
              <button className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-sm border border-gray-100">🔔</button>
              <button className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm border border-blue-100">👤</button>
            </div>
          </div>
          <h1 className="text-base font-black text-gray-900 leading-tight">{info.t}</h1>
          <p className="text-[10px] text-gray-400 font-medium">{info.s}</p>
        </div>
        <main>{secoes[tab]}</main>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-1 py-1 z-40 shadow-lg">
          <div className="flex items-center justify-around">
            {NAV.map(it=>(
              <button key={it.id} onClick={()=>setTab(it.id)} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${tab===it.id?"bg-blue-50":""}`}>
                <span className={`text-xl ${tab===it.id?"":"opacity-60"}`}>{it.icon}</span>
                <span className={`text-[9px] font-black ${tab===it.id?"text-blue-600":"text-gray-400"}`}>{it.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
