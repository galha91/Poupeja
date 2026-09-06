/*
 * Concelhos com página própria em /combustiveis/[cidade].
 *
 * A lista NÃO é escrita à mão: sai dos próprios dados da DGEG. Cada
 * concelho existe porque tem postos com preço, e o seu ponto central é o
 * centroide dos postos que lá estão — nenhuma coordenada é inventada.
 * Se a DGEG deixar de cobrir um concelho, a página deixa de existir e sai
 * do sitemap sozinha; se passar a cobrir outro, aparece sem eu tocar em nada.
 *
 * Porquê um mínimo de postos: uma página com um posto só não responde a
 * "gasóleo mais barato em X" (não há com que comparar) e seriam centenas
 * de páginas quase iguais — exatamente o que o Google trata como lixo.
 * Abaixo do mínimo, o concelho não ganha página; os postos continuam a
 * aparecer nas páginas dos concelhos vizinhos, por raio.
 */
import { todosOsPostos, normalizarPosto, postoUtilizavel, haversine } from "./dgeg";
import { lerSnapshot } from "./precosSnapshot";
import { slugify } from "./seo-slugs";

export const MIN_POSTOS = 3;
export const TIPOS_DESTAQUE = ["Gasóleo", "Gasolina 95", "GPL Auto"];

const CACHE_TTL = 30 * 60 * 1000;
let cache = null; // { lista, medias, frescura, ts }

/*
 * Os 12 slugs que já estavam publicados continuam a responder no mesmo URL:
 * são todos nomes de concelho, por isso batem certo com o que a DGEG devolve.
 * A exceção é o Funchal: só consultamos os 18 distritos do continente (ver
 * DISTRITOS em lib/dgeg.js), por isso nunca chegam postos da Madeira e a
 * página estava permanentemente vazia — mostrava "dados não disponíveis".
 * Passa a dar 404, que é o sinal honesto. Se um dia acrescentarmos o id do
 * distrito da Madeira, o Funchal volta a ter página sem mais nenhuma mudança.
 */

function maisBaratoPorTipo(postos) {
  const out = {};
  for (const p of postos) {
    if (!out[p.tipoLabel] || p.preco < out[p.tipoLabel].preco) out[p.tipoLabel] = p;
  }
  return out;
}

/*
 * De onde vêm os preços, por esta ordem:
 *
 *   1. memória desta instância  — rápido, dura 30 min
 *   2. snapshot no Supabase     — o caminho normal; mantido de hora a hora
 *                                 pelo cron, sobrevive a instâncias frias e
 *                                 a a DGEG estar em baixo
 *   3. DGEG ao vivo             — rede de recurso para antes de haver
 *                                 snapshot (primeiro deploy) ou se o
 *                                 Supabase não responder
 *
 * A ordem é esta de propósito: quem serve páginas não deve depender da
 * DGEG estar de pé nesse segundo. Quem fala com a DGEG é o cron.
 */
async function obterPostos() {
  const snapshot = await lerSnapshot().catch(() => null);
  if (snapshot?.postos.length) {
    return {
      postos: snapshot.postos,
      obtidoEm: snapshot.obtidoEm,
      dataPreco: snapshot.dataPreco,
      stale: false, // um snapshot é a fonte normal, não um remendo
      origem: "snapshot",
    };
  }

  const cru = await todosOsPostos();
  const postos = cru.postos.map(normalizarPosto).filter(postoUtilizavel);
  const datas = postos.map(p => p.dataPreco).filter(Boolean);
  return {
    postos,
    obtidoEm: cru.obtidoEm,
    dataPreco: datas.length ? Math.max(...datas) : null,
    stale: cru.stale,
    origem: "dgeg",
  };
}

async function carregar() {
  const agora = Date.now();
  if (cache && agora - cache.ts < CACHE_TTL) return cache;

  const fonte = await obterPostos();
  const postos = fonte.postos;

  /*
   * A frescura viaja com os dados até à página. Antes, a página carimbava
   * new Date() no render — ou seja, jurava que os preços eram de agora,
   * sempre, mesmo a servir cache de horas antes.
   *
   *   obtidoEm  — quando estes preços vieram mesmo da DGEG (sabemos ao certo)
   *   dataPreco — a que dia a DGEG diz que os preços se referem (se disser)
   *   stale     — vieram de um recurso, não do caminho normal
   */
  const frescura = {
    obtidoEm: fonte.obtidoEm,
    dataPreco: fonte.dataPreco,
    stale: fonte.stale,
    origem: fonte.origem,
  };

  // Média nacional por tipo — serve para cada página dizer se o concelho
  // está acima ou abaixo do país, que é informação diferente em cada uma.
  const soma = {};
  for (const p of postos) {
    (soma[p.tipoLabel] ||= { total: 0, n: 0 });
    soma[p.tipoLabel].total += p.preco;
    soma[p.tipoLabel].n++;
  }
  const medias = {};
  for (const [tipo, s] of Object.entries(soma)) medias[tipo] = s.total / s.n;

  const porMunicipio = new Map();
  for (const p of postos) {
    if (!p.municipio) continue; // sem concelho na origem não inventamos um
    const slug = slugify(p.municipio);
    if (!slug) continue;
    if (!porMunicipio.has(slug)) {
      porMunicipio.set(slug, { slug, nome: p.municipio, distrito: p.distrito, postos: [] });
    }
    porMunicipio.get(slug).postos.push(p);
  }

  const lista = [];
  for (const m of porMunicipio.values()) {
    // Um posto vende vários combustíveis: cada um vem como linha separada.
    // O que conta para o limiar são POSTOS distintos, não linhas de preço.
    const distintos = new Set(m.postos.map(p => p.id ?? `${p.nome}|${p.lat}|${p.lon}`));
    if (distintos.size < MIN_POSTOS) continue;

    const comGeo = m.postos.filter(p => p.lat && p.lon);
    if (!comGeo.length) continue; // sem coordenadas não há raio possível

    lista.push({
      slug: m.slug,
      nome: m.nome,
      distrito: m.distrito,
      lat: comGeo.reduce((s, p) => s + p.lat, 0) / comGeo.length,
      lon: comGeo.reduce((s, p) => s + p.lon, 0) / comGeo.length,
      nPostos: distintos.size,
      baratos: maisBaratoPorTipo(m.postos),
    });
  }

  lista.sort((a, b) => b.nPostos - a.nPostos || a.nome.localeCompare(b.nome, "pt"));
  cache = { lista, medias, frescura, ts: agora };
  return cache;
}

