import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  Circle, X, Calendar, Euro, AlertCircle, TrendingDown,
} from "lucide-react";

const CATS = [
  { id: "habitacao",   emoji: "🏠", label: "Habitação",  cor: "#059669", bg: "#ecfdf5" },
  { id: "energia",     emoji: "⚡", label: "Energia",     cor: "#d97706", bg: "#fffbeb" },
  { id: "internet",    emoji: "📱", label: "Internet/Tel",cor: "#2563eb", bg: "#eff6ff" },
  { id: "seguro",      emoji: "🛡️", label: "Seguros",     cor: "#7c3aed", bg: "#f5f3ff" },
  { id: "saude",       emoji: "💊", label: "Saúde",       cor: "#e11d48", bg: "#fff1f2" },
  { id: "transporte",  emoji: "🚗", label: "Transporte",  cor: "#ea580c", bg: "#fff7ed" },
  { id: "lazer",       emoji: "🎮", label: "Lazer",       cor: "#6d28d9", bg: "#faf5ff" },
  { id: "outro",       emoji: "📋", label: "Outro",       cor: "#475569", bg: "#f8fafc" },
];

const catById = Object.fromEntries(CATS.map(c => [c.id, c]));

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diaAtual() {
  return new Date().getDate();
}

function lerContas() {
  try { return JSON.parse(localStorage.getItem("poupeja_contas") || "[]"); } catch { return []; }
}

function guardarContas(lista) {
  localStorage.setItem("poupeja_contas", JSON.stringify(lista));
}

function lerPagamentos() {
  try { return JSON.parse(localStorage.getItem("poupeja_contas_pago") || "{}"); } catch { return {}; }
}

function guardarPagamentos(obj) {
  localStorage.setItem("poupeja_contas_pago", JSON.stringify(obj));
}

