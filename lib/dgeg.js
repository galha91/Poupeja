/*
 * Cliente da DGEG — fonte única dos preços de combustível.
 *
 * Estava tudo dentro de pages/api/combustiveis.js. Saiu para aqui porque
 * as páginas públicas por concelho precisam dos mesmos dados, e ter duas
 * cópias do mapeamento de tipos de combustível era garantia de deriva.
 *
 * O endpoint da DGEG é por DISTRITO — não há forma de pedir um concelho.
 * Portanto puxamos o distrito inteiro e agrupamos aqui.
 */

const BASE  = "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos";
const FUELS = "3400,3205,3405,3201,2105,2101,1120";

const HEADERS = {
  "Accept": "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; PoupeJa/1.0)",
  "Referer": "https://precoscombustiveis.dgeg.gov.pt/",
  "Origin": "https://precoscombustiveis.dgeg.gov.pt",
};

/*
 * Os 18 distritos do continente, com o id da DGEG e o centro aproximado.
 * As coordenadas são as que já cá estavam — servem só para escolher que
 * distritos vale a pena consultar, nunca para posicionar nada no mapa.
 *
 * Só continente. Atenção ao que isto quer dizer: NÃO é que a DGEG não
 * tenha as ilhas — é que nunca lhas pedimos, porque esta lista para no 18.
 * Se a Madeira e os Açores tiverem ids (19, 20, …), basta acrescentá-los
 * aqui e as páginas desses concelhos aparecem sozinhas, sem mais nada.
 * Vale a pena confirmar em produção, que é onde a DGEG é alcançável.
 */
export const DISTRITOS = [
  { id: 1,  nome: "Aveiro",           lat: 40.64, lon: -8.65 },
  { id: 2,  nome: "Beja",             lat: 37.96, lon: -7.86 },
  { id: 3,  nome: "Braga",            lat: 41.55, lon: -8.43 },
  { id: 4,  nome: "Bragança",         lat: 41.81, lon: -6.76 },
  { id: 5,  nome: "Castelo Branco",   lat: 39.82, lon: -7.49 },
  { id: 6,  nome: "Coimbra",          lat: 40.21, lon: -8.43 },
  { id: 7,  nome: "Évora",            lat: 38.57, lon: -7.91 },
  { id: 8,  nome: "Faro",             lat: 37.02, lon: -7.94 },
  { id: 9,  nome: "Guarda",           lat: 40.54, lon: -7.27 },
  { id: 10, nome: "Leiria",           lat: 39.74, lon: -8.81 },
  { id: 11, nome: "Lisboa",           lat: 38.72, lon: -9.14 },
  { id: 12, nome: "Portalegre",       lat: 39.30, lon: -7.44 },
  { id: 13, nome: "Porto",            lat: 41.15, lon: -8.61 },
  { id: 14, nome: "Santarém",         lat: 39.24, lon: -8.69 },
  { id: 15, nome: "Setúbal",          lat: 38.52, lon: -8.89 },
  { id: 16, nome: "Viana do Castelo", lat: 41.69, lon: -8.84 },
  { id: 17, nome: "Vila Real",        lat: 41.30, lon: -7.74 },
  { id: 18, nome: "Viseu",            lat: 40.66, lon: -7.91 },
];

const NOME_DISTRITO = new Map(DISTRITOS.map(d => [d.id, d.nome]));

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Normaliza o rótulo do combustível. null = tipo que não mostramos
   (gasóleo de aquecimento, colorido, GNV sem interesse para o utilizador). */
export function mapTipo(raw) {
  if (!raw) return null;
  const n = raw.toLowerCase();
  if (n.includes("gpl")) return "GPL Auto";
  if (n.includes("gnv")) return "GNV";
  if (n.includes("gasóleo") || n.includes("gasoleo")) {
    if (n.includes("colorido") || n.includes("marcado") || n.includes("aquecimento")) return null;
    if (n.includes("espec") || n.includes("aditiv") || n.includes("premium")) return "Gasóleo Aditivado";
    return "Gasóleo";
  }
  if (n.includes("gasolina") || n.includes("sem chumbo")) {
    const is98 = n.includes("98"), is95 = n.includes("95");
    if (!is95 && !is98) return null;
    const grade = is98 ? "98" : "95";
    if (n.includes("espec") || n.includes("aditiv") || n.includes("premium")) return `Gasolina ${grade} Aditivada`;
    return `Gasolina ${grade}`;
  }
  return null;
}

