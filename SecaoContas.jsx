import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  Circle, X, AlertCircle, ChevronLeft, ChevronRight,
  TrendingDown, BarChart3, CalendarDays, Pencil, Check,
  SlidersHorizontal, ExternalLink, Flame,
} from "lucide-react";

const CATS = [
  { id: "habitacao",  emoji: "🏠", label: "Habitação",   cor: "#059669", bg: "#ecfdf5" },
  { id: "energia",    emoji: "⚡", label: "Energia",      cor: "#d97706", bg: "#fffbeb" },
  { id: "internet",   emoji: "📱", label: "Internet/Tel", cor: "#2563eb", bg: "#eff6ff" },
  { id: "seguro",     emoji: "🛡️", label: "Seguros",      cor: "#7c3aed", bg: "#f5f3ff" },
  { id: "saude",      emoji: "💊", label: "Saúde",        cor: "#e11d48", bg: "#fff1f2" },
  { id: "transporte", emoji: "🚗", label: "Transporte",   cor: "#ea580c", bg: "#fff7ed" },
  { id: "lazer",      emoji: "🎮", label: "Lazer",        cor: "#6d28d9", bg: "#faf5ff" },
  { id: "outro",      emoji: "📋", label: "Outro",        cor: "#475569", bg: "#f8fafc" },
];

const PRESETS = [
  { nome: "Renda",             emoji: "🔑", valor: 650,  dia: 1,  cat: "habitacao" },
  { nome: "Prestação Casa",    emoji: "🏦", valor: 550,  dia: 1,  cat: "habitacao" },
  { nome: "Eletricidade",      emoji: "💡", valor: 55,   dia: 15, cat: "energia" },
  { nome: "Gás",               emoji: "🔥", valor: 30,   dia: 15, cat: "energia" },
  { nome: "Água",              emoji: "💧", valor: 25,   dia: 10, cat: "energia" },
  { nome: "Internet",          emoji: "🌐", valor: 35,   dia: 5,  cat: "internet" },
  { nome: "Telemóvel",         emoji: "📱", valor: 15,   dia: 5,  cat: "internet" },
  { nome: "Netflix",           emoji: "🎬", valor: 7,    dia: 8,  cat: "lazer" },
  { nome: "Spotify",           emoji: "🎵", valor: 5,    dia: 8,  cat: "lazer" },
  { nome: "Ginásio",           emoji: "🏋️", valor: 30,   dia: 1,  cat: "lazer" },
  { nome: "Seguro Auto",       emoji: "🚗", valor: 60,   dia: 20, cat: "seguro" },
  { nome: "Seguro Saúde",      emoji: "🏥", valor: 45,   dia: 1,  cat: "saude" },
  { nome: "Crédito Auto",      emoji: "🚙", valor: 200,  dia: 1,  cat: "transporte" },
  { nome: "Passe Transportes", emoji: "🚌", valor: 40,   dia: 1,  cat: "transporte" },
  { nome: "Condomínio",        emoji: "🏢", valor: 80,   dia: 1,  cat: "habitacao" },
];

const catById = Object.fromEntries(CATS.map(c => [c.id, c]));

const MESES_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MESES_CURTOS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function mesChave(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesNomeCompleto(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const ano = d.getFullYear();
  const mesLabel = MESES_PT[d.getMonth()];
  return ano !== new Date().getFullYear() ? `${mesLabel} ${ano}` : mesLabel;
}

function diaAtual() { return new Date().getDate(); }

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

function fmt(n) {
  return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── SVG anel de progresso ─── */
function AnelProgresso({ pct, size = 110, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circum = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct / 100)) * circum;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? "#4ade80" : "rgba(255,255,255,0.9)"}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circum}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

