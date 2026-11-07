/*
 * Preços da energia dos cartões/apps de carregamento (CEME) na rede
 * MOBI.E, para estimar o custo nos postos com tarifa de operador.
 *
 * Só entram aqui preços FIXOS confirmados no preçário oficial de cada
 * fornecedor (ver `fonte`), preço base sem descontos ligados a outros
 * contratos. Ficam de fora os tarifários indexados ao mercado (LUZiGÁS,
 * MEO dinâmica, eVaz), que mudam a cada quarto de hora ou mês.
 *
 * Todos os valores são SEM IVA. Uns já incluem as tarifas de acesso às
 * redes (TAR), outros não — nesses somamos a TAR do período horário.
 * A tarifa EGME por carregamento, o IEC e o IVA são somados em
 * lib/custoCarregamento.js, iguais para todos. `ativacao` é a taxa por
 * carregamento que o próprio cartão cobra (além da EGME).
 *
 * Rever quando os preçários mudarem: `verificado` é a data da conferência.
 */

/*
 * TAR para a mobilidade elétrica em baixa tensão, 2026, €/kWh sem IVA,
 * ciclo diário. Deduzida do preçário oficial da EVPower (jan. 2026), que
 * publica o mesmo tarifário com e sem TAR: 0,3144−0,1952 fora de vazio e
 * 0,1995−0,1729 em vazio. Bate com a ordem de grandeza de 2025
 * (0,1170 / 0,0253, Via Verde). Só pesa nos cartões que não a incluem.
 */
export const TAR_BT = { foraVazio: 0.1192, vazio: 0.0266 };

const HOJE = "2026-11-07";

export const CARTOES_EV = [
  {
    id: "acp", nome: "ACP Electric (sócios)",
    energia: { simples: 0.1506 }, incluiTAR: false, ativacao: 0.15,
    nota: "Preço para sócios ACP.",
    fonte: "https://www.acp.pt/veiculos/eletricos/app-e-cartao-acp-electric/poupanca-no-carregamento",
    verificado: HOJE,
  },
  {
    id: "charge2go", nome: "Charge2go",
    energia: { simples: 0.1697 }, incluiTAR: false,
    fonte: "https://charge2go.pt/tarifarios/",
    verificado: HOJE,
  },
  {
    id: "edp", nome: "EDP Charge",
    energia: { simples: 0.2678 }, incluiTAR: true,
    nota: "Preço de referência; clientes de energia EDP têm 20% de desconto.",
    fonte: "https://www.edp.pt/pdf/tabela-precos-ceme.pdf",
    verificado: HOJE,
  },
  {
    id: "evio", nome: "EVIO",
    energia: { simples: 0.169 }, incluiTAR: false, ativacao: 0.15,
    fonte: "https://ceme.go-evio.com/pt/site-ceme",
    verificado: HOJE,
  },
  {
    id: "evpower", nome: "EVPower",
    energia: { foraVazio: 0.3144, vazio: 0.1995 }, incluiTAR: true,
    fonte: "https://www.evpower.pt/wp-content/uploads/2025/12/tarifario_janeiro_2026.png",
    verificado: HOJE,
  },
  {
    id: "factor", nome: "FactorENERGIA",
    energia: { ponta: 0.3458, cheias: 0.234, vazio: 0.183 }, incluiTAR: true,
    nota: "Tarifa tri-horária: o preço muda ao longo do dia.",
    fonte: "https://www.factorenergia.pt/wp-content/uploads/2026/05/Tabela-precos-vecard-jan-2026-novo-logo.pdf",
    verificado: HOJE,
  },
  {
    id: "galp", nome: "Galp Electric",
    energia: { foraVazio: 0.2895, vazio: 0.2149 }, incluiTAR: true,
    nota: "Preço base, sem desconto de cliente Galp.",
    fonte: "https://www.galp.com/pt/casa/system/files/2026-10/galp-electric-tabela-precos-descontos-1026.pdf",
    verificado: HOJE,
  },
  {
    id: "goldenergy", nome: "Goldenergy",
    energia: { simples: 0.2778 }, incluiTAR: true,
    nota: "Tarifário Energia Base, não cliente.",
    fonte: "https://goldenergy.pt/mobilidade-eletrica/",
    verificado: HOJE,
  },
  {
    id: "iberdrola", nome: "Iberdrola",
    energia: { simples: 0.2486 }, incluiTAR: true,
    nota: "Preço base; clientes de eletricidade Iberdrola têm 20% de desconto.",
    fonte: "https://www.iberdrola.pt/apoio-cliente/ceme/condicoes-oferta",
    verificado: HOJE,
  },
  {
    id: "meo", nome: "MEO Energia (tarifa fixa)",
    energia: { simples: 0.5 }, incluiTAR: true,
    nota: "Preço sem pacote MEO; clientes MEO pagam 0,225–0,25 €/kWh.",
    fonte: "https://www.meoenergia.pt/mobilidade-eletrica",
    verificado: HOJE,
  },
  {
    id: "miio", nome: "miio (preço fixo)",
    energia: { simples: 0.24 }, incluiTAR: false,
    fonte: "https://www.miio.com/pt/prices/charging",
    verificado: HOJE,
  },
  {
    id: "moeve", nome: "Moeve (ex-Cepsa)",
    energia: { foraVazio: 0.22, vazio: 0.13 }, incluiTAR: true,
    fonte: "https://pt.moeveglobal.com/stfls/cepsa-pt/Ficheros/condicoes-comerciais-25.pdf",
    verificado: HOJE,
  },
  {
    id: "myatlante", nome: "myAtlante (cartão)",
    energia: { simples: 0.12 }, incluiTAR: false,
    fonte: "https://atlante.energy/pt-pt/tarifas-de-energia/",
    verificado: HOJE,
  },
  {
    id: "myenable", nome: "MyEnable",
    energia: { simples: 0.12 }, incluiTAR: false,
    fonte: "https://www.enable-mobility.com/en/blog/mobi-e-network-what-it-is-and-how-to-charge",
    verificado: HOJE,
  },
  {
    id: "prio", nome: "Prio Electric",
    energia: { foraVazio: 0.1399, vazio: 0.1499 }, incluiTAR: false,
    fonte: "https://www.prio.pt/pt/cartao-prio-electric/adesao-ao-cartao-prio-electric_471.html",
    verificado: HOJE,
  },
  {
    id: "repsol", nome: "Repsol",
    energia: { simples: 0.2868 }, incluiTAR: true,
    fonte: "https://www.repsol.pt/content/dam/repsol-portugal/mobilidade-el%C3%A9trica/22-05-2026/TarifarioME.pdf",
    verificado: HOJE,
  },
  {
    id: "viaverde", nome: "Via Verde Electric",
    energia: { simples: 0.148 }, incluiTAR: false,
    fonte: "https://www.viaverde.pt/via-verde/servicos/via-verde-electric",
    verificado: HOJE,
  },
  {
    id: "zunder", nome: "Zunder",
    energia: { foraVazio: 0.173, vazio: 0.2 }, incluiTAR: false, ativacao: 0.99,
    fonte: "https://www.zunder.com/pt-pt/utilizador-ve/",
    verificado: HOJE,
  },
];

