import { LOJAS, relevancia, palavras } from "./index";
import { completarUnidade } from "./comum";

/*
 * Verificação diária de "Comparar preços".
 *
 * Não chega a loja responder 200: o que parte primeiro quando um
 * supermercado muda o site é a LEITURA — a página vem, mas os nomes ou os
 * preços deixam de sair. Por isso cada loja pesquisa produtos fixos, de
 * sempre, e o resultado só conta como bom se trouxer vários produtos com
 * preço por unidade dentro do plausível.
 */

// Produtos que as três lojas online têm sempre, com o intervalo de €/unidade
// que é realista. Um preço fora disto é sinal de leitura errada (por
// exemplo, o preço da embalagem lido como preço por litro).
const TESTES_ONLINE = [
  { q: "leite meio gordo", unidade: "l", min: 0.3, max: 3 },
  { q: "arroz", unidade: "kg", min: 0.4, max: 12 },
];
const MIN_PRODUTOS = 3;

// O Lidl só mostra as promoções da semana — nenhum produto está lá sempre.
// Verifica-se que a pesquisa responde e que, havendo artigos, os preços lêem.
const TESTE_LIDL = { q: "leite" };

async function testarOnline(loja, teste) {
  const itens = await loja.pesquisar(teste.q);
  const termos = palavras(teste.q);
  const bons = itens
    .filter((p) => p?.nome && p.preco > 0 && relevancia(p.nome, termos, p.categoria || "") === 2)
    .map(completarUnidade)
    .filter((p) => p.unidade === teste.unidade && p.precoUnidade >= teste.min && p.precoUnidade <= teste.max);
  if (bons.length < MIN_PRODUTOS) {
    throw new Error(`«${teste.q}»: ${itens.length} resultados, só ${bons.length} com preço por ${teste.unidade} válido (mínimo ${MIN_PRODUTOS})`);
  }
  const maisBarato = bons.sort((a, b) => a.precoUnidade - b.precoUnidade)[0];
  return `«${teste.q}»: ${bons.length} produtos, desde ${maisBarato.precoUnidade.toFixed(2).replace(".", ",")} €/${teste.unidade}`;
}

async function testarLidl(loja) {
  const itens = await loja.pesquisar(TESTE_LIDL.q);
  const comPreco = itens.filter((p) => p?.nome && p.preco > 0);
  if (itens.length && !comPreco.length) throw new Error(`«${TESTE_LIDL.q}»: ${itens.length} artigos, nenhum com preço lido`);
  return `«${TESTE_LIDL.q}»: responde, ${comPreco.length} artigos em promoção`;
}

async function verificarLoja(loja) {
  const testes = loja.id === "lidl"
    ? [() => testarLidl(loja)]
    : TESTES_ONLINE.map((t) => () => testarOnline(loja, t));
  const detalhes = [];
  for (const correr of testes) {
    // Uma segunda tentativa antes de dar o alarme: uma falha de rede
    // isolada não é um site partido.
    try {
      detalhes.push(await correr());
    } catch (e1) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        detalhes.push(await correr());
      } catch (e2) {
        return { id: loja.id, nome: loja.nome, ok: false, erro: String(e2?.message || e2).slice(0, 200) };
      }
    }
  }
  return { id: loja.id, nome: loja.nome, ok: true, detalhes };
}

export async function verificarLojas() {
  return Promise.all(LOJAS.map(verificarLoja));
}
