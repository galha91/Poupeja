/*
 * Página pública /garantias — as regras da garantia legal e a calculadora
 * "até quando vai a minha garantia". Sem I/O, para se testar à parte.
 *
 * Fonte: Decreto-Lei n.º 84/2021, de 18 de outubro (em vigor desde
 * 1/1/2022), texto do Diário da República. Artigos citados ao lado de cada
 * regra. Para compras anteriores a 2022 aplica-se o DL 67/2003 (2 anos).
 */
import { somarMeses, somarDias, diasEntre, paraData } from "./datas.js";
import { MESES_GARANTIA_LEGAL, MESES_USADO_MINIMO } from "./garantias.js";

export const VERIFICADO_GARANTIAS = "2026-10-22";
export const INICIO_REGIME_NOVO = "2022-01-01";
export const MAX_REPARACOES = 4;
export const MESES_POR_REPARACAO = 6;

export const FONTES_GARANTIAS = {
  lei: { href: "https://diariodarepublica.pt/dr/detalhe/decreto-lei/84-2021-172938301", texto: "Decreto-Lei n.º 84/2021 (Diário da República)" },
  portal: { href: "https://www.consumidor.gov.pt/", texto: "Portal do Consumidor (DGC)" },
  livro: { href: "https://www.livroreclamacoes.pt/inicio", texto: "Livro de Reclamações Eletrónico" },
  arbitragem: { href: "https://www.consumidor.gov.pt/ral-mapa-e-lista-de-entidades", texto: "Centros de arbitragem de consumo" },
};

/*
 * Garantia de um bem móvel comprado a uma empresa.
 *   estado: "novo" (também recondicionado) | "usado" | "usado-18" (usado,
 *   com redução a 18 meses escrita no contrato/fatura).
 * Devolve null se a data não servir; senão os fins de cada prazo e o estado.
 */
export function calcularGarantia({ dataCompra, estado = "novo", reparacoes = 0 }, hoje) {
  if (!paraData(dataCompra) || diasEntre(hoje, dataCompra) > 0) return null;
  const antigo = dataCompra < INICIO_REGIME_NOVO;
  const reduzida = estado === "usado-18";
  // Regime antigo (DL 67/2003): 2 anos, ou 1 ano nos usados por acordo.
  const base = antigo ? (reduzida ? 12 : 24) : (reduzida ? MESES_USADO_MINIMO : MESES_GARANTIA_LEGAL);
  const n = antigo ? 0 : Math.min(Math.max(Math.round(Number(reparacoes) || 0), 0), MAX_REPARACOES);
  const fim = somarMeses(dataCompra, base + n * MESES_POR_REPARACAO);
  // Presunção (art. 13.º): 2 anos, ou 1 ano se a garantia do usado foi reduzida.
  const fimPresuncao = somarMeses(dataCompra, antigo ? base : (reduzida ? 12 : 24));
  const fimRejeicao = somarDias(dataCompra, 30);
  const dias = diasEntre(hoje, fim);
  return {
    antigo, meses: base + n * MESES_POR_REPARACAO, reparacoes: n,
    fim, fimPresuncao, fimRejeicao,
    dias,
    valida: dias >= 0,
    presuncao: diasEntre(hoje, fimPresuncao) >= 0,
    rejeicao: !antigo && diasEntre(hoje, fimRejeicao) >= 0,
  };
}

/* Os prazos que contam, em tabela. */
export const PRAZOS_GARANTIA = [
  { prazo: "3 anos", oQue: "Garantia de bens novos e recondicionados, a contar da entrega", art: "art. 12.º, n.º 1" },
  { prazo: "18 meses", oQue: "Mínimo para bens usados, só se o comprador aceitar a redução por escrito", art: "art. 12.º, n.º 3" },
  { prazo: "30 dias", oQue: "Defeito no 1.º mês: podes pedir logo outro igual ou o dinheiro de volta", art: "art. 16.º" },
  { prazo: "30 dias", oQue: "Tempo máximo, em regra, para a loja reparar ou trocar", art: "art. 18.º, n.º 3" },
  { prazo: "+6 meses", oQue: "A mais de garantia por cada reparação, até 4 reparações", art: "art. 18.º, n.º 4" },
  { prazo: "2 anos", oQue: "Defeito que aparece nos 2 primeiros anos presume-se de origem: a loja é que tem de provar o contrário", art: "art. 13.º" },
  { prazo: "2 anos", oQue: "Para fazeres valer os teus direitos depois de comunicares o defeito", art: "art. 17.º" },
  { prazo: "10 anos", oQue: "O fabricante tem de ter peças, depois de deixar de vender o modelo", art: "art. 21.º" },
  { prazo: "10 / 5 anos", oQue: "Casas: 10 anos para defeitos estruturais, 5 para os restantes", art: "art. 23.º" },
];

export const PERGUNTAS_GARANTIAS = [
  {
    p: "A garantia é de 2 ou de 3 anos?",
    r: "Para compras feitas desde 1 de janeiro de 2022, a garantia legal é de 3 anos a contar da entrega (Decreto-Lei n.º 84/2021, art. 12.º). Para compras anteriores valia o regime antigo, de 2 anos.",
  },
  {
    p: "Preciso da fatura para usar a garantia?",
    r: "Precisas de provar quando e onde compraste. A fatura é a prova mais simples; o talão, o extrato do cartão ou o e-mail da encomenda também servem como prova da compra.",
  },
  {
    p: "A loja pode mandar-me falar com a marca?",
    r: "Quem responde pela garantia legal é quem te vendeu (art. 12.º). Podes, se preferires, pedir a reparação ou a troca diretamente ao fabricante (art. 40.º), mas a loja não se pode recusar a tratar do assunto.",
  },
  {
    p: "Quanto tempo tem a loja para reparar?",
    r: "Em regra, 30 dias (art. 18.º, n.º 3), sem custos para ti: transporte, peças e mão de obra são por conta do vendedor. Se não cumprir, podes pedir a redução do preço ou desfazer a compra (art. 15.º, n.º 4).",
  },
  {
    p: "Depois de uma reparação a garantia aumenta?",
    r: "Sim: cada reparação acrescenta 6 meses de garantia, até 4 reparações (art. 18.º, n.º 4). Se a loja trocar o produto por um novo, o novo tem garantia de 3 anos (art. 18.º, n.º 6).",
  },
  {
    p: "E os produtos usados?",
    r: "Também têm 3 anos. A loja só pode reduzir para 18 meses se tu aceitares e isso ficar escrito; nesse caso a presunção de defeito de origem passa a 1 ano (arts. 12.º e 13.º). Recondicionados contam sempre como novos.",
  },
  {
    p: "A garantia cobre estragos que eu fiz?",
    r: "Não. A garantia cobre defeitos do produto (falta de conformidade), não quedas, mau uso ou o desgaste normal. Nos 2 primeiros anos é a loja que tem de provar que o problema não é de origem.",
  },
  {
    p: "Comprei online: é a mesma garantia?",
    r: "Sim, a garantia é igual. Além dela, nas compras à distância tens 14 dias para devolver sem dar motivo (direito de livre resolução, Decreto-Lei n.º 24/2014), que é outra coisa.",
  },
];

export function perguntasLd(perguntas = PERGUNTAS_GARANTIAS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
