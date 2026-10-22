import { PRAZOS_EURIBOR, lerSerieBce } from "./seoEuribor";

/*
 * Séries mensais da Euribor (24 meses) do Data Portal do BCE, para as
 * páginas públicas. Só servidor; cache em memória de 6 horas (o valor
 * muda uma vez por mês). Se o BCE falhar, devolve séries vazias e a
 * página regenera-se mais cedo.
 */
const TTL_MS = 6 * 60 * 60 * 1000;
// Endereço do Data Portal; BCE_API só existe para testes locais.
const BASE = process.env.BCE_API || "https://data-api.ecb.europa.eu";
let memoria = null;

export async function seriesEuribor() {
  if (memoria && Date.now() - memoria.em < TTL_MS) return memoria.series;
  const series = {};
  await Promise.all(PRAZOS_EURIBOR.map(async (p) => {
    try {
      const url = `${BASE}/service/data/FM/M.U2.EUR.RT.MM.${p.codigo}.HSTA?lastNObservations=24&format=jsondata`;
      const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`BCE respondeu ${r.status}`);
      series[p.id] = lerSerieBce(await r.json());
    } catch (e) {
      console.error(`euribor ${p.id}:`, e.message);
      series[p.id] = [];
    }
  }));
  if (Object.values(series).some((s) => s.length)) memoria = { em: Date.now(), series };
  return series;
}
