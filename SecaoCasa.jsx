import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Calendar, X, Home, Wallet } from "lucide-react";

const EURIBOR_REF = { "3M": -0.568, "6M": -0.543, "12M": -0.477 };

const COEF_RENDAS = { 2023: 5.43, 2024: 2.16, 2025: 2.77 };

const EMOJIS_CONTA = ["💡","💧","🔥","📶","🏢","♻️","🏠","🛁","📺","🚿"];
const CHAVE = "poupeja_casa";

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch { return {}; }
}
function guardarLocal(d) {
  try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch {}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-800">{titulo}</h3>
          <button onClick={onFechar} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
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
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50";

function BlocoEuribor({ euribor, carregando }) {
  if (carregando) return (
    <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl" />)}
      </div>
    </div>
  );
  if (!euribor) return null;
  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2.5">Euribor hoje</p>
      <div className="grid grid-cols-3 gap-2">
        {["3M","6M","12M"].map(p => {
          const d = euribor[p];
          if (!d) return null;
          const subiu = d.valor > EURIBOR_REF[p];
          return (
            <div key={p} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-black text-slate-400">{p}</p>
              <p className="text-base font-black text-slate-800 mt-0.5">{d.valor.toFixed(3)}%</p>
              <div className={`flex items-center justify-center gap-0.5 mt-0.5 ${subiu ? "text-rose-500" : "text-emerald-500"}`}>
                {subiu ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                <span className="text-[9px] font-bold">vs Jan 2022</span>
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
        className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border-2 border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Home size={18} className="text-blue-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-slate-700">Crédito Habitação</p>
          <p className="text-xs text-slate-400 font-medium">Configura para ver a tua prestação atual</p>
        </div>
        <Plus size={18} className="text-slate-400 ml-auto shrink-0" />
      </button>
    </div>
  );

  const prestacaoAtual = eurVal != null ? calcPMT(c.capital, c.spread, eurVal, c.prazo) : null;
  const prestacao2022 = calcPMT(c.capital, c.spread, EURIBOR_REF[c.indexante || "6M"], c.prazo);
  const diferenca = prestacaoAtual != null ? prestacaoAtual - prestacao2022 : null;
  const dias = diasAte(c.dataRevisao);

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Home size={14} className="text-blue-600" />
          </div>
          <p className="text-sm font-black text-slate-700">Crédito Habitação</p>
        </div>
        <button onClick={onEditar} className="text-slate-300 hover:text-slate-500">
          <Pencil size={14} />
        </button>
      </div>

      <div className="p-4">
        {prestacaoAtual != null ? (
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Prestação estimada</p>
                <p className="text-3xl font-black text-slate-800">{fmtEur(prestacaoAtual)}<span className="text-sm font-bold text-slate-400">/mês</span></p>
              </div>
              {diferenca != null && (
                <div className={`text-right px-2.5 py-1.5 rounded-xl ${diferenca > 0 ? "bg-rose-50" : "bg-emerald-50"}`}>
                  <p className={`text-xs font-black ${diferenca > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {diferenca > 0 ? "+" : ""}{fmtEur(diferenca)}/mês
                  </p>
                  <p className={`text-[9px] font-bold ${diferenca > 0 ? "text-rose-400" : "text-emerald-400"}`}>vs Jan 2022</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-50 rounded-xl p-2">
                <p className="text-[9px] font-black text-slate-400 uppercase">Capital</p>
                <p className="text-xs font-black text-slate-700">{fmtEur(c.capital)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <p className="text-[9px] font-black text-slate-400 uppercase">Spread</p>
                <p className="text-xs font-black text-slate-700">{c.spread}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <p className="text-[9px] font-black text-slate-400 uppercase">Prazo</p>
                <p className="text-xs font-black text-slate-700">{c.prazo} anos</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-2 mb-3">
            <p className="text-sm text-slate-400 font-medium text-center">A carregar Euribor…</p>
          </div>
        )}

        {dias != null && (
          <div className={`flex items-center gap-2 rounded-xl p-3 ${dias < 0 ? "bg-rose-50" : dias < 30 ? "bg-amber-50" : "bg-slate-50"}`}>
            <Calendar size={13} className={dias < 0 ? "text-rose-500" : dias < 30 ? "text-amber-500" : "text-slate-400"} />
            <div>
              <p className={`text-[11px] font-black ${dias < 0 ? "text-rose-600" : dias < 30 ? "text-amber-600" : "text-slate-600"}`}>
                {dias < 0 ? "Revisão em atraso — verifica com o banco"
                  : dias === 0 ? "Revisão hoje!"
                  : `Próxima revisão: ${mesLabel(c.dataRevisao)} (em ${dias} dias)`}
              </p>
              <p className="text-[9px] text-slate-400 font-medium">Indexante: Euribor {c.indexante || "6M"}</p>
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
        className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border-2 border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-violet-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-slate-700">Renda</p>
          <p className="text-xs text-slate-400 font-medium">Configura para ver o aumento previsto</p>
        </div>
        <Plus size={18} className="text-slate-400 ml-auto shrink-0" />
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
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
            <Building2 size={14} className="text-violet-600" />
          </div>
          <p className="text-sm font-black text-slate-700">Renda</p>
        </div>
        <button onClick={onEditar} className="text-slate-300 hover:text-slate-500">
          <Pencil size={14} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Renda atual</p>
            <p className="text-3xl font-black text-slate-800">{fmtEur(r.valor)}<span className="text-sm font-bold text-slate-400">/mês</span></p>
          </div>
          <div className="text-right bg-amber-50 px-2.5 py-1.5 rounded-xl">
            <p className="text-xs font-black text-amber-700">+{fmtEur(aumentoMensal)}/mês</p>
            <p className="text-[9px] font-bold text-amber-400">coef. {coef}%</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 rounded-xl p-3 ${dias != null && dias < 30 ? "bg-amber-50" : "bg-slate-50"}`}>
          <Calendar size={13} className={dias != null && dias < 30 ? "text-amber-500" : "text-slate-400"} />
          <div>
            <p className={`text-[11px] font-black ${dias != null && dias < 30 ? "text-amber-600" : "text-slate-600"}`}>
              Próxima revisão: {mesLabel(proxRevisao)}
              {dias != null && dias >= 0 ? ` (em ${dias} dias)` : ""}
            </p>
            <p className="text-[9px] text-slate-400 font-medium">
              Aumento máximo previsto: {fmtEur(novaRenda)}/mês
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlocoContas({ dados, onAdicionar, onEditar, onRemover }) {
  const contas = dados.contas || [];
  const total = contas.reduce((s, c) => s + (c.valor || 0), 0);

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Wallet size={14} className="text-emerald-600" />
          </div>
          <p className="text-sm font-black text-slate-700">Contas fixas</p>
        </div>
        <button onClick={onAdicionar} className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Plus size={14} className="text-white" />
        </button>
      </div>

      {contas.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-slate-400 font-medium">Adiciona as tuas contas fixas</p>
          <p className="text-xs text-slate-300 mt-1">Luz, água, internet, condomínio…</p>
        </div>
      ) : (
        <>
          {contas.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
              <span className="text-xl shrink-0">{c.emoji}</span>
              <p className="text-sm font-bold text-slate-700 flex-1">{c.nome}</p>
              <p className="text-sm font-black text-slate-800">{fmtEur(c.valor)}<span className="text-[10px] font-medium text-slate-400">/mês</span></p>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => onEditar(i)} className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Pencil size={12} className="text-slate-400" />
                </button>
                <button onClick={() => onRemover(i)} className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Trash2 size={12} className="text-rose-400" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
            <p className="text-xs font-black text-slate-500">Total mensal</p>
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{fmtEur(total)}/mês</p>
              <p className="text-[10px] text-slate-400 font-medium">{fmtEur(total * 12)}/ano</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SecaoCasa() {
  const [dados, setDados] = useState({});
  const [euribor, setEuribor] = useState(null);
  const [loadEuribor, setLoadEuribor] = useState(true);
  const [modal, setModal] = useState(null);
  const [idxEditando, setIdxEditando] = useState(null);

  const [fCredito, setFCredito] = useState({ capital: "", spread: "", prazo: "", indexante: "6M", dataRevisao: "" });
  const [fRenda, setFRenda] = useState({ valor: "", mesRevisao: "1" });
  const [fConta, setFConta] = useState({ nome: "", valor: "", emoji: "💡" });

  useEffect(() => {
    const d = lerLocal();
    setDados(d);
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

  function guardarConta() {
    const contas = [...(dados.contas || [])];
    const nova = { id: Date.now(), nome: fConta.nome, valor: Number(fConta.valor), emoji: fConta.emoji };
    if (idxEditando != null) contas[idxEditando] = { ...contas[idxEditando], ...nova };
    else contas.push(nova);
    salvar({ contas });
    setModal(null);
    setIdxEditando(null);
  }

  function removerConta(i) {
    const contas = [...(dados.contas || [])];
    contas.splice(i, 1);
    salvar({ contas });
  }

  function abrirEditarConta(i) {
    const c = dados.contas[i];
    setFConta({ nome: c.nome, valor: c.valor, emoji: c.emoji });
    setIdxEditando(i);
    setModal("conta");
  }

  const prestacaoAtual = dados.credito && euribor
    ? calcPMT(dados.credito.capital, dados.credito.spread, euribor[dados.credito.indexante || "6M"]?.valor ?? 0, dados.credito.prazo)
    : null;
  const totalContas = (dados.contas || []).reduce((s, c) => s + c.valor, 0);
  const totalCasa = (prestacaoAtual || 0) + (dados.renda?.valor || 0) + totalContas;

  return (
    <div className="pb-28">
      <div className="mx-4 mt-4 mb-5 rounded-3xl p-5 relative overflow-hidden anim-up"
        style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", boxShadow: "0 20px 50px -15px rgba(37,99,235,0.45)" }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Habitação</p>
        <p className="text-2xl font-black text-white leading-tight">A tua casa</p>
        <p className="text-xs text-white/70 mt-1">Crédito, renda e contas fixas num só sítio</p>
        {totalCasa > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
            <span className="text-xs font-black text-white">Total casa: {fmtEur(totalCasa)}/mês</span>
          </div>
        )}
      </div>

      <BlocoEuribor euribor={euribor} carregando={loadEuribor} />

      <BlocoCredito dados={dados} euribor={euribor}
        onEditar={() => { if (dados.credito) setFCredito({ capital: dados.credito.capital, spread: dados.credito.spread, prazo: dados.credito.prazo, indexante: dados.credito.indexante || "6M", dataRevisao: dados.credito.dataRevisao || "" }); setModal("credito"); }} />

      <BlocoRenda dados={dados}
        onEditar={() => { if (dados.renda) setFRenda({ valor: dados.renda.valor, mesRevisao: String(dados.renda.mesRevisao || 1) }); setModal("renda"); }} />

      <BlocoContas dados={dados}
        onAdicionar={() => { setFConta({ nome: "", valor: "", emoji: "💡" }); setIdxEditando(null); setModal("conta"); }}
        onEditar={abrirEditarConta}
        onRemover={removerConta} />

      <p className="text-[10px] text-slate-400 text-center px-4 mt-2">
        Os valores são estimativas com base nos dados que introduziste. Confirma sempre com o teu banco.
      </p>

      {modal === "credito" && (
        <Modal titulo={dados.credito ? "Editar crédito" : "Crédito Habitação"} onFechar={() => setModal(null)}>
          <Campo label="Capital em dívida (€)">
            <input type="number" className={inputCls} placeholder="ex: 120000" value={fCredito.capital}
              onChange={e => setFCredito(p => ({ ...p, capital: e.target.value }))} />
          </Campo>
          <Campo label="Spread do banco (%)">
            <input type="number" step="0.01" className={inputCls} placeholder="ex: 1.2" value={fCredito.spread}
              onChange={e => setFCredito(p => ({ ...p, spread: e.target.value }))} />
          </Campo>
          <Campo label="Prazo restante (anos)">
            <input type="number" className={inputCls} placeholder="ex: 22" value={fCredito.prazo}
              onChange={e => setFCredito(p => ({ ...p, prazo: e.target.value }))} />
          </Campo>
          <Campo label="Indexante">
            <select className={inputCls} value={fCredito.indexante}
              onChange={e => setFCredito(p => ({ ...p, indexante: e.target.value }))}>
              <option value="3M">Euribor 3 meses</option>
              <option value="6M">Euribor 6 meses</option>
              <option value="12M">Euribor 12 meses</option>
            </select>
          </Campo>
          <Campo label="Data da próxima revisão">
            <input type="month" className={inputCls} value={fCredito.dataRevisao}
              onChange={e => setFCredito(p => ({ ...p, dataRevisao: e.target.value }))} />
          </Campo>
          <button onClick={guardarCredito}
            disabled={!fCredito.capital || !fCredito.spread || !fCredito.prazo}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-black text-sm disabled:opacity-40 mt-2">
            Guardar
          </button>
          {dados.credito && (
            <button onClick={() => { salvar({ credito: null }); setModal(null); }}
              className="w-full py-2.5 rounded-xl text-rose-500 font-bold text-sm mt-2">
              Remover crédito
            </button>
          )}
        </Modal>
      )}

      {modal === "renda" && (
        <Modal titulo={dados.renda ? "Editar renda" : "Renda"} onFechar={() => setModal(null)}>
          <Campo label="Valor mensal (€)">
            <input type="number" className={inputCls} placeholder="ex: 800" value={fRenda.valor}
              onChange={e => setFRenda(p => ({ ...p, valor: e.target.value }))} />
          </Campo>
          <Campo label="Mês de revisão anual">
            <select className={inputCls} value={fRenda.mesRevisao}
              onChange={e => setFRenda(p => ({ ...p, mesRevisao: e.target.value }))}>
              {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
                .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Campo>
          <button onClick={guardarRenda}
            disabled={!fRenda.valor}
            className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-black text-sm disabled:opacity-40 mt-2">
            Guardar
          </button>
          {dados.renda && (
            <button onClick={() => { salvar({ renda: null }); setModal(null); }}
              className="w-full py-2.5 rounded-xl text-rose-500 font-bold text-sm mt-2">
              Remover renda
            </button>
          )}
        </Modal>
      )}

      {modal === "conta" && (
        <Modal titulo={idxEditando != null ? "Editar conta" : "Nova conta"} onFechar={() => { setModal(null); setIdxEditando(null); }}>
          <Campo label="Emoji">
            <div className="flex flex-wrap gap-2">
              {EMOJIS_CONTA.map(e => (
                <button key={e} onClick={() => setFConta(p => ({ ...p, emoji: e }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 ${fConta.emoji === e ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white"}`}>
                  {e}
                </button>
              ))}
            </div>
          </Campo>
          <Campo label="Nome">
            <input type="text" className={inputCls} placeholder="ex: Luz EDP" value={fConta.nome}
              onChange={e => setFConta(p => ({ ...p, nome: e.target.value }))} />
          </Campo>
          <Campo label="Valor mensal (€)">
            <input type="number" className={inputCls} placeholder="ex: 85" value={fConta.valor}
              onChange={e => setFConta(p => ({ ...p, valor: e.target.value }))} />
          </Campo>
          <button onClick={guardarConta}
            disabled={!fConta.nome || !fConta.valor}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-black text-sm disabled:opacity-40 mt-2">
            {idxEditando != null ? "Guardar alterações" : "Adicionar conta"}
          </button>
        </Modal>
      )}
    </div>
  );
}
