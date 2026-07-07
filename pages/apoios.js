import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import dadosApoios from "../public/apoios.json";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — apoios e benefícios do Estado.
 * Estática; alvo: "apoios do estado 2026", "tarifa social eletricidade",
 * e o nome de cada apoio individualmente (âncoras por id).
 */
export default function Apoios({ apoios, categorias, atualizado }) {
  const nomeCat = Object.fromEntries(categorias.map(c => [c.id, c.nome]));
  return (
    <LayoutPublico>
      <Head>
        <title>Apoios do Estado {new Date(atualizado).getFullYear()} — {apoios.length} benefícios a que podes ter direito | PoupeJá</title>
        <meta name="description" content={`${apoios.length} apoios e benefícios oficiais em Portugal — tarifa social de eletricidade e gás, passes, habitação e mais. Quem pode pedir e como, com link direto para o Estado.`} />
        <link rel="canonical" href={`${SITE_URL}/apoios`} />
        <meta property="og:title" content={`Apoios do Estado — ${apoios.length} benefícios a que podes ter direito`} />
        <meta property="og:description" content="Quem pode pedir e como requerer, com links diretos para os serviços oficiais." />
        <meta property="og:url" content={`${SITE_URL}/apoios`} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Estado Português · atualizado a {new Date(atualizado).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Apoios do Estado a que podes ter direito
        </h1>
        <p style={{ fontSize: 14.5, color: "#5c6b62", lineHeight: 1.6, marginTop: 12 }}>
          {apoios.length} apoios e benefícios oficiais, com quem pode pedir, como requerer e
          link direto para o serviço do Estado. Sem intermediários, sem custos.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {apoios.map(a => (
            <article key={a.id} id={a.id} className="rounded-2xl p-5" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                {nomeCat[a.categoria] || a.categoria}
              </p>
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{a.titulo}</h2>
              {a.valor && <p style={{ fontSize: 14, fontWeight: 600, color: "#0b6b4f", marginTop: 4 }}>{a.valor}</p>}
              <p style={{ fontSize: 13.5, color: "#5c6b62", lineHeight: 1.6, marginTop: 8 }}>{a.descricao}</p>
              {a.quemPode?.length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#14231c", marginTop: 12 }}>Quem pode pedir</p>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {a.quemPode.map((q, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#5c6b62", lineHeight: 1.6 }}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
              {a.link && (
                <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-block no-underline mt-3" style={{ fontSize: 13, fontWeight: 600, color: "#0b6b4f" }}>
                  Ver no site oficial →
                </a>
              )}
            </article>
          ))}
        </div>

        <CtaApp texto="Pesquisa e filtra os apoios na app — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: {
      apoios: dadosApoios.apoios || [],
      categorias: dadosApoios.categorias || [],
      atualizado: dadosApoios.atualizado || null,
    },
    revalidate: 3600,
  };
}
