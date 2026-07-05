import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, TrendingUp, TrendingDown, Calendar, X, Home, Wallet, ChevronRight } from "lucide-react";

const EURIBOR_REF = { "3M": -0.568, "6M": -0.543, "12M": -0.477 };

const COEF_RENDAS = { 2023: 5.43, 2024: 2.16, 2025: 2.77 };
const CHAVE = "poupeja_casa";

// --- Editorial flat design tokens ---
const C = {
  bg: "#f6f5f0",
  text: "#14231c",
  muted: "#5c6b62",
  faint: "#8a978e",
  green: "#0b6b4f",
  chip: "#eeece4",
  divSection: "#e4e2d8",
  divRow: "#eeece4",
  card: "#fbfaf6",
  neg: "#a8432f",
};
const LBL = { fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.faint, textTransform: "uppercase" };
const LBL_SM = { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: C.faint, textTransform: "uppercase" };
const CARD = { background: C.card, border: `1px solid ${C.divSection}` };
const INPUT_STYLE = { padding: "10px 12px", border: `1px solid ${C.divSection}`, background: "#ffffff", color: C.text, accentColor: C.green };

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch { return {}; }
}
function guardarLocal(d) {
  try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch {}
}

// Contas fixas — fonte única de dados, partilhada com o separador "Contas"
// (poupeja_contas). Aqui só lemos para mostrar o total; a gestão (adicionar/
// editar/remover) vive só lá, para não haver duas listas dessincronizadas.
function lerContasReais() {
  try { return JSON.parse(localStorage.getItem("poupeja_contas") || "[]"); } catch { return []; }
}

