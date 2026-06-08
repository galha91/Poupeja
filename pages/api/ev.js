export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  const { lat = 38.7169, lon = -9.1395, raio = 10 } = req.query;

  // 1ª fonte: Open Charge Map (base de dados global, excelente cobertura PT)
  try {
    const OCM_KEY = process.env.OCM_API_KEY || "";
    const keyParam = OCM_KEY ? `&key=${OCM_KEY}` : "";
    const url =
      `https://api.openchargemap.io/v3/poi/?output=json&countrycode=PT` +
      `&latitude=${lat}&longitude=${lon}` +
      `&distance=${raio}&distanceunit=km` +
      `&maxresults=200&compact=true&verbose=false${keyParam}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" },
    });
    clearTimeout(timer);
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
        distancia: p.AddressInfo?.Distance != null
          ? parseFloat(p.AddressInfo.Distance).toFixed(1)
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      postos: resultado,
      total: resultado.length,
      atualizadoEm: new Date().toISOString(),
      fonte: "Open Charge Map",
    });

  } catch (ocmErr) {
    // 2ª fonte: MOBI.E como fallback
    try {
      const ctrl2 = new AbortController();
      const timer2 = setTimeout(() => ctrl2.abort(), 8000);
      const r2 = await fetch(
        `https://api.mob.ie/api/v1/chargepoints?latitude=${lat}&longitude=${lon}&radius=${raio}`,
        { signal: ctrl2.signal, headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" } }
      );
      clearTimeout(timer2);
      if (!r2.ok) throw new Error(`MOBI.E ${r2.status}`);

      const data2 = await r2.json();
      const postos2 = Array.isArray(data2) ? data2 : (data2?.chargePoints || data2?.data || []);
      if (!postos2.length) throw new Error("MOBI.E sem resultados");

      const resultado2 = postos2.map(p => ({
        id:        p.id || p.chargePointId || String(Math.random()),
        nome:      p.name || p.address || "Posto MOBI.E",
        morada:    p.address || p.street || "",
        cidade:    p.city || p.municipality || "",
        lat:       p.latitude  || p.lat || 0,
        lon:       p.longitude || p.lng || 0,
        operador:  p.operator  || p.operatorName || "MOBI.E",
        potencia:  p.maxPower  ? `${p.maxPower} kW` : (p.power || "22 kW"),
        tipo:      p.connectorTypes?.join(" / ") || p.connectorType || "Tipo 2",
        estado:    mapEstadoMobie(p.status || p.state),
        slots:     p.totalConnectors || p.connectors || 2,
        livres:    p.availableConnectors ?? p.available ?? 0,
        distancia: p.distance ? parseFloat(p.distance).toFixed(1) : null,
      }));

      return res.status(200).json({
        success: true,
        postos: resultado2,
        total: resultado2.length,
        atualizadoEm: new Date().toISOString(),
        fonte: "MOBI.E — Rede Nacional de Mobilidade Elétrica",
      });

    } catch {
      return res.status(200).json({
        success: false,
        postos: [],
        atualizadoEm: new Date().toISOString(),
        erro: "Serviços EV temporariamente indisponíveis",
      });
    }
  }
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

function mapEstadoMobie(status) {
  if (!status) return "disponível";
  const s = status.toLowerCase();
  if (s.includes("avail") || s.includes("free") || s === "operative")       return "disponível";
  if (s.includes("occup") || s.includes("charging") || s.includes("inuse")) return "ocupado";
  if (s.includes("maint") || s.includes("offline") || s.includes("fault"))  return "manutenção";
  return "disponível";
}
