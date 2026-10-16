import { useEffect, useMemo, useState } from "react";
import { Clock, ChefHat, Leaf, Lock, Unlock, RefreshCw, ShoppingCart, Check, Sparkles, SlidersHorizontal, ChevronDown, Star, CalendarDays } from "lucide-react";
import {
  receitas, receitaPorId, compativel, gerarPlano, regenerar, trocarDia, alternarFixa, comprasDoPlano,
  mediaDoPlano, porcoesNoPlano, sugestaoDaSemana, formatarTempo, DIAS, DIETAS, VONTADES, EQUIPAMENTOS,
} from "./lib/receitas/motor";
import ReceitaDetalhe, { BadgeCusto, lerAvaliacoes } from "./ReceitaDetalhe";
import EmentasAssistente from "./EmentasAssistente";
import CompararLista from "./CompararLista";
import { evento } from "./lib/analytics";

/*
 * Ementas — o plano da semana feito à medida e todas as receitas.
 *
 * Fluxo: seis perguntas (EmentasAssistente) → plano de jantares, com
 * sopa → cada dia pode ficar fixo ou ser trocado → as compras do plano,
 * somadas, entram na Lista de Compras num toque e são comparadas nos
 * supermercados com preços reais. Nada de "custa 5,32 €" inventado: o
 * plano usa faixas (€/€€/€€€) e o preço a sério vem da comparação.
 *
 * Fica tudo no dispositivo (preferências, plano e estrelas).
 */

const LS_LISTA = "poupeja_lista_compras";
const LS_PREFS = "poupeja_ementas_prefs";
const LS_PLANO = "poupeja_ementas_plano";
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

/*
 * Junta artigos à Lista de Compras com o nome do catálogo (assim a
 * comparação de preços reconhece-os). Os que já lá estão por comprar não
 * se duplicam. Devolve quantos entraram.
 */
async function adicionarALista(artigos) {
  const [{ adicionar }, { doCatalogo }] = await Promise.all([import("./lib/listaCompras"), import("./lib/catalogoLista")]);
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(LS_LISTA) || "[]"); } catch {}
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  let novos = 0;
  for (const a of artigos) {
    const nome = a.compra || a.nome;
    const final = doCatalogo(nome)?.nome || nome;
    if (lista.some((i) => !i.feito && norm(i.nome) === norm(final))) continue;
    lista = adicionar(lista, nome, { doCatalogo });
    novos++;
  }
  try { localStorage.setItem(LS_LISTA, JSON.stringify(lista)); } catch {}
  return novos;
}

function Meta({ r, claro = false }) {
  const cor = claro ? "rgba(255,255,255,0.75)" : "var(--pj-text-muted)";
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5" style={{ fontSize: 12, color: cor }}>
      <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatarTempo(r.tempoMin)}</span>
      <BadgeCusto custo={r.custo} claro={claro} />
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

/* Um dia do plano: a receita, e os botões fixar / trocar. */
function DiaPlano({ rotulo, r, entrada, nota, onAbrir, onFixar, onTrocar }) {
  if (!r) return null;
  const fixa = !!entrada.fixa;
  return (
    <div>
      <p className="flex items-center gap-2 mb-1.5 px-1" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-strong)" }}>
        {rotulo}
        {entrada.repetida && <span className="text-[10.5px] font-semibold" style={{ padding: "2px 8px", borderRadius: 8, background: "var(--pj-accent-wash)", color: "var(--pj-accent)" }}>repete · cozinha a dobrar</span>}
      </p>
      <div className="rounded-2xl flex items-center" style={{ background: "var(--pj-card)", border: `1px solid ${fixa ? "var(--pj-brand)" : "var(--pj-border)"}` }}>
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
    </div>
  );
}

function resumoPrefs(p) {
  const partes = [`${p.pessoas} pessoa${p.pessoas > 1 ? "s" : ""}`, `${p.jantares} jantares`, `até ${p.orcamento} €`];
  const nomes = [
    ...DIETAS.filter((d) => p.dietas.includes(d.id)).map((d) => d.nome.toLowerCase()),
    ...VONTADES.filter((v) => p.vontades.includes(v.id)).map((v) => v.nome.toLowerCase()),
  ];
  return [...partes, ...nomes].join(" · ");
}

