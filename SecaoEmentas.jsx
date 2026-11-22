import { useEffect, useMemo, useState } from "react";
import { Clock, ChefHat, Leaf, Lock, Unlock, RefreshCw, ShoppingCart, Check, Sparkles, SlidersHorizontal, ChevronDown, Star, CalendarDays, RotateCcw, Minus, Plus, ThumbsDown } from "lucide-react";
import {
  receitas, receitaPorId, compativel, gerarPlano, regenerar, trocarDia, alternarFixa, comprasDoPlano,
  mediaDoPlano, porcoesNoPlano, sugestaoDaSemana, formatarTempo, DIAS, DIETAS, VONTADES, EQUIPAMENTOS,
  rejeitar, ajustarDia, dosesDoDia, MODOS_TROCA, MAX_CONVIDADOS, almocoDe, marmitasDoPlano,
} from "./lib/receitas/motor";
import DespensaReceitas from "./DespensaReceitas";
import ReceitaDetalhe, { BadgeCusto, lerAvaliacoes, CustosReceitas } from "./ReceitaDetalhe";
import { adicionarALista } from "./lib/receitas/paraLista";
import EmentasAssistente from "./EmentasAssistente";
import { marcarEmentasVistas, Azulejos } from "./DestaqueEmentas";
import CompararLista from "./CompararLista";
import { MAX_ARTIGOS } from "./lib/listaCompras";
import { evento } from "./lib/analytics";
import { avaliarOrcamento } from "./lib/orcamentoLista";
import { eur } from "./lib/formato";

/*
 * Ementas — o plano da semana feito à medida e todas as receitas.
 *
 * Fluxo: seis perguntas (EmentasAssistente) → plano de jantares, com
 * sopa → cada dia pode ficar fixo ou ser trocado ("outra proteína", "mais
 * rápido", "não gosto") e ajustado à vida real (janta-se fora, há
 * convidados, cozinha-se a dobrar para a marmita) → as compras do plano,
 * somadas e sem o que já há em casa, entram na Lista de Compras num toque
 * e são comparadas nos supermercados com preços reais. Nada de "custa 5,32 €" inventado: o
 * plano usa faixas (€/€€/€€€) e o preço a sério vem da comparação.
 *
 * Fica tudo no dispositivo (preferências, plano, despensa e estrelas).
 */

const LS_PREFS = "poupeja_ementas_prefs";
const LS_PLANO = "poupeja_ementas_plano";
const LS_DESPENSA = "poupeja_despensa";
const ROT = "text-[11px] font-semibold uppercase tracking-[0.09em]";

const ler = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const gravar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* Segunda-feira da semana de uma data (para saber se o plano é desta semana). */
function segunda(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
}

function Meta({ r, claro = false }) {
  const cor = claro ? "rgba(255,255,255,0.75)" : "var(--pj-text-muted)";
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5" style={{ fontSize: 12, color: cor }}>
      <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatarTempo(r.tempoMin)}</span>
      <BadgeCusto custo={r.custo} claro={claro} id={r.id} un={r.un} />
      <span className="tabular-nums">{r.nutricao.kcal} kcal</span>
      {r.vegano ? <span className="inline-flex items-center gap-1"><Leaf size={11} /> vegano</span>
        : r.veg ? <span className="inline-flex items-center gap-1"><Leaf size={11} /> veggie</span> : null}
    </span>
  );
}

