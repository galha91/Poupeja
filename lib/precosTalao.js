import { lerQuantidade, arred } from "./supermercados/comum.js"; // com .js: os testes correm em node sem bundler

/*
 * Preços tirados dos talões que as pessoas fotografam — as contas, sem I/O.
 *
 * O Lidl não publica online os preços do sortido fixo (só os do folheto) e
 * o Mercadona não vende online em Portugal: esses preços só existem
 * impressos no talão. Cada talão lido guarda as linhas de artigos numa
 * tabela partilhada (precos_talao), SEM a foto, sem quem o tirou e sem
 * nada do cabeçalho (NIF, cartão, morada da loja): só loja, artigo, preço
 * e data. A pesquisa de preços junta depois estas linhas às da loja.
 */

const LOJAS = [
  ["lidl", /\blidl\b/i],
  ["mercadona", /mercadona/i],
  ["continente", /continente|modelo/i],
  ["pingo-doce", /pingo\s*doce/i],
  ["auchan", /auchan|jumbo|minipre[çc]o/i],
  ["aldi", /\baldi\b/i],
  ["intermarche", /intermarch/i],
  ["froiz", /froiz/i],
  ["apolonia", /apol[oó]nia/i],
  ["elcorteingles", /corte\s*ingl/i],
  ["eleclerc", /leclerc/i],
];
export function idLoja(nome) {
  const t = String(nome || "");
  return (LOJAS.find(([, re]) => re.test(t)) || [])[0] || null;
}

export const nomeBusca = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.,%/ ]+/g, " ").replace(/\s+/g, " ").trim();

// Linhas do talão que não são artigos.
const NAO_ARTIGO = /desconto|poupan|cup[aã]o|vale\b|\biva\b|total|subtotal|troco|multibanco|cart[aã]o|pagamento|saco(s)? (de )?(pl[aá]stico|papel)|tara|dep[oó]sito|arredond/i;
const MAX_IDADE_DIAS = 180;

/*
 * dados = resposta do /api/ler-talao. Devolve as linhas para gravar, ou []
 * se o talão não for de uma cadeia conhecida ou a data não fizer sentido.
 */
export function linhasTalao(dados, hoje = new Date()) {
  const loja = idLoja(dados?.loja);
  const data = String(dados?.data || "");
  if (!loja || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return [];
  const dias = (hoje.getTime() - Date.parse(`${data}T12:00:00Z`)) / 86400000;
  if (!(dias > -1.5 && dias < MAX_IDADE_DIAS)) return [];

  const vistos = new Set();
  const linhas = [];
  for (const p of Array.isArray(dados.produtos) ? dados.produtos : []) {
    const bruto = String(p?.nome || "").trim();
    const legivel = String(p?.nomeLegivel || "").trim() || bruto;
    if (legivel.length < 3 || NAO_ARTIGO.test(bruto) || NAO_ARTIGO.test(legivel)) continue;

    const precoKg = Number(p?.precoKg);
    const aoPeso = precoKg > 0 && Number(p?.kg) > 0;
    const qtd = Number(p?.qtd) > 0 ? Number(p.qtd) : 1;
    const unitario = aoPeso ? precoKg : Number(p?.preco) > 0 ? Number(p.preco) : Number(p?.total) / qtd;
    if (!(unitario > 0 && unitario < 300)) continue;

    const q = aoPeso ? null : lerQuantidade(legivel) || lerQuantidade(bruto);
    const busca = nomeBusca(`${legivel} ${bruto !== legivel ? bruto : ""}`);
    const chave = `${busca}|${unitario}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    linhas.push({
      loja,
      nome: legivel.slice(0, 120),
      nome_busca: busca.slice(0, 200),
      preco: arred(unitario),
      preco_unidade: aoPeso ? arred(precoKg) : q ? arred(unitario / q.qtd) : null,
      unidade: aoPeso ? "kg" : q ? q.unidade : null,
      ao_peso: aoPeso,
      data,
    });
  }
  return linhas;
}

/* "2026-10-12" → "12/10" */
const diaMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/*
 * Linhas da tabela → artigos no formato dos adaptadores. Fica a mais
 * recente de cada artigo (a mesma coisa comprada em dias diferentes).
 */
export function artigosDeTalao(linhas) {
  const porNome = new Map();
  for (const l of linhas || []) {
    const atual = porNome.get(l.nome_busca);
    if (!atual || l.data > atual.data) porNome.set(l.nome_busca, l);
  }
  return [...porNome.values()].map((l) => ({
    id: `talao:${l.nome_busca}`,
    nome: l.nome,
    marca: null,
    quantidade: null,
    aoPeso: !!l.ao_peso,
    preco: Number(l.preco),
    precoAntigo: null,
    precoUnidade: l.preco_unidade != null ? Number(l.preco_unidade) : null,
    unidade: l.unidade || null,
    promo: null,
    onde: "loja",
    periodo: `talão de ${diaMes(String(l.data))}`,
    url: null,
    imagem: null,
  }));
}

/* Palavras para a pesquisa na tabela: sem acentos, sem o "s" final. */
export function termosBusca(q) {
  return nomeBusca(q).split(" ").filter((w) => w.length >= 3).slice(0, 3).map((w) => (w.length > 4 ? w.replace(/(es|s)$/, "") : w));
}
