import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  Circle, X, AlertCircle, ChevronLeft, ChevronRight,
  TrendingDown, BarChart3, CalendarDays, Pencil, Check,
  SlidersHorizontal, ExternalLink, Flame, Building2,
  Home, Zap, Wifi, ShieldCheck, Pill, Car, Gamepad2, FileText,
} from "lucide-react";

// Crédito Habitação / Renda — sub-secção irmã, carregada só quando aberta
const SecaoCasaConteudo = dynamic(() => import("./SecaoCasa"), {
  loading: () => <div className="mx-4 mt-4 h-40 rounded-2xl animate-pulse" style={{ background: "var(--pj-subtle)" }} />,
});

// Sub-navegação (mesmo padrão da secção Mobilidade: Contas / Casa)
function SubTabBar({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl mx-4 mt-4 mb-2" style={{ background: "var(--pj-subtle)" }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`pj-tap press flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            value === o.id ? "shadow-sm" : ""
          }`}
          style={value === o.id ? { background: "var(--pj-card)", color: "var(--pj-text)" } : { color: "var(--pj-text-faint)" }}
        >
          <o.icon size={13} /> {o.label}
        </button>
      ))}
    </div>
  );
}

const CATS = [
  { id: "habitacao", Icone: Home,  emoji: "🏠", label: "Habitação",   cor: "var(--pj-cat-verde)", bg: "var(--pj-subtle)" },
  { id: "energia", Icone: Zap,    emoji: "⚡", label: "Energia",      cor: "var(--pj-cat-ocre)", bg: "var(--pj-subtle)" },
  { id: "internet", Icone: Wifi,   emoji: "📱", label: "Internet/Tel", cor: "var(--pj-cat-azul)", bg: "var(--pj-subtle)" },
  { id: "seguro", Icone: ShieldCheck,     emoji: "🛡️", label: "Seguros",      cor: "var(--pj-cat-ameixa)", bg: "var(--pj-subtle)" },
  { id: "saude", Icone: Pill,      emoji: "💊", label: "Saúde",        cor: "var(--pj-cat-rosa)", bg: "var(--pj-subtle)" },
  { id: "transporte", Icone: Car, emoji: "🚗", label: "Transporte",   cor: "var(--pj-cat-terracota)", bg: "var(--pj-subtle)" },
  { id: "lazer", Icone: Gamepad2,      emoji: "🎮", label: "Lazer",        cor: "var(--pj-cat-ameixa)", bg: "var(--pj-subtle)" },
  { id: "outro", Icone: FileText,      emoji: "📋", label: "Outro",        cor: "var(--pj-cat-cinza)", bg: "var(--pj-subtle)" },
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--pj-border)" }} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        style={{ stroke: pct >= 100 ? "var(--pj-brand-ink)" : "var(--pj-text-strong)" }}
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
      <span className="text-[10px]" style={{ color: "var(--pj-text-faint)", fontWeight: 600 }}>Histórico:</span>
      <div className="flex items-center gap-1.5">
        {meses.map(m => (
          <div key={m.k} className="flex flex-col items-center gap-0.5">
            <div
              className="w-5 h-5 rounded-full transition-colors flex items-center justify-center text-[9px]"
              style={{ background: m.pago ? "var(--pj-brand)" : "var(--pj-subtle)", color: m.pago ? "#fff" : "transparent" }}
              title={m.pago ? "Pago" : "Pendente"}
            >
              {m.pago ? "✓" : ""}
            </div>
            <span className="text-[8px] leading-none" style={{ color: "var(--pj-text-faint)" }}>{m.label}</span>
          </div>
        ))}
      </div>
      {streak >= 2 && (
        <span className="ml-1 flex items-center gap-0.5 text-[10px]" style={{ fontWeight: 700, color: "var(--pj-brand-ink)" }}>
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
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Sugestões rápidas</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.nome}
                type="button"
                onClick={() => usarPreset(p)}
                className="press pj-tap px-2.5 py-1.5 rounded-xl text-[11px]"
                style={{ fontWeight: 600, border: "1px solid var(--pj-border)", background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}
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
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Nome da conta</label>
          {!inicial && (
            <button type="button" onClick={() => setMostrarPresets(v => !v)} className="text-[10px]" style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>
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
          style={{ border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }}
        />
      </div>

      {/* Valor + Dia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Valor (€)</label>
          <input
            type="text" inputMode="decimal" value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Dia do mês</label>
          <input
            type="number" inputMode="numeric" min={1} max={31} value={dia}
            onChange={e => setDia(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }}
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Categoria</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {CATS.map(c => (
            <button
              key={c.id} type="button" onClick={() => setCat(c.id)}
              className="pj-tap flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
              style={{ borderColor: cat === c.id ? c.cor : "var(--pj-border)", background: cat === c.id ? c.bg : "var(--pj-card)" }}
            >
              <c.Icone size={19} strokeWidth={1.8} style={{ color: cat === c.id ? c.cor : "var(--pj-text-muted)" }} />
              <span className="text-[9px] leading-tight text-center" style={{ fontWeight: 600, color: cat === c.id ? c.cor : "var(--pj-text-faint)" }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p className="text-xs flex items-center gap-1.5" style={{ fontWeight: 600, color: "var(--pj-danger)" }}>
          <AlertCircle size={12} /> {erro}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="pj-tap flex-1 py-2.5 rounded-xl text-white text-sm"
          style={{ fontWeight: 600, background: "var(--pj-brand)" }}
        >
          {inicial ? "Guardar alterações" : "Adicionar conta"}
        </button>
        <button type="button" onClick={onCancelar} className="pj-tap px-4 py-2.5 rounded-xl text-sm" style={{ fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}>
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
    cor: "var(--pj-cat-ocre)",
    bg: "var(--pj-subtle)",
  },
  {
    cats: ["internet"],
    label: "Internet e telemóvel",
    emoji: "🌐",
    pct: 0.25,
    minAnual: 60,
    provider: "ComparaJá",
    url: "https://www.comparaja.pt/?ref=poupeja",
    cor: "var(--pj-cat-azul)",
    bg: "var(--pj-subtle)",
  },
  {
    cats: ["seguro"],
    label: "Seguros",
    emoji: "🛡️",
    pct: 0.20,
    minAnual: 80,
    provider: "ComparaJá",
    url: "https://www.comparaja.pt/?ref=poupeja",
    cor: "var(--pj-cat-ameixa)",
    bg: "var(--pj-subtle)",
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
    cor: "var(--pj-cat-verde)",
    bg: "var(--pj-subtle)",
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
        style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
      >
        {/* Cabeçalho */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: "var(--pj-subtle)" }}>
            💡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Poupança potencial</p>
            <p className="font-display leading-tight mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "var(--pj-text)" }}>
              Podes poupar até{" "}
              <span style={{ color: "var(--pj-brand-ink)" }}>€{totalEconomia.toLocaleString("pt-PT")}/ano</span>
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>Com base nas categorias que tens registadas</p>
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
              style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: op.bg }}
                >
                  {op.emoji}
                </div>
                <div>
                  <p className="text-[12px]" style={{ fontWeight: 600, color: "var(--pj-text)" }}>{op.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--pj-text-faint)" }}>via {op.provider} — grátis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[12px]" style={{ fontWeight: 600, color: op.cor }}>
                  até €{op.economia}/ano
                </span>
                <ExternalLink size={11} style={{ color: "var(--pj-text-faint)" }} />
              </div>
            </a>
          ))}
        </div>

        <p className="text-[10px] text-center pb-3" style={{ color: "var(--pj-text-faint)" }}>Comparação gratuita e sem compromisso</p>
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
          style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
        >

          {/* Navegação de mês */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <button onClick={() => setMesOff(o => o - 1)} className="press pj-tap w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
              <ChevronLeft size={16} style={{ color: "var(--pj-text-strong)" }} />
            </button>
            <p className="text-[11px] uppercase capitalize" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>{mesLabel}</p>
            <button
              onClick={() => setMesOff(o => Math.min(0, o + 1))}
              className={`press pj-tap w-8 h-8 rounded-xl flex items-center justify-center ${mesOff === 0 ? "opacity-30 pointer-events-none" : ""}`}
              style={{ background: "var(--pj-subtle)" }}
            >
              <ChevronRight size={16} style={{ color: "var(--pj-text-strong)" }} />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Anel de progresso */}
            {totalMensal > 0 && (
              <div className="relative flex-shrink-0">
                <AnelProgresso pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display leading-none" style={{ fontSize: "24px", fontWeight: 600, color: "var(--pj-text)" }}>{pct}%</span>
                  <span className="text-[9px] uppercase mt-0.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>pago</span>
                </div>
              </div>
            )}

            {/* Valores */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase mb-0.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Total mensal</p>
              <p className="font-display leading-none" style={{ fontSize: "34px", fontWeight: 600, color: "var(--pj-text)" }}>
                €{fmt(totalMensal)}
              </p>
              {contas.length > 0 ? (
                <>
                  {/* Contexto anual e diário */}
                  <p className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--pj-text-faint)" }}>
                    <span style={{ fontWeight: 600, color: "var(--pj-text-muted)" }}>€{Math.round(totalAnual).toLocaleString("pt-PT")}/ano</span>
                    <span style={{ color: "#c4c0b2" }}>·</span>
                    <span>€{totalDiario.toFixed(2)}/dia</span>
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--pj-text-muted)" }}>
                    {nPagas}/{contas.length} conta{contas.length !== 1 ? "s" : ""} pagas
                    {totalPendente > 0 && (
                      <> · Pendente: <span style={{ fontWeight: 600, color: "var(--pj-text)" }}>€{fmt(totalPendente)}</span></>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-[12px] mt-1.5" style={{ color: "var(--pj-text-muted)" }}>Sem contas adicionadas</p>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          {totalMensal > 0 && (
            <div className="mt-4 relative z-10">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pj-subtle)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: "var(--pj-brand)" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "var(--pj-text-faint)" }}>€{fmt(totalPago)} pago</span>
                <span className="text-[10px]" style={{ color: "var(--pj-text-faint)" }}>€{fmt(totalPendente)} pendente</span>
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
            <div className="rounded-2xl p-3.5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Mensal</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "var(--pj-text)" }}>€{Math.round(totalMensal).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>{contas.length} conta{contas.length !== 1 ? "s" : ""} fixas</p>
            </div>

            {/* Anual */}
            <div className="rounded-2xl p-3.5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Anual</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: "var(--pj-text)" }}>€{Math.round(totalAnual).toLocaleString("pt-PT")}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>€{totalDiario.toFixed(2)}/dia</p>
            </div>

            {/* Pagas este mês */}
            <div className="rounded-2xl p-3.5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Pagas</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: pct === 100 ? "var(--pj-brand-ink)" : pct > 0 ? "var(--pj-text)" : "var(--pj-text-faint)" }}>
                {nPagas}/{contas.length}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>
                {pct === 100 ? "Tudo pago! 🎉" : `€${fmt(totalPago)} pago`}
              </p>
            </div>

            {/* Pendente */}
            <div className="rounded-2xl p-3.5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Pendente</p>
              <p className="font-display mt-0.5" style={{ fontSize: "19px", fontWeight: 600, color: totalPendente > 0 ? "var(--pj-danger)" : "var(--pj-brand-ink)" }}>
                €{Math.round(totalPendente).toLocaleString("pt-PT")}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>
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
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3 mb-2" style={{ border: "1px solid var(--pj-danger-border)", background: "var(--pj-danger-wash)" }}>
              <AlertCircle size={15} style={{ color: "var(--pj-danger)" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--pj-danger-strong)" }}>Vence hoje!</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--pj-danger)" }}>
                  {aVencerHoje.map(c => `${c.emoji || catById[c.categoria]?.emoji || "📋"} ${c.nome} — €${fmt(c.valor)}`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {aVencerBreve.length > 0 && (
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ border: "1px solid var(--pj-warn-border)", background: "var(--pj-warn-wash)" }}>
              <AlertCircle size={15} style={{ color: "var(--pj-warn)" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--pj-warn)" }}>A vencer em breve</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--pj-warn)" }}>
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
          <div className="rounded-2xl p-5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display" style={{ fontSize: "19px", fontWeight: 600, color: "var(--pj-text)" }}>Nova conta fixa</p>
              <button onClick={() => setMostrarForm(false)} className="pj-tap w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--pj-subtle)" }}>
                <X size={14} style={{ color: "var(--pj-text-muted)" }} />
              </button>
            </div>
            <FormConta onGuardar={adicionarConta} onCancelar={() => setMostrarForm(false)} />
          </div>
        </div>
      )}

      {/* ── Cabeçalho da lista ── */}
      <div className="px-4 mb-3 flex items-center justify-between anim-up anim-up-1">
        <p className="text-[11px] uppercase flex items-center gap-1.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
          <CalendarDays size={11} style={{ color: "var(--pj-text-faint)" }} /> As minhas contas
        </p>
        <div className="flex items-center gap-2">
          {/* Ordenação */}
          <div className="relative">
            <button
              onClick={() => setMostrarOrdenacao(v => !v)}
              className="press pj-tap w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "var(--pj-subtle)" }}
            >
              <SlidersHorizontal size={13} style={{ color: "var(--pj-text-strong)" }} />
            </button>
            {mostrarOrdenacao && (
              <div className="absolute right-0 top-9 z-50 rounded-2xl p-2 min-w-[180px]" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 8px 24px -12px rgba(20,35,28,0.25)" }}>
                {Object.entries(LABELS_ORD).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setOrdenacao(k); setMostrarOrdenacao(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs"
                    style={{ fontWeight: 600, background: ordenacao === k ? "var(--pj-subtle)" : "transparent", color: ordenacao === k ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}
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
              style={{ fontWeight: 600, background: todasPagas ? "var(--pj-subtle)" : "var(--pj-brand-wash)", color: todasPagas ? "var(--pj-text-muted)" : "var(--pj-brand-ink)" }}
            >
              {todasPagas ? "Desmarcar todas" : "✓ Marcar todas"}
            </button>
          )}
          {/* Adicionar */}
          {!mostrarForm && (
            <button
              onClick={() => { setMostrarForm(true); setEditando(null); }}
              className="press pj-tap inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-brand-wash)" }}
            >
              <Plus size={13} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── Lista ── */}
      {contas.length === 0 ? (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--pj-subtle)" }}>
              <TrendingDown size={28} style={{ color: "var(--pj-brand-ink)" }} />
            </div>
            <p className="font-display" style={{ fontSize: "19px", fontWeight: 600, color: "var(--pj-text)" }}>Começa a controlar as tuas despesas</p>
            <p className="text-[12px] mt-1 leading-relaxed max-w-xs" style={{ color: "var(--pj-text-muted)" }}>
              Adiciona as tuas contas mensais fixas — renda, luz, água, internet — e sabe sempre quanto te falta pagar e quando.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {["🔑 Renda", "💡 Luz", "💧 Água", "🌐 Net"].map(t => (
                <span key={t} className="px-2.5 py-1 text-[10px] rounded-lg" style={{ fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}>{t}</span>
              ))}
            </div>
            <button
              onClick={() => setMostrarForm(true)}
              className="press pj-tap mt-5 px-5 py-2.5 rounded-xl text-white text-xs"
              style={{ fontWeight: 600, background: "var(--pj-brand)" }}
            >
              <Plus size={13} className="inline mr-1" /> Adicionar primeira conta
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 mb-4 anim-up anim-up-1">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            {contasOrdenadas.map((c, ci) => {
              const cat      = catById[c.categoria] || catById.outro;
              // O emoji que a pessoa escolheu para a conta manda — é identidade
              // dela. Sem ele, mostramos o ícone de linha da categoria (o
              // emoji da categoria era o antigo fallback, e destoava agora).
              const emojiProprio = c.emoji;
              const pago     = !!pagosMes[c.id];
              const aberto   = expandido === c.id;
              const emEdicao = editando === c.id;
              const venceHoje  = esMesAtual && !pago && c.diaVencimento === hoje;
              const venceBreve = esMesAtual && !pago && c.diaVencimento > hoje && c.diaVencimento <= hoje + 5;

              return (
                <div key={c.id} style={ci > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : undefined}>
                  {/* Linha principal */}
                  <div
                    className={`flex items-center gap-3 pr-3 py-3.5 transition-colors ${pago ? "opacity-60" : ""}`}
                    style={{ paddingLeft: 0 }}
                  >
                    {/* Barra lateral colorida */}
                    <div
                      className="w-1 self-stretch rounded-r-full flex-shrink-0"
                      style={{ background: pago ? "var(--pj-border)" : cat.cor, minWidth: 4 }}
                    />

                    {/* Toggle pago */}
                    <button onClick={() => esMesAtual && togglePago(c.id)} className={`pj-tap flex-shrink-0 ${!esMesAtual ? "pointer-events-none" : ""}`}>
                      {pago
                        ? <CheckCircle2 size={22} style={{ color: "var(--pj-brand-ink)" }} />
                        : <Circle size={22} style={{ color: "#c4c0b2" }} />}
                    </button>

                    {/* Ícone */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base leading-none"
                      style={{ background: cat.bg }}
                    >
                      {emojiProprio
                        ? emojiProprio
                        : <cat.Icone size={17} strokeWidth={1.8} style={{ color: cat.cor }} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight" style={{ fontWeight: 600, textDecoration: pago ? "line-through" : "none", color: pago ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                        {c.nome}
                      </p>
                      <p className="text-[10px] mt-0.5 flex items-center gap-1 flex-wrap">
                        {venceHoje  && <span style={{ fontWeight: 600, color: "var(--pj-danger)" }}>Vence hoje!</span>}
                        {venceBreve && <span style={{ fontWeight: 600, color: "var(--pj-warn)" }}>Dia {c.diaVencimento}</span>}
                        {!venceHoje && !venceBreve && <span style={{ color: "var(--pj-text-faint)" }}>Dia {c.diaVencimento}</span>}
                        <span style={{ color: "#c4c0b2" }}>·</span>
                        <span style={{ color: cat.cor, fontWeight: 600 }}>{cat.label}</span>
                      </p>
                    </div>

                    {/* Valor */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[13px]" style={{ fontWeight: 600, color: pago ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                        €{fmt(c.valor)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>
                        €{Math.round(c.valor * 12).toLocaleString("pt-PT")}/ano
                      </p>
                    </div>

                    {/* Expandir */}
                    <button
                      onClick={() => setExpandido(aberto ? null : c.id)}
                      className="pj-tap w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--pj-subtle)" }}
                    >
                      {aberto
                        ? <ChevronUp size={12} style={{ color: "var(--pj-text-muted)" }} />
                        : <ChevronDown size={12} style={{ color: "var(--pj-text-muted)" }} />}
                    </button>
                  </div>

                  {/* Painel expandido */}
                  {aberto && (
                    <div className="px-4 pb-4 pt-2" style={{ background: "var(--pj-surface)", borderTop: "1px solid var(--pj-subtle)" }}>
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
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Mensal</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "var(--pj-text)" }}>€{fmt(c.valor)}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--pj-brand-wash)", border: "1px solid #cfe0d5" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-brand-ink)" }}>Anual</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>€{Math.round(c.valor * 12).toLocaleString("pt-PT")}</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                              <p className="text-[9px] uppercase" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Por dia</p>
                              <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "var(--pj-text)" }}>€{(c.valor / 30.44).toFixed(2)}</p>
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
                                  borderColor: pago ? "var(--pj-border)" : "#cfe0d5",
                                  background:  pago ? "var(--pj-card)" : "var(--pj-brand-wash)",
                                  color:       pago ? "var(--pj-text-faint)" : "var(--pj-brand-ink)",
                                }}
                              >
                                {pago ? "Marcar como pendente" : "✓ Marcar como pago"}
                              </button>
                            )}
                            <button
                              onClick={() => setEditando(c.id)}
                              className="pj-tap px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                              style={{ fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-muted)", border: "1px solid var(--pj-border)" }}
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => removerConta(c.id)}
                              className="pj-tap px-3 py-2 rounded-xl"
                              style={{ background: "var(--pj-danger-wash)", color: "var(--pj-danger)", border: "1px solid var(--pj-danger-border)" }}
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
          <p className="text-[11px] uppercase mb-3 flex items-center gap-1.5" style={{ fontWeight: 600, letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
            <BarChart3 size={11} style={{ color: "var(--pj-text-faint)" }} /> Por categoria
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            {CATS.filter(cat => contas.some(c => c.categoria === cat.id)).map((cat, cati) => {
              const totalCat = contas.filter(c => c.categoria === cat.id).reduce((s, c) => s + c.valor, 0);
              const pagosCat = contas.filter(c => c.categoria === cat.id && pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
              const pctCat   = totalMensal > 0 ? (totalCat / totalMensal) * 100 : 0;
              const nCat     = contas.filter(c => c.categoria === cat.id).length;
              const anualCat = totalCat * 12;

              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3" style={cati > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : undefined}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.bg }}>
                    <cat.Icone size={17} strokeWidth={1.8} style={{ color: cat.cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm" style={{ fontWeight: 600, color: "var(--pj-text)" }}>{cat.label}</p>
                      <div className="text-right">
                        <p className="text-sm" style={{ fontWeight: 600, color: "var(--pj-text)" }}>€{fmt(totalCat)}<span className="text-[10px]" style={{ color: "var(--pj-text-faint)", fontWeight: 400 }}>/mês</span></p>
                        <p className="text-[10px]" style={{ color: "var(--pj-text-faint)" }}>€{Math.round(anualCat).toLocaleString("pt-PT")}/ano</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pj-subtle)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pctCat}%`, background: cat.cor }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>
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