function CartaoReceita({ r, onAbrir, estrelas, destaque }) {
  return (
    <button onClick={() => onAbrir(r)} className="pj-tap press w-full text-left rounded-2xl p-3.5 flex items-center gap-3.5"
      style={destaque ? { background: "var(--pj-brand)" } : { background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 26, width: 48, height: 48, borderRadius: 14, background: destaque ? "rgba(255,255,255,0.12)" : "var(--pj-surface)" }}>{r.emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {destaque && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#a7cbbb" }}>
            <Sparkles size={10} /> Sugestão da semana
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold" style={{ fontSize: 14.5, color: destaque ? "#fff" : "var(--pj-text)" }}>{r.nome}</span>
          {estrelas ? <span className="inline-flex items-center gap-0.5 flex-shrink-0" style={{ fontSize: 11, color: destaque ? "#fff" : "var(--pj-text-muted)" }}><Star size={10} fill="#e0a526" style={{ color: "#e0a526" }} />{estrelas}</span> : null}
        </span>
        <Meta r={r} claro={destaque} />
      </span>
    </button>
  );
}

const ETIQUETA = { padding: "2px 8px", borderRadius: 8, background: "var(--pj-accent-wash)", color: "var(--pj-accent)" };

/*
 * Um dia do plano: a receita, e os botões fixar / trocar. Nos jantares,
 * "Ajustar" abre o painel do dia (`painel`): trocas com intenção, jantar
 * fora, convidados e cozinhar a dobrar.
 */
function DiaPlano({ rotulo, r, entrada, nota, almoco, onAbrir, onAbrirAlmoco, onFixar, onTrocar, onAjustar, ajustando, painel }) {
  if (!r) return null;
  const fixa = !!entrada.fixa;
  return (
    <div>
      {(rotulo || entrada.repetida) && (
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-strong)" }}>
            {rotulo}
            {entrada.repetida && <span className="text-[10.5px] font-semibold" style={ETIQUETA}>repete · cozinha a dobrar</span>}
            {entrada.fora && <span className="text-[10.5px] font-semibold" style={ETIQUETA}>jantar fora</span>}
            {!entrada.fora && entrada.dobro && <span className="text-[10.5px] font-semibold" style={ETIQUETA}>a dobrar · marmita</span>}
            {!entrada.fora && entrada.extra > 0 && <span className="text-[10.5px] font-semibold" style={ETIQUETA}>+{entrada.extra} convidado{entrada.extra > 1 ? "s" : ""}</span>}
          </p>
          {onAjustar && (
            <button onClick={onAjustar} aria-expanded={!!ajustando} className="pj-tap flex-shrink-0 inline-flex items-center gap-0.5 text-[12px] font-semibold"
              style={{ minHeight: 32, padding: "0 6px", background: "none", border: 0, color: "var(--pj-text-muted)" }}>
              Ajustar <ChevronDown size={13} style={{ transform: ajustando ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
          )}
        </div>
      )}
      {almoco && (
        <button onClick={onAbrirAlmoco} className="pj-tap w-full text-left flex items-center gap-2 mb-1.5 px-3 py-2 rounded-xl"
          style={{ background: "var(--pj-brand-wash)", border: 0, fontSize: 12.5, color: "var(--pj-brand-ink)" }}>
          <span aria-hidden="true">🥡</span>
          <span style={{ minWidth: 0 }}><strong>Almoço:</strong> marmita de {almoco.nome.charAt(0).toLowerCase() + almoco.nome.slice(1)} (jantar de ontem)</span>
        </button>
      )}
      <div className="rounded-2xl flex items-center" style={{ background: "var(--pj-card)", border: `1px solid ${fixa ? "var(--pj-brand)" : "var(--pj-border)"}`, opacity: entrada.fora ? 0.55 : 1 }}>
        <button onClick={() => onAbrir(r)} className="pj-tap press flex-1 text-left flex items-center gap-3 p-3" style={{ minWidth: 0, background: "none", border: 0 }}>
          <span className="flex items-center justify-center flex-shrink-0" style={{ fontSize: 26, width: 48, height: 48, borderRadius: 14, background: "var(--pj-surface)" }}>{r.emoji}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="block font-semibold" style={{ fontSize: 14.5, lineHeight: 1.3, color: "var(--pj-text)" }}>{r.nome}</span>
            <Meta r={r} />
            {nota && <span className="block mt-0.5" style={{ fontSize: 11.5, color: "var(--pj-text-faint)" }}>{nota}</span>}
          </span>
        </button>
        <div className="flex flex-col pr-1.5" style={{ gap: 2 }}>
          <button onClick={onFixar} aria-pressed={fixa} aria-label={fixa ? `Desafixar ${r.nome}` : `Fixar ${r.nome} (fica ao gerar de novo)`}
            className="pj-tap flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: fixa ? "var(--pj-brand-wash)" : "transparent", border: 0 }}>
            {fixa ? <Lock size={16} style={{ color: "var(--pj-brand-ink)" }} /> : <Unlock size={16} style={{ color: "var(--pj-text-faint)" }} />}
          </button>
          <button onClick={onTrocar} disabled={fixa} aria-label={`Trocar ${r.nome} por outra receita`}
            className="pj-tap flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "transparent", border: 0, opacity: fixa ? 0.3 : 1 }}>
            <RefreshCw size={16} style={{ color: "var(--pj-text-muted)" }} />
          </button>
        </div>
      </div>
      {ajustando && painel}
    </div>
  );
}

const CHIP = { minHeight: 38, padding: "0 12px", borderRadius: 12, fontSize: 12.5, fontWeight: 600 };
const chip = (ativo) => ({
  ...CHIP,
  border: `1px solid ${ativo ? "var(--pj-brand)" : "var(--pj-border)"}`,
  background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)",
  color: ativo ? "var(--pj-brand-ink)" : "var(--pj-text-strong)",
});

/* O painel "Ajustar" de um jantar. */
function AjustesDia({ plano, entrada, r, semTroca, onTrocar, onNaoGosto, onAjustar }) {
  const fora = !!entrada.fora;
  const extra = entrada.extra || 0;
  const doses = dosesDoDia(plano, entrada);
  return (
    <div className="mt-2 rounded-2xl p-3.5" style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)" }}>
      <p className={ROT} style={{ color: "var(--pj-text-faint)" }}>Trocar por</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {MODOS_TROCA.map((m) => (
          <button key={m.id} onClick={() => onTrocar(m.id)} disabled={!!entrada.fixa} className="pj-tap press" style={{ ...chip(false), opacity: entrada.fixa ? 0.4 : 1 }}>{m.nome}</button>
        ))}
        <button onClick={onNaoGosto} className="pj-tap press inline-flex items-center gap-1.5" style={chip(false)}
          aria-label={`Não gosto de ${r.nome}: trocar e não voltar a sugerir`}>
          <ThumbsDown size={13} /> Não gosto
        </button>
      </div>
      {semTroca && (
        <p className="mt-2" role="status" style={{ fontSize: 12, color: "var(--pj-accent)", lineHeight: 1.45 }}>
          Não há outra receita assim que sirva às tuas preferências.
        </p>
      )}
      {entrada.fixa && <p className="mt-2" style={{ fontSize: 11.5, color: "var(--pj-text-faint)" }}>Está fixada: desafixa para trocar.</p>}

      <p className={`${ROT} mt-4`} style={{ color: "var(--pj-text-faint)" }}>Este jantar</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={() => onAjustar({ fora: !fora })} aria-pressed={fora} className="pj-tap press" style={chip(fora)}>{fora ? "✓ " : ""}Janto fora</button>
        <button onClick={() => onAjustar({ dobro: !entrada.dobro })} aria-pressed={!!entrada.dobro} disabled={fora} className="pj-tap press" style={{ ...chip(!!entrada.dobro), opacity: fora ? 0.4 : 1 }}>
          {entrada.dobro ? "✓ " : ""}A dobrar, para a marmita
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 mt-3" style={{ opacity: fora ? 0.4 : 1 }}>
        <span style={{ fontSize: 13, color: "var(--pj-text-strong)", fontWeight: 600 }}>Convidados</span>
        <span className="inline-flex items-center gap-1">
          <button onClick={() => onAjustar({ extra: extra - 1 })} disabled={fora || extra <= 0} aria-label="Menos um convidado" className="pj-tap press flex items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid var(--pj-border)", background: "var(--pj-card)", opacity: extra <= 0 ? 0.4 : 1 }}><Minus size={15} /></button>
          <span className="tabular-nums text-center" aria-live="polite" style={{ width: 28, fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{extra}</span>
          <button onClick={() => onAjustar({ extra: extra + 1 })} disabled={fora || extra >= MAX_CONVIDADOS} aria-label="Mais um convidado" className="pj-tap press flex items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid var(--pj-border)", background: "var(--pj-card)", opacity: extra >= MAX_CONVIDADOS ? 0.4 : 1 }}><Plus size={15} /></button>
        </span>
      </div>
      <p className="mt-2.5" style={{ fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.5 }}>
        {fora ? "Sem compras para este dia. A receita fica guardada para outra altura."
          : `Cozinhas ${doses} dose${doses !== 1 ? "s" : ""}${entrada.dobro ? `: ${doses / 2} ao jantar e ${doses / 2} para o dia seguinte` : ""}. As compras acompanham.`}
      </p>
    </div>
  );
}

