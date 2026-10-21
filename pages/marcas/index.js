import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { Atualizado, BotaoAbrirPoupeja, NotaCadeias, Migalhas, estiloH1, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { ofertasProduto, porMarca } from "../../lib/seoMarcas";
import { gruposMarca } from "../../lib/seoMarcasDados";
import { LOJAS_SEO, breadcrumbLd, hojeLisboa } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";

/* Hub das marcas: por onde o Google chega a /marca/<marca> e /produto/<slug>. */
export default function Marcas({ marcas, total, atualizado }) {
  const titulo = "Preços por marca nos supermercados | PoupeJá";
  const descricao = total
    ? `${total} produtos de ${marcas.length} marcas comparados entre Continente, Pingo Doce, Auchan, Lidl e Aldi. Vê onde cada um está mais barato hoje.`
    : "Preços de produtos de marca comparados entre supermercados: Continente, Pingo Doce, Auchan, Lidl e Aldi.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Marcas", path: "/marcas" }];
  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        {marcas.length < 3 && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/marcas`} />
        <meta property="og:title" content="Preços por marca nos supermercados" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/marcas`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Preços por marca</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>O mesmo produto, da mesma marca e do mesmo tamanho, em cada supermercado.</p>
        <div className="rounded-2xl overflow-hidden mt-6" style={estiloCartao}>
          {marcas.map((m, i) => (
            <a key={m.slug} href={`/marca/${m.slug}`} className="flex items-center justify-between px-4 py-3 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{m.nome}</span>
              <span style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>{m.n} produto{m.n !== 1 ? "s" : ""}</span>
            </a>
          ))}
        </div>
        <NotaCadeias lojas={LOJAS_SEO.map((l) => l.nome)} />
        <BotaoAbrirPoupeja href="/?atalho=mercados" tipo="marcas" texto="Procura qualquer produto na app" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const hoje = hojeLisboa();
  const marcas = porMarca(await gruposMarca(hoje))
    .map((m) => {
      const ds = m.grupos.map((g) => ofertasProduto(g, hoje)).filter((d) => d.ofertas.length);
      return { slug: m.slug, nome: m.nome, n: ds.length, atualizado: ds.reduce((x, d) => (d.atualizado > x ? d.atualizado : x), "") };
    })
    .filter((m) => m.n > 0);
  return {
    props: {
      marcas: marcas.map(({ slug, nome, n }) => ({ slug, nome, n })),
      total: marcas.reduce((s, m) => s + m.n, 0),
      atualizado: marcas.reduce((x, m) => (m.atualizado > x ? m.atualizado : x), "") || null,
    },
    revalidate: 10800,
  };
}
