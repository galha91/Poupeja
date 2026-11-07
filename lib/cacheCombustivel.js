/*
 * Quanto tempo a CDN guarda uma página de combustíveis (s-maxage).
 *
 * Era 30 minutos fixos, sem stale-while-revalidate (ver o porquê em
 * pages/combustiveis/[cidade].js): o que fica preso no HTML é o juízo
 * "isto é de hoje". Mas os preços só mudam uma vez por dia (cron-precos,
 * 06:00 UTC, que no plano Hobby pode correr em qualquer minuto dessa hora)
 * e o juízo só muda à meia-noite. Entre esses momentos, regenerar de 30 em
 * 30 minutos era CPU gasto na Vercel para servir a mesma página — sobretudo
 * a bots, que percorrem os ~330 concelhos.
 *
 * Por isso: até 2 h, mas nunca para lá da próxima meia-noite (UTC e
 * Lisboa) nem das 06:00 UTC; e das 06:00 às 07:15 UTC, enquanto os preços
 * novos podem chegar a qualquer momento, os 30 minutos de antes.
 */
export const MAX_S = 2 * 3600;
const JANELA_PRECOS_S = 1800;

function segundosAte(agora, proximo) {
  return Math.ceil((proximo - agora) / 1000);
}

/* Próxima meia-noite em Lisboa, como instante. */
function proximaMeiaNoiteLisboa(agora) {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(agora);
  const v = (t) => Number(partes.find((p) => p.type === t).value);
  const passados = v("hour") * 3600 + v("minute") * 60 + v("second");
  return new Date(agora.getTime() + (86400 - passados) * 1000);
}

export function segundosCacheCombustivel(agora = new Date()) {
  const minutosUtc = agora.getUTCHours() * 60 + agora.getUTCMinutes();
  if (minutosUtc >= 6 * 60 && minutosUtc < 7 * 60 + 15) return JANELA_PRECOS_S;

  const dia = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  const meiaNoiteUtc = new Date(dia + 86400e3);
  const seisUtc = new Date(minutosUtc < 6 * 60 ? dia + 6 * 3600e3 : dia + 30 * 3600e3);
  const s = Math.min(
    MAX_S,
    segundosAte(agora, meiaNoiteUtc),
    segundosAte(agora, proximaMeiaNoiteLisboa(agora)),
    segundosAte(agora, seisUtc),
  );
  return Math.max(60, s);
}

export function cabecalhoCacheCombustivel(agora = new Date()) {
  return `public, s-maxage=${segundosCacheCombustivel(agora)}`;
}
