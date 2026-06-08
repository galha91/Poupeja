// Preços DGEG — postos próximos com filtro por localização
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");

  const { lat, lon, raio = 30, tipo } = req.query;
  const BASE    = "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos";
  const FUELS   = "3400,3205,3405,3201,2105,2101,1120";
  const HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; PoupeJa/1.0)",
    "Referer": "https://precoscombustiveis.dgeg.gov.pt/",
    "Origin": "https://precoscombustiveis.dgeg.gov.pt",
  };

  function mapTipo(raw) {
    if (!raw) return null;
    const n = raw.toLowerCase();
    if (n.includes("gpl"))  return "GPL Auto";
    if (n.includes("gnv"))  return "GNV";
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

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371, toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Distritos mais próximos baseados na localização
  const DISTRITO_CENTROS = [
    { id:1,  lat:40.64, lon:-8.65  }, { id:2,  lat:37.96, lon:-7.86  },
    { id:3,  lat:41.55, lon:-8.43  }, { id:4,  lat:41.81, lon:-6.76  },
    { id:5,  lat:39.82, lon:-7.49  }, { id:6,  lat:40.21, lon:-8.43  },
    { id:7,  lat:38.57, lon:-7.91  }, { id:8,  lat:37.02, lon:-7.94  },
    { id:9,  lat:40.54, lon:-7.27  }, { id:10, lat:39.74, lon:-8.81  },
    { id:11, lat:38.72, lon:-9.14  }, { id:12, lat:39.30, lon:-7.44  },
    { id:13, lat:41.15, lon:-8.61  }, { id:14, lat:39.24, lon:-8.69  },
    { id:15, lat:38.52, lon:-8.89  }, { id:16, lat:41.69, lon:-8.84  },
    { id:17, lat:41.30, lon:-7.74  }, { id:18, lat:40.66, lon:-7.91  },
  ];

  async function fetchDistrito(id) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch(
        `${BASE}?idsTiposComb=${FUELS}&idDistrito=${id}&qtdPorPagina=99999&pagina=1`,
        { signal: ctrl.signal, headers: HEADERS }
      );
      clearTimeout(timer);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.includes("json")) return [];
      const json = await r.json();
      return json?.resultado || [];
    } catch { return []; }
    finally   { clearTimeout(timer); }
  }

  try {
    const userLat = lat ? parseFloat(lat) : null;
    const userLon = lon ? parseFloat(lon) : null;
    const raioKm  = parseFloat(raio);

    // Seleciona distritos a pesquisar
    let distritos;
    if (userLat && userLon) {
      distritos = DISTRITO_CENTROS
        .map(d => ({ ...d, dist: haversine(userLat, userLon, d.lat, d.lon) }))
        .filter(d => d.dist < raioKm + 80) // buffer generoso
        .sort((a, b) => a.dist - b.dist)
        .map(d => d.id);
      if (!distritos.length) distritos = [11]; // fallback Lisboa
    } else {
      distritos = DISTRITO_CENTROS.map(d => d.id); // todos
    }

    const lotes  = await Promise.all(distritos.map(fetchDistrito));
    const postos = lotes.flat();
    if (!postos.length) throw new Error("Sem resultados da DGEG");

    const MARCAS_SKIP = ["genérico", "generica", "generico", ""];

    if (userLat && userLon) {
      // ── Modo local: postos individuais ordenados por preço ──
      const estacoes = postos
        .map(p => {
          const marca    = (p.Marca || "").trim();
          const tipoLabel = mapTipo(p.Combustivel || p.TipoCombustivel || "");
          const preco    = parseFloat((p.Preco || "0").toString().replace(",", "."));
          const pLat     = parseFloat(p.Latitude  || p.Lat  || 0);
          const pLon     = parseFloat(p.Longitude || p.Lon  || 0);
          const distancia = (pLat && pLon)
            ? parseFloat(haversine(userLat, userLon, pLat, pLon).toFixed(1))
            : null;
          return { id: p.Id, nome: p.Nome || marca, marca, municipio: p.Municipio || "", tipoLabel, preco, lat: pLat || null, lon: pLon || null, distancia };
        })
        .filter(p =>
          p.tipoLabel &&
          p.preco > 0 &&
          !MARCAS_SKIP.includes(p.marca.toLowerCase()) &&
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

    } else {
      // ── Modo nacional: mínimo por marca ──
      const mapa = {};
      postos.forEach(p => {
        const marca = (p.Marca || "").trim();
        if (!marca || MARCAS_SKIP.includes(marca.toLowerCase())) return;
        const tipoLabel = mapTipo(p.Combustivel || "");
        if (!tipoLabel) return;
        const preco = parseFloat((p.Preco || "0").toString().replace(",", "."));
        if (!preco) return;
        const chave = `${marca}__${tipoLabel}`;
        if (!mapa[chave]) mapa[chave] = { marca, tipo: tipoLabel, precos: [], totalPostos: 0 };
        mapa[chave].precos.push(preco);
        mapa[chave].totalPostos++;
      });

      const dados = Object.values(mapa)
        .map(item => ({
          posto: item.marca, tipo: item.tipo,
          preco: parseFloat(Math.min(...item.precos).toFixed(3)),
          precoMedio: parseFloat((item.precos.reduce((a,b)=>a+b,0)/item.precos.length).toFixed(3)),
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
    }

  } catch (error) {
    return res.status(200).json({
      success: false,
      dados: [], estacoes: [],
      atualizadoEm: new Date().toISOString(),
      erro: error.message,
    });
  }
}
