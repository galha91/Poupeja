/*
 * Reduflação e "embalagem família". Dois avisos, ambos sobre o preço ao
 * kg / L / unidade, que é o que a embalagem esconde:
 *
 *   1. armadilhasEmbalagem — na mesma pesquisa e na mesma loja, a
 *      embalagem grande ("família", "maxi", 5 kg) sai MAIS cara ao kg do
 *      que a pequena do mesmo produto. Vê-se logo, sem histórico.
 *
 *   2. detetarReduflacao — o mesmo produto (mesmo id na loja) passou a
 *      vir com menos quantidade e o preço não desceu na mesma proporção:
 *      paga-se mais por kg sem o preço da etiqueta mudar muito. Precisa
 *      do histórico de tamanhos (tabela produtos_embalagem).
 *
 * Funções puras: o servidor junta os dados, isto só decide.
 */

const LIMIAR_PCT = 3; // abaixo disto é arredondamento, não é notícia

const semAcentos = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");

/*
 * O nome sem a embalagem: "Arroz Carolino Família 5 kg" e "Arroz Carolino
 * 1kg" dão "arroz carolino". Serve só para juntar tamanhos do mesmo
 * produto dentro da mesma loja.
 */
export function nomeBase(nome) {
  return semAcentos(nome)
    .toLowerCase()
    .replace(/\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:kg|gr|g|lt|l|ml|cl|un|unid|unidades|rolos?|doses?|saquetas?|capsulas?|ovos)\b/g, " ")
    .replace(/\b(?:emb|embalagem|pack|packs|familia|familiar|maxi|mega|grande|poupanca|economico|formato|promo|x)\b\.?/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* 0.9 kg → "900 g"; 1.5 l → "1,5 L"; 12 un → "12 un". */
export function textoQtd(qtd, unidade) {
  const n = (v) => String(Math.round(v * 1000) / 1000).replace(".", ",");
  if (unidade === "kg") return qtd < 1 ? `${n(qtd * 1000)} g` : `${n(qtd)} kg`;
  if (unidade === "l") return qtd < 1 ? `${n(qtd * 1000)} ml` : `${n(qtd)} L`;
  return `${n(qtd)} ${unidade || "un"}`;
}

const pct = (novo, antigo) => Math.round(((novo - antigo) / antigo) * 100);

/*
 * Devolve um Map "loja|id" → { tipo: "familia", alternativa, pct }.
 * A alternativa é a embalagem mais pequena e mais barata ao kg.
 */
export function armadilhasEmbalagem(produtos = []) {
  const grupos = new Map();
  for (const p of produtos) {
    if (p.aoPeso || !(p.qtdBase > 0) || !(p.precoUnidade > 0) || !p.unidade) continue;
    const base = nomeBase(p.nome);
    if (!base) continue;
    const chave = [p.loja, p.unidade, semAcentos(p.marca || "").toLowerCase(), base].join("|");
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(p);
  }
  const out = new Map();
  for (const lista of grupos.values()) {
    if (lista.length < 2) continue;
    for (const grande of lista) {
      // A mais barata ao kg entre as embalagens mais pequenas que esta.
      const melhorPequena = lista
        .filter((o) => o.qtdBase < grande.qtdBase)
        .sort((a, b) => a.precoUnidade - b.precoUnidade)[0];
      if (!melhorPequena) continue;
      const diff = pct(grande.precoUnidade, melhorPequena.precoUnidade);
      if (diff < LIMIAR_PCT) continue;
      out.set(`${grande.loja}|${grande.id}`, {
        tipo: "familia",
        pct: diff,
        alternativa: {
          id: melhorPequena.id,
          nome: melhorPequena.nome,
          qtd: textoQtd(melhorPequena.qtdBase, melhorPequena.unidade),
          precoUnidade: melhorPequena.precoUnidade,
        },
      });
    }
  }
  return out;
}

/*
 * Linhas de produtos_embalagem de UM produto (mesma loja e id), uma por
 * tamanho já visto: { qtd, unidade, preco, primeiro_dia, ultimo_dia }.
 * O tamanho atual é o visto mais recentemente. Se antes houve um tamanho
 * maior, e agora se paga mais por kg do que então, é reduflação.
 */
export function detetarReduflacao(linhas = []) {
  const validas = linhas.filter((l) => l.qtd > 0 && l.preco > 0 && l.ultimo_dia);
  if (validas.length < 2) return null;
  const porData = [...validas].sort((a, b) => String(b.ultimo_dia).localeCompare(String(a.ultimo_dia)));
  const agora = porData[0];
  const antes = porData
    .slice(1)
    .filter((l) => l.unidade === agora.unidade && l.qtd > agora.qtd * (1 + LIMIAR_PCT / 100))
    .sort((a, b) => b.qtd - a.qtd)[0];
  if (!antes) return null;
  const unidAgora = agora.preco / agora.qtd;
  const unidAntes = antes.preco / antes.qtd;
  const aumento = pct(unidAgora, unidAntes);
  if (aumento < LIMIAR_PCT) return null; // encolheu mas o preço desceu a acompanhar
  return {
    tipo: "encolheu",
    pct: aumento,
    antes: { qtd: textoQtd(antes.qtd, antes.unidade), preco: antes.preco, dia: antes.ultimo_dia },
    agora: { qtd: textoQtd(agora.qtd, agora.unidade), preco: agora.preco },
  };
}
