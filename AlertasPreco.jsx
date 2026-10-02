import { useState, useEffect } from "react";
import { Bell, BellRing, X, TrendingDown, ChartLine } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { estadoPush, ativarPush } from "./lib/push";
import { avaliarPreco } from "./lib/historicoPrecos";
import { N_COMPARADAS } from "./lib/cobertura";

/*
 * Alertas de preço e histórico do "Comparar preços".
 *
 * Os alertas vivem em poupeja_alertas_precos (sincronizado com a conta
 * pelo lib/sync). Quem os verifica é o /api/cron-avisos, uma vez por dia,
 * e o aviso chega por notificação — por isso criar um alerta pede
 * notificações logo ali, e não obriga a ir às Definições.
 */

const LS = "poupeja_alertas_precos";
const MAX_ALERTAS = 20;

export function lerAlertas() {
  try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; }
}
function guardarAlertas(lista) {
  try { localStorage.setItem(LS, JSON.stringify(lista.slice(0, MAX_ALERTAS))); } catch {}
}
export function alertaDe(q) {
  return lerAlertas().find((a) => a.q === q) || null;
}

/*
 * "Vigiar" um artigo da lista: sem preço-alvo. A referência é o melhor
 * preço de hoje; avisa quando descer ou entrar em promoção (lib/alertas).
 * Uma pesquisa tem um alerta só — vigiar substitui um alvo que lá estivesse.
 */
export function vigiar({ q, valor, unidade, modo, promo }) {
  const atual = lerAlertas();
  if (atual.length >= MAX_ALERTAS && !atual.some((a) => a.q === q)) return null;
  const novo = { id: Date.now(), q, tipo: "vigiar", referencia: valor, unidade, modo, promoNaCriacao: !!promo, criadoEm: new Date().toISOString() };
  guardarAlertas([novo, ...atual.filter((a) => a.q !== q)]);
  evento("alerta_preco_criado", { q, tipo: "vigiar", origem: "lista" });
  return novo;
}
export function deixarDeVigiar(q) {
  guardarAlertas(lerAlertas().filter((a) => a.q !== q));
  evento("alerta_preco_removido", { q, origem: "lista" });
}

const sufixo = (unidade) => (unidade === "embalagem" ? "" : `/${unidade}`);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dataCurta = (iso) => { const [, m, d] = String(iso).split("-"); return `${Number(d)} ${MESES[Number(m) - 1]}`; };

/* ── Histórico: mínimo, máximo e hoje, logo abaixo do preço ── */
const VEREDITO = {
  minimo: (dias) => `O preço mais baixo dos últimos ${dias} dias`,
  bom: () => "Bom preço face aos últimos 30 dias",
  normal: () => "Preço habitual nos últimos 30 dias",
  alto: () => "Acima do habitual nos últimos 30 dias",
};
export function LinhaHistorico({ historico, valorAtual, unidade }) {
  if (!historico?.minimo || valorAtual == null) return null;
  const min = historico.minimo.valor;
  const aval = avaliarPreco(valorAtual, historico);
  const destaque = aval === "minimo" || aval === "bom";
  const suf = sufixo(unidade);
  return (
    <div className="flex items-start gap-2 mt-3" style={{ padding: "8px 10px", borderRadius: 10, background: destaque ? "var(--pj-brand-wash)" : "var(--pj-surface)" }}>
      {destaque
        ? <TrendingDown size={15} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 1 }} />
        : <ChartLine size={15} style={{ color: "var(--pj-text-faint)", flexShrink: 0, marginTop: 1 }} />}
      <span style={{ fontSize: 12.5, lineHeight: 1.45, color: destaque ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
        {historico.maximo ? (
          <>
            <span style={{ display: "block", fontWeight: 600 }}>{VEREDITO[aval](historico.dias)}</span>
            <span className="pj-num" style={{ display: "block", color: "var(--pj-text-muted)" }}>
              Mín. {eur(min, 2)} € · Máx. {eur(historico.maximo.valor, 2)} € · Hoje {eur(valorAtual, 2)} €{suf}
            </span>
          </>
        ) : aval === "minimo"
          ? <span style={{ fontWeight: 600 }}>{VEREDITO.minimo(historico.dias)}</span>
          : <>Nos últimos 30 dias já esteve a <strong className="pj-num" style={{ color: "var(--pj-text)" }}>{eur(min, 2)} €{suf}</strong> ({dataCurta(historico.minimo.dia)})</>}
      </span>
    </div>
  );
}

