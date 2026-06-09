export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate");

  const { lat = 38.7169, lon = -9.1395, raio = 10 } = req.query;
  const TOMTOM = process.env.TOMTOM_API_KEY;
  const raioMetros = Math.round(parseFloat(raio) * 1000);

  // 1ª fonte: TomTom — dados em tempo real (~3 min), cobertura PT excelente
  if (TOMTOM) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10000);

      const searchUrl =
        `https://api.tomtom.com/search/2/nearbySearch/.json` +
        `?key=${TOMTOM}&lat=${lat}&lon=${lon}&radius=${raioMetros}` +
        `&categorySet=7309&limit=100&countrySet=PT`;

      const r = await fetch(searchUrl, {
        signal: ctrl.signal,
        headers: { "Accept": "application/json" },
      });
      if (!r.ok) throw new Error(`TomTom search ${r.status}`);

      const data = await r.json();
      const results = data.results || [];
      if (!results.length) throw new Error("TomTom sem resultados");

      // Buscar disponibilidade em paralelo para postos que a suportam
      const comAvail = results.filter(p => p.dataSources?.chargingAvailability?.id);
      const availMap = {};
      await Promise.all(
        comAvail.slice(0, 60).map(async p => {
          const id = p.dataSources.chargingAvailability.id;
          try {
            const ctrl2 = new AbortController();
            setTimeout(() => ctrl2.abort(), 5000);
            const ar = await fetch(
              `https://api.tomtom.com/search/2/chargingAvailability.json?key=${TOMTOM}&chargingAvailability=${id}`,
              { signal: ctrl2.signal, headers: { "Accept": "application/json" } }
            );
            if (ar.ok) availMap[id] = await ar.json();
          } catch {}
        })
      );

      const resultado = results.map(p => {
        const avId  = p.dataSources?.chargingAvailability?.id;
        const av    = avId ? availMap[avId] : null;
        const conns = av?.connectors || [];
        const maxKW = conns.reduce((m, c) => Math.max(m, c.ratedPowerKW || 0), 0);
        const tipos = [...new Set(conns.map(c => c.type?.localizedValue || c.type?.value).filter(Boolean))];
        const livres = conns.reduce((s, c) => s + (c.availability?.available ?? c.freeSetCount ?? 0), 0);
        const slots  = conns.reduce((s, c) => s + (c.availability?.total   ?? c.totalSetCount ?? 0), 0);
        // Timestamp da última atualização da disponibilidade
        const ultimaAtualizacao = av?.updatedAt || av?.lastUpdatedTimestamp || av?.timestamp || null;

        return {
          id:        p.id || String(Math.random()),
          nome:      p.poi?.name || "Posto EV",
          morada:    p.address?.streetName ? `${p.address.streetName}${p.address.streetNumber ? " " + p.address.streetNumber : ""}` : (p.address?.freeformAddress || ""),
          cidade:    p.address?.municipality || p.address?.localName || "",
          lat:       p.position?.lat || 0,
          lon:       p.position?.lon || 0,
          operador:  p.poi?.brands?.[0]?.name || p.poi?.classifications?.[0]?.name || "Desconhecido",
          potencia:  maxKW ? `${maxKW} kW` : "22 kW",
          potenciaNum: maxKW,
          tipo:      tipos.join(" / ") || "Tipo 2",
          estado:    mapEstadoTomTom(av, livres, slots),
          slots:     slots || 1,
          livres,
          temTempoReal: !!av,
          ultimaAtualizacao,
          distancia: p.dist != null ? parseFloat((p.dist / 1000).toFixed(1)) : null,
        };
      });

      return res.status(200).json({
        success: true,
        postos: resultado,
        total: resultado.length,
        atualizadoEm: new Date().toISOString(),
        fonte: "TomTom EV",
      });

    } catch (ttErr) {
      // cai para fallback
    }
  }

  // 2ª fonte: Open Charge Map
  try {
    const OCM_KEY = process.env.OCM_API_KEY || "";
    const keyParam = OCM_KEY ? `&key=${OCM_KEY}` : "";
    const url =
      `https://api.openchargemap.io/v3/poi/?output=json&countrycode=PT` +
      `&latitude=${lat}&longitude=${lon}&distance=${raio}&distanceunit=km` +
      `&maxresults=200&compact=true&verbose=false${keyParam}`;

    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" } });
    if (!r.ok) throw new Error(`OCM ${r.status}`);

    const data = await r.json();
    if (!Array.isArray(data) || !data.length) throw new Error("OCM sem resultados");

    const resultado = data.map(p => {
      const conns = p.Connections || [];
      const maxKW = conns.reduce((m, c) => Math.max(m, c.PowerKW || 0), 0);
      const tipos = [...new Set(conns.map(c => c.ConnectionType?.Title).filter(Boolean))];
      return {
        id:        String(p.ID || Math.random()),
        nome:      p.AddressInfo?.Title || "Posto EV",
        morada:    p.AddressInfo?.AddressLine1 || "",
        cidade:    p.AddressInfo?.Town || "",
        lat:       p.AddressInfo?.Latitude  || 0,
        lon:       p.AddressInfo?.Longitude || 0,
        operador:  p.OperatorInfo?.Title || "Desconhecido",
        potencia:  maxKW ? `${maxKW} kW` : "22 kW",
        tipo:      tipos.join(" / ") || "Tipo 2",
        estado:    mapEstadoOCM(p.StatusType),
        slots:     p.NumberOfPoints || conns.length || 1,
        livres:    p.StatusType?.IsOperational ? (p.NumberOfPoints || conns.length || 1) : 0,
        distancia: p.AddressInfo?.Distance != null ? parseFloat(p.AddressInfo.Distance).toFixed(1) : null,
      };
    });

    return res.status(200).json({
      success: true, postos: resultado, total: resultado.length,
      atualizadoEm: new Date().toISOString(),
      fonte: "Open Charge Map",
    });

  } catch {
    return res.status(200).json({
      success: false, postos: [],
      atualizadoEm: new Date().toISOString(),
      erro: "Serviços EV temporariamente indisponíveis",
    });
  }
}

function mapEstadoTomTom(av, livres, slots) {
  if (!av) return "disponível";
  if (livres > 0) return "disponível";
  if (slots > 0 && livres === 0) return "ocupado";
  return "manutenção";
}

function mapEstadoOCM(statusType) {
  if (!statusType) return "disponível";
  if (statusType.IsOperational === true)  return "disponível";
  if (statusType.IsOperational === false) return "manutenção";
  const t = (statusType.Title || "").toLowerCase();
  if (t.includes("operational") || t.includes("available")) return "disponível";
  if (t.includes("occupied")    || t.includes("charging"))  return "ocupado";
  return "manutenção";
}
