/*
 * Validação de uma subscrição push que chega sem sessão (convidados).
 *
 * O web-push faz um POST ao `endpoint` guardado, por isso só se aceitam os
 * serviços de push dos browsers: um endpoint qualquer faria o servidor
 * chamar endereços escolhidos por quem envia o pedido.
 */
const SERVICOS = [
  /^fcm\.googleapis\.com$/,                // Chrome, Edge, Android
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/,               // Safari / iPhone
  /^[a-z0-9-]+\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,    // Edge antigo
];

export function subscricaoPushValida(s) {
  if (!s || typeof s !== "object") return false;
  if (JSON.stringify(s).length > 2000) return false;
  let url;
  try { url = new URL(String(s.endpoint || "")); } catch { return false; }
  if (url.protocol !== "https:" || url.port) return false;
  if (!SERVICOS.some(r => r.test(url.hostname))) return false;
  const k = s.keys;
  return !!k && typeof k.p256dh === "string" && typeof k.auth === "string"
    && k.p256dh.length >= 40 && k.p256dh.length <= 200 && k.auth.length >= 16 && k.auth.length <= 100;
}
