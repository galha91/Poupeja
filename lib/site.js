/*
 * Endereço do site — fonte única para tudo o que sai da app em texto.
 *
 * O domínio é poupejá.com, mas o acento não pode ir em cru num link que vai
 * ser COPIADO: `navigator.share({url})` é seguro (o browser normaliza para
 * punycode antes de enviar), só que o caminho alternativo — desktop e tudo
 * o que não tem partilha nativa — põe o link no clipboard como texto, e os
 * detetores de links mais conservadores (Outlook, SMS, alguns clientes de
 * e-mail) cortam no primeiro caractere não-ASCII: fica `https://poupej`,
 * um link morto. O punycode é exatamente o mesmo sítio, escrito em ASCII,
 * e sobrevive ao copiar-colar em qualquer lado.
 *
 * Para escrever o domínio para OLHOS humanos (rodapés, textos legais) usa
 * DOMINIO_VISIVEL — aí o acento é o correto.
 */
export const URL_SITE = process.env.NEXT_PUBLIC_URL || "https://xn--poupej-uta.com";
export const DOMINIO_VISIVEL = "poupejá.com";

/* O código de quem convidou, para o link de partilha atribuir a origem. */
export function refAtual() {
  try { return localStorage.getItem("poupeja_uid") || ""; } catch { return ""; }
}

/* Constrói um link de partilha absoluto, já com o ?ref= de quem partilha. */
export function linkPartilha(caminho = "/", params = {}) {
  const u = new URL(caminho, URL_SITE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  }
  const ref = refAtual();
  if (ref) u.searchParams.set("ref", ref);
  return u.toString();
}
