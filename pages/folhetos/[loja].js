import Head from "next/head";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import dadosFolhetos from "../../public/folhetos.json";
import { slugify, LOGO, LOJAS_SLUGS } from "../../lib/seo-slugs";
import { semanaAtual } from "../../lib/semana-atual";
import { ListaArtigos } from "../../PaginasPrecos";
import { LOJAS_SEO, comComparacao, paraLista, hojeLisboa } from "../../lib/seoPrecos";
import { resumosRecentes } from "../../lib/seoPrecosDados";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — folheto de uma loja específica.
 * Estática (revalida de hora a hora); alvo: "folheto continente",
 * "folheto pingo doce esta semana", etc. Interliga com as outras lojas.
 */
export default function FolhetoLoja({ folheto, outras, semana, atualizadoEm, precos = null }) {
  const slug = slugify(folheto.loja);
  const descricao = `Folheto ${folheto.loja} desta semana, com link direto para o folheto oficial. Grátis, com aviso semanal na app PoupeJá.`;

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{`Folheto ${folheto.loja} desta Semana — promoções e descontos | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${SITE_URL}/folhetos/${slug}`} />
        <meta property="og:title" content={`Folheto ${folheto.loja} desta semana`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/folhetos/${slug}`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "PoupeJá", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Folhetos", item: `${SITE_URL}/folhetos` },
            { "@type": "ListItem", position: 3, name: `Folheto ${folheto.loja}`, item: `${SITE_URL}/folhetos/${slug}` },
          ],
        }) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        {/* Semana como contexto, uma vez — não como validade desta loja. */}
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          {semana ? `Semana de ${semana}` : "Folhetos"}
          {atualizadoEm
            ? ` · link verificado a ${new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}`
            : ""}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Folheto {folheto.loja} desta semana
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          Link direto para o folheto oficial do {folheto.loja}. Na app PoupeJá recebes um{" "}
          <strong style={{ color: "var(--pj-text)" }}>aviso todas as semanas</strong> quando sai o folheto novo.
        </p>

        {/* Cartão do folheto */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <div className="flex items-center gap-3.5">
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, borderRadius: 14, background: "var(--pj-subtle)" }}>
              {LOGO[folheto.loja]
                ? <img src={`/logos/${LOGO[folheto.loja]}.svg`} alt={folheto.loja} width={30} height={30} style={{ objectFit: "contain" }} />
                : <span style={{ fontSize: 17, fontWeight: 700, color: "var(--pj-text-strong)" }}>{folheto.loja[0]}</span>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{folheto.titulo}</p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 1 }}>
                As datas de validade estão no folheto oficial
              </p>
            </div>
          </div>
          <a
            href={folheto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pj-alvo inline-block no-underline mt-4"
            style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}
          >
            Ver folheto oficial →
          </a>
        </div>

        {/* Porquê ver o folheto */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Porque vale a pena ver o folheto todas as semanas
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Os folhetos do {folheto.loja} mudam normalmente todas as semanas, e é neles que
          aparecem os descontos em produtos do dia a dia. Antes de ires às compras, vê o
          folheto da semana e aponta o que já compras habitualmente — assim aproveitas as
          promoções sem comprar por impulso. Comparar o mesmo produto entre lojas também
          ajuda: o que está em promoção numa cadeia pode estar mais barato noutra sem
          desconto nenhum.
        </p>

        {/* O que a comparação de preços diz desta cadeia hoje — é o que
            torna esta página diferente das dos outros folhetos. */}
        {precos?.ganha?.length > 0 ? (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 6 }}>
              Onde o {folheto.loja} é mais barato hoje
            </h2>
            <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginBottom: 14 }}>
              Fora do folheto, nos preços do site: o {folheto.loja} é o mais barato em{" "}
              <strong style={{ color: "var(--pj-text)" }}>{precos.total} dos {precos.comparados} artigos</strong> que comparamos com outras cadeias.
            </p>
            <ListaArtigos artigos={precos.ganha} mostrarLoja={false} />
            <a href={`/precos/loja/${precos.slug}`} className="pj-alvo inline-block no-underline mt-4" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
              Ver todos os preços do {folheto.loja} →
            </a>
          </>
        ) : precos?.semPrecos ? (
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 24 }}>
            O {folheto.loja} não publica os preços online, por isso não entra na nossa{" "}
            <a href="/precos" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>comparação de preços</a>: o folheto é a melhor forma de ver as promoções.
          </p>
        ) : null}

        {/* Interligação com outras lojas */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Folhetos de outras lojas
        </h2>
        <div className="flex flex-wrap gap-2">
          {outras.map(o => (
            <a
              key={o.slug}
              href={`/folhetos/${o.slug}`}
              className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
            >
              Folheto {o.loja}
            </a>
          ))}
          <a
            href="/folhetos"
            className="pj-tap no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
          >
            Todos os folhetos
          </a>
        </div>

        <CtaApp texto="Recebe os folhetos novos toda a semana — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return {
    paths: LOJAS_SLUGS.map(l => ({ params: { loja: l.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const folheto = (dadosFolhetos.folhetos || []).find(f => slugify(f.loja) === params.loja);
  if (!folheto) return { notFound: true };
  const { semana, atualizadoEm } = semanaAtual();
  const { validade, ...semValidade } = folheto; // a de junho, fixa, nunca foi verdade
  const loja = LOJAS_SEO.find(l => l.nome === folheto.loja);
  let precos = { semPrecos: !loja };
  if (loja) {
    const artigos = comComparacao(await resumosRecentes(hojeLisboa()));
    const comparados = artigos.filter(a => a.ofertas.some(o => o.loja === loja.id));
    const ganha = comparados.filter(a => a.vencedor.loja === loja.id).sort((a, b) => b.pct - a.pct);
    precos = { slug: loja.slug, comparados: comparados.length, total: ganha.length, ganha: ganha.slice(0, 8).map(a => paraLista(a)) };
  }
  return {
    props: {
      folheto: semValidade,
      precos: JSON.parse(JSON.stringify(precos)),
      semana,
      outras: LOJAS_SLUGS.filter(l => l.slug !== params.loja),
      atualizadoEm,
    },
    revalidate: 3600,
  };
}