/* ── Criar / editar o alerta de uma pesquisa ── */
export function CriarAlerta({ q, valorAtual, unidade, modo, onFechar, onGuardado }) {
  const existente = alertaDe(q);
  const sugestao = Math.max(0.01, Math.floor(valorAtual * 0.95 * 100) / 100);
  const [valor, setValor] = useState(String(existente?.alvo ?? sugestao).replace(".", ","));
  const [push, setPush] = useState("a-ver");
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => { estadoPush().then(setPush); }, []);

  const alvo = parseFloat(String(valor).replace(",", "."));
  const valido = alvo > 0 && alvo < 10000;

  async function guardar() {
    if (!valido) return;
    setAGuardar(true);
    let estado = push;
    if (estado === "inativo") estado = await ativarPush().catch(() => "inativo");
    setPush(estado);
    const novo = { id: existente?.id || Date.now(), q, alvo: Math.round(alvo * 100) / 100, unidade, modo, valorNaCriacao: valorAtual, criadoEm: new Date().toISOString() };
    guardarAlertas([novo, ...lerAlertas().filter((a) => a.q !== q)]);
    evento("alerta_preco_criado", { q });
    setAGuardar(false);
    onGuardado?.(novo, estado);
  }

  function apagar() {
    guardarAlertas(lerAlertas().filter((a) => a.q !== q));
    onGuardado?.(null);
  }

  return (
    <div className="mt-3" style={{ padding: 14, borderRadius: 14, background: "var(--pj-surface)", border: "1px solid var(--pj-border)" }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>Avisa-me quando baixar de</p>
        <button onClick={onFechar} aria-label="Fechar" className="pj-tap" style={{ background: "transparent", border: 0, padding: 2, color: "var(--pj-text-faint)" }}><X size={16} /></button>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <label className="flex items-center" style={{ flex: 1, minWidth: 0, background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "0 12px" }}>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
            aria-label="Preço alvo"
            className="pj-num"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: "none", fontSize: 18, fontWeight: 600, padding: "10px 0", color: "var(--pj-text)" }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)" }}>€{sufixo(unidade)}</span>
        </label>
        <button onClick={guardar} disabled={!valido || aGuardar} className="pj-tap press"
          style={{ flexShrink: 0, background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, fontWeight: 600, opacity: valido ? 1 : 0.5 }}>
          {existente ? "Atualizar" : "Criar alerta"}
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
        Hoje está a {eur(valorAtual, 2)} €{sufixo(unidade)}. Verificamos todos os dias nos {N_COMPARADAS} supermercados comparados e mandamos uma notificação quando baixar.
        {push === "bloqueado" && " As notificações estão bloqueadas neste telemóvel — ativa-as nas definições do sistema para receberes o aviso."}
        {push === "sem-suporte" && " Este browser não recebe notificações; instala a app para receberes o aviso."}
      </p>
      {existente && (
        <button onClick={apagar} className="pj-tap mt-2" style={{ background: "transparent", border: 0, padding: 0, fontSize: 12, fontWeight: 600, color: "var(--pj-danger)" }}>
          Apagar este alerta
        </button>
      )}
    </div>
  );
}

/* ── Os teus alertas (no ecrã inicial do Comparar) ── */
export function ListaAlertas({ onAbrir }) {
  const [alertas, setAlertas] = useState([]);
  useEffect(() => { setAlertas(lerAlertas()); }, []);
  if (!alertas.length) return null;

  function apagar(q) {
    const l = lerAlertas().filter((a) => a.q !== q);
    guardarAlertas(l);
    setAlertas(l);
    evento("alerta_preco_removido", { q, origem: "comparar" });
  }

  return (
    <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 18, overflow: "hidden" }}>
      <p className="flex items-center gap-1.5" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)", padding: "14px 16px 6px" }}>
        <BellRing size={15} style={{ color: "var(--pj-brand-ink)" }} /> Os teus alertas de preço
      </p>
      {alertas.map((a) => (
        <div key={a.id} className="flex items-center gap-3" style={{ padding: "9px 16px", borderTop: "1px solid var(--pj-subtle)" }}>
          <button onClick={() => onAbrir(a.q)} className="pj-tap flex-1 min-w-0 text-left" style={{ background: "transparent", border: 0, padding: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{a.q.charAt(0).toUpperCase() + a.q.slice(1)}</span>
            <span className="pj-num" style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 1 }}>
              {a.tipo === "vigiar"
                ? `A vigiar · avisamos se descer de ${eur(a.referencia, 2)} €${sufixo(a.unidade)}`
                : `Avisar abaixo de ${eur(a.alvo, 2)} €${sufixo(a.unidade)}`}
            </span>
          </button>
          <button onClick={() => apagar(a.q)} aria-label={`Apagar alerta de ${a.q}`} className="pj-tap flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 9, background: "var(--pj-subtle)", border: 0, color: "var(--pj-text-muted)" }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* Botão do cartão do vencedor. */
export function BotaoAlerta({ ativo, aberto, onClick }) {
  return (
    <button onClick={onClick} aria-expanded={aberto} aria-label={ativo ? "Alerta de preço ativo" : "Criar alerta de preço"}
      className="pj-tap press flex items-center justify-center gap-1.5"
      style={{ background: ativo ? "var(--pj-brand-wash)" : "var(--pj-subtle)", color: ativo ? "var(--pj-brand-ink)" : "var(--pj-text)", fontSize: 13.5, fontWeight: 600, padding: "11px 13px", borderRadius: 12, border: 0 }}>
      {ativo ? <BellRing size={15} /> : <Bell size={15} />}
    </button>
  );
}
