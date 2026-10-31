/*
 * Leitura de uma resposta de /api/precos-supermercado, partilhada pelo
 * ecrã "Comparar preços" e pela comparação da lista de compras. Só corre
 * no browser — nada aqui vai buscar páginas às lojas.
 */

export const valorComparacao = (p, modo) => (modo === "embalagem" ? p.preco : p.precoUnidade);

const hojeLisboa = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

/*
 * Este preço vale hoje para qualquer pessoa? Não, se a promoção ainda não
 * começou (o Lidl mostra o folheto da próxima semana), se já acabou, ou se
 * só se tem com o cartão da loja (Lidl Plus). Esses produtos continuam na
 * lista de resultados, com as datas, mas não entram em "mais barato".
 */
export function valeHoje(p, hoje = hojeLisboa()) {
  if (p.soComCartao) return false;
  if (p.validoDe && p.validoDe > hoje) return false;
  if (p.validoAte && p.validoAte < hoje) return false;
  return true;
}

/*
 * O melhor produto de cada loja para aquela pesquisa, comparável entre
 * lojas: só o que é mesmo o artigo (relevância 2, ou tudo se não houver),
 * e só na unidade principal (não se compara €/kg com €/un).
 */
export function melhoresPorLoja(dados, hoje = hojeLisboa(), { estrito = false } = {}) {
  const modo = dados.modo || "unidade";
  const validos = dados.produtos.filter((p) => valeHoje(p, hoje));
  const principais = validos.filter((p) => p.relevancia === 2);
  // Estrito (a soma da lista): sem nada que seja mesmo o artigo, não há
  // preço. Somar o "parecido" é dar o pão de hambúrguer por hambúrguer.
  const base = principais.length || estrito ? principais : validos;
  const unidade = base[0]?.unidade;
  const comparaveis = semAbsurdos(modo === "embalagem" ? base : base.filter((p) => p.unidade === unidade), modo);
  const melhores = {};
  // Em cada loja, o mais barato; mas a versão normal ganha à "variante"
  // (magra, light, sem lactose, ralada…) que ninguém pediu.
  for (const p of comparaveis) {
    const atual = melhores[p.loja];
    const troca = !atual
      || (atual.variante && !p.variante)
      || (!atual.variante === !p.variante && valorComparacao(p, modo) < valorComparacao(atual, modo));
    if (troca) melhores[p.loja] = p;
  }
  const ranking = Object.values(melhores).sort((a, b) => valorComparacao(a, modo) - valorComparacao(b, modo));
  return { modo, unidade, principais, melhores, ranking };
}

/*
 * Preços que só podem ser erro de leitura da loja: 0,01 €/kg de cogumelos,
 * 0,03 €/kg de croissants, um protetor solar a 0,36 €/L. Com 4 ou mais
 * produtos ao kg ou ao litro, sai o que estiver 20 vezes abaixo ou acima
 * da mediana. (20 e não menos: o sal grosso a 0,29 €/kg é verdadeiro, ao
 * lado das flores de sal a 8 €/kg. E não à unidade, que tanto pode ser o
 * guardanapo como o pacote de 100.)
 */
export function semAbsurdos(produtos, modo = "unidade") {
  if (produtos.length < 4 || modo === "embalagem" || !["kg", "l"].includes(produtos[0]?.unidade)) return produtos;
  const v = produtos.map((p) => valorComparacao(p, modo)).filter((x) => x > 0).sort((a, b) => a - b);
  const med = v[Math.floor(v.length / 2)];
  if (!med) return produtos;
  return produtos.filter((p) => { const x = valorComparacao(p, modo); return x >= med / 20 && x <= med * 20; });
}

/*
 * Quanto custa um artigo da lista em cada loja, para a MESMA quantidade.
 * Sem isto, um saco de 3 kg de laranjas perdia para uma rede de 1 kg só
 * por ser maior. A quantidade de referência é a mediana das embalagens
 * escolhidas em cada loja (o que se ao peso conta como 1 kg): 1 L de leite
 * e não o pack de 8 L do mais barato; 1 kg de frango e não os 150 g das
 * embalagens pequenas que aparecem na pesquisa. Nas ervas conta o molho.
 */