export const CARTAO_MEDIA = "media";
export const CARTAO_MANUAL = "manual";
/* Sem cartão: paga no posto ou na app do operador (ad hoc). Só os postos
 * com preço final publicado têm preço conhecido. */
export const CARTAO_SEM = "sem";

/* Hora e minutos em Portugal continental, e se está na hora de verão. */
function horaLisboa(data) {
  try {
    const partes = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: "Europe/Lisbon",
    }).formatToParts(data);
    const h = parseInt(partes.find(p => p.type === "hour").value, 10);
    const m = parseInt(partes.find(p => p.type === "minute").value, 10);
    const verao = ((h - data.getUTCHours()) + 24) % 24 === 1;
    return { h, m, verao };
  } catch {
    return { h: data.getHours(), m: data.getMinutes(), verao: false };
  }
}

/* Vazio no ciclo diário: das 22h às 8h, hora de Portugal continental. */
export function eVazio(data = new Date()) {
  const { h } = horaLisboa(data);
  return h >= 22 || h < 8;
}

/*
 * Período tri-horário (ciclo diário, ERSE): vazio 22h–8h; ponta de inverno
 * 9h–10h30 e 18h–20h30, de verão 10h30–13h e 19h30–21h; o resto é cheias.
 */
export function periodoTri(data = new Date()) {
  const { h, m, verao } = horaLisboa(data);
  if (h >= 22 || h < 8) return "vazio";
  const t = h * 60 + m;
  const pontas = verao ? [[630, 780], [1170, 1260]] : [[540, 630], [1080, 1230]];
  return pontas.some(([a, b]) => t >= a && t < b) ? "ponta" : "cheias";
}

/* €/kWh sem IVA, já com TAR, de um cartão no instante `data`. */
export function energiaDoCartao(cartao, data = new Date()) {
  const en = cartao?.energia;
  if (!en) return null;
  const vazio = eVazio(data);
  let e;
  if (Number.isFinite(en.simples)) e = en.simples;
  else if (Number.isFinite(en.ponta)) e = en[periodoTri(data)];
  else e = vazio ? en.vazio : en.foraVazio;
  if (!Number.isFinite(e)) return null;
  const tar = cartao.incluiTAR ? 0 : (vazio ? TAR_BT.vazio : TAR_BT.foraVazio);
  return Math.round((e + tar) * 10000) / 10000;
}

/* Taxa por carregamento cobrada pelo próprio cartão (sem IVA, além da EGME). */
export function ativacaoDoCartao(escolha) {
  const c = CARTOES_EV.find(x => x.id === escolha);
  return c?.ativacao > 0 ? c.ativacao : 0;
}

/* Média dos cartões conhecidos — sugestão para quem escreve o preço à mão. */
export function energiaMedia(data = new Date()) {
  const vals = CARTOES_EV.map(c => energiaDoCartao(c, data)).filter(Number.isFinite);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10000) / 10000;
}

/*
 * O €/kWh a usar para a escolha do utilizador:
 *   "sem" → null (sem cartão); "manual" → o valor que escreveu;
 *   id de um cartão → esse cartão; outra coisa → média.
 */
export function energiaEscolhida(escolha, manual, data = new Date()) {
  if (escolha === CARTAO_SEM) return null;
  if (escolha === CARTAO_MANUAL) return Number.isFinite(manual) && manual >= 0 ? manual : energiaMedia(data);
  const c = CARTOES_EV.find(x => x.id === escolha);
  return (c && energiaDoCartao(c, data)) ?? energiaMedia(data);
}
