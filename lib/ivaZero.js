/*
 * IVA zero 2027: a descida do IVA chega ao preço das prateleiras?
 *
 * O Orçamento do Estado para 2027 volta a isentar de IVA um conjunto de
 * alimentos essenciais de 1 de janeiro a 31 de março de 2027 (pode ser
 * prolongado) e obriga o Governo a avaliar se a descida chega ao preço
 * pago pelos consumidores. A página /iva-zero mostra isso com os preços
 * que o PoupeJá já guarda todos os dias: o MESMO produto (mesma loja, mesmo
 * id) antes e depois de 1 de janeiro.
 *
 * - Preço de referência: a mediana dos preços do produto nos 14 dias antes
 *   do início (a mediana não se deixa enganar por uma promoção de um dia).
 *   Até ao início é provisória (os últimos 14 dias); no dia do início fica
 *   fixa e não volta a mudar.
 * - Preço atual: o último preço visto nos últimos 3 dias.
 * - Um alimento a 6% de IVA que passe a 0% devia ficar 5,7% mais barato
 *   (1 − 1/1,06). Conta como "desceu o IVA" a partir de 5%, para não
 *   castigar arredondamentos ao cêntimo.
 *
 * A lista oficial de 2027 ainda não foi publicada. Até lá acompanham-se os
 * alimentos essenciais das categorias abaixo; quando sair, ajusta-se
 * GRUPOS (e LISTA_OFICIAL passa a true).
 *
 * Só contas puras aqui: a leitura do Supabase e a gravação estão em
 * lib/ivaZeroGerar.js (GitHub Actions) e a página lê uma linha de
 * paginas_marca (tipo "inicio", slug "iva-zero"). Regra 1 do CLAUDE.md.
 */

export const TIPO = "inicio";
export const SLUG_IVA_ZERO = "iva-zero";
export const INICIO = "2027-01-01";
export const FIM_PREVISTO = "2027-03-31";
export const LISTA_OFICIAL = false;
export const DIAS_REFERENCIA = 14;
export const DIAS_ATUAL = 3;
export const IVA_ANTES = 0.06;
// Quanto devia descer um preço com IVA de 6% que passa a 0%: 5,66%.
export const DESCIDA_ESPERADA = Math.round((1 - 1 / (1 + IVA_ANTES)) * 1000) / 10;
export const LIMIAR_DESCEU = -5; // %: desceu o equivalente ao IVA
export const LIMIAR_PARADO = 0.5; // %: entre −0,5% e +0,5% conta como igual
// Sem dados novos há mais de 4 dias, a página sai do Google até voltar a ter.
export const VALIDADE_MS = 4 * 24 * 60 * 60 * 1000;
const MAX_SERIE = 120;
// Uma cadeia só aparece sozinha com produtos suficientes para a média valer alguma coisa.
export const MIN_POR_LOJA = 20;

/* Categorias de alimentos essenciais e as pesquisas (q de produtos_marca) de cada uma. */
export const GRUPOS = [
  { id: "arroz-massa", nome: "Arroz e massa", q: ["arroz", "arroz agulha", "arroz carolino", "arroz basmati", "arroz vaporizado", "massa esparguete", "esparguete", "massa penne"] },
  { id: "pao-farinha", nome: "Pão, farinha e aveia", q: ["pão", "pão de forma", "pão integral", "farinha", "flocos de aveia"] },
  { id: "leite-iogurte", nome: "Leite e iogurtes", q: ["leite", "leite meio gordo", "leite magro", "leite sem lactose", "iogurte", "iogurte natural"] },
  { id: "queijo-manteiga", nome: "Queijo e manteiga", q: ["queijo", "queijo flamengo", "queijo fresco", "manteiga"] },
  { id: "ovos", nome: "Ovos", q: ["ovos"] },
  { id: "peixe", nome: "Peixe e conservas de peixe", q: ["atum", "sardinhas em azeite", "filetes de cavala", "lombos de pescada", "filetes pescada", "postas de pescada", "lombos bacalhau", "bacalhau demolhado"] },
  { id: "carne", nome: "Carne", q: ["peito de frango", "lombo de porco"] },
  { id: "leguminosas", nome: "Leguminosas e tomate", q: ["feijão", "feijão cozido", "grão cozido", "grão de bico", "lentilhas", "polpa de tomate", "tomate triturado"] },
  { id: "azeite-oleo", nome: "Azeite e óleo", q: ["azeite", "azeite virgem", "óleo", "óleo alimentar"] },
  { id: "fruta-legumes", nome: "Fruta e legumes", q: ["peras", "tomate", "ervilhas congeladas"] },
  { id: "acucar", nome: "Açúcar", q: ["açúcar"] },
];
export const TODAS_Q = GRUPOS.flatMap((g) => g.q);
const GRUPO_DE_Q = new Map(GRUPOS.flatMap((g) => g.q.map((q) => [q, g.id])));
export const grupoDe = (q) => GRUPO_DE_Q.get(String(q || "").trim().toLowerCase()) || null;

const DIA = /^\d{4}-\d{2}-\d{2}$/;
export function somarDias(dia, n) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const fase = (hoje) => (hoje < INICIO ? "antes" : "depois");

/* A janela de referência: os 14 dias antes do início, ou os últimos 14 antes dele. */
export function janelaReferencia(hoje) {
  const ate = hoje < INICIO ? hoje : somarDias(INICIO, -1);
  return { desde: somarDias(ate, -(DIAS_REFERENCIA - 1)), ate };
}

export function mediana(valores) {
  const v = valores.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round(((v[m - 1] + v[m]) / 2) * 100) / 100;
}

const chave = (loja, id) => `${loja}|${id}`;

