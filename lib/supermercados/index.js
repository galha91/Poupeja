import { continente, pingoDoce, auchan } from "./sfcc";
import { lidl } from "./lidl";
import { completarUnidade, lerQuantidade } from "./comum";

/*
 * Pesquisa o mesmo artigo em todos os supermercados ao mesmo tempo e
 * devolve uma lista só, comparável pelo preço por kg / L / unidade.
 *
 * Porque em direto e não uma base de dados copiada todas as noites: os
 * preços online mudam várias vezes por semana e cada cadeia tem dezenas de
 * milhares de artigos. Pesquisar só o que alguém procura, com cache de
 * umas horas (na rota), dá preços do dia sem andar a copiar sites inteiros.
 */

export const LOJAS = [continente, pingoDoce, auchan, lidl];

/* ── Relevância ──
   A pesquisa de cada loja é generosa: "laranja" traz sumos, gelatinas e,
   no Lidl, peras. Para comparar preços só interessa o artigo em si. */

const semAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Singular aproximado, o suficiente para "laranjas" = "laranja" e
// "limões" = "limão". Não é gramática: é só para comparar palavras.
export function raiz(palavra) {
  let w = semAcentos(palavra);
  if (w.length <= 3) return w;
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  if (w.endsWith("ais")) return w.slice(0, -2) + "l";
  if (w.endsWith("eis")) return w.slice(0, -3) + "el";
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  if (/[rsz]es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

const PALAVRAS_VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "com", "sem", "a", "o", "em", "para"]);

export function palavras(txt) {
  return semAcentos(String(txt || ""))
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w))
    .map(raiz);
}

/* Nomes diferentes para a mesma coisa, de loja para loja. */
// Chaves já em raiz() ("ananás" → "anana").
const SINONIMOS = {
  anana: ["abacaxi"], abacaxi: ["anana"],
  esparguete: ["spaghetti", "spaguetti"], spaghetti: ["esparguete"],
  racao: ["comida"],
  fatiado: ["fatia"], fatia: ["fatiado"],
};

/*
 * Palavras que vêm ANTES do produto sem o transformar noutra coisa:
 * «Peito de Frango» é frango, «Massa Esparguete» é esparguete, «Tablete
 * de Chocolate» é chocolate. Ao contrário de «Sumo de Laranja».
 */
const FORMATOS = new Set([
  "peito", "bife", "coxa", "sobrecoxa", "asa", "asinha", "perna", "perninha", "lombinho", "lombo",
  "filete", "file", "posta", "pedaco", "metade", "meio", "cubo", "tira", "fatia", "rodela",
  "massa", "tablete", "embalagem", "emb", "pack", "saco", "rede", "cuvete", "caixa", "lata", "frasco", "garrafa",
]);

/*
 * Produtos que só LEVAM o que se procurou: a categoria da loja pode dizer
 * «laranja» (a secção dos sumos de laranja), mas um sumo não é uma laranja.
 */
const DERIVADOS = new Set([
  "sumo", "nectar", "iogurte", "gelatina", "gelado", "bolo", "bolacha", "refrigerante", "agua", "cha",
  "doce", "compota", "molho", "cereal", "barra", "leite", "pudim", "crepe", "croissant", "bebida", "licor",
  "creme", "sobremesa", "infusao", "tempero", "preparado", "snack", "salada", "pizza", "tarte", "cocktail",
]);

function casa(w, t) {
  if (w === t) return true;
  const [curta, longa] = w.length <= t.length ? [w, t] : [t, w];
  return curta.length >= 5 && longa.startsWith(curta);
}

function temTermo(p, t) {
  return [t, ...(SINONIMOS[t] || [])].some((alt) => p.some((w) => casa(w, alt)));
}

/*
 * 2 = é mesmo isto ("Laranja do Algarve", "Peito de Frango")
 * 1 = contém tudo, mas é outra coisa ("Sumo de Laranja")
 * 0 = não tem a ver
 */
export function relevancia(nome, termos, categoria = "") {
  if (!termos.length) return 0;
  const p = palavras(nome);
  if (!termos.every((t) => temTermo(p, t))) return 0;
  const primeiro = termos[0];
  if (temTermo([p[0]], primeiro)) return 2;
  if (DERIVADOS.has(p[0])) return 1;
  if (FORMATOS.has(p[0])) return 2;
  // A loja arruma-o numa secção com o nome do que se procurou
  // ("Talho/Frango e Peru", "Chocolate, Gomas e Rebuçados").
  if (temTermo(palavras(categoria), primeiro)) return 2;
  return 1;
}

