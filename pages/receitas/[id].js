import Head from "next/head";
import { Clock, Users, Leaf, ChefHat } from "lucide-react";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { EMENTAS, emojiIngrediente } from "../../lib/ementas-data";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — uma receita económica.
 * Estática; alvo: "receita caldo verde barata", "jantar económico 4 pessoas", etc.
 * O JSON-LD Recipe torna-a elegível para rich results do Google (cartões de receita).
 */
export default function Receita({ receita, outras }) {
  const descricao = `Receita económica de ${receita.nome} para 4 pessoas, pronta em ${receita.tempoMin} minutos. Ingredientes com quantidades e passo a passo simples — poupa nas compras com o PoupeJá.`;
  const ogImage = `${SITE_URL}/api/og?v=receita&nome=${encodeURIComponent(receita.nome)}&tempo=${receita.tempoMin}&custo=${receita.custo}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: receita.nome,
    description: descricao,
    image: [ogImage],
    author: { "@type": "Organization", name: "PoupeJá", url: SITE_URL },
    recipeYield: "4 pessoas",
    totalTime: `PT${receita.tempoMin}M`,
    recipeCuisine: "Portuguesa",
    recipeCategory: "Prato principal",
    keywords: `receita barata, receita económica, ${receita.nome.toLowerCase()}, jantar para 4 pessoas`,
    recipeIngredient: receita.ingredientes.map(i => `${i.nome} — ${i.qtd}`),
    recipeInstructions: receita.passos.map((p, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: p,
    })),
    ...(receita.veg ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
  };

  return (
    <LayoutPublico>
      <Head>
        <title>{`${receita.nome} — receita barata para 4 pessoas (${receita.tempoMin} min) | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${SITE_URL}/receitas/${receita.id}`} />
        <meta property="og:title" content={`${receita.nome} — receita barata para 4 pessoas`} />
        <meta property="og:description" content={descricao} />
        <meta property="og:url" content={`${SITE_URL}/receitas/${receita.id}`} />
        <meta property="og:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          <a href="/receitas" style={{ color: "var(--pj-text-faint)" }}>Receitas baratas</a>
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          {receita.emoji} {receita.nome}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 12 }}>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {receita.tempoMin} min</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} /> 4 pessoas</span>
          <span style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>
            {"€".repeat(receita.custo)}<span style={{ color: "#cfccbf" }}>{"€".repeat(3 - receita.custo)}</span>
            {" "}{receita.custo === 1 ? "muito barata" : "barata"}
          </span>
          {receita.airfryer && <span className="inline-flex items-center gap-1.5"><ChefHat size={13} /> air fryer</span>}
          {receita.veg && <span className="inline-flex items-center gap-1.5"><Leaf size={13} /> vegetariano</span>}
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>
          Ingredientes
        </h2>
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {receita.ingredientes.map((ing, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ fontSize: 14, fontWeight: ing.despensa ? 500 : 600, color: ing.despensa ? "var(--pj-text-faint)" : "var(--pj-text)" }}>
                {emojiIngrediente(ing.nome)} {ing.nome}{ing.despensa ? " · da despensa" : ""}
              </span>
              <span style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>{ing.qtd}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 10 }}>
          Os ingredientes "da despensa" são básicos que quase toda a gente tem em casa.
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>
          Preparação
        </h2>
        <ol className="flex flex-col gap-3" style={{ paddingLeft: 0, listStyle: "none" }}>
          {receita.passos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center" style={{ background: "var(--pj-brand)", fontSize: 12, fontWeight: 600, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, color: "var(--pj-text-strong)", lineHeight: 1.6 }}>{p}</span>
            </li>
          ))}
        </ol>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Quanto custa esta receita?
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Indicamos uma faixa de custo ({"€".repeat(receita.custo)}) em vez de um total ao cêntimo,
          porque os preços variam por loja e época. Para pagares o mínimo, espreita os{" "}
          <a href="/folhetos" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>folhetos dos supermercados desta semana</a>{" "}
          antes de ires às compras — na app PoupeJá os ingredientes desta receita entram na tua lista
          de compras num toque.
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Mais receitas baratas
        </h2>
        <div className="flex flex-wrap gap-2">
          {outras.map(o => (
            <a
              key={o.id}
              href={`/receitas/${o.id}`}
              className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
            >
              {o.emoji} {o.nome}
            </a>
          ))}
          <a
            href="/receitas"
            className="pj-tap no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text-muted)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
          >
            Todas as receitas
          </a>
        </div>

        <CtaApp texto="Mete os ingredientes na lista de compras num toque — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return {
    paths: EMENTAS.map(e => ({ params: { id: e.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const receita = EMENTAS.find(e => e.id === params.id);
  if (!receita) return { notFound: true };
  return {
    props: {
      receita,
      outras: EMENTAS.filter(e => e.id !== params.id).map(e => ({ id: e.id, nome: e.nome, emoji: e.emoji })),
    },
  };
}
