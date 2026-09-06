// Preços DGEG — postos próximos com filtro por localização.
// A conversa com a DGEG (fetch, cache, mapeamento de tipos) vive em
// lib/dgeg.js, porque as páginas públicas por concelho usam o mesmo.
import {
  DISTRITOS, haversine, postosDoDistrito, normalizarPosto,
  postoUtilizavel, distritosPerto,
} from "../../lib/dgeg";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

  const { lat, lon, raio = 30, tipo } = req.query;

  try {
    const userLat = lat ? parseFloat(lat) : null;
    const userLon = lon ? parseFloat(lon) : null;
    const raioKm  = parseFloat(raio);

    const ids = (userLat && userLon)
      ? distritosPerto(userLat, userLon, raioKm)
      : DISTRITOS.map(d => d.id);

    const lotes  = await Promise.all(ids.map(id => postosDoDistrito(id)));
    const postos = lotes.flat();
    if (!postos.length) throw new Error("Sem resultados da DGEG");

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

      const tipos = [...new Set(estacoes.map(e => e.tipoLabel))].sort();

      return res.status(200).json({
        success: true,
        modo: "local",
        estacoes,
        tipos,
        total: estacoes.length,
        atualizadoEm: new Date().toISOString(),
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
      atualizadoEm: new Date().toISOString(),
      fonte: "DGEG — Direção-Geral de Energia e Geologia",
    });

  } catch (error) {
    // Falha da DGEG: NUNCA cachear a falha (senão fica presa 30 min na CDN).
    res.setHeader("Cache-Control", "no-store");
    // Continua a responder 200 com listas vazias — quem chama distingue pelo
    // `success`, e um 502 partia os clientes que só olham para o corpo.
    // A rede de segurança do "último resultado bom" está agora em lib/dgeg.js,
    // por distrito: se a DGEG falhar, postosDoDistrito devolve a cache anterior.
    return res.status(200).json({
      success: false,
      dados: [], estacoes: [],
      atualizadoEm: new Date().toISOString(),
      erro: error.message,
    });
  }
}