/*
 * Preço de referência de cada produto: { "loja|id": preço }. Pede pelo
 * menos 3 dias com preço na janela, para um dia solto não fazer de regra.
 * dias: [{ loja, produto_id, dia, preco }].
 */
export function referencias(dias, { desde, ate }) {
  const por = new Map();
  for (const d of dias || []) {
    if (!d || !DIA.test(String(d.dia)) || d.dia < desde || d.dia > ate || !(Number(d.preco) > 0)) continue;
    const k = chave(d.loja, d.produto_id);
    if (!por.has(k)) por.set(k, []);
    por.get(k).push(Number(d.preco));
  }
  const ref = {};
  for (const [k, precos] of por) if (precos.length >= 3) ref[k] = mediana(precos);
  return ref;
}

/* O último preço de cada produto nos últimos DIAS_ATUAL dias: { "loja|id": { preco, dia } }. */
export function precosAtuais(dias, hoje) {
  const desde = somarDias(hoje, -(DIAS_ATUAL - 1));
  const at = {};
  for (const d of dias || []) {
    if (!d || !DIA.test(String(d.dia)) || d.dia < desde || d.dia > hoje || !(Number(d.preco) > 0)) continue;
    const k = chave(d.loja, d.produto_id);
    if (!at[k] || d.dia > at[k].dia) at[k] = { preco: Number(d.preco), dia: d.dia };
  }
  return at;
}

export function classe(pct) {
  if (pct <= LIMIAR_DESCEU) return "desceu";
  if (pct < -LIMIAR_PARADO) return "parte";
  if (pct <= LIMIAR_PARADO) return "igual";
  return "subiu";
}

const vazio = () => ({ n: 0, desceu: 0, parte: 0, igual: 0, subiu: 0, soma: 0 });
function fechar(c) {
  const { soma, ...resto } = c;
  return { ...resto, varMedia: c.n ? Math.round((soma / c.n) * 10) / 10 : null };
}

/*
 * Compara cada produto com a sua referência.
 * produtos: [{ loja, produto_id, q, nome, marca }]; ref e atuais como acima.
 * nomeLoja(id) -> nome visível. Devolve null se não houver nada comparável.
 */
export function comparar(produtos, ref, atuais, nomeLoja = (x) => x) {
  const linhas = [];
  const vistos = new Set();
  for (const p of produtos || []) {
    const k = chave(p.loja, p.produto_id);
    if (vistos.has(k)) continue;
    const grupo = grupoDe(p.q);
    const r = ref?.[k];
    const a = atuais?.[k];
    if (!grupo || !(r > 0) || !a) continue;
    vistos.add(k);
    const pct = Math.round(((a.preco - r) / r) * 1000) / 10;
    linhas.push({ k, loja: p.loja, grupo, nome: String(p.nome || "").slice(0, 90), marca: p.marca || "", ref: r, atual: a.preco, pct, classe: classe(pct) });
  }
  if (!linhas.length) return null;

  const total = vazio();
  const lojas = new Map();
  const grupos = new Map();
  for (const l of linhas) {
    for (const c of [total, lojas.get(l.loja) || lojas.set(l.loja, vazio()).get(l.loja), grupos.get(l.grupo) || grupos.set(l.grupo, vazio()).get(l.grupo)]) {
      c.n++; c[l.classe]++; c.soma += l.pct;
    }
  }
  const porLoja = [...lojas].map(([loja, c]) => ({ loja, nome: nomeLoja(loja), ...fechar(c) }))
    .filter((l) => l.n >= MIN_POR_LOJA).sort((a, b) => a.varMedia - b.varMedia);
  const porGrupo = GRUPOS.filter((g) => grupos.has(g.id)).map((g) => ({ id: g.id, nome: g.nome, ...fechar(grupos.get(g.id)) }));
  const ordem = [...linhas].sort((a, b) => a.pct - b.pct);
  const exemplo = (l) => ({ nome: l.nome, marca: l.marca, loja: nomeLoja(l.loja), ref: l.ref, atual: l.atual, pct: l.pct });
  return {
    total: fechar(total),
    porLoja,
    porGrupo,
    maisDesceram: ordem.slice(0, 8).filter((l) => l.pct < 0).map(exemplo),
    subiram: ordem.slice(-8).reverse().filter((l) => l.classe === "subiu").map(exemplo),
  };
}

/* Junta o ponto de hoje à série (um por dia, o mais recente ganha). */
export function juntarSerie(serie, resumo, hoje, max = MAX_SERIE) {
  if (!resumo?.total?.n) return Array.isArray(serie) ? serie : [];
  const ponto = { dia: hoje, varMedia: resumo.total.varMedia, desceu: resumo.total.desceu, n: resumo.total.n, lojas: Object.fromEntries(resumo.porLoja.map((l) => [l.loja, l.varMedia])) };
  const antigos = (Array.isArray(serie) ? serie : []).filter((p) => p?.dia && p.dia !== hoje);
  return [...antigos, ponto].sort((a, b) => a.dia.localeCompare(b.dia)).slice(-max);
}

/* Percentagem inteira de a em b ("37%"). */
export const pctDe = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

/* A página ainda tem dados atuais? */
export function ivaZeroServe(props, agora = Date.now()) {
  const t = Date.parse(`${props?.dia || ""}T12:00:00Z`);
  return Number.isFinite(t) && agora - t < VALIDADE_MS && props?.resumo?.total?.n > 0;
}

/* Lê a linha da página. null se não existir ou o Supabase falhar. */
export async function lerIvaZero() {
  try {
    const { getSupabaseAdmin } = await import("./supabaseAdmin.js");
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("paginas_marca").select("props").eq("tipo", TIPO).eq("slug", SLUG_IVA_ZERO).maybeSingle();
    if (error || !data?.props) return null;
    return data.props;
  } catch {
    return null;
  }
}
