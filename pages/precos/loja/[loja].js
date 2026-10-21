import Head from "next/head";
import LayoutPublico from "../../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas, estiloH1, estiloH2, estiloTexto,
} from "../../../PaginasPrecos";
import { LOJAS_SEO, PARES, lojaPorSlug, comComparacao, paraLista, vitoriasPorLoja, breadcrumbLd, hojeLisboa, porUnidade, euros } from "../../../lib/seoPrecos";
import { resumosRecentes, paraProps } from "../../../lib/seoPrecosDados";
import { URL_SITE } from "../../../lib/site";
import { cortar } from "../../../lib/seoFormato";

/*
 * Hub de uma cadeia: em que artigos é hoje a mais barata e, nos outros,
 * quanto fica acima de quem ganha. Alvo: "lidl preços", "continente mais
 * barato", e o caminho do Google para as comparações desta cadeia.
 */
export default function PrecosLoja({ loja, ganha, perde, total, posicao, atualizado, pares }) {
  const titulo = `Preços ${loja.nome} hoje: onde é mais barato | PoupeJá`;
  const descricao = total
    ? `O ${loja.nome} é hoje o mais barato em ${ganha.length} de ${total} artigos que comparamos. Vê quais, com preço por kg e por litro, e onde os outros estão mais baratos.`
    : `Preços do ${loja.nome} comparados com as outras cadeias, por kg e por litro. Grátis na app PoupeJá.`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Preços", path: "/precos" }, { nome: loja.nome, path: `/precos/loja/${loja.slug}` }];
  const indexavel = total >= 10;

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        {!indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/precos/loja/${loja.slug}`} />
        <meta property="og:title" content={`Preços ${loja.nome} hoje`} key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/precos/loja/${loja.slug}`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Onde o {loja.nome} é mais barato hoje</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>
          {total
            ? <>Dos <strong style={{ color: "var(--pj-text)" }}>{total} artigos</strong> do {loja.nome} que conseguimos comparar com outra cadeia, é o mais barato em <strong style={{ color: "var(--pj-text)" }}>{ganha.length}</strong>{posicao ? ` — o ${posicao}.º lugar entre as cadeias que comparamos` : ""}.</>
            : `Ainda não temos preços recentes do ${loja.nome} em artigos que outra cadeia também tenha.`}
        </p>

        {ganha.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Mais barato no {loja.nome}</h2>
            <ListaArtigos artigos={ganha} mostrarLoja={false} />
          </>
        )}
        <NotaCadeias lojas={LOJAS_SEO.map((l) => l.nome)} />

        {perde.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Mais barato noutra cadeia</h2>
            <ListaArtigos artigos={perde} />
          </>
        )}

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="loja" texto={`Vê se a tua lista fica mais barata no ${loja.nome}`} />

        <h2 className="font-display" style={estiloH2}>{loja.nome} frente a frente</h2>
        <Pilulas itens={pares.map((p) => ({ href: `/comparar/${p.slug}`, texto: p.texto }))} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: LOJAS_SEO.map((l) => ({ params: { loja: l.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const loja = lojaPorSlug(params.loja);
  if (!loja) return { notFound: true };
  const artigos = comComparacao(await resumosRecentes(hojeLisboa()));
  const comLoja = artigos.filter((a) => a.ofertas.some((o) => o.loja === loja.id));
  const ganha = comLoja.filter((a) => a.vencedor.loja === loja.id).sort((a, b) => b.pct - a.pct).map((a) => paraLista(a));
  const perde = comLoja.filter((a) => a.vencedor.loja !== loja.id).map((a) => {
    const minha = a.ofertas.find((o) => o.loja === loja.id);
    const pct = Math.round(((minha.valor - a.vencedor.valor) / minha.valor) * 100);
    const u = porUnidade(a.unidade);
    return paraLista(a, `No ${loja.nome} ${euros(minha.valor)} €${u} · ${pct}% mais barato no ${a.vencedor.lojaNome}`);
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const posicao = vitoriasPorLoja(artigos).findIndex((v) => v.id === loja.id) + 1 || null;
  return {
    props: paraProps({
      loja,
      ganha,
      perde,
      total: comLoja.length,
      posicao,
      atualizado: comLoja.reduce((m, a) => (a.atualizado > m ? a.atualizado : m), "") || null,
      pares: PARES.filter((p) => p.a.id === loja.id || p.b.id === loja.id).map((p) => ({ slug: p.slug, texto: `${p.a.nome} vs ${p.b.nome}` })),
    }),
    revalidate: 10800,
  };
}
