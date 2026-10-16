/*
 * O motor das receitas — as contas, sem React nem rede.
 *
 *   receitas()          as receitas já com nutrição, dietas e "vontades"
 *   compativel()        se uma receita serve a quem cozinha (dieta, o que
 *                       não come, o que tem na cozinha)
 *   gerarPlano()        escolhe os jantares da semana (e a sopa)
 *   trocarDia()         troca um só dia, sem mexer nos outros
 *   comprasDoPlano()    junta os ingredientes de todas as receitas, já à
 *                       escala das pessoas, prontos para a lista
 *
 * Regras de honestidade: as dietas saem dos ingredientes (não de uma
 * etiqueta escrita à mão), a nutrição é calculada a partir deles e é
 * sempre "aproximada", e o custo é uma faixa — o preço a sério vem dos
 * supermercados quando a lista é comparada.
 */

import { INGREDIENTES } from "./ingredientes.js";
import { RECEITAS, PORCOES } from "./dados.js";

export { INGREDIENTES, PORCOES };

/* ── Opções do assistente ─────────────────────────────────────────── */

export const DIETAS = [
  { id: "vegano", nome: "Vegano", emoji: "🥑", exclui: ["carne", "peixe", "ovo", "lacticinio", "mel"] },
  { id: "vegetariano", nome: "Vegetariano", emoji: "🥕", exclui: ["carne", "peixe"] },
  { id: "pescetariano", nome: "Pescetariano", emoji: "🐟", exclui: ["carne"] },
  { id: "sem-gluten", nome: "Sem glúten", emoji: "🌾", exclui: ["gluten"] },
  { id: "sem-lactose", nome: "Sem lactose", emoji: "🥛", exclui: ["lacticinio"] },
];

export const VONTADES = [
  { id: "rapido", nome: "Rápido", emoji: "⏱️", desc: "Até 25 minutos", teste: (r) => r.tempoMin <= 25 },
  { id: "leve", nome: "Leve", emoji: "🥗", desc: "Até 450 kcal por pessoa", teste: (r) => r.nutricao.kcal <= 450 },
  { id: "proteina", nome: "Rico em proteína", emoji: "💪", desc: "25 g ou mais por pessoa", teste: (r) => r.nutricao.p >= 25 },
  { id: "intestino", nome: "Amigo do intestino", emoji: "🌱", desc: "Muita fibra: 7 g ou mais", teste: (r) => r.nutricao.fib >= 7 },
  { id: "familia", nome: "Para a família", emoji: "👨‍👩‍👧", desc: "Pratos que os miúdos comem", teste: (r) => r.tags.includes("familia") },
  { id: "conforto", nome: "Conforto", emoji: "🍲", desc: "Tachos, estufados e sopas", teste: (r) => r.tags.includes("conforto") },
  { id: "takeaway", nome: "Takeaway caseiro", emoji: "🍔", desc: "O sabor do take-away, a preço de casa", teste: (r) => r.tags.includes("takeaway") },
];
export const MAX_VONTADES = 3;

/*
 * Todos os aparelhos com que se faz uma refeição. Os nomes são genéricos:
 * "robô de cozinha" e não uma marca — servem a Bimby, a Monsieur Cuisine,
 * a Mycook e as outras. O teste garante que cada um tem receitas.
 */
export const EQUIPAMENTOS = [
  { id: "fogao", nome: "Fogão / placa", curto: "Fogão" },
  { id: "forno", nome: "Forno", curto: "Forno" },
  { id: "microondas", nome: "Micro-ondas", curto: "Micro-ondas" },
  { id: "airfryer", nome: "Air fryer", curto: "Air fryer" },
  { id: "fritadeira", nome: "Fritadeira elétrica", curto: "Fritadeira" },
  { id: "panela-pressao", nome: "Panela de pressão", curto: "Panela de pressão" },
  { id: "slowcooker", nome: "Panela de cozedura lenta", curto: "Cozedura lenta" },
  { id: "robo", nome: "Robô de cozinha", curto: "Robô de cozinha", desc: "Bimby, Monsieur Cuisine, Mycook e outros" },
  { id: "varinha", nome: "Varinha mágica", curto: "Varinha" },
  { id: "liquidificadora", nome: "Liquidificadora", curto: "Liquidificadora" },
  { id: "processador", nome: "Picadora / processador", curto: "Picadora" },
  { id: "grelhador", nome: "Grelhador elétrico", curto: "Grelhador" },
  { id: "sanduicheira", nome: "Tosteira / sanduicheira", curto: "Tosteira" },
  { id: "torradeira", nome: "Torradeira", curto: "Torradeira" },
  { id: "chaleira", nome: "Chaleira elétrica", curto: "Chaleira" },
  { id: "batedeira", nome: "Batedeira", curto: "Batedeira" },
  { id: "maquina-pao", nome: "Máquina de fazer pão", curto: "Máquina de pão" },
  { id: "iogurteira", nome: "Iogurteira", curto: "Iogurteira" },
  { id: "waffles", nome: "Máquina de waffles", curto: "Máq. de waffles" },
];

