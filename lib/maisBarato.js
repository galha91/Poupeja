/*
 * "Qual é o supermercado mais barato?" — as contas da página
 * /supermercado-mais-barato, a partir do histórico do Barómetro
 * (lib/barometro: uma linha de paginas_marca, já calculada no GitHub).
 * Sem React nem rede.
 *
 * Só se diz "mais barato" quando a semana não foi empate (o barómetro
 * marca `empate` quando a diferença é pequena ou depende de um artigo).
 */

const cent = (v) => Math.round(v * 100);
const valida = (s) => s && Array.isArray(s.lojas) && s.lojas.length >= 2 && s.lojas.every((l) => l.total > 0);

/**
 * @param semanas histórico do barómetro, da mais antiga para a mais recente
 * @param n       quantas semanas recentes contam
 * @returns null sem semanas, ou {
 *   ultima, semanas: k, empates,
 *   vitorias: [{ loja, nome, n }] (mais vitórias primeiro),
 *   distancia: { min, max } entre a mais barata e a mais cara, em euros
 * }
 */
export function resumoMaisBarato(semanas, n = 12) {
  const recentes = (Array.isArray(semanas) ? semanas : []).filter(valida).slice(-n);
  if (!recentes.length) return null;
  const vit = new Map();
  let empates = 0;
  const dist = [];
  for (const s of recentes) {
    const [primeira] = s.lojas;
    const ultimaLoja = s.lojas[s.lojas.length - 1];
    dist.push((cent(ultimaLoja.total) - cent(primeira.total)) / 100);
    if (s.empate) { empates++; continue; }
    const v = vit.get(primeira.loja) || { loja: primeira.loja, nome: primeira.nome, n: 0 };
    v.n++;
    vit.set(primeira.loja, v);
  }
  return {
    ultima: recentes[recentes.length - 1],
    semanas: recentes.length,
    empates,
    vitorias: [...vit.values()].sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, "pt")),
    distancia: { min: Math.min(...dist), max: Math.max(...dist) },
  };
}

/**
 * Duas cadeias frente a frente, nas semanas em que as duas têm preço.
 * null se nunca estiveram juntas. { semanas, a, b, empates, ultima: { dia, diff } }
 * (diff > 0: a ficou mais cara que b na semana mais recente).
 */
export function frenteAFrente(semanas, idA, idB, n = 12) {
  const juntas = (Array.isArray(semanas) ? semanas : []).filter(valida).slice(-n)
    .map((s) => ({ s, a: s.lojas.find((l) => l.loja === idA), b: s.lojas.find((l) => l.loja === idB) }))
    .filter((x) => x.a && x.b);
  if (!juntas.length) return null;
  let a = 0, b = 0, empates = 0;
  for (const x of juntas) {
    const d = cent(x.a.total) - cent(x.b.total);
    if (d < 0) a++;
    else if (d > 0) b++;
    else empates++;
  }
  const u = juntas[juntas.length - 1];
  return {
    semanas: juntas.length, a, b, empates,
    nomeA: u.a.nome, nomeB: u.b.nome,
    ultima: { dia: u.s.dia, diff: (cent(u.a.total) - cent(u.b.total)) / 100 },
  };
}
