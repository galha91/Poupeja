/*
 * Lista de compras otimizada — as contas, sem interface nem rede.
 *
 * Entra uma linha por artigo com o custo em cada loja (já na mesma
 * quantidade, ver custoPorLoja em lib/comparacao) e sai:
 *   - a loja única mais barata para a lista;
 *   - a melhor divisão por 2 lojas e quanto poupa a mais;
 *   - os artigos sem preço e os que só algumas lojas têm.
 *
 * A regra de ouro: só se somam totais sobre os MESMOS artigos. Se uma
 * loja não tem o queijo, não pode "ganhar" por isso. O conjunto comparável
 * são os artigos que todas as lojas do grupo têm; o grupo são as lojas
 * com quase toda a lista (o Lidl, que só publica promoções, fica de fora
 * do grupo mas pode entrar na divisão por 2 lojas).
 *
 * Contas em cêntimos inteiros, para 0,1 + 0,2 não dar 0,30000000000000004.
 */

const cent = (v) => Math.round(v * 100);
const euros = (c) => c / 100;

/**
 * @param linhas [{ id, nome, custos: { [loja]: euros } }]
 * @param lojas  ids das lojas a considerar, pela ordem de preferência em empates
 * @param opcoes { limiarCobertura } fração da lista que uma loja tem de ter para entrar no grupo
 */
export function otimizarCabaz(linhas, lojas, { limiarCobertura = 0.8 } = {}) {
  const tem = (l, s) => Number.isFinite(l.custos?.[s]);

  const semPreco = linhas.filter((l) => !lojas.some((s) => tem(l, s)));
  const comPreco = linhas.filter((l) => lojas.some((s) => tem(l, s)));

  // Artigos que nem todas as lojas têm — para dizer quais têm.
  const parciais = comPreco
    .map((l) => ({ id: l.id, nome: l.nome, lojas: lojas.filter((s) => tem(l, s)) }))
    .filter((p) => p.lojas.length < lojas.length);

  const cobertura = Object.fromEntries(lojas.map((s) => [s, comPreco.filter((l) => tem(l, s)).length]));

  const vazio = { semPreco, parciais, comparaveis: [], grupo: [], porLoja: [], unica: null, maisCara: null, poupancaUnica: 0, divisao: null };
  if (!comPreco.length) return vazio;

  // Grupo: lojas com quase toda a lista. Pelo menos duas, se houver.
  const porCobertura = [...lojas].filter((s) => cobertura[s] > 0)
    .sort((a, b) => cobertura[b] - cobertura[a] || lojas.indexOf(a) - lojas.indexOf(b));
  let grupo = porCobertura.filter((s) => cobertura[s] / comPreco.length >= limiarCobertura);
  if (grupo.length < 2) grupo = porCobertura.slice(0, Math.min(2, porCobertura.length));

  // Conjunto comparável: o que todas as lojas do grupo têm. Se ficar
  // vazio, sai a loja com menos artigos até haver o que comparar.
  let comparaveis = comPreco.filter((l) => grupo.every((s) => tem(l, s)));
  while (!comparaveis.length && grupo.length > 1) {
    grupo = grupo.slice(0, -1);
    comparaveis = comPreco.filter((l) => grupo.every((s) => tem(l, s)));
  }

  const totalEm = (s) => comparaveis.reduce((t, l) => t + cent(l.custos[s]), 0);
  const porLoja = grupo
    .map((s) => ({
      loja: s,
      total: euros(totalEm(s)),
      cobertura: cobertura[s],
      emFalta: comPreco.filter((l) => !tem(l, s)).map((l) => l.id),
    }))
    .sort((a, b) => a.total - b.total || lojas.indexOf(a.loja) - lojas.indexOf(b.loja));

  const unica = porLoja[0] ? { loja: porLoja[0].loja, total: porLoja[0].total } : null;
  const ultima = porLoja[porLoja.length - 1];
  const maisCara = ultima ? { loja: ultima.loja, total: ultima.total } : null;
  const poupancaUnica = unica && maisCara ? euros(cent(maisCara.total) - cent(unica.total)) : 0;

  const divisao = melhorDivisao(comparaveis, lojas, unica);

  return {
    semPreco, parciais,
    comparaveis: comparaveis.map((l) => l.id),
    grupo, porLoja, unica, maisCara, poupancaUnica, divisao,
  };
}

/*
 * Todas as combinações de 2 lojas (com 5 lojas são 10 — não vale a pena
 * ser esperto). Cada artigo vai para a mais barata das duas. Só conta se
 * as duas cobrirem o conjunto comparável, se cada uma levar pelo menos um
 * artigo (senão é uma loja só) e se ficar mesmo mais barato.
 */
export function melhorDivisao(comparaveis, lojas, unica) {
  if (!unica || !comparaveis.length) return null;
  let melhor = null;
  for (let i = 0; i < lojas.length; i++) {
    for (let j = i + 1; j < lojas.length; j++) {
      const [a, b] = [lojas[i], lojas[j]];
      let total = 0;
      const atribuicao = { [a]: [], [b]: [] };
      let valida = true;
      for (const l of comparaveis) {
        const ca = l.custos?.[a];
        const cb = l.custos?.[b];
        const okA = Number.isFinite(ca);
        const okB = Number.isFinite(cb);
        if (!okA && !okB) { valida = false; break; }
        // Empate: fica na primeira, para não obrigar a ir à outra por nada.
        const vaiA = okA && (!okB || cent(ca) <= cent(cb));
        total += cent(vaiA ? ca : cb);
        atribuicao[vaiA ? a : b].push(l.id);
      }
      if (!valida || !atribuicao[a].length || !atribuicao[b].length) continue;
      if (!melhor || total < melhor.totalC) melhor = { lojas: [a, b], totalC: total, atribuicao };
    }
  }
  if (!melhor) return null;
  const extraC = cent(unica.total) - melhor.totalC;
  if (extraC <= 0) return null;
  return {
    lojas: melhor.lojas,
    total: euros(melhor.totalC),
    atribuicao: melhor.atribuicao,
    poupancaExtra: euros(extraC),
  };
}

/*
 * Poupança estimada de uma escolha, face à opção mais cara entre as
 * comparadas — a mesma conta que aparece no ecrã e no contador.
 */
export function poupancaDaEscolha(resultado, plano) {
  if (!resultado?.maisCara) return 0;
  const escolhido = plano === "divisao" ? resultado.divisao?.total : resultado.unica?.total;
  if (!Number.isFinite(escolhido)) return 0;
  return Math.max(0, euros(cent(resultado.maisCara.total) - cent(escolhido)));
}