function calcPMT(capital, spreadPct, euriborPct, prazoAnos) {
  const r = (spreadPct + Math.max(euriborPct, 0)) / 100 / 12;
  const n = Math.round(prazoAnos * 12);
  if (n <= 0) return 0;
  if (r <= 0) return capital / n;
  return capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function fmtEur(v) {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function diasAte(anoMes) {
  if (!anoMes) return null;
  const [a, m] = anoMes.split("-").map(Number);
  return Math.round((new Date(a, m - 1, 1) - new Date()) / 86400000);
}

function mesLabel(anoMes) {
  if (!anoMes) return "—";
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const [a, m] = anoMes.split("-").map(Number);
  return `${meses[m - 1]} ${a}`;
}

function proximoMesRevisaoRenda(mesRevisao) {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  if (hoje.getMonth() + 1 >= mesRevisao) ano++;
  return `${ano}-${String(mesRevisao).padStart(2, "0")}`;
}

function Modal({ titulo, onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,35,28,0.35)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto" style={{ background: C.bg }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: C.text }}>{titulo}</h3>
          <button onClick={onFechar} className="pj-tap press w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.chip }}>
            <X size={16} style={{ color: C.muted }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block mb-1.5" style={LBL_SM}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl text-sm font-medium outline-none";

function BlocoEuribor({ euribor, carregando }) {
  if (carregando) return (
    <div className="mx-4 mb-4 rounded-2xl p-4 animate-pulse" style={CARD}>
      <div className="h-3 w-24 rounded mb-3" style={{ background: C.chip }} />
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: C.chip }} />)}
      </div>
    </div>
  );
  if (!euribor) return null;
  return (
    <div className="mx-4 mb-4 rounded-2xl p-4" style={CARD}>
      <p className="mb-3" style={LBL}>Euribor hoje</p>
      <div className="grid grid-cols-3 gap-2">
        {["3M","6M","12M"].map(p => {
          const d = euribor[p];
          if (!d) return null;
          const subiu = d.valor > EURIBOR_REF[p];
          return (
            <div key={p} className="rounded-xl p-2.5 text-center" style={{ background: C.chip }}>
              <p style={{ ...LBL_SM, fontSize: 10 }}>{p}</p>
              <p className="font-display mt-0.5" style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{d.valor.toFixed(3)}%</p>
              <div className="flex items-center justify-center gap-0.5 mt-1" style={{ color: subiu ? C.neg : C.green }}>
                {subiu ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                <span style={{ fontSize: 9, fontWeight: 600 }}>vs Jan 2022</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlocoCredito({ dados, euribor, onEditar }) {
  const c = dados.credito;
  const eurVal = euribor?.[c?.indexante || "6M"]?.valor;

  if (!c) return (
    <div className="mx-4 mb-4">
      <button onClick={onEditar}
        className="pj-tap press w-full rounded-2xl p-4 flex items-center gap-3"
        style={{ background: C.card, border: `1px dashed ${C.divSection}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.chip }}>
          <Home size={18} style={{ color: C.green }} />
        </div>
        <div className="text-left">
          <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Crédito Habitação</p>
          <p className="text-xs" style={{ color: C.faint }}>Configura para ver a tua prestação atual</p>
        </div>
        <Plus size={18} className="ml-auto shrink-0" style={{ color: C.faint }} />
      </button>
    </div>
  );

  const prestacaoAtual = eurVal != null ? calcPMT(c.capital, c.spread, eurVal, c.prazo) : null;
  const prestacao2022 = calcPMT(c.capital, c.spread, EURIBOR_REF[c.indexante || "6M"], c.prazo);
  const diferenca = prestacaoAtual != null ? prestacaoAtual - prestacao2022 : null;
  const dias = diasAte(c.dataRevisao);

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={CARD}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.divRow}` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.chip }}>
            <Home size={14} style={{ color: C.green }} />
          </div>
          <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Crédito Habitação</p>
        </div>
        <button onClick={onEditar} className="pj-tap press" style={{ color: C.faint }}>
          <Pencil size={14} />
        </button>
      </div>

      <div className="p-4">
        {prestacaoAtual != null ? (
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p style={LBL}>Prestação estimada</p>
                <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: C.text, lineHeight: 1.1 }}>{fmtEur(prestacaoAtual)}<span className="text-sm font-medium" style={{ color: C.faint }}>/mês</span></p>
              </div>
              {diferenca != null && (
                <div className="text-right px-2.5 py-1.5 rounded-xl" style={{ background: C.chip }}>
                  <p className="text-xs" style={{ fontWeight: 600, color: diferenca > 0 ? C.neg : C.green }}>
                    {diferenca > 0 ? "+" : ""}{fmtEur(diferenca)}/mês
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 600, color: C.faint }}>vs Jan 2022</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="rounded-xl p-2" style={{ background: C.chip }}>
                <p style={{ ...LBL_SM, fontSize: 9 }}>Capital</p>
                <p className="text-xs mt-0.5" style={{ fontWeight: 600, color: C.text }}>{fmtEur(c.capital)}</p>
              </div>
              <div className="rounded-xl p-2" style={{ background: C.chip }}>
                <p style={{ ...LBL_SM, fontSize: 9 }}>Spread</p>
                <p className="text-xs mt-0.5" style={{ fontWeight: 600, color: C.text }}>{c.spread}%</p>
              </div>
              <div className="rounded-xl p-2" style={{ background: C.chip }}>
                <p style={{ ...LBL_SM, fontSize: 9 }}>Prazo</p>
                <p className="text-xs mt-0.5" style={{ fontWeight: 600, color: C.text }}>{c.prazo} anos</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-2 mb-3">
            <p className="text-sm text-center" style={{ color: C.faint }}>A carregar Euribor…</p>
          </div>
        )}

        {dias != null && (
          <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: C.chip }}>
            <Calendar size={13} style={{ color: dias < 0 ? C.neg : C.muted }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: dias < 0 ? C.neg : C.text }}>
                {dias < 0 ? "Revisão em atraso — verifica com o banco"
                  : dias === 0 ? "Revisão hoje!"
                  : `Próxima revisão: ${mesLabel(c.dataRevisao)} (em ${dias} dias)`}
              </p>
              <p style={{ fontSize: 9, color: C.faint }}>Indexante: Euribor {c.indexante || "6M"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlocoRenda({ dados, onEditar }) {
  const r = dados.renda;

  if (!r) return (
    <div className="mx-4 mb-4">
      <button onClick={onEditar}
        className="pj-tap press w-full rounded-2xl p-4 flex items-center gap-3"
        style={{ background: C.card, border: `1px dashed ${C.divSection}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.chip }}>
          <Building2 size={18} style={{ color: C.green }} />
        </div>
        <div className="text-left">
          <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Renda</p>
          <p className="text-xs" style={{ color: C.faint }}>Configura para ver o aumento previsto</p>
        </div>
        <Plus size={18} className="ml-auto shrink-0" style={{ color: C.faint }} />
      </button>
    </div>
  );

  const anoAtual = new Date().getFullYear();
  const coef = COEF_RENDAS[anoAtual] || COEF_RENDAS[anoAtual - 1];
  const aumentoMensal = r.valor * coef / 100;
  const novaRenda = r.valor + aumentoMensal;
  const proxRevisao = proximoMesRevisaoRenda(r.mesRevisao || 1);
  const dias = diasAte(proxRevisao);

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={CARD}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.divRow}` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.chip }}>
            <Building2 size={14} style={{ color: C.green }} />
          </div>
          <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Renda</p>
        </div>
        <button onClick={onEditar} className="pj-tap press" style={{ color: C.faint }}>
          <Pencil size={14} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p style={LBL}>Renda atual</p>
            <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: C.text, lineHeight: 1.1 }}>{fmtEur(r.valor)}<span className="text-sm font-medium" style={{ color: C.faint }}>/mês</span></p>
          </div>
          <div className="text-right px-2.5 py-1.5 rounded-xl" style={{ background: C.chip }}>
            <p className="text-xs" style={{ fontWeight: 600, color: C.neg }}>+{fmtEur(aumentoMensal)}/mês</p>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.faint }}>coef. {coef}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: C.chip }}>
          <Calendar size={13} style={{ color: dias != null && dias < 30 ? C.neg : C.muted }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: dias != null && dias < 30 ? C.neg : C.text }}>
              Próxima revisão: {mesLabel(proxRevisao)}
              {dias != null && dias >= 0 ? ` (em ${dias} dias)` : ""}
            </p>
            <p style={{ fontSize: 9, color: C.faint }}>
              Aumento máximo previsto: {fmtEur(novaRenda)}/mês
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Resumo — a gestão completa (adicionar/editar/remover, categorias, dias de
// pagamento) vive no separador "Contas fixas"; aqui mostramos só o total real,
// para não haver duas listas a divergir uma da outra.
function BlocoContas({ contas, setTab }) {
  const total = contas.reduce((s, c) => s + (c.valor || 0), 0);

  return (
    <button
      onClick={() => setTab?.("contas")}
      className="pj-tap press mx-4 mb-4 rounded-2xl overflow-hidden w-[calc(100%-2rem)] text-left"
      style={CARD}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.chip }}>
            <Wallet size={14} style={{ color: C.green }} />
          </div>
          <div>
            <p className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Contas fixas</p>
            <p className="text-xs mt-0.5" style={{ color: C.faint }}>
              {contas.length === 0
                ? "Luz, água, internet, condomínio…"
                : `${contas.length} conta${contas.length !== 1 ? "s" : ""} · ${fmtEur(total)}/mês`}
            </p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: C.faint }} />
      </div>
    </button>
  );
}

