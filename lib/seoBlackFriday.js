/*
 * Página pública /black-friday — o desconto é verdadeiro? As regras dos
 * preços com redução e a calculadora do desconto real. Sem I/O.
 *
 * Fonte: Decreto-Lei n.º 70/2007, de 26 de março, na versão atual
 * (alterado pelos DL 10/2015, 109/2019, 9/2021, 109-G/2021 e Lei 10/2023).
 * O DL 109-G/2021 trouxe a regra dos 30 dias (diretiva europeia
 * «Omnibus»). Artigos citados ao lado de cada regra.
 */

export const VERIFICADO_BLACK_FRIDAY = "2026-10-27";

/* Última sexta-feira de novembro (o dia a seguir ao Dia de Ação de Graças nos EUA). */
export function diaBlackFriday(ano) {
  const d = new Date(Date.UTC(ano, 10, 30));
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const FONTES_BLACK_FRIDAY = {
  lei: { href: "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2007-34524175", texto: "Decreto-Lei n.º 70/2007 (Diário da República)" },
  asae: { href: "https://www.asae.gov.pt/", texto: "ASAE" },
  portal: { href: "https://www.consumidor.gov.pt/", texto: "Portal do Consumidor (DGC)" },
  livro: { href: "https://www.livroreclamacoes.pt/inicio", texto: "Livro de Reclamações Eletrónico" },
};

/*
 * O desconto anunciado bate certo?
 *   agora     — o preço com desconto
 *   riscado   — o preço «antes» que a loja mostra
 *   minimo30  — (opcional) o preço mais baixo que viste nos 30 dias antes
 *
 * A lei diz que o «antes» tem de ser o preço mais baixo dos 30 dias
 * anteriores à redução (art. 3.º, n.º 2, al. a). Se viste mais barato, o
 * desconto real conta-se a partir daí.
 *   "real"         — o riscado é o mínimo dos 30 dias (ou não sabes outro)
 *   "inflacionado" — já esteve mais barato: o desconto real é menor
 *   "falso"        — já esteve igual ou mais barato do que agora
 *   "sem-desconto" — o riscado não é mais alto do que o preço de agora
 */
export function verificarDesconto({ agora, riscado, minimo30 = null }) {
  const a = Number(agora), r = Number(riscado), m = minimo30 == null || minimo30 === "" ? null : Number(minimo30);
  if (!(a > 0) || !(r > 0)) return null;
  const pct = (de, para) => Math.round(((de - para) / de) * 100);
  const cent = (v) => Math.round(v * 100) / 100;
  if (r <= a) return { estado: "sem-desconto", anunciado: 0, real: 0, poupancaReal: 0 };
  const anunciado = pct(r, a);
  const referencia = m > 0 && m < r ? m : r;
  if (referencia <= a) return { estado: "falso", anunciado, real: 0, poupancaReal: 0, referencia };
  const real = pct(referencia, a);
  return {
    estado: referencia < r ? "inflacionado" : "real",
    anunciado,
    real,
    poupancaReal: cent(referencia - a),
    referencia,
  };
}

/* As regras que contam, em linguagem simples. */
export const REGRAS_DESCONTO = [
  { regra: "O preço «antes» tem de ser o mais baixo dos últimos 30 dias, não o preço de há meses nem um preço subido de propósito", art: "art. 3.º, n.º 2, al. a), e art. 5.º, n.º 1" },
  { regra: "A etiqueta tem de mostrar o preço novo e esse preço mais baixo anterior; a percentagem é opcional", art: "art. 6.º, al. a)" },
  { regra: "Têm de dizer quando começa e quanto tempo dura a promoção", art: "art. 4.º, n.º 1" },
  { regra: "Se o desconto vai subindo (20%, depois 30%…), conta o preço de antes da primeira descida", art: "art. 4.º, n.º 5" },
  { regra: "Compara-se na mesma unidade e na mesma condição: um pack não pode ser comparado com o preço de cada unidade", art: "art. 5.º-A" },
  { regra: "Em fruta, legumes e outros frescos, ou produtos a 4 semanas do fim da validade, a referência é o mais baixo dos últimos 15 dias", art: "art. 5.º, n.º 6" },
  { regra: "É a loja que tem de provar o preço anterior, não és tu", art: "art. 5.º, n.º 5" },
  { regra: "Tem de aceitar os meios de pagamento habituais, sem mudar o preço conforme pagas", art: "art. 7.º, n.º 2" },
  { regra: "Valem também nas compras online", art: "art. 2.º, al. c)" },
];

export const PERGUNTAS_BLACK_FRIDAY = [
  {
    p: "Como sei se um desconto da Black Friday é verdadeiro?",
    r: "O preço riscado tem de ser o preço mais baixo a que a loja vendeu o produto nos 30 dias antes do desconto (Decreto-Lei n.º 70/2007, art. 3.º). Se a loja subiu o preço em outubro para o «baixar» em novembro, o preço riscado não pode ser o de outubro. Se viste o produto mais barato nesse período, o desconto real conta-se a partir desse preço.",
  },
  {
    p: "A loja pode subir o preço antes da Black Friday e depois anunciar desconto?",
    r: "Pode mudar os preços quando quiser, mas o desconto tem de ser real em relação ao preço mais baixo dos 30 dias anteriores (art. 5.º, n.º 1). Se em outubro esteve a 80 € e em novembro está a 79 € com «-40%», o desconto real é de pouco mais de 1%, e o anúncio está errado. É uma contraordenação económica grave (art. 16.º).",
  },
  {
    p: "Qual é a data da Black Friday em 2026?",
    r: "É a sexta-feira 27 de novembro de 2026. Muitas lojas começam na semana antes e prolongam até à Cyber Monday, a 30 de novembro. A lei aplica-se a todos esses dias da mesma maneira.",
  },
  {
    p: "Os produtos em promoção têm menos garantia?",
    r: "Não. Um produto comprado com desconto tem a mesma garantia legal de 3 anos (Decreto-Lei n.º 84/2021). Se o compraste online, tens também os mesmos 14 dias para desistir sem dar motivo (Decreto-Lei n.º 24/2014).",
  },
  {
    p: "Posso trocar um produto comprado em promoção numa loja física?",
    r: "A lei não obriga a loja a trocar um produto sem defeito. Se a loja oferece a troca, tem de a aceitar pelo menos nos primeiros 5 dias úteis depois da compra, com o produto como estava e o talão a dizer que a troca é possível (art. 8.º). Com defeito, aplica-se sempre a garantia.",
  },
  {
    p: "E se o produto da promoção esgotar?",
    r: "Quando acaba o stock de um produto anunciado com marca e modelo, a loja tem de avisar que esgotou e terminar a promoção desse produto (art. 7.º, n.º 1). Não pode continuar a anunciá-lo para atrair clientes.",
  },
  {
    p: "Onde me queixo de um desconto falso?",
    r: "No Livro de Reclamações (em papel na loja ou o eletrónico, também para compras online). A fiscalização é da ASAE (art. 15.º). Guarda uma captura de ecrã ou foto do preço antes e durante a promoção: a loja é que tem de provar o preço anterior, mas a tua prova ajuda.",
  },
];

export function perguntasBlackFridayLd(perguntas = PERGUNTAS_BLACK_FRIDAY) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
