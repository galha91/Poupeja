/*
 * Páginas públicas por perfil (/poupar/estudantes, /poupar/familias,
 * /poupar/reformados). Texto fixo: não lê nada do Supabase, por isso a
 * página é estática e não gasta CPU nem tráfego (ver CLAUDE.md).
 *
 * Não há valores de apoios nem preços aqui, de propósito: mudam e já
 * vivem nas páginas próprias (/apoios/<slug>, /barometro). Aqui só se
 * aponta o caminho. Os links são verificados em tests/seoPerfis.test.mjs.
 */

export const VERIFICADO_PERFIS = "2026-11-28";

export const PERFIS = [
  {
    slug: "estudantes",
    nome: "Estudantes deslocados",
    titulo: "Poupar sendo estudante deslocado: compras, refeições e apoios | PoupeJá",
    descricao: "Vives fora de casa? Vê onde a lista de compras fica mais barata, receitas com custo por pessoa, o passe e os apoios para estudantes. Grátis e sem conta.",
    h1: "Estudante deslocado: como esticar o orçamento do mês",
    intro: "Renda, propinas, transportes e a despensa vazia ao domingo à noite. O PoupeJá não resolve tudo, mas ajuda a gastar menos no que se repete todas as semanas.",
    seccoes: [
      {
        titulo: "Compras para uma pessoa",
        paragrafos: [
          "Escreve a lista no PoupeJá e vê em que supermercado fica mais barata. Se compensar, a lista divide-se pelas duas lojas mais económicas.",
          "Compara sempre pelo preço ao quilo ou ao litro. A embalagem grande nem sempre é a mais barata e, numa casa de uma pessoa, o que se estraga também conta.",
          "Antes de ires, vê os folhetos da semana. As promoções do Lidl e do Aldi estão lá.",
        ],
        links: [
          { texto: "Fazer a lista", href: "/?atalho=lista", app: true },
          { texto: "Folhetos da semana", href: "/folhetos" },
          { texto: "Qual é mais barato?", href: "/comparar" },
        ],
      },
      {
        titulo: "Cozinhar barato sem comer sempre o mesmo",
        paragrafos: [
          "As receitas do PoupeJá mostram o custo por pessoa. Cozinha uma vez para três refeições e guarda em caixas.",
          "Se partilhas casa, a ementa da semana faz o plano para o número de pessoas que indicares e gera a lista de compras.",
        ],
        links: [
          { texto: "Receitas baratas", href: "/receitas" },
          { texto: "Ementa da semana", href: "/?atalho=ementas", app: true },
        ],
      },
      {
        titulo: "Apoios que vale a pena confirmar",
        paragrafos: [
          "Passe Sub-23 gratuito, para jovens até aos 23 anos, estudantes ou não.",
          "Bolsa de estudo do ensino superior, para agregados com rendimentos baixos. As candidaturas têm prazo, por isso confirma as datas.",
          "Porta 65, o apoio à renda para jovens com contrato de arrendamento registado.",
        ],
        links: [
          { texto: "Passe Sub-23", href: "/apoios/passe-sub23" },
          { texto: "Bolsa de estudo", href: "/apoios/bolsa-acao-social" },
          { texto: "Porta 65", href: "/apoios/porta-65-jovem" },
          { texto: "Prazos do Estado", href: "/prazos" },
        ],
      },
    ],
    perguntas: [
      { p: "O PoupeJá é mesmo grátis?", r: "Sim. Não pede conta nem dados pessoais. Abre no telemóvel e usa-se logo." },
      { p: "Os preços são os da loja?", r: "São os preços publicados nas lojas online das cadeias. Podem ser diferentes dos da loja física, por isso confirma no momento da compra." },
      { p: "Que supermercados entram na comparação?", r: "Só as cadeias com preços disponíveis online. A lista atual está na página de fontes." },
    ],
  },
  {
    slug: "familias",
    nome: "Famílias",
    titulo: "Poupar no supermercado em família: lista, ementa e apoios | PoupeJá",
    descricao: "Família com filhos? Compara a lista de compras entre supermercados, planeia a ementa da semana e vê os apoios a que podes ter direito. Grátis e sem conta.",
    h1: "Família: gastar menos no supermercado sem mudar o que se come",
    intro: "Numa casa com filhos, o supermercado é das contas que mais pesa no mês. O que costuma fazer diferença é comparar a mesma lista antes de sair de casa, mais do que cortar no que se compra.",
    seccoes: [
      {
        titulo: "A mesma lista, vários supermercados",
        paragrafos: [
          "Põe no PoupeJá o que compras todas as semanas: leite, fruta, carne, detergente. Vê em que cadeia o total fica mais baixo e se vale a pena dividir a compra por duas lojas.",
          "Nos produtos de marca, a diferença entre cadeias costuma ser maior. Nos básicos de marca própria, os preços tendem a estar mais próximos.",
          "Desconfia da percentagem de desconto. Uma promoção pode só trazer o preço para o valor que outra cadeia já pratica sem promoção.",
        ],
        links: [
          { texto: "Fazer a lista", href: "/?atalho=lista", app: true },
          { texto: "Qual é mais barato?", href: "/comparar" },
          { texto: "Barómetro do cabaz", href: "/barometro" },
        ],
      },
      {
        titulo: "Ementa da semana feita para a tua casa",
        paragrafos: [
          "Indica quantas pessoas são, o orçamento e o que não comem. A ementa da semana faz o plano, a lista de compras e diz onde fica mais barata.",
          "As receitas mostram o custo por pessoa, o que ajuda a perceber quanto custa, de facto, um jantar para quatro.",
        ],
        links: [
          { texto: "Ementa da semana", href: "/?atalho=ementas", app: true },
          { texto: "Receitas", href: "/receitas" },
        ],
      },
      {
        titulo: "Apoios a confirmar",
        paragrafos: [
          "Abono de família, para crianças e jovens até aos 24 anos, conforme o escalão de rendimentos.",
          "Tarifa social de eletricidade e de gás, para quem cumpre as condições.",
          "Passe Sub-23 gratuito para os filhos até aos 23 anos.",
        ],
        links: [
          { texto: "Abono de família", href: "/abono-de-familia" },
          { texto: "Tarifa social", href: "/tarifa-social" },
          { texto: "Passe Sub-23", href: "/apoios/passe-sub23" },
          { texto: "Todos os apoios", href: "/apoios" },
        ],
      },
    ],
    perguntas: [
      { p: "Preciso de criar conta?", r: "Não. O PoupeJá usa-se sem conta e sem dados pessoais." },
      { p: "Compensa ir a dois supermercados?", r: "Depende da distância e do valor poupado. O PoupeJá mostra a diferença; a decisão é tua." },
      { p: "De onde vêm os preços?", r: "Dos sites das cadeias, atualizados todos os dias. A metodologia está na página de fontes." },
    ],
  },
  {
    slug: "reformados",
    nome: "Reformados e pensionistas",
    titulo: "Poupar na reforma: compras, saúde, transportes e apoios | PoupeJá",
    descricao: "Reformado ou pensionista? Vê onde as compras ficam mais baratas, o passe sénior, as taxas moderadoras e o Complemento Solidário para Idosos. Grátis.",
    h1: "Reformados e pensionistas: onde se pode poupar",
    intro: "Com uma pensão fixa, cada euro conta. Aqui está o que o PoupeJá mostra sobre compras e combustível, e os apoios que muitas pessoas não chegam a pedir.",
    seccoes: [
      {
        titulo: "Compras sem andar de loja em loja",
        paragrafos: [
          "Escreve a lista no PoupeJá, sozinho ou com a ajuda de um filho ou neto, e vê onde fica mais barata antes de sair de casa.",
          "Os folhetos da semana estão todos no mesmo sítio, sem papel nem aplicações de cada loja.",
          "Se conduzes, vê o posto de combustível mais barato do teu concelho, com os dados oficiais da DGEG.",
        ],
        links: [
          { texto: "Fazer a lista", href: "/?atalho=lista", app: true },
          { texto: "Folhetos", href: "/folhetos" },
          { texto: "Combustível", href: "/combustiveis" },
        ],
      },
      {
        titulo: "Apoios que muitas vezes ficam por pedir",
        paragrafos: [
          "Complemento Solidário para Idosos, para pensionistas com rendimentos muito baixos.",
          "Isenção de taxas moderadoras, nos casos previstos, incluindo rendimentos baixos.",
          "Passe +65, com preço reduzido nos transportes.",
          "Tarifa social de eletricidade e de gás.",
        ],
        links: [
          { texto: "Complemento Solidário para Idosos", href: "/apoios/csi" },
          { texto: "Taxas moderadoras", href: "/apoios/isencao-taxas-moderadoras" },
          { texto: "Passe +65", href: "/apoios/passe-senior" },
          { texto: "Tarifa social", href: "/tarifa-social" },
        ],
      },
      {
        titulo: "Garantias e devoluções",
        paragrafos: [
          "Guarda as faturas dos eletrodomésticos e sabe até quando estão na garantia. O PoupeJá guarda as datas e avisa quando o prazo está a acabar.",
        ],
        links: [
          { texto: "Garantias", href: "/garantias" },
          { texto: "Devoluções", href: "/devolucoes" },
        ],
      },
    ],
    perguntas: [
      { p: "É difícil de usar?", r: "Abre no navegador do telemóvel, sem instalar nada e sem criar conta." },
      { p: "O PoupeJá pede os meus dados?", r: "Não pede nome, email nem número de contribuinte." },
      { p: "Os apoios são automáticos?", r: "Alguns são, como a tarifa social. Outros têm de ser pedidos. Cada página de apoio explica como." },
    ],
  },
];

export const SLUGS_PERFIS = PERFIS.map((p) => p.slug);

export function perfilPorSlug(slug) {
  return PERFIS.find((p) => p.slug === slug) || null;
}

export function perguntasPerfilLd(perfil) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perfil.perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