export const MARCAS_SKIP = ["genérico", "generica", "generico", ""];

/* Em produção a base é o próprio domínio; em testes aponta-se
   DGEG_BASE_URL para um simulador local (a DGEG não é alcançável do CI). */
function urlBase() {
  return process.env.DGEG_BASE_URL || BASE;
}

/* Cache por distrito, partilhada por todas as rotas na mesma instância
   quente. Sem isto, uma página de concelho e o sitemap disparavam dezenas
   de pedidos à DGEG por visita. */
const CACHE_TTL = 30 * 60 * 1000;

/*
 * Até quando é que um preço ainda vale a pena ser mostrado — e aqui há
 * DOIS prazos diferentes, para dois consumidores diferentes, e uni-los
 * num só foi um erro que criou um bug concreto (explico abaixo).
 *
 * VALIDADE_PRECOS (7 dias) é para quem MOSTRA a data ao utilizador — as
 * páginas de SEO (via lib/precosSnapshot.js), onde um preço de anteontem
 * ainda é útil porque aparece rotulado como tal, com aviso.
 *
 * IDADE_MAXIMA_CACHE_LIVE é para o CACHE EM MEMÓRIA por distrito que esta
 * rota usa quando a DGEG falha — e que pages/api/combustiveis.js (o que
 * a própria app chama, em tempo real, no ecrã de Início e Mobilidade)
 * consulta directamente, SEM mostrar idade nenhuma ao utilizador.
 *
 * Tinha as duas amarradas à mesma constante. Consequência real: se um
 * único distrito falhasse uma vez e ficasse com cache antiga, essa cache
 * podia ser servida como se fosse fresca durante DIAS — e o cartão
 * "Gasóleo mais barato" da Início escolhe o mínimo entre TODOS os
 * distritos, por isso bastava um distrito desatualizado ter, por azar,
 * o valor mais baixo para esse valor "vencer" nacionalmente, sem
 * qualquer aviso — porque esse cartão não tem data nenhuma. Foi o que
 * aconteceu: a Início mostrava um preço que já não era real, enquanto o
 * ecrã de Mobilidade (perto de ti, com estação e distância à vista)
 * mostrava o preço verdadeiro.
 *
 * A janela aqui é curta de propósito — um distrito que falhe continua a
 * servir a última cache boa por umas horas (sobrevive a um soluço breve
 * da DGEG), mas para de contar para o "mais barato" antes de isso poder
 * mentir ao utilizador durante um dia inteiro.
 */
export const VALIDADE_PRECOS = 7 * 24 * 60 * 60 * 1000;
export const IDADE_MAXIMA_CACHE_LIVE = 3 * 60 * 60 * 1000;

const cache = (globalThis.__dgegCache ||= new Map());

/*
 * Devolve SEMPRE { postos, obtidoEm, stale }.
 *
 * O obtidoEm é o instante em que estes postos vieram mesmo da DGEG — não
 * o instante em que alguém pediu a página. Quem mostra a data ao
 * utilizador tem de usar este valor: carimbar new Date() a cada render
 * faz a página jurar que os dados são de hoje, sempre, mesmo quando não são.
 */
