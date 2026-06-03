// pages/api/ev.js
// Vai buscar postos de carregamento elétrico à API oficial MOBI.E Portugal
// Dados em tempo real de toda a rede nacional

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  const { lat = 38.7169, lon = -9.1395, raio = 10 } = req.query;

  try {
    // API MOBI.E oficial
    const response = await fetch(
      `https://api.mob.ie/api/v1/chargepoints?latitude=${lat}&longitude=${lon}&radius=${raio}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "PoupeJa/1.0",
        },
      }
    );

    if (!response.ok) throw new Error(`MOBI.E erro: ${response.status}`);
    const data = await response.json();
    const postos = Array.isArray(data) ? data : (data?.chargePoints || data?.data || []);

    const resultado = postos.map(p => ({
      id: p.id || p.chargePointId || Math.random().toString(36),
      nome: p.name || p.address || p.location || "Posto MOBI.E",
      morada: p.address || p.street || "",
      cidade: p.city || p.municipality || "",
      lat: p.latitude || p.lat || 0,
      lon: p.longitude || p.lng || 0,
      operador: p.operator || p.operatorName || "MOBI.E",
      potencia: p.maxPower ? `${p.maxPower} kW` : (p.power || "22 kW"),
      tipo: p.connectorTypes?.join(" / ") || p.connectorType || "Tipo 2",
      estado: mapEstado(p.status || p.state),
      slots: p.totalConnectors || p.connectors || 2,
      livres: p.availableConnectors ?? p.available ?? 0,
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
    // Fallback com postos reais conhecidos de Lisboa
    res.status(200).json({
      success: false,
      fallback: true,
      postos: [
        { id:"1", nome:"MOBI.E — Marquês de Pombal",  morada:"Av. da Liberdade", cidade:"Lisboa", lat:38.7252, lon:-9.1499, operador:"EDP Comercial", potencia:"50 kW",  tipo:"CCS / CHAdeMO", estado:"disponível",  slots:2, livres:2, distancia:"0.3" },
        { id:"2", nome:"MOBI.E — Parque Eduardo VII", morada:"Parque Eduardo VII", cidade:"Lisboa", lat:38.7271, lon:-9.1531, operador:"EDP Comercial", potencia:"22 kW",  tipo:"Tipo 2",        estado:"disponível",  slots:4, livres:3, distancia:"0.7" },
        { id:"3", nome:"MOBI.E — Colombo",            morada:"Av. Lusíada",       cidade:"Lisboa", lat:38.7377, lon:-9.1823, operador:"Galp EV",       potencia:"150 kW", tipo:"CCS",           estado:"ocupado",     slots:6, livres:0, distancia:"1.2" },
        { id:"4", nome:"MOBI.E — Saldanha",           morada:"Pr. Duque de Saldanha", cidade:"Lisboa", lat:38.7354, lon:-9.1437, operador:"EDP Comercial", potencia:"11 kW",  tipo:"Tipo 2",    estado:"disponível",  slots:2, livres:1, distancia:"1.5" },
        { id:"5", nome:"MOBI.E — Vasco da Gama",      morada:"Av. Dom João II",   cidade:"Lisboa", lat:38.7680, lon:-9.0990, operador:"Ionity",        potencia:"50 kW",  tipo:"CCS / CHAdeMO", estado:"disponível",  slots:4, livres:2, distancia:"2.1" },
        { id:"6", nome:"MOBI.E — Oriente",            morada:"Av. Dom João II",   cidade:"Lisboa", lat:38.7687, lon:-9.0985, operador:"Ionity",        potencia:"350 kW", tipo:"CCS",           estado:"manutenção",  slots:8, livres:0, distancia:"2.8" },
        { id:"7", nome:"MOBI.E — Benfica",            morada:"Estrada de Benfica", cidade:"Lisboa", lat:38.7500, lon:-9.1950, operador:"EDP Comercial", potencia:"22 kW",  tipo:"Tipo 2",        estado:"disponível",  slots:3, livres:2, distancia:"3.4" },
        { id:"8", nome:"MOBI.E — Cascais",            morada:"Av. Marginal",      cidade:"Cascais", lat:38.6969, lon:-9.4220, operador:"Galp EV",       potencia:"75 kW",  tipo:"CCS",           estado:"disponível",  slots:4, livres:1, distancia:"4.1" },
        { id:"9", nome:"MOBI.E — Almada",             morada:"Forum Almada",      cidade:"Almada", lat:38.6762, lon:-9.1564, operador:"EDP Comercial", potencia:"50 kW",  tipo:"CCS / CHAdeMO", estado:"disponível",  slots:4, livres:3, distancia:"5.2" },
        { id:"10",nome:"MOBI.E — Setúbal",            morada:"Av. Luísa Todi",    cidade:"Setúbal", lat:38.5244, lon:-8.8882, operador:"EDP Comercial", potencia:"22 kW",  tipo:"Tipo 2",        estado:"disponível",  slots:2, livres:2, distancia:"8.4" },
      ],
      atualizadoEm: new Date().toISOString(),
      fonte: "Dados de referência — MOBI.E indisponível",
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
