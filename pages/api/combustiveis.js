export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  const tentar = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" },
      });
      clearTimeout(timer);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (!ct.includes("json")) throw new Error(`Resposta não JSON (${ct})`);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    // Tentativa 1 — endpoint individual de postos, página pequena
    let data = await tentar(
      "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/GetListaPrecosPostos?qtd=500&pagina=1"
    ).catch(async (e1) => {
      // Tentativa 2 — endpoint alternativo
      return await tentar(
        "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/GetPesquisa?qtd=500&pagina=1"
      ).catch(() => { throw e1; });
    });

    const postos = data?.resultado || data?.Resultado || data?.data || [];
    if (!postos.length) throw new Error("Lista vazia");

    const mapa = {};
    postos.forEach(p => {
      const marca = p.Marca || p.NomeMarca || p.marca || "";
      const tipo  = p.TipoCombustivel || p.Combustivel || p.tipoCombustivel || "";
      const raw   = p.Preco ?? p.PrecoVenda ?? p.preco ?? "0";
      const preco = parseFloat(raw.toString().replace(",", "."));
      if (!preco || !tipo || !marca) return;
      const chave = `${marca}__${tipo}`;
      if (!mapa[chave]) mapa[chave] = { marca, tipo, precos: [], totalPostos: 0 };
      mapa[chave].precos.push(preco);
      mapa[chave].totalPostos++;
    });

    const tiposPrincipais = ["Gasolina 95", "Gasóleo", "Gasolina 98", "GPL Auto", "Gasóleo Colorido"];
    const resultado = Object.values(mapa)
      .filter(item => tiposPrincipais.some(t => item.tipo.includes(t) || t.includes(item.tipo)))
      .map(item => ({
        posto: item.marca,
        tipo:  item.tipo,
        preco: parseFloat(Math.min(...item.precos).toFixed(3)),
        precoMedio: (item.precos.reduce((a, b) => a + b, 0) / item.precos.length).toFixed(3),
        totalPostos: item.totalPostos,
      }))
      .sort((a, b) => a.preco - b.preco);

    if (!resultado.length) throw new Error("Sem tipos principais após filtragem");

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
