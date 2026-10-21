import Head from "next/head";
import LayoutPublico from "../../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas, estiloH1, estiloH2, estiloTexto,
} from "../../../PaginasPrecos";
import { ARTIGOS_SEO, CATEGORIAS_SEO, comComparacao, paraLista, vitoriasPorLoja, breadcrumbLd, escolherTitulo, hojeLisboa } from "../../../lib/seoPrecos";
import { resumosRecentes, paraProps } from "../../../lib/seoPrecosDados";
import { URL_SITE } from "../../../lib/site";
import { cortar } from "../../../lib/seoFormato";

/*
 * Hub de uma categoria (Laticínios, Talho…): os artigos com o vencedor de
 * hoje e a cadeia que mais vezes ganha nesta secção.
 */
export default function PrecosCategoria({ categoria, comPreco, semPreco, vitorias, atualizado, outras }) {
  const nome = categoria.nome;
  const titulo = escolherTitulo([
    `${nome}: preços hoje no supermercado | PoupeJá`,
    `${nome}: preços hoje | PoupeJá`,
  ]);
  const lider = vitorias[0];
  const descricao = comPreco.length
    ? `Preços de ${nome.toLowerCase()} hoje em ${vitorias.length} supermercados. ${lider ? `O ${lider.nome} é o mais barato em ${lider.vitorias} de ${comPreco.length} artigos.` : ""} Preço por kg e por litro.`
    : `Preços de ${nome.toLowerCase()} no Continente, Pingo Doce, Auchan, Lidl e Aldi, comparados por kg e por litro.`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Preços", path: "/precos" }, { nome, path: `/precos/categoria/${categoria.slug}` }];
  // Sem artigos comparáveis, a página é só uma lista de links: fora do Google.
  const indexavel = comPreco.length >= 3;

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        {!indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/precos/categoria/${categoria.slug}`} />
        <meta property="og:title" content={`${nome}: preços hoje`} key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/precos/categoria/${categoria.slug}`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{nome}: preços hoje</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        {lider && (
          <p style={estiloTexto}>
            Em {nome.toLowerCase()}, o <strong style={{ color: "var(--pj-text)" }}>{lider.nome}</strong> é hoje o mais barato
            em {lider.vitorias} dos {comPreco.length} artigos que conseguimos comparar
            {vitorias[1] ? `, seguido do ${vitorias[1].nome} (${vitorias[1].vitorias})` : ""}.
          </p>
        )}

        {comPreco.length > 0 && <div className="mt-6"><ListaArtigos artigos={comPreco} /></div>}
        <NotaCadeias lojas={vitorias.map((v) => v.nome)} />

        {semPreco.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Sem preço recente em duas cadeias</h2>
            <Pilulas itens={semPreco.map((a) => ({ href: `/precos/${a.slug}`, texto: a.nome, fraco: true }))} />
          </>
        )}

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="categoria" texto="Junta à lista e vê onde fica mais barata" />

        <h2 className="font-display" style={estiloH2}>Outras categorias</h2>
        <Pilulas itens={outras.map((c) => ({ href: `/precos/categoria/${c.slug}`, texto: c.nome }))} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: CATEGORIAS_SEO.map((c) => ({ params: { categoria: c.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const categoria = CATEGORIAS_SEO.find((c) => c.slug === params.categoria);
  if (!categoria) return { notFound: true };
  const resumos = await resumosRecentes(hojeLisboa());
  const comparados = comComparacao(resumos).filter((a) => a.categoria === categoria.slug);
  const ids = new Set(comparados.map((a) => a.slug));
  return {
    props: paraProps({
      categoria,
      comPreco: comparados.map((a) => paraLista(a)),
      semPreco: ARTIGOS_SEO.filter((a) => a.categoria === categoria.slug && !ids.has(a.slug)).map((a) => ({ slug: a.slug, nome: a.nome })),
      vitorias: vitoriasPorLoja(comparados),
      atualizado: comparados.reduce((m, a) => (a.atualizado > m ? a.atualizado : m), "") || null,
      outras: CATEGORIAS_SEO.filter((c) => c.slug !== categoria.slug),
    }),
    revalidate: 10800,
  };
}
