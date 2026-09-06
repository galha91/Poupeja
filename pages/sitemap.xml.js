import { LOJAS_SLUGS, RECEITAS_SLUGS } from '../lib/seo-slugs';
import { listarMunicipios } from '../lib/municipios';
import { URL_SITE } from '../lib/site';

const FIXAS = [
  { path: '/',             changefreq: 'daily',   priority: '1.0' },
  { path: '/combustiveis', changefreq: 'daily',   priority: '0.9' },
  { path: '/folhetos',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/receitas',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/apoios',       changefreq: 'monthly', priority: '0.8' },
  { path: '/instalar',     changefreq: 'monthly', priority: '0.8' },
  { path: '/privacidade',  changefreq: 'yearly',  priority: '0.3' },
  ...LOJAS_SLUGS.map(l   => ({ path: `/folhetos/${l.slug}`,  changefreq: 'weekly',  priority: '0.8' })),
  ...RECEITAS_SLUGS.map(r => ({ path: `/receitas/${r.slug}`, changefreq: 'monthly', priority: '0.7' })),
];

function xml(paginas) {
  const urls = paginas.map(p => `  <url>
    <loc>${URL_SITE}${p.path}</loc>
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
  // Os concelhos saem dos dados da DGEG, por isso o sitemap é montado a
  // pedido: entra no mapa exatamente o que tem página, nem mais nem menos.
  // Se a DGEG estiver em baixo, sai o sitemap sem concelhos em vez de sair
  // um sitemap cheio de URLs que respondem 404.
  let concelhos = [];
  try {
    concelhos = (await listarMunicipios()).map(m => ({
      path: `/combustiveis/${m.slug}`, changefreq: 'daily', priority: '0.8',
    }));
  } catch {}

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml([...FIXAS, ...concelhos]));
  res.end();
  return { props: {} };
}
