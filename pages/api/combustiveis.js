// Preços DGEG reais — endpoint PesquisarPostos
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  const BASE      = "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos";
  // Todos os tipos disponíveis na DGEG
  const FUELS     = "3400,3205,3405,3201,2105,2101,1120,1110,1130,4101";
  const DISTRITOS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  const HEADERS   = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; PoupeJa/1.0)",
    "Referer": "https://precoscombustiveis.dgeg.gov.pt/",
    "Origin": "https://precoscombustiveis.dgeg.gov.pt",
  };

  function mapTipo(raw) {
    if (!raw) return null;
    const n = raw.toLowerCase();
    if (n.includes("gpl"))                             return "GPL Auto";
    if (n.includes("gnv") || n.includes("gas natural")) return "GNV";
    if (n.includes("adblue"))                          return "AdBlue";
    if (n.includes("gasoleo") || n.includes("gasóleo") || n.includes("gasoleo")) {
      if (n.includes("colorido") || n.includes("marcado") || n.includes("aquecimento")) return null;
      if (n.includes("espec") || n.includes("aditiv") || n.includes("premium")) return "Gasóleo Aditivado";
      return "Gasóleo";
    }
    if (n.includes("gasolina") || n.includes("sem chumbo")) {
      const is98 = n.includes("98");
      const is95 = n.includes("95");
      if (!is95 && !is98) return null;
      const grade = is98 ? "98" : "95";
      if (n.includes("espec") || n.includes("aditiv") || n.includes("premium") || n.includes("superior"))
        return `Gasolina ${grade} Aditivada`;
      return `Gasolina ${grade}`;
    }
    return null;
  }

  async function fetchDistrito(id) {
    const ctrl  = new AbortController();
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
    const lotes  = await Promise.all(DISTRITOS.map(fetchDistrito));
    const postos = lotes.flat();

    if (!postos.length) throw new Error("Sem resultados da DGEG");

    // Estrutura plana: cada linha tem Marca + Combustivel + Preco directamente
    const mapa = {};
    postos.forEach(p => {
      const marca    = p.Marca    || p.marca    || "";
      const tipoRaw  = p.Combustivel || p.combustivel
                    || p.TipoCombustivel || p.tipoCombustivel || "";
      const precoRaw = p.Preco    || p.preco    || p.PrecoVenda || "0";

      const tipo  = mapTipo(tipoRaw);
      const preco = parseFloat(precoRaw.toString().replace(",", "."));
      if (!marca || !tipo || !preco) return;

      const chave = `${marca}__${tipo}`;
      if (!mapa[chave]) mapa[chave] = { marca, tipo, precos: [], totalPostos: 0 };
      mapa[chave].precos.push(preco);
      mapa[chave].totalPostos++;
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
      const amostra = [...new Set(postos.slice(0,20).map(p => p.Combustivel || p.combustivel || "?"))];
      throw new Error(`Tipos recebidos: ${amostra.join(" | ")}`);
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
