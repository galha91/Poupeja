import { useState, useRef } from "react";
import {
  Camera, Upload, Receipt, ShieldCheck, ShoppingCart,
  X, TrendingUp, Package, Check, Trash2, Image,
} from "lucide-react";

const STORAGE_KEY = "poupeja_taloes";

function lerTaloes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function guardarTaloes(lista) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch {}
}

/* ── Modal: tirar/escolher foto ── */
function ModalGuardar({ onFechar, onGuardar }) {
  const cameraRef  = useRef(null);
  const galeriaRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={preview ? undefined : onFechar}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
        <input ref={galeriaRef} type="file" accept="image/*"                        style={{ display: "none" }} onChange={handleFile} />

        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-black text-slate-900">{preview ? "Confirmar talão" : "Guardar talão"}</p>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X size={17} className="text-slate-500" />
          </button>
        </div>

        {preview ? (
          <div className="flex flex-col gap-3">
            <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-56" />
            <button
              onClick={() => { onGuardar(preview); onFechar(); }}
              className="press w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5"
              style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.5)" }}
            >
              <Check size={20} /> Guardar talão
            </button>
            <button
              onClick={() => setPreview(null)}
              className="press w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 bg-slate-100 text-slate-600 text-sm"
            >
              Tirar outra foto
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="press w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.5)" }}
              >
                <Camera size={20} /> Tirar foto ao talão
              </button>
              <button
                onClick={() => galeriaRef.current?.click()}
                className="press w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all bg-white border-2 border-slate-100 text-slate-600"
              >
                <Upload size={20} /> Escolher da galeria
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">
              A foto fica guardada em segurança no teu dispositivo.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Card de talão guardado ── */
function CardTalao({ talao, onApagar }) {
  return (
    <div className="card overflow-hidden relative">
      {talao.imagem ? (
        <img src={talao.imagem} alt="talão" className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-slate-50 flex items-center justify-center">
          <Image size={32} className="text-slate-200" />
        </div>
      )}
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-black text-slate-700">{talao.nome}</p>
          <p className="text-[10px] text-slate-400">{talao.data}</p>
        </div>
        <button
          onClick={() => onApagar(talao.id)}
          className="press w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

function EstadoVazio({ icon: Icon, titulo, descricao, corFundo, corIcone }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: corFundo }}>
        <Icon size={28} style={{ color: corIcone }} />
      </div>
      <p className="font-black text-slate-700 text-base mb-1">{titulo}</p>
      <p className="text-[13px] text-slate-400 leading-relaxed">{descricao}</p>
    </div>
  );
}

export default function SecaoTaloes({ inicioAba = "compras" }) {
  const [aba, setAba]     = useState(inicioAba);
  const [modal, setModal] = useState(false);
  const [taloes, setTaloes] = useState(() => lerTaloes());

  function adicionarTalao(imagem) {
    const novo = {
      id: Date.now(),
      tipo: aba === "garantias" ? "garantia" : "compra",
      imagem,
      data: new Date().toLocaleDateString("pt-PT"),
      nome: aba === "garantias" ? "Garantia" : "Talão",
      criadoEm: new Date().toISOString(),
    };
    const atualizado = [novo, ...taloes];
    setTaloes(atualizado);
    guardarTaloes(atualizado);
  }

  function apagarTalao(id) {
    const atualizado = taloes.filter(t => t.id !== id);
    setTaloes(atualizado);
    guardarTaloes(atualizado);
  }

  const compras   = taloes.filter(t => t.tipo === "compra");
  const garantias = taloes.filter(t => t.tipo === "garantia");

  return (
    <div className="pb-28">

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        {[
          { id: "compras",   label: "Compras",   icon: ShoppingCart },
          { id: "garantias", label: "Garantias", icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              aba === t.id ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══ COMPRAS ══ */}
      {aba === "compras" && (
        <div className="anim-up">
          <div
            className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 16px 40px -12px rgba(37,99,235,0.45)" }}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={11} /> Talões guardados
            </p>
            <p className="text-4xl font-black text-white mt-1">{compras.length}</p>
            <p className="text-xs text-white/60 mt-0.5">{compras.length === 1 ? "talão" : "talões"} no histórico</p>
          </div>

          <button
            onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}
          >
            <Camera size={17} /> Guardar novo talão
          </button>

          {compras.length === 0 ? (
            <div className="mx-4 card">
              <EstadoVazio
                icon={Receipt}
                titulo="Ainda não tens talões guardados"
                descricao="Tira foto ao próximo talão e começa a controlar as tuas compras."
                corFundo="#eff6ff"
                corIcone="#3b82f6"
              />
            </div>
          ) : (
            <div className="px-4 grid grid-cols-2 gap-3">
              {compras.map(t => <CardTalao key={t.id} talao={t} onApagar={apagarTalao} />)}
            </div>
          )}
        </div>
      )}

      {/* ══ GARANTIAS ══ */}
      {aba === "garantias" && (
        <div className="anim-up">
          <div
            className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 16px 40px -12px rgba(5,150,105,0.45)" }}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={11} /> Garantias ativas
            </p>
            <p className="text-4xl font-black text-white mt-1">{garantias.length}</p>
            <p className="text-xs text-white/60 mt-0.5">{garantias.length === 1 ? "produto protegido" : "produtos protegidos"}</p>
          </div>

          <button
            onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.4)" }}
          >
            <Camera size={17} /> Guardar talão de garantia
          </button>

          {garantias.length === 0 ? (
            <>
              <div className="mx-4 card">
                <EstadoVazio
                  icon={Package}
                  titulo="Ainda não tens garantias guardadas"
                  descricao="Guarda o talão dos teus eletrodomésticos para nunca perderes a garantia."
                  corFundo="#f0fdf4"
                  corIcone="#059669"
                />
              </div>
              <div className="mx-4 mt-4 rounded-2xl p-3.5 flex gap-2.5" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Guarda os talões dos eletrodomésticos e tens sempre prova de compra à mão quando precisares de acionar a garantia.
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 grid grid-cols-2 gap-3">
              {garantias.map(t => <CardTalao key={t.id} talao={t} onApagar={apagarTalao} />)}
            </div>
          )}
        </div>
      )}

      {modal && <ModalGuardar onFechar={() => setModal(false)} onGuardar={adicionarTalao} />}
    </div>
  );
}
