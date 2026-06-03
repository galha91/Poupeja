import { useState } from "react";
import { Shirt, Smartphone, Tag, ChevronRight, TrendingDown, Search, X, ChevronLeft, Trophy, Flame, Star, MapPin } from "lucide-react";

/* ═══ CORES E DOMÍNIOS ════════════════════════════════════ */
const LOJA_CORES = {
  Zara:"#1a1a1a", "H&M":"#e50010", Mango:"#b8934a", "Pull&Bear":"#333333",
  Stradivarius:"#8b6914", Bershka:"#ff6b35",
  Fnac:"#f7a600", Worten:"#e30613", MediaMarkt:"#cc0000",
  "PC Diga":"#0066cc", "El Corte Inglés":"#006633",
};
const LOJA_DOMINIOS = {
  Zara:"zara.com", "H&M":"hm.com", Mango:"mango.com", "Pull&Bear":"pullandbear.com",
  Stradivarius:"stradivarius.com", Bershka:"bershka.com",
  Fnac:"fnac.pt", Worten:"worten.pt", MediaMarkt:"mediamarkt.pt",
  "PC Diga":"pcdiga.com", "El Corte Inglés":"elcorteingles.pt",
};

/* ═══ DADOS MODA ══════════════════════════════════════════ */
const MODA_PROMOCOES = [
  {loja:"Zara",titulo:"Sale Verão — Mulher",desconto:"50%",categoria:"Mulher",validade:"até 15 Jun",img:"👗"},
  {loja:"Zara",titulo:"Coleção Homem SS25",desconto:"30%",categoria:"Homem",validade:"até 10 Jun",img:"👔"},
  {loja:"H&M",titulo:"20% em toda a loja",desconto:"20%",categoria:"Todos",validade:"até 5 Jun",img:"👚"},
  {loja:"H&M",titulo:"Criança — Verão",desconto:"25%",categoria:"Criança",validade:"até 20 Jun",img:"🎒"},
  {loja:"Mango",titulo:"Outlet até -70%",desconto:"70%",categoria:"Mulher",validade:"até 20 Jun",img:"👒"},
  {loja:"Pull&Bear",titulo:"Sale — Básicos",desconto:"40%",categoria:"Homem",validade:"até 8 Jun",img:"👕"},
  {loja:"Pull&Bear",titulo:"Jeans Collection",desconto:"25%",categoria:"Todos",validade:"até 12 Jun",img:"👖"},
  {loja:"Stradivarius",titulo:"Summer Vibes",desconto:"35%",categoria:"Mulher",validade:"até 7 Jun",img:"🌸"},
  {loja:"Bershka",titulo:"Street Style Sale",desconto:"45%",categoria:"Todos",validade:"até 14 Jun",img:"🧢"},
];

const MODA_LOJAS = ["Zara","H&M","Mango","Pull&Bear","Stradivarius","Bershka"];