export function custoPorLoja(dados, qtd = 1, escolha = null) {
  const { modo, unidade, melhores, ranking } = melhoresPorLoja(dados, undefined, { estrito: true });
  const vencedor = ranking[0];
  if (!vencedor) {
    // Nenhum produto é mesmo o artigo; se a pessoa escolheu um à mão, vale esse.
    const p = produtoEscolhido(dados, escolha);
    if (!p || !valeHoje(p)) return { custos: {}, referencia: null };
    return { custos: { [p.loja]: { escolhido: true, produto: p, custo: Math.round(p.preco * qtd * 100) / 100 } }, referencia: null };
  }
  let ref = null;
  if (modo !== "embalagem") {
    const qtds = Object.values(melhores).map((p) => (p.aoPeso ? 1 : p.qtdBase || 1)).sort((a, b) => a - b);
    const meio = Math.floor(qtds.length / 2);
    ref = qtds.length % 2 ? qtds[meio] : (qtds[meio - 1] + qtds[meio]) / 2;
  }
  // Produto escolhido à mão para esta loja (a marca de que se gosta, mesmo
  // que não seja o mais barato). As outras lojas ficam com o mais barato.
  const escolhido = produtoEscolhido(dados, escolha);
  const usados = { ...melhores };
  // Uma promoção escolhida que já acabou (ou ainda não começou) não conta.
  if (escolhido && valeHoje(escolhido) && (modo === "embalagem" || escolhido.unidade === unidade)) usados[escolhido.loja] = escolhido;
  const custos = {};
  for (const [loja, p] of Object.entries(usados)) {
    custos[loja] = {
      escolhido: p === escolhido,
      produto: p,
      custo: Math.round((modo === "embalagem" ? p.preco : p.precoUnidade * ref) * qtd * 100) / 100,
    };
  }
  return { custos, referencia: ref ? { qtd: Math.round(ref * 1000) / 1000, unidade: vencedor.nomeUnidade || vencedor.unidade } : null };
}

/* O produto escolhido ({ loja, id }) entre os resultados desta pesquisa. */
export function produtoEscolhido(dados, escolha) {
  if (!escolha?.loja || !escolha?.id || !dados?.produtos) return null;
  return dados.produtos.find((p) => p.loja === escolha.loja && String(p.id) === String(escolha.id)) || null;
}

/*
 * Produtos que se podem escolher para um artigo: os que são mesmo o
 * artigo e na unidade da comparação (não se compara €/kg com €/un).
 */
export function alternativas(dados, max = 30) {
  if (!dados?.produtos?.length) return [];
  const { modo, unidade, principais } = melhoresPorLoja(dados);
  const base = principais.length ? principais : dados.produtos.filter((p) => valeHoje(p));
  return base
    .filter((p) => p.id && (modo === "embalagem" || p.unidade === unidade))
    .slice(0, max);
}

