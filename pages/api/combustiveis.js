export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  try {
    const response = await fetch(
      "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/GetListaPrecosPostos?qtd=9999&pagina=1",
      { headers: { "Accept": "application/json", "User-Agent": "PoupeJa/1.0" } }
    );

    if (!response.ok) throw new Error(`DGEG ${response.status}`);

    const data = await response.json();
    const postos = data?.resultado || [];

    if (!postos.length) throw new Error("DGEG devolveu lista vazia");

    const mapa = {};
    postos.forEach(posto => {
      const marca = posto.Marca || posto.NomeMarca || "";
      const tipo  = posto.TipoCombustivel || posto.Combustivel || "";
      const raw   = posto.Preco || posto.PrecoVenda || "0";
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
        preco: Math.min(...item.precos),
        precoMedio: (item.precos.reduce((a, b) => a + b, 0) / item.precos.length).toFixed(3),
        totalPostos: item.totalPostos,
      }))
      .sort((a, b) => a.preco - b.preco);

    if (!resultado.length) throw new Error("Sem dados após filtragem");

    res.status(200).json({
      success: true,
      dados: resultado,
      total: resultado.length,
      atualizadoEm: new Date().toISOString(),
      fonte: "DGEG — Direção-Geral de Energia e Geologia",
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      dados: [],
      atualizadoEm: new Date().toISOString(),
      erro: error.message,
    });
  }
}
