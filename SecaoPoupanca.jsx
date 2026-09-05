import { useState, useEffect } from "react";
import {
  ChevronRight, Zap, BarChart, TrendingUp, Plus, ListChecks,
  Share2, TrendingDown, Lightbulb,
} from "lucide-react";
import DesafiosMensais from "./DesafiosMensais";
import MetaPoupanca from "./MetaPoupanca";
import Divisoria from "./Divisoria";
import { partilharPoupanca } from "./lib/partilhar";

function SectionLabel({ children, icon: Icon, className = "" }) {
  return (
    <p className={`text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 ${className}`}>
      {Icon && <Icon size={12} className="text-slate-300" />}
      {children}
    </p>
  );
}

/* ─── Converter convidado em conta — updateUser mantém o user_id, zero migração ─── */

function EmptyState({ icon: Icon, titulo, sub, cta, onCta }) {
  return (
    <div className="mx-4 rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--pj-subtle)" }}>
        <Icon size={30} style={{ color: "var(--pj-text-faint)" }} />
      </div>
      <p className="font-display text-sm font-semibold" style={{ color: "var(--pj-text)" }}>{titulo}</p>
      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>{sub}</p>
      {cta && (
        <button
          onClick={onCta}
          className="pj-tap press mt-4 px-5 py-2.5 rounded-xl text-white text-xs font-semibold"
          style={{ background: "var(--pj-brand)" }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

/* ─── Convite a instalar — leva à página /instalar (ou instala já no Android) ─── */

export default function SecaoPoupanca({ setTab, retrato, onAbrirRetrato }) {
  const [dados, setDados] = useState(null);
  const [feedbackPartilha, setFeedbackPartilha] = useState("");
  const [barSelecionada, setBarSelecionada] = useState(null);
  const [mostrar12, setMostrar12] = useState(false);

  async function partilhar() {
    if (!dados) return;
    const valor = dados.totalMes > 0 ? dados.totalMes : dados.totalGeral;
    const periodo = dados.totalMes > 0 ? "este mês" : "até hoje";
    const r = await partilharPoupanca(valor, periodo);
    if (r === "copiado") {
      setFeedbackPartilha("Copiado ✓");
      setTimeout(() => setFeedbackPartilha(""), 2500);
    }
  }

  useEffect(() => {
    try {
      const taloes = JSON.parse(localStorage.getItem("poupeja_taloes") || "[]");
      const compras = taloes.filter(t => t.tipo === "compra" && t.valorPoupado != null);
      const agora = new Date();
      const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      const mesAnterior = (() => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })();

      // Agrupar por mês (últimos 12 meses)
      const porMes = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        porMes[k] = 0;
      }
      compras.forEach(t => {
        const data = t.dataCompra || t.criadoEm?.slice(0, 7) || mesAtual;
        const k = data.slice(0, 7);
        if (k in porMes) porMes[k] += t.valorPoupado;
      });

      const meses12 = Object.entries(porMes).map(([k, v]) => ({
        k, v,
        label: new Date(k + "-01").toLocaleDateString("pt-PT", { month: "short" }),
        labelLong: new Date(k + "-01").toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      }));

      const totalMes    = porMes[mesAtual] || 0;
      const totalAnterior = porMes[mesAnterior] || 0;
      const totalGeral  = compras.reduce((acc, t) => acc + (t.valorPoupado || 0), 0);
      const mesesComValor = meses12.filter(m => m.v > 0);
      const melhorMes   = mesesComValor.length ? mesesComValor.reduce((a, b) => b.v > a.v ? b : a) : null;
      const mediaMensal = mesesComValor.length ? totalGeral / mesesComValor.length : 0;
      const tendencia   = totalAnterior > 0
        ? Math.round(((totalMes - totalAnterior) / totalAnterior) * 100)
        : totalMes > 0 ? 100 : 0;
      const maxBar = Math.max(...meses12.map(m => m.v), 0.01);

      setDados({ meses12, totalMes, totalGeral, count: compras.length, maxBar, melhorMes, mediaMensal, tendencia, totalAnterior });
    } catch {}
  }, []);

  const semDados = !dados || dados.totalGeral === 0;
  const mesesVisiveis = dados ? (mostrar12 ? dados.meses12 : dados.meses12.slice(6)) : [];

  return (
    <div className="pb-28 pt-4">

      {/* Total — editorial */}
      <div className="px-6 anim-up">
        <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          A tua poupança total
        </div>
        <div className="font-display flex items-baseline" style={{ fontWeight: 500, fontSize: 64, lineHeight: 1, letterSpacing: "-0.035em", color: "var(--pj-text)", marginTop: 14 }}>
          <span style={{ fontSize: 32, color: "#b0b8b0", marginRight: 5, fontWeight: 400 }}>€</span>
          {dados ? Math.floor(dados.totalGeral) : 0}
          <span style={{ fontSize: 32, color: "#b0b8b0", fontWeight: 400 }}>,{dados ? String(Math.round((dados.totalGeral % 1) * 100)).padStart(2, "0") : "00"}</span>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--pj-text-muted)", fontWeight: 500, marginTop: 12, lineHeight: 1.5 }}>
          {dados && dados.totalGeral > 0
            ? <>Poupança real somada em <span style={{ color: "var(--pj-text)", fontWeight: 600 }}>tudo</span> — {dados.count} tal{dados.count !== 1 ? "ões" : "ão"} guardado{dados.count !== 1 ? "s" : ""}.</>
            : <>Guarda talões com o valor poupado para veres a tua poupança a crescer aqui.</>}
        </div>
        {dados && dados.totalGeral > 0 && dados.tendencia !== 0 && dados.totalAnterior > 0 && (
          <div className="inline-flex items-center" style={{ gap: 9, marginTop: 20, padding: "10px 14px", borderRadius: 12, background: "var(--pj-brand-wash)" }}>
            {dados.tendencia > 0 ? <TrendingUp size={16} style={{ color: "var(--pj-brand-ink)" }} /> : <TrendingDown size={16} style={{ color: "var(--pj-danger)" }} />}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: dados.tendencia > 0 ? "var(--pj-brand-ink)" : "var(--pj-danger)" }}>
              {dados.tendencia > 0 ? "+" : ""}{dados.tendencia}% vs. o mês passado
            </span>
          </div>
        )}
        <div className="flex" style={{ gap: 8, marginTop: 22 }}>
          <button onClick={() => setTab("taloes")} className="press inline-flex items-center" style={{ gap: 6, background: "var(--pj-brand)", color: "#f6f5f0", fontSize: 12.5, fontWeight: 700, padding: "9px 16px", borderRadius: 12 }}>
            <Plus size={13} /> {semDados ? "Guardar primeiro talão" : "Adicionar talão"}
          </button>
          {!semDados && (
            <button onClick={partilhar} className="press inline-flex items-center" style={{ gap: 6, background: "var(--pj-subtle)", color: "var(--pj-text)", fontSize: 12.5, fontWeight: 700, padding: "9px 14px", borderRadius: 12 }}>
              <Share2 size={13} /> {feedbackPartilha || "Partilhar"}
            </button>
          )}
          {retrato && (
            <button onClick={onAbrirRetrato} className="press inline-flex items-center" style={{ gap: 6, background: "var(--pj-subtle)", color: "var(--pj-brand-ink)", fontSize: 12.5, fontWeight: 700, padding: "9px 14px", borderRadius: 12 }}>
              🎁 Retrato de {retrato.mes.nome}
            </button>
          )}
        </div>
      </div>
      <div className="px-6"><Divisoria /></div>

      {/* Meta de poupança — "estou a poupar para…" */}
      <MetaPoupanca />

      {dados && dados.totalGeral > 0 ? (<>

        {/* Cartões de resumo */}
        <div className="px-4 mb-5 anim-up anim-up-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em]" style={{ color: "var(--pj-text-faint)" }}>Melhor mês</p>
              <p className="font-display text-xl font-semibold mt-1" style={{ color: "var(--pj-text)" }}>
                €{dados.melhorMes ? dados.melhorMes.v.toFixed(2) : "0.00"}
              </p>
              <p className="text-[11px] capitalize mt-0.5" style={{ color: "var(--pj-text-faint)" }}>
                {dados.melhorMes ? dados.melhorMes.labelLong : "—"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em]" style={{ color: "var(--pj-text-faint)" }}>Média mensal</p>
              <p className="font-display text-xl font-semibold mt-1" style={{ color: "var(--pj-text)" }}>€{dados.mediaMensal.toFixed(2)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-faint)" }}>nos meses com dados</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="px-4 mb-2 anim-up anim-up-1">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={BarChart}>{mostrar12 ? "Últimos 12 meses" : "Últimos 6 meses"}</SectionLabel>
            <button
              onClick={() => { setMostrar12(v => !v); setBarSelecionada(null); }}
              className="pj-tap text-[11px] font-semibold"
              style={{ color: "var(--pj-brand-ink)" }}
            >
              {mostrar12 ? "Ver 6 meses" : "Ver 12 meses"}
            </button>
          </div>

          {/* Tooltip da barra selecionada */}
          {barSelecionada && (
            <div className="mb-3 mx-auto text-center rounded-2xl py-2.5 px-4" style={{ background: "var(--pj-brand-wash)" }}>
              <p className="text-[11px] font-semibold capitalize" style={{ color: "var(--pj-text-faint)" }}>{barSelecionada.labelLong}</p>
              <p className="font-display text-lg font-semibold" style={{ color: "var(--pj-brand-ink)" }}>€{barSelecionada.v.toFixed(2)}</p>
            </div>
          )}

          <div className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <div className="flex items-end gap-1.5 h-32">
              {mesesVisiveis.map(m => {
                const pct = dados.maxBar > 0 ? (m.v / dados.maxBar) * 100 : 0;
                const isAtual = m.k === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                const isSelecionada = barSelecionada?.k === m.k;
                return (
                  <button
                    key={m.k}
                    onClick={() => setBarSelecionada(isSelecionada ? null : m)}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <p className="text-[8px] font-semibold h-3" style={{ color: "var(--pj-brand-ink)" }}>
                      {m.v > 0 ? `€${m.v.toFixed(0)}` : ""}
                    </p>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(pct, m.v > 0 ? 6 : 3)}%`,
                        background: isSelecionada
                          ? "#0b6b4f"
                          : isAtual
                          ? "#3f9070"
                          : m.v > 0 ? "#cfe3d8" : "#eeece4",
                        minHeight: 4,
                      }}
                    />
                    <p className="text-[9px] font-semibold" style={{ color: isAtual ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
                      {m.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--pj-border)" }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#3f9070" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--pj-text-faint)" }}>Mês atual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#cfe3d8" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--pj-text-faint)" }}>Meses anteriores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista mensal */}
        <div className="px-4 mb-5 anim-up anim-up-2">
          <SectionLabel icon={TrendingUp}>Detalhe por mês</SectionLabel>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            {[...mesesVisiveis].reverse().filter(m => m.v > 0).map((m, i) => {
              const isAtual = m.k === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
              const pct = dados.totalGeral > 0 ? (m.v / dados.totalGeral) * 100 : 0;
              return (
                <div key={m.k} className="flex items-center gap-3 px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
                    <span className="text-[10px] font-semibold capitalize" style={{ color: "var(--pj-brand-ink)" }}>{m.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold capitalize" style={{ color: "var(--pj-text)" }}>
                        {m.labelLong} {isAtual && <span className="text-[10px] font-semibold ml-1" style={{ color: "var(--pj-brand-ink)" }}>• atual</span>}
                      </p>
                      <p className="font-display text-sm font-semibold" style={{ color: "var(--pj-brand-ink)" }}>€{m.v.toFixed(2)}</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pj-subtle)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--pj-brand)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {mesesVisiveis.every(m => m.v === 0) && (
              <div className="px-4 py-8 text-center text-sm font-medium" style={{ color: "var(--pj-text-faint)" }}>
                Sem dados neste período.
              </div>
            )}
          </div>
        </div>

      </>) : (
        <div className="px-4 mb-5 anim-up anim-up-1">
          <SectionLabel icon={Zap}>Histórico</SectionLabel>
          <EmptyState
            icon={BarChart}
            titulo="Ainda sem dados de poupança"
            sub="Quando guardares talões com o valor poupado, o teu histórico aparece aqui."
            cta="Guardar talão"
            onCta={() => setTab("taloes")}
          />
        </div>
      )}

      {/* Lista de compras shortcut */}
      <div className="px-4 mb-5 anim-up anim-up-2">
        <button
          onClick={() => setTab("lista")}
          className="pj-tap press w-full rounded-2xl p-4 flex items-center gap-3.5 text-left"
          style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
            <ListChecks size={24} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--pj-text-faint)" }}>Novo</p>
            <p className="font-display text-[15px] font-semibold leading-snug" style={{ color: "var(--pj-text)" }}>Lista de compras</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--pj-text-muted)" }}>Organiza o que precisas antes de ir às compras</p>
          </div>
          <ChevronRight size={18} style={{ color: "var(--pj-text-faint)" }} className="flex-shrink-0" />
        </button>
      </div>

      {/* Poupa nas contas */}
      <div className="px-4 mb-5 anim-up anim-up-3">
        <SectionLabel icon={Lightbulb}>Poupa também nas contas</SectionLabel>
        <div className="flex flex-col gap-3">
          {LEADS_FINANCEIROS.map(lead => (
            <a
              key={lead.id}
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="press card p-4 flex items-center gap-4 text-left no-underline"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: lead.bg }}
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${lead.dominio}&sz=64`}
                  alt={lead.nome}
                  width={32}
                  height={32}
                  style={{ objectFit: "contain" }}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
                />
                <span style={{ display: "none", fontSize: 22 }}>{lead.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-black text-slate-800">{lead.nome}</p>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: lead.bg, color: lead.cor }}
                  >
                    {lead.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{lead.desc}</p>
                <p className="text-[10px] font-black mt-1" style={{ color: lead.cor }}>
                  {lead.cta} →
                </p>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Serviços de comparação gratuitos e sem compromisso
        </p>
      </div>

      {/* Desafios */}
      <DesafiosMensais setTab={setTab} />

    </div>
  );
}

/* ─── Leads financeiros ─── */
const LEADS_FINANCEIROS = [
  {
    id: "comparaja",
    nome: "ComparaJá",
    dominio: "comparaja.pt",
    emoji: "⚡",
    bg: "#fef3c7",
    cor: "var(--pj-cat-ocre)",
    badge: "Energia & Internet",
    desc: "Compara tarifas de eletricidade, gás, internet e seguros. Poupas centenas por ano sem sair de casa.",
    cta: "Comparar agora",
    url: "https://www.comparaja.pt/?ref=poupeja",
  },
  {
    id: "doutorfinancas",
    nome: "Doutor Finanças",
    dominio: "doutorfinancas.pt",
    emoji: "🏦",
    bg: "#eff6ff",
    cor: "var(--pj-cat-azul)",
    badge: "Crédito & Seguros",
    desc: "Simula crédito habitação, pessoal e seguros. Negociação gratuita com os melhores bancos.",
    cta: "Simular grátis",
    url: "https://www.doutorfinancas.pt/?ref=poupeja",
  },
];
