import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas, estiloH1, estiloH2, estiloTexto } from "../../PaginasPrecos";
import { porMarca } from "../../lib/seoMarcas";
import { lerPaginaMarca, propsMarca } from "../../lib/paginasMarca";
import { gruposMarca } from "../../lib/seoMarcasDados";
import { breadcrumbLd, hojeLisboa } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

import { jsonLdSeguro } from "../../lib/escapar";
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
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
  // Normalmente: a página pré-calculada pelo cron-paginas-marca (GitHub).
  const c = await lerPaginaMarca("marca", params.marca);
  if (c.estado === "ok") return { props: c.props, revalidate: 86400 };
  if (c.estado === "nao-existe") return { notFound: true, revalidate: 86400 };

  // Sem cache (tabela por criar ou cron parado há dias): cálculo em direto.
  const hoje = hojeLisboa();
  const marcas = porMarca(await gruposMarca(hoje));
  const m = marcas.find((x) => x.slug === params.marca);
  if (!m) return { notFound: true, revalidate: 86400 };
  const props = propsMarca(m, marcas, hoje);
  if (!props) return { notFound: true, revalidate: 86400 };
  return { props, revalidate: 86400 }; // 24 h: os preços mudam uma vez por dia
}