export async function postosDoDistrito(id, { timeoutMs = 7000, forcar = false } = {}) {
  const agora = Date.now();
  const guardado = cache.get(id);
  // O cron passa forcar: o seu trabalho é ir mesmo buscar dados novos, não
  // reescrever o snapshot com o que já tinha em memória.
  if (!forcar && guardado && agora - guardado.ts < CACHE_TTL) {
    return { postos: guardado.postos, obtidoEm: guardado.ts, stale: false };
  }

  function recorrerACache() {
    // Um soluço da DGEG não deve apagar dados bons — mas há um limite
    // curto: isto alimenta ecrãs SEM data visível (ver IDADE_MAXIMA_CACHE_LIVE).
    if (guardado && agora - guardado.ts < IDADE_MAXIMA_CACHE_LIVE) {
      return { postos: guardado.postos, obtidoEm: guardado.ts, stale: true };
    }
    return { postos: [], obtidoEm: null, stale: true };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(
      `${urlBase()}?idsTiposComb=${FUELS}&idDistrito=${id}&qtdPorPagina=99999&pagina=1`,
      { signal: ctrl.signal, headers: HEADERS }
    );
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.includes("json")) return recorrerACache();
    const json = await r.json();
    const postos = (json?.resultado || []).map(p => ({ ...p, __distrito: NOME_DISTRITO.get(id) || "" }));

    /*
     * Resposta boa e vazia NÃO é falha — um distrito pode simplesmente não
     * ter postos comunicados. Confundir as duas coisas fazia aparecer o
     * aviso "a DGEG não respondeu" em páginas onde ela respondeu muito bem.
     *
     * A ressalva: se ANTES havia postos e agora vêm zero, isso cheira a
     * soluço da origem, não a distrito que se esvaziou. Aí fica-se com os
     * dados que temos, marcados como não-frescos, em vez de apagar tudo.
     */
    if (!postos.length && guardado?.postos.length) return recorrerACache();

    cache.set(id, { postos, ts: agora });
    return { postos, obtidoEm: agora, stale: false };
  } catch {
    return recorrerACache();
  } finally {
    clearTimeout(timer);
  }
}

/*
 * A DGEG carimba cada preço com a data em que o posto o comunicou, mas o
 * nome do campo varia conforme o endpoint. Tentamos os que conhecemos e,
 * se nenhum servir, ficamos sem data do preço — e a página passa a mostrar
 * quando NÓS consultámos, que é a única coisa que aí sabemos ao certo.
 * Nunca se inventa uma data.
 */
const CAMPOS_DATA = ["DataPreco", "DataAtualizacao", "Data", "DataComunicacao"];

/*
 * As datas da DGEG são horas de LISBOA, sem fuso escrito.
 *
 * "2026-09-21T17:40:00" não tem Z nem +01:00, e o JavaScript lê uma
 * string dessas como hora local do processo. Na Vercel o processo corre
 * em UTC, por isso 17:40 de Lisboa entrava como 17:40 UTC — uma hora no
 * futuro no Verão. Via-se na resposta da API: `atualizadoEm 16:44` e
 * `dataPreco 17:40`, preços com data posterior ao momento em que foram
 * buscados. Também desalinhava o cálculo de "há quantas horas".
 *
 * Portugal continental muda de hora duas vezes por ano, por isso o
 * desvio não é fixo: pergunta-se ao Intl qual era o desvio de Lisboa
 * NAQUELE instante, em vez de assumir +1.
 */
function desvioDeLisboa(ms) {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms));
  const v = {};
  for (const p of partes) if (p.type !== "literal") v[p.type] = p.value;
  // O Intl devolve 24 para a meia-noite em en-GB; Date.UTC quer 0.
  const hora = v.hour === "24" ? 0 : Number(v.hour);
  const comoSeFosseUTC = Date.UTC(+v.year, +v.month - 1, +v.day, hora, +v.minute, +v.second);
  return comoSeFosseUTC - ms;
}

function lisboaParaInstante(iso) {
  const ingenuo = Date.parse(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(ingenuo)) return NaN;
  // Duas passagens: a primeira estima o desvio, a segunda confirma-o já
  // com o instante quase certo (importa nos dias em que a hora muda).
  let t = ingenuo - desvioDeLisboa(ingenuo);
  t = ingenuo - desvioDeLisboa(t);
  return t;
}

