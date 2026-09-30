/*
 * Fontes oficiais de tudo o que a app mostra e vem do Estado ou de uma
 * entidade pública. Um sítio só: os ecrãs (FonteOficial) e a página
 * /fontes lêem daqui, para o link e o nome nunca divergirem.
 *
 * O PoupeJá não é um serviço do Estado. Cada número que sai destas fontes
 * traz, no próprio ecrã, o link para o original — e é isso que a Google
 * Play pede a apps que apresentam informação governamental.
 */

export const FONTES = {
  dgeg: {
    curto: "DGEG",
    nome: "DGEG — Direção-Geral de Energia e Geologia",
    detalhe: "Preços dos combustíveis, comunicados pelos próprios postos",
    href: "https://precoscombustiveis.dgeg.gov.pt/",
  },
  cirs: {
    curto: "Código do IRS",
    nome: "Código do IRS — Portal das Finanças",
    detalhe: "Escalões e taxas (art. 68.º), deduções e limites",
    href: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/codigo-do-irs-indice.aspx",
  },
  irs68: {
    curto: "Art. 68.º do Código do IRS",
    nome: "Código do IRS, art. 68.º (taxas gerais) — Portal das Finanças",
    detalhe: "Tabela de escalões e taxas do IRS",
    href: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx",
  },
  ias: {
    curto: "IAS 2026",
    nome: "Portaria n.º 480-A/2025/1 — Diário da República",
    detalhe: "Valor do Indexante dos Apoios Sociais em 2026 (537,13 €)",
    href: "https://diariodarepublica.pt/dr/detalhe/portaria/480-a-2025-993056222",
  },
  euribor: {
    curto: "Banco de Portugal",
    nome: "Banco de Portugal — Taxas Euribor por prazo",
    detalhe: "Euribor a 3, 6 e 12 meses",
    href: "https://bpstat.bportugal.pt/conteudos/quadros/2599",
  },
  rendas: {
    curto: "Portal da Habitação",
    nome: "Portal da Habitação — Coeficientes de atualização de rendas",
    detalhe: "Coeficiente anual fixado pelo INE (2026: Aviso n.º 23174/2025/2)",
    href: "https://www.portaldahabitacao.pt/coeficientes-de-atualizacao-de-rendas",
  },
  ine: {
    curto: "Aviso do INE",
    nome: "Aviso n.º 23174/2025/2 — Diário da República",
    detalhe: "Coeficiente de atualização das rendas para 2026 (1,0224)",
    href: "https://diariodarepublica.pt/dr/detalhe/aviso/23174-2025-935742337",
  },
  gov: {
    curto: "gov.pt",
    nome: "gov.pt — Portal de serviços públicos",
    detalhe: "Pedidos e informação de serviços do Estado",
    href: "https://www.gov.pt/",
  },
  segsocial: {
    curto: "Segurança Social",
    nome: "Segurança Social",
    detalhe: "Prestações sociais, subsídios e abonos",
    href: "https://www.seg-social.pt/",
  },
  erse: {
    curto: "ERSE",
    nome: "ERSE — Entidade Reguladora dos Serviços Energéticos",
    detalhe: "Tarifas e apoios na eletricidade e no gás",
    href: "https://www.erse.pt/",
  },
  habitacao: {
    curto: "Portal da Habitação",
    nome: "Portal da Habitação",
    detalhe: "Apoios ao arrendamento e à habitação",
    href: "https://www.portaldahabitacao.pt/",
  },
  financas: {
    curto: "Portal das Finanças",
    nome: "Portal das Finanças",
    detalhe: "Benefícios fiscais, IRS Jovem e IMT Jovem",
    href: "https://info.portaldasfinancas.gov.pt/",
  },
  iefp: {
    curto: "IEFP",
    nome: "IEFP — Instituto do Emprego e Formação Profissional",
    detalhe: "Apoios ao emprego e à formação",
    href: "https://iefponline.iefp.pt/",
  },
  dges: {
    curto: "DGES",
    nome: "DGES — Direção-Geral do Ensino Superior",
    detalhe: "Bolsas e apoios no ensino superior",
    href: "https://www.dges.gov.pt/",
  },
};

/** Nome curto do domínio de um link oficial ("www.seg-social.pt" → "seg-social.pt"). */
export function dominioDe(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
