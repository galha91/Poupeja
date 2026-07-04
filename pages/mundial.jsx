import { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import {
  Gavel, Coins, Search, Timer, Trophy, ShoppingBasket,
  ScrollText, RotateCcw, TrendingUp, X, ChevronDown,
} from "lucide-react";
import { SELECOES, COTACOES } from "../data/mundial2022";

/* ============================================================
   FrutaCup — Leilão do Mundial 🍉⚽
   Todos os jogadores do Mundial 2022 transformados em mascotes
   de fruta. Compra-os em leilão, gere o teu plantel e volta a
   vendê-los ao melhor preço. Tudo guardado no dispositivo.
   ============================================================ */

const CHAVE = "frutacup_v1";
const MOEDAS_INICIAIS = 10000;
const LEILOES_MERCADO = 6;

const FRUTAS = [
  { nome: "Banana",   emoji: "🍌", persona: "Bananildo" },
  { nome: "Morango",  emoji: "🍓", persona: "Morangão" },
  { nome: "Ananás",   emoji: "🍍", persona: "Ananásio" },
  { nome: "Melancia", emoji: "🍉", persona: "Melancildo" },
  { nome: "Kiwi",     emoji: "🥝", persona: "Kiwito" },
  { nome: "Laranja",  emoji: "🍊", persona: "Laranjildo" },
  { nome: "Uva",      emoji: "🍇", persona: "Uvaldo" },
  { nome: "Pera",     emoji: "🍐", persona: "Peralto" },
  { nome: "Maçã",     emoji: "🍎", persona: "Maçanildo" },
  { nome: "Cereja",   emoji: "🍒", persona: "Cerejão" },
  { nome: "Pêssego",  emoji: "🍑", persona: "Pessegal" },
  { nome: "Manga",    emoji: "🥭", persona: "Manguito" },
  { nome: "Limão",    emoji: "🍋", persona: "Limonildo" },
  { nome: "Melão",    emoji: "🍈", persona: "Melonildo" },
  { nome: "Coco",     emoji: "🥥", persona: "Coquildo" },
  { nome: "Mirtilo",  emoji: "🫐", persona: "Mirtildo" },
  { nome: "Abacate",  emoji: "🥑", persona: "Abacatão" },
  { nome: "Maçã Verde", emoji: "🍏", persona: "Granizildo" },
];

const RIVAIS = [
  "ZéMelancia", "TiaPitanga", "SrAnanás", "DonaRomã", "Frutinhas99",
  "MestreKiwi", "CapitãoCoco", "AvóGinja", "PapaFigos", "RainhaUva",
  "BichoDaFruta", "MangaComSal",
];

const POSICOES = { GR: "Guarda-redes", DF: "Defesa", MC: "Médio", AV: "Avançado" };

/* ---------- jogadores: dataset achatado e determinístico ---------- */

function hashTexto(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

const JOGADORES = (() => {
  const lista = [];
  SELECOES.forEach((sel, si) => {
    sel.jogadores.forEach(([nome, pos], ji) => {
      const h = hashTexto(nome + sel.pais);
      const fruta = FRUTAS[h % FRUTAS.length];
      const cotacao = COTACOES[nome] || 58 + (h % 19);
      const apelido = nome.split(" ").slice(-1)[0];
      lista.push({
        id: `${si}-${ji}`,
        nome, pos,
        pais: sel.pais, bandeira: sel.bandeira, grupo: sel.grupo,
        fruta,
        alcunha: `${fruta.persona} ${apelido}`,
        cotacao,
        valor: Math.max(50, Math.round((cotacao ** 3) / 500 / 5) * 5),
      });
    });
  });
  return lista;
})();

const POR_ID = Object.fromEntries(JOGADORES.map((j) => [j.id, j]));

/* ---------- motor do leilão ---------- */

function novoLeilao(jogador, { vendedor = "mercado", precoBase, duracaoSeg } = {}) {
  const base = precoBase || jogador.valor;
  const dur = duracaoSeg || 120 + Math.floor(Math.random() * 240);
  return {
    id: `${jogador.id}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    jogadorId: jogador.id,
    vendedor, // 'mercado' | 'eu'
    precoBase: base,
    licitacao: null,          // valor atual (null = sem licitações)
    licitante: null,          // 'eu' | nome de rival
    fim: Date.now() + dur * 1000,
    // teto secreto que os rivais estão dispostos a pagar
    tetoRival: Math.round(jogador.valor * (0.85 + Math.random() * 1.5)),
    rival: RIVAIS[Math.floor(Math.random() * RIVAIS.length)],
    nLicitacoes: 0,
  };
}

function escolherParaMercado(estado) {
  const ocupados = new Set(estado.leiloes.map((l) => l.jogadorId));
  const livres = JOGADORES.filter((j) => !estado.plantel[j.id] && !ocupados.has(j.id));
  if (!livres.length) return null;
  // 1 em cada 3 leilões puxa um jogador cotado, para haver sempre estrelas na praça
  const estrelas = livres.filter((j) => j.cotacao >= 84);
  const fonte = estrelas.length && Math.random() < 0.34 ? estrelas : livres;
  return fonte[Math.floor(Math.random() * fonte.length)];
}

function incrementoMinimo(l) {
  const atual = l.licitacao || l.precoBase;
  return Math.max(5, Math.round((atual * 0.05) / 5) * 5);
}

function proximaLicitacao(l) {
  return l.licitacao === null ? l.precoBase : l.licitacao + incrementoMinimo(l);
}

// Avança o estado do mundo: rivais licitam, leilões fecham, mercado repõe stock.
function avancarMundo(estado, agora) {
  let e = estado;
  const mudar = () => { if (e === estado) e = { ...estado, leiloes: [...estado.leiloes], eventos: [...estado.eventos] }; return e; };
  const evento = (texto, tipo) => {
    mudar();
    e.eventos = [{ texto, tipo, ts: agora }, ...e.eventos].slice(0, 40);
  };

  // 1) rivais licitam (mais agressivos perto do fim)
  for (let i = 0; i < estado.leiloes.length; i++) {
    const l = estado.leiloes[i];
    if (agora >= l.fim) continue;
    const alvo = proximaLicitacao(l);
    if (alvo > l.tetoRival) continue;
    if (l.licitante && l.licitante !== "eu") continue; // rival já vai à frente
    const faltam = (l.fim - agora) / 1000;
    const p = faltam < 25 ? 0.16 : 0.035;
    if (Math.random() > p) continue;
    mudar();
    // devolve moedas se o utilizador ia à frente
    if (l.licitante === "eu") {
      e.moedas += l.licitacao;
      evento(`💢 ${l.rival} ultrapassou-te no leilão de ${POR_ID[l.jogadorId].alcunha} (${fmt(alvo)})`, "mau");
    }
    e.leiloes[i] = { ...l, licitacao: alvo, licitante: l.rival, nLicitacoes: l.nLicitacoes + 1, fim: faltam < 15 ? l.fim + 12000 : l.fim };
  }

  // 2) fecha leilões terminados
  const abertos = [];
  for (const l of (e === estado ? estado : e).leiloes) {
    if (agora < l.fim) { abertos.push(l); continue; }
    mudar();
    const j = POR_ID[l.jogadorId];
    if (l.licitante === "eu") {
      e.plantel = { ...e.plantel, [j.id]: { preco: l.licitacao, ts: agora } };
      evento(`🏆 Ganhaste o leilão! ${j.fruta.emoji} ${j.alcunha} é teu por ${fmt(l.licitacao)}`, "bom");
      e.historico = [{ tipo: "compra", nome: j.alcunha, valor: l.licitacao, ts: agora }, ...e.historico].slice(0, 60);
    } else if (l.vendedor === "eu") {
      if (l.licitante) {
        e.moedas += l.licitacao;
        const { [j.id]: _, ...resto } = e.plantel;
        e.plantel = resto;
        evento(`💰 Vendeste ${j.fruta.emoji} ${j.alcunha} a ${l.licitante} por ${fmt(l.licitacao)}`, "bom");
        e.historico = [{ tipo: "venda", nome: j.alcunha, valor: l.licitacao, ts: agora }, ...e.historico].slice(0, 60);
      } else {
        evento(`🤷 Ninguém licitou por ${j.alcunha} — voltou ao teu cesto`, "neutro");
      }
    } else if (l.licitante) {
      evento(`🔨 ${l.licitante} arrematou ${j.fruta.emoji} ${j.alcunha} por ${fmt(l.licitacao)}`, "neutro");
    }
  }
  if (e !== estado) e.leiloes = abertos.length === e.leiloes.length ? e.leiloes : abertos;
  else if (abertos.length !== estado.leiloes.length) { mudar(); e.leiloes = abertos; }

  // 3) repõe leilões do mercado
  let doMercado = e.leiloes.filter((l) => l.vendedor === "mercado").length;
  while (doMercado < LEILOES_MERCADO) {
    const j = escolherParaMercado(e);
    if (!j) break;
    mudar();
    e.leiloes = [...e.leiloes, novoLeilao(j)];
    doMercado++;
  }

  return e;
}

/* ---------- utilitários ---------- */

const fmt = (n) => `${(n ?? 0).toLocaleString("pt-PT")} 🪙`;

function tempoRestante(fim, agora) {
  const s = Math.max(0, Math.round((fim - agora) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function estadoInicial() {
  return { moedas: MOEDAS_INICIAIS, plantel: {}, leiloes: [], eventos: [], historico: [] };
}

/* ============================================================ */

export default function Mundial() {
  const [estado, setEstado] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [tab, setTab] = useState("leiloes");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPais, setFiltroPais] = useState("");
  const [filtroPos, setFiltroPos] = useState("");
  const [mostrar, setMostrar] = useState(40);
  const [venda, setVenda] = useState(null); // jogador a vender (modal)
  const estadoRef = useRef(null);
  estadoRef.current = estado;

  // carrega do dispositivo + põe o mundo em dia
  useEffect(() => {
    let e;
    try { e = JSON.parse(localStorage.getItem(CHAVE)) || estadoInicial(); }
    catch { e = estadoInicial(); }
    setEstado(avancarMundo(e, Date.now()));
  }, []);

  // relógio do mundo: 1 tick por segundo
  useEffect(() => {
    const t = setInterval(() => {
      const ts = Date.now();
      setAgora(ts);
      setEstado((e) => (e ? avancarMundo(e, ts) : e));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // guarda no dispositivo
  useEffect(() => {
    if (estado) try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch {}
  }, [estado]);

  function licitar(leilaoId, valor) {
    setEstado((e) => {
      const i = e.leiloes.findIndex((l) => l.id === leilaoId);
      if (i < 0) return e;
      const l = e.leiloes[i];
      if (Date.now() >= l.fim || l.vendedor === "eu") return e;
      const minimo = proximaLicitacao(l);
      const v = Math.max(minimo, Math.round(valor / 5) * 5);
      const devolucao = l.licitante === "eu" ? l.licitacao : 0;
      if (v > e.moedas + devolucao) return e;
      const j = POR_ID[l.jogadorId];
      const faltam = (l.fim - Date.now()) / 1000;
      return {
        ...e,
        moedas: e.moedas + devolucao - v,
        leiloes: e.leiloes.map((x, xi) => xi !== i ? x : {
          ...l, licitacao: v, licitante: "eu", nLicitacoes: l.nLicitacoes + 1,
          fim: faltam < 15 ? l.fim + 12000 : l.fim,
        }),
        eventos: [{ texto: `🙋 Licitaste ${fmt(v)} por ${j.fruta.emoji} ${j.alcunha}`, tipo: "neutro", ts: Date.now() }, ...e.eventos].slice(0, 40),
      };
    });
  }

  function levarALeilao(jogador) {
    setEstado((e) => {
      if (e.plantel[jogador.id] || e.leiloes.some((l) => l.jogadorId === jogador.id)) return e;
      return { ...e, leiloes: [...e.leiloes, novoLeilao(jogador, { duracaoSeg: 120 })] };
    });
    setTab("leiloes");
  }

  function porAVenda(jogador, precoBase, duracaoSeg) {
    setEstado((e) => {
      if (!e.plantel[jogador.id] || e.leiloes.some((l) => l.jogadorId === jogador.id)) return e;
      return {
        ...e,
        leiloes: [...e.leiloes, novoLeilao(jogador, { vendedor: "eu", precoBase, duracaoSeg })],
        eventos: [{ texto: `🏷️ Puseste ${jogador.fruta.emoji} ${jogador.alcunha} à venda (base ${fmt(precoBase)})`, tipo: "neutro", ts: Date.now() }, ...e.eventos].slice(0, 40),
      };
    });
    setVenda(null);
    setTab("leiloes");
  }

  function recomecar() {
    if (!confirm("Recomeçar do zero? Perdes o plantel e as moedas.")) return;
    const e = avancarMundo(estadoInicial(), Date.now());
    setEstado(e);
  }

  const paises = useMemo(() => SELECOES.map((s) => s.pais), []);
  const filtrados = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return JOGADORES.filter((j) =>
      (!filtroPais || j.pais === filtroPais) &&
      (!filtroPos || j.pos === filtroPos) &&
      (!q || j.nome.toLowerCase().includes(q) || j.alcunha.toLowerCase().includes(q) || j.pais.toLowerCase().includes(q))
    );
  }, [pesquisa, filtroPais, filtroPos]);

  if (!estado) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-5xl">🍉</div>
  );

  const meusIds = Object.keys(estado.plantel);
  const valorPlantel = meusIds.reduce((s, id) => s + (POR_ID[id]?.valor || 0), 0);
  const emLeilao = new Set(estado.leiloes.map((l) => l.jogadorId));
  const leiloesOrdenados = [...estado.leiloes].sort((a, b) => a.fim - b.fim);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-28">
      <Head>
        <title>FrutaCup — Leilão do Mundial 🍉</title>
        <meta name="description" content="Todos os jogadores do Mundial 2022 em versão fruta. Compra e vende em leilão." />
        <meta name="robots" content="noindex" />
      </Head>

      {/* cabeçalho */}
      <header className="bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight">🍉 FrutaCup</h1>
              <p className="text-emerald-100 text-sm">
                O leilão de frutas do Mundial · {JOGADORES.length} jogadores · 32 seleções
              </p>
            </div>
            <button onClick={recomecar} title="Recomeçar"
              className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 transition">
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="mt-4 flex gap-2 text-sm">
            <div className="flex-1 bg-emerald-800/50 rounded-2xl px-3 py-2">
              <div className="text-emerald-200 text-[11px] font-bold uppercase tracking-wide">Carteira</div>
              <div className="font-black text-lg flex items-center gap-1"><Coins size={16} /> {estado.moedas.toLocaleString("pt-PT")}</div>
            </div>
            <div className="flex-1 bg-emerald-800/50 rounded-2xl px-3 py-2">
              <div className="text-emerald-200 text-[11px] font-bold uppercase tracking-wide">Plantel</div>
              <div className="font-black text-lg">{meusIds.length} frutas</div>
            </div>
            <div className="flex-1 bg-emerald-800/50 rounded-2xl px-3 py-2">
              <div className="text-emerald-200 text-[11px] font-bold uppercase tracking-wide">Valor de mercado</div>
              <div className="font-black text-lg">{valorPlantel.toLocaleString("pt-PT")} 🪙</div>
            </div>
          </div>
        </div>
      </header>

      {/* último evento */}
      {estado.eventos[0] && (
        <div className={`max-w-3xl mx-auto px-4 mt-3`}>
          <div className={`text-sm rounded-xl px-3 py-2 border ${
            estado.eventos[0].tipo === "bom" ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200"
            : estado.eventos[0].tipo === "mau" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300"
            : "bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"}`}>
            {estado.eventos[0].texto}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 mt-4">
        {tab === "leiloes" && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-black flex items-center gap-2"><Gavel size={20} /> Leilões a decorrer</h2>
            {leiloesOrdenados.length === 0 && (
              <p className="text-sm text-slate-500">A praça está vazia… volta já de seguida 🍂</p>
            )}
            {leiloesOrdenados.map((l) => (
              <CartaoLeilao key={l.id} leilao={l} agora={agora} moedas={estado.moedas} onLicitar={licitar} />
            ))}
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
              Licitações nos últimos 15 segundos prolongam o leilão. As moedas ficam cativas enquanto
              fores o melhor licitador e voltam se te ultrapassarem.
            </p>
          </section>
        )}

        {tab === "mercado" && (
          <section>
            <h2 className="font-display text-xl font-black flex items-center gap-2 mb-3"><Trophy size={20} /> Todos os jogadores</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <label className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={pesquisa} onChange={(e) => { setPesquisa(e.target.value); setMostrar(40); }}
                  placeholder="Procurar jogador, fruta ou seleção…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-emerald-500" />
              </label>
              <div className="flex gap-2">
                <SelectPill valor={filtroPais} onChange={(v) => { setFiltroPais(v); setMostrar(40); }}
                  opcoes={[["", "Todas as seleções"], ...paises.map((p) => [p, p])]} />
                <SelectPill valor={filtroPos} onChange={(v) => { setFiltroPos(v); setMostrar(40); }}
                  opcoes={[["", "Posição"], ...Object.entries(POSICOES)]} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">{filtrados.length} jogadores</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtrados.slice(0, mostrar).map((j) => (
                <CartaoJogador key={j.id} j={j}
                  meu={!!estado.plantel[j.id]} emLeilao={emLeilao.has(j.id)}
                  onLeiloar={() => levarALeilao(j)} />
              ))}
            </div>
            {filtrados.length > mostrar && (
              <button onClick={() => setMostrar((m) => m + 60)}
                className="mt-4 w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                Mostrar mais <ChevronDown size={16} />
              </button>
            )}
          </section>
        )}

        {tab === "plantel" && (
          <section>
            <h2 className="font-display text-xl font-black flex items-center gap-2 mb-3"><ShoppingBasket size={20} /> O meu cesto</h2>
            {meusIds.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">🧺</div>
                <p className="font-bold">Ainda não tens frutas</p>
                <p className="text-sm text-slate-500 mt-1">Vai aos leilões e arremata o teu primeiro jogador-fruta.</p>
                <button onClick={() => setTab("leiloes")} className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black">
                  Ver leilões
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meusIds.map((id) => {
                  const j = POR_ID[id];
                  if (!j) return null;
                  const c = estado.plantel[id];
                  const aVender = emLeilao.has(id);
                  return (
                    <div key={id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                      <LinhaJogador j={j} />
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Compraste por <b>{fmt(c.preco)}</b></span>
                        <span className="flex items-center gap-1"><TrendingUp size={13} /> vale {fmt(j.valor)}</span>
                      </div>
                      <button disabled={aVender} onClick={() => setVenda(j)}
                        className={`mt-2 w-full py-2 rounded-xl text-sm font-black ${aVender
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          : "bg-amber-500 hover:bg-amber-600 text-white"}`}>
                        {aVender ? "Em leilão…" : "Vender em leilão"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "movimentos" && (
          <section>
            <h2 className="font-display text-xl font-black flex items-center gap-2 mb-3"><ScrollText size={20} /> Movimentos</h2>
            {estado.historico.length === 0 && <p className="text-sm text-slate-500">Sem compras nem vendas por enquanto.</p>}
            <div className="space-y-2">
              {estado.historico.map((h, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm flex items-center justify-between">
                  <span>{h.tipo === "compra" ? "🛒" : "💰"} {h.tipo === "compra" ? "Compraste" : "Vendeste"} <b>{h.nome}</b></span>
                  <span className={`font-black ${h.tipo === "compra" ? "text-red-500" : "text-emerald-600"}`}>
                    {h.tipo === "compra" ? "−" : "+"}{h.valor.toLocaleString("pt-PT")} 🪙
                  </span>
                </div>
              ))}
            </div>
            {estado.eventos.length > 0 && (
              <>
                <h3 className="font-bold text-sm text-slate-500 mt-6 mb-2">Diário da praça</h3>
                <div className="space-y-1">
                  {estado.eventos.map((ev, i) => (
                    <div key={i} className="text-xs text-slate-500 dark:text-slate-400 px-1">{ev.texto}</div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* modal de venda */}
      {venda && (
        <ModalVenda jogador={venda} onFechar={() => setVenda(null)} onConfirmar={porAVenda} />
      )}

      {/* navegação inferior */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          {[
            ["leiloes", Gavel, "Leilões"],
            ["mercado", Trophy, "Jogadores"],
            ["plantel", ShoppingBasket, "Cesto"],
            ["movimentos", ScrollText, "Diário"],
          ].map(([id, Icone, rotulo]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`relative py-3 flex flex-col items-center gap-0.5 text-[11px] font-bold ${
                tab === id ? "text-emerald-600" : "text-slate-400"}`}>
              <Icone size={20} />
              {rotulo}
              {id === "leiloes" && estado.leiloes.some((l) => l.licitante === "eu") && (
                <span className="absolute top-2 right-1/3 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ---------- componentes ---------- */

function LinhaJogador({ j }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl flex-shrink-0">
        {j.fruta.emoji}
      </div>
      <div className="min-w-0">
        <div className="font-black leading-tight truncate">{j.alcunha}</div>
        <div className="text-xs text-slate-500 truncate">
          {j.nome} · {j.bandeira} {j.pais} · {POSICOES[j.pos]}
        </div>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase">Cotação</div>
        <div className={`font-display font-black text-lg ${j.cotacao >= 88 ? "text-amber-500" : j.cotacao >= 80 ? "text-emerald-600" : "text-slate-500"}`}>
          {j.cotacao}
        </div>
      </div>
    </div>
  );
}

function CartaoJogador({ j, meu, emLeilao, onLeiloar }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
      <LinhaJogador j={j} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">Base <b>{fmt(j.valor)}</b> · Grupo {j.grupo}</span>
        {meu ? (
          <span className="text-xs font-black text-emerald-600">No teu cesto 🧺</span>
        ) : emLeilao ? (
          <span className="text-xs font-black text-amber-500">Em leilão 🔨</span>
        ) : (
          <button onClick={onLeiloar}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black">
            Levar a leilão
          </button>
        )}
      </div>
    </div>
  );
}

function CartaoLeilao({ leilao: l, agora, moedas, onLicitar }) {
  const [aberto, setAberto] = useState(false);
  const [proposta, setProposta] = useState("");
  const j = POR_ID[l.jogadorId];
  if (!j) return null;
  const restante = tempoRestante(l.fim, agora);
  const quase = l.fim - agora < 30000;
  const minimo = proximaLicitacao(l);
  const devolucao = l.licitante === "eu" ? l.licitacao : 0;
  const possoLicitar = l.vendedor !== "eu" && minimo <= moedas + devolucao;

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-3 ${
      l.licitante === "eu" ? "border-emerald-400 dark:border-emerald-600"
      : quase ? "border-amber-300 dark:border-amber-700" : "border-slate-200 dark:border-slate-800"}`}>
      <LinhaJogador j={j} />
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className={`flex items-center gap-1 font-black px-2 py-1 rounded-lg ${
          quase ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
          <Timer size={14} /> {restante}
        </span>
        <span className="text-slate-500 text-xs">
          {l.licitacao === null ? <>Base <b>{fmt(l.precoBase)}</b> · sem licitações</>
            : <>Vai em <b className="text-slate-800 dark:text-slate-100">{fmt(l.licitacao)}</b> · {l.nLicitacoes} licitações</>}
        </span>
        {l.vendedor === "eu" && <span className="ml-auto text-[10px] font-black text-amber-600 uppercase">A tua venda</span>}
        {l.licitante === "eu" && <span className="ml-auto text-[10px] font-black text-emerald-600 uppercase">Vais à frente 🙌</span>}
        {l.licitante && l.licitante !== "eu" && l.vendedor !== "eu" && (
          <span className="ml-auto text-[10px] font-bold text-slate-400">👤 {l.licitante}</span>
        )}
        {l.licitante && l.licitante !== "eu" && l.vendedor === "eu" && (
          <span className="text-[10px] font-bold text-slate-400">👤 {l.licitante}</span>
        )}
      </div>
      {l.vendedor !== "eu" && (
        <div className="mt-2 flex gap-2">
          <button disabled={!possoLicitar} onClick={() => onLicitar(l.id, minimo)}
            className={`flex-1 py-2 rounded-xl text-sm font-black ${possoLicitar
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            Licitar {fmt(minimo)}
          </button>
          <button onClick={() => setAberto((a) => !a)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-black text-slate-600 dark:text-slate-300">
            Outro valor
          </button>
        </div>
      )}
      {aberto && l.vendedor !== "eu" && (
        <form className="mt-2 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          const v = parseInt(proposta, 10);
          if (v >= minimo) { onLicitar(l.id, v); setProposta(""); setAberto(false); }
        }}>
          <input type="number" min={minimo} step="5" value={proposta} onChange={(e) => setProposta(e.target.value)}
            placeholder={`Mínimo ${minimo}`}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-emerald-500" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black">OK</button>
        </form>
      )}
    </div>
  );
}

