import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Plus, Trash2, Check, ChevronLeft, ChevronRight, ExternalLink, Pencil,
  CalendarDays, Building2, RefreshCw,
} from "lucide-react";
import { eur } from "./lib/formato";
import { Campo, BotaoPrincipal, BotaoSecundario, Chip, Nota, Erro, Folha, EstadoVazio, Cartao, ROTULO } from "./UiSimples";

// Crédito Habitação / Renda — sub-secção irmã, carregada só quando aberta
const SecaoCasaConteudo = dynamic(() => import("./SecaoCasa"), {
  loading: () => <div className="mx-4 mt-4 h-40 rounded-2xl animate-pulse" style={{ background: "var(--pj-subtle)" }} />,
});

// Eletricidade, gás, telecomunicações e seguros: renovações e fidelizações
const ContasRenovacoes = dynamic(() => import("./ContasRenovacoes"), {
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
          aria-pressed={value === o.id}
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

/*
 * Contas fixas do mês. Mesmo desenho das Renovações (UiSimples): um número
 * grande, uma lista, uma ação principal e os formulários numa folha.
 * Sem emojis nem valores "sugeridos" inventados — as sugestões só dão o nome.
 */

const CATS = [
  { id: "habitacao",  label: "Habitação",    cor: "var(--pj-cat-verde)" },
  { id: "energia",    label: "Energia",      cor: "var(--pj-cat-ocre)" },
  { id: "internet",   label: "Internet/Tel", cor: "var(--pj-cat-azul)" },
  { id: "seguro",     label: "Seguros",      cor: "var(--pj-cat-ameixa)" },
  { id: "saude",      label: "Saúde",        cor: "var(--pj-cat-rosa)" },
  { id: "transporte", label: "Transporte",   cor: "var(--pj-cat-terracota)" },
  { id: "lazer",      label: "Lazer",        cor: "var(--pj-cat-petroleo)" },
  { id: "outro",      label: "Outro",        cor: "var(--pj-cat-cinza)" },
];
const catById = Object.fromEntries(CATS.map(c => [c.id, c]));

const SUGESTOES = [
  { nome: "Renda",            cat: "habitacao" },
  { nome: "Prestação da casa", cat: "habitacao" },
  { nome: "Condomínio",       cat: "habitacao" },
  { nome: "Eletricidade",     cat: "energia" },
  { nome: "Gás",              cat: "energia" },
  { nome: "Água",             cat: "energia" },
  { nome: "Internet",         cat: "internet" },
  { nome: "Telemóvel",        cat: "internet" },
  { nome: "Seguro automóvel", cat: "seguro" },
  { nome: "Seguro de saúde",  cat: "saude" },
  { nome: "Passe",            cat: "transporte" },
  { nome: "Ginásio",          cat: "lazer" },
  { nome: "Streaming",        cat: "lazer" },
];

const MESES_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MESES_CURTOS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

const euros = v => `${eur(v, 2)} €`;
const eurosRedondo = v => `${Math.round(v).toLocaleString("pt-PT")} €`;

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

/** "Hoje", "Amanhã", "Dia 22 · daqui a 3 dias", "Dia 5 · já passou". */
function quandoVence(conta, { pago, esMesAtual, hoje }) {
  const d = conta.diaVencimento;
  if (pago || !esMesAtual) return { texto: `Dia ${d}`, tom: null };
  if (d === hoje) return { texto: "Vence hoje", tom: "danger" };
  if (d === hoje + 1) return { texto: "Vence amanhã", tom: "warn" };
  if (d > hoje && d <= hoje + 5) return { texto: `Dia ${d} · daqui a ${d - hoje} dias`, tom: "warn" };
  if (d < hoje) return { texto: `Dia ${d} · já passou`, tom: "warn" };
  return { texto: `Dia ${d}`, tom: null };
}

/* ─── Formulário ─── */
function FormConta({ inicial, onGuardar }) {
  const [nome,  setNome]  = useState(inicial?.nome || "");
  const [valor, setValor] = useState(inicial?.valor != null ? String(inicial.valor).replace(".", ",") : "");
  const [dia,   setDia]   = useState(inicial?.diaVencimento ? String(inicial.diaVencimento) : "");
  const [cat,   setCat]   = useState(inicial?.categoria || "");
  const [erro,  setErro]  = useState("");
  const formRef = useRef(null);

  function usarSugestao(s) {
    setNome(s.nome);
    setCat(s.cat);
    formRef.current?.querySelector('[data-campo="valor"]')?.focus();
  }

  function submeter(e) {
    e.preventDefault();
    const v = parseFloat(valor.replace(/\s|€/g, "").replace(",", "."));
    const d = parseInt(dia, 10);
    if (!nome.trim())                 { setErro("Escreve o nome da conta."); return; }
    if (!Number.isFinite(v) || v <= 0) { setErro("Indica quanto pagas por mês."); return; }
    if (isNaN(d) || d < 1 || d > 31) { setErro("Indica o dia do mês em que pagas (1 a 31)."); return; }
    setErro("");
    // `emoji` fica vazio: já não é mostrado e não deve ficar um antigo agarrado.
    onGuardar({ nome: nome.trim(), valor: Math.round(v * 100) / 100, diaVencimento: d, categoria: cat || "outro", emoji: "" });
  }

  return (
    <form ref={formRef} onSubmit={submeter} className="flex flex-col gap-4 pb-2" noValidate>
      {!inicial && (
        <div>
          <p style={{ ...ROTULO, marginBottom: 8 }}>Sugestões</p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map(s => (
              <Chip key={s.nome} ativo={nome === s.nome} onClick={() => usarSugestao(s)}>{s.nome}</Chip>
            ))}
          </div>
        </div>
      )}

      <Campo label="Nome" type="text" maxLength={40} placeholder="ex: Renda, NOS, Fidelidade"
        value={nome} onChange={e => setNome(e.target.value)} />

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Campo label="Valor por mês" type="text" inputMode="decimal" placeholder="0,00 €"
          value={valor} onChange={e => setValor(e.target.value)} data-campo="valor" />
        <Campo label="Dia do pagamento" type="text" inputMode="numeric" placeholder="1 a 31" maxLength={2}
          value={dia} onChange={e => setDia(e.target.value.replace(/\D/g, ""))} />
      </div>

      <div>
        <p style={{ ...ROTULO, marginBottom: 8 }}>Categoria</p>
        <div className="flex flex-wrap gap-2">
          {CATS.map(c => (
            <Chip key={c.id} ativo={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>
          ))}
        </div>
      </div>

      <Erro>{erro}</Erro>
      <BotaoPrincipal type="submit">{inicial ? "Guardar alterações" : "Guardar"}</BotaoPrincipal>
    </form>
  );
}

/* ─── Oportunidades de poupança por categoria ─── */
const OPORTUNIDADES = [
  { cats: ["energia"],   label: "Luz, gás e água",      provider: "ComparaJá",       url: "https://www.comparaja.pt/?ref=poupeja" },
  { cats: ["internet"],  label: "Internet e telemóvel", provider: "ComparaJá",       url: "https://www.comparaja.pt/?ref=poupeja" },
  { cats: ["seguro"],    label: "Seguros",              provider: "ComparaJá",       url: "https://www.comparaja.pt/?ref=poupeja" },
  { cats: ["habitacao"], label: "Crédito habitação",    provider: "Doutor Finanças", url: "https://www.doutorfinancas.pt/?ref=poupeja", minMensal: 200 },
];

/*
 * Antes mostrava "podes poupar até €X/ano" com percentagens fixas (22%, 25%…)
 * sem fonte — um valor inventado. Agora só aparece um número quando vem de
 * uma comparação real: o resultado do simulador da ERSE guardado em
 * Contas → Renovações. O resto é o convite a comparar, sem prometer valores.
 */
function calcOportunidades(contas) {
  return OPORTUNIDADES.filter(op =>
    contas.some(c => op.cats.includes(c.categoria) && (!op.minMensal || c.valor >= op.minMensal))
  );
}

function poupancaErse() {
  try {
    const ren = JSON.parse(localStorage.getItem("poupeja_renovacoes") || "[]");
    let total = 0;
    for (const c of Array.isArray(ren) ? ren : []) {
      const alt = Number(c?.resultadoErse?.valorAnual);
      const porAno = { mensal: 12, trimestral: 4, semestral: 2, anual: 1 }[c?.periodicidade] || 12;
      const atual = Number(c?.valor) * porAno;
      if (Number.isFinite(alt) && alt > 0 && Number.isFinite(atual) && atual > alt) total += atual - alt;
    }
    return Math.round(total);
  } catch { return 0; }
}

function PagarMenos({ contas, onIrRenovacoes }) {
  const ativas = calcOportunidades(contas);
  if (ativas.length === 0) return null;
  const erse = poupancaErse();
  const temEnergia = contas.some(c => c.categoria === "energia");

  return (
    <Cartao className="mt-6 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Pagar menos</p>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)", marginTop: 2 }}>
          {erse > 0
            ? <>O simulador da ERSE encontrou <strong style={{ color: "var(--pj-brand-ink)" }}>{eurosRedondo(erse)}/ano</strong> de poupança na energia.</>
            : "Compara estas contas pelo menos uma vez por ano."}
        </p>
      </div>
      {ativas.map(op => (
        <a key={op.label} href={op.url} target="_blank" rel="noopener noreferrer"
          className="press pj-tap flex items-center gap-3 px-4 no-underline"
          style={{ minHeight: 52, borderTop: "1px solid var(--pj-subtle)" }}>
          <span className="flex-1 min-w-0">
            <span className="block" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{op.label}</span>
            <span className="block" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>Comparar no {op.provider}</span>
          </span>
          <ExternalLink size={14} style={{ color: "var(--pj-text-faint)" }} aria-hidden="true" />
        </a>
      ))}
      {temEnergia && onIrRenovacoes && (
        <button onClick={onIrRenovacoes} className="press pj-tap w-full flex items-center gap-3 px-4 text-left"
          style={{ minHeight: 52, borderTop: "1px solid var(--pj-subtle)", background: "none" }}>
          <span className="flex-1" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
            Comparar a energia no simulador oficial da ERSE
          </span>
          <ChevronRight size={16} style={{ color: "var(--pj-brand-ink)" }} aria-hidden="true" />
        </button>
      )}
    </Cartao>
  );
}

