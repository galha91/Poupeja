/*
 * Páginas públicas de preços (/precos, /comparar) — as contas e os textos,
 * sem base de dados, para se poderem testar à parte.
 *
 * A fonte é a tabela precos_supermercado_historico: o melhor preço de cada
 * cadeia, por artigo e por dia (ver lib/supermercados/historico). Cada
 * página diz o que só ela pode dizer — quem é mais barato hoje, por quanto,
 * e se o preço está bom face aos últimos 30 dias. Sem dados suficientes, a
 * página existe (os links não partem) mas fica fora do Google (noindex).
 */
import { CATEGORIAS, ITENS } from "../data/catalogo-lista.js";
import { resumirHistorico, avaliarPreco } from "./historicoPrecos.js";

/* Cadeias com preços online — as únicas que a comparação conhece. */
export const LOJAS_SEO = [
  { id: "continente", nome: "Continente", slug: "continente", logo: "continente" },
  { id: "pingo-doce", nome: "Pingo Doce", slug: "pingo-doce", logo: "pingodoce" },
  { id: "auchan", nome: "Auchan", slug: "auchan", logo: "auchan" },
  { id: "lidl", nome: "Lidl", slug: "lidl", logo: "lidl" },
  { id: "aldi", nome: "Aldi", slug: "aldi", logo: "aldi" },
  { id: "apolonia", nome: "Apolónia", slug: "apolonia", logo: null },
];
const LOJA = Object.fromEntries(LOJAS_SEO.map((l) => [l.id, l]));
export const nomeLoja = (id) => LOJA[id]?.nome || id;
export const lojaPorSlug = (slug) => LOJAS_SEO.find((l) => l.slug === slug) || null;


/* Um preço só conta como "de hoje" se tiver sido visto há 3 dias ou menos. */
export const FRESCO_DIAS = 3;
/* Abaixo disto não há comparação: uma cadeia sozinha não é "mais barata" que nada. */
export const MIN_LOJAS = 2;
/* Uma comparação entre duas cadeias só vale com artigos suficientes em comum. */
export const MIN_COMUNS = 10;

// O mesmo que a API faz à pesquisa antes de gravar: é a chave da tabela.
export const normalizarQ = (q) => String(q || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);

const NOME_CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nome]));
export const CATEGORIAS_SEO = CATEGORIAS.map((c) => ({ slug: c.id, nome: c.nome }));

/* Os artigos do catálogo da lista, cada um com a sua página. */
export const ARTIGOS_SEO = ITENS.map((i) => ({
  slug: i.id,
  nome: i.nome,
  nomeCurto: i.nome.replace(/\s*\([^)]*\)/g, "").trim(),
  q: normalizarQ(i.q),
  categoria: i.cat,
  categoriaNome: NOME_CAT[i.cat],
}));
const POR_SLUG = new Map(ARTIGOS_SEO.map((a) => [a.slug, a]));
const POR_NOME = new Map(ARTIGOS_SEO.map((a) => [semAcentos(a.nome), a]));
export const artigoPorSlug = (slug) => POR_SLUG.get(slug) || null;
/* "Batatas" (o nome de compra de um ingrediente) → o artigo, se houver. */
export const artigoPorNome = (nome) => POR_NOME.get(semAcentos(nome)) || null;

