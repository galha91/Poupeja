import { todasAsPaginas, xmlUrls, partes, parte } from '../../lib/sitemap';
import { URL_SITE } from '../../lib/site';

/* Uma parte do sitemap, quando o site passa das 50 000 páginas (ver /sitemap.xml). */
export default function SitemapParte() {}

export async function getServerSideProps({ res, params }) {
  const paginas = await todasAsPaginas();
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1 || n > partes(paginas)) return { notFound: true };
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xmlUrls(URL_SITE, parte(paginas, n)));
  res.end();
  return { props: {} };
}