function dataDoPreco(p) {
  for (const campo of CAMPOS_DATA) {
    const bruto = p[campo];
    if (!bruto) continue;
    const texto = String(bruto).trim();
    // Pode vir "2026-09-05" ou "05-09-2026" — só aceitamos o que dá data válida.
    const iso = /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(texto)
      ? texto.replace(/[-/]/g, "-").split("-").reverse().join("-")
      : texto;

    // Se já trouxer fuso (Z ou ±HH:MM), respeita-se o que lá está.
    const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
    const ms = temFuso ? Date.parse(iso) : lisboaParaInstante(iso);
    if (!Number.isNaN(ms) && ms > 0) return ms;
  }
  return null;
}

/* Normaliza um posto cru da DGEG para a forma que a app usa. */
export function normalizarPosto(p) {
  const marca = (p.Marca || "").trim();
  const lat = parseFloat(p.Latitude  || p.Lat || 0) || null;
  const lon = parseFloat(p.Longitude || p.Lon || 0) || null;
  return {
    id: p.Id,
    nome: p.Nome || marca,
    marca,
    municipio: (p.Municipio || "").trim(),
    distrito: p.__distrito || "",
    tipoLabel: mapTipo(p.Combustivel || p.TipoCombustivel || ""),
    preco: parseFloat((p.Preco || "0").toString().replace(",", ".")),
    dataPreco: dataDoPreco(p),
    lat,
    lon,
  };
}

export function postoUtilizavel(p) {
  return Boolean(p.tipoLabel) && p.preco > 0 && !MARCAS_SKIP.includes(p.marca.toLowerCase());
}

/* Distritos a consultar para um ponto — os que podem ter postos dentro do raio. */
export function distritosPerto(lat, lon, raioKm) {
  const perto = DISTRITOS
    .map(d => ({ id: d.id, dist: haversine(lat, lon, d.lat, d.lon) }))
    .filter(d => d.dist < raioKm + 80)
    .sort((a, b) => a.dist - b.dist)
    .map(d => d.id);
  return perto.length ? perto : [11];
}

/*
 * Junta vários distritos e diz a verdade sobre a idade do conjunto: o
 * obtidoEm é o do lote MAIS VELHO, não o do mais recente. Se um distrito
 * está a servir cache de há 4h, a página não pode dizer "agora mesmo" só
 * porque os outros 17 vieram frescos.
 */
export async function juntarDistritos(ids, opcoes = {}) {
  const lotes = await Promise.all(ids.map(id => postosDoDistrito(id, opcoes)));
  const comDados = lotes.filter(l => l.postos.length);
  return {
    postos: lotes.flatMap(l => l.postos),
    obtidoEm: comDados.length ? Math.min(...comDados.map(l => l.obtidoEm)) : null,
    /*
     * Só conta como não-fresco o que TROUXE dados de cache. Um distrito que
     * falhou por completo não traz preços velhos — traz ausência, e isso
     * já se vê por o concelho não ter página. Marcar o país inteiro como
     * suspeito porque um distrito distante teve um soluço era assustar
     * quem está a ver preços perfeitamente frescos do seu.
     */
    stale: comDados.some(l => l.stale),
  };
}

export async function todosOsPostos(opcoes = {}) {
  return juntarDistritos(DISTRITOS.map(d => d.id), opcoes);
}

/*
 * Mínimo (e média) por marca e tipo de combustível.
 *
 * Vivia dentro do handler de /api/combustiveis, e a página pública de SEO
 * chegava-lhe fazendo fetch HTTP ao seu próprio site — ver a explicação em
 * pages/combustiveis/index.js. Agora é uma função, e quem precisa chama-a.
 *
 * Recebe postos JÁ normalizados (normalizarPosto + postoUtilizavel).
 */
