/*
 * Página pública /devolucoes — o direito de devolver compras online (livre
 * resolução) e a calculadora "até quando posso devolver". Sem I/O.
 *
 * Fonte: Decreto-Lei n.º 24/2014, de 14 de fevereiro, na versão atual
 * (alterado pela Lei 47/2014, DL 78/2018, DL 109-G/2021 e Lei 10/2023).
 * Artigos citados ao lado de cada regra.
 */
import { somarDias, somarMeses, diasEntre, paraData } from "./datas.js";

export const VERIFICADO_DEVOLUCOES = "2026-10-22";

export const FONTES_DEVOLUCOES = {
  lei: { href: "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2014-73222992", texto: "Decreto-Lei n.º 24/2014 (Diário da República)" },
  portal: { href: "https://www.consumidor.gov.pt/", texto: "Portal do Consumidor (DGC)" },
  livro: { href: "https://www.livroreclamacoes.pt/inicio", texto: "Livro de Reclamações Eletrónico" },
  arbitragem: { href: "https://www.consumidor.gov.pt/ral-mapa-e-lista-de-entidades", texto: "Centros de arbitragem de consumo" },
};

/*
 * Prazo para desistir de uma compra feita à distância ou fora da loja.
 *   onde: "online" (internet, telefone, catálogo) | "casa" (vendedor em
 *   casa ou numa excursão organizada pelo vendedor: 30 dias, art. 10.º, n.º 1)
 *   informado: a loja disse-te que podias desistir? Se não, o prazo cresce
 *   12 meses (art. 10.º, n.º 2).
 * O prazo conta a partir do dia seguinte ao da receção (o último volume,
 * se a encomenda veio em partes).
 */
export function calcularDevolucao({ dataRececao, onde = "online", informado = true }, hoje) {
  if (!paraData(dataRececao) || diasEntre(hoje, dataRececao) > 0) return null;
  const dias = onde === "casa" ? 30 : 14;
  const base = somarDias(dataRececao, dias);
  const fim = informado ? base : somarMeses(base, 12);
  const faltam = diasEntre(hoje, fim);
  return { dias, fim, faltam, aberto: faltam >= 0, alargado: !informado };
}

export const PRAZOS_DEVOLUCAO = [
  { prazo: "14 dias", oQue: "Para desistir de uma compra online, sem dar motivo, a contar da receção", art: "art. 10.º, n.º 1" },
  { prazo: "30 dias", oQue: "Se compraste a um vendedor em casa ou numa excursão organizada por ele", art: "art. 10.º, n.º 1" },
  { prazo: "+12 meses", oQue: "Se a loja não te informou que podias desistir", art: "art. 10.º, n.º 2" },
  { prazo: "14 dias", oQue: "Para enviares o produto de volta, depois de avisares", art: "art. 13.º, n.º 1" },
  { prazo: "14 dias", oQue: "Para a loja devolver o dinheiro, incluindo o envio normal", art: "art. 12.º, n.º 1" },
  { prazo: "a dobrar", oQue: "Se a loja não reembolsar a tempo, tem de devolver o dobro", art: "art. 12.º, n.º 6" },
];

/* O que não se pode devolver (art. 17.º), em linguagem simples. */
export const EXCECOES_DEVOLUCAO = [
  "Produtos feitos à medida ou personalizados (com o teu nome, por exemplo)",
  "Comida e outros produtos que se estragam depressa",
  "Produtos selados de higiene ou saúde que abriste (cosmética, roupa interior selada)",
  "CD, DVD, jogos ou software selados que abriste",
  "Jornais e revistas avulsos (as assinaturas podem ser canceladas)",
  "Viagens, hotéis, bilhetes de espetáculos e aluguer de carro com data marcada",
  "Conteúdos digitais (descargas, streaming) que já começaste a usar, se aceitaste perder o direito",
];

export const PERGUNTAS_DEVOLUCOES = [
  {
    p: "Posso devolver uma compra online sem dar motivo?",
    r: "Sim. Nas compras pela internet, por telefone ou por catálogo tens 14 dias, a contar do dia em que recebes o produto, para desistir sem explicar porquê (Decreto-Lei n.º 24/2014, art. 10.º). Chama-se direito de livre resolução.",
  },
  {
    p: "Quem paga os portes da devolução?",
    r: "Em regra, tu, se a loja te avisou disso antes da compra. Se não avisou, ou se se ofereceu para pagar, paga a loja (art. 13.º). O envio original é sempre reembolsado, na modalidade mais barata que a loja oferecia (art. 12.º).",
  },
  {
    p: "Posso devolver um produto que já abri?",
    r: "Sim. Podes abrir e experimentar como farias numa loja. Só respondes pela desvalorização se usaste mais do que isso (art. 14.º). As exceções são os produtos selados de higiene e os discos e software selados, que deixam de poder ser devolvidos depois de abertos (art. 17.º).",
  },
  {
    p: "Quanto tempo tem a loja para me devolver o dinheiro?",
    r: "14 dias a contar do dia em que a avisaste, pelo mesmo meio de pagamento que usaste (art. 12.º). A loja pode esperar até receber o produto ou até lhe mostrares o comprovativo de envio. Se não pagar a tempo, tem de devolver o dobro (art. 12.º, n.º 6).",
  },
  {
    p: "Como aviso a loja de que quero devolver?",
    r: "Com o formulário de livre resolução que a loja te deve dar, ou por qualquer declaração clara: e-mail, carta, telefone ou a própria devolução do produto (art. 11.º). Guarda a prova, porque és tu que tens de mostrar que avisaste a tempo. Basta enviar o aviso dentro do prazo.",
  },
  {
    p: "Numa loja física posso trocar ou devolver?",
    r: "A lei não obriga as lojas físicas a aceitar trocas ou devoluções de produtos sem defeito: é uma política de cada loja. Mas se a loja a anuncia (no talão, afixada ou no site), tem de a cumprir. Se o produto tem defeito, aplica-se sempre a garantia legal de 3 anos.",
  },
  {
    p: "E se o produto chegou com defeito?",
    r: "Isso já não é desistência, é garantia: tens 3 anos, e nos primeiros 30 dias podes pedir logo outro igual ou o dinheiro de volta (Decreto-Lei n.º 84/2021). Os portes são por conta da loja.",
  },
  {
    p: "Comprei num marketplace a um vendedor particular. Tenho os 14 dias?",
    r: "Só se o vendedor for uma empresa ou um profissional. Entre particulares estas regras não se aplicam, mas o marketplace tem de te dizer, antes da compra, se o vendedor é profissional ou não.",
  },
];

export function perguntasDevolucoesLd(perguntas = PERGUNTAS_DEVOLUCOES) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
