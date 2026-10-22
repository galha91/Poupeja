/*
 * Página pública /tarifa-social — "tenho direito?" para as tarifas sociais
 * de eletricidade, gás natural e internet. Sem I/O, para se testar à parte.
 *
 * Fontes (confirmadas a 22/10/2026):
 *   - DGEG, "Quais as condições de atribuição da tarifa social de energia?"
 *   - ERSE, folheto "Tarifa social — eletricidade e gás natural" (out. 2026):
 *     descontos de 33,8% (luz, 2026) e 31,2% (gás, out. 2026–set. 2027) e
 *     os exemplos de fatura.
 *   - ANACOM, perguntas frequentes da Tarifa Social de Internet
 *     (DL 66/2021): 5 € + IVA por mês, limite de rendimento de 5808 €.
 * Os valores mudam com o Orçamento do Estado e com as tarifas da ERSE:
 * rever todos os anos (janeiro e outubro).
 */
export const VERIFICADO_TARIFA_SOCIAL = "2026-10-22";

export const FONTES_TARIFA_SOCIAL = {
  dgeg: { href: "https://www.dgeg.gov.pt/pt/areas-transversais/politicas-de-protecao-ao-consumidor-de-energia/tarifa-social-de-energia/quais-as-condicoes-de-atribuicao-da-tarifa-social-de-energia/", texto: "DGEG" },
  erse: { href: "https://www.erse.pt/media/xvtbbuq4/tarifa-social_eletricidade_gas_out2026_pt.pdf", texto: "ERSE" },
  anacom: { href: "https://www.anacom-consumidor.pt/faq-tarifa-social-de-internet-tsi", texto: "ANACOM" },
  reclamar: { href: "https://www.dgeg.gov.pt/pt/forms/tarifa-social-pedido-de-informacao-reclamacao/", texto: "formulário da DGEG" },
};

/* Prestações da Segurança Social que dão acesso, e a que tarifa. */
export const PRESTACOES = [
  { id: "csi", nome: "Complemento solidário para idosos" },
  { id: "rsi", nome: "Rendimento social de inserção" },
  { id: "desemprego", nome: "Subsídio de desemprego (qualquer)" },
  { id: "abono", nome: "Abono de família" },
  { id: "invalidez", nome: "Pensão social de invalidez ou complemento da prestação social para a inclusão" },
  { id: "velhice", nome: "Pensão social de velhice" },
];

const ACESSO = {
  // Luz (DGEG/ERSE): todas, abono de qualquer escalão.
  luz: ["csi", "rsi", "desemprego", "abono", "invalidez", "velhice"],
  // Gás (DGEG/ERSE): sem pensão social de velhice; abono só no 1.º escalão.
  gas: ["csi", "rsi", "desemprego", "abono1", "invalidez"],
  // Internet (ANACOM): as mesmas da luz.
  internet: ["csi", "rsi", "desemprego", "abono", "invalidez", "velhice"],
};

export const LIMITE_RENDIMENTO = { luz: 6272.64, internet: 5808 };
export const MAX_PESSOAS = 10;

/** Limite de rendimento anual: +50% por cada pessoa do agregado sem rendimentos (incluindo tu), até 10. */
export function limiteRendimento(base, semRendimento = 0) {
  const n = Math.min(Math.max(Math.round(Number(semRendimento) || 0), 0), MAX_PESSOAS);
  return Math.round(base * (1 + 0.5 * n) * 100) / 100;
}

/*
 * prestacoes: ids de PRESTACOES; escalaoAbono: 1 se o abono é do 1.º escalão.
 * rendimento: rendimento total anual do agregado (como no IRS), ou null.
 * Devolve, para luz, gás e internet: { tem, porque, limite?, falta? }.
 */
