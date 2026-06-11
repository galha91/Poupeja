import { useState, useRef } from "react";
import { Camera, Upload, Check, X, Loader, ShoppingCart, TrendingDown, Calendar, Store, Receipt, ChevronRight, Sparkles, AlertCircle, Plus } from "lucide-react";

const LOJA_CORES = {
  Continente:"#e63329", "Pingo Doce":"#009a3e", Lidl:"#0050aa",
  Aldi:"#1a3b6f", "Intermarché":"#e2001a", Auchan:"#e3001b",
};

export default function SecaoTalao() {
  const [estado, setEstado] = useState("inicio"); // inicio, analisar, resultado, erro
  const [talao, setTalao] = useState(null);
  const [erroMsg, setErroMsg] = useState(null);
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  async function lerImagem(file) {
    if (!file) return;
    setEstado("analisar");
    setErroMsg(null);
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      const r = await fetch("/api/ler-talao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: base64 }),
      });
      const dados = await r.json();
      if (dados.erro || !dados.produtos) {
        setErroMsg(dados.erro || "Não foi possível ler o talão.");
        setEstado("erro");
        return;
      }
      setTalao(dados);
      setEstado("resultado");
    } catch {
      setErroMsg("Erro de ligação. Tenta de novo.");
      setEstado("erro");
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) lerImagem(file);
  }

  function reset() {
    setEstado("inicio");
    setTalao(null);
    setErroMsg(null);
  }

  function criarCesto() {
    const LS = "poupeja_lista_compras";
    const existentes = (() => { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; } })();
    const nomesExist = new Set(existentes.map(i => i.nome.toLowerCase()));
    const novos = (talao?.produtos || [])
      .filter(p => !nomesExist.has(p.nome.toLowerCase()))
      .map((p, i) => ({ id: Date.now() + i, nome: p.nome, emoji: "🛒", cat: "", feito: false, qty: Math.ceil(p.qtd) }));
    try { localStorage.setItem(LS, JSON.stringify([...novos, ...existentes])); } catch {}
    window.dispatchEvent(new CustomEvent("poupeja:nav", { detail: "lista" }));
  }

  return (
    <div className="pb-28 pt-4 px-4">

      {estado === "inicio" && (
        <div>
          {/* Hero */}
          <div className="rounded-3xl overflow-hidden relative mb-5"
            style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7,#6366f1)", boxShadow:"0 20px 50px -15px rgba(124,58,237,0.5)" }}>
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10"/>
            <div className="p-6 text-white relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 backdrop-blur">
                <Receipt size={28}/>
              </div>
              <p className="text-2xl font-black font-display">Ler talão de compras</p>
              <p className="text-sm opacity-80 mt-1 leading-relaxed">Fotografa o teu talão de compras e vê logo o que gastaste e onde ficava mais barato.</p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3 mb-5">
            <button onClick={() => cameraRef.current?.click()}
              className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all"
              style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 10px 28px -10px rgba(124,58,237,0.6)" }}>
              <Camera size={20}/> Fotografar talão
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all bg-white border-2 border-violet-100 text-violet-700">
              <Upload size={20}/> Carregar imagem
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
          </div>

          {/* Como funciona */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-5">
            <p className="text-sm font-black text-slate-800 mb-3 flex items-center gap-1.5">
              <Sparkles size={15} className="text-violet-500"/> Como funciona
            </p>
            <div className="flex flex-col gap-3">
              {[
                { n:"1", t:"Fotografa o talão", d:"Tira uma foto ou escolhe uma imagem do recibo" },
                { n:"2", t:"Lemos o talão", d:"Identificamos a loja, a data e os produtos" },
                { n:"3", t:"Vê o resumo", d:"Os teus gastos e onde podias ter poupado" },
              ].map(function(passo){
                return (
                  <div key={passo.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-violet-700">{passo.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{passo.t}</p>
                      <p className="text-xs text-slate-400">{passo.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 flex gap-2">
            <Sparkles size={15} className="text-violet-500 flex-shrink-0 mt-0.5"/>
            <p className="text-[11px] text-violet-700">Funciona melhor com fotos bem iluminadas e o talão bem esticado.</p>
          </div>
        </div>
      )}

      {estado === "analisar" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              <Receipt size={44} className="text-white"/>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Loader size={20} className="text-violet-600 animate-spin"/>
            </div>
          </div>
          <p className="text-lg font-black text-slate-800 font-display">A ler o talão...</p>
          <p className="text-sm text-slate-400 mt-1">Estamos a identificar os produtos</p>
          <div className="flex gap-1.5 mt-4">
            <div className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
            <div className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
            <div className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
          </div>
        </div>
      )}

      {estado === "erro" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
            <AlertCircle size={36} className="text-red-400"/>
          </div>
          <p className="text-lg font-black text-slate-800 mb-2">Não foi possível ler</p>
          <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">{erroMsg}</p>
          <div className="flex flex-col gap-2 w-full">
            <button onClick={() => cameraRef.current?.click()}
              className="w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              <Camera size={18}/> Tentar de novo com câmara
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all bg-white border-2 border-violet-100 text-violet-700">
              <Upload size={18}/> Escolher outra imagem
            </button>
            <button onClick={reset} className="w-full py-3 text-sm font-bold text-slate-400">Cancelar</button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
        </div>
      )}

      {estado === "resultado" && talao && (
        <div>
          {/* Cabeçalho resultado */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check size={20} className="text-emerald-600"/>
              </div>
              <p className="font-black text-slate-800 font-display">Talão lido!</p>
            </div>
            <button onClick={reset} className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <X size={14}/> Novo
            </button>
          </div>

          {/* Card do talão */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: LOJA_CORES[talao.loja] + "0d" }}>
              <div className="flex items-center gap-2">
                <Store size={16} style={{ color: LOJA_CORES[talao.loja] }}/>
                <span className="font-black text-slate-800">{talao.loja}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar size={13}/>
                <span className="text-xs font-semibold">{talao.data}</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {talao.produtos.map(function(prod, i){
                return (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{prod.nome}</p>
                      <p className="text-[11px] text-slate-400">{prod.qtd} × {prod.preco != null ? prod.preco.toFixed(2) + "€" : "—"}</p>
                    </div>
                    <span className="text-sm font-black text-slate-800 ml-2">{prod.total != null ? prod.total.toFixed(2) + "€" : "—"}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-black text-slate-600">Total</span>
              <span className="text-xl font-black text-slate-900">{talao.total != null ? talao.total.toFixed(2) + "€" : "—"}</span>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-violet-50 rounded-2xl p-4 border border-violet-100 text-center">
              <p className="text-2xl font-black text-violet-700">{talao.produtos.length}</p>
              <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wide mt-0.5">Produtos</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
              <p className="text-2xl font-black text-emerald-700">{(talao.total ?? talao.produtos.reduce((s,p) => s + (p.total || 0), 0)).toFixed(2)}€</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mt-0.5">Total</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2.5">
            <button onClick={criarCesto} className="w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              <ShoppingCart size={18}/> Criar cesto com estes produtos
            </button>
            <button onClick={reset} className="w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-600 active:scale-95 transition-all">
              <Plus size={18}/> Ler outro talão
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
