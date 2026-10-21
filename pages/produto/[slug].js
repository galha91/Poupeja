import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, GraficoHistorico, TabelaPrecos, NotaCadeias, Pilulas, ListaArtigos, Migalhas,
  estiloH1, estiloH2, estiloTexto,
} from "../../PaginasPrecos";
import { ofertasProduto, serieProduto, frasesProduto, metaProduto, produtoMarcaLd } from "../../lib/seoMarcas";
import { gruposMarca, diasDoGrupo } from "../../lib/seoMarcasDados";
import { ARTIGOS_SEO, breadcrumbLd, linkApp, hojeLisboa, normalizarQ } from "../../lib/seoPrecos";
import { resumosRecentes } from "../../lib/seoPrecosDados";
import { URL_SITE } from "../../lib/site";

/*
 * Página pública SEO — um produto de marca, cadeia a cadeia.
 * Alvo: "preço leite mimosa", "azeite gallo continente vs pingo doce".
 * Mesmo produto e tamanho em todas as linhas (ver lib/seoMarcas.agrupar),
 * por isso compara-se o preço da embalagem. Só com duas cadeias vai para o
 * Google; com uma, existe (há links para ela) mas com noindex.
 */
export default function Produto({ grupo, dados, serie, frases, meta, generico, outros }) {
  const canonical = `${URL_SITE}/produto/${grupo.slug}`;
  const passos = [
    { nome: "PoupeJá", path: "/" },
    { nome: "Marcas", path: "/marcas" },
    { nome: grupo.marca, path: `/marca/${grupo.marcaSlug}` },
    { nome: grupo.nome, path: `/produto/${grupo.slug}` },
  ];
  const ld = produtoMarcaLd(URL_SITE, grupo, dados);
  const imagem = dados.ofertas.find((o) => o.imagem)?.imagem;
  const unidade = grupo.unidade === "l" ? "L" : grupo.unidade;

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
        {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <div className="flex items-center" style={{ gap: 14, marginTop: 10 }}>
          {imagem && (
            <img src={imagem} alt={grupo.nome} width={64} height={64} loading="lazy" decoding="async"
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12, background: "#fff", flexShrink: 0 }} />
          )}
          <h1 className="font-display" style={{ ...estiloH1, marginTop: 0 }}>Preço {grupo.nome} hoje</h1>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={dados.atualizado} /></p>

        {frases.map((f, i) => <p key={i} style={i === 0 ? { ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 } : estiloTexto}>{f}</p>)}

        {dados.ofertas.length > 0 && <TabelaPrecos ofertas={dados.ofertas} unidade={unidade} />}
        <NotaCadeias lojas={dados.ofertas.map((o) => o.lojaNome)} />

        <GraficoHistorico serie={serie} unidade="embalagem" />

        {generico?.vencedor && (
          <p style={{ ...estiloTexto, marginTop: 20 }}>
            Sem olhar à marca, o <a href={`/precos/${generico.slug}`} style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>{generico.nome.toLowerCase()} mais barato</a> hoje
            está no {generico.vencedor.lojaNome}, a {generico.vencedor.valorTxt}.
          </p>
        )}

        <BotaoAbrirPoupeja href={linkApp(grupo.q)} tipo="produto" texto="Comparar na app e juntar à lista" />

        {outros.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Mais {grupo.marca}</h2>
            <ListaArtigos artigos={outros} />
          </>
        )}

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          ...(generico ? [{ href: `/precos/${generico.slug}`, texto: `Preço de ${generico.nome.toLowerCase()} (todas as marcas)` }] : []),
          { href: `/marca/${grupo.marcaSlug}`, texto: `Todos os produtos ${grupo.marca}` },
          { href: "/precos", texto: "Preços de supermercado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const hoje = hojeLisboa();
  const grupos = await gruposMarca(hoje);
  const g = grupos.find((x) => x.slug === params.slug);
  if (!g) return { notFound: true, revalidate: 3600 };
  const [dias, resumos] = await Promise.all([diasDoGrupo(g, hoje), resumosRecentes(hoje)]);
  const dados = ofertasProduto(g, hoje);
  const grupo = { slug: g.slug, nome: g.nome, marca: g.marca, marcaSlug: g.marcaSlug, q: g.q, unidade: g.unidade };

  // O artigo genérico desta pesquisa, se for do catálogo (leite meio gordo, azeite…).
  const art = ARTIGOS_SEO.find((a) => a.q === normalizarQ(g.q));
  const r = art ? resumos.get(art.slug) : null;
  const generico = art ? {
    slug: art.slug, nome: art.nomeCurto,
    vencedor: r?.indexavel ? { lojaNome: r.ofertas[0].lojaNome, valorTxt: `${r.ofertas[0].valor.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${r.unidade && r.unidade !== "embalagem" ? `/${r.unidade}` : ""}` } : null,
  } : null;

  const outros = grupos
    .filter((x) => x.marcaSlug === g.marcaSlug && x.slug !== g.slug)
    .map((x) => ({ x, d: ofertasProduto(x, hoje) }))
    .filter(({ d }) => d.ofertas.length)
    .sort((a, b) => b.d.ofertas.length - a.d.ofertas.length)
    .slice(0, 8)
    .map(({ x, d }) => ({
      slug: x.slug, nome: x.nome, unidade: "embalagem", href: `/produto/${x.slug}`,
      contexto: `${d.ofertas.length} cadeia${d.ofertas.length > 1 ? "s" : ""} · mais barato no ${d.ofertas[0].lojaNome}`,
      vencedor: { lojaNome: d.ofertas[0].lojaNome, valor: d.ofertas[0].preco },
    }));

  return {
    props: JSON.parse(JSON.stringify({
      grupo, dados, serie: serieProduto(g, dias), frases: frasesProduto(g, dados, hoje), meta: metaProduto(g, dados), generico, outros,
    })),
    revalidate: 10800,
  };
}
