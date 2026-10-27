import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, BotaoAlertaPreco, GraficoHistorico, TabelaPrecos, NotaCadeias, Pilulas, ListaArtigos, Migalhas,
  estiloH1, estiloH2, estiloTexto,
} from "../../PaginasPrecos";
import {
  ARTIGOS_SEO, LOJAS_SEO, PARES, artigoPorSlug, montarArtigo, frasesArtigo, metaArtigo, produtoLd, breadcrumbLd,
  receitasComArtigo, linkApp, linkAlerta, hojeLisboa,
} from "../../lib/seoPrecos";
import { historicoArtigo, resumosRecentes, paraProps } from "../../lib/seoPrecosDados";
import { gruposMarca } from "../../lib/seoMarcasDados";
import { ofertasProduto } from "../../lib/seoMarcas";
import { receitas } from "../../lib/receitas/motor";
import { URL_SITE } from "../../lib/site";

/*
 * Página pública SEO — o preço de um artigo hoje, cadeia a cadeia.
 * Alvo: "preço do azeite hoje", "azeite mais barato continente vs pingo
 * doce". ISR: HTML estático, regenerado de 3 em 3 horas com os preços que
 * o cron diário e as pesquisas na app vão guardando.
 *
 * Sem pelo menos 2 cadeias com preço recente, a página continua a existir
 * (há links para ela), mas sai com noindex e fora do sitemap.
 */
export default function PrecoArtigo({ artigo, dados, frases, meta, relacionados, receitasLigadas, pares, marcas = [] }) {
  const canonical = `${URL_SITE}/precos/${artigo.slug}`;
  const passos = [
    { nome: "PoupeJá", path: "/" },
    { nome: "Preços", path: "/precos" },
    { nome: artigo.categoriaNome, path: `/precos/categoria/${artigo.categoria}` },
    { nome: artigo.nomeCurto, path: `/precos/${artigo.slug}` },
  ];
  const produto = dados.indexavel ? produtoLd(URL_SITE, artigo, dados) : null;

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{meta.titulo}</title>
        <meta name="description" content={meta.descricao} />
        {!dados.indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={meta.titulo.replace(/ \| PoupeJá$/, "")} key="og:title" />
        <meta property="og:description" content={meta.descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        {produto && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(produto) }} />}
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>
          Preço de {artigo.nomeCurto.toLowerCase()} hoje
        </h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}>
          <Atualizado dia={dados.atualizado} />
        </p>

        {frases.length > 0
          ? frases.map((f, i) => <p key={i} style={i === 0 ? { ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 } : estiloTexto}>{f}</p>)
          : (
            <p style={estiloTexto}>
              Ainda não temos preços recentes de {artigo.nomeCurto.toLowerCase()} em duas cadeias. Na app, a pesquisa vai
              às lojas no momento e mostra o preço de hoje.
            </p>
          )}

        {dados.ofertas.length > 0 && <TabelaPrecos ofertas={dados.ofertas} unidade={dados.unidade} />}
        <NotaCadeias lojas={dados.ofertas.length >= 2 ? dados.ofertas.map((o) => o.lojaNome) : LOJAS_SEO.map((l) => l.nome)} />

        {/* Histórico: o melhor preço de cada dia (só com 7+ dias de dados). */}
        <GraficoHistorico serie={dados.serie} unidade={dados.unidade} />

        <BotaoAlertaPreco
          href={linkAlerta(artigo.q)}
          detalhe={`Escolhe o preço e recebe uma notificação quando ${artigo.nomeCurto.toLowerCase()} baixar em qualquer cadeia.`}
        />

        <BotaoAbrirPoupeja href={linkApp(artigo.q)} tipo="preco" texto={`Comparar ${artigo.nomeCurto.toLowerCase()} na app e juntar à lista`} />

        {marcas.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>{artigo.nomeCurto} por marca</h2>
            <ListaArtigos artigos={marcas} />
          </>
        )}

        {receitasLigadas.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Receitas baratas com {artigo.nomeCurto.toLowerCase()}</h2>
            <Pilulas itens={receitasLigadas.map((r) => ({ href: `/receitas/${r.id}`, texto: r.nome }))} />
          </>
        )}

        {relacionados.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Mais preços em {artigo.categoriaNome.toLowerCase()}</h2>
            <ListaArtigos artigos={relacionados} />
          </>
        )}

        {pares.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Comparar supermercados</h2>
            <Pilulas itens={[
              ...pares.map((p) => ({ href: `/comparar/${p.slug}`, texto: `${p.a} vs ${p.b}` })),
              { href: "/precos", texto: "Todos os preços", fraco: true },
            ]} />
          </>
        )}
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: ARTIGOS_SEO.map((a) => ({ params: { artigo: a.slug } })), fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const artigo = artigoPorSlug(params.artigo);
  if (!artigo) return { notFound: true };
  const hoje = hojeLisboa();
  const [linhas, resumos] = await Promise.all([historicoArtigo(artigo.q, hoje), resumosRecentes(hoje)]);
  const dados = montarArtigo(linhas, hoje);

  // Mesma categoria: primeiro os que têm comparação, para o link valer alguma coisa.
  const relacionados = ARTIGOS_SEO
    .filter((a) => a.categoria === artigo.categoria && a.slug !== artigo.slug)
    .map((a) => {
      const d = resumos.get(a.slug);
      return { slug: a.slug, nome: a.nome, unidade: d?.unidade ?? null, vencedor: d?.indexavel ? d.ofertas[0] : null };
    })
    .sort((x, y) => Number(!!y.vencedor) - Number(!!x.vencedor))
    .slice(0, 8);

  // As comparações entre as cadeias que têm este artigo.
  const presentes = new Set(dados.ofertas.map((o) => o.loja));
  const pares = PARES.filter((p) => presentes.has(p.a.id) && presentes.has(p.b.id)).slice(0, 4)
    .map((p) => ({ slug: p.slug, a: p.a.nome, b: p.b.nome }));

  // Produtos de marca desta pesquisa, os comparáveis primeiro.
  const marcas = (await gruposMarca(hoje))
    .filter((g) => g.q === artigo.q)
    .map((g) => ({ g, d: ofertasProduto(g, hoje) }))
    .filter(({ d }) => d.ofertas.length)
    .sort((a, b) => b.d.ofertas.length - a.d.ofertas.length || a.d.ofertas[0].preco - b.d.ofertas[0].preco)
    .slice(0, 8)
    .map(({ g, d }) => ({
      slug: g.slug, nome: g.nome, href: `/produto/${g.slug}`, unidade: "embalagem",
      contexto: `${d.ofertas.length} cadeia${d.ofertas.length > 1 ? "s" : ""} · mais barato no ${d.ofertas[0].lojaNome}`,
      vencedor: { lojaNome: d.ofertas[0].lojaNome, valor: d.ofertas[0].preco },
    }));

  return {
    props: paraProps({
      artigo,
      dados,
      marcas,
      frases: frasesArtigo(artigo, dados, hoje),
      meta: metaArtigo(artigo, dados),
      relacionados,
      receitasLigadas: receitasComArtigo(artigo, receitas()),
      pares,
    }),
    revalidate: 10800,
  };
}