/* Nome de um artigo da lista → termo de pesquisa ("Atum (lata)" → "atum"). */
export function termoDePesquisa(nome) {
  return String(nome || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bcong\.?$/, "congelados")
    .replace(/\bmáq\b\.?/, "máquina")
    .replace(/\bembal\b\.?/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .replace(/.*/, (t) => ALIAS.reduce((x, [de, para]) => x.replace(de, para), t));
}

/*
 * Palavras demasiado gerais para comparar: "Fruta" pode ser maçãs ou
 * puré de bebé, "Carne" pode ser frango ou almôndegas. Em vez de
 * escolher às cegas, pede-se o artigo, com exemplos.
 */
const GENERICOS = {
  fruta: "maçãs, bananas, laranjas", legume: "cenouras, curgete, brócolos", verdura: "alface, couve, espinafres",
  carne: "peito de frango, carne picada, bifes de peru", peixe: "pescada, salmão, bacalhau", marisco: "camarão, amêijoas",
  bebida: "água, sumo, cerveja", snack: "batatas fritas, bolachas", doce: "chocolate, bolachas",
  congelado: "ervilhas congeladas, pescada congelada", charcutaria: "fiambre, chouriço",
  laticinio: "leite, iogurtes, queijo", lacticinio: "leite, iogurtes, queijo", mercearia: "arroz, massa, azeite",
  limpeza: "detergente da loiça, lixívia", higiene: "gel de banho, pasta de dentes", talho: "peito de frango, carne picada",
  peixaria: "pescada, salmão", padaria: "pão de forma, broa", comida: "o que precisas (ex.: arroz, frango)",
  // Palavras soltas que cobrem produtos que não se comparam entre si.
  pao: "pão de forma, carcaças, baguete, broa", cafe: "café moído, café em cápsulas, café em grão, café solúvel",
  leite: "leite meio-gordo, leite magro, leite sem lactose", queijo: "queijo flamengo, queijo fresco, queijo ralado",
  iogurte: "iogurte natural, iogurte grego, iogurte líquido", sumo: "sumo de laranja, sumo de maçã",
  vinho: "vinho tinto, vinho branco, vinho verde", refrigerante: "coca cola, fanta, sprite, gasosa",
  bolacha: "bolacha maria, bolacha de água e sal, bolachas recheadas",
  // Marcas com vários produtos que não se comparam entre si.
  danone: "iogurte natural danone, iogurte grego danone", mimosa: "leite mimosa meio-gordo, iogurte mimosa, natas mimosa",
  nesquik: "cereais nesquik, nesquik em pó", milo: "cereais milo, milo em pó",
  nescafe: "nescafé solúvel, nescafé dolce gusto", delta: "café delta moído, café delta cápsulas",
  fairy: "detergente loiça fairy, pastilhas máquina fairy", kinder: "kinder bueno, kinder chocolate",
  // Palavras soltas vistas na auditoria das pesquisas livres (31/10/2026).
  peru: "peito de peru, bifes de peru, carne picada de peru", "carne de vaca": "bife de novilho, carne picada, carne para estufar",
  "carne de porco": "costeletas, lombo de porco, bifanas, febras", filete: "filetes de pescada, filetes de cavala",
  feijao: "feijão verde, feijão frade, feijão preto, feijão encarnado", ervilha: "ervilhas congeladas, ervilhas em lata",
  milho: "milho doce, milho para pipocas", sopa: "sopa de legumes, sopa juliana", salsicha: "salsichas frankfurt, salsichas frescas",
  bolo: "bolo de chocolate, bolo mármore, bolo-rei", couve: "couve portuguesa, couve lombarda, couve-flor", aveia: "flocos de aveia, bebida de aveia",
  especiaria: "pimenta, canela, colorau, orégãos", creme: "creme de culinária, creme hidratante, creme de barrar",
  detergente: "detergente roupa, detergente loiça, detergente máquina loiça", "leite bebe": "leite NAN, leite Aptamil",
  pilha: "pilhas AA, pilhas AAA", lampada: "lâmpada LED E27, lâmpada LED E14", vela: "velas brancas, velas de aniversário",
  penso: "pensos rápidos, pensos higiénicos", papa: "papa infantil, papa de aveia", esponja: "esponja de cozinha, esponja de banho",
};

/* Maneiras de escrever que as lojas não percebem. */
const ALIAS = [
  [/\b(yogurte|yogurt|iogurt)(e?s?)\b/g, "iogurte$2"], [/\bhamburger(es)?\b/g, "hambúrguer"], [/\bchicletes?\b/g, "pastilhas elásticas"],
  [/^lava lou[çc]a$/, "detergente loiça"], [/\b(bifes?) de vaca\b/g, "$1 de novilho"],
];
const chaveGenerica = (nome) => {
  const w = String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z ]/g, "").replace(/\s+/g, " ");
  return w.replace(/oes$/, "ao").replace(/s$/, "");
};
export const eGenerico = (nome) => Object.prototype.hasOwnProperty.call(GENERICOS, chaveGenerica(nome));
export const exemplosGenerico = (nome) => GENERICOS[chaveGenerica(nome)] || "";

/*
 * As opções para escolher quando se escreve uma palavra geral («pão» →
 * Pão de forma, Carcaças, Baguete…): os exemplos, um a um, com maiúscula.
 * Vazio se não há opções claras (o que se escreveu entra como está).
 */
export function opcoesGenerico(nome) {
  return exemplosGenerico(nome).split(",").map((o) => o.trim()).filter((o) => o && !/[()]/.test(o))
    .map((o) => o.charAt(0).toUpperCase() + o.slice(1));
}
