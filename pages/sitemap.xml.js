import { LOJAS_SLUGS, RECEITAS_SLUGS } from '../lib/seo-slugs';
import { listarMunicipios, frescuraDosPrecos, DISTRITOS_SLUGS } from '../lib/municipios';
import { URL_SITE } from '../lib/site';

// Só os concelhos com mais postos entram no mapa: dezenas de páginas parecidas
// de uma vez levam o Google a ignorá-las todas (273 de 280 ficaram por indexar).
// As outras continuam a existir e a ter link a partir de /combustiveis.
const MAX_CONCELHOS_NO_MAPA = 40;

const FIXAS = [
  { path: '/',             changefreq: 'daily',   priority: '1.0' },
  { path: '/combustiveis', changefreq: 'daily',   priority: '0.9' },
  { path: '/folhetos',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/receitas',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/apoios',       changefreq: 'monthly', priority: '0.8' },
  { path: '/fontes',       changefreq: 'yearly',  priority: '0.4' },
  { path: '/instalar',     changefreq: 'monthly', priority: '0.8' },
  { path: '/privacidade',  changefreq: 'yearly',  priority: '0.3' },
  ...LOJAS_SLUGS.map(l   => ({ path: `/folhetos/${l.slug}`,  changefreq: 'weekly',  priority: '0.8' })),
  ...RECEITAS_SLUGS.map(r => ({ path: `/receitas/${r.slug}`, changefreq: 'monthly', priority: '0.7' })),
];

function xml(paginas) {
  const urls = paginas.map(p => `  <url>
    <loc>${URL_SITE}${p.path}</loc>${p.lastmod ? `
    <lastmod>${p.lastmod}</lastmod>` : ''}
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
  // <lastmod> só nas páginas de combustível, e com a data REAL da última
  // consulta à DGEG: é o que diz ao Google que vale a pena voltar todos os
  // dias. Nas outras fica de fora — uma data inventada ("hoje", sempre)
  // ensina o Google a ignorar o campo no site inteiro.
  let lastmod = null;
  try {
    const f = await frescuraDosPrecos();
    const ref = f?.obtidoEm ?? f?.dataPreco;
    if (ref) lastmod = new Date(ref).toISOString().slice(0, 10);
  } catch {}
  try {
    concelhos = (await listarMunicipios()).slice(0, MAX_CONCELHOS_NO_MAPA).map(m => ({
      path: `/combustiveis/${m.slug}`, changefreq: 'daily', priority: '0.8', lastmod,
    }));
  } catch {}
  const fixas = FIXAS.map(p => p.path === '/combustiveis' ? { ...p, lastmod } : p);
  // Os 18 distritos entram todos: são poucos, cada um diferente, e ligam
  // a todos os concelhos — incluindo os que não cabem no mapa.
  const distritos = DISTRITOS_SLUGS.map(d => ({ path: `/combustiveis/distrito/${d.slug}`, changefreq: 'daily', priority: '0.85', lastmod }));

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml([...fixas, ...distritos, ...concelhos]));
  res.end();
  return { props: {} };
}