/*
 * Como se compara cada tipo de produto — a vistoria às quatro lojas
 * mostrou que o €/kg serve para quase tudo, mas não para tudo:
 *
 * - Ervas aromáticas frescas compram-se ao molho (50 g, 100 g). Ao kg, um
 *   saco congelado de 250 g "ganhava" ao molho fresco — resposta certa à
 *   pergunta errada. Compara-se o preço da embalagem, e só entre frescas.
 * - Contáveis (ovos, rolos, fraldas, cápsulas, doses de detergente): o
 *   preço por ovo / rolo / lavagem, que é o que as lojas afixam.
 */
const ERVAS_FRESCAS = new Set(["salsa", "coentro", "hortela", "manjericao", "cebolinho", "alecrim", "tomilho", "endro", "estragao", "louro", "oregao", "salva"]);
const NAO_FRESCO = /frasco|saqueta|desidrat|\bsec[oa]s?\b|em folhas?|folhas? em|congelad|picad|mo[ií]d|gr[aã]o|liofiliz|pasta de/i;

// Fresca = a loja arruma-a nos frescos/legumes e o nome não diz o contrário.
// (O Lidl não traz categoria útil; aí decide só o nome.)
function eFresca(p) {
  if (NAO_FRESCO.test(p.nome)) return false;
  return p.categoria && p.loja !== "lidl" ? /fresc|legume/i.test(p.categoria) : true;
}

/*
 * Parecido no nome, outro produto. Para quem procura "ovos", os de
 * codorniz a 0,11 € não são a resposta; para "alho", o alho-francês não é
 * alho. Continuam na lista, em "relacionados".
 */
const EXCLUIR = {
  ovo: /codorniz|cozid|chocolate|p[áa]scoa|kinder/i,
  alho: /franc[eê]s|pão|baguete|manteiga|massa/i,
  frango: /moela|f[ií]gado|cora[çc][ãaõo]|pesco[çc]o/i,
  // "Bacalhau com …" é prato feito (com natas, com couve e broa…).
  bacalhau: /\bcom\b|br[áa]s|pat[ae]niscas|past[ée]is|bolinhos|caras de|migas|lascas/i,
  manteiga: /amendoim|cacau|karit[ée]|corporal|feij[ãa]o|ab[óo]bora/i,
  papel: /h[úu]mido|cozinha|alum[ií]nio|vegetal|toalhita/i,
  champo: /carro|auto|c[ãa]o|c[ãa]es|gato/i,
  pizza: /massa|base|molho|farinha/i,
  leite: /coco|am[êe]ndoa|aveia|soja|condensad|em p[óo]|chocolate|achocolatad|corporal|hidratante|limpeza|p[ãa]o/i,
  queijo: /ralador|tabua|t[áa]bua/i,
};

/*
 * Congelado, em calda, em lata, fumado, polpa… é outra forma do produto.
 * Quem procura "morangos" quer morangos frescos, a não ser que nenhuma
 * loja os tenha — por isso só se separa quando há frescos em pelo menos
 * duas lojas (as ervilhas, quase todas congeladas, comparam-se entre si).
 */
// Sem "seco": alho seco, feijão seco e grão seco são a forma normal.
const PROCESSADO = /congelad|ultracongelad|em calda|conserva|desidratad|em lata|enlatad|em p[óo]\b|fumad|pelad|polpa|passata|concentrad|pur[ée]\b|em pedaços|triturad|mo[ií]d[oa]|picad[oa]|massa de|pasta de|migas|lascas/i;

export function modoComparacao(termos) {
  return ERVAS_FRESCAS.has(termos[0]) ? "embalagem" : "unidade";
}

// Nome da unidade quando é "un": o que é uma unidade daquilo que se procurou.
const NOME_UNIDADE = {
  ovo: "ovo", papel: "rolo", rolo: "rolo", fralda: "fralda", capsula: "cápsula", pilha: "pilha",
  cha: "saqueta", toalhita: "toalhita", guardanapo: "guardanapo", pastilha: "pastilha", saco: "saco",
};
export function nomeUnidade(unidade, termos) {
  if (unidade === "dose") return "lavagem";
  if (unidade !== "un") return unidade === "l" ? "L" : unidade;
  return termos.map((t) => NOME_UNIDADE[t]).find(Boolean) || "un";
}

