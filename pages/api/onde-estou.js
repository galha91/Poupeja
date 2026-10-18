import { cidadePortuguesa } from "../../lib/cidadeIp";

/*
 * Localização APROXIMADA de quem pede, a partir do IP — sem pedir nada.
 *
 * Serve para o Início mostrar logo o gasóleo mais barato "perto de Braga"
 * em vez de "no país", antes de a pessoa tocar em qualquer botão. O Vercel
 * já resolve o IP na própria CDN e manda o resultado em cabeçalhos; aqui
 * só se lêem. Nada é guardado nem registado.
 *
 * É aproximada a sério: em rede móvel o IP cai muitas vezes em Lisboa ou
 * no Porto, esteja a pessoa onde estiver. Por isso quem mostra isto diz
 * sempre a cidade ("perto de Lisboa") — se estiver errada, vê-se logo —
 * e o botão de localização exata continua lá.
 *
 * Fora de Portugal não há postos DGEG perto: responde que não sabe.
 */
export default function handler(req, res) {
  // Cada pessoa tem a sua resposta: nunca pode ficar em cache partilhada.
  res.setHeader("Cache-Control", "private, no-store");

  const pais = req.headers["x-vercel-ip-country"];
  const lat = parseFloat(req.headers["x-vercel-ip-latitude"]);
  const lon = parseFloat(req.headers["x-vercel-ip-longitude"]);
  if (pais !== "PT" || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(200).json({ ok: false });
  }

  let cidade = null;
  try { cidade = cidadePortuguesa(decodeURIComponent(req.headers["x-vercel-ip-city"] || "")); } catch {}

  return res.status(200).json({
    ok: true,
    // Duas casas (~1 km): mais do que isso seria fingir uma precisão que o
    // IP não tem — e coordenadas iguais deixam a CDN reaproveitar a
    // resposta de /api/combustiveis entre pessoas da mesma cidade.
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    cidade,
  });
}
