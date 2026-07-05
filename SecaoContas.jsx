import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  Circle, X, AlertCircle, ChevronLeft, ChevronRight,
  TrendingDown, BarChart3, CalendarDays, Pencil, Check,
  SlidersHorizontal, ExternalLink, Flame, Building2,
} from "lucide-react";

// Crédito Habitação / Renda — sub-secção irmã, carregada só quando aberta
const SecaoCasaConteudo = dynamic(() => import("./SecaoCasa"), {
  loading: () => <div className="mx-4 mt-4 h-40 rounded-2xl animate-pulse" style={{ background: "#eeece4" }} />,
});

// Sub-navegação (mesmo padrão da secção Mobilidade: Contas / Casa)
function SubTabBar({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl mx-4 mt-4 mb-2" style={{ background: "#eeece4" }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`pj-tap press flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            value === o.id ? "shadow-sm" : ""
          }`}
          style={value === o.id ? { background: "#fbfaf6", color: "#14231c" } : { color: "#8a978e" }}
        >
          <o.icon size={13} /> {o.label}
        </button>
      ))}
    </div>
  );
}

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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4e2d8" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? "#0b6b4f" : "#2c3b33"}
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
      <span className="text-[10px]" style={{ color: "#8a978e", fontWeight: 600 }}>Histórico:</span>
      <div className="flex items-center gap-1.5">
        {meses.map(m => (
          <div key={m.k} className="flex flex-col items-center gap-0.5">
            <div
              className="w-5 h-5 rounded-full transition-colors flex items-center justify-center text-[9px]"
              style={{ background: m.pago ? "#0b6b4f" : "#eeece4", color: m.pago ? "#fff" : "transparent" }}
              title={m.pago ? "Pago" : "Pendente"}
            >
              {m.pago ? "✓" : ""}
            </div>
            <span className="text-[8px] leading-none" style={{ color: "#8a978e" }}>{m.label}</span>
          </div>
        ))}
      </div>
      {streak >= 2 && (
        <span className="ml-1 flex items-center gap-0.5 text-[10px]" style={{ fontWeight: 700, color: "#0b6b4f" }}>
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
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Sugestões rápidas</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.nome}
                type="button"
                onClick={() => usarPreset(p)}
                className="press pj-tap px-2.5 py-1.5 rounded-xl text-[11px]"
                style={{ fontWeight: 600, border: "1px solid #e4e2d8", background: "#eeece4", color: "#5c6b62" }}
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
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Nome da conta</label>
          {!inicial && (
            <button type="button" onClick={() => setMostrarPresets(v => !v)} className="text-[10px]" style={{ fontWeight: 600, color: "#0b6b4f" }}>
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
          className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ border: "1px solid #e4e2d8", background: "#fbfaf6", color: "#14231c" }}
        />
      </div>

      {/* Valor + Dia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Valor (€)</label>
          <input
            type="text" inputMode="decimal" value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e4e2d8", background: "#fbfaf6", color: "#14231c" }}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Dia do mês</label>
          <input
            type="number" inputMode="numeric" min={1} max={31} value={dia}
            onChange={e => setDia(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e4e2d8", background: "#fbfaf6", color: "#14231c" }}
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Categoria</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {CATS.map(c => (
            <button
              key={c.id} type="button" onClick={() => setCat(c.id)}
              className="pj-tap flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
              style={{ borderColor: cat === c.id ? c.cor : "#e4e2d8", background: cat === c.id ? c.bg : "#fbfaf6" }}
            >
              <span className="text-lg leading-none">{c.emoji}</span>
              <span className="text-[9px] leading-tight text-center" style={{ fontWeight: 600, color: cat === c.id ? c.cor : "#8a978e" }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p className="text-xs flex items-center gap-1.5" style={{ fontWeight: 600, color: "#b4472e" }}>
          <AlertCircle size={12} /> {erro}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="pj-tap flex-1 py-2.5 rounded-xl text-white text-sm"
          style={{ fontWeight: 600, background: "#0b6b4f" }}
        >
          {inicial ? "Guardar alterações" : "Adicionar conta"}
        </button>
        <button type="button" onClick={onCancelar} className="pj-tap px-4 py-2.5 rounded-xl text-sm" style={{ fontWeight: 600, background: "#eeece4", color: "#5c6b62" }}>
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
        style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
      >
        {/* Cabeçalho */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: "#eeece4" }}>
            💡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Poupança potencial</p>
            <p className="font-display leading-tight mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>
              Podes poupar até{" "}
              <span style={{ color: "#0b6b4f" }}>€{totalEconomia.toLocaleString("pt-PT")}/ano</span>
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#5c6b62" }}>Com base nas categorias que tens registadas</p>
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
              className="press pj-tap flex items-center justify-between rounded-xl px-3.5 py-2.5 no-underline"
              style={{ background: "#f6f5f0", border: "1px solid #eeece4" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: op.bg }}
                >
                  {op.emoji}
                </div>
                <div>
                  <p className="text-[12px]" style={{ fontWeight: 600, color: "#14231c" }}>{op.label}</p>
                  <p className="text-[10px]" style={{ color: "#8a978e" }}>via {op.provider} — grátis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[12px]" style={{ fontWeight: 600, color: op.cor }}>
                  até €{op.economia}/ano
                </span>
                <ExternalLink size={11} style={{ color: "#8a978e" }} />
              </div>
            </a>
          ))}
        </div>

        <p className="text-[10px] text-center pb-3" style={{ color: "#8a978e" }}>Comparação gratuita e sem compromisso</p>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
function ContasFixasConteudo() {
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
          style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}
        >

          {/* Navegação de mês */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <button onClick={() => setMesOff(o => o - 1)} className="press pj-tap w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#eeece4" }}>
              <ChevronLeft size={16} style={{ color: "#2c3b33" }} />
            </button>
            <p className="text-[11px] uppercase capitalize" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>{mesLabel}</p>
            <button
              onClick={() => setMesOff(o => Math.min(0, o + 1))}
              className={`press pj-tap w-8 h-8 rounded-xl flex items-center justify-center ${mesOff === 0 ? "opacity-30 pointer-events-none" : ""}`}
              style={{ background: "#eeece4" }}
            >
              <ChevronRight size={16} style={{ color: "#2c3b33" }} />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Anel de progresso */}
            {totalMensal > 0 && (
              <div className="relative flex-shrink-0">
                <AnelProgresso pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display leading-none" style={{ fontSize: "24px", fontWeight: 600, color: "#14231c" }}>{pct}%</span>
                  <span className="text-[9px] uppercase mt-0.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>pago</span>
                </div>
              </div>
            )}

            {/* Valores */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase mb-0.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Total mensal</p>
              <p className="font-display leading-none" style={{ fontSize: "34px", fontWeight: 600, color: "#14231c" }}>
                €{fmt(totalMensal)}
              </p>
              {contas.length > 0 ? (
                <>
                  {/* Contexto anual e diário */}
                  <p className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap" style={{ color: "#8a978e" }}>
                    <span style={{ fontWeight: 600, color: "#5c6b62" }}>€{Math.round(totalAnual).toLocaleString("pt-PT")}/ano</span>
                    <span style={{ color: "#c4c0b2" }}>·</span>
                    <span>€{totalDiario.toFixed(2)}/dia</span>
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "#5c6b62" }}>
                    {nPagas}/{contas.length} conta{contas.length !== 1 ? "s" : ""} pagas
                    {totalPendente > 0 && (
                      <> · Pendente: <span style={{ fontWeight: 600, color: "#14231c" }}>€{fmt(totalPendente)}</span></>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-[12px] mt-1.5" style={{ color: "#5c6b62" }}>Sem contas adicionadas</p>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          {totalMensal > 0 && (
            <div className="mt-4 relative z-10">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#eeece4" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: "#0b6b4f" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "#8a978e" }}>€{fmt(totalPago)} pago</span>
                <span className="text-[10px]" style={{ color: "#8a978e" }}>€{fmt(totalPendente)} pendente</span>
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
            <div className="rounded-2xl p-3.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Mensal</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>€{Math.round(totalMensal).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8a978e" }}>{contas.length} conta{contas.length !== 1 ? "s" : ""} fixas</p>
            </div>

            {/* Anual */}
            <div className="rounded-2xl p-3.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Anual</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>€{Math.round(totalAnual).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8a978e" }}>€{totalDiario.toFixed(2)}/dia</p>
            </div>

            {/* Pagas este mês */}
            <div className="rounded-2xl p-3.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Pagas</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: pct === 100 ? "#0b6b4f" : pct > 0 ? "#14231c" : "#8a978e" }}>
                {nPagas}/{contas.length}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8a978e" }}>
                {pct === 100 ? "Tudo pago! 🎉" : `€${fmt(totalPago)} pago`}
              </p>
            </div>

            {/* Pendente */}
            <div className="rounded-2xl p-3.5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Pendente</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: totalPendente > 0 ? "#b4472e" : "#0b6b4f" }}>
                €{Math.round(totalPendente).toLocaleString("pt-PT")}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8a978e" }}>
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
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3 mb-2" style={{ border: "1px solid #ecd9d1", background: "#f7ece8" }}>
              <AlertCircle size={15} style={{ color: "#b4472e" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: "#8f3320" }}>Vence hoje!</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#b4472e" }}>
                  {aVencerHoje.map(c => `${c.emoji || catById[c.categoria]?.emoji || "📋"} ${c.nome} — €${fmt(c.valor)}`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {aVencerBreve.length > 0 && (
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ border: "1px solid #e8dcc2", background: "#f6efe0" }}>
              <AlertCircle size={15} style={{ color: "#a86a1f" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: "#8a5616" }}>A vencer em breve</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#a86a1f" }}>
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
          <div className="rounded-2xl p-5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>Nova conta fixa</p>
              <button onClick={() => setMostrarForm(false)} className="pj-tap w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#eeece4" }}>
                <X size={14} style={{ color: "#5c6b62" }} />
              </button>
            </div>
            <FormConta onGuardar={adicionarConta} onCancelar={() => setMostrarForm(false)} />
          </div>
        </div>
      )}

      {/* ── Cabeçalho da lista ── */}
      <div className="px-4 mb-3 flex items-center justify-between anim-up anim-up-1">
        <p className="text-[11px] uppercase flex items-center gap-1.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
          <CalendarDays size={11} style={{ color: "#8a978e" }} /> As minhas contas
        </p>
        <div className="flex items-center gap-2">
          {/* Ordenação */}
          <div className="relative">
            <button
              onClick={() => setMostrarOrdenacao(v => !v)}
              className="press pj-tap w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "#eeece4" }}
            >
              <SlidersHorizontal size={13} style={{ color: "#2c3b33" }} />
            </button>
            {mostrarOrdenacao && (
              <div className="absolute right-0 top-9 z-50 rounded-2xl p-2 min-w-[180px]" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8", boxShadow: "0 8px 24px -12px rgba(20,35,28,0.25)" }}>
                {Object.entries(LABELS_ORD).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setOrdenacao(k); setMostrarOrdenacao(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs"
                    style={{ fontWeight: 600, background: ordenacao === k ? "#eeece4" : "transparent", color: ordenacao === k ? "#0b6b4f" : "#5c6b62" }}
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
              className="press pj-tap text-[11px] px-3 py-1.5 rounded-xl"
              style={{ fontWeight: 600, background: todasPagas ? "#eeece4" : "#eaf1ec", color: todasPagas ? "#5c6b62" : "#0b6b4f" }}
            >
              {todasPagas ? "Desmarcar todas" : "✓ Marcar todas"}
            </button>
          )}
          {/* Adicionar */}
          {!mostrarForm && (
            <button
              onClick={() => { setMostrarForm(true); setEditando(null); }}
              className="press pj-tap inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ fontWeight: 600, color: "#0b6b4f", background: "#eaf1ec" }}
            >
              <Plus size={13} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── Lista ── */}
      {contas.length === 0 ? (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#eeece4" }}>
              <TrendingDown size={28} style={{ color: "#0b6b4f" }} />
            </div>
            <p className="font-display" style={{ fontSize: "19px", fontWeight: 600, color: "#14231c" }}>Começa a controlar as tuas despesas</p>
            <p className="text-[12px] mt-1 leading-relaxed max-w-xs" style={{ color: "#5c6b62" }}>
              Adiciona as tuas contas mensais fixas — renda, luz, água, internet — e sabe sempre quanto te falta pagar e quando.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {["🔑 Renda", "💡 Luz", "💧 Água", "🌐 Net"].map(t => (
                <span key={t} className="px-2.5 py-1 text-[10px] rounded-lg" style={{ fontWeight: 600, background: "#eeece4", color: "#5c6b62" }}>{t}</span>
              ))}
            </div>
            <button
              onClick={() => setMostrarForm(true)}
              className="press pj-tap mt-5 px-5 py-2.5 rounded-xl text-white text-xs"
              style={{ fontWeight: 600, background: "#0b6b4f" }}
            >
              <Plus size={13} className="inline mr-1" /> Adicionar primeira conta
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            {contasOrdenadas.map((c, ci) => {
              const cat      = catById[c.categoria] || catById.outro;
              const icon     = c.emoji || cat.emoji;
              const pago     = !!pagosMes[c.id];
              const aberto   = expandido === c.id;
              const emEdicao = editando === c.id;
              const venceHoje  = esMesAtual && !pago && c.diaVencimento === hoje;
              const venceBreve = esMesAtual && !pago && c.diaVencimento > hoje && c.diaVencimento <= hoje + 5;

              return (
                <div key={c.id} style={ci > 0 ? { borderTop: "1px solid #eeece4" } : undefined}>
                  {/* Linha principal */}
                  <div
                    className={`flex items-center gap-3 pr-3 py-3.5 transition-colors ${pago ? "opacity-60" : ""}`}
                    style={{ paddingLeft: 0 }}
                  >
                    {/* Barra lateral colorida */}
                    <div
                      className="w-1 self-stretch rounded-r-full flex-shrink-0"
                      style={{ background: pago ? "#e4e2d8" : cat.cor, minWidth: 4 }}
                    />

                    {/* Toggle pago */}
                    <button onClick={() => esMesAtual && togglePago(c.id)} className={`pj-tap flex-shrink-0 ${!esMesAtual ? "pointer-events-none" : ""}`}>
                      {pago
                        ? <CheckCircle2 size={22} style={{ color: "#0b6b4f" }} />
                        : <Circle size={22} style={{ color: "#c4c0b2" }} />}
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
                      <p className="text-sm leading-tight" style={{ fontWeight: 600, textDecoration: pago ? "line-through" : "none", color: pago ? "#8a978e" : "#14231c" }}>
                        {c.nome}
                      </p>
                      <p className="text-[10px] mt-0.5 flex items-center gap-1 flex-wrap">
                        {venceHoje  && <span style={{ fontWeight: 600, color: "#b4472e" }}>Vence hoje!</span>}
                        {venceBreve && <span style={{ fontWeight: 600, color: "#a86a1f" }}>Dia {c.diaVencimento}</span>}
                        {!venceHoje && !venceBreve && <span style={{ color: "#8a978e" }}>Dia {c.diaVencimento}</span>}
                        <span style={{ color: "#c4c0b2" }}>·</span>
                        <span style={{ color: cat.cor, fontWeight: 600 }}>{cat.label}</span>
                      </p>
                    </div>

                    {/* Valor */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[13px]" style={{ fontWeight: 600, color: pago ? "#8a978e" : "#14231c" }}>
                        €{fmt(c.valor)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "#8a978e" }}>
                        €{Math.round(c.valor * 12).toLocaleString("pt-PT")}/ano
                      </p>
                    </div>

                    {/* Expandir */}
                    <button
                      onClick={() => setExpandido(aberto ? null : c.id)}
                      className="pj-tap w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#eeece4" }}
                    >
                      {aberto
                        ? <ChevronUp size={12} style={{ color: "#5c6b62" }} />
                        : <ChevronDown size={12} style={{ color: "#5c6b62" }} />}
                    </button>
                  </div>

                  {/* Painel expandido */}
                  {aberto && (
                    <div className="px-4 pb-4 pt-2" style={{ background: "#f6f5f0", borderTop: "1px solid #eeece4" }}>
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
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Mensal</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#14231c" }}>€{fmt(c.valor)}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "#eaf1ec", border: "1px solid #cfe0d5" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#0b6b4f" }}>Anual</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#0b6b4f" }}>€{Math.round(c.valor * 12).toLocaleString("pt-PT")}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>Por dia</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#14231c" }}>€{(c.valor / 30.44).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Histórico de pagamentos */}
                          <HistoricoPagamentos id={c.id} pagamentos={pagamentos} />

                          {/* Ações */}
                          <div className="flex gap-2 mt-3">
                            {esMesAtual && (
                              <button
                                onClick={() => togglePago(c.id)}
                                className="pj-tap flex-1 py-2 rounded-xl text-xs border transition-all"
                                style={{
                                  fontWeight: 600,
                                  borderColor: pago ? "#e4e2d8" : "#cfe0d5",
                                  background:  pago ? "#fbfaf6" : "#eaf1ec",
                                  color:       pago ? "#8a978e" : "#0b6b4f",
                                }}
                              >
                                {pago ? "Marcar como pendente" : "✓ Marcar como pago"}
                              </button>
                            )}
                            <button
                              onClick={() => setEditando(c.id)}
                              className="pj-tap px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                              style={{ fontWeight: 600, background: "#eeece4", color: "#5c6b62", border: "1px solid #e4e2d8" }}
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => removerConta(c.id)}
                              className="pj-tap px-3 py-2 rounded-xl"
                              style={{ background: "#f7ece8", color: "#b4472e", border: "1px solid #ecd9d1" }}
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
          <p className="text-[11px] uppercase mb-3 flex items-center gap-1.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "#8a978e" }}>
            <BarChart3 size={11} style={{ color: "#8a978e" }} /> Por categoria
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
            {CATS.filter(cat => contas.some(c => c.categoria === cat.id)).map((cat, cati) => {
              const totalCat = contas.filter(c => c.categoria === cat.id).reduce((s, c) => s + c.valor, 0);
              const pagosCat = contas.filter(c => c.categoria === cat.id && pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
              const pctCat   = totalMensal > 0 ? (totalCat / totalMensal) * 100 : 0;
              const nCat     = contas.filter(c => c.categoria === cat.id).length;
              const anualCat = totalCat * 12;

              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3" style={cati > 0 ? { borderTop: "1px solid #eeece4" } : undefined}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: cat.bg }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm" style={{ fontWeight: 600, color: "#14231c" }}>{cat.label}</p>
                      <div className="text-right">
                        <p className="text-sm" style={{ fontWeight: 600, color: "#14231c" }}>€{fmt(totalCat)}<span className="text-[10px]" style={{ color: "#8a978e", fontWeight: 400 }}>/mês</span></p>
                        <p className="text-[10px]" style={{ color: "#8a978e" }}>€{Math.round(anualCat).toLocaleString("pt-PT")}/ano</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#eeece4" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pctCat}%`, background: cat.cor }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: "#8a978e" }}>
                      {nCat} conta{nCat !== 1 ? "s" : ""} · {Math.round(pctCat)}% do total
                      {pagosCat > 0 && ` · €${fmt(pagosCat)} pago${pagosCat !== totalCat ? "s" : ""}`}
                    </p>
                    {(() => {
                      const op = OPORTUNIDADES.find(o => o.cats.includes(cat.id) && (!o.minMensal || contas.filter(c => c.categoria === cat.id).some(c => c.valor >= o.minMensal)));
                      if (!op) return null;
                      return (
                        <a href={op.url} target="_blank" rel="noopener noreferrer"
                          className="pj-tap mt-1 inline-flex items-center gap-1 text-[10px] no-underline"
                          style={{ fontWeight: 600, color: op.cor }}
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

/* ═══ Root — Contas fixas + Crédito Habitação, num só separador ═══ */
export default function SecaoContas() {
  const [sub, setSub] = useState("contas");
  return (
    <div>
      <SubTabBar
        value={sub}
        onChange={setSub}
        options={[
          { id: "contas", icon: CalendarDays, label: "Contas fixas" },
          { id: "casa",   icon: Building2,    label: "Crédito Habitação" },
        ]}
      />
      {sub === "contas" && <ContasFixasConteudo />}
      {sub === "casa"   && <SecaoCasaConteudo />}
    </div>
  );
}