function semAcentos(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export { dataCurta, diasAntes, hojeLisboa, euros, porUnidade, cortar, SEM_PRECOS_ONLINE } from "./seoFormato.js";
import { dataCurta, diasAntes, euros, porUnidade, cortar } from "./seoFormato.js";

/* Código UN/CEFACT para o UnitPriceSpecification do schema.org. */
const CODIGO_UNIDADE = { kg: "KGM", L: "LTR", l: "LTR" };

/* ── Um artigo ── */

/*
 * linhas: [{ dia, loja, unidade, valor, preco, produto }] dos últimos 30 dias.
 * Devolve as ofertas de hoje (a mais recente de cada cadeia, se for fresca),
 * a série do melhor preço de cada dia e o resumo dos 30 dias — tudo na
 * mesma unidade (não se compara €/kg de ontem com €/un de hoje).
 */
/*
 * Preços que não podem ser verdade. A tabela guarda o que a pesquisa leu
 * do site de cada loja, e às vezes a leitura falha: uma embalagem de 3,15 €
 * a "0,01 €/kg" (seriam 315 kg). Isso não pode ir para uma página que o
 * Google mostra. Dois filtros, como em semPrecosAbsurdos dos combustíveis:
 *  - a embalagem implícita (preço ÷ preço por kg/L) tem de ter um tamanho
 *    de embalagem de supermercado;
 *  - com 3 ou mais preços no mesmo artigo, fica de fora o que estiver a
 *    mais de 3× da mediana, para cima ou para baixo.
 */
const EMBALAGEM_MAX = { kg: 25, L: 25, l: 25 };
function embalagemPlausivel(l) {
  if (!(l.preco > 0)) return true; // sem preço da embalagem não há como verificar
  const qtd = l.preco / l.valor;
  const max = EMBALAGEM_MAX[l.unidade] ?? 500; // contáveis: até 500 unidades
  return qtd >= 0.005 && qtd <= max;
}
const mediana = (v) => { const o = [...v].sort((a, b) => a - b); const m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
export function semForaDaEscala(linhas, fator = 3) {
  if (linhas.length < 3) return linhas;
  const med = mediana(linhas.map((l) => l.valor));
  return linhas.filter((l) => l.valor >= med / fator && l.valor <= med * fator);
}

export function montarArtigo(linhas, hoje) {
  const limpas = semForaDaEscala((linhas || [])
    .map((l) => ({ ...l, valor: Number(l.valor), preco: l.preco != null ? Number(l.preco) : null }))
    .filter((l) => l.dia && l.loja && LOJA[l.loja] && l.valor > 0 && embalagemPlausivel(l)));
  const limite = diasAntes(hoje, FRESCO_DIAS);
  const recentes = limpas.filter((l) => l.dia >= limite);

  // A unidade é a das linhas recentes (a mais frequente; em empate, a mais nova).
  const contagem = new Map();
  for (const l of recentes) {
    const c = contagem.get(l.unidade) || { n: 0, dia: "" };
    contagem.set(l.unidade, { n: c.n + 1, dia: l.dia > c.dia ? l.dia : c.dia });
  }
  const unidade = [...contagem.entries()].sort((a, b) => b[1].n - a[1].n || b[1].dia.localeCompare(a[1].dia))[0]?.[0] ?? null;

  const daUnidade = limpas.filter((l) => l.unidade === unidade);
  const ultima = new Map();
  for (const l of daUnidade) {
    if (l.dia < limite) continue;
    const atual = ultima.get(l.loja);
    if (!atual || l.dia > atual.dia) ultima.set(l.loja, l);
  }
  const ofertas = semForaDaEscala([...ultima.values()])
    .sort((a, b) => a.valor - b.valor || a.loja.localeCompare(b.loja))
    .map((l) => ({ loja: l.loja, lojaNome: nomeLoja(l.loja), valor: l.valor, preco: l.preco, produto: l.produto || null, dia: l.dia }));

  const porDia = new Map();
  for (const l of daUnidade) if (!porDia.has(l.dia) || l.valor < porDia.get(l.dia)) porDia.set(l.dia, l.valor);
  const serie = [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, v]) => ({ dia, media: v, minimo: v }));

  const atualizado = ofertas.reduce((m, o) => (o.dia > m ? o.dia : m), "") || null;
  return {
    unidade,
    ofertas,
    serie,
    historico: resumirHistorico(daUnidade),
    atualizado,
    indexavel: ofertas.length >= MIN_LOJAS,
  };
}

/*
 * Frases da página, tiradas dos números. Nada de texto igual em todas as
 * páginas: se não houver números para dizer uma coisa, essa frase não sai.
 */
