// Proteção partilhada para endpoints de API que custam dinheiro
// (Anthropic, Resend). Verifica a origem do pedido e limita pedidos
// por IP. O rate limit é em memória: reinicia quando a função
// serverless é reciclada, mas trava abuso em rajada.

// Só domínios NOSSOS. O poupeja.com (sem acento) esteve aqui por engano —
// é de terceiros, e a lista abre estes endpoints a quem a origem pertencer.
const ORIGENS_PERMITIDAS = [
  "https://xn--poupej-uta.com",
  "https://www.xn--poupej-uta.com",
];

const pedidos = new Map();

export function origemValida(req) {
  if (process.env.NODE_ENV !== "production") return true;
  const origem = req.headers.origin || "";
  // Pedidos sem header Origin (ex.: algumas WebViews) são permitidos —
  // o rate limit cobre esses casos.
  if (!origem) return true;
  return ORIGENS_PERMITIDAS.includes(origem) || origem.endsWith(".vercel.app");
}

export function ipDoPedido(req) {
  // Na Vercel o x-forwarded-for é reescrito pela própria plataforma (o
  // cliente não o consegue falsificar); o primeiro valor é o IP real.
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
}

export function excedeuLimite(req, chave, limite, janelaMs = 60_000) {
  return excedeuLimiteDe(`${chave}:${ipDoPedido(req)}`, limite, janelaMs);
}

/*
 * O mesmo limite, mas com uma identidade à escolha (ex.: o id da conta).
 * Serve para limitar por utilizador e não só por IP: quem muda de rede
 * (dados móveis ↔ wi-fi) não ganha pedidos novos.
 */
export function excedeuLimiteDe(id, limite, janelaMs = 60_000) {
  const agora = Date.now();
  const historico = (pedidos.get(id) || []).filter(t => agora - t < janelaMs);
  if (historico.length >= limite) return true;
  historico.push(agora);
  pedidos.set(id, historico);
  if (pedidos.size > 5000) pedidos.clear();
  return false;
}