/* ─── Para onde vai o dinheiro ─── */
function PorCategoria({ contas, total }) {
  const linhas = CATS
    .map(c => ({ ...c, valor: contas.filter(x => x.categoria === c.id).reduce((s, x) => s + x.valor, 0) }))
    .filter(c => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  if (linhas.length < 2 || total <= 0) return null;

  return (
    <Cartao className="mt-6 p-4">
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Para onde vai o dinheiro</p>
      <div className="flex mt-3 overflow-hidden" style={{ height: 8, borderRadius: 99, gap: 2 }} aria-hidden="true">
        {linhas.map(c => <div key={c.id} style={{ width: `${(c.valor / total) * 100}%`, background: c.cor }} />)}
      </div>
      <ul className="mt-3 flex flex-col">
        {linhas.map(c => (
          <li key={c.id} className="flex items-center gap-2.5" style={{ minHeight: 34, fontSize: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: c.cor, flexShrink: 0 }} aria-hidden="true" />
            <span className="flex-1" style={{ color: "var(--pj-text)" }}>{c.label}</span>
            <span style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{Math.round((c.valor / total) * 100)}%</span>
            <span style={{ fontWeight: 600, color: "var(--pj-text)", minWidth: 76, textAlign: "right" }}>{euros(c.valor)}</span>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

/* ─── Linha da lista ─── */
function LinhaConta({ conta, pago, podeMarcar, vence, onMarcar, onAbrir }) {
  const corVence = vence.tom === "danger" ? "var(--pj-danger)" : vence.tom === "warn" ? "var(--pj-warn)" : "var(--pj-text-muted)";
  const cat = catById[conta.categoria] || catById.outro;
  return (
    <div className="flex items-center" style={{ minHeight: 64, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <button
        type="button"
        onClick={onMarcar}
        disabled={!podeMarcar}
        aria-pressed={pago}
        aria-label={pago ? `${conta.nome}: marcar como por pagar` : `${conta.nome}: marcar como paga`}
        className="pj-tap press flex items-center justify-center flex-shrink-0"
        style={{ width: 52, alignSelf: "stretch", background: "none", border: 0 }}
      >
        <span className="flex items-center justify-center" style={{
          width: 24, height: 24, borderRadius: 99,
          border: pago ? "none" : "2px solid var(--pj-text-faint)",
          background: pago ? "var(--pj-brand)" : "transparent",
        }}>
          {pago && <Check size={14} strokeWidth={3} color="#fff" />}
        </span>
      </button>
      <button type="button" onClick={onAbrir} className="press pj-tap flex-1 min-w-0 flex items-center gap-3 text-left"
        style={{ alignSelf: "stretch", padding: "10px 14px 10px 0", background: "none", border: 0 }}>
        <span className="flex-1 min-w-0">
          <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: pago ? "var(--pj-text-muted)" : "var(--pj-text)" }}>
            {conta.nome}
          </span>
          <span className="block truncate" style={{ fontSize: 12, color: corVence, fontWeight: vence.tom ? 600 : 400 }}>
            {vence.texto}<span style={{ color: "var(--pj-text-faint)", fontWeight: 400 }}> · {cat.label}</span>
          </span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: pago ? "var(--pj-text-muted)" : "var(--pj-text)", whiteSpace: "nowrap" }}>
          {euros(conta.valor)}
        </span>
      </button>
    </div>
  );
}

/* ─── Detalhe ─── */
function Detalhe({ conta, pagamentos, pago, podeMarcar, onMarcar, onEditar, onApagar }) {
  const cat = catById[conta.categoria] || catById.outro;
  const meses = Array.from({ length: 6 }, (_, i) => {
    const k = mesChave(i - 5);
    return { k, pago: !!pagamentos[k]?.[conta.id], label: MESES_CURTOS[parseInt(k.split("-")[1], 10) - 1] };
  });
  const op = OPORTUNIDADES.find(o => o.cats.includes(conta.categoria) && (!o.minMensal || conta.valor >= o.minMensal));

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div>
        <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
          {euros(conta.valor)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
        </p>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4 }}>
          {eurosRedondo(conta.valor * 12)} por ano · paga-se ao dia {conta.diaVencimento} · {cat.label}
        </p>
      </div>

      {podeMarcar && (
        pago
          ? <BotaoSecundario onClick={onMarcar} className="w-full" style={{ minHeight: 52 }}>Paga este mês · desfazer</BotaoSecundario>
          : <BotaoPrincipal onClick={onMarcar}><Check size={18} /> Marcar como paga</BotaoPrincipal>
      )}

      <div>
        <p style={{ ...ROTULO, marginBottom: 8 }}>Últimos 6 meses</p>
        <div className="grid grid-cols-6 gap-1.5">
          {meses.map(m => (
            <div key={m.k} className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center" title={m.pago ? "Paga" : "Por marcar"}
                style={{ width: "100%", height: 32, borderRadius: 10, background: m.pago ? "var(--pj-brand)" : "var(--pj-subtle)" }}>
                {m.pago && <Check size={14} strokeWidth={3} color="#fff" />}
              </div>
              <span style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {op && (
        <a href={op.url} target="_blank" rel="noopener noreferrer" className="press pj-tap flex items-center gap-3 no-underline"
          style={{ minHeight: 52, padding: "0 16px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <span className="flex-1" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Comparar preços no {op.provider}</span>
          <ExternalLink size={14} style={{ color: "var(--pj-text-faint)" }} aria-hidden="true" />
        </a>
      )}

      <div className="flex gap-2">
        <BotaoSecundario onClick={onEditar} className="flex-1"><Pencil size={14} /> Editar</BotaoSecundario>
        <BotaoSecundario onClick={onApagar} aria-label="Apagar" style={{ color: "var(--pj-danger)", background: "var(--pj-danger-wash)" }}><Trash2 size={15} /></BotaoSecundario>
      </div>
    </div>
  );
}

/* ─── Ecrã ─── */
function ContasFixasConteudo({ onIrRenovacoes }) {
  const [contas, setContas]         = useState([]);
  const [pagamentos, setPagamentos] = useState({});
  const [mesOff, setMesOff]         = useState(0);
  const [folha, setFolha]           = useState(null); // { modo: "nova" | "ver" | "editar", id? }

  const hoje       = new Date().getDate();
  const esMesAtual = mesOff === 0;
  const mes        = mesChave(mesOff);

  const carregar = useCallback(() => {
    setContas(lerContas());
    setPagamentos(lerPagamentos());
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const pagosMes      = pagamentos[mes] || {};
  const totalMensal   = contas.reduce((s, c) => s + c.valor, 0);
  const totalPago     = contas.filter(c => pagosMes[c.id]).reduce((s, c) => s + c.valor, 0);
  const totalPendente = totalMensal - totalPago;
  const pct           = totalMensal > 0 ? (totalPago / totalMensal) * 100 : 0;
  const porDia        = (a, b) => a.diaVencimento - b.diaVencimento;
  const porPagar      = contas.filter(c => !pagosMes[c.id]).sort(porDia);
  const pagas         = contas.filter(c => pagosMes[c.id]).sort(porDia);
  const atual         = folha?.id ? contas.find(c => c.id === folha.id) : null;

  function gravarContas(lista) {
    setContas(lista);
    guardarContas(lista);
  }

  function togglePago(id) {
    if (!esMesAtual) return;
    const novos = { ...pagamentos, [mes]: { ...(pagamentos[mes] || {}) } };
    if (novos[mes][id]) delete novos[mes][id]; else novos[mes][id] = true;
    setPagamentos(novos);
    guardarPagamentos(novos);
  }

  function adicionar(dados) {
    gravarContas([...contas, { id: novoId(), ...dados }]);
    setFolha(null);
  }

  function apagar(id) {
    if (!window.confirm("Apagar esta conta?")) return;
    gravarContas(contas.filter(c => c.id !== id));
    setFolha(null);
  }

  const linha = c => (
    <LinhaConta
      key={c.id}
      conta={c}
      pago={!!pagosMes[c.id]}
      podeMarcar={esMesAtual}
      vence={quandoVence(c, { pago: !!pagosMes[c.id], esMesAtual, hoje })}
      onMarcar={() => togglePago(c.id)}
      onAbrir={() => setFolha({ modo: "ver", id: c.id })}
    />
  );

  return (
    <div className="pb-28 pt-3 px-4">
      {contas.length > 0 && (
        <div className="mb-5 anim-up">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>
              {esMesAtual ? "Por mês pagas" : `Em ${mesNomeCompleto(mesOff)}`}
            </p>
            <div className="flex items-center" style={{ marginRight: -8 }}>
              <button onClick={() => setMesOff(o => o - 1)} aria-label="Mês anterior" className="press pj-tap flex items-center justify-center"
                style={{ width: 40, height: 40, background: "none", border: 0 }}>
                <ChevronLeft size={18} style={{ color: "var(--pj-text-muted)" }} />
              </button>
              <span className="capitalize text-center" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text)", minWidth: 72 }}>
                {mesNomeCompleto(mesOff)}
              </span>
              <button onClick={() => setMesOff(o => Math.min(0, o + 1))} aria-label="Mês seguinte" disabled={esMesAtual}
                className="press pj-tap flex items-center justify-center"
                style={{ width: 40, height: 40, background: "none", border: 0, opacity: esMesAtual ? 0.3 : 1 }}>
                <ChevronRight size={18} style={{ color: "var(--pj-text-muted)" }} />
              </button>
            </div>
          </div>
          <p className="font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
            {euros(totalMensal)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
          </p>
          <div className="mt-3 overflow-hidden" style={{ height: 6, borderRadius: 99, background: "var(--pj-subtle)" }}
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Pago este mês">
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "var(--pj-brand)", transition: "width .5s ease" }} />
          </div>
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 8 }}>
            {totalPendente > 0.004
              ? <>Falta pagar <strong style={{ color: "var(--pj-text)" }}>{euros(totalPendente)}</strong> · {pagas.length} de {contas.length} pagas</>
              : <strong style={{ color: "var(--pj-brand-ink)" }}>Tudo pago{esMesAtual ? " este mês" : ""}</strong>}
          </p>
        </div>
      )}

      {contas.length === 0 ? (
        <Cartao className="anim-up">
          <EstadoVazio Icone={CalendarDays} titulo="As tuas contas do mês"
            texto="Regista a renda, a luz, a internet e o resto do que pagas todos os meses. Vês o total e o que ainda falta pagar — e marcas cada conta quando a pagares." />
        </Cartao>
      ) : (
        <div className="flex flex-col gap-2 anim-up anim-up-1">
          {porPagar.length > 0 && pagas.length > 0 && <p style={{ ...ROTULO, margin: "0 0 2px" }}>Por pagar</p>}
          {porPagar.map(linha)}
          {pagas.length > 0 && <p style={{ ...ROTULO, margin: porPagar.length ? "12px 0 2px" : "0 0 2px" }}>Pagas</p>}
          {pagas.map(linha)}
        </div>
      )}

      <BotaoPrincipal className="mt-5" onClick={() => setFolha({ modo: "nova" })}>
        <Plus size={18} /> Adicionar conta
      </BotaoPrincipal>

      <PorCategoria contas={contas} total={totalMensal} />
      <PagarMenos contas={contas} onIrRenovacoes={onIrRenovacoes} />

      {contas.length > 0 && (
        <Nota className="mt-6 text-center">
          Toca no círculo para marcar uma conta como paga. No início de cada mês começam todas por pagar.
        </Nota>
      )}

      {folha?.modo === "nova" && (
        <Folha titulo="Nova conta" onFechar={() => setFolha(null)}>
          <FormConta onGuardar={adicionar} />
        </Folha>
      )}
      {folha?.modo === "ver" && atual && (
        <Folha titulo={atual.nome} onFechar={() => setFolha(null)}>
          <Detalhe
            conta={atual}
            pagamentos={pagamentos}
            pago={!!pagosMes[atual.id]}
            podeMarcar={esMesAtual}
            onMarcar={() => togglePago(atual.id)}
            onEditar={() => setFolha({ modo: "editar", id: atual.id })}
            onApagar={() => apagar(atual.id)}
          />
        </Folha>
      )}
      {folha?.modo === "editar" && atual && (
        <Folha titulo="Editar conta" onFechar={() => setFolha({ modo: "ver", id: atual.id })}>
          <FormConta inicial={atual} onGuardar={d => { gravarContas(contas.map(c => c.id === atual.id ? { ...c, ...d } : c)); setFolha({ modo: "ver", id: atual.id }); }} />
        </Folha>
      )}
    </div>
  );
}

/* ═══ Root — Contas fixas, Renovações e Crédito Habitação, num só separador ═══ */
export default function SecaoContas({ inicioAba = "contas" }) {
  const [sub, setSub] = useState(inicioAba);
  return (
    <div>
      <SubTabBar
        value={sub}
        onChange={setSub}
        options={[
          { id: "contas",     icon: CalendarDays, label: "Mensais" },
          { id: "renovacoes", icon: RefreshCw,    label: "Renovações" },
          { id: "casa",       icon: Building2,    label: "Crédito" },
        ]}
      />
      {sub === "contas" && <ContasFixasConteudo onIrRenovacoes={() => setSub("renovacoes")} />}
      {sub === "renovacoes" && <ContasRenovacoes />}
      {sub === "casa"   && <SecaoCasaConteudo />}
    </div>
  );
}
