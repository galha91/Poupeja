import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas,
  estiloH1, estiloH2, estiloTexto, estiloCartao,
} from "../../PaginasPrecos";
import { ARTIGOS_SEO, CATEGORIAS_SEO, LOJAS_SEO, comComparacao, paraLista, vitoriasPorLoja, breadcrumbLd, hojeLisboa } from "../../lib/seoPrecos";
import { resumosRecentes, paraProps } from "../../lib/seoPrecosDados";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Hub dos preços: por onde o Google (e quem chega) encontra todos os
 * artigos. O conteúdo próprio é o do dia: quantas vezes cada cadeia é a
 * mais barata e as maiores diferenças de hoje.
 */
export default function Precos({ artigos, vitorias, maioresDiferencas, porCategoria, atualizado }) {
  const titulo = "Preços de supermercado hoje: quem é mais barato | PoupeJá";
  const descricao = artigos
    ? `${artigos} artigos comparados hoje no ${vitorias.map((v) => v.nome).join(", ")}. Vê onde cada um está mais barato, com preço por kg e por litro.`
    : "Compara os preços dos supermercados em Portugal: Continente, Pingo Doce, Auchan, Lidl e Aldi. Preço por kg e por litro, grátis.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Preços", path: "/precos" }];

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        <link rel="canonical" href={`${URL_SITE}/precos`} />
        <meta property="og:title" content="Preços de supermercado hoje" key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/precos`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Preços de supermercado hoje</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>
          {artigos
            ? <>Hoje comparamos <strong style={{ color: "var(--pj-text)" }}>{artigos} artigos</strong> em pelo menos duas cadeias.{vitorias[0] && <> O <strong style={{ color: "var(--pj-text)" }}>{vitorias[0].nome}</strong> é o mais barato em {vitorias[0].vitorias} deles.</>}</>
            : "O preço de cada artigo, cadeia a cadeia, comparado por kg, litro ou unidade."}
        </p>

        {vitorias.length > 0 && (
          <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {vitorias.map((v) => (
              <a key={v.id} href={`/precos/loja/${v.slug}`} className="pj-tap rounded-2xl p-4 no-underline" style={estiloCartao}>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{v.nome}</p>
                <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 4 }}>
                  mais barato em <strong style={{ color: "var(--pj-brand-ink)" }}>{v.vitorias}</strong> de {v.presente}
                </p>
              </a>
            ))}
          </div>
        )}
        <NotaCadeias lojas={(vitorias.length ? vitorias : LOJAS_SEO).map((l) => l.nome)} />

        {maioresDiferencas.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Onde escolher a loja faz mais diferença hoje</h2>
            <ListaArtigos artigos={maioresDiferencas} />
          </>
        )}

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="hub" texto="Faz a lista e vê onde fica mais barata" />

        <h2 className="font-display" style={estiloH2}>Comparar duas cadeias</h2>
        <Pilulas itens={[{ href: "/comparar", texto: "Continente vs Pingo Doce, Lidl vs Aldi…" }]} />

        {porCategoria.map((c) => (
          <section key={c.slug}>
            <h2 className="font-display" style={estiloH2}>
              <a href={`/precos/categoria/${c.slug}`} style={{ color: "var(--pj-text)", textDecoration: "none" }}>{c.nome}</a>
            </h2>
            <Pilulas itens={c.artigos.map((a) => ({ href: `/precos/${a.slug}`, texto: a.nome, fraco: !a.comPreco }))} />
          </section>
        ))}
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const resumos = await resumosRecentes(hojeLisboa());
  const artigos = comComparacao(resumos);
  const comPreco = new Set(artigos.map((a) => a.slug));
  const atualizado = artigos.reduce((m, a) => (a.atualizado > m ? a.atualizado : m), "") || null;
  return {
    props: paraProps({
      artigos: artigos.length,
      vitorias: vitoriasPorLoja(artigos),
      maioresDiferencas: [...artigos].sort((a, b) => b.pct - a.pct).slice(0, 10).map((a) => paraLista(a)),
      porCategoria: CATEGORIAS_SEO.map((c) => ({
        ...c,
        artigos: ARTIGOS_SEO.filter((a) => a.categoria === c.slug).map((a) => ({ slug: a.slug, nome: a.nome, comPreco: comPreco.has(a.slug) })),
      })),
      atualizado,
    }),
    revalidate: 10800,
  };
}