function SelectPill({ valor, onChange, opcoes }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-emerald-500 max-w-[46vw]">
      {opcoes.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
    </select>
  );
}

function ModalVenda({ jogador: j, onFechar, onConfirmar }) {
  const sugestao = Math.max(50, Math.round((j.valor * 0.8) / 5) * 5);
  const [preco, setPreco] = useState(String(sugestao));
  const [dur, setDur] = useState(120);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onFechar}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-lg font-black">Vender em leilão</h3>
          <button onClick={onFechar} className="p-1 text-slate-400"><X size={18} /></button>
        </div>
        <LinhaJogador j={j} />
        <p className="text-xs text-slate-500 mt-2">Valor de mercado: <b>{fmt(j.valor)}</b>. Uma base mais baixa atrai mais licitadores.</p>
        <label className="block mt-4 text-xs font-bold text-slate-500 uppercase">Preço base</label>
        <input type="number" min="5" step="5" value={preco} onChange={(e) => setPreco(e.target.value)}
          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-emerald-500" />
        <label className="block mt-3 text-xs font-bold text-slate-500 uppercase">Duração</label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[[60, "1 min"], [120, "2 min"], [300, "5 min"]].map(([s, r]) => (
            <button key={s} onClick={() => setDur(s)}
              className={`py-2 rounded-xl text-sm font-black border ${dur === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={() => {
          const p = Math.max(5, parseInt(preco, 10) || sugestao);
          onConfirmar(j, Math.round(p / 5) * 5, dur);
        }}
          className="mt-4 w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black">
          Pôr na praça 🔨
        </button>
      </div>
    </div>
  );
}
