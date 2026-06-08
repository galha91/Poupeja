// Preços DGEG reais — endpoint PesquisarPostos (API actual do portal DGEG)
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  const BASE    = "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos";
  const FUELS   = "3400,3205,3405,3201,2105,2101,1120";
  const DISTRITOS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  const HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; PoupeJa/1.0)",
    "Referer": "https://precoscombustiveis.dgeg.gov.pt/",
    "Origin": "https://precoscombustiveis.dgeg.gov.pt",
  };

  function mapTipo(raw) {
    if (!raw) return null;
    const n = raw.toLowerCase();
    if (n.includes("95"))  return "Gasolina 95";
    if (n.includes("98"))  return "Gasolina 98";
    if (n.includes("gpl")) return "GPL Auto";
    if (n.includes("gasoleo") || n.includes("gasóleo") || n.includes("gasoleo")) {
      if (n.includes("colorido") || n.includes("marcado") || n.includes("aquecimento")) return null;
      return "Gasóleo";
    }
    return null;
  }

  async function fetchDistrito(id) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
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
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    // Busca todos os 18 distritos em paralelo
    const lotes = await Promise.all(DISTRITOS.map(fetchDistrito));
    const postos = lotes.flat();

    if (!postos.length) throw new Error("Sem resultados da DGEG");

    const mapa = {};
    postos.forEach(posto => {
      const marca = posto.Marca || "";
      if (!marca) return;
      (posto.Combustiveis || []).forEach(c => {
        const tipo  = mapTipo(c.TipoCombustivel);
        if (!tipo) return;
        const preco = parseFloat((c.Preco || "0").toString().replace(",", "."));
        if (!preco) return;
        const chave = `${marca}__${tipo}`;
        if (!mapa[chave]) mapa[chave] = { marca, tipo, precos: [], totalPostos: 0 };
        mapa[chave].precos.push(preco);
        mapa[chave].totalPostos++;
      });
    });

    const resultado = Object.values(mapa)
      .map(item => ({
        posto:       item.marca,
        tipo:        item.tipo,
        preco:       parseFloat(Math.min(...item.precos).toFixed(3)),
        precoMedio:  parseFloat((item.precos.reduce((a, b) => a + b, 0) / item.precos.length).toFixed(3)),
        totalPostos: item.totalPostos,
      }))
      .sort((a, b) => a.preco - b.preco);

    if (!resultado.length) {
      const tiposRaw = [...new Set(postos.flatMap(p => (p.Combustiveis || []).map(c => c.TipoCombustivel)))].slice(0, 10);
      throw new Error(`Sem tipos reconhecidos. Exemplos: ${tiposRaw.join(" | ")}`);
    }

    return res.status(200).json({
      success: true,
      dados: resultado,
      total: resultado.length,
      atualizadoEm: new Date().toISOString(),
      fonte: "DGEG — Direção-Geral de Energia e Geologia",
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      dados: [],
      atualizadoEm: new Date().toISOString(),
      erro: error.message,
    });
  }
}
