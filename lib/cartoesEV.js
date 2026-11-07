/*
 * Preços da energia dos principais cartões/apps de carregamento (CEME) na
 * rede MOBI.E, para estimar o custo nos postos com tarifa de operador.
 *
 * Só entram aqui preços confirmados nos preçários oficiais (ver `fonte`).
 * Todos são SEM IVA. Uns já incluem as tarifas de acesso às redes (TAR),
 * outros não — nesses somamos a TAR do período horário.
 * A tarifa EGME por carregamento, o IEC e o IVA são somados em
 * lib/custoCarregamento.js, igual para todos.
 *
 * Rever quando os preçários mudarem: `verificado` é a data da última
 * conferência.
 */

/*
 * TAR para a mobilidade elétrica em baixa tensão, €/kWh sem IVA, ciclo
 * diário (vazio das 22h às 8h). APROXIMAÇÃO: usamos os valores de 2026 da
 * TAR bi-horária em BT (ERSE, Diretiva 1/2026), que é de onde a TAR da
 * mobilidade é derivada. Só pesa nos cartões que não a incluem.
 */
export const TAR_BT = { foraVazio: 0.0835, vazio: 0.0158 };

export const CARTOES_EV = [
  {
    id: "galp",
    nome: "Galp Electric",
    energia: { foraVazio: 0.2895, vazio: 0.2149 },
    incluiTAR: true,
    nota: "Preço base, sem desconto de cliente Galp.",
    fonte: "https://www.galp.com/pt/casa/system/files/2026-10/galp-electric-tabela-precos-descontos-1026.pdf",
    verificado: "2026-11-06",
  },
  {
    id: "iberdrola",
    nome: "Iberdrola",
    energia: { simples: 0.2486 },
    incluiTAR: true,
    nota: "Preço base; clientes de eletricidade Iberdrola têm 20% de desconto.",
    fonte: "https://www.iberdrola.pt/apoio-cliente/ceme/condicoes-oferta",
    verificado: "2026-11-06",
  },
  {
    id: "miio",
    nome: "miio (preço fixo)",
    energia: { simples: 0.24 },
    incluiTAR: false,
    fonte: "https://www.miio.com/pt/prices/charging",
    verificado: "2026-11-06",
  },
  {
    id: "viaverde",
    nome: "Via Verde Electric",
    energia: { simples: 0.148 },
    incluiTAR: false,
    fonte: "https://www.viaverde.pt/via-verde/servicos/via-verde-electric",
    verificado: "2026-11-06",
  },
];

export const CARTAO_MEDIA = "media";
export const CARTAO_MANUAL = "manual";
/* Sem cartão: paga no posto ou na app do operador (ad hoc). Só os postos
 * com preço final publicado têm preço conhecido. */
export const CARTAO_SEM = "sem";

/* Vazio no ciclo diário: das 22h às 8h, hora de Portugal continental. */
export function eVazio(data = new Date()) {
  let hora;
  try {
    hora = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Lisbon" }).format(data), 10);
  } catch {
    hora = data.getHours();
  }
  return hora >= 22 || hora < 8;
}

/* €/kWh sem IVA, já com TAR, de um cartão no instante `data`. */
export function energiaDoCartao(cartao, data = new Date()) {
  if (!cartao?.energia) return null;
  const vazio = eVazio(data);
  const e = cartao.energia.simples ?? (vazio ? cartao.energia.vazio : cartao.energia.foraVazio);
  if (!Number.isFinite(e)) return null;
  const tar = cartao.incluiTAR ? 0 : (vazio ? TAR_BT.vazio : TAR_BT.foraVazio);
  return Math.round((e + tar) * 10000) / 10000;
}

/* Média dos cartões conhecidos, para quem não diz qual usa. */
export function energiaMedia(data = new Date()) {
  const vals = CARTOES_EV.map(c => energiaDoCartao(c, data)).filter(Number.isFinite);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10000) / 10000;
}

/*
 * O €/kWh a usar para a escolha do utilizador:
 *   "media" → média dos cartões; "manual" → o valor que escreveu;
 *   id de um cartão → esse cartão.
 */
export function energiaEscolhida(escolha, manual, data = new Date()) {
  if (escolha === CARTAO_SEM) return null;
  if (escolha === CARTAO_MANUAL) return Number.isFinite(manual) && manual >= 0 ? manual : energiaMedia(data);
  const c = CARTOES_EV.find(x => x.id === escolha);
  return (c && energiaDoCartao(c, data)) ?? energiaMedia(data);
}
