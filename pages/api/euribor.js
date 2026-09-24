import { origemValida, excedeuLimite } from "../../lib/protecao-api";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  if (!origemValida(req)) return res.status(403).json({ erro: "Origem não permitida." });
  if (excedeuLimite(req, "euribor", 30)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Tenta daqui a pouco." });
  }

  const indexantes = {
    "3M": "EURIBOR3MD_",
    "6M": "EURIBOR6MD_",
    "12M": "EURIBOR1YD_",
  };

  const resultados = {};

  /*
   * Série MENSAL (média do mês), zona euro: FM.M.U2.EUR.RT.MM.<código>.HSTA.
   *
   * Pedia-se a diária (FM.B.EU...), que o BCE deixou de publicar no Data
   * Portal: só restam as mensais, trimestrais e anuais. Cada pedido
   * falhava, o `catch {}` engolia o erro e a API respondia 503 — a caixa
   * do Euribor e a prestação estimada desapareciam da secção Casa sem
   * aviso nenhum.
   *
   * A média mensal é, de resto, a mais útil aqui: é a que os bancos
   * portugueses usam para rever a taxa de um crédito à habitação.
   */
  for (const [prazo, codigo] of Object.entries(indexantes)) {
    try {
      const url = `https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.${codigo}.HSTA?lastNObservations=1&format=jsondata`;
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) {
        console.error(`euribor ${prazo}: BCE respondeu ${r.status}`);
        continue;
      }
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
    } catch (e) {
      // Antes era `catch {}` — foi assim que a falha passou meses sem se ver.
      console.error(`euribor ${prazo}: ${e.message}`);
    }
  }

  if (Object.keys(resultados).length === 0) {
    return res.status(503).json({ erro: "Não foi possível obter dados do Euribor." });
  }

  return res.status(200).json({ euribor: resultados, atualizadoEm: new Date().toISOString() });
}