/* "Rende 10 fatias", "Para 3 dias" — por baixo de um pequeno-almoço ou sobremesa no plano. */
function notaExtra(r, alvo) {
  if (!r) return null;
  if (r.un !== "pessoas") return `Rende ${r.porcoes} ${r.un}`;
  return alvo === "manha" ? "Para 2 ou 3 manhãs" : null;
}

function resumoPrefs(p) {
  const partes = [`${p.pessoas} pessoa${p.pessoas > 1 ? "s" : ""}`, `${p.jantares} jantares`, `até ${p.orcamento} €`];
  const nomes = [
    ...DIETAS.filter((d) => p.dietas.includes(d.id)).map((d) => d.nome.toLowerCase()),
    ...VONTADES.filter((v) => p.vontades.includes(v.id)).map((v) => v.nome.toLowerCase()),
  ];
  return [...partes, ...nomes].join(" · ");
}

export default function SecaoEmentas(props) {
  return <CustosReceitas.Provider value={props.custos || null}><SecaoEmentasConteudo {...props} /></CustosReceitas.Provider>;
}

function SecaoEmentasConteudo({ setTab }) {
  const [prefs, setPrefs] = useState(null);
  const [plano, setPlano] = useState(null);
  const [aval, setAval] = useState({});
  const [assistente, setAssistente] = useState(false);
  const [aberta, setAberta] = useState(null); // { r, legenda, pessoas }
  const [filtro, setFiltro] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [soMinhas, setSoMinhas] = useState(true);
  const [verCompras, setVerCompras] = useState(false);
  const [naLista, setNaLista] = useState(0);
  const [tenho, setTenho] = useState([]); // chaves dos ingredientes que há em casa
  const [ajustar, setAjustar] = useState(null); // o dia com o painel "Ajustar" aberto
  const [semTroca, setSemTroca] = useState(null);

  useEffect(() => {
    marcarEmentasVistas();
    setPrefs(ler(LS_PREFS));
    setPlano(ler(LS_PLANO));
    setAval(lerAvaliacoes());
    const d = ler(LS_DESPENSA);
    setTenho(Array.isArray(d) ? d : []);
  }, []);

  function guardarDespensa(keys) {
    setTenho(keys);
    gravar(LS_DESPENSA, keys.length ? keys : null);
    setNaLista(0);
  }
  const alternarTenho = (key) => guardarDespensa(tenho.includes(key) ? tenho.filter((k) => k !== key) : [...tenho, key]);

  /* Troca com intenção; se não houver nenhuma que sirva, diz-se (o plano não muda). */
  function trocarCom(dia, modo) {
    const novo = trocarDia(plano, dia, { avaliacoes: aval, modo });
    setSemTroca(novo === plano ? dia : null);
    if (novo !== plano) guardarPlano(novo);
    evento("ementas_plano", { acao: "trocar", modo });
  }

  /* "Não gosto": fica nas preferências, para nenhum plano futuro a trazer de volta. */
  function guardarRejeitadas(novo) {
    guardarPlano(novo);
    const p = { ...(prefs || novo.prefs), rejeitadas: novo.prefs.rejeitadas || [] };
    setPrefs(p);
    gravar(LS_PREFS, p);
  }
  function naoGosto(dia) {
    setSemTroca(null);
    guardarRejeitadas(rejeitar(plano, dia, { avaliacoes: aval }));
    evento("ementas_plano", { acao: "nao_gosto" });
  }
  function reporRejeitadas() {
    const p = { ...prefs, rejeitadas: [] };
    setPrefs(p);
    gravar(LS_PREFS, p);
    if (plano) guardarPlano({ ...plano, prefs: { ...plano.prefs, rejeitadas: [] } });
  }

  function guardarPlano(p) {
    setPlano(p);
    gravar(LS_PLANO, p);
    setNaLista(0);
  }

  /*
   * Começar do zero: apaga o plano E as escolhas do assistente (pessoas,
   * orçamento, restrições, aparelhos), para voltar à apresentação inicial.
   * As estrelas das receitas ficam — são o gosto da pessoa, não o plano.
   * Dois toques, para um toque sem querer não deitar a semana fora.
   */
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => {
    if (!confirmar) return;
    const t = setTimeout(() => setConfirmar(false), 4000);
    return () => clearTimeout(t);
  }, [confirmar]);
  function recomecar() {
    if (!confirmar) { setConfirmar(true); return; }
    setConfirmar(false);
    guardarPlano(null);
    setPrefs(null);
    gravar(LS_PREFS, null);
    setSoMinhas(true);
    setAjustar(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    evento("ementas_plano", { acao: "recomecar" });
  }

  function concluirAssistente(p) {
    setPrefs(p);
    gravar(LS_PREFS, p);
    // Mudou as preferências com um plano aberto: os dias fixados ficam, se ainda servirem.
    const novo = plano
      ? regenerar({ ...plano, dias: plano.dias.filter((d) => !d.fixa || (receitaPorId(d.id) && compativel(receitaPorId(d.id), p))) }, { prefs: p, avaliacoes: aval })
      : gerarPlano(p, { avaliacoes: aval });
    guardarPlano(novo);
    setAssistente(false);
    evento("ementas_plano", { acao: plano ? "editar" : "criar", jantares: p.jantares, pessoas: p.pessoas });
  }

  const compras = useMemo(() => (plano ? comprasDoPlano(plano, { tenho }) : []), [plano, tenho]);
  const aComprar = compras.filter((c) => !c.despensa && !c.emCasa);
  const jaEmCasa = compras.filter((c) => !c.despensa && c.emCasa).length;
  const rejeitadas = prefs?.rejeitadas || [];
  const marmitas = plano ? marmitasDoPlano(plano) : [];
  // O total real (a loja mais barata) só vale para a lista que foi comparada.
  const chaveCompras = aComprar.map((c) => c.key).join();
  const [resumo, setResumo] = useState(null); // { chave, loja, nome, total, artigos }
  const real = resumo?.chave === chaveCompras ? resumo : null;
  const conta = real && plano ? avaliarOrcamento(real.total, plano.prefs.orcamento) : null;
  const media = plano ? mediaDoPlano(plano) : null;
  const antigo = plano && segunda(plano.criadoEm) < segunda(Date.now());

  async function comprasParaLista() {
    const n = await adicionarALista(aComprar);
    setNaLista(n || -1);
    evento("ementas_plano", { acao: "lista", artigos: aComprar.length });
  }

  function abrir(r, extra = {}) {
    // Bolos, pão, iogurtes: abrem com o que a receita rende; o resto, para as pessoas da casa.
    const pessoas = r.un === "pessoas" ? prefs?.pessoas || r.porcoes : r.porcoes;
    setAberta({ r, pessoas, ...extra });
  }
  function fecharDetalhe() {
    setAberta(null);
    setAval(lerAvaliacoes());
  }

  // ── Todas as receitas
  const FILTROS = [
    { id: "todas", label: "Todas" },
    { id: "baratas", label: "€ mais baratas" },
    { id: "rapidas", label: "≤ 25 min" },
    { id: "leves", label: "Leves" },
    { id: "veg", label: "Vegetariano" },
    { id: "airfryer", label: "Air fryer" },
  ];
  const sugestao = sugestaoDaSemana();
  const CATEGORIAS = [
    { id: "todas", label: "Todas" },
    { id: "prato", label: "Jantares" },
    { id: "sopa", label: "Sopas" },
    { id: "pequeno-almoco", label: "Pequeno-almoço" },
    { id: "sobremesa", label: "Sobremesas" },
  ];
  const visiveis = receitas().filter((r) => {
    if (prefs && soMinhas && !compativel(r, prefs)) return false;
    if (categoria !== "todas" && r.tipo !== categoria) return false;
    if (filtro === "baratas") return r.custo === 1;
    if (filtro === "rapidas") return r.tempoMin <= 25;
    if (filtro === "leves") return r.vontades.includes("leve");
    if (filtro === "sopas") return r.tipo === "sopa";
    if (filtro === "veg") return r.veg;
    if (filtro === "airfryer") return r.airfryer;
    return true;
  });

  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="mx-4 mb-4">
        <p className={ROT} style={{ color: "var(--pj-text-faint)" }}>Cozinha económica</p>
        <p className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--pj-text)", marginTop: 4 }}>
          {plano ? "O teu plano da semana" : "Ementas da semana"}
        </p>
        {plano ? (
          <div className="flex items-start justify-between gap-3 mt-1">
            <p className="text-xs" style={{ color: "var(--pj-text-muted)" }}>{resumoPrefs(plano.prefs)}</p>
            <button onClick={recomecar} className="pj-tap press flex-shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ minHeight: 32, padding: "0 10px", borderRadius: 10, border: 0,
                background: confirmar ? "var(--pj-danger-wash)" : "var(--pj-subtle)", color: confirmar ? "var(--pj-danger-strong)" : "var(--pj-text-strong)" }}>
              <RotateCcw size={12} /> {confirmar ? "Tocar de novo para apagar" : "Começar do zero"}
            </button>
          </div>
        ) : (
          <p className="text-xs mt-1" style={{ color: "var(--pj-text-muted)" }}>Receitas baratas, à medida da tua casa — e as compras entram na lista num toque.</p>
        )}
        <div className="mt-4" style={{ height: 1, background: "var(--pj-border)" }} />
      </div>

      {/* Sem plano: o convite */}
      {!plano && (
        <div className="mx-4 mb-6 rounded-3xl overflow-hidden" style={{ background: "var(--pj-brand)", boxShadow: "0 8px 24px rgba(11,107,79,0.25)" }}>
          <Azulejos altura={28} />
          <div className="p-5">
          <p className="font-display" style={{ fontSize: 21, fontWeight: 600, color: "#fff", lineHeight: 1.25 }}>Planeia os jantares da semana em 1 minuto</p>
          <ul className="mt-3 flex flex-col gap-1.5" style={{ fontSize: 13, color: "#d5e7de", paddingLeft: 0, listStyle: "none" }}>
            <li>✓ Para quantos cozinhas e quanto queres gastar</li>
            <li>✓ Sem o que não comes — vegano, sem glúten, sem lactose…</li>
            <li>✓ Lista de compras somada e preços reais nos supermercados</li>
          </ul>
          <button onClick={() => setAssistente(true)} className="pj-tap press w-full mt-5 flex items-center justify-center gap-2"
            style={{ minHeight: 52, borderRadius: 16, fontSize: 15, fontWeight: 600, background: "#fff", color: "var(--pj-brand-ink)", border: 0 }}>
            <CalendarDays size={17} /> Criar o meu plano
          </button>
          </div>
        </div>
      )}

      {/* O plano */}
      {plano && (
        <div className="mx-4 mb-8">
          {antigo && (
            <div className="mb-4 rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "var(--pj-accent-wash)" }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--pj-accent)", lineHeight: 1.45 }}>Este plano é de uma semana anterior.</span>
              <button onClick={() => guardarPlano(regenerar(plano, { avaliacoes: aval }))} className="pj-tap press flex-shrink-0 text-[13px] font-semibold"
                style={{ minHeight: 40, padding: "0 12px", borderRadius: 12, background: "var(--pj-card)", color: "var(--pj-accent)", border: 0 }}>
                Novo plano
              </button>
            </div>
          )}

          {media && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { v: media.kcal, l: "kcal / jantar" },
                { v: `${media.p} g`, l: "proteína" },
                { v: `${String(media.fib).replace(".", ",")} g`, l: "fibra" },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl py-2.5 text-center" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                  <p className="font-display tabular-nums" style={{ fontSize: 17, fontWeight: 600, color: "var(--pj-text)" }}>{x.v}</p>
                  <p style={{ fontSize: 10.5, color: "var(--pj-text-muted)" }}>{x.l}</p>
                </div>
              ))}
            </div>
          )}

          <p className="mb-4" style={{ fontSize: 12, color: "var(--pj-text-faint)", lineHeight: 1.5 }}>
            <Lock size={11} className="inline -mt-0.5" /> fixa as que queres manter · <RefreshCw size={11} className="inline -mt-0.5" /> troca por outra · <strong>Ajustar</strong>: jantar fora, convidados, marmita
          </p>

          <div className="flex flex-col gap-4">
            {plano.dias.map((d) => (
              <DiaPlano key={d.dia} rotulo={DIAS[d.dia]} r={receitaPorId(d.id)} entrada={d}
                almoco={receitaPorId(almocoDe(plano, d.dia))}
                onAbrirAlmoco={() => { const r = receitaPorId(almocoDe(plano, d.dia)); if (r) abrir(r, { legenda: `Almoço de ${DIAS[d.dia]}`, pessoas: plano.prefs.pessoas + (plano.dias.find((x) => x.dia === (d.dia + 6) % 7)?.extra || 0) }); }}
                nota={d.dobro && !d.fora ? `Metade fica para o almoço de ${DIAS[(d.dia + 1) % 7]}` : null}
                onAbrir={(r) => abrir(r, { legenda: DIAS[d.dia], pessoas: dosesDoDia(plano, d) || plano.prefs.pessoas })}
                onFixar={() => guardarPlano(alternarFixa(plano, d.dia))}
                onTrocar={() => { setSemTroca(null); guardarPlano(trocarDia(plano, d.dia, { avaliacoes: aval })); evento("ementas_plano", { acao: "trocar" }); }}
                onAjustar={() => { setSemTroca(null); setAjustar(ajustar === d.dia ? null : d.dia); }}
                ajustando={ajustar === d.dia}
                painel={(
                  <AjustesDia plano={plano} entrada={d} r={receitaPorId(d.id)} semTroca={semTroca === d.dia}
                    onTrocar={(modo) => trocarCom(d.dia, modo)}
                    onNaoGosto={() => naoGosto(d.dia)}
                    onAjustar={(m) => { guardarPlano(ajustarDia(plano, d.dia, m)); evento("ementas_plano", { acao: "ajustar", o_que: Object.keys(m)[0] }); }} />
                )} />
            ))}
            {plano.sopa && (
              <DiaPlano rotulo="Sopa da semana" r={receitaPorId(plano.sopa.id)} entrada={plano.sopa}
                nota={`Uma panela para ${porcoesNoPlano(plano, "sopa")} tigelas`}
                onAbrir={(r) => abrir(r, { legenda: "Sopa da semana", pessoas: porcoesNoPlano(plano, "sopa") })}
                onFixar={() => guardarPlano(alternarFixa(plano, "sopa"))}
                onTrocar={() => guardarPlano(trocarDia(plano, "sopa", { avaliacoes: aval }))} />
            )}
            {(plano.manha || []).map((m, i) => (
              <DiaPlano key={`manha-${i}`} rotulo={i === 0 ? "Pequenos-almoços (alterna entre estes)" : null} r={receitaPorId(m.id)} entrada={m}
                nota={notaExtra(receitaPorId(m.id), "manha")}
                onAbrir={(r) => abrir(r, { legenda: "Pequeno-almoço", pessoas: porcoesNoPlano(plano, "manha", r) })}
                onFixar={() => guardarPlano(alternarFixa(plano, `manha-${i}`))}
                onTrocar={() => guardarPlano(trocarDia(plano, `manha-${i}`, { avaliacoes: aval }))} />
            ))}
            {plano.sobremesa && (
              <DiaPlano rotulo="Sobremesa do fim de semana" r={receitaPorId(plano.sobremesa.id)} entrada={plano.sobremesa}
                nota={notaExtra(receitaPorId(plano.sobremesa.id), "sobremesa")}
                onAbrir={(r) => abrir(r, { legenda: "Sobremesa do fim de semana", pessoas: r.porcoes })}
                onFixar={() => guardarPlano(alternarFixa(plano, "sobremesa"))}
                onTrocar={() => guardarPlano(trocarDia(plano, "sobremesa", { avaliacoes: aval }))} />
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={() => { guardarPlano(regenerar(plano, { avaliacoes: aval })); evento("ementas_plano", { acao: "regenerar" }); }}
              className="pj-tap press flex-1 flex items-center justify-center gap-1.5"
              style={{ minHeight: 46, borderRadius: 14, fontSize: 13, fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-strong)", border: 0 }}>
              <RefreshCw size={14} /> Gerar de novo
            </button>
            <button onClick={() => setAssistente(true)} className="pj-tap press flex-1 flex items-center justify-center gap-1.5"
              style={{ minHeight: 46, borderRadius: 14, fontSize: 13, fontWeight: 600, background: "var(--pj-subtle)", color: "var(--pj-text-strong)", border: 0 }}>
              <SlidersHorizontal size={14} /> Preferências
            </button>
          </div>

          {/* Compras do plano */}
          <p className={`${ROT} mt-8 mb-2`} style={{ color: "var(--pj-text-faint)" }}>Compras do plano</p>
          <div className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
            <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
              <strong>{aComprar.length} artigos</strong> para {[
                `${plano.dias.filter((d) => d.id && !d.fora).length} jantares`,
                plano.sopa && "a sopa",
                plano.manha?.length && "os pequenos-almoços",
                plano.sobremesa && "a sobremesa",
              ].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " e $1")}{marmitas.length > 0 && ` (${marmitas.length === 1 ? "um a dobrar, com a marmita" : `${marmitas.length} a dobrar, com as marmitas`} do dia seguinte)`} — já somados entre receitas{jaEmCasa > 0 && `, sem ${jaEmCasa === 1 ? "o artigo" : `os ${jaEmCasa} artigos`} que já tens em casa`}.
            </p>
            {naLista !== 0 ? (
              <div className="mt-3">
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: "var(--pj-brand-wash)" }}>
                  <Check size={15} style={{ color: "var(--pj-brand-ink)" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--pj-brand-ink)" }}>
                    {naLista === -1 ? "Já estavam todos na lista" : `${naLista} artigo${naLista !== 1 ? "s" : ""} na lista`}
                  </span>
                </div>
                <button onClick={() => setTab?.("lista")} className="pj-tap w-full py-3 mt-2 rounded-2xl font-semibold text-[13.5px]" style={{ background: "var(--pj-brand)", color: "#fff", border: 0 }}>
                  Ver a lista de compras →
                </button>
              </div>
            ) : (
              <button onClick={comprasParaLista} className="pj-tap press w-full mt-3 flex items-center justify-center gap-2"
                style={{ minHeight: 50, borderRadius: 16, fontSize: 14.5, fontWeight: 600, background: "var(--pj-brand)", color: "#fff", border: 0 }}>
                <ShoppingCart size={16} /> Pôr tudo na lista de compras
              </button>
            )}
            <button onClick={() => setVerCompras(!verCompras)} aria-expanded={verCompras}
              className="pj-tap w-full mt-2 flex items-center justify-center gap-1 text-[12.5px] font-semibold"
              style={{ minHeight: 40, background: "none", border: 0, color: "var(--pj-text-muted)" }}>
              {verCompras ? "Esconder quantidades" : "Ver quantidades e marcar o que já tenho"} <ChevronDown size={14} style={{ transform: verCompras ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {verCompras && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--pj-subtle)" }}>
                {compras.map((c, i) => {
                  const fora = c.despensa || c.emCasa;
                  const linha = (
                    <>
                      {!c.despensa && (
                        <span className="flex items-center justify-center flex-shrink-0" aria-hidden="true"
                          style={{ width: 20, height: 20, marginTop: 1, borderRadius: 6, border: `1.5px solid ${c.emCasa ? "var(--pj-brand)" : "var(--pj-border)"}`, background: c.emCasa ? "var(--pj-brand)" : "transparent" }}>
                          {c.emCasa && <Check size={13} style={{ color: "#fff" }} />}
                        </span>
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="block" style={{ fontSize: 13, fontWeight: fora ? 500 : 600, color: fora ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                          {c.nome}{c.despensa ? " · despensa" : c.emCasa ? " · já tenho" : ""}
                        </span>
                        <span className="block truncate" style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>{c.receitas.join(", ")}</span>
                      </span>
                      <span className="flex-shrink-0 tabular-nums" style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>{c.qtd}</span>
                    </>
                  );
                  const estilo = { border: 0, borderTop: i > 0 ? "1px solid var(--pj-subtle)" : 0 };
                  return c.despensa ? (
                    <div key={c.key} className="flex items-start gap-3 px-3 py-2" style={estilo}>{linha}</div>
                  ) : (
                    <button key={c.key} onClick={() => alternarTenho(c.key)} aria-pressed={c.emCasa}
                      aria-label={`${c.nome}, ${c.qtd}: ${c.emCasa ? "já tenho em casa" : "marcar como já tenho em casa"}`}
                      className="pj-tap w-full text-left flex items-start gap-3 px-3 py-2.5" style={{ ...estilo, background: "none" }}>
                      {linha}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preço real */}
          <p className={`${ROT} mt-6 mb-2`} style={{ color: "var(--pj-text-faint)" }}>Quanto custa, a sério?</p>
          <p className="mb-3" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            O teu orçamento: <strong style={{ color: "var(--pj-text)" }}>{plano.prefs.orcamento} €</strong>. Comparamos estes artigos nos supermercados, com os preços de hoje.
          </p>
          {/* key: um plano novo começa uma comparação nova */}
          <CompararLista key={chaveCompras} itens={aComprar.map((c, i) => ({ id: `plano-${i}`, nome: c.compra || c.nome, qty: 1 }))}
            onResumo={(r) => setResumo(r ? { ...r, chave: chaveCompras } : null)} />
          {conta && (
            <div className="mt-3 rounded-2xl p-4" role="status" style={{ background: conta.dentro ? "var(--pj-brand-wash)" : "var(--pj-accent-wash)" }}>
              <p className="font-display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.3, color: conta.dentro ? "var(--pj-brand-ink)" : "var(--pj-accent)" }}>
                {conta.dentro
                  ? (conta.diferenca >= 0.01 ? `Cabe no orçamento: sobram ${eur(conta.diferenca, 2)} €` : "Cabe à justa no orçamento")
                  : `Passa o orçamento em ${eur(conta.diferenca, 2)} €`}
              </p>
              <div className="relative mt-3" aria-hidden="true" style={{ height: 10 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "var(--pj-card)" }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${conta.larguraTotal}%`, borderRadius: 999, background: conta.dentro ? "var(--pj-brand)" : "var(--pj-accent)" }} />
                <div style={{ position: "absolute", top: -4, bottom: -4, left: `calc(${conta.posicaoOrcamento}% - 2px)`, width: 3, borderRadius: 2, background: "var(--pj-text)" }} />
              </div>
              <p className="mt-2.5 tabular-nums" style={{ fontSize: 12.5, color: "var(--pj-text-strong)", lineHeight: 1.5 }}>
                {eur(real.total, 2)} € no {real.nome}, a loja mais barata ({real.artigos} de {Math.min(aComprar.length, MAX_ARTIGOS)} artigos com preço) · orçamento de {plano.prefs.orcamento} €
              </p>
              {!conta.dentro && (
                <p className="mt-1.5" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
                  Para voltar ao orçamento: em <strong>Ajustar</strong>, troca um jantar por «Mais barato»; marca nas quantidades o que já tens em casa; ou vê a opção «Dividir» por duas lojas.
                </p>
              )}
            </div>
          )}
          <p className="mt-2" style={{ fontSize: 11, color: "var(--pj-text-faint)", lineHeight: 1.55 }}>
            {aComprar.length > MAX_ARTIGOS && `A comparação vê os primeiros ${MAX_ARTIGOS} artigos (o limite das lojas por minuto). `}
            São embalagens inteiras: parte do arroz, da massa ou das especiarias fica para as semanas seguintes.
          </p>

          <button onClick={recomecar}
            className="pj-tap mt-5 text-[12.5px] font-semibold" style={{ minHeight: 40, background: "none", border: 0, color: confirmar ? "var(--pj-danger-strong)" : "var(--pj-text-faint)" }}>
            {confirmar ? "Tocar de novo para apagar o plano e as escolhas" : "Apagar o plano e começar do zero"}
          </button>
        </div>
      )}

      {/* O que já há em casa */}
      <DespensaReceitas tenho={tenho} onMudar={guardarDespensa} prefs={prefs} onAbrir={(r) => abrir(r)} onAdicionar={adicionarALista} />

      {/* Todas as receitas */}
      <div className="mx-4 mb-3 flex items-end justify-between gap-3">
        <div>
          <p className={ROT} style={{ color: "var(--pj-text-faint)" }}>Livro de receitas</p>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--pj-text)", marginTop: 2 }}>Todas as receitas</p>
        </div>
        {prefs && (
          <button onClick={() => setSoMinhas(!soMinhas)} aria-pressed={soMinhas} className="pj-tap press flex-shrink-0 text-[12px] font-semibold"
            style={{ minHeight: 36, padding: "0 12px", borderRadius: 12, border: `1px solid ${soMinhas ? "var(--pj-brand)" : "var(--pj-border)"}`, background: soMinhas ? "var(--pj-brand-wash)" : "var(--pj-card)", color: soMinhas ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
            {soMinhas ? "✓ " : ""}Só as que servem
          </button>
        )}
      </div>

      {!plano && filtro === "todas" && categoria === "todas" && (
        <div className="mx-4 mb-3">
          <CartaoReceita r={sugestao} destaque onAbrir={(r) => abrir(r)} estrelas={aval[sugestao.id]?.estrelas} />
        </div>
      )}

      <div className="mx-4 mb-3 flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: "var(--pj-subtle)" }} role="tablist" aria-label="Tipo de receita">
        {CATEGORIAS.map((c) => (
          <button key={c.id} role="tab" aria-selected={categoria === c.id} onClick={() => setCategoria(c.id)}
            className="pj-tap press flex-shrink-0 px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={categoria === c.id ? { background: "var(--pj-card)", color: "var(--pj-text)" } : { color: "var(--pj-text-faint)" }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTROS.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className="pj-tap press flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-semibold"
            style={filtro === f.id ? { background: "var(--pj-brand)", color: "#fff" } : { background: "var(--pj-subtle)", color: "var(--pj-text-muted)" }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mx-4 flex flex-col gap-2.5 pb-4">
        {visiveis.filter((r) => plano || filtro !== "todas" || categoria !== "todas" || r.id !== sugestao.id).map((r) => (
          <CartaoReceita key={r.id} r={r} onAbrir={(x) => abrir(x)} estrelas={aval[r.id]?.estrelas} />
        ))}
        {!visiveis.length && (
          <p className="text-center py-6" style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>Nenhuma receita com este filtro serve às tuas preferências.</p>
        )}
      </div>

      {rejeitadas.length > 0 && (
        <p className="text-[12px] text-center px-6 pb-3" style={{ color: "var(--pj-text-muted)" }}>
          {rejeitadas.length === 1 ? "1 receita marcada" : `${rejeitadas.length} receitas marcadas`} com «não gosto» fica{rejeitadas.length === 1 ? "" : "m"} fora das sugestões.{" "}
          <button onClick={reporRejeitadas} className="font-semibold" style={{ background: "none", border: 0, padding: 0, color: "var(--pj-text-strong)", textDecoration: "underline" }}>Voltar a sugerir</button>
        </p>
      )}

      <p className="text-[11px] text-center px-6 pb-4 leading-relaxed" style={{ color: "var(--pj-text-faint)" }}>
        Custo em faixas (€ = mais barato) e nutrição aproximada, calculada a partir dos ingredientes.
        {prefs && ` Na tua cozinha: ${EQUIPAMENTOS.filter((e) => prefs.equip.includes(e.id)).map((e) => e.nome.toLowerCase()).join(", ")}.`}
      </p>

      {assistente && (
        <EmentasAssistente inicial={prefs} onFechar={() => setAssistente(false)} onConcluir={concluirAssistente} />
      )}

      {aberta && (
        <ReceitaDetalhe
          key={aberta.r.id}
          receita={aberta.r}
          legenda={aberta.legenda}
          pessoasIniciais={aberta.pessoas}
          dietasDaPessoa={prefs?.dietas || []}
          onFechar={fecharDetalhe}
          onAdicionar={adicionarALista}
          onVerLista={() => { setAberta(null); setTab?.("lista"); }}
        />
      )}
    </div>
  );
}
