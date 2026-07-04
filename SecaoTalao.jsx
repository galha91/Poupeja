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
          {/* Cabeçalho editorial */}
          <div className="mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#eeece4" }}>
              <Receipt size={26} style={{ color: "#0b6b4f" }} />
            </div>
            <p className="uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Leitura automática</p>
            <p className="font-display mt-1" style={{ fontSize: "26px", fontWeight: 600, color: "#14231c" }}>Ler talão de compras</p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "#5c6b62" }}>Fotografa o teu talão de compras e vê logo o que gastaste e onde ficava mais barato.</p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3 mb-5">
            <button onClick={() => cameraRef.current?.click()}
              className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2.5"
              style={{ background: "#0b6b4f" }}>
              <Camera size={20}/> Fotografar talão
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="press pj-tap w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}>
              <Upload size={20} style={{ color: "#5c6b62" }}/> Carregar imagem
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
          </div>

          {/* Como funciona */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#14231c" }}>
              <Sparkles size={15} style={{ color: "#0b6b4f" }}/> Como funciona
            </p>
            <div className="flex flex-col gap-3">
              {[
                { n:"1", t:"Fotografa o talão", d:"Tira uma foto ou escolhe uma imagem do recibo" },
                { n:"2", t:"Lemos o talão", d:"Identificamos a loja, a data e os produtos" },
                { n:"3", t:"Vê o resumo", d:"Os teus gastos e onde podias ter poupado" },
              ].map(function(passo){
                return (
                  <div key={passo.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#eeece4" }}>
                      <span className="text-xs font-semibold" style={{ color: "#0b6b4f" }}>{passo.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#14231c" }}>{passo.t}</p>
                      <p className="text-xs" style={{ color: "#8a978e" }}>{passo.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl p-3 flex gap-2" style={{ background: "#eeece4" }}>
            <Sparkles size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#0b6b4f" }}/>
            <p className="text-[11px]" style={{ color: "#5c6b62" }}>Funciona melhor com fotos bem iluminadas e o talão bem esticado.</p>
          </div>
        </div>
      )}

      {estado === "analisar" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "#eeece4" }}>
              <Receipt size={44} style={{ color: "#0b6b4f" }}/>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", boxShadow: "0 6px 16px -8px rgba(20,35,28,0.2)" }}>
              <Loader size={20} className="animate-spin" style={{ color: "#0b6b4f" }}/>
            </div>
          </div>
          <p className="font-display" style={{ fontSize: "18px", fontWeight: 600, color: "#14231c" }}>A ler o talão...</p>
          <p className="text-sm mt-1" style={{ color: "#8a978e" }}>Estamos a identificar os produtos</p>
          <div className="flex gap-1.5 mt-4">
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#0b6b4f", animationDelay:"0ms"}}/>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#0b6b4f", animationDelay:"150ms"}}/>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#0b6b4f", animationDelay:"300ms"}}/>
          </div>
        </div>
      )}

      {estado === "erro" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "rgba(207,90,60,0.1)", border: "1px solid rgba(207,90,60,0.25)" }}>
            <AlertCircle size={36} style={{ color: "#cf5a3c" }}/>
          </div>
          <p className="font-display" style={{ fontSize: "18px", fontWeight: 600, color: "#14231c" }}>Não foi possível ler</p>
          <p className="text-sm mt-2 mb-6 max-w-xs leading-relaxed" style={{ color: "#8a978e" }}>{erroMsg}</p>
          <div className="flex flex-col gap-2 w-full">
            <button onClick={() => cameraRef.current?.click()}
              className="press pj-tap w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
              style={{ background: "#0b6b4f" }}>
              <Camera size={18}/> Tentar de novo com câmara
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="press pj-tap w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}>
              <Upload size={18} style={{ color: "#5c6b62" }}/> Escolher outra imagem
            </button>
            <button onClick={reset} className="pj-tap w-full py-3 text-sm font-semibold" style={{ color: "#8a978e" }}>Cancelar</button>
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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eeece4" }}>
                <Check size={20} style={{ color: "#0b6b4f" }}/>
              </div>
              <p className="font-display" style={{ fontWeight: 600, color: "#14231c" }}>Talão lido!</p>
            </div>
            <button onClick={reset} className="pj-tap text-xs font-semibold flex items-center gap-1" style={{ color: "#8a978e" }}>
              <X size={14}/> Novo
            </button>
          </div>

          {/* Card do talão */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: LOJA_CORES[talao.loja] + "14" }}>
              <div className="flex items-center gap-2">
                <Store size={16} style={{ color: LOJA_CORES[talao.loja] || "#5c6b62" }}/>
                <span className="font-semibold" style={{ color: "#14231c" }}>{talao.loja}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: "#8a978e" }}>
                <Calendar size={13}/>
                <span className="text-xs font-semibold">{talao.data}</span>
              </div>
            </div>
            <div className="divide-y divide-[#eeece4]">
              {talao.produtos.map(function(prod, i){
                return (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#14231c" }}>{prod.nome}</p>
                      <p className="text-[11px]" style={{ color: "#8a978e" }}>{prod.qtd} × {prod.preco != null ? prod.preco.toFixed(2) + "€" : "—"}</p>
                    </div>
                    <span className="text-sm font-semibold ml-2" style={{ color: "#14231c" }}>{prod.total != null ? prod.total.toFixed(2) + "€" : "—"}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#eeece4" }}>
              <span className="text-sm font-semibold" style={{ color: "#5c6b62" }}>Total</span>
              <span className="font-display" style={{ fontSize: "20px", fontWeight: 600, color: "#14231c" }}>{talao.total != null ? talao.total.toFixed(2) + "€" : "—"}</span>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="font-display" style={{ fontSize: "24px", fontWeight: 600, color: "#14231c" }}>{talao.produtos.length}</p>
              <p className="uppercase mt-0.5" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Produtos</p>
            </div>
            <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="font-display" style={{ fontSize: "24px", fontWeight: 600, color: "#14231c" }}>{(talao.total ?? talao.produtos.reduce((s,p) => s + (p.total || 0), 0)).toFixed(2)}€</p>
              <p className="uppercase mt-0.5" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Total</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2.5">
            <button onClick={criarCesto} className="press pj-tap w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
              style={{ background: "#0b6b4f" }}>
              <ShoppingCart size={18}/> Criar cesto com estes produtos
            </button>
            <button onClick={reset} className="press pj-tap w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}>
              <Plus size={18}/> Ler outro talão
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