/* ─── Bolinhas de histórico (últimos 6 meses) ─── */
function HistoricoPagamentos({ id, pagamentos }) {
  const meses = Array.from({ length: 6 }, (_, i) => {
    const k = mesChave(i - 5);
    const pago = !!(pagamentos[k]?.[id]);
    const m = parseInt(k.split("-")[1], 10) - 1;
    return { k, pago, label: MESES_CURTOS[m] };
  });

  // calcular streak a partir do mês mais recente pago
  let streak = 0;
  for (let i = meses.length - 1; i >= 0; i--) {
    if (meses[i].pago) streak++;
    else break;
  }

  return (
    <div className="flex items-center gap-2 mt-2.5">
      <span className="text-[10px] text-slate-400 font-medium">Histórico:</span>
      <div className="flex items-center gap-1.5">
        {meses.map(m => (
          <div key={m.k} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-full transition-colors flex items-center justify-center text-[9px] ${m.pago ? "bg-emerald-400 text-white" : "bg-slate-200"}`}
              title={m.pago ? "Pago" : "Pendente"}
            >
              {m.pago ? "✓" : ""}
            </div>
            <span className="text-[8px] text-slate-400 leading-none">{m.label}</span>
          </div>
        ))}
      </div>
      {streak >= 2 && (
        <span className="ml-1 flex items-center gap-0.5 text-[10px] font-black text-amber-500">
          <Flame size={11} /> {streak} meses
        </span>
      )}
    </div>
  );
}

/* ─── Formulário de adicionar/editar ─── */
function FormConta({ inicial, onGuardar, onCancelar }) {
  const [nome,  setNome]  = useState(inicial?.nome          || "");
  const [valor, setValor] = useState(inicial?.valor         ? String(inicial.valor) : "");
  const [dia,   setDia]   = useState(inicial?.diaVencimento ? String(inicial.diaVencimento) : "1");
  const [cat,   setCat]   = useState(inicial?.categoria     || "habitacao");
  const [emoji, setEmoji] = useState(inicial?.emoji         || "");
  const [erro,  setErro]  = useState("");
  const [mostrarPresets, setMostrarPresets] = useState(!inicial);

  function usarPreset(p) {
    setNome(p.nome);
    setValor(String(p.valor));
    setDia(String(p.dia));
    setCat(p.cat);
    setEmoji(p.emoji);
    setMostrarPresets(false);
  }

  function submeter(e) {
    e.preventDefault();
    const v = parseFloat(valor.replace(",", "."));
    if (!nome.trim())                   { setErro("Escreve o nome da conta."); return; }
    if (isNaN(v) || v <= 0)            { setErro("Valor inválido."); return; }
    const d = parseInt(dia, 10);
    if (isNaN(d) || d < 1 || d > 31)  { setErro("Dia inválido (1–31)."); return; }
    setErro("");
    onGuardar({ nome: nome.trim(), valor: v, diaVencimento: d, categoria: cat, emoji });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-3">

      {/* Sugestões rápidas */}
      {mostrarPresets && !inicial && (
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Sugestões rápidas</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.nome}
                type="button"
                onClick={() => usarPreset(p)}
                className="press px-2.5 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 bg-slate-50 text-slate-600"
              >
                {p.emoji} {p.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nome */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nome da conta</label>
          {!inicial && (
            <button type="button" onClick={() => setMostrarPresets(v => !v)} className="text-[10px] font-black text-violet-500">
              {mostrarPresets ? "Ocultar sugestões" : "Ver sugestões"}
            </button>
          )}
        </div>
        <input
          type="text" value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="ex: Renda, NOS, Fidelidade…"
          maxLength={40}
          autoFocus={!mostrarPresets}
          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50"
        />
      </div>

      {/* Valor + Dia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Valor (€)</label>
          <input
            type="text" inputMode="decimal" value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Dia do mês</label>
          <input
            type="number" inputMode="numeric" min={1} max={31} value={dia}
            onChange={e => setDia(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50"
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Categoria</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {CATS.map(c => (
            <button
              key={c.id} type="button" onClick={() => setCat(c.id)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
              style={{ borderColor: cat === c.id ? c.cor : "#e2e8f0", background: cat === c.id ? c.bg : "#fff" }}
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
          style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
        >
          {inicial ? "Guardar alterações" : "Adicionar conta"}
        </button>
        <button type="button" onClick={onCancelar} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-black">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ─── Oportunidades de poupança por categoria ─── */
const OPORTUNIDADES = [
  {
    cats: ["energia"],
    label: "Energia (luz, gás, água)",
    emoji: "⚡",
    pct: 0.22,
    minAnual: 80,
    provider: "ComparaJá",
    url: "https://www.comparaja.pt/?ref=poupeja",
    cor: "#d97706",
    bg: "#fffbeb",
  },
  {
    cats: ["internet"],
    label: "Internet e telemóvel",
    emoji: "🌐",
    pct: 0.25,
    minAnual: 60,
    provider: "ComparaJá",
    url: "https://www.comparaja.pt/?ref=poupeja",
    cor: "#2563eb",
    bg: "#eff6ff",
  },
  {
    cats: ["seguro"],
    label: "Seguros",
    emoji: "🛡️",
    pct: 0.20,
    minAnual: 80,
    provider: "ComparaJá",
    url: "https://www.comparaja.pt/?ref=poupeja",
    cor: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    cats: ["habitacao"],
    label: "Crédito habitação",
    emoji: "🏦",
    pct: 0.05,
    minAnual: 400,
    minMensal: 200,
    provider: "Doutor Finanças",
    url: "https://www.doutorfinancas.pt/?ref=poupeja",
    cor: "#059669",
    bg: "#ecfdf5",
  },
];

function calcOportunidades(contas) {
  return OPORTUNIDADES
    .map(op => {
      const filtradas = contas.filter(c =>
        op.cats.includes(c.categoria) && (!op.minMensal || c.valor >= op.minMensal)
      );
      if (filtradas.length === 0) return null;
      const anual = filtradas.reduce((s, c) => s + c.valor, 0) * 12;
      const economia = Math.max(op.minAnual, Math.round(anual * op.pct));
      return { ...op, economia };
    })
    .filter(Boolean);
}

function PoupancaPotencial({ contas }) {
  const ativas = calcOportunidades(contas);
  if (ativas.length === 0) return null;

  const totalEconomia = ativas.reduce((s, op) => s + op.economia, 0);

  return (
    <div className="px-4 mb-4 anim-up anim-up-1">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#fffbeb,#fefce8)", border: "1.5px solid #fde68a" }}
      >
        {/* Cabeçalho */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-2xl">
            💡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Poupança potencial</p>
            <p className="text-xl font-black text-slate-800 leading-tight mt-0.5">
              Podes poupar até{" "}
              <span className="text-amber-600">€{totalEconomia.toLocaleString("pt-PT")}/ano</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Com base nas categorias que tens registadas</p>
          </div>
        </div>

        {/* Oportunidades por categoria */}
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {ativas.map((op, i) => (
            <a
              key={i}
              href={op.url}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 no-underline"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: op.bg }}
                >
                  {op.emoji}
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-700">{op.label}</p>
                  <p className="text-[10px] text-slate-400">via {op.provider} — grátis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[12px] font-black" style={{ color: op.cor }}>
                  até €{op.economia}/ano
                </span>
                <ExternalLink size={11} className="text-slate-300" />
              </div>
            </a>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 text-center pb-3">Comparação gratuita e sem compromisso</p>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export default function SecaoContas() {
  const [contas, setContas]           = useState([]);
  const [pagamentos, setPagamentos]   = useState({});
  const [mesOff, setMesOff]           = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando]       = useState(null);
  const [expandido, setExpandido]     = useState(null);
  const [ordenacao, setOrdenacao]     = useState("dia");
  const [mostrarOrdenacao, setMostrarOrdenacao] = useState(false);

  const hoje       = diaAtual();
  const esMesAtual = mesOff === 0;
  const mes        = mesChave(mesOff);
  const mesLabel   = mesNomeCompleto(mesOff);

  const carregar = useCallback(() => {
    setContas(lerContas());
    setPagamentos(lerPagamentos());
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const pagosMes      = pagamentos[mes] || {};
  const totalMensal   = contas.reduce((s, c) => s + c.valor, 0);
  const totalPago     = contas.filter(c => pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
  const totalPendente = totalMensal - totalPago;
  const pct           = totalMensal > 0 ? Math.round((totalPago / totalMensal) * 100) : 0;
  const nPagas        = contas.filter(c => pagosMes[c.id]).length;
  const totalAnual    = totalMensal * 12;
  const totalDiario   = totalMensal / 30.44;

  const pendentes     = contas.filter(c => !pagosMes[c.id]);
  const aVencerHoje   = esMesAtual ? pendentes.filter(c => c.diaVencimento === hoje) : [];
  const aVencerBreve  = esMesAtual ? pendentes.filter(c => c.diaVencimento > hoje && c.diaVencimento <= hoje + 5) : [];

  function sortContas(lista) {
    const base = [...lista];
    if (ordenacao === "dia")   return base.sort((a, b) => a.diaVencimento - b.diaVencimento);
    if (ordenacao === "valor") return base.sort((a, b) => b.valor - a.valor);
    if (ordenacao === "nome")  return base.sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordenacao === "cat")   return base.sort((a, b) => a.categoria.localeCompare(b.categoria));
    return base;
  }

  const contasOrdenadas = sortContas(contas);
  const todasPagas = contas.length > 0 && contas.every(c => pagosMes[c.id]);

  function togglePago(id) {
    const novos = { ...pagamentos };
    if (!novos[mes]) novos[mes] = {};
    novos[mes] = { ...novos[mes], [id]: !novos[mes][id] };
    setPagamentos(novos);
    guardarPagamentos(novos);
  }

  function marcarTodos() {
    const novos = { ...pagamentos };
    if (!novos[mes]) novos[mes] = {};
    if (todasPagas) {
      novos[mes] = {};
    } else {
      contas.forEach(c => { novos[mes][c.id] = true; });
    }
    setPagamentos(novos);
    guardarPagamentos(novos);
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
    if (!confirm("Remover esta conta?")) return;
    const lista = contas.filter(c => c.id !== id);
    setContas(lista);
    guardarContas(lista);
    if (expandido === id) setExpandido(null);
    if (editando === id)  setEditando(null);
  }

  const LABELS_ORD = { dia: "Dia de vencimento", valor: "Valor (maior primeiro)", nome: "Nome (A–Z)", cat: "Categoria" };

  return (
    <div className="pb-28 pt-4">

      {/* ── Hero ── */}
      <div className="px-4 mb-4 anim-up">
        <div
          className="rounded-3xl px-6 pt-6 pb-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 60%,#7c3aed 100%)",
            boxShadow: "0 8px 32px -8px rgba(124,58,237,0.30)",
          }}
        >

          {/* Navegação de mês */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <button onClick={() => setMesOff(o => o - 1)} className="press w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <p className="text-[12px] font-black text-white capitalize">{mesLabel}</p>
            <button
              onClick={() => setMesOff(o => Math.min(0, o + 1))}
              className={`press w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center ${mesOff === 0 ? "opacity-30 pointer-events-none" : ""}`}
            >
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Anel de progresso */}
            {totalMensal > 0 && (
              <div className="relative flex-shrink-0">
                <AnelProgresso pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white leading-none">{pct}%</span>
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-wide mt-0.5">pago</span>
                </div>
              </div>
            )}

            {/* Valores */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-0.5">Total mensal</p>
              <p className="text-4xl font-black text-white leading-none">
                €{fmt(totalMensal)}
              </p>
              {contas.length > 0 ? (
                <>
                  {/* Contexto anual e diário */}
                  <p className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-white/80 font-bold">€{Math.round(totalAnual).toLocaleString("pt-PT")}/ano</span>
                    <span className="text-white/30">·</span>
                    <span>€{totalDiario.toFixed(2)}/dia</span>
                  </p>
                  <p className="text-[11px] text-white/60 mt-1">
                    {nPagas}/{contas.length} conta{contas.length !== 1 ? "s" : ""} pagas
                    {totalPendente > 0 && (
                      <> · Pendente: <span className="text-white font-black">€{fmt(totalPendente)}</span></>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-white/60 mt-1.5">Sem contas adicionadas</p>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          {totalMensal > 0 && (
            <div className="mt-4 relative z-10">
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct >= 100 ? "#4ade80" : "rgba(255,255,255,0.8)" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/40">€{fmt(totalPago)} pago</span>
                <span className="text-[10px] text-white/40">€{fmt(totalPendente)} pendente</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cartões de estatísticas (2×2) ── */}
      {contas.length > 0 && (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="grid grid-cols-2 gap-2.5">

            {/* Mensal */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Mensal</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">€{Math.round(totalMensal).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{contas.length} conta{contas.length !== 1 ? "s" : ""} fixas</p>
            </div>

            {/* Anual */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Anual</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">€{Math.round(totalAnual).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">€{totalDiario.toFixed(2)}/dia</p>
            </div>

            {/* Pagas este mês */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pagas</p>
              <p className="text-xl font-black mt-0.5" style={{ color: pct === 100 ? "#059669" : pct > 0 ? "#7c3aed" : "#94a3b8" }}>
                {nPagas}/{contas.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {pct === 100 ? "Tudo pago! 🎉" : `€${fmt(totalPago)} pago`}
              </p>
            </div>

            {/* Pendente */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pendente</p>
              <p className="text-xl font-black mt-0.5" style={{ color: totalPendente > 0 ? "#e11d48" : "#059669" }}>
                €{Math.round(totalPendente).toLocaleString("pt-PT")}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {totalPendente > 0 ? `${contas.length - nPagas} conta${contas.length - nPagas !== 1 ? "s" : ""} por pagar` : "Em dia!"}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ── Poupança potencial (personalized, after stats) ── */}
      {contas.length > 0 && <PoupancaPotencial contas={contas} />}

      {/* ── Alertas ── */}
      {(aVencerHoje.length > 0 || aVencerBreve.length > 0) && (
        <div className="px-4 mb-3 anim-up anim-up-1">
          {aVencerHoje.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3 mb-2">
              <AlertCircle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-rose-700">Vence hoje!</p>
                <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
                  {aVencerHoje.map(c => `${c.emoji || catById[c.categoria]?.emoji || "📋"} ${c.nome} — €${fmt(c.valor)}`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {aVencerBreve.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-700">A vencer em breve</p>
                <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                  {aVencerBreve.map(c => `${c.emoji || catById[c.categoria]?.emoji || "📋"} ${c.nome} (dia ${c.diaVencimento})`).join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Formulário de adicionar ── */}
      {mostrarForm && (
        <div className="px-4 mb-4 anim-up">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-violet-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black text-slate-800">Nova conta fixa</p>
              <button onClick={() => setMostrarForm(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <X size={14} className="text-slate-500" />
              </button>
            </div>
            <FormConta onGuardar={adicionarConta} onCancelar={() => setMostrarForm(false)} />
          </div>
        </div>
      )}

      {/* ── Cabeçalho da lista ── */}
      <div className="px-4 mb-3 flex items-center justify-between anim-up anim-up-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <CalendarDays size={11} className="text-slate-300" /> As minhas contas
        </p>
        <div className="flex items-center gap-2">
          {/* Ordenação */}
          <div className="relative">
            <button
              onClick={() => setMostrarOrdenacao(v => !v)}
              className="press w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center"
            >
              <SlidersHorizontal size={13} className="text-slate-500" />
            </button>
            {mostrarOrdenacao && (
              <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-lg border border-slate-100 p-2 min-w-[180px]">
                {Object.entries(LABELS_ORD).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setOrdenacao(k); setMostrarOrdenacao(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-black ${ordenacao === k ? "bg-violet-50 text-violet-700" : "text-slate-600"}`}
                  >
                    {ordenacao === k && <Check size={11} className="inline mr-1.5" />}{v}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Marcar todos */}
          {contas.length > 0 && esMesAtual && (
            <button
              onClick={marcarTodos}
              className={`press text-[11px] font-black px-3 py-1.5 rounded-xl ${todasPagas ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600"}`}
            >
              {todasPagas ? "Desmarcar todas" : "✓ Marcar todas"}
            </button>
          )}
          {/* Adicionar */}
          {!mostrarForm && (
            <button
              onClick={() => { setMostrarForm(true); setEditando(null); }}
              className="press inline-flex items-center gap-1.5 text-xs font-black text-violet-600 bg-violet-50 px-3 py-1.5 rounded-xl"
            >
              <Plus size={13} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── Lista ── */}
      {contas.length === 0 ? (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <TrendingDown size={28} className="text-violet-300" />
            </div>
            <p className="text-sm font-black text-slate-600">Começa a controlar as tuas despesas</p>
            <p className="text-[12px] text-slate-400 mt-1 leading-relaxed max-w-xs">
              Adiciona as tuas contas mensais fixas — renda, luz, água, internet — e sabe sempre quanto te falta pagar e quando.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {["🔑 Renda", "💡 Luz", "💧 Água", "🌐 Net"].map(t => (
                <span key={t} className="px-2.5 py-1 bg-violet-50 text-violet-600 text-[10px] font-black rounded-lg">{t}</span>
              ))}
            </div>
            <button
              onClick={() => setMostrarForm(true)}
              className="press mt-5 px-5 py-2.5 rounded-xl text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
            >
              <Plus size={13} className="inline mr-1" /> Adicionar primeira conta
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
            {contasOrdenadas.map(c => {
              const cat      = catById[c.categoria] || catById.outro;
              const icon     = c.emoji || cat.emoji;
              const pago     = !!pagosMes[c.id];
              const aberto   = expandido === c.id;
              const emEdicao = editando === c.id;
              const venceHoje  = esMesAtual && !pago && c.diaVencimento === hoje;
              const venceBreve = esMesAtual && !pago && c.diaVencimento > hoje && c.diaVencimento <= hoje + 5;

              return (
                <div key={c.id}>
                  {/* Linha principal */}
                  <div
                    className={`flex items-center gap-3 pr-3 py-3.5 transition-colors ${pago ? "opacity-60" : ""}`}
                    style={{ paddingLeft: 0 }}
                  >
                    {/* Barra lateral colorida */}
                    <div
                      className="w-1 self-stretch rounded-r-full flex-shrink-0"
                      style={{ background: pago ? "#e2e8f0" : cat.cor, minWidth: 4 }}
                    />

                    {/* Toggle pago */}
                    <button onClick={() => esMesAtual && togglePago(c.id)} className={`flex-shrink-0 ${!esMesAtual ? "pointer-events-none" : ""}`}>
                      {pago
                        ? <CheckCircle2 size={22} className="text-emerald-500" />
                        : <Circle size={22} className="text-slate-300" />}
                    </button>

                    {/* Ícone */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base leading-none"
                      style={{ background: cat.bg }}
                    >
                      {icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black leading-tight ${pago ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {c.nome}
                      </p>
                      <p className="text-[10px] font-medium mt-0.5 flex items-center gap-1 flex-wrap">
                        {venceHoje  && <span className="text-rose-500 font-black">Vence hoje!</span>}
                        {venceBreve && <span className="text-amber-500 font-black">Dia {c.diaVencimento}</span>}
                        {!venceHoje && !venceBreve && <span className="text-slate-400">Dia {c.diaVencimento}</span>}
                        <span className="text-slate-200">·</span>
                        <span style={{ color: cat.cor }} className="font-bold">{cat.label}</span>
                      </p>
                    </div>

                    {/* Valor */}
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-[13px] font-black ${pago ? "text-slate-400" : "text-slate-800"}`}>
                        €{fmt(c.valor)}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        €{Math.round(c.valor * 12).toLocaleString("pt-PT")}/ano
                      </p>
                    </div>

                    {/* Expandir */}
                    <button
                      onClick={() => setExpandido(aberto ? null : c.id)}
                      className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"
                    >
                      {aberto
                        ? <ChevronUp size={12} className="text-slate-400" />
                        : <ChevronDown size={12} className="text-slate-400" />}
                    </button>
                  </div>

                  {/* Painel expandido */}
                  {aberto && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/60 border-t border-slate-100">
                      {emEdicao ? (
                        <FormConta
                          inicial={c}
                          onGuardar={editarConta}
                          onCancelar={() => setEditando(null)}
                        />
                      ) : (
                        <>
                          {/* Breakdown mensal / anual / diário */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-white rounded-xl p-2.5 text-center border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Mensal</p>
                              <p className="text-sm font-black text-slate-800 mt-0.5">€{fmt(c.valor)}</p>
                            </div>
                            <div className="bg-violet-50 rounded-xl p-2.5 text-center border border-violet-100">
                              <p className="text-[9px] font-black text-violet-400 uppercase tracking-wide">Anual</p>
                              <p className="text-sm font-black text-violet-700 mt-0.5">€{Math.round(c.valor * 12).toLocaleString("pt-PT")}</p>
                            </div>
                            <div className="bg-white rounded-xl p-2.5 text-center border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Por dia</p>
                              <p className="text-sm font-black text-slate-800 mt-0.5">€{(c.valor / 30.44).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Histórico de pagamentos */}
                          <HistoricoPagamentos id={c.id} pagamentos={pagamentos} />

                          {/* Ações */}
                          <div className="flex gap-2 mt-3">
                            {esMesAtual && (
                              <button
                                onClick={() => togglePago(c.id)}
                                className="flex-1 py-2 rounded-xl text-xs font-black border transition-all"
                                style={{
                                  borderColor: pago ? "#e2e8f0" : "#6ee7b7",
                                  background:  pago ? "#fff"    : "#ecfdf5",
                                  color:       pago ? "#94a3b8" : "#059669",
                                }}
                              >
                                {pago ? "Marcar como pendente" : "✓ Marcar como pago"}
                              </button>
                            )}
                            <button
                              onClick={() => setEditando(c.id)}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1"
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => removerConta(c.id)}
                              className="px-3 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Resumo por categoria ── */}
      {contas.length > 0 && (
        <div className="px-4 mb-4 anim-up anim-up-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart3 size={11} className="text-slate-300" /> Por categoria
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
            {CATS.filter(cat => contas.some(c => c.categoria === cat.id)).map(cat => {
              const totalCat = contas.filter(c => c.categoria === cat.id).reduce((s, c) => s + c.valor, 0);
              const pagosCat = contas.filter(c => c.categoria === cat.id && pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
              const pctCat   = totalMensal > 0 ? (totalCat / totalMensal) * 100 : 0;
              const nCat     = contas.filter(c => c.categoria === cat.id).length;
              const anualCat = totalCat * 12;

              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: cat.bg }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-slate-700">{cat.label}</p>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">€{fmt(totalCat)}<span className="text-[10px] text-slate-400 font-medium">/mês</span></p>
                        <p className="text-[10px] text-slate-400">€{Math.round(anualCat).toLocaleString("pt-PT")}/ano</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pctCat}%`, background: cat.cor }} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {nCat} conta{nCat !== 1 ? "s" : ""} · {Math.round(pctCat)}% do total
                      {pagosCat > 0 && ` · €${fmt(pagosCat)} pago${pagosCat !== totalCat ? "s" : ""}`}
                    </p>
                    {(() => {
                      const op = OPORTUNIDADES.find(o => o.cats.includes(cat.id) && (!o.minMensal || contas.filter(c => c.categoria === cat.id).some(c => c.valor >= o.minMensal)));
                      if (!op) return null;
                      return (
                        <a href={op.url} target="_blank" rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-black no-underline"
                          style={{ color: op.cor }}
                        >
                          💡 Comparar tarifas — poupar até €{Math.max(op.minAnual, Math.round(totalCat * 12 * op.pct))}/ano
                          <ExternalLink size={9} />
                        </a>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}