export const DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];

export const PREFS_PADRAO = {
  pessoas: 2,
  jantares: 5,
  sopa: true,
  pequenoAlmoco: false,
  sobremesa: false,
  orcamento: 40,
  vontades: [],
  dietas: [],
  evitar: [],
  equip: ["fogao", "forno", "microondas", "varinha"],
};

/* ── Receitas enriquecidas ────────────────────────────────────────── */

const r1 = (v) => Math.round(v * 10) / 10;

function nutricaoDe(linhas, porcoes) {
  const t = { kcal: 0, p: 0, hc: 0, g: 0, fib: 0 };
  for (const { ing, q } of linhas) {
    if (!ing.n || !ing.g) continue;
    const gramas = q * ing.g;
    const [kcal, p, hc, g, fib] = ing.n;
    t.kcal += (kcal * gramas) / 100;
    t.p += (p * gramas) / 100;
    t.hc += (hc * gramas) / 100;
    t.g += (g * gramas) / 100;
    t.fib += (fib * gramas) / 100;
  }
  return {
    kcal: Math.round(t.kcal / porcoes),
    p: Math.round(t.p / porcoes),
    hc: Math.round(t.hc / porcoes),
    g: Math.round(t.g / porcoes),
    fib: r1(t.fib / porcoes),
  };
}

/* A proteína principal e a base, para o plano não repetir dias seguidos. */
function proteinaDe(linhas) {
  const tem = (k) => linhas.some((l) => l.ing.gr.includes(k));
  if (tem("peixe")) return "peixe";
  if (tem("carne")) {
    const fam = linhas.find((l) => l.ing.gr.includes("carne"))?.ing.fam;
    return fam === "frango" ? "frango" : "carne";
  }
  if (linhas.some((l) => l.ing.leg)) return "leguminosa";
  if (tem("ovo")) return "ovo";
  return "legumes";
}
function baseDe(linhas) {
  const k = linhas.map((l) => l.key);
  if (k.includes("arroz")) return "arroz";
  if (linhas.some((l) => l.ing.fam === "massa")) return "massa";
  if (linhas.some((l) => l.ing.fam === "pao")) return "pao";
  if (k.includes("batata") || k.includes("batata-doce")) return "batata";
  return "outra";
}

function enriquecer(r) {
  const linhas = r.ing.map(([key, q]) => {
    const ing = INGREDIENTES[key];
    if (!ing) throw new Error(`Receita ${r.id}: ingrediente desconhecido "${key}"`);
    return { key, q, ing };
  });
  const grupos = [...new Set(linhas.flatMap((l) => l.ing.gr))];
  const porcoes = r.porcoes || PORCOES;
  const base = {
    ...r,
    porcoes,
    un: r.un || "pessoas",
    ingredientes: linhas.map(({ key, q, ing }) => ({
      key, q, u: ing.u, nome: ing.nome, compra: ing.compra,
      despensa: !!ing.desp, rotulo: !!ing.rot,
      qtd: formatarQtd(q, ing.u),
    })),
    nutricao: nutricaoDe(linhas, porcoes),
    grupos,
    proteina: proteinaDe(linhas),
    base: baseDe(linhas),
    dietas: DIETAS.filter((d) => !d.exclui.some((g) => grupos.includes(g))).map((d) => d.id),
    airfryer: r.equip.flat().includes("airfryer"),
    temRotulo: linhas.some((l) => l.ing.rot),
  };
  base.veg = base.dietas.includes("vegetariano");
  base.vegano = base.dietas.includes("vegano");
  base.vontades = VONTADES.filter((v) => v.teste(base)).map((v) => v.id);
  return base;
}

