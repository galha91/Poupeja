import Head from "next/head";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import dadosFolhetos from "../../public/folhetos.json";
import { slugify, LOGO, LOJAS_SLUGS } from "../../lib/seo-slugs";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — folheto de uma loja específica.
 * Estática (revalida de hora a hora); alvo: "folheto continente",
 * "folheto pingo doce esta semana", etc. Interliga com as outras lojas.
 */
export default function FolhetoLoja({ folheto, outras, atualizadoEm }) {
  const slug = slugify(folheto.loja);
  const descricao = `Folheto ${folheto.loja} desta semana${folheto.validade ? ` (${folheto.validade})` : ""}, com link direto para o folheto oficial. Grátis, com aviso semanal na app PoupeJá.`;

  return (
    <LayoutPublico>
      <Head>
        <title>{`Folheto ${folheto.loja} desta Semana — promoções e descontos | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${SITE_URL}/folhetos/${slug}`} />
        <meta property="og:title" content={`Folheto ${folheto.loja} desta semana`} />
        <meta property="og:description" content={descricao} />
        <meta property="og:url" content={`${SITE_URL}/folhetos/${slug}`} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          {atualizadoEm
            ? `Atualizado a ${new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}`
            : "Folhetos"}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Folheto {folheto.loja} desta semana
        </h1>
        <p style={{ fontSize: 14.5, color: "#5c6b62", lineHeight: 1.6, marginTop: 12 }}>
          Link direto para o folheto oficial do {folheto.loja}. Na app PoupeJá recebes um{" "}
          <strong style={{ color: "#14231c" }}>aviso todas as semanas</strong> quando sai o folheto novo.
        </p>

        {/* Cartão do folheto */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
          <div className="flex items-center gap-3.5">
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, borderRadius: 14, background: "#eeece4" }}>
              {LOGO[folheto.loja]
                ? <img src={`/logos/${LOGO[folheto.loja]}.svg`} alt={folheto.loja} width={30} height={30} style={{ objectFit: "contain" }} />
                : <span style={{ fontSize: 17, fontWeight: 700, color: "#2c3b33" }}>{folheto.loja[0]}</span>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15.5, fontWeight: 600, color: "#14231c" }}>{folheto.titulo}</p>
              <p style={{ fontSize: 12.5, color: "#5c6b62", marginTop: 1 }}>
                {folheto.validade ? `Válido ${folheto.validade}` : "Consulta a validade no folheto oficial"}
              </p>
            </div>
          </div>
          <a
            href={folheto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block no-underline mt-4"
            style={{ fontSize: 13.5, fontWeight: 600, color: "#0b6b4f" }}
          >
            Ver folheto oficial →
          </a>
        </div>

        {/* Porquê ver o folheto */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Porque vale a pena ver o folheto todas as semanas
        </h2>
        <p style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.7, marginTop: 10 }}>
          Os folhetos do {folheto.loja} mudam normalmente todas as semanas, e é neles que
          aparecem os descontos em produtos do dia a dia. Antes de ires às compras, vê o
          folheto da semana e aponta o que já compras habitualmente — assim aproveitas as
          promoções sem comprar por impulso. Comparar o mesmo produto entre lojas também
          ajuda: o que está em promoção numa cadeia pode estar mais barato noutra sem
          desconto nenhum.
        </p>

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
              style={{ fontSize: 13, fontWeight: 600, color: "#0b6b4f", background: "#fbfaf6", border: "1px solid #e4e2d8", borderRadius: 12, padding: "8px 14px" }}
            >
              Folheto {o.loja}
            </a>
          ))}
          <a
            href="/folhetos"
            className="pj-tap no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: "#5c6b62", background: "#fbfaf6", border: "1px solid #e4e2d8", borderRadius: 12, padding: "8px 14px" }}
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
  return {
    props: {
      folheto,
      outras: LOJAS_SLUGS.filter(l => l.slug !== params.loja),
      atualizadoEm: dadosFolhetos.atualizadoEm || null,
    },
    revalidate: 3600,
  };
}
