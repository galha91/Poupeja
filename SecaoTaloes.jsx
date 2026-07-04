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
      style={{ background: "rgba(20,35,28,0.45)", backdropFilter: "blur(4px)" }}
      onClick={fecharSafe}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ background: "#f6f5f0" }}
        onClick={e => e.stopPropagation()}
      >
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
        <input ref={galeriaRef} type="file" accept="image/*"                        style={{ display: "none" }} onChange={handleFile} />

        <div className="flex items-center justify-between mb-6">
          <p className="font-display" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>
            {fase === "foto" ? (modo === "garantia" ? "Foto do talão" : "Guardar talão") : "Detalhes da garantia"}
          </p>
          <button onClick={onFechar} className="pj-tap w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#eeece4" }}>
            <X size={17} style={{ color: "#5c6b62" }} />
          </button>
        </div>

        {/* ── fase: foto ── */}
        {fase === "foto" && !preview && (
          <>
            {modo === "compra" && (
              <div className="mb-5 rounded-2xl p-4 flex gap-2.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                <Receipt size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#0b6b4f" }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "#5c6b62" }}>
                  Fotografa o <strong style={{ color: "#14231c" }}>talão inteiro</strong>, incluindo o final onde aparece o <strong style={{ color: "#14231c" }}>total poupado</strong>. Assim lemos o valor automaticamente.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2.5"
                style={{ background: "#0b6b4f" }}
              >
                <Camera size={20} /> Tirar foto ao talão
              </button>
              <button
                onClick={() => galeriaRef.current?.click()}
                className="press pj-tap w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5"
                style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}
              >
                <Upload size={20} style={{ color: "#5c6b62" }} /> Escolher da galeria
              </button>
            </div>
            <p className="text-[11px] text-center mt-4" style={{ color: "#8a978e" }}>A foto fica guardada em segurança no teu dispositivo.</p>
          </>
        )}

        {/* ── fase: lendo (OCR a decorrer) ── */}
        {fase === "lendo" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            {preview && <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-40 opacity-70" style={{ border: "1px solid #e4e2d8" }} />}
            <div className="flex items-center gap-2.5" style={{ color: "#5c6b62" }}>
              <Loader2 size={20} className="animate-spin" style={{ color: "#0b6b4f" }} />
              <p className="text-sm font-semibold">A ler o talão…</p>
            </div>
          </div>
        )}

        {/* ── fase: confirmar compra ── */}
        {fase === "confirmar" && preview && (
          <div className="flex flex-col gap-4">
            <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-44" style={{ border: "1px solid #e4e2d8" }} />

            <div>
              <p className="uppercase mb-2 flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
                <Euro size={11} /> Valor poupado (€)
              </p>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={valorPoupado}
                onChange={e => setValorPoupado(e.target.value)}
                placeholder="Insere manualmente"
                className="w-full px-4 py-3.5 rounded-xl font-semibold text-base focus:outline-none transition-all"
                style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}
              />
              {valorPoupado ? (
                <p className="text-[11px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: "#0b6b4f" }}>
                  <Check size={11} /> Valor lido automaticamente — podes editar se necessário.
                </p>
              ) : (
                <p className="text-[11px] mt-1.5" style={{ color: "#8a978e" }}>Não foi possível ler o valor. Insere manualmente (opcional).</p>
              )}
            </div>

            <button onClick={confirmar} className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ background: "#0b6b4f" }}>
              <Check size={19} /> Guardar talão
            </button>
            <button onClick={() => { setPreview(null); setValorPoupado(""); setFase("foto"); }} className="press pj-tap w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "#eeece4", color: "#5c6b62" }}>
              Tirar outra foto
            </button>
          </div>
        )}

        {/* ── fase: detalhes garantia ── */}
        {fase === "detalhes" && (
          <div className="flex flex-col gap-4">
            {preview && (
              <img src={preview} alt="talão" className="w-full rounded-2xl object-cover max-h-36" style={{ border: "1px solid #e4e2d8" }} />
            )}

            {/* Nome do produto */}
            <div>
              <p className="uppercase mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
                Nome do produto <span style={{ color: "#cf5a3c" }}>*</span>
              </p>
              <input
                type="text"
                value={nome}
                onChange={e => { setNome(e.target.value); setErroNome(false); }}
                placeholder={'Ex: TV Samsung 55", Frigorífico Bosch...'}
                className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm focus:outline-none transition-all"
                style={{ background: "#fbfaf6", border: `1px solid ${erroNome ? "#cf5a3c" : "#e4e2d8"}`, color: "#14231c" }}
              />
              {erroNome && <p className="text-[11px] mt-1.5 font-semibold" style={{ color: "#cf5a3c" }}>Escreve o nome do produto.</p>}
            </div>

            {/* Data de compra */}
            <div>
              <p className="uppercase mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Data de compra</p>
              <input
                type="date"
                value={dataCompra}
                max={new Date().toISOString().split("T")[0]}
                onChange={e => setDataCompra(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl font-semibold text-sm focus:outline-none transition-all"
                style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", color: "#14231c" }}
              />
            </div>

            {/* Duração */}
            <div>
              <p className="uppercase mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Duração da garantia</p>
              <div className="flex gap-2 flex-wrap">
                {DURACOES.map(d => (
                  <button
                    key={d.meses}
                    onClick={() => setDuracao(d.meses)}
                    className="press pj-tap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={duracao === d.meses ? { background: "#0b6b4f", color: "#ffffff" } : { background: "#eeece4", color: "#5c6b62" }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expira em */}
            {dataCompra && (
              <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                <ShieldCheck size={14} style={{ color: "#0b6b4f" }} />
                <p className="text-[12px] font-semibold" style={{ color: "#14231c" }}>
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
              className="press pj-tap w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 mt-1"
              style={{ background: "#0b6b4f" }}
            >
              <Check size={19} /> Guardar garantia
            </button>

            <button onClick={() => { setPreview(null); setFase("foto"); }} className="press pj-tap w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "#eeece4", color: "#5c6b62" }}>
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
  const cor   = dias === null ? null : dias > 60 ? "#0b6b4f" : dias > 14 ? "#8a978e" : dias >= 0 ? "#cf5a3c" : "#8a978e";
  const bgCor = dias === null ? null : "#eeece4";
  const label = dias === null ? null : dias < 0 ? "Expirada" : dias === 0 ? "Expira hoje" : `${dias}d restantes`;

  return (
    <div className="overflow-hidden relative rounded-2xl" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
      <button
        onClick={() => onApagar(talao.id)}
        className="pj-tap absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(20,35,28,0.45)" }}
      >
        <Trash2 size={12} className="text-white" />
      </button>
      {talao.imagem ? (
        <img src={talao.imagem} alt="talão" className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 flex items-center justify-center" style={{ background: "#eeece4" }}>
          <Image size={28} style={{ color: "#8a978e" }} />
        </div>
      )}
      <div className="p-3" style={{ borderTop: "1px solid #eeece4" }}>
        <p className="text-[13px] font-semibold leading-snug line-clamp-1" style={{ color: "#14231c" }}>{talao.nome || "Talão"}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "#8a978e" }}>{talao.dataCompra ? new Date(talao.dataCompra).toLocaleDateString("pt-PT") : talao.data}</p>
        {talao.valorPoupado != null && (
          <div className="mt-2 px-2 py-1 rounded-lg inline-flex" style={{ background: "#eeece4" }}>
            <p className="text-[11px] font-semibold" style={{ color: "#0b6b4f" }}>Poupou €{talao.valorPoupado.toFixed(2)}</p>
          </div>
        )}
        {label && (
          <div className="mt-1.5 px-2 py-1 rounded-lg inline-flex" style={{ background: bgCor }}>
            <p className="text-[11px] font-semibold" style={{ color: cor }}>{label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EstadoVazio({ icon: Icon, titulo, descricao, corFundo, corIcone }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: corFundo }}>
        <Icon size={28} style={{ color: corIcone }} />
      </div>
      <p className="font-display text-base mb-1.5" style={{ fontWeight: 600, color: "#14231c" }}>{titulo}</p>
      <p className="text-[13px] leading-relaxed" style={{ color: "#8a978e" }}>{descricao}</p>
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
      <div className="flex gap-1 p-1 rounded-2xl mx-4 mb-5" style={{ background: "#eeece4" }}>
        {[
          { id: "compras",   label: "Compras",   icon: ShoppingCart },
          { id: "garantias", label: "Garantias", icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className="pj-tap flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={aba === t.id ? { background: "#f6f5f0", color: "#14231c" } : { color: "#8a978e" }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* COMPRAS */}
      {aba === "compras" && (
        <div className="anim-up">
          <div className="mx-4 mb-5 pb-5" style={{ borderBottom: "1px solid #e4e2d8" }}>
            <p className="uppercase flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
              <TrendingUp size={11} /> Talões guardados
            </p>
            <p className="font-display mt-1" style={{ fontSize: "40px", fontWeight: 600, color: "#14231c", lineHeight: 1.05 }}>{compras.length}</p>
            <p className="text-xs mt-1" style={{ color: "#5c6b62" }}>{compras.length === 1 ? "talão" : "talões"} no histórico</p>
            {(() => {
              const totalPoupado = compras.reduce((acc, t) => acc + (t.valorPoupado ?? 0), 0);
              return totalPoupado > 0 ? (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #eeece4" }}>
                  <p className="uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Total poupado</p>
                  <p className="font-display mt-1" style={{ fontSize: "22px", fontWeight: 600, color: "#0b6b4f" }}>€{totalPoupado.toFixed(2)}</p>
                </div>
              ) : null;
            })()}
          </div>

          <button onClick={() => setModal(true)}
            className="press pj-tap mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
            style={{ background: "#0b6b4f" }}>
            <Camera size={17} /> Guardar novo talão
          </button>

          {compras.length === 0 ? (
            <div className="mx-4 rounded-2xl" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <EstadoVazio icon={Receipt} titulo="Ainda não tens talões guardados"
                descricao="Tira foto ao próximo talão e começa a controlar as tuas compras."
                corFundo="#eeece4" corIcone="#0b6b4f" />
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
          <div className="mx-4 mb-5 pb-5" style={{ borderBottom: "1px solid #e4e2d8" }}>
            <p className="uppercase flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
              <ShieldCheck size={11} /> Garantias ativas
            </p>
            <p className="font-display mt-1" style={{ fontSize: "40px", fontWeight: 600, color: "#14231c", lineHeight: 1.05 }}>{garantias.length}</p>
            <p className="text-xs mt-1" style={{ color: "#5c6b62" }}>{garantias.length === 1 ? "produto protegido" : "produtos protegidos"}</p>
          </div>

          <button onClick={() => setModal(true)}
            className="press pj-tap mx-4 mb-5 w-[calc(100%-2rem)] py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
            style={{ background: "#0b6b4f" }}>
            <Camera size={17} /> Guardar talão de garantia
          </button>

          {garantias.length === 0 ? (
            <>
              <div className="mx-4 rounded-2xl" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                <EstadoVazio icon={Package} titulo="Ainda não tens garantias guardadas"
                  descricao="Guarda o talão dos teus produtos para nunca perderes a validade da garantia."
                  corFundo="#eeece4" corIcone="#0b6b4f" />
              </div>
              <div className="mx-4 mt-4 rounded-2xl p-4 flex gap-2.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#0b6b4f" }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "#5c6b62" }}>
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