let CACHE = null;
export function receitas() {
  if (!CACHE) CACHE = RECEITAS.map(enriquecer);
  return CACHE;
}
export function receitaPorId(id) {
  return receitas().find((r) => r.id === id) || null;
}

/* ── Quantidades ──────────────────────────────────────────────────── */

const FRACOES = [[0.25, "¼"], [0.5, "½"], [0.75, "¾"]];
const PLURAL = { dente: "dentes", lata: "latas", molho: "molhos", folha: "folhas", fatia: "fatias", saqueta: "saquetas" };

function numeroComFracao(v) {
  const q = Math.round(v * 4) / 4;
  const inteiro = Math.floor(q);
  const resto = q - inteiro;
  const fr = FRACOES.find(([f]) => Math.abs(f - resto) < 0.01)?.[1] || "";
  if (!inteiro && !fr) return "¼";
  return `${inteiro || ""}${fr}`;
}
const virgula = (n) => String(n).replace(".", ",");

/** "500 g", "1,2 kg", "2 dentes", "½ lata", "q.b." */
export function formatarQtd(q, u) {
  if (u === "q.b.") return "q.b.";
  if (u === "g" || u === "ml") {
    const grande = u === "g" ? "kg" : "L";
    if (q >= 1000) return `${virgula(Math.round(q / 100) / 10)} ${grande}`;
    const passo = q >= 100 ? 10 : 5;
    return `${Math.max(passo, Math.round(q / passo) * passo)} ${u}`;
  }
  // Dentes de alho e folhas de louro não se partem: arredonda para cima.
  const n = u === "dente" || u === "folha" ? String(Math.max(1, Math.ceil(q - 0.01))) : numeroComFracao(q);
  if (u === "un") return `${n} un`;
  const plural = q > 1 && PLURAL[u] ? PLURAL[u] : u;
  return `${n} ${plural}`;
}

const SINGULAR = { pessoas: "pessoa", fatias: "fatia", iogurtes: "iogurte", "taças": "taça", canecas: "caneca", muffins: "muffin", "porções": "porção" };
/** "1 pessoa", "10 fatias", "8 iogurtes" */
export function rendimento(n, un = "pessoas") {
  return `${n} ${n === 1 ? SINGULAR[un] || un : un}`;
}

/** Ingredientes de uma receita para N pessoas. */
export function ingredientesPara(receita, pessoas = PORCOES) {
  const f = pessoas / receita.porcoes;
  return receita.ingredientes.map((i) => ({ ...i, q: i.q * f, qtd: formatarQtd(i.q * f, i.u) }));
}

