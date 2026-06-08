export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  const { lat = 38.7169, lon = -9.1395, raio = 10 } = req.query;

  try {
    const response = await fetch(
      `https://api.mob.ie/api/v1/chargepoints?latitude=${lat}&longitude=${lon}&radius=${raio}`,
      { headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" } }
    );

    if (!response.ok) throw new Error(`MOBI.E ${response.status}`);

    const data = await response.json();
    const postos = Array.isArray(data) ? data : (data?.chargePoints || data?.data || []);

    if (!postos.length) {
      return res.status(200).json({
        success: true,
        postos: [],
        total: 0,
        atualizadoEm: new Date().toISOString(),
        fonte: "MOBI.E — Rede Nacional de Mobilidade Elétrica",
      });
    }

    const resultado = postos.map(p => ({
      id:       p.id || p.chargePointId || Math.random().toString(36),
      nome:     p.name || p.address || p.location || "Posto MOBI.E",
      morada:   p.address || p.street || "",
      cidade:   p.city || p.municipality || "",
      lat:      p.latitude || p.lat || 0,
      lon:      p.longitude || p.lng || 0,
      operador: p.operator || p.operatorName || "MOBI.E",
      potencia: p.maxPower ? `${p.maxPower} kW` : (p.power || "22 kW"),
      tipo:     p.connectorTypes?.join(" / ") || p.connectorType || "Tipo 2",
      estado:   mapEstado(p.status || p.state),
      slots:    p.totalConnectors || p.connectors || 2,
      livres:   p.availableConnectors ?? p.available ?? 0,
      distancia: p.distance ? parseFloat(p.distance).toFixed(1) : null,
    }));

    res.status(200).json({
      success: true,
      postos: resultado,
      total: resultado.length,
      atualizadoEm: new Date().toISOString(),
      fonte: "MOBI.E — Rede Nacional de Mobilidade Elétrica",
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      postos: [],
      atualizadoEm: new Date().toISOString(),
      erro: error.message,
    });
  }
}

function mapEstado(status) {
  if (!status) return "disponível";
  const s = status.toLowerCase();
  if (s.includes("avail") || s.includes("free") || s.includes("disponivel") || s === "operative") return "disponível";
  if (s.includes("occup") || s.includes("charging") || s.includes("inuse")) return "ocupado";
  if (s.includes("maint") || s.includes("offline") || s.includes("fault") || s.includes("unavail")) return "manutenção";
  return "disponível";
}
