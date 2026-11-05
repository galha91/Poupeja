/*
 * Fruta e legumes: quanto custa levar a quantidade que se quer.
 *
 * Comparar só o €/kg enganava. O saco de 800 g a 1,24 €/kg "ganhava" à
 * maçã ao peso a 1,69 €/kg — mas quem quer 1 kg tem de levar 2 sacos
 * (1,98 €), e ao peso paga 1,69 €. Aqui escolhe-se quanto se quer levar
 * e conta-se o que se paga mesmo em cada loja:
 *   - ao peso: €/kg × quantidade;
 *   - embalagem: embalagens inteiras que cheguem para a quantidade.
 */

export const QUANTIDADES = [0.25, 0.5, 1, 1.5, 2];
export const QUANTIDADE_PADRAO = 1;

const dinheiro = (v) => Math.round(v * 100) / 100;

/* «250 g», «1 kg», «1,5 kg». */
export function textoPeso(kg) {
  if (!(kg > 0)) return "";
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${String(Math.round(kg * 1000) / 1000).replace(".", ",")} kg`;
}

/*
 * O que se paga por `kg` deste produto. Devolve { custo, embalagens, levas }:
 * embalagens = quantas se levam (null se ao peso), levas = kg que se levam.
 */
export function custoParaQuantidade(p, kg = QUANTIDADE_PADRAO) {
  if (!p || !(kg > 0)) return { custo: NaN, embalagens: null, levas: 0 };
  const base = Number(p.qtdBase);
  if (p.aoPeso || !(base > 0) || !(p.preco > 0)) {
    return { custo: dinheiro(p.precoUnidade * kg), embalagens: null, levas: kg };
  }
  // Uma folga de 3%: quem quer 1 kg leva o saco de 980 g, não dois.
  const embalagens = Math.max(1, Math.ceil((kg * 0.97) / base - 1e-9));
  return { custo: dinheiro(p.preco * embalagens), embalagens, levas: Math.round(base * embalagens * 1000) / 1000 };
}

/*
 * Esta pesquisa compara-se por quantidade? Só ao kg, no modo unidade, e
 * se for fruta ou legume do catálogo ou se alguma loja vender ao peso.
 */
export function comparaPorQuantidade({ modo, unidade, produtos = [], frutaLegume = false }) {
  if (modo === "embalagem" || unidade !== "kg") return false;
  return frutaLegume || produtos.some((p) => p.aoPeso && p.unidade === "kg");
}

/* «2 × 800 g · leva 1,6 kg», «ao peso». */
export function detalheQuantidade(p, kg) {
  const c = custoParaQuantidade(p, kg);
  if (!c.embalagens) return "ao peso";
  const emb = p.quantidade || textoPeso(Number(p.qtdBase));
  const levas = Math.abs(c.levas - kg) > 0.02 ? ` · levas ${textoPeso(c.levas)}` : "";
  return `${c.embalagens > 1 ? `${c.embalagens} × ` : ""}${emb}${levas}`;
}
