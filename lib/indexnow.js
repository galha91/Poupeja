/*
 * IndexNow — avisar os motores de pesquisa de que uma página mudou.
 *
 * Bing, Yandex, Seznam, Naver e outros partilham o mesmo protocolo: um
 * aviso a api.indexnow.org chega a todos. O Bing alimenta também o
 * DuckDuckGo, o Ecosia e a pesquisa do ChatGPT. O GOOGLE NÃO o usa — lá
 * conta o sitemap (com o lastmod real) e os links entre páginas.
 *
 * A chave é pública por desenho: prova-se que o site é nosso porque o
 * mesmo valor está em /<chave>.txt. Não é um segredo.
 */
export const CHAVE_INDEXNOW = "429a5c4052d248be97367e56cd7b14fb";
export const ENDPOINT_INDEXNOW = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10000; // limite do protocolo por pedido

/* O corpo do pedido, sem I/O — testável. */
export function montarPedido(urlSite, caminhos) {
  const base = new URL(urlSite);
  const urlList = [...new Set(caminhos)].slice(0, MAX_URLS).map(c => new URL(c, base).href);
  return {
    host: base.host,
    key: CHAVE_INDEXNOW,
    keyLocation: new URL(`/${CHAVE_INDEXNOW}.txt`, base).href,
    urlList,
  };
}