export function frasesArtigo(artigo, dados, hoje = null) {
  const { ofertas, unidade, historico } = dados;
  // "Hoje" só se os preços forem mesmo de hoje; senão, o dia em que foram vistos.
  const quando = !hoje || dados.atualizado === hoje ? "Hoje" : `A ${dataCurta(dados.atualizado, { ano: false })}`;
  const u = porUnidade(unidade);
  const out = [];
  if (ofertas.length >= 2) {
    const [a, b] = ofertas;
    const dif = Math.round((b.valor - a.valor) * 100) / 100;
    out.push(dif >= 0.01
      ? `${quando} é ${euros(dif)} €${u} mais barato no ${a.lojaNome} (${euros(a.valor)} €${u}) do que no ${b.lojaNome}, o segundo mais barato.`
      : `${quando} o ${a.lojaNome} e o ${b.lojaNome} estão empatados, a ${euros(a.valor)} €${u}.`);
  }
  if (ofertas.length >= 3) {
    const a = ofertas[0], z = ofertas[ofertas.length - 1];
    const pct = Math.round(((z.valor - a.valor) / z.valor) * 100);
    if (pct >= 3) out.push(`Entre o mais barato e o mais caro (${z.lojaNome}, ${euros(z.valor)} €${u}) a diferença é de ${pct}%.`);
  }
  if (ofertas.length && historico) {
    const atual = ofertas[0].valor;
    const min = historico.minimo, max = historico.maximo;
    const juizo = avaliarPreco(atual, historico);
    if (juizo === "minimo") out.push(`É o preço mais baixo dos últimos ${historico.dias} dias com registo.`);
    else if (juizo === "bom") out.push(`Está perto do mínimo dos últimos 30 dias: ${euros(min.valor)} €${u} no ${nomeLoja(min.loja)}, a ${dataCurta(min.dia, { ano: false })}.`);
    else if (juizo === "alto") out.push(`Está acima do habitual: nos últimos 30 dias chegou a ${euros(min.valor)} €${u} (${nomeLoja(min.loja)}, ${dataCurta(min.dia, { ano: false })}). Se puderes, espera por uma promoção.`);
    else if (juizo === "normal" && max.valor > min.valor) out.push(`Nos últimos 30 dias o melhor preço andou entre ${euros(min.valor)} e ${euros(max.valor)} €${u}.`);
  }
  const vencedor = ofertas[0];
  if (vencedor?.produto && vencedor.preco > 0 && unidade !== "embalagem") {
    out.push(`O mais barato ${u ? `por ${unidade}` : ""} é «${vencedor.produto}», a ${euros(vencedor.preco)} € a embalagem.`.replace(/\s+/g, " "));
  }
  return out;
}

/* Corta um título para caber em ~60 caracteres, pela ordem das opções. */
export function escolherTitulo(opcoes, max = 60) {
  return opcoes.find((t) => t.length <= max) || opcoes[opcoes.length - 1].slice(0, max);
}

export function metaArtigo(artigo, dados) {
  const nome = artigo.nomeCurto;
  const [a, b] = dados.ofertas;
  const u = porUnidade(dados.unidade);
  const titulo = escolherTitulo([
    a && b ? `Preço de ${nome.toLowerCase()} hoje: ${a.lojaNome} vs ${b.lojaNome} | PoupeJá` : null,
    a && b ? `Preço de ${nome.toLowerCase()} hoje: ${a.lojaNome} vs ${b.lojaNome}` : null,
    `Preço de ${nome.toLowerCase()} hoje nos supermercados | PoupeJá`,
    `Preço de ${nome.toLowerCase()} hoje | PoupeJá`,
    `${nome} | PoupeJá`,
  ].filter(Boolean));
  const lojas = dados.ofertas.map((o) => o.lojaNome).join(", ");
  const descricao = a
    ? `${nome} hoje desde ${euros(a.valor)} €${u} no ${a.lojaNome}. Comparamos ${dados.ofertas.length} supermercados (${lojas}), com histórico de 30 dias. Grátis.`
    : `Preço de ${nome.toLowerCase()} no Continente, Pingo Doce, Auchan, Lidl e Aldi, com histórico de 30 dias. Compara grátis na app PoupeJá.`;
  return { titulo, descricao: cortar(descricao) };
}

/* ── Hubs: categorias, cadeias e comparações entre duas cadeias ── */

/*
 * resumos: Map slug → montarArtigo(...) com as linhas recentes.
 * Devolve só os artigos com comparação (≥ 2 cadeias), já com o vencedor.
 */