export async function listarMunicipios() {
  return (await carregar()).lista;
}

export async function frescuraDosPrecos() {
  return (await carregar()).frescura;
}

export async function encontrarMunicipio(slug) {
  const { lista } = await carregar();
  return lista.find(m => m.slug === slug) || null;
}

/* Concelhos mais próximos, para interligar páginas vizinhas. */
export function vizinhos(municipio, lista, n = 8) {
  return lista
    .filter(m => m.slug !== municipio.slug)
    .map(m => ({ ...m, dist: haversine(municipio.lat, municipio.lon, m.lat, m.lon) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/*
 * Tudo o que a página de um concelho precisa, já calculado. Fica aqui e
 * não na página para ser testável sem montar o React.
 */
export async function dadosMunicipio(slug, { raioKm = 20 } = {}) {
  const { lista, medias, frescura } = await carregar();
  const municipio = lista.find(m => m.slug === slug);
  if (!municipio) return null;

  // A MESMA fonte que o carregar() usou — ir outra vez à DGEG aqui punha a
  // página a misturar dois instantes diferentes, e a dizer a data de um deles.
  const postos = (await obterPostos()).postos;
  const noConcelho = postos
    .filter(p => slugify(p.municipio) === slug)
    .sort((a, b) => a.preco - b.preco);

  const proximos = postos
    .filter(p => slugify(p.municipio) !== slug && p.lat && p.lon)
    .map(p => ({ ...p, distancia: parseFloat(haversine(municipio.lat, municipio.lon, p.lat, p.lon).toFixed(1)) }))
    .filter(p => p.distancia <= raioKm)
    .sort((a, b) => a.preco - b.preco);

  const destaques = TIPOS_DESTAQUE
    .map(t => {
      const melhor = municipio.baratos[t];
      if (!melhor) return null;
      // A comparação com o país tem de ser MÉDIA contra MÉDIA. Comparar o
      // posto mais barato do concelho com a média nacional dava sempre
      // "abaixo da média" — verdade sem conteúdo, igual em todas as páginas.
      const doTipo = noConcelho.filter(p => p.tipoLabel === t).map(p => p.preco);
      const mediaConcelho = doTipo.length
        ? doTipo.reduce((s, v) => s + v, 0) / doTipo.length
        : null;
      const mediaPais = medias[t];
      return {
        tipoLabel: t,
        preco: melhor.preco,
        nome: melhor.nome || melhor.marca,
        mediaConcelho,
        // Diferença da média do concelho para a do país, em cêntimos/litro.
        vsPais: (mediaConcelho != null && mediaPais)
          ? Math.round((mediaConcelho - mediaPais) * 100)
          : null,
      };
    })
    .filter(Boolean);

  // Amplitude do gasóleo dentro do concelho: o número mais útil da página,
  // porque é o que a pessoa poupa por ir ao posto certo em vez do errado.
  const gasoleos = noConcelho.filter(p => p.tipoLabel === "Gasóleo").map(p => p.preco);
  const amplitude = gasoleos.length >= 2
    ? {
        min: Math.min(...gasoleos),
        max: Math.max(...gasoleos),
        porDeposito: parseFloat(((Math.max(...gasoleos) - Math.min(...gasoleos)) * 50).toFixed(2)),
      }
    : null;

  return {
    frescura,
    municipio: {
      slug: municipio.slug, nome: municipio.nome,
      distrito: municipio.distrito, nPostos: municipio.nPostos,
    },
    destaques,
    amplitude,
    noConcelho: noConcelho.filter(p => p.tipoLabel === "Gasóleo" || p.tipoLabel === "Gasolina 95").slice(0, 14),
    proximos: proximos.filter(p => p.tipoLabel === "Gasóleo").slice(0, 6),
    vizinhos: vizinhos(municipio, lista).map(v => ({
      slug: v.slug, nome: v.nome,
      dist: Math.round(v.dist),
      gasoleo: v.baratos["Gasóleo"]?.preco ?? null,
    })),
  };
}