export function minimoPorMarca(postos) {
  const mapa = {};
  for (const n of postos) {
    const chave = `${n.marca}__${n.tipoLabel}`;
    if (!mapa[chave]) mapa[chave] = { marca: n.marca, tipo: n.tipoLabel, precos: [], totalPostos: 0 };
    mapa[chave].precos.push(n.preco);
    mapa[chave].totalPostos++;
  }
  return Object.values(mapa)
    .map(item => ({
      posto: item.marca,
      tipo: item.tipo,
      preco: parseFloat(Math.min(...item.precos).toFixed(3)),
      precoMedio: parseFloat((item.precos.reduce((a, b) => a + b, 0) / item.precos.length).toFixed(3)),
      totalPostos: item.totalPostos,
    }))
    .sort((a, b) => a.preco - b.preco);
}

/* ── Preços absurdos ────────────────────────────────────────────────
 *
 * A DGEG publica o que cada posto comunica, e de vez em quando alguém
 * engana-se. Em produção apareceu gasóleo a €1,343 quando a mediana
 * nacional andava nos €2,01 — 33% abaixo. Não é uma pechincha, é um
 * erro de digitação, e no desenho novo passa a ser a manchete da
 * página: fica em primeiro, marcado "melhor", e estica a escala da
 * barra de toda a lista.
 *
 * O limiar não é escolhido a olho — e já foi corrigido uma vez, com
 * dados de produção a corrigir-me.
 *
 * À primeira pus 80%, medido numa amostra LOCAL (300 postos à volta de
 * Lisboa), onde os mínimos legítimos caíam entre 91% e 99% da mediana.
 * Mas a mediana muda com a amostra: no conjunto NACIONAL o gasóleo
 * aditivado tem mediana mais alta, e a 80% o filtro começou a comer
 * postos que provavelmente são reais. Dos logs de produção:
 *
 *     REMOVIDO  €1,875 (79% da mediana)  GALP Arruda dos Pisões
 *     REMOVIDO  €1,799 (76% da mediana)  ALFABRENT Amareleja
 *
 * Postos pequenos, preços plausíveis. Já os erros a sério agrupam-se
 * muito mais abaixo:
 *
 *     €0,519 (33%)   €1,25 (53%)   €1,289 (55%)   €1,343 (61%)   €1,374 (62%)
 *
 * Entre 62% e 76% há um vazio. 70% cai lá dentro: apanha tudo o que é
 * impossível e não toca em nada que seja apenas barato. Esconder um
 * posto genuinamente barato é o pior erro que esta app pode cometer —
 * é literalmente aquilo que ela existe para encontrar — por isso, na
 * dúvida, o preço fica.
 *
 * O teto (130%) é para o engano simétrico. Um preço alto a mais nunca
 * ganha nada, mas estica o extremo de cima da escala da barra.
 */
export const LIMIAR_BAIXO = 0.70;
export const LIMIAR_ALTO  = 1.30;

/* Abaixo disto a mediana não é de confiança e não se filtra nada:
   mais vale mostrar um preço duvidoso do que apagar dados bons com
   base em meia dúzia de amostras. */
const MIN_AMOSTRA = 8;

function mediana(valores) {
  const v = valores.slice().sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/*
 * Recebe postos já normalizados. Devolve os que ficam e os que saíram,
 * para quem chamar poder registar o que foi descartado — um filtro que
 * apaga dados em silêncio é tão mau como os dados errados.
 */
export function semPrecosAbsurdos(postos) {
  const porTipo = new Map();
  for (const p of postos) {
    if (!porTipo.has(p.tipoLabel)) porTipo.set(p.tipoLabel, []);
    porTipo.get(p.tipoLabel).push(p.preco);
  }

  const limites = new Map();
  for (const [tipo, precos] of porTipo) {
    if (precos.length < MIN_AMOSTRA) continue;
    const med = mediana(precos);
    limites.set(tipo, { min: med * LIMIAR_BAIXO, max: med * LIMIAR_ALTO, med });
  }

  const ficam = [];
  const removidos = [];
  for (const p of postos) {
    const lim = limites.get(p.tipoLabel);
    if (lim && (p.preco < lim.min || p.preco > lim.max)) removidos.push({ ...p, medianaTipo: lim.med });
    else ficam.push(p);
  }
  return { postos: ficam, removidos };
}