export default function SecaoEmentas({ setTab }) {
  const [prefs, setPrefs] = useState(null);
  const [plano, setPlano] = useState(null);
  const [aval, setAval] = useState({});
  const [assistente, setAssistente] = useState(false);
  const [aberta, setAberta] = useState(null); // { r, legenda, pessoas }
  const [filtro, setFiltro] = useState("todas");
  const [soMinhas, setSoMinhas] = useState(true);
  const [verCompras, setVerCompras] = useState(false);
  const [naLista, setNaLista] = useState(0);

  useEffect(() => {
    setPrefs(ler(LS_PREFS));
    setPlano(ler(LS_PLANO));
    setAval(lerAvaliacoes());
  }, []);

  function guardarPlano(p) {
    setPlano(p);
    gravar(LS_PLANO, p);
    setNaLista(0);
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

  const compras = useMemo(() => (plano ? comprasDoPlano(plano) : []), [plano]);
  const aComprar = compras.filter((c) => !c.despensa);
  const media = plano ? mediaDoPlano(plano) : null;
  const antigo = plano && segunda(plano.criadoEm) < segunda(Date.now());

  async function comprasParaLista() {
    const n = await adicionarALista(aComprar);
    setNaLista(n || -1);
    evento("ementas_plano", { acao: "lista", artigos: aComprar.length });
  }

  function abrir(r, extra = {}) {
    setAberta({ r, pessoas: prefs?.pessoas || 4, ...extra });
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
    { id: "sopas", label: "Sopas" },
    { id: "veg", label: "Vegetariano" },
    { id: "airfryer", label: "Air fryer" },
  ];
  const sugestao = sugestaoDaSemana();
  const visiveis = receitas().filter((r) => {
    if (prefs && soMinhas && !compativel(r, prefs)) return false;
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
          <p className="text-xs mt-1" style={{ color: "var(--pj-text-muted)" }}>{resumoPrefs(plano.prefs)}</p>
        ) : (
          <p className="text-xs mt-1" style={{ color: "var(--pj-text-muted)" }}>Receitas baratas, à medida da tua casa — e as compras entram na lista num toque.</p>
        )}
        <div className="mt-4" style={{ height: 1, background: "var(--pj-border)" }} />
      </div>

      {/* Sem plano: o convite */}
      {!plano && (
        <div className="mx-4 mb-6 rounded-3xl p-5" style={{ background: "var(--pj-brand)" }}>
          <div className="flex gap-1.5 text-[26px]" aria-hidden="true">🥕🍗🐟🫘🥣</div>
          <p className="font-display mt-3" style={{ fontSize: 21, fontWeight: 600, color: "#fff", lineHeight: 1.25 }}>Planeia os jantares da semana em 1 minuto</p>
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
            <Lock size={11} className="inline -mt-0.5" /> fixa as que queres manter · <RefreshCw size={11} className="inline -mt-0.5" /> troca por outra
          </p>

          <div className="flex flex-col gap-4">
            {plano.dias.map((d) => (
              <DiaPlano key={d.dia} rotulo={DIAS[d.dia]} r={receitaPorId(d.id)} entrada={d}
                onAbrir={(r) => abrir(r, { legenda: DIAS[d.dia], pessoas: plano.prefs.pessoas })}
                onFixar={() => guardarPlano(alternarFixa(plano, d.dia))}
                onTrocar={() => { guardarPlano(trocarDia(plano, d.dia, { avaliacoes: aval })); evento("ementas_plano", { acao: "trocar" }); }} />
            ))}
            {plano.sopa && (
              <DiaPlano rotulo="Sopa da semana" r={receitaPorId(plano.sopa.id)} entrada={plano.sopa}
                nota={`Uma panela para ${porcoesNoPlano(plano, "sopa")} tigelas`}
                onAbrir={(r) => abrir(r, { legenda: "Sopa da semana", pessoas: porcoesNoPlano(plano, "sopa") })}
                onFixar={() => guardarPlano(alternarFixa(plano, "sopa"))}
                onTrocar={() => guardarPlano(trocarDia(plano, "sopa", { avaliacoes: aval }))} />
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
              <strong>{aComprar.length} artigos</strong> para {plano.dias.filter((d) => d.id).length} jantares{plano.sopa ? " e a sopa" : ""} — já somados entre receitas.
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
              {verCompras ? "Esconder quantidades" : "Ver quantidades"} <ChevronDown size={14} style={{ transform: verCompras ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {verCompras && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--pj-subtle)" }}>
                {compras.map((c, i) => (
                  <div key={c.key} className="flex items-start justify-between gap-3 px-3 py-2" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                    <span style={{ minWidth: 0 }}>
                      <span className="block" style={{ fontSize: 13, fontWeight: c.despensa ? 500 : 600, color: c.despensa ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                        {c.nome}{c.despensa ? " · despensa" : ""}
                      </span>
                      <span className="block truncate" style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>{c.receitas.join(", ")}</span>
                    </span>
                    <span className="flex-shrink-0 tabular-nums" style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>{c.qtd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preço real */}
          <p className={`${ROT} mt-6 mb-2`} style={{ color: "var(--pj-text-faint)" }}>Quanto custa, a sério?</p>
          <p className="mb-3" style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
            O teu orçamento: <strong style={{ color: "var(--pj-text)" }}>{plano.prefs.orcamento} €</strong>. Comparamos estes artigos nos supermercados, com os preços de hoje.
          </p>
          {/* key: um plano novo começa uma comparação nova */}
          <CompararLista key={aComprar.map((c) => c.key).join()} itens={aComprar.map((c, i) => ({ id: `plano-${i}`, nome: c.compra || c.nome, qty: 1 }))} />
          <p className="mt-2" style={{ fontSize: 11, color: "var(--pj-text-faint)", lineHeight: 1.55 }}>
            São embalagens inteiras: parte do arroz, da massa ou das especiarias fica para as semanas seguintes.
          </p>

          <button onClick={() => { guardarPlano(null); evento("ementas_plano", { acao: "apagar" }); }}
            className="pj-tap mt-5 text-[12.5px] font-semibold" style={{ minHeight: 40, background: "none", border: 0, color: "var(--pj-text-faint)" }}>
            Apagar este plano
          </button>
        </div>
      )}

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

      {!plano && filtro === "todas" && (
        <div className="mx-4 mb-3">
          <CartaoReceita r={sugestao} destaque onAbrir={(r) => abrir(r)} estrelas={aval[sugestao.id]?.estrelas} />
        </div>
      )}

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
        {visiveis.filter((r) => plano || filtro !== "todas" || r.id !== sugestao.id).map((r) => (
          <CartaoReceita key={r.id} r={r} onAbrir={(x) => abrir(x)} estrelas={aval[r.id]?.estrelas} />
        ))}
        {!visiveis.length && (
          <p className="text-center py-6" style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>Nenhuma receita com este filtro serve às tuas preferências.</p>
        )}
      </div>

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
