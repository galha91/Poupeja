import { todasAsPaginas, xmlUrls, xmlIndice, partes } from '../lib/sitemap';
import { URL_SITE } from '../lib/site';

/*
 * sitemap.xml — montado a pedido (ver lib/sitemap): entra no mapa
 * exatamente o que tem página indexável, nem mais nem menos. Até 50 000
 * URLs é um sitemap só; acima disso passa a índice de /sitemaps/<n>.
 */
export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  const paginas = await todasAsPaginas();
  const n = partes(paginas);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(n > 1 ? xmlIndice(URL_SITE, n) : xmlUrls(URL_SITE, paginas));
  res.end();
  return { props: {} };
}
