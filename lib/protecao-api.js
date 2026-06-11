// Proteção partilhada para endpoints de API que custam dinheiro
// (Anthropic, Resend). Verifica a origem do pedido e limita pedidos
// por IP. O rate limit é em memória: reinicia quando a função
// serverless é reciclada, mas trava abuso em rajada.

const ORIGENS_PERMITIDAS = [
  "https://xn--poupej-uta.com",
  "https://www.xn--poupej-uta.com",
  "https://poupeja.com",
  "https://www.poupeja.com",
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

export function excedeuLimite(req, chave, limite, janelaMs = 60_000) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
  const id = `${chave}:${ip}`;
  const agora = Date.now();
  const historico = (pedidos.get(id) || []).filter(t => agora - t < janelaMs);
  if (historico.length >= limite) return true;
  historico.push(agora);
  pedidos.set(id, historico);
  if (pedidos.size > 5000) pedidos.clear();
  return false;
}
