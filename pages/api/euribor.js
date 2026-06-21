export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const indexantes = {
    "3M": "EURIBOR3MD_",
    "6M": "EURIBOR6MD_",
    "12M": "EURIBOR1YD_",
  };

  const resultados = {};

  for (const [prazo, codigo] of Object.entries(indexantes)) {
    try {
      const url = `https://data-api.ecb.europa.eu/service/data/FM/B.EU.EUR.RT.MM.${codigo}.HSTA?lastNObservations=1&format=jsondata`;
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const series = data.dataSets?.[0]?.series?.["0:0:0:0:0:0:0"];
      const obs = series?.observations;
      if (!obs) continue;
      const keys = Object.keys(obs).sort((a, b) => Number(a) - Number(b));
      const lastKey = keys[keys.length - 1];
      const valor = obs[lastKey]?.[0];
      const periodos = data.structure?.dimensions?.observation?.[0]?.values;
      const periodo = periodos?.[Number(lastKey)]?.id;
      if (valor != null) resultados[prazo] = { valor: parseFloat(valor.toFixed(3)), periodo };
    } catch {}
  }

  if (Object.keys(resultados).length === 0) {
    return res.status(503).json({ erro: "Não foi possível obter dados do Euribor." });
  }

  return res.status(200).json({ euribor: resultados, atualizadoEm: new Date().toISOString() });
}