export default function SecaoCasa({ setTab }) {
  const [dados, setDados] = useState({});
  const [contasReais, setContasReais] = useState([]);
  const [euribor, setEuribor] = useState(null);
  const [loadEuribor, setLoadEuribor] = useState(true);
  const [modal, setModal] = useState(null);

  const [fCredito, setFCredito] = useState({ capital: "", spread: "", prazo: "", indexante: "6M", dataRevisao: "" });
  const [fRenda, setFRenda] = useState({ valor: "", mesRevisao: "1" });

  useEffect(() => {
    const d = lerLocal();
    setDados(d);
    setContasReais(lerContasReais());
    if (d.credito) setFCredito({ capital: d.credito.capital, spread: d.credito.spread, prazo: d.credito.prazo, indexante: d.credito.indexante || "6M", dataRevisao: d.credito.dataRevisao || "" });
    if (d.renda) setFRenda({ valor: d.renda.valor, mesRevisao: String(d.renda.mesRevisao || 1) });
  }, []);

  useEffect(() => {
    fetch("/api/euribor")
      .then(r => r.json())
      .then(d => { if (d.euribor) setEuribor(d.euribor); })
      .catch(() => {})
      .finally(() => setLoadEuribor(false));
  }, []);

  function salvar(patch) {
    const novo = { ...dados, ...patch };
    setDados(novo);
    guardarLocal(novo);
  }

  function guardarCredito() {
    salvar({ credito: { capital: Number(fCredito.capital), spread: Number(fCredito.spread), prazo: Number(fCredito.prazo), indexante: fCredito.indexante, dataRevisao: fCredito.dataRevisao } });
    setModal(null);
  }

  function guardarRenda() {
    salvar({ renda: { valor: Number(fRenda.valor), mesRevisao: Number(fRenda.mesRevisao) } });
    setModal(null);
  }

  const prestacaoAtual = dados.credito && euribor
    ? calcPMT(dados.credito.capital, dados.credito.spread, euribor[dados.credito.indexante || "6M"]?.valor ?? 0, dados.credito.prazo)
    : null;
  const totalContas = contasReais.reduce((s, c) => s + (c.valor || 0), 0);
  const totalCasa = (prestacaoAtual || 0) + (dados.renda?.valor || 0) + totalContas;

  return (
    <div className="pb-28">
      <div className="mx-4 mt-4 mb-5 anim-up" style={{ paddingTop: 12, paddingBottom: 20, borderBottom: `1px solid ${C.divSection}` }}>
        <p className="mb-1.5" style={{ ...LBL, letterSpacing: "0.14em" }}>Habitação</p>
        <p className="font-display" style={{ fontSize: 26, fontWeight: 600, color: C.text, lineHeight: 1.15 }}>A tua casa</p>
        <p className="text-xs mt-1" style={{ color: C.muted }}>Crédito, renda e contas fixas num só sítio</p>
        {totalCasa > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: C.chip }}>
            <span className="text-xs" style={{ fontWeight: 600, color: C.text }}>Total casa: {fmtEur(totalCasa)}/mês</span>
          </div>
        )}
      </div>

      <BlocoEuribor euribor={euribor} carregando={loadEuribor} />

      <BlocoCredito dados={dados} euribor={euribor}
        onEditar={() => { if (dados.credito) setFCredito({ capital: dados.credito.capital, spread: dados.credito.spread, prazo: dados.credito.prazo, indexante: dados.credito.indexante || "6M", dataRevisao: dados.credito.dataRevisao || "" }); setModal("credito"); }} />

      <BlocoRenda dados={dados}
        onEditar={() => { if (dados.renda) setFRenda({ valor: dados.renda.valor, mesRevisao: String(dados.renda.mesRevisao || 1) }); setModal("renda"); }} />

      <BlocoContas contas={contasReais} setTab={setTab} />

      <p className="text-[10px] text-center px-4 mt-2" style={{ color: C.faint }}>
        Os valores são estimativas com base nos dados que introduziste. Confirma sempre com o teu banco.
      </p>

      {modal === "credito" && (
        <Modal titulo={dados.credito ? "Editar crédito" : "Crédito Habitação"} onFechar={() => setModal(null)}>
          <Campo label="Capital em dívida (€)">
            <input type="number" className={inputCls} style={INPUT_STYLE} placeholder="ex: 120000" value={fCredito.capital}
              onChange={e => setFCredito(p => ({ ...p, capital: e.target.value }))} />
          </Campo>
          <Campo label="Spread do banco (%)">
            <input type="number" step="0.01" className={inputCls} style={INPUT_STYLE} placeholder="ex: 1.2" value={fCredito.spread}
              onChange={e => setFCredito(p => ({ ...p, spread: e.target.value }))} />
          </Campo>
          <Campo label="Prazo restante (anos)">
            <input type="number" className={inputCls} style={INPUT_STYLE} placeholder="ex: 22" value={fCredito.prazo}
              onChange={e => setFCredito(p => ({ ...p, prazo: e.target.value }))} />
          </Campo>
          <Campo label="Indexante">
            <select className={inputCls} style={INPUT_STYLE} value={fCredito.indexante}
              onChange={e => setFCredito(p => ({ ...p, indexante: e.target.value }))}>
              <option value="3M">Euribor 3 meses</option>
              <option value="6M">Euribor 6 meses</option>
              <option value="12M">Euribor 12 meses</option>
            </select>
          </Campo>
          <Campo label="Data da próxima revisão">
            <input type="month" className={inputCls} style={INPUT_STYLE} value={fCredito.dataRevisao}
              onChange={e => setFCredito(p => ({ ...p, dataRevisao: e.target.value }))} />
          </Campo>
          <button onClick={guardarCredito}
            disabled={!fCredito.capital || !fCredito.spread || !fCredito.prazo}
            className="pj-tap press w-full py-3.5 rounded-xl text-sm disabled:opacity-40 mt-2"
            style={{ background: C.green, color: "#ffffff", fontWeight: 600 }}>
            Guardar
          </button>
          {dados.credito && (
            <button onClick={() => { salvar({ credito: null }); setModal(null); }}
              className="pj-tap press w-full py-2.5 rounded-xl text-sm mt-2"
              style={{ color: C.neg, fontWeight: 600 }}>
              Remover crédito
            </button>
          )}
        </Modal>
      )}

      {modal === "renda" && (
        <Modal titulo={dados.renda ? "Editar renda" : "Renda"} onFechar={() => setModal(null)}>
          <Campo label="Valor mensal (€)">
            <input type="number" className={inputCls} style={INPUT_STYLE} placeholder="ex: 800" value={fRenda.valor}
              onChange={e => setFRenda(p => ({ ...p, valor: e.target.value }))} />
          </Campo>
          <Campo label="Mês de revisão anual">
            <select className={inputCls} style={INPUT_STYLE} value={fRenda.mesRevisao}
              onChange={e => setFRenda(p => ({ ...p, mesRevisao: e.target.value }))}>
              {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
                .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Campo>
          <button onClick={guardarRenda}
            disabled={!fRenda.valor}
            className="pj-tap press w-full py-3.5 rounded-xl text-sm disabled:opacity-40 mt-2"
            style={{ background: C.green, color: "#ffffff", fontWeight: 600 }}>
            Guardar
          </button>
          {dados.renda && (
            <button onClick={() => { salvar({ renda: null }); setModal(null); }}
              className="pj-tap press w-full py-2.5 rounded-xl text-sm mt-2"
              style={{ color: C.neg, fontWeight: 600 }}>
              Remover renda
            </button>
          )}
        </Modal>
      )}

    </div>
  );
}