export function comComparacao(resumos) {
  const out = [];
  for (const art of ARTIGOS_SEO) {
    const d = resumos.get(art.slug);
    if (!d?.indexavel) continue;
    const [a, b] = d.ofertas;
    out.push({ ...art, unidade: d.unidade, ofertas: d.ofertas, atualizado: d.atualizado, vencedor: a, diferenca: Math.round((b.valor - a.valor) * 100) / 100, pct: Math.round(((b.valor - a.valor) / b.valor) * 100) });
  }
  return out;
}

/* Só o que uma linha de lista mostra: as props das páginas ficam pequenas. */
export const paraLista = (a, contexto = null) => ({
  slug: a.slug, nome: a.nome, unidade: a.unidade, pct: a.pct,
  vencedor: { lojaNome: a.vencedor.lojaNome, valor: a.vencedor.valor },
  ...(contexto ? { contexto } : {}),
});

/* Quantas vezes cada cadeia é a mais barata, por ordem. */
export function vitoriasPorLoja(artigos) {
  const n = new Map(LOJAS_SEO.map((l) => [l.id, { ...l, vitorias: 0, presente: 0 }]));
  for (const a of artigos) {
    for (const o of a.ofertas) n.get(o.loja).presente++;
    n.get(a.vencedor.loja).vitorias++;
  }
  return [...n.values()].filter((l) => l.presente).sort((a, b) => b.vitorias - a.vitorias || b.presente - a.presente);
}

/* Pares de cadeias, sempre pela ordem de LOJAS_SEO: "continente-vs-pingo-doce". */
export const PARES = LOJAS_SEO.flatMap((a, i) => LOJAS_SEO.slice(i + 1).map((b) => ({ slug: `${a.slug}-vs-${b.slug}`, a, b })));
export function parPorSlug(slug) {
  const direto = PARES.find((p) => p.slug === slug);
  if (direto) return { par: direto, invertido: false };
  const inv = PARES.find((p) => `${p.b.slug}-vs-${p.a.slug}` === slug);
  return inv ? { par: inv, invertido: true } : null;
}

/*
 * Duas cadeias frente a frente, nos artigos que ambas têm (na mesma
 * unidade, porque saem do mesmo montarArtigo). A média é da diferença em
 * percentagem: somar €/kg com €/L não dava um cesto, dava um número.
 */
export function compararPar(par, artigos) {
  const linhas = [];
  for (const art of artigos) {
    const oa = art.ofertas.find((o) => o.loja === par.a.id);
    const ob = art.ofertas.find((o) => o.loja === par.b.id);
    if (!oa || !ob) continue;
    const dif = Math.round((ob.valor - oa.valor) * 100) / 100;
    linhas.push({ slug: art.slug, nome: art.nome, unidade: art.unidade, a: oa.valor, b: ob.valor, ganha: Math.abs(dif) < 0.01 ? null : dif > 0 ? par.a.id : par.b.id, pct: ((ob.valor - oa.valor) / Math.max(oa.valor, ob.valor)) * 100 });
  }
  const ganhaA = linhas.filter((l) => l.ganha === par.a.id).length;
  const ganhaB = linhas.filter((l) => l.ganha === par.b.id).length;
  // pct > 0: A mais barato que B, em média.
  const media = linhas.length ? Math.round((linhas.reduce((s, l) => s + l.pct, 0) / linhas.length) * 10) / 10 : 0;
  linhas.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
  return { linhas, ganhaA, ganhaB, empates: linhas.length - ganhaA - ganhaB, media, indexavel: linhas.length >= MIN_COMUNS };
}

export function fraseParComparado(par, r) {
  if (!r.linhas.length) return `Ainda não temos artigos com preço recente nas duas cadeias.`;
  const [maisBarata, outra, vit, vitOutra] = r.ganhaA >= r.ganhaB ? [par.a, par.b, r.ganhaA, r.ganhaB] : [par.b, par.a, r.ganhaB, r.ganhaA];
  const media = r.ganhaA >= r.ganhaB ? r.media : -r.media;
  const quanto = Math.abs(media) >= 1
    ? ` Em média, o ${media > 0 ? maisBarata.nome : outra.nome} fica ${Math.abs(media).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}% abaixo, artigo a artigo.`
    : " Em média, os preços ficam praticamente iguais.";
  return `Em ${r.linhas.length} artigos à venda nas duas cadeias, o ${maisBarata.nome} é mais barato em ${vit} e o ${outra.nome} em ${vitOutra}${r.empates ? ` (${r.empates} empate${r.empates > 1 ? "s" : ""})` : ""}.${quanto}`;
}

