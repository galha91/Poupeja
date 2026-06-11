import { useState, useRef } from "react";
import {
  Camera, Upload, Receipt, ShieldCheck, ShoppingCart,
  X, TrendingUp, Package, Check, Trash2, Image, ChevronRight, Loader2, Euro,
} from "lucide-react";

const STORAGE_KEY = "poupeja_taloes";

function lerTaloes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function guardarTaloes(lista) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); } catch {}
}

function diasRestantes(dataExpiracao) {
  if (!dataExpiracao) return null;
  return Math.ceil((new Date(dataExpiracao) - new Date()) / 86400000);
}

const DURACOES = [
  { label: "6 m",  meses: 6 },
  { label: "1 ano", meses: 12 },
  { label: "2 anos", meses: 24 },
  { label: "3 anos", meses: 36 },
  { label: "5 anos", meses: 60 },
];

/* ── Modal guardar ── */
function ModalGuardar({ onFechar, onGuardar, modo }) {
  const cameraRef  = useRef(null);
  const galeriaRef = useRef(null);
  const [fase, setFase]               = useState("foto");
  const [preview, setPreview]         = useState(null);
  const [valorPoupado, setValorPoupado] = useState("");
  const [lendo, setLendo]             = useState(false);
  const [nome, setNome]               = useState("");
  const [dataCompra, setDataCompra]   = useState(new Date().toISOString().split("T")[0]);
  const [duracao, setDuracao]         = useState(24);
  const [erroNome, setErroNome]       = useState(false);

  async function lerValorTalao(base64) {
    try {
      const res = await fetch("/api/ler-talao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: base64 }),
      });
      const data = await res.json();
      // suporta resposta nova {poupanca} e antiga {valor}
      const v = data.poupanca ?? data.valor ?? null;
      if (v !== null && !isNaN(parseFloat(v))) {
        setValorPoupado(parseFloat(v).toFixed(2));
      }
      if (data.loja && !nome) setNome(data.loja);
      if (data.data) setDataCompra(data.data);
    } catch {}
    setLendo(false);
    setFase("confirmar");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      if (modo === "garantia") {
        setFase("detalhes");
      } else {
        setLendo(true);
        setFase("lendo");
        lerValorTalao(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function confirmar() {
    if (modo === "garantia" && !nome.trim()) { setErroNome(true); return; }
    let dataExpiracao = null;
    if (modo === "garantia" && dataCompra) {
      const d = new Date(dataCompra);
      d.setMonth(d.getMonth() + duracao);
      dataExpiracao = d.toISOString().split("T")[0];
    }
    const valor = valorPoupado ? parseFloat(valorPoupado.replace(",", ".")) : null;
    onGuardar(preview, { nome: nome.trim(), dataCompra, duracao, dataExpiracao, valorPoupado: isNaN(valor) ? null : valor });
    onFechar();
  }

  const fecharSafe = (fase === "foto" || fase === "lendo") ? onFechar : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={fecharSafe}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
        <input ref={galeriaRef} type="file" accept="image/*"                        style={{ display: "none" }} onChange={handleFile} />

        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-black text-slate-900">
            {fase === "foto" ? (modo === "garantia" ? "Foto do talão" : "Guardar talão") : "Detalhes da garantia"}
          </p>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X size={17} className="text-slate-500" />
          </button>
        </div>

        {/* ── fase: foto ── */}
        {fase === "foto" && !preview && (
          <>
            {modo === "compra" && (
              <div className="mb-4 rounded-2xl p-3.5 flex gap-2.5" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                <Receipt size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed font-semibold">
                  Fotografa o <strong>talão inteiro</strong>, incluindo o final onde aparece o <strong>total poupado</strong>. Assim lemos o valor automaticamente.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="press w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.5)" }}
              >
                <Camera size={20} /> Tirar foto ao talão
              </button>
              <button
                onClick={() => galeriaRef.current?.click()}
                className="press w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 bg-white border-2 border-slate-100 text-slate-600"
              >
                <Upload size={20} /> Escolher da galeria
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">A foto fica guardada em segurança no teu dispositivo.</p>
          </>
        )}

        {/* ── fase: lendo (OCR a decorrer) ── */}
        {fase === "lendo" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            {preview && <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-40 opacity-70" />}
            <div className="flex items-center gap-2.5 text-slate-600">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <p className="text-sm font-bold">A ler o talão…</p>
            </div>
          </div>
        )}

        {/* ── fase: confirmar compra ── */}
        {fase === "confirmar" && preview && (
          <div className="flex flex-col gap-4">
            <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-44" />

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Euro size={10} /> Valor poupado (€)
              </p>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={valorPoupado}
                onChange={e => setValorPoupado(e.target.value)}
                placeholder="Insere manualmente"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-800 font-bold text-base placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all"
              />
              {valorPoupado ? (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <Check size={11} /> Valor lido automaticamente — podes editar se necessário.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">Não foi possível ler o valor. Insere manualmente (opcional).</p>
              )}
            </div>

            <button onClick={confirmar} className="press w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}>
              <Check size={19} /> Guardar talão
            </button>
            <button onClick={() => { setPreview(null); setValorPoupado(""); setFase("foto"); }} className="press w-full py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100">
              Tirar outra foto
            </button>
          </div>
        )}

        {/* ── fase: detalhes garantia ── */}
        {fase === "detalhes" && (
          <div className="flex flex-col gap-4">
            {preview && (
              <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-36" />
            )}

            {/* Nome do produto */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Nome do produto <span className="text-red-400">*</span>
              </p>
              <input
                type="text"
                value={nome}
                onChange={e => { setNome(e.target.value); setErroNome(false); }}
                placeholder={'Ex: TV Samsung 55", Frigorífico Bosch...'}
                className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-slate-800 font-semibold text-sm placeholder:text-slate-300 focus:outline-none transition-all ${erroNome ? "border-red-300 focus:border-red-400" : "border-slate-100 focus:border-emerald-400"}`}
              />
              {erroNome && <p className="text-[11px] text-red-500 mt-1 font-semibold">Escreve o nome do produto.</p>}
            </div>

            {/* Data de compra */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de compra</p>
              <input
                type="date"
                value={dataCompra}
                max={new Date().toISOString().split("T")[0]}
                onChange={e => setDataCompra(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Duração */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duração da garantia</p>
              <div className="flex gap-2 flex-wrap">
                {DURACOES.map(d => (
                  <button
                    key={d.meses}
                    onClick={() => setDuracao(d.meses)}
                    className={`press px-3.5 py-2 rounded-xl text-xs font-black transition-all ${duracao === d.meses ? "text-white" : "bg-slate-100 text-slate-500"}`}
                    style={duracao === d.meses ? { background: "linear-gradient(135deg,#059669,#10b981)" } : {}}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expira em */}
            {dataCompra && (
              <div className="rounded-xl px-3.5 py-2.5 bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <p className="text-[12px] font-bold text-emerald-700">
                  Garantia válida até{" "}
                  {(() => {
                    const d = new Date(dataCompra);
                    d.setMonth(d.getMonth() + duracao);
                    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
                  })()}
                </p>
              </div>
            )}

            <button
              onClick={confirmar}
              className="press w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 mt-1"
              style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.5)" }}
            >
              <Check size={19} /> Guardar garantia
            </button>

            <button onClick={() => { setPreview(null); setFase("foto"); }} className="press w-full py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100">
              Tirar outra foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Card talão/garantia ── */
function CardTalao({ talao, onApagar }) {
  const dias = diasRestantes(talao.dataExpiracao);
  const cor   = dias === null ? null : dias > 60 ? "#059669" : dias > 14 ? "#d97706" : dias >= 0 ? "#dc2626" : "#94a3b8";
  const bgCor = dias === null ? null : dias > 60 ? "#f0fdf4" : dias > 14 ? "#fffbeb" : dias >= 0 ? "#fef2f2" : "#f1f5f9";
  const label = dias === null ? null : dias < 0 ? "Expirada" : dias === 0 ? "Expira hoje" : `${dias}d restantes`;

  return (
    <div className="card overflow-hidden relative">
      <button
        onClick={() => onApagar(talao.id)}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(15,23,42,0.4)" }}
      >
        <Trash2 size={12} className="text-white" />
      </button>
      {talao.imagem ? (
        <img src={talao.imagem} alt="talão" className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-slate-50 flex items-center justify-center">
          <Image size={28} className="text-slate-200" />
        </div>
      )}
      <div className="p-3">
        <p className="text-[12px] font-black text-slate-800 leading-snug line-clamp-1">{talao.nome || "Talão"}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{talao.dataCompra ? new Date(talao.dataCompra).toLocaleDateString("pt-PT") : talao.data}</p>
        {talao.valorPoupado != null && (
          <div className="mt-1.5 px-2 py-1 rounded-lg" style={{ background: "#f0fdf4" }}>
            <p className="text-[10px] font-black text-emerald-700">Poupou €{talao.valorPoupado.toFixed(2)}</p>
          </div>
        )}
        {label && (
          <div className="mt-1 px-2 py-1 rounded-lg" style={{ background: bgCor }}>
            <p className="text-[10px] font-black" style={{ color: cor }}>{label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EstadoVazio({ icon: Icon, titulo, descricao, corFundo, corIcone }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: corFundo }}>
        <Icon size={28} style={{ color: corIcone }} />
      </div>
      <p className="font-black text-slate-700 text-base mb-1">{titulo}</p>
      <p className="text-[13px] text-slate-400 leading-relaxed">{descricao}</p>
    </div>
  );
}

export default function SecaoTaloes({ inicioAba = "compras" }) {
  const [aba, setAba]       = useState(inicioAba);
  const [modal, setModal]   = useState(false);
  const [taloes, setTaloes] = useState(() => lerTaloes());

  function adicionarTalao(imagem, meta = {}) {
    const novo = {
      id: Date.now(),
      tipo: aba === "garantias" ? "garantia" : "compra",
      imagem,
      nome: meta.nome || (aba === "garantias" ? "Garantia" : "Talão"),
      dataCompra: meta.dataCompra || null,
      duracao: meta.duracao || null,
      dataExpiracao: meta.dataExpiracao || null,
      valorPoupado: meta.valorPoupado ?? null,
      data: new Date().toLocaleDateString("pt-PT"),
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

      {/* Tab switcher */}
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

      {/* COMPRAS */}
      {aba === "compras" && (
        <div className="anim-up">
          <div className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 16px 40px -12px rgba(37,99,235,0.45)" }}>
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={11} /> Talões guardados
            </p>
            <p className="text-4xl font-black text-white mt-1">{compras.length}</p>
            <p className="text-xs text-white/60 mt-0.5">{compras.length === 1 ? "talão" : "talões"} no histórico</p>
            {(() => {
              const totalPoupado = compras.reduce((acc, t) => acc + (t.valorPoupado ?? 0), 0);
              return totalPoupado > 0 ? (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total poupado</p>
                  <p className="text-xl font-black text-white mt-0.5">€{totalPoupado.toFixed(2)}</p>
                </div>
              ) : null;
            })()}
          </div>

          <button onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}>
            <Camera size={17} /> Guardar novo talão
          </button>

          {compras.length === 0 ? (
            <div className="mx-4 card">
              <EstadoVazio icon={Receipt} titulo="Ainda não tens talões guardados"
                descricao="Tira foto ao próximo talão e começa a controlar as tuas compras."
                corFundo="#eff6ff" corIcone="#3b82f6" />
            </div>
          ) : (
            <div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {compras.map(t => <CardTalao key={t.id} talao={t} onApagar={apagarTalao} />)}
            </div>
          )}
        </div>
      )}

      {/* GARANTIAS */}
      {aba === "garantias" && (
        <div className="anim-up">
          <div className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 16px 40px -12px rgba(5,150,105,0.45)" }}>
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={11} /> Garantias ativas
            </p>
            <p className="text-4xl font-black text-white mt-1">{garantias.length}</p>
            <p className="text-xs text-white/60 mt-0.5">{garantias.length === 1 ? "produto protegido" : "produtos protegidos"}</p>
          </div>

          <button onClick={() => setModal(true)}
            className="press mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#064e3b,#059669)", boxShadow: "0 8px 20px -8px rgba(5,150,105,0.4)" }}>
            <Camera size={17} /> Guardar talão de garantia
          </button>

          {garantias.length === 0 ? (
            <>
              <div className="mx-4 card">
                <EstadoVazio icon={Package} titulo="Ainda não tens garantias guardadas"
                  descricao="Guarda o talão dos teus produtos para nunca perderes a validade da garantia."
                  corFundo="#f0fdf4" corIcone="#059669" />
              </div>
              <div className="mx-4 mt-4 rounded-2xl p-3.5 flex gap-2.5" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Regista o nome do produto, data de compra e duração. Avisamos-te quando a garantia estiver a terminar.
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {garantias.map(t => <CardTalao key={t.id} talao={t} onApagar={apagarTalao} />)}
            </div>
          )}
        </div>
      )}

      {modal && (
        <ModalGuardar
          onFechar={() => setModal(false)}
          onGuardar={adicionarTalao}
          modo={aba === "garantias" ? "garantia" : "compra"}
        />
      )}
    </div>
  );
}
