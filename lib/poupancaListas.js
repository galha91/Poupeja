/*
 * "Quanto poupaste" com a lista otimizada.
 *
 * Cada vez que alguém escolhe onde vai comprar ("Vou ao Continente",
 * "Vou dividir pelas 2 lojas"), guarda-se a poupança ESTIMADA dessa
 * escolha: o custo da lista na opção mais cara entre os supermercados
 * comparados, menos o custo na opção escolhida, com os preços desse dia.
 *
 * É uma estimativa e diz-se isso em todo o lado: não sabemos o que a
 * pessoa comprou de facto, nem o que pagaria numa loja que não comparamos.
 *
 * Fica no dispositivo (localStorage) e, com sessão iniciada, na conta
 * (lib/sync). Não guarda nomes de artigos — só valores, lojas e datas.
 */

export const LS_POUPANCA_LISTAS = "poupeja_poupanca_listas";
const MAX_REGISTOS = 300;

export const COMO_CALCULAMOS =
  "Quando escolhes onde comprar a tua lista, somamos a diferença entre o supermercado mais caro e a opção que escolheste, com os preços desse dia. Uma lista conta uma vez por dia. É uma estimativa: considera só os supermercados comparados e não sabemos o que acabaste por comprar.";

export function lerRegistos() {
  try {
    const l = JSON.parse(localStorage.getItem(LS_POUPANCA_LISTAS) || "[]");
    return Array.isArray(l) ? l : [];
  } catch { return []; }
}

const diaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/*
 * A mesma lista no mesmo dia conta uma vez: comparar outra vez e escolher
 * outra loja substitui a escolha anterior, não a soma.
 */
export function juntarRegisto(registos, novo) {
  const resto = registos.filter((r) => !(r.dia === novo.dia && r.lista === novo.lista));
  return [novo, ...resto].slice(0, MAX_REGISTOS);
}

export function registarEscolha({ plano, lojas, valor, artigos, lista }, agora = new Date()) {
  const novo = {
    id: agora.getTime(),
    dia: diaLocal(agora),
    plano, lojas, artigos,
    lista: String(lista || ""),
    valor: Math.round(Math.max(0, valor) * 100) / 100,
  };
  const todos = juntarRegisto(lerRegistos(), novo);
  try { localStorage.setItem(LS_POUPANCA_LISTAS, JSON.stringify(todos)); } catch {}
  return novo;
}

/* Identificador estável de uma lista: os nomes, ordenados (não sai do dispositivo em claro). */
export function chaveLista(nomes) {
  const s = [...nomes].map((n) => String(n).toLowerCase().trim()).sort().join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* Semana de segunda a domingo; mês civil. Datas locais. */
export function somarPeriodos(registos, agora = new Date()) {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const iniSemana = diaLocal(segunda);
  const iniMes = diaLocal(new Date(agora.getFullYear(), agora.getMonth(), 1));
  const fim = diaLocal(hoje);
  let semana = 0, mes = 0, total = 0;
  for (const r of registos || []) {
    const v = Math.round((Number(r.valor) || 0) * 100);
    if (!r?.dia || v <= 0 || r.dia > fim) continue;
    total += v;
    if (r.dia >= iniSemana) semana += v;
    if (r.dia >= iniMes) mes += v;
  }
  return { semana: semana / 100, mes: mes / 100, total: total / 100, n: (registos || []).length };
}
