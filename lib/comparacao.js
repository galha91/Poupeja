/*
 * Leitura de uma resposta de /api/precos-supermercado, partilhada pelo
 * ecrã "Comparar preços" e pela comparação da lista de compras. Só corre
 * no browser — nada aqui vai buscar páginas às lojas.
 */

export const valorComparacao = (p, modo) => (modo === "embalagem" ? p.preco : p.precoUnidade);

/*
 * O melhor produto de cada loja para aquela pesquisa, comparável entre
 * lojas: só o que é mesmo o artigo (relevância 2, ou tudo se não houver),
 * e só na unidade principal (não se compara €/kg com €/un).
 */
export function melhoresPorLoja(dados) {
  const modo = dados.modo || "unidade";
  const principais = dados.produtos.filter((p) => p.relevancia === 2);
  const base = principais.length ? principais : dados.produtos;
  const unidade = base[0]?.unidade;
  const comparaveis = modo === "embalagem" ? base : base.filter((p) => p.unidade === unidade);
  const melhores = {};
  for (const p of comparaveis) {
    const atual = melhores[p.loja];
    if (!atual || valorComparacao(p, modo) < valorComparacao(atual, modo)) melhores[p.loja] = p;
  }
  const ranking = Object.values(melhores).sort((a, b) => valorComparacao(a, modo) - valorComparacao(b, modo));
  return { modo, unidade, principais, melhores, ranking };
}

/*
 * Quanto custa um artigo da lista em cada loja, para a MESMA quantidade.
 * Sem isto, um saco de 3 kg de laranjas perdia para uma rede de 1 kg só
 * por ser maior. A quantidade de referência é a mediana das embalagens
 * escolhidas em cada loja (o que se ao peso conta como 1 kg): 1 L de leite
 * e não o pack de 8 L do mais barato; 1 kg de frango e não os 150 g das
 * embalagens pequenas que aparecem na pesquisa. Nas ervas conta o molho.
 */
export function custoPorLoja(dados, qtd = 1) {
  const { modo, melhores, ranking } = melhoresPorLoja(dados);
  const vencedor = ranking[0];
  if (!vencedor) return { custos: {}, referencia: null };
  let ref = null;
  if (modo !== "embalagem") {
    const qtds = Object.values(melhores).map((p) => (p.aoPeso ? 1 : p.qtdBase || 1)).sort((a, b) => a - b);
    const meio = Math.floor(qtds.length / 2);
    ref = qtds.length % 2 ? qtds[meio] : (qtds[meio - 1] + qtds[meio]) / 2;
  }
  const custos = {};
  for (const [loja, p] of Object.entries(melhores)) {
    custos[loja] = {
      produto: p,
      custo: Math.round((modo === "embalagem" ? p.preco : p.precoUnidade * ref) * qtd * 100) / 100,
    };
  }
  return { custos, referencia: ref ? { qtd: Math.round(ref * 1000) / 1000, unidade: vencedor.nomeUnidade || vencedor.unidade } : null };
}

/* Nome de um artigo da lista → termo de pesquisa ("Atum (lata)" → "atum"). */
export function termoDePesquisa(nome) {
  return String(nome || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bcong\.?$/, "congelados")
    .replace(/\bmáq\.?/, "máquina")
    .replace(/\bembal\.?/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}
