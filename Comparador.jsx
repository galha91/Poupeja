import { useState } from "react";
import LogoLoja from "./LogoLoja";

const SUPER_CORES = {
  Continente: "#e63329", "Pingo Doce": "#009a3e", Lidl: "#0050aa",
  Aldi: "#1a3b6f", "Intermarché": "#e2001a",
};

const SUPER_PRODUTOS = [
  {id:1,nome:"Leite meio-gordo UHT 1L",categoria:"Lacticínios",img:"🥛",precos:[
    {loja:"Continente",valor:0.89,emPromo:false},{loja:"Pingo Doce",valor:0.85,emPromo:true},
    {loja:"Lidl",valor:0.79,emPromo:false},{loja:"Aldi",valor:0.75,emPromo:false},{loja:"Intermarché",valor:0.82,emPromo:false}]},
  {id:2,nome:"Frango inteiro 1 kg",categoria:"Carnes",img:"🍗",precos:[
    {loja:"Continente",valor:2.49,emPromo:true},{loja:"Pingo Doce",valor:2.69,emPromo:false},
    {loja:"Lidl",valor:2.29,emPromo:false},{loja:"Aldi",valor:2.19,emPromo:false},{loja:"Intermarché",valor:2.39,emPromo:true}]},
  {id:3,nome:"Azeite virgem extra 750 ml",categoria:"Óleos",img:"🫒",precos:[
    {loja:"Continente",valor:4.99,emPromo:false},{loja:"Pingo Doce",valor:4.79,emPromo:true},
    {loja:"Lidl",valor:4.29,emPromo:false},{loja:"Aldi",valor:3.99,emPromo:false},{loja:"Intermarché",valor:4.49,emPromo:true}]},
  {id:4,nome:"Pão de forma fatiado 500g",categoria:"Padaria",img:"🍞",precos:[
    {loja:"Continente",valor:1.39,emPromo:false},{loja:"Pingo Doce",valor:1.29,emPromo:false},
    {loja:"Lidl",valor:0.99,emPromo:false},{loja:"Aldi",valor:0.95,emPromo:false},{loja:"Intermarché",valor:1.15,emPromo:true}]},
  {id:5,nome:"Iogurte natural 4×125g",categoria:"Lacticínios",img:"🥣",precos:[
    {loja:"Continente",valor:1.19,emPromo:false},{loja:"Pingo Doce",valor:0.99,emPromo:true},
    {loja:"Lidl",valor:0.89,emPromo:false},{loja:"Aldi",valor:0.85,emPromo:false},{loja:"Intermarché",valor:1.05,emPromo:false}]},
  {id:6,nome:"Água mineral 6×1.5L",categoria:"Bebidas",img:"💧",precos:[
    {loja:"Continente",valor:2.29,emPromo:false},{loja:"Pingo Doce",valor:1.99,emPromo:true},
    {loja:"Lidl",valor:1.79,emPromo:false},{loja:"Aldi",valor:1.69,emPromo:false},{loja:"Intermarché",valor:1.89,emPromo:false}]},
  {id:7,nome:"Arroz agulha 1 kg",categoria:"Cereais",img:"🍚",precos:[
    {loja:"Continente",valor:1.49,emPromo:false},{loja:"Pingo Doce",valor:1.39,emPromo:false},
    {loja:"Lidl",valor:1.19,emPromo:false},{loja:"Aldi",valor:1.09,emPromo:false},{loja:"Intermarché",valor:1.29,emPromo:true}]},
  {id:8,nome:"Detergente roupa líquido 2L",categoria:"Limpeza",img:"🧺",precos:[
    {loja:"Continente",valor:6.99,emPromo:true},{loja:"Pingo Doce",valor:7.29,emPromo:false},
    {loja:"Lidl",valor:5.49,emPromo:false},{loja:"Aldi",valor:4.99,emPromo:false},{loja:"Intermarché",valor:6.19,emPromo:true}]},
  {id:9,nome:"Manteiga com sal 250g",categoria:"Lacticínios",img:"🧈",precos:[
    {loja:"Continente",valor:2.19,emPromo:false},{loja:"Pingo Doce",valor:1.99,emPromo:false},
    {loja:"Lidl",valor:1.79,emPromo:false},{loja:"Aldi",valor:1.69,emPromo:false},{loja:"Intermarché",valor:1.89,emPromo:true}]},
  {id:10,nome:"Ovos grandes M 12 un.",categoria:"Frescos",img:"🥚",precos:[
    {loja:"Continente",valor:2.49,emPromo:false},{loja:"Pingo Doce",valor:2.29,emPromo:true},
    {loja:"Lidl",valor:2.09,emPromo:false},{loja:"Aldi",valor:1.99,emPromo:false},{loja:"Intermarché",valor:2.19,emPromo:false}]},
  {id:11,nome:"Café moído 250g",categoria:"Bebidas",img:"☕",precos:[
    {loja:"Continente",valor:2.89,emPromo:true},{loja:"Pingo Doce",valor:2.69,emPromo:false},
    {loja:"Lidl",valor:2.29,emPromo:false},{loja:"Aldi",valor:2.19,emPromo:false},{loja:"Intermarché",valor:2.49,emPromo:false}]},
  {id:12,nome:"Massa esparguete 500g",categoria:"Cereais",img:"🍝",precos:[
    {loja:"Continente",valor:0.99,emPromo:false},{loja:"Pingo Doce",valor:0.89,emPromo:false},
    {loja:"Lidl",valor:0.69,emPromo:false},{loja:"Aldi",valor:0.65,emPromo:false},{loja:"Intermarché",valor:0.79,emPromo:true}]},
];