function novoId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ─── Formulário de adicionar conta ─── */
function FormConta({ inicial, onGuardar, onCancelar }) {
  const [nome, setNome]       = useState(inicial?.nome       || "");
  const [valor, setValor]     = useState(inicial?.valor      ? String(inicial.valor) : "");
  const [dia, setDia]         = useState(inicial?.diaVencimento ? String(inicial.diaVencimento) : "1");
  const [cat, setCat]         = useState(inicial?.categoria  || "habitacao");
  const [erro, setErro]       = useState("");

  function submeter(e) {
    e.preventDefault();
    const v = parseFloat(valor.replace(",", "."));
    if (!nome.trim()) { setErro("Escreve o nome da conta."); return; }
    if (isNaN(v) || v <= 0) { setErro("Valor inválido."); return; }
    const d = parseInt(dia, 10);
    if (isNaN(d) || d < 1 || d > 31) { setErro("Dia inválido (1–31)."); return; }
    setErro("");
    onGuardar({ nome: nome.trim(), valor: v, diaVencimento: d, categoria: cat });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-3">
      {/* Nome */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nome da conta</label>
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="ex: Renda, NOS, Fidelidade…"
          maxLength={40}
          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
        />
      </div>

      {/* Valor + Dia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Valor (€)</label>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Dia do mês</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dia}
            onChange={e => setDia(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Categoria</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {CATS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
              style={{
                borderColor: cat === c.id ? c.cor : "#e2e8f0",
                background: cat === c.id ? c.bg : "#fff",
              }}
            >
              <span className="text-lg leading-none">{c.emoji}</span>
              <span className="text-[9px] font-black leading-tight text-center" style={{ color: cat === c.id ? c.cor : "#94a3b8" }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
          <AlertCircle size={12} /> {erro}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-black"
          style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
        >
          {inicial ? "Guardar alterações" : "Adicionar conta"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-black"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ─── Componente principal ─── */
export default function SecaoContas() {
  const [contas, setContas]         = useState([]);
  const [pagamentos, setPagamentos] = useState({});
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [editando, setEditando]         = useState(null); // id da conta em edição
  const [expandido, setExpandido]       = useState(null); // id expandido para detalhes

  const mes = mesAtual();
  const hoje = diaAtual();

  const carregar = useCallback(() => {
    setContas(lerContas());
    setPagamentos(lerPagamentos());
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const pagosMes = pagamentos[mes] || {};

  const totalMensal = contas.reduce((s, c) => s + c.valor, 0);
  const totalPago   = contas.filter(c => pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
  const totalPendente = totalMensal - totalPago;
  const pct = totalMensal > 0 ? Math.round((totalPago / totalMensal) * 100) : 0;

  // Contas a vencer nos próximos 5 dias
  const aVencer = contas.filter(c => !pagosMes[c.id] && c.diaVencimento >= hoje && c.diaVencimento <= hoje + 5);

  function togglePago(id) {
    const novos = { ...pagamentos };
    if (!novos[mes]) novos[mes] = {};
    novos[mes] = { ...novos[mes], [id]: !novos[mes][id] };
    setPagamentos(novos);
    guardarPagamentos(novos);
    window.dispatchEvent(new Event("poupeja:contas-updated"));
  }

  function adicionarConta(dados) {
    const nova = { id: novoId(), ...dados };
    const lista = [...contas, nova];
    setContas(lista);
    guardarContas(lista);
    setMostrarForm(false);
  }

  function editarConta(dados) {
    const lista = contas.map(c => c.id === editando ? { ...c, ...dados } : c);
    setContas(lista);
    guardarContas(lista);
    setEditando(null);
  }

  function removerConta(id) {
    const lista = contas.filter(c => c.id !== id);
    setContas(lista);
    guardarContas(lista);
    if (expandido === id) setExpandido(null);
    if (editando === id)  setEditando(null);
  }

  // Sort by diaVencimento
  const contasOrdenadas = [...contas].sort((a, b) => a.diaVencimento - b.diaVencimento);

  const mesesLabel = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const mesLabel = mesesLabel[new Date().getMonth()];

  return (
    <div className="pb-28 pt-4">

      {/* Hero */}
      <div className="px-4 mb-4 anim-up">
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 60%,#7c3aed 100%)",
            boxShadow: "0 20px 50px -15px rgba(124,58,237,0.4)",
          }}
        >
          <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />

          <p className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Euro size={11} /> Contas fixas de {mesLabel}
          </p>
          <p className="text-5xl font-black text-white leading-none">
            €{totalMensal.toFixed(2)}
          </p>
          <p className="text-[12px] text-white/70 mt-1.5">
            {contas.length === 0
              ? "Adiciona as tuas contas mensais"
              : `${contas.length} conta${contas.length !== 1 ? "s" : ""} · €${totalPago.toFixed(2)} pago${totalPago !== 1 ? "s" : ""}`}
          </p>

          {totalMensal > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-wide">Progresso este mês</span>
                <span className="text-[11px] font-black text-white">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: pct === 100 ? "#4ade80" : "rgba(255,255,255,0.85)" }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/50">Pago: €{totalPago.toFixed(2)}</span>
                <span className="text-[10px] text-white/50">Pendente: €{totalPendente.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas: a vencer em breve */}
      {aVencer.length > 0 && (
        <div className="px-4 mb-3 anim-up anim-up-1">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-700">A vencer em breve</p>
              <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                {aVencer.map(c => `${catById[c.categoria]?.emoji || "📋"} ${c.nome} (dia ${c.diaVencimento})`).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de adicionar */}
      {mostrarForm && (
        <div className="px-4 mb-4 anim-up">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black text-slate-800">Nova conta fixa</p>
              <button onClick={() => setMostrarForm(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <X size={14} className="text-slate-500" />
              </button>
            </div>
            <FormConta
              onGuardar={adicionarConta}
              onCancelar={() => setMostrarForm(false)}
            />
          </div>
        </div>
      )}

      {/* Lista de contas */}
      <div className="px-4 mb-4 anim-up anim-up-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={11} className="text-slate-300" />
            As minhas contas
          </p>
          {!mostrarForm && (
            <button
              onClick={() => { setMostrarForm(true); setEditando(null); }}
              className="press inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl"
            >
              <Plus size={13} /> Adicionar
            </button>
          )}
        </div>

        {contas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <TrendingDown size={28} className="text-violet-300" />
            </div>
            <p className="text-sm font-black text-slate-600">Sem contas registadas</p>
            <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
              Adiciona as tuas contas mensais fixas e controla tudo num só sítio.
            </p>
            <button
              onClick={() => setMostrarForm(true)}
              className="press mt-4 px-5 py-2.5 rounded-xl text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
            >
              <Plus size={13} className="inline mr-1" />
              Adicionar primeira conta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
            {contasOrdenadas.map(c => {
              const cat = catById[c.categoria] || catById.outro;
              const pago = !!pagosMes[c.id];
              const aberto = expandido === c.id;
              const emEdicao = editando === c.id;
              const venceHoje = c.diaVencimento === hoje;
              const venceEmBreve = !pago && c.diaVencimento > hoje && c.diaVencimento <= hoje + 5;

              return (
                <div key={c.id}>
                  {/* Linha principal */}
                  <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${pago ? "bg-slate-50/60" : ""}`}>

                    {/* Checkbox pago */}
                    <button
                      onClick={() => togglePago(c.id)}
                      className="flex-shrink-0"
                    >
                      {pago
                        ? <CheckCircle2 size={22} className="text-emerald-500" />
                        : <Circle size={22} className="text-slate-300" />
                      }
                    </button>

                    {/* Emoji categoria */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: cat.bg }}
                    >
                      {cat.emoji}
                    </div>

                    {/* Nome + dia */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black leading-tight ${pago ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {c.nome}
                      </p>
                      <p className="text-[10px] font-medium mt-0.5 flex items-center gap-1">
                        {venceHoje && !pago && (
                          <span className="text-rose-500 font-black">Vence hoje!</span>
                        )}
                        {venceEmBreve && (
                          <span className="text-amber-500 font-black">Dia {c.diaVencimento}</span>
                        )}
                        {!venceHoje && !venceEmBreve && (
                          <span className="text-slate-400">Dia {c.diaVencimento}</span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span style={{ color: cat.cor }} className="font-bold">{cat.label}</span>
                      </p>
                    </div>

                    {/* Valor */}
                    <p className={`text-sm font-black flex-shrink-0 ${pago ? "text-slate-400" : "text-slate-800"}`}>
                      €{c.valor.toFixed(2)}
                    </p>

                    {/* Expandir */}
                    <button
                      onClick={() => setExpandido(aberto ? null : c.id)}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"
                    >
                      {aberto ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                    </button>
                  </div>

                  {/* Painel expandido */}
                  {aberto && (
                    <div className="px-4 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                      {emEdicao ? (
                        <FormConta
                          inicial={c}
                          onGuardar={editarConta}
                          onCancelar={() => setEditando(null)}
                        />
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => togglePago(c.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-black border transition-all"
                            style={{
                              borderColor: pago ? "#d1fae5" : "#6ee7b7",
                              background: pago ? "#fff" : "#ecfdf5",
                              color: pago ? "#64748b" : "#059669",
                            }}
                          >
                            {pago ? "Marcar como pendente" : "✓ Marcar como pago"}
                          </button>
                          <button
                            onClick={() => setEditando(c.id)}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-blue-50 text-blue-600 border border-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removerConta(c.id)}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo por categoria */}
      {contas.length > 0 && (
        <div className="px-4 mb-4 anim-up anim-up-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Resumo por categoria
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATS.filter(cat => contas.some(c => c.categoria === cat.id)).map(cat => {
              const total = contas.filter(c => c.categoria === cat.id).reduce((s, c) => s + c.valor, 0);
              const pct2 = totalMensal > 0 ? Math.round((total / totalMensal) * 100) : 0;
              return (
                <div key={cat.id} className="bg-white rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg leading-none">{cat.emoji}</span>
                    <span className="text-[11px] font-black text-slate-600">{cat.label}</span>
                  </div>
                  <p className="text-lg font-black text-slate-800">€{total.toFixed(2)}</p>
                  <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct2}%`, background: cat.cor }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{pct2}% do total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
