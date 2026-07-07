import { LOJAS_SLUGS, CIDADES } from '../lib/seo-slugs';

const SITE_URL = 'https://xn--poupej-uta.com';

const PAGINAS = [
  { path: '/',             changefreq: 'daily',   priority: '1.0' },
  { path: '/combustiveis', changefreq: 'daily',   priority: '0.9' },
  { path: '/folhetos',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/apoios',       changefreq: 'monthly', priority: '0.8' },
  { path: '/instalar',     changefreq: 'monthly', priority: '0.8' },
  { path: '/privacidade',  changefreq: 'yearly',  priority: '0.3' },
  ...LOJAS_SLUGS.map(l => ({ path: `/folhetos/${l.slug}`,     changefreq: 'weekly', priority: '0.8' })),
  ...CIDADES.map(c =>     ({ path: `/combustiveis/${c.slug}`, changefreq: 'daily',  priority: '0.8' })),
];

function generateSitemap() {
  const urls = PAGINAS.map(p => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/xml');
  res.write(generateSitemap());
  res.end();
  return { props: {} };
}