/** "25 min", "1 h 15", "4 h" */
export function formatarTempo(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/* Minutos do temporizador de um passo: o primeiro "(20 min)" ou "20-30 min". */
export function minutosDoPasso(texto) {
  const m = String(texto).match(/(\d+)\s*(?:-\s*\d+\s*)?min/);
  return m ? Number(m[1]) : null;
}

/* ── Compatibilidade ──────────────────────────────────────────────── */

function temEquipamento(receita, equip) {
  const tenho = new Set(equip);
  return receita.equip.every((req) => (Array.isArray(req) ? req.some((e) => tenho.has(e)) : tenho.has(req)));
}

function evita(receita, evitar) {
  if (!evitar?.length) return false;
  const alvo = new Set(evitar);
  return receita.ingredientes.some((i) => alvo.has(i.key) || (INGREDIENTES[i.key].fam && alvo.has(INGREDIENTES[i.key].fam)));
}

/** A receita serve a quem cozinha? (dietas, o que evita, o que tem na cozinha) */
export function compativel(receita, prefs) {
  if ((prefs.dietas || []).some((d) => !receita.dietas.includes(d))) return false;
  if (evita(receita, prefs.evitar)) return false;
  if (prefs.equip && !temEquipamento(receita, prefs.equip)) return false;
  return true;
}

/* Evitar "cebola" também apanha a cebola roxa: a família conta. */
export function familiaDe(key) {
  return INGREDIENTES[key]?.fam || null;
}

/* ── Orçamento ────────────────────────────────────────────────────── */

/** € por pessoa e por jantar que o orçamento semanal dá. */
export function porRefeicao(prefs) {
  const n = Math.max(1, prefs.pessoas) * Math.max(1, prefs.jantares);
  return prefs.orcamento / n;
}

/** Faixa de custo mais alta que cabe no orçamento (1 = €, 2 = €€, 3 = €€€). */
export function faixaMaxima(prefs) {
  const e = porRefeicao(prefs);
  // Uma parte do orçamento vai para a sopa e para os básicos da despensa.
  const util = prefs.sopa ? e * 0.85 : e;
  if (util < 1.5) return 1;
  if (util < 3) return 2;
  return 3;
}

/* ── Gerar o plano ────────────────────────────────────────────────── */

/* Aleatório com semente: o mesmo plano sai igual se a semente for a mesma (testes, "anular"). */
function aleatorio(semente) {
  let a = semente >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const frescos = (r) => r.ingredientes.filter((i) => !i.despensa).map((i) => i.key);

/*
 * Pontuação de uma receita para um dia. O que pesa:
 *   - as vontades escolhidas (o mais importante);
 *   - caber no orçamento (acima da faixa, perde muito);
 *   - não repetir a proteína nem a base do dia anterior;
 *   - aproveitar ingredientes já comprados para outros dias (menos
 *     desperdício: a meia couve de segunda vai para a sopa de quarta);
 *   - as estrelas que a pessoa deu ao fazer a receita.
 */
function pontuar(r, ctx) {
  const { prefs, rnd, escolhidas, anterior, avaliacoes, faixa } = ctx;
  let p = rnd() * 1.5;
  const vont = prefs.vontades || [];
  if (vont.length) p += 2.2 * vont.filter((v) => r.vontades.includes(v)).length;
  if (r.custo > faixa) p -= 3.5 * (r.custo - faixa);
  else if (r.custo < faixa) p += 0.3;
  if (anterior) {
    if (anterior.proteina === r.proteina) p -= 1.6;
    if (anterior.base === r.base) p -= 0.8;
  }
  const jaComprado = new Set(escolhidas.flatMap(frescos));
  const partilhados = frescos(r).filter((k) => jaComprado.has(k) && !["cebola", "alho"].includes(k)).length;
  p += Math.min(1.2, partilhados * 0.4);
  const estrelas = avaliacoes?.[r.id]?.estrelas;
  if (estrelas >= 4) p += 0.8;
  else if (estrelas && estrelas <= 2) p -= 2;
  return p;
}

function escolher(pool, ctx) {
  let melhor = null;
  let pm = -Infinity;
  for (const r of pool) {
    const p = pontuar(r, ctx);
    if (p > pm) { pm = p; melhor = r; }
  }
  return melhor;
}

/** Quantas receitas servem a estas preferências, por tipo. */
export function contarCompativeis(prefs) {
  const todas = receitas().filter((r) => compativel(r, prefs));
  const de = (t) => todas.filter((r) => r.tipo === t).length;
  return { pratos: de("prato"), sopas: de("sopa"), manha: de("pequeno-almoco"), sobremesas: de("sobremesa"), total: todas.length };
}

/* Quantos pequenos-almoços diferentes entram no plano (a pessoa alterna entre eles). */
export const N_MANHA = 3;

/* Escolhe uma receita de um tipo, fora das que já estão no plano. */
function escolherDoTipo(tipo, prefs, { rnd, escolhidas, avaliacoes, faixa, excluir = new Set() }) {
  const pool = receitas().filter((r) => r.tipo === tipo && compativel(r, prefs) && !excluir.has(r.id));
  // As vontades ("rápido", "leve"…) contam; as que só fazem sentido ao jantar não pesam.
  return escolher(pool, { prefs, rnd, escolhidas, anterior: null, avaliacoes, faixa });
}

/**
 * Plano da semana: um prato por jantar, a começar à segunda-feira, e, se
 * pedidos, a sopa da semana, pequenos-almoços (até 3, para alternar) e
 * uma sobremesa para o fim de semana. `fixas` ({ dia: id }) e as fixas
 * dos extras ficam onde estão. Sem receitas compatíveis suficientes,
 * repete — e diz que é "a dobrar".
 */
export function gerarPlano(prefs, { semente = Date.now(), fixas = {}, sopaFixa = null, manhaFixas = [], sobremesaFixa = null, avaliacoes = {} } = {}) {
  const rnd = aleatorio(semente);
  const faixa = faixaMaxima(prefs);
  const compat = receitas().filter((r) => compativel(r, prefs));
  const pratos = compat.filter((r) => r.tipo === "prato");
  const n = Math.min(7, Math.max(1, prefs.jantares));

  const dias = [];
  const escolhidas = [];
  const usadas = new Set(Object.values(fixas));
  for (let d = 0; d < n; d++) {
    const fixa = fixas[d] && receitaPorId(fixas[d]);
    let r = fixa || null;
    if (!r) {
      let pool = pratos.filter((x) => !usadas.has(x.id));
      const repetida = !pool.length;
      if (repetida) pool = pratos;
      r = escolher(pool, { prefs, rnd, escolhidas, anterior: escolhidas[escolhidas.length - 1], avaliacoes, faixa });
      if (!r) { dias.push({ dia: d, id: null }); continue; }
      dias.push({ dia: d, id: r.id, ...(repetida ? { repetida: true } : {}) });
    } else {
      dias.push({ dia: d, id: r.id, fixa: true });
    }
    usadas.add(r.id);
    escolhidas.push(r);
  }

  const ctx = { rnd, escolhidas, avaliacoes, faixa };
  let sopa = null;
  if (prefs.sopa) {
    const fixa = sopaFixa && receitaPorId(sopaFixa);
    if (fixa) sopa = { id: fixa.id, fixa: true };
    else {
      const s = escolherDoTipo("sopa", { ...prefs, vontades: [] }, ctx);
      if (s) sopa = { id: s.id };
    }
  }

  let manha = [];
  if (prefs.pequenoAlmoco) {
    const ids = new Set();
    for (let i = 0; i < N_MANHA; i++) {
      const fixa = manhaFixas[i] && receitaPorId(manhaFixas[i]);
      const r = fixa || escolherDoTipo("pequeno-almoco", prefs, { ...ctx, excluir: ids });
      if (!r) break;
      ids.add(r.id);
      manha.push({ id: r.id, ...(fixa ? { fixa: true } : {}) });
    }
  }

  let sobremesa = null;
  if (prefs.sobremesa) {
    const fixa = sobremesaFixa && receitaPorId(sobremesaFixa);
    const r = fixa || escolherDoTipo("sobremesa", prefs, ctx);
    if (r) sobremesa = { id: r.id, ...(fixa ? { fixa: true } : {}) };
  }

  return { criadoEm: new Date().toISOString(), semente, prefs, dias, sopa, manha, sobremesa };
}

/* Os ids de tudo o que está no plano. */
function idsDoPlano(plano) {
  return new Set([
    ...plano.dias.map((d) => d.id),
    plano.sopa?.id, plano.sobremesa?.id,
    ...(plano.manha || []).map((m) => m.id),
  ].filter(Boolean));
}

/**
 * Troca uma receita do plano por outra compatível que ainda lá não esteja.
 * `alvo`: o número do dia, "sopa", "sobremesa" ou "manha-0", "manha-1"…
 */
export function trocarDia(plano, alvo, { semente = Date.now(), avaliacoes = {} } = {}) {
  const prefs = plano.prefs;
  const rnd = aleatorio(semente);
  const noPlano = idsDoPlano(plano);
  const escolhidas = plano.dias.filter((d) => d.dia !== alvo && d.id).map((d) => receitaPorId(d.id));
  const ctx = { rnd, escolhidas, avaliacoes, faixa: faixaMaxima(prefs), excluir: noPlano };

  if (alvo === "sopa") {
    const s = escolherDoTipo("sopa", { ...prefs, vontades: [] }, ctx);
    return s ? { ...plano, sopa: { id: s.id } } : plano;
  }
  if (alvo === "sobremesa") {
    const r = escolherDoTipo("sobremesa", prefs, ctx);
    return r ? { ...plano, sobremesa: { id: r.id } } : plano;
  }
  if (typeof alvo === "string" && alvo.startsWith("manha-")) {
    const i = Number(alvo.slice(6));
    const r = escolherDoTipo("pequeno-almoco", prefs, ctx);
    return r ? { ...plano, manha: plano.manha.map((m, k) => (k === i ? { id: r.id } : m)) } : plano;
  }
  const anterior = plano.dias.find((d) => d.dia === alvo - 1)?.id;
  const pool = receitas().filter((r) => r.tipo === "prato" && compativel(r, prefs) && !noPlano.has(r.id));
  const r = escolher(pool, { prefs, ...ctx, anterior: anterior && receitaPorId(anterior) });
  if (!r) return plano;
  return { ...plano, dias: plano.dias.map((d) => (d.dia === alvo ? { dia: alvo, id: r.id } : d)) };
}

/** Fixar / desafixar (fica no "Gerar de novo"). Mesmo `alvo` que trocarDia. */
export function alternarFixa(plano, alvo) {
  const vira = (x) => (x ? { ...x, fixa: !x.fixa } : x);
  if (alvo === "sopa") return { ...plano, sopa: vira(plano.sopa) };
  if (alvo === "sobremesa") return { ...plano, sobremesa: vira(plano.sobremesa) };
  if (typeof alvo === "string" && alvo.startsWith("manha-")) {
    const i = Number(alvo.slice(6));
    return { ...plano, manha: plano.manha.map((m, k) => (k === i ? vira(m) : m)) };
  }
  return { ...plano, dias: plano.dias.map((d) => (d.dia === alvo ? { ...d, fixa: !d.fixa } : d)) };
}

/** Volta a gerar, mantendo o que está fixado. */
export function regenerar(plano, { semente = Date.now(), avaliacoes = {}, prefs = plano.prefs } = {}) {
  const fixas = Object.fromEntries(plano.dias.filter((d) => d.fixa && d.id).map((d) => [d.dia, d.id]));
  const sopaFixa = plano.sopa?.fixa ? plano.sopa.id : null;
  const manhaFixas = (plano.manha || []).map((m) => (m.fixa ? m.id : null));
  const sobremesaFixa = plano.sobremesa?.fixa ? plano.sobremesa.id : null;
  return gerarPlano(prefs, { semente, fixas, sopaFixa, manhaFixas, sobremesaFixa, avaliacoes });
}

/* ── Compras do plano ─────────────────────────────────────────────── */

/*
 * Para quantas porções se cozinha cada receita do plano.
 *   prato: uma vez, para as pessoas;
 *   sopa: uma panela para os jantares da semana (uma tigela por pessoa
 *     por jantar), no máximo 3 panelas;
 *   pequeno-almoço: os 7 dias repartidos pelos que estão no plano;
 *   sobremesa: a receita tal como rende (um bolo é um bolo).
 */
export function porcoesNoPlano(plano, alvo, receita = null) {
  const { pessoas, jantares } = plano.prefs;
  if (alvo === "sopa") return Math.min(PORCOES * 3, Math.max(PORCOES, pessoas * jantares));
  if (alvo === "sobremesa") return receita?.porcoes || PORCOES;
  if (alvo === "manha") {
    // Pão, iogurtes caseiros, granola: rendem por si — faz-se uma fornada.
    if (receita && receita.un !== "pessoas") return receita.porcoes;
    return Math.ceil((pessoas * 7) / Math.max(1, (plano.manha || []).length));
  }
  return pessoas;
}

/**
 * Tudo o que é preciso comprar para o plano, somado por artigo:
 * [{ key, nome, compra, q, u, qtd, despensa, rotulo, receitas: [nomes] }]
 */
export function comprasDoPlano(plano) {
  const entradas = [
    ...plano.dias.filter((d) => d.id).map((d) => ({ r: receitaPorId(d.id), porcoes: porcoesNoPlano(plano, "prato") })),
    ...(plano.sopa ? [{ r: receitaPorId(plano.sopa.id), alvo: "sopa" }] : []),
    ...(plano.manha || []).map((m) => ({ r: receitaPorId(m.id), alvo: "manha" })),
    ...(plano.sobremesa ? [{ r: receitaPorId(plano.sobremesa.id), alvo: "sobremesa" }] : []),
  ].filter((e) => e.r).map((e) => ({ r: e.r, porcoes: e.porcoes ?? porcoesNoPlano(plano, e.alvo, e.r) }));

  const porKey = new Map();
  for (const { r, porcoes } of entradas) {
    for (const i of ingredientesPara(r, porcoes)) {
      const atual = porKey.get(i.key);
      if (atual) {
        atual.q += i.q;
        if (!atual.receitas.includes(r.nome)) atual.receitas.push(r.nome);
      } else {
        porKey.set(i.key, { key: i.key, nome: i.nome, compra: i.compra, q: i.q, u: i.u, despensa: i.despensa, rotulo: i.rotulo, receitas: [r.nome] });
      }
    }
  }
  return [...porKey.values()]
    .map((c) => ({ ...c, qtd: formatarQtd(c.q, c.u) }))
    .sort((a, b) => Number(a.despensa) - Number(b.despensa) || a.nome.localeCompare(b.nome, "pt"));
}

/** Nutrição média por pessoa nos jantares do plano. */
export function mediaDoPlano(plano) {
  const rs = plano.dias.filter((d) => d.id).map((d) => receitaPorId(d.id)).filter(Boolean);
  if (!rs.length) return null;
  const soma = (k) => rs.reduce((t, r) => t + r.nutricao[k], 0);
  return { kcal: Math.round(soma("kcal") / rs.length), p: Math.round(soma("p") / rs.length), fib: r1(soma("fib") / rs.length) };
}

/** Sugestão da semana — determinística (muda à segunda-feira). */
export function sugestaoDaSemana(data = new Date()) {
  const pratos = receitas().filter((r) => r.tipo === "prato");
  const inicio = new Date(data.getFullYear(), 0, 1);
  const semana = Math.floor((data - inicio) / (7 * 86400000));
  return pratos[semana % pratos.length];
}

/* Emoji por ingrediente (a lista já não mostra emojis, mas as receitas sim). */
const EMOJI_ING = [
  ["douradinhos", "🐟"], ["entremeada", "🥓"], ["bifes de vaca", "🥩"], ["bolacha", "🍪"], ["aletria", "🍝"],
  ["banana", "🍌"], ["maçã", "🍎"], ["pera", "🍐"], ["laranja", "🍊"], ["kiwi", "🥝"], ["morango", "🍓"], ["mirtilo", "🫐"],
  ["chocolate", "🍫"], ["cacau", "🍫"], ["mel", "🍯"], ["compota", "🫙"], ["frutos secos", "🥜"], ["café", "☕"],
  ["iogurte", "🥛"], ["bebida vegetal", "🥛"], ["aveia", "🌾"], ["farinha", "🌾"], ["fermento", "🫙"], ["açúcar", "🍬"],
  ["frango", "🍗"], ["carne", "🥩"], ["febras", "🥩"], ["hambúrg", "🍔"], ["chouriço", "🌭"], ["salsicha", "🌭"], ["fiambre", "🥓"],
  ["atum", "🐟"], ["pescada", "🐟"], ["bacalhau", "🐟"], ["salmão", "🐟"],
  ["ovo", "🥚"], ["queijo", "🧀"], ["mozarela", "🧀"], ["leite", "🥛"], ["natas", "🥛"], ["manteiga", "🧈"],
  ["batata-doce", "🍠"], ["batata", "🥔"], ["cebola", "🧅"], ["alho", "🧄"], ["cenoura", "🥕"],
  ["tomate", "🍅"], ["pimento", "🫑"], ["curgete", "🥒"], ["pepino", "🥒"], ["abóbora", "🎃"], ["cogumelo", "🍄"], ["milho", "🌽"],
  ["brócolos", "🥦"], ["couve", "🥬"], ["espinafre", "🥬"], ["grelos", "🥬"], ["alface", "🥬"], ["salsa", "🌿"], ["hortelã", "🌿"], ["coentros", "🌿"],
  ["feijão-verde", "🫛"], ["feijão", "🫘"], ["grão", "🫘"], ["lentilha", "🫘"], ["ervilha", "🫛"],
  ["arroz", "🍚"], ["massa", "🍝"], ["esparguete", "🍝"], ["macarr", "🍝"], ["massinhas", "🍝"],
  ["carcaça", "🍞"], ["baguete", "🥖"], ["pão", "🍞"], ["limão", "🍋"], ["vinho", "🍷"], ["azeite", "🫒"], ["azeitona", "🫒"], ["caril", "🍛"],
  ["abacate", "🥑"], ["cuscuz", "🌾"], ["óleo", "🫙"], ["vinagre", "🫙"], ["louro", "🍃"], ["orégãos", "🌿"],
  ["canela", "🌰"], ["pimenta", "🧂"], ["cominhos", "🧂"], ["colorau", "🧂"], ["sal", "🧂"],
];
export function emojiIngrediente(nome) {
  const n = String(nome).toLowerCase();
  for (const [chave, e] of EMOJI_ING) if (n.includes(chave)) return e;
  return "🛒";
}
