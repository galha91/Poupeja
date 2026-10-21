import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas, estiloH1, estiloH2, estiloTexto } from "../../PaginasPrecos";
import { ofertasProduto, porMarca } from "../../lib/seoMarcas";
import { gruposMarca } from "../../lib/seoMarcasDados";
import { breadcrumbLd, hojeLisboa } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Hub de uma marca (/marca/mimosa): os produtos dela que comparamos, com a
 * cadeia mais barata de cada um. Alvo: "mimosa preços", "gallo continente".
 */
export default function Marca({ marca, produtos, lojas, atualizado, indexavel, outras }) {
  const titulo = `${marca.nome}: preços hoje nos supermercados | PoupeJá`.length <= 60
    ? `${marca.nome}: preços hoje nos supermercados | PoupeJá`
    : `${marca.nome}: preços hoje | PoupeJá`;
  const comparados = produtos.filter((p) => p.n >= 2).length;
  const descricao = cortar(`Preços dos produtos ${marca.nome} hoje no ${lojas.join(", ")}. ${comparados ? `${comparados} produtos comparados em mais de uma cadeia.` : ""} Grátis, sem conta.`);
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Marcas", path: "/marcas" }, { nome: marca.nome, path: `/marca/${marca.slug}` }];

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        {!indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/marca/${marca.slug}`} />
        <meta property="og:title" content={`${marca.nome}: preços hoje`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/marca/${marca.slug}`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{marca.nome}: preços hoje</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>
          {produtos.length} produto{produtos.length !== 1 ? "s" : ""} {marca.nome} com preço online
          {comparados ? <>, <strong style={{ color: "var(--pj-text)" }}>{comparados}</strong> à venda em mais de uma cadeia</> : ""}.
          Em cada um, a cadeia onde está mais barato hoje.
        </p>

        <div className="mt-6"><ListaArtigos artigos={produtos} /></div>
        <NotaCadeias lojas={lojas} />

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="marca" texto="Junta à lista e vê onde fica mais barata" />

        {outras.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Outras marcas</h2>
            <Pilulas itens={[...outras.map((m) => ({ href: `/marca/${m.slug}`, texto: m.nome })), { href: "/marcas", texto: "Todas as marcas", fraco: true }]} />
          </>
        )}
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const hoje = hojeLisboa();
  const marcas = porMarca(await gruposMarca(hoje));
  const m = marcas.find((x) => x.slug === params.marca);
  if (!m) return { notFound: true, revalidate: 3600 };
  const produtos = m.grupos
    .map((g) => ({ g, d: ofertasProduto(g, hoje) }))
    .filter(({ d }) => d.ofertas.length)
    .sort((a, b) => b.d.ofertas.length - a.d.ofertas.length || a.g.nome.localeCompare(b.g.nome, "pt"));
  if (!produtos.length) return { notFound: true, revalidate: 3600 };
  const lojas = [...new Set(produtos.flatMap(({ d }) => d.ofertas.map((o) => o.lojaNome)))];
  return {
    props: JSON.parse(JSON.stringify({
      marca: { slug: m.slug, nome: m.nome },
      produtos: produtos.map(({ g, d }) => ({
        slug: g.slug, nome: g.nome, href: `/produto/${g.slug}`, unidade: "embalagem", n: d.ofertas.length,
        contexto: `${d.ofertas.length} cadeia${d.ofertas.length > 1 ? "s" : ""} · mais barato no ${d.ofertas[0].lojaNome}`,
        vencedor: { lojaNome: d.ofertas[0].lojaNome, valor: d.ofertas[0].preco },
      })),
      lojas,
      atualizado: produtos.reduce((x, { d }) => (d.atualizado > x ? d.atualizado : x), "") || null,
      indexavel: produtos.filter(({ d }) => d.indexavel).length >= 2,
      outras: marcas.filter((x) => x.slug !== m.slug).slice(0, 12).map((x) => ({ slug: x.slug, nome: x.nome })),
    })),
    revalidate: 10800,
  };
}