const PAUSA_MS = 3 * 60 * 1000;
const pausa = new Map();

export async function pesquisarTudo(q, lojas = LOJAS) {
  const termos = palavras(q);
  const modo = modoComparacao(termos);
  const inicio = Date.now();

  const respostas = await Promise.allSettled(
    lojas.map(async (loja) => {
      // Uma loja que acabou de recusar pedidos (403/429) fica uns minutos
      // de fora: insistir só prolongava o bloqueio, e as outras respondem.
      if (Date.now() < (pausa.get(loja.id) || 0)) throw new Error("em pausa depois de recusar pedidos");
      const t0 = Date.now();
      try {
        const itens = await loja.pesquisar(q);
        return { loja, itens, ms: Date.now() - t0 };
      } catch (e) {
        if (/HTTP (403|429)/.test(e?.message || "")) pausa.set(loja.id, Date.now() + PAUSA_MS);
        throw e;
      }
    }),
  );

  const estado = [];
  const produtos = [];
  respostas.forEach((r, i) => {
    const loja = lojas[i];
    if (r.status === "rejected") {
      estado.push({ id: loja.id, nome: loja.nome, ok: false, erro: String(r.reason?.message || r.reason).slice(0, 120) });
      return;
    }
    let n = 0;
    for (const bruto of r.value.itens) {
      if (!bruto?.nome || !(bruto.preco > 0)) continue;
      let rel = relevancia(bruto.nome, termos, bruto.categoria || "");
      if (!rel) continue;
      if (rel === 2 && EXCLUIR[termos[0]]?.test(bruto.nome)) rel = 1;
      // Ervas: o frasco de salsa seca é "relacionado", não é o molho fresco.
      if (modo === "embalagem" && rel === 2 && !eFresca({ ...bruto, loja: loja.id })) rel = 1;
      const p = completarUnidade(bruto);
      // Quantidade da embalagem na unidade de comparação (2 kg, 12 ovos…):
      // serve para somar uma lista de compras em quantidades iguais.
      const q = p.aoPeso ? null : lerQuantidade(p.quantidade) || lerQuantidade(p.nome);
      produtos.push({
        loja: loja.id, lojaNome: loja.nome, onde: "online", ...p,
        nomeUnidade: nomeUnidade(p.unidade, termos),
        qtdBase: q && q.unidade === p.unidade ? Math.round(q.qtd * 1000) / 1000 : null,
        relevancia: rel,
      });
      n++;
    }
    estado.push({ id: loja.id, nome: loja.nome, ok: true, total: n, ms: r.value.ms });
  });

  // Formas processadas saem da comparação quando há frescos em ≥ 2 lojas
  // e quem procurou não pediu a forma processada ("morangos congelados").
  if (!PROCESSADO.test(q)) {
    const lojasFresco = new Set(produtos.filter((p) => p.relevancia === 2 && !PROCESSADO.test(p.nome)).map((p) => p.loja));
    if (lojasFresco.size >= 2) for (const p of produtos) if (p.relevancia === 2 && PROCESSADO.test(p.nome)) p.relevancia = 1;
  }

  const ordenados = ordenar(produtos, modo);
  const principal = ordenados.find((p) => p.relevancia === 2)?.unidade || ordenados[0]?.unidade || null;
  return {
    q, termos, modo,
    // Como mostrar a unidade de comparação ("kg", "L", "ovo", "rolo", "lavagem").
    nomeUnidade: principal ? nomeUnidade(principal, termos) : null,
    produtos: ordenados, lojas: estado, ms: Date.now() - inicio,
  };
}

/*
 * Ordem: primeiro o que é mesmo o artigo procurado; dentro disso, a
 * unidade mais comum (não se compara €/kg com €/un) e o preço por
 * unidade. O resto vem depois, pela mesma lógica.
 */
export function ordenar(produtos, modo = "unidade") {
  const contagem = {};
  for (const p of produtos) if (p.relevancia === 2) contagem[p.unidade] = (contagem[p.unidade] || 0) + 1;
  const principal = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0];
  const peso = (p) => (p.relevancia === 2 ? 0 : 2) + (modo === "embalagem" || p.unidade === principal ? 0 : 1);
  const valor = (p) => (modo === "embalagem" ? p.preco : p.precoUnidade);
  return [...produtos].sort((a, b) => peso(a) - peso(b) || valor(a) - valor(b) || a.preco - b.preco);
}