/* ── Receitas: quanto custam os ingredientes com os preços de hoje ── */

const CONVERTE = { g: ["kg", 1 / 1000], kg: ["kg", 1], ml: ["L", 1 / 1000], l: ["L", 1], L: ["L", 1], un: ["un", 1] };

/*
 * Custo estimado: só os ingredientes cuja quantidade se converte na unidade
 * do preço (500 g de batatas × €/kg). Colheres, dentes, "q.b." e o que está
 * na despensa ficam de fora — e a página diz quantos entraram.
 */
export function custoReceita(ingredientes, resumos) {
  let total = 0, comPreco = 0, contados = 0;
  const ligacoes = [];
  for (const ing of ingredientes || []) {
    const art = artigoPorNome(ing.compra || ing.nome);
    const d = art ? resumos.get(art.slug) : null;
    if (art) ligacoes.push({ slug: art.slug, nome: art.nomeCurto, valor: d?.ofertas[0]?.valor ?? null, unidade: d?.unidade ?? null, loja: d?.ofertas[0]?.lojaNome ?? null });
    if (ing.despensa) continue;
    contados++;
    const melhor = d?.ofertas[0];
    const conv = CONVERTE[ing.u];
    if (!melhor || !conv) continue;
    const unidadePreco = d.unidade === "l" ? "L" : ["ovo", "un"].includes(d.unidade) ? "un" : d.unidade;
    if (conv[0] !== unidadePreco) continue;
    total += melhor.valor * ing.q * conv[1];
    comPreco++;
  }
  const unicas = [...new Map(ligacoes.map((l) => [l.slug, l])).values()];
  // Menos de metade dos ingredientes com preço não é estimativa, é palpite.
  const valido = contados > 0 && comPreco / contados >= 0.5;
  return { total: valido ? Math.round(total * 100) / 100 : null, comPreco, contados, ligacoes: unicas };
}

/* Receitas que levam este artigo (pelo nome de compra dos ingredientes). */
export function receitasComArtigo(artigo, receitas, max = 6) {
  return receitas
    .filter((r) => (r.ingredientes || []).some((i) => artigoPorNome(i.compra || i.nome)?.slug === artigo.slug))
    .slice(0, max)
    .map((r) => ({ id: r.id, nome: r.nome }));
}

/* ── JSON-LD ── */

export function breadcrumbLd(urlSite, passos) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: passos.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.nome, item: `${urlSite}${p.path}` })),
  };
}

/*
 * Product + AggregateOffer. lowPrice/highPrice são preços de embalagem
 * (o que o schema.org pede numa oferta); o preço por kg/L vai em cada
 * oferta como UnitPriceSpecification, que é o que se compara.
 */
export function produtoLd(urlSite, artigo, dados) {
  const comPreco = dados.ofertas.filter((o) => o.preco > 0);
  if (!comPreco.length) return null;
  const precos = comPreco.map((o) => o.preco);
  const codigo = CODIGO_UNIDADE[dados.unidade];
  const url = `${urlSite}/precos/${artigo.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: artigo.nomeCurto,
    description: `Preço de ${artigo.nomeCurto.toLowerCase()} nos supermercados em Portugal, comparado por ${dados.unidade || "unidade"}.`,
    category: artigo.categoriaNome,
    url,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...precos).toFixed(2),
      highPrice: Math.max(...precos).toFixed(2),
      offerCount: comPreco.length,
      offers: comPreco.map((o) => ({
        "@type": "Offer",
        price: o.preco.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: o.lojaNome },
        ...(codigo ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: o.valor.toFixed(2),
            priceCurrency: "EUR",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: codigo },
          },
        } : {}),
      })),
    },
  };
}

/* Link que abre a app já com a pesquisa feita (ver SecaoComparar). */
export const linkApp = (q) => `/?atalho=mercados&q=${encodeURIComponent(q)}`;
