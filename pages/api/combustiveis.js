// Preços DGEG — postos próximos com filtro por localização.
// A conversa com a DGEG (fetch, cache, mapeamento de tipos) vive em
// lib/dgeg.js, porque as páginas públicas por concelho usam o mesmo.
import {
  DISTRITOS, haversine, juntarDistritos, normalizarPosto,
  postoUtilizavel, distritosPerto,
} from "../../lib/dgeg";
import { excedeuLimite } from "../../lib/protecao-api";

/* Teto do que uma resposta pode trazer. O modo local devolvia todos os
   postos do raio — com um raio grande, megabytes por pedido. A app mostra
   uma lista, não o país inteiro. */
const MAX_ESTACOES = 300;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

  /*
   * Limite generoso de propósito (60/min por IP).
   *
   * Esta rota, ao contrário da /api/ev, também é chamada de dentro — as
   * páginas de SEO dos concelhos fazem fetch a ela em getServerSideProps.
   * Essas chamadas partem todas do mesmo IP de saída do Vercel, por isso um
   * limite apertado travava o próprio site. Com a página em cache 30 min na
   * CDN, o tráfego real que chega aqui é uma fracção, e 60/min só é atingido
   * por quem estiver mesmo a martelar.
   */
  if (excedeuLimite(req, "combustiveis", 60)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  const { lat, lon, raio = 30, tipo } = req.query;

  try {
    const userLat = lat ? parseFloat(lat) : null;
    const userLon = lon ? parseFloat(lon) : null;
    // O raio vinha em cru do cliente. Sem teto, um valor absurdo obrigava a
    // consultar os 18 distritos e a devolver o país inteiro.
    const raioKm  = Math.min(Math.max(parseFloat(raio) || 30, 1), 100);

    const ids = (userLat && userLon)
      ? distritosPerto(userLat, userLon, raioKm)
      : DISTRITOS.map(d => d.id);

    const lote   = await juntarDistritos(ids);
    const postos = lote.postos;
    if (!postos.length) throw new Error("Sem resultados da DGEG");

    /*
     * A data que sai daqui é a dos DADOS, não a do pedido. Estava a ser
     * new Date() em cada resposta, o que fazia qualquer consumidor
     * (páginas incluídas) acreditar que os preços eram sempre de agora.
     */
    const datas = postos.map(p => normalizarPosto(p).dataPreco).filter(Boolean);
    const frescura = {
      atualizadoEm: new Date(lote.obtidoEm ?? Date.now()).toISOString(),
      dataPreco: datas.length ? new Date(Math.max(...datas)).toISOString() : null,
      stale: lote.stale,
    };

    if (userLat && userLon) {
      // ── Modo local: postos individuais ordenados por preço ──
      const estacoes = postos
        .map(p => {
          const n = normalizarPosto(p);
          const distancia = (n.lat && n.lon)
            ? parseFloat(haversine(userLat, userLon, n.lat, n.lon).toFixed(1))
            : null;
          return { ...n, distancia };
        })
        .filter(p =>
          postoUtilizavel(p) &&
          (!p.distancia || p.distancia <= raioKm) &&
          (!tipo || p.tipoLabel === tipo)
        )
        .sort((a, b) => a.preco - b.preco);

      // Os tipos saem da lista COMPLETA, antes do corte — senão um corte
      // podia esconder um tipo de combustível dos separadores.
      const tipos = [...new Set(estacoes.map(e => e.tipoLabel))].sort();
      const maisBaratas = estacoes.slice(0, MAX_ESTACOES);

      return res.status(200).json({
        success: true,
        modo: "local",
        estacoes: maisBaratas,
        tipos,
        total: maisBaratas.length,
        // Quantas ficaram de fora do corte, para quem chama saber que a
        // lista não é exaustiva em vez de o descobrir por acidente.
        totalEncontradas: estacoes.length,
        ...frescura,
        fonte: "DGEG — Direção-Geral de Energia e Geologia",
      });
    }

    // ── Modo nacional: mínimo por marca ──
    const mapa = {};
    postos.forEach(p => {
      const n = normalizarPosto(p);
      if (!postoUtilizavel(n)) return;
      const chave = `${n.marca}__${n.tipoLabel}`;
      if (!mapa[chave]) mapa[chave] = { marca: n.marca, tipo: n.tipoLabel, precos: [], totalPostos: 0 };
      mapa[chave].precos.push(n.preco);
      mapa[chave].totalPostos++;
    });

    const dados = Object.values(mapa)
      .map(item => ({
        posto: item.marca, tipo: item.tipo,
        preco: parseFloat(Math.min(...item.precos).toFixed(3)),
        precoMedio: parseFloat((item.precos.reduce((a, b) => a + b, 0) / item.precos.length).toFixed(3)),
        totalPostos: item.totalPostos,
      }))
      .sort((a, b) => a.preco - b.preco);

    if (!dados.length) throw new Error("Sem dados após filtragem");

    return res.status(200).json({
      success: true,
      modo: "nacional",
      dados,
      total: dados.length,
      ...frescura,
      fonte: "DGEG — Direção-Geral de Energia e Geologia",
    });

  } catch (error) {
    // Falha da DGEG: NUNCA cachear a falha (senão fica presa 30 min na CDN).
    res.setHeader("Cache-Control", "no-store");
    // Continua a responder 200 com listas vazias — quem chama distingue pelo
    // `success`, e um 502 partia os clientes que só olham para o corpo.
    // A rede de segurança do "último resultado bom" está agora em lib/dgeg.js,
    // por distrito, e limitada a IDADE_MAXIMA_CACHE_LIVE (curta, de propósito
    // — este ecrã não mostra idade nenhuma ao utilizador): passado isso
    // preferimos não ter preços a servir preços velhos sem ninguém saber.
    return res.status(200).json({
      success: false,
      dados: [], estacoes: [],
      // Sem preços não há data de preços. Carimbar "agora" aqui era o mesmo
      // erro do resto: uma data que não descreve dado nenhum.
      atualizadoEm: null,
      dataPreco: null,
      stale: true,
      erro: error.message,
    });
  }
}