/* ═══ DADOS ELETRÓNICA ════════════════════════════════════ */
const ELEC_CORES = {Fnac:"#f7a600",Worten:"#e30613",MediaMarkt:"#cc0000","PC Diga":"#0066cc","El Corte Inglés":"#006633"};
const ELEC_LOJAS = ["Fnac","Worten","MediaMarkt","PC Diga","El Corte Inglés"];

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
    {loja:"Fnac",valor:929,emPromo:false},{loja:"Worten",valor:919,emPromo:true},
    {loja:"MediaMarkt",valor:899,emPromo:true},{loja:"PC Diga",valor:909,emPromo:false},{loja:"El Corte Inglés",valor:939,emPromo:false}]},
  {id:2,nome:"Samsung Galaxy S25 256GB",categoria:"Smartphones",img:"📱",precos:[
    {loja:"Fnac",valor:849,emPromo:false},{loja:"Worten",valor:829,emPromo:true},
    {loja:"MediaMarkt",valor:819,emPromo:false},{loja:"PC Diga",valor:839,emPromo:false},{loja:"El Corte Inglés",valor:859,emPromo:false}]},
  {id:3,nome:'MacBook Air M3 13"',categoria:"Computadores",img:"💻",precos:[
    {loja:"Fnac",valor:1199,emPromo:true},{loja:"Worten",valor:1229,emPromo:false},
    {loja:"MediaMarkt",valor:1189,emPromo:false},{loja:"PC Diga",valor:1179,emPromo:true},{loja:"El Corte Inglés",valor:1249,emPromo:false}]},
  {id:4,nome:"Sony WH-1000XM5",categoria:"Áudio",img:"🎧",precos:[
    {loja:"Fnac",valor:289,emPromo:true},{loja:"Worten",valor:299,emPromo:false},
    {loja:"MediaMarkt",valor:279,emPromo:false},{loja:"PC Diga",valor:269,emPromo:true},{loja:"El Corte Inglés",valor:319,emPromo:false}]},
  {id:5,nome:'Samsung TV 55" QLED',categoria:"TV",img:"📺",precos:[
    {loja:"Fnac",valor:699,emPromo:false},{loja:"Worten",valor:679,emPromo:true},
    {loja:"MediaMarkt",valor:649,emPromo:true},{loja:"PC Diga",valor:689,emPromo:false},{loja:"El Corte Inglés",valor:729,emPromo:false}]},
  {id:6,nome:"PlayStation 5 Slim",categoria:"Gaming",img:"🎮",precos:[
    {loja:"Fnac",valor:449,emPromo:false},{loja:"Worten",valor:439,emPromo:true},
    {loja:"MediaMarkt",valor:429,emPromo:true},{loja:"PC Diga",valor:449,emPromo:false},{loja:"El Corte Inglés",valor:459,emPromo:false}]},
  {id:7,nome:'iPad Pro 11" M4',categoria:"Tablets",img:"📟",precos:[
    {loja:"Fnac",valor:1099,emPromo:false},{loja:"Worten",valor:1079,emPromo:false},
    {loja:"MediaMarkt",valor:1059,emPromo:true},{loja:"PC Diga",valor:1089,emPromo:false},{loja:"El Corte Inglés",valor:1129,emPromo:false}]},
  {id:8,nome:"AirPods Pro 2ª Geração",categoria:"Áudio",img:"🎵",precos:[
    {loja:"Fnac",valor:249,emPromo:true},{loja:"Worten",valor:239,emPromo:false},
    {loja:"MediaMarkt",valor:229,emPromo:true},{loja:"PC Diga",valor:245,emPromo:false},{loja:"El Corte Inglés",valor:259,emPromo:false}]},
];

const ELEC_CATEGORIAS = ["Todas", ...new Set(ELEC_PRODUTOS.map(p => p.categoria))];