const CATEGORIAS = ["Todas", ...new Set(SUPER_PRODUTOS.map(p => p.categoria))];
const LOJAS = ["Continente", "Pingo Doce", "Lidl", "Aldi", "Intermarché"];

function DetalheProducto({ produto, onVoltar }) {
  const precos = [...produto.precos].sort((a, b) => a.valor - b.valor);
  const min = precos[0].valor, max = precos[precos.length - 1].valor, melhor = precos[0];

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onVoltar} className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-3">← Voltar</button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl border border-blue-100 flex-shrink-0">{produto.img}</div>
          <div className="flex-1">
            <p className="font-black text-gray-900 text-base leading-tight">{produto.nome}</p>
            <span className="inline-block mt-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{produto.categoria}</span>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4 pb-10">
        <div className="rounded-2xl p-4 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
          <p className="text-xs font-bold opacity-80 mb-2">✨ Sugestão inteligente</p>
          <div className="flex items-center gap-3">
            <LogoLoja loja={melhor.loja} size={44} rounded="rounded-xl" />
            <div className="flex-1">
              <p className="font-black text-lg leading-tight">{melhor.loja}</p>
              <p className="text-xs opacity-80">Melhor preço disponível</p>
              {melhor.emPromo && <span className="inline-block mt-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">🔥 Em promoção</span>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{min.toFixed(2)}€</p>
              <p className="text-xs opacity-75">Poupa até {(max - min).toFixed(2)}€</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Comparação por supermercado</p>
          <div className="flex flex-col gap-2.5">
            {precos.map((p, i) => {
              const isBest = p.valor === min, isWorst = p.valor === max;
              const pct = max > min ? ((p.valor - min) / (max - min)) * 100 : 0;
              return (
                <div key={p.loja} className="bg-white rounded-2xl p-4 border shadow-sm"
                  style={{ borderColor: isBest ? "#10b981" : "#f3f4f6", boxShadow: isBest ? "0 0 0 1px #10b98144" : undefined }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: isBest ? "#10b981" : "#f3f4f6", color: isBest ? "white" : "#9ca3af" }}>{i + 1}</div>
                    <LogoLoja loja={p.loja} size={36} rounded="rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-gray-800">{p.loja}</p>
                        {isBest && <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🏆 Mais barato</span>}
                        {isWorst && <span className="text-[9px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">💸 Mais caro</span>}
                        {p.emPromo && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥 Promoção</span>}
                      </div>
                    </div>
                    <p className="text-xl font-black flex-shrink-0" style={{ color: isBest ? "#059669" : "#1f2937" }}>{p.valor.toFixed(2)}€</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(8, 100 - pct)}%`, backgroundColor: isBest ? "#10b981" : (SUPER_CORES[p.loja] + "99") }} />
                  </div>
                  {!isBest && <p className="text-[10px] text-gray-400 text-right">+{(p.valor - min).toFixed(2)}€ vs. mais barato ({Math.round(((p.valor - min) / min) * 100)}% mais caro)</p>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Comparação visual</p>
          <div className="flex items-end gap-2" style={{ height: 90 }}>
            {[...produto.precos].sort((a, b) => a.valor - b.valor).map(p => {
              const h = 24 + ((p.valor - min) / (max - min || 1)) * 60, isBest = p.valor === min;
              return (
                <div key={p.loja} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[9px] font-bold text-gray-600">{p.valor.toFixed(2)}</p>
                  <div className="w-full rounded-t-lg" style={{ height: h, backgroundColor: SUPER_CORES[p.loja], opacity: isBest ? 1 : 0.4 }} />
                  <LogoLoja loja={p.loja} size={22} rounded="rounded-md" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardProduto({ produto, onClick }) {
  const min = Math.min(...produto.precos.map(p => p.valor));
  const max = Math.max(...produto.precos.map(p => p.valor));
  const melhor = produto.precos.find(p => p.valor === min);
  const temPromo = produto.precos.some(p => p.emPromo);
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-95 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl border border-blue-100 flex-shrink-0">{produto.img}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-800 leading-tight">{produto.nome}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <LogoLoja loja={melhor.loja} size={22} rounded="rounded-md" />
            <p className="text-[11px] text-gray-500"><span className="font-black" style={{ color: SUPER_CORES[melhor.loja] }}>{melhor.loja}</span> — mais barato</p>
          </div>
          <div className="flex gap-1 mt-2">
            {produto.precos.map(p => <div key={p.loja} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: SUPER_CORES[p.loja], opacity: p.valor === min ? 1 : 0.22 }} />)}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-lg font-black text-green-600">{min.toFixed(2)}€</p>
          <p className="text-[10px] text-gray-400">Poupa até</p>
          <p className="text-xs font-black text-orange-500">€ {(max - min).toFixed(2)}</p>
          {temPromo && <span className="inline-block mt-1 text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥 Promo</span>}
        </div>
      </div>
    </button>
  );
}

export default function ComparadorPrecos() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [detalhe, setDetalhe] = useState(null);

  const filtrados = SUPER_PRODUTOS.filter(p => {
    const mb = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase());
    const mc = categoria === "Todas" || p.categoria === categoria;
    return mb && mc;
  });

  if (detalhe) return <DetalheProducto produto={detalhe} onVoltar={() => setDetalhe(null)} />;

  return (
    <div className="pb-6">
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
        <div className="px-4 pt-4 pb-3 text-white">
          <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🏷️</span><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Comparador de Preços</span></div>
          <p className="text-xl font-black">Supermercados</p>
          <p className="text-xs opacity-75 mt-0.5">Compara o mesmo produto em 5 cadeias nacionais</p>
        </div>
        <div className="bg-white/10 px-4 py-2.5 flex items-center gap-3">
          {LOJAS.map(loja => (
            <div key={loja} className="flex flex-col items-center gap-1">
              <LogoLoja loja={loja} size={32} rounded="rounded-lg" />
              <p className="text-[8px] text-white/70 font-semibold">{loja.split(" ")[0]}</p>
            </div>
          ))}
          <div className="ml-auto text-right"><p className="text-lg font-black text-white">{SUPER_PRODUTOS.length}</p><p className="text-[9px] text-white/60">produtos</p></div>
        </div>
      </div>
      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Pesquisar produto... ex: leite, frango" value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-9 py-3 rounded-xl bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          {busca && <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">✕</button>}
        </div>
      </div>
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setCategoria(cat)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ backgroundColor: categoria === cat ? "#2563eb" : "white", color: categoria === cat ? "white" : "#6b7280", border: categoria === cat ? "none" : "1px solid #e5e7eb" }}>{cat}</button>
          ))}
        </div>
      </div>
      {filtrados.length === 0 && (
        <div className="mx-4 bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">🔎</p>
          <p className="text-sm font-bold text-amber-800">Sem resultados para "{busca}"</p>
          <button onClick={() => { setBusca(""); setCategoria("Todas"); }} className="mt-3 text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">Limpar pesquisa</button>
        </div>
      )}
      {filtrados.length > 0 && <div className="px-4 mb-2"><p className="text-xs text-gray-400 font-semibold">{filtrados.length} produto{filtrados.length !== 1 ? "s" : ""}{categoria !== "Todas" ? ` em ${categoria}` : ""}{busca ? ` para "${busca}"` : ""}</p></div>}
      <div className="px-4 flex flex-col gap-2.5">
        {filtrados.map(produto => <CardProduto key={produto.id} produto={produto} onClick={() => setDetalhe(produto)} />)}
      </div>
    </div>
  );
}
