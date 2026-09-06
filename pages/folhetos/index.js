import Head from "next/head";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import dadosFolhetos from "../../public/folhetos.json";
import { slugify, LOGO } from "../../lib/seo-slugs";
import { semanaAtual } from "../../lib/semana-atual";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — folhetos dos supermercados desta semana.
 * Estática (revalida de hora a hora); alvo: "folheto continente",
 * "folheto lidl esta semana", etc.
 */
export default function Folhetos({ folhetos, semana, atualizadoEm }) {
  const lojas = folhetos.map(f => f.loja).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Folhetos dos supermercados desta semana",
    numberOfItems: folhetos.length,
    itemListElement: folhetos.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Folheto ${f.loja}`,
      url: `${SITE_URL}/folhetos/${slugify(f.loja)}`,
    })),
  };
  return (
    <LayoutPublico>
      <Head>
        <title>Folhetos dos Supermercados desta Semana — {folhetos.slice(0, 4).map(f => f.loja).join(", ")} e mais | PoupeJá</title>
        <meta name="description" content={`Todos os folhetos e promoções da semana num só sítio: ${lojas}. Links diretos e grátis, com aviso semanal na app PoupeJá.`} />
        <link rel="canonical" href={`${SITE_URL}/folhetos`} />
        <meta property="og:title" content="Folhetos dos supermercados desta semana" key="og:title" />
        <meta property="og:description" content={`${lojas} — links diretos para os folhetos oficiais.`} key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/folhetos`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          {semana ? `Semana de ${semana} · ` : ""}
          links verificados a {new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Folhetos dos supermercados desta semana
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          Links diretos para os folhetos oficiais de {folhetos.length} supermercados em Portugal.
          Na app PoupeJá recebes um <strong style={{ color: "var(--pj-text)" }}>aviso todas as semanas</strong> quando
          saem folhetos novos.
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {folhetos.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}
            >
              <a href={`/folhetos/${slugify(f.loja)}`} className="flex items-center gap-3.5 no-underline" style={{ flex: 1, minWidth: 0 }}>
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--pj-subtle)" }}>
                  {LOGO[f.loja]
                    ? <img src={`/logos/${LOGO[f.loja]}.svg`} alt={f.loja} width={26} height={26} style={{ objectFit: "contain" }} />
                    : <span style={{ fontSize: 15, fontWeight: 700, color: "var(--pj-text-strong)" }}>{f.loja[0]}</span>}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>Folheto {f.loja}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 1 }}>Ver folheto oficial</span>
                </span>
              </a>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline flex-shrink-0"
                style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}
              >
                Ver →
              </a>
            </div>
          ))}
        </div>

        <CtaApp texto="Recebe os folhetos novos toda a semana — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const { semana, atualizadoEm } = semanaAtual();
  return {
    props: {
      // Sem validade por loja — ver lib/semana-atual.js. A do ficheiro é de
      // junho, fixa e igual para todas; nunca descreveu folheto nenhum.
      folhetos: (dadosFolhetos.folhetos || []).map(({ validade, ...f }) => f),
      semana,
      atualizadoEm,
    },
    revalidate: 3600,
  };
}