/* ═══ LOGO LOJA ═══════════════════════════════════════════ */
function LogoLoja({ loja, size = 32 }) {
  const cor = LOJA_CORES[loja] || "#888";
  const dominio = LOJA_DOMINIOS[loja];
  const [nivel, setNivel] = useState(0);
  const iniciais = loja.split(/[\s&]+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const fontes = dominio ? [
    `https://www.google.com/s2/favicons?domain=${dominio}&sz=64`,
    `https://logo.clearbit.com/${dominio}`,
    `https://icon.horse/icon/${dominio}`,
  ] : [];
  return (
    <div className="rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: cor + "18", border: `1.5px solid ${cor}33` }}>
      {nivel < fontes.length ? (
        <img src={fontes[nivel]} alt={loja} onError={() => setNivel(n => n + 1)}
          style={{ width: size * 0.72, height: size * 0.72, objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: size * 0.32, fontWeight: 900, color: cor }}>{iniciais}</span>
      )}
    </div>
  );
}

/* ═══ DETALHE PRODUTO ELETRÓNICA ══════════════════════════ */
function DetalheElec({ produto, onVoltar }) {
  const precos = [...produto.precos].sort((a, b) => a.valor - b.valor);
  const min = precos[0].valor, max = precos[precos.length - 1].valor, melhor = precos[0];
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-y-auto">
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onVoltar} className="flex items-center gap-1 text-slate-700 font-bold text-sm mb-3">
          <ChevronLeft size={16}/> Voltar
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl border border-slate-200 flex-shrink-0">{produto.img}</div>
          <div className="flex-1">
            <p className="font-black text-slate-900 text-base leading-tight">{produto.nome}</p>
            <span className="inline-block mt-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{produto.categoria}</span>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4 pb-10">
        <div className="rounded-2xl p-4 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)" }}>
          <p className="text-xs font-bold opacity-80 mb-2 flex items-center gap-1"><Trophy size={13}/> Melhor preço</p>
          <div className="flex items-center gap-3">
            <LogoLoja loja={melhor.loja} size={44} />
            <div className="flex-1">
              <p className="font-black text-lg">{melhor.loja}</p>
              {melhor.emPromo && <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Flame size={9}/> Promoção</span>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{melhor.valor}€</p>
              <p className="text-xs opacity-75">Poupa {max - min}€</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Comparação por loja</p>
          <div className="flex flex-col gap-2.5">
            {precos.map((p, i) => {
              const isBest = p.valor === min, isWorst = p.valor === max;
              const pct = max > min ? ((p.valor - min) / (max - min)) * 100 : 0;
              return (
                <div key={p.loja} className="bg-white rounded-2xl p-4 border shadow-sm"
                  style={{ borderColor: isBest ? "#1e3a8a" : "#f1f5f9", boxShadow: isBest ? "0 0 0 1px #1e3a8a44" : undefined }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: isBest ? "#1e3a8a" : "#f1f5f9", color: isBest ? "white" : "#94a3b8" }}>{i + 1}</div>
                    <LogoLoja loja={p.loja} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-slate-800">{p.loja}</p>
                        {isBest && <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Trophy size={8}/> Mais barato</span>}
                        {isWorst && <span className="text-[9px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Mais caro</span>}
                        {p.emPromo && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Flame size={8}/> Promo</span>}
                      </div>
                    </div>
                    <p className="text-xl font-black flex-shrink-0" style={{ color: isBest ? "#1e3a8a" : "#1e293b" }}>{p.valor}€</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(8, 100 - pct)}%`, backgroundColor: isBest ? "#1e3a8a" : (ELEC_CORES[p.loja] + "99") }} />
                  </div>
                  {!isBest && <p className="text-[10px] text-slate-400 text-right">+{p.valor - min}€ vs. mais barato</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ SEPARADOR MODA ══════════════════════════════════════ */
function SubModa() {
  const [filtro, setFiltro] = useState(null);
  const lojasFiltradas = filtro ? MODA_LOJAS.filter(l => l === filtro) : MODA_LOJAS;
  const promosFiltradas = filtro ? MODA_PROMOCOES.filter(p => p.loja === filtro) : MODA_PROMOCOES;

  return (
    <div>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
        <div className="px-4 pt-4 pb-3 text-white">
          <div className="flex items-center gap-2 mb-1"><Shirt size={18}/><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Promoções de Moda</span></div>
          <p className="text-xl font-black">Moda & Tendências</p>
          <p className="text-xs opacity-75 mt-0.5">Zara · H&M · Mango · Pull&Bear · Stradivarius · Bershka</p>
        </div>
        <div className="bg-white/10 px-4 py-2.5 flex items-center gap-2.5">
          {MODA_LOJAS.map(loja => (
            <div key={loja} className="flex flex-col items-center gap-1">
              <LogoLoja loja={loja} size={30} />
              <p className="text-[8px] text-white/70 font-semibold">{loja.split(" ")[0]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setFiltro(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ backgroundColor: !filtro ? "#7c3aed" : "white", color: !filtro ? "white" : "#64748b", border: !filtro ? "none" : "1px solid #e2e8f0" }}>
            Todas
          </button>
          {MODA_LOJAS.map(loja => (
            <button key={loja} onClick={() => setFiltro(filtro === loja ? null : loja)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ backgroundColor: filtro === loja ? (LOJA_CORES[loja] + "22") : "white", color: filtro === loja ? LOJA_CORES[loja] : "#64748b", border: `1px solid ${filtro === loja ? LOJA_CORES[loja] + "44" : "#e2e8f0"}` }}>
              <LogoLoja loja={loja} size={16} />
              {loja}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-2.5">
        {promosFiltradas.map((p, i) => {
          const cor = LOJA_CORES[p.loja] || "#7c3aed";
          return (
            <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer">
              <div className="w-full h-16 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: cor + "12" }}>{p.img}</div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">{p.titulo}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.loja} · {p.validade}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{p.categoria}</span>
                <span className="text-sm font-black" style={{ color: cor }}>-{p.desconto}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ SEPARADOR ELETRÓNICA ════════════════════════════════ */
function SubEletronica() {
  const [vista, setVista] = useState("promocoes");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [detalhe, setDetalhe] = useState(null);

  const filtrados = ELEC_PRODUTOS.filter(p => {
    const mb = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase());
    const mc = categoria === "Todas" || p.categoria === categoria;
    return mb && mc;
  });

  if (detalhe) return <DetalheElec produto={detalhe} onVoltar={() => setDetalhe(null)} />;

  return (
    <div>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)" }}>
        <div className="px-4 pt-4 pb-3 text-white">
          <div className="flex items-center gap-2 mb-1"><Smartphone size={18}/><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Eletrónica & Tech</span></div>
          <p className="text-xl font-black">Eletrónica & Eletrodomésticos</p>
          <p className="text-xs opacity-75 mt-0.5">Fnac · Worten · MediaMarkt · PC Diga · El Corte Inglés</p>
        </div>
        <div className="bg-white/10 px-4 py-2.5 flex items-center gap-2.5">
          {ELEC_LOJAS.map(loja => (
            <div key={loja} className="flex flex-col items-center gap-1">
              <LogoLoja loja={loja} size={30} />
              <p className="text-[8px] text-white/70 font-semibold">{loja.split(" ")[0]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        {[{id:"promocoes",label:"Promoções"},{id:"comparar",label:"Comparar"}].map(v => (
          <button key={v.id} onClick={() => setVista(v.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${vista === v.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {vista === "promocoes" && (
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {ELEC_PROMOCOES.map((p, i) => {
            const cor = ELEC_CORES[p.loja] || "#0f172a";
            return (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer">
                <div className="w-full h-16 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: cor + "12" }}>{p.img}</div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{p.titulo}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.loja} · {p.validade}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{p.categoria}</span>
                  <span className="text-sm font-black" style={{ color: cor }}>-{p.desconto}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vista === "comparar" && (
        <div>
          <div className="px-4 mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="text" placeholder="Pesquisar produto..." value={busca} onChange={e => setBusca(e.target.value)}
                className="w-full pl-9 pr-9 py-3 rounded-xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm"/>
              {busca && <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>}
            </div>
          </div>
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {ELEC_CATEGORIAS.map(cat => (
                <button key={cat} onClick={() => setCategoria(cat)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ backgroundColor: categoria === cat ? "#0f172a" : "white", color: categoria === cat ? "white" : "#64748b", border: categoria === cat ? "none" : "1px solid #e2e8f0" }}>{cat}</button>
              ))}
            </div>
          </div>
          {filtrados.length > 0 && <div className="px-4 mb-2"><p className="text-xs text-slate-400 font-semibold">{filtrados.length} produto{filtrados.length !== 1 ? "s" : ""}</p></div>}
          <div className="px-4 flex flex-col gap-2.5">
            {filtrados.map(produto => {
              const min = Math.min(...produto.precos.map(p => p.valor));
              const max = Math.max(...produto.precos.map(p => p.valor));
              const melhor = produto.precos.find(p => p.valor === min);
              const temPromo = produto.precos.some(p => p.emPromo);
              return (
                <button key={produto.id} onClick={() => setDetalhe(produto)} className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-left active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 flex-shrink-0">{produto.img}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 leading-tight">{produto.nome}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <LogoLoja loja={melhor.loja} size={22} />
                        <p className="text-[11px] text-slate-500"><span className="font-black" style={{ color: ELEC_CORES[melhor.loja] }}>{melhor.loja}</span> — mais barato</p>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {produto.precos.map(p => <div key={p.loja} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: ELEC_CORES[p.loja], opacity: p.valor === min ? 1 : 0.22 }}/>)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-lg font-black text-blue-800">{min}€</p>
                      <p className="text-[10px] text-slate-400">Poupa até</p>
                      <p className="text-xs font-black text-orange-500">€ {max - min}</p>
                      {temPromo && <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full"><Flame size={8}/> Promo</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ SECÇÃO LOJAS PRINCIPAL ══════════════════════════════ */
export default function SecaoLojas() {
  const [tipo, setTipo] = useState("moda");

  return (
    <div className="pb-28 pt-4">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        <button onClick={() => setTipo("moda")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tipo === "moda" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
          <Shirt size={14}/> Moda
        </button>
        <button onClick={() => setTipo("eletronica")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tipo === "eletronica" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
          <Smartphone size={14}/> Eletrónica
        </button>
      </div>

      {tipo === "moda" && <SubModa />}
      {tipo === "eletronica" && <SubEletronica />}
    </div>
  );
}