export function verificarTarifaSocial({ prestacoes = [], escalaoAbono = null, rendimento = null, semRendimento = 0 }) {
  const tem = new Set(prestacoes);
  if (tem.has("abono") && Number(escalaoAbono) === 1) tem.add("abono1");
  const nomes = (lista) => PRESTACOES.filter((p) => lista.includes(p.id) || (p.id === "abono" && lista.includes("abono1"))).map((p) => p.nome);
  const r = rendimento == null || rendimento === "" ? null : Number(rendimento);

  const avaliar = (tipo) => {
    const porPrestacao = ACESSO[tipo].find((id) => tem.has(id));
    if (porPrestacao) {
      const nome = PRESTACOES.find((p) => p.id === porPrestacao.replace("abono1", "abono"))?.nome;
      return { tem: true, porque: "prestacao", prestacao: nome };
    }
    const base = LIMITE_RENDIMENTO[tipo];
    if (!base) {
      return { tem: false, porque: tem.has("abono") ? "abono-escalao" : "sem-prestacao", aceites: nomes(ACESSO[tipo]) };
    }
    if (r == null || !Number.isFinite(r) || r < 0) return { tem: false, porque: "falta-rendimento", aceites: nomes(ACESSO[tipo]) };
    const limite = limiteRendimento(base, semRendimento);
    if (r <= limite) return { tem: true, porque: "rendimento", limite };
    return { tem: false, porque: "rendimento-acima", limite, falta: Math.round((r - limite) * 100) / 100 };
  };
  return { luz: avaliar("luz"), gas: avaliar("gas"), internet: avaliar("internet") };
}

/* Quanto vale, nos exemplos oficiais (por mês). */
export const VALOR_TARIFA = {
  luz: { pct: 33.8, exemplo: "Numa fatura de 38,15 € por mês (casa com 3,45 kVA e 1900 kWh por ano) poupas 13,44 €.", extra: "Ficas também isento do imposto especial de consumo." },
  gas: { pct: 31.2, exemplo: "Numa fatura de 17,35 € por mês (138 m³ por ano) poupas 7,16 €.", extra: "Ficas também isento do imposto sobre o gás natural." },
  internet: { preco: "5 € + IVA por mês (6,15 €)", exemplo: "Internet fixa ou móvel com pelo menos 12 Mbps e 15 GB por mês.", extra: "A ativação e o equipamento custam no máximo 21,45 € + IVA." },
};

export const PERGUNTAS_TARIFA_SOCIAL = [
  {
    p: "Tenho de pedir a tarifa social de eletricidade?",
    r: "Normalmente não. A DGEG cruza os dados com a Segurança Social e as Finanças e o desconto aparece na fatura sozinho. Se tens direito e não aparece, pede um comprovativo à Segurança Social (ou às Finanças, se for por rendimento) e entrega-o ao teu fornecedor de luz ou gás.",
  },
  {
    p: "Qual é o rendimento máximo para ter tarifa social?",
    r: "Na luz, 6272,64 € por ano para o agregado, mais 50% por cada pessoa sem rendimentos, incluindo tu, até 10 pessoas. Na internet o valor de base é 5808 €, com a mesma regra. No gás natural não há acesso por rendimento: só por prestação social.",
  },
  {
    p: "Quanto se poupa com a tarifa social?",
    r: "Em 2026 o desconto na luz é de 33,8% (sem taxas nem impostos) e no gás natural de 31,2% entre outubro de 2026 e setembro de 2027. Nos exemplos da ERSE, são 13,44 € por mês na luz e 7,16 € no gás. A internet fica a 5 € + IVA por mês.",
  },
  {
    p: "Mudar de fornecedor de luz tira a tarifa social?",
    r: "Não. O desconto é igual no mercado regulado e no livre, por isso podes escolher o fornecedor mais barato. O contrato tem de estar no teu nome, ser da casa onde vives e ter potência até 6,9 kVA.",
  },
  {
    p: "Como peço a tarifa social de internet?",
    r: "Pede-a ao teu operador com o nome completo, o NIF e a morada fiscal. O operador envia os dados à ANACOM, que confirma com a Segurança Social e as Finanças; depois o serviço tem de ser ativado em 10 dias.",
  },
  {
    p: "E se tiver garrafa de gás em vez de gás natural?",
    r: "A tarifa social de gás é só para gás natural canalizado. Para garrafas, a DGEG tem o apoio Botija de Gás Solidária, destinado a quem tem tarifa social de eletricidade: vê na página da DGEG se está aberto e em que condições.",
  },
];

export function perguntasTarifaLd(perguntas = PERGUNTAS_TARIFA_SOCIAL) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
