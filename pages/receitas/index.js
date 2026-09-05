import Head from "next/head";
import { Clock, ChefHat, Leaf } from "lucide-react";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { EMENTAS } from "../../lib/ementas-data";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — receitas económicas para 4 pessoas.
 * Estática; alvo: "receitas baratas", "receitas económicas",
 * "jantar barato para 4 pessoas", "refeições económicas".
 */
export default function Receitas() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Receitas baratas para 4 pessoas",
    numberOfItems: EMENTAS.length,
    itemListElement: EMENTAS.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.nome,
      url: `${SITE_URL}/receitas/${e.id}`,
    })),
  };
  return (
    <LayoutPublico>
      <Head>
        <title>{`Receitas Baratas para 4 Pessoas — ${EMENTAS.length} refeições económicas | PoupeJá`}</title>
        <meta name="description" content={`${EMENTAS.length} receitas portuguesas baratas para 4 pessoas, com ingredientes, quantidades e passo a passo. Sopas, massas, arroz, frango e pratos vegetarianos — grátis, sem registo.`} />
        <link rel="canonical" href={`${SITE_URL}/receitas`} />
        <meta property="og:title" content="Receitas baratas para 4 pessoas" key="og:title" />
        <meta property="og:description" content={`${EMENTAS.length} refeições económicas portuguesas com passo a passo — e os ingredientes entram na lista de compras num toque.`} key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/receitas`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Cozinha económica
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Receitas baratas para 4 pessoas
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          {EMENTAS.length} receitas portuguesas económicas, com quantidades certas e passo a passo simples.
          Na app PoupeJá os ingredientes de cada receita entram na tua{" "}
          <strong style={{ color: "var(--pj-text)" }}>lista de compras num toque</strong> — e vês os folhetos
          antes de ir às compras.
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          {EMENTAS.map((e, i) => (
            <a
              key={e.id}
              href={`/receitas/${e.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{e.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{e.nome}</span>
                <span className="flex items-center gap-2.5" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {e.tempoMin} min</span>
                  <span style={{ fontWeight: 600, color: "var(--pj-brand-ink)" }}>{"€".repeat(e.custo)}</span>
                  {e.airfryer && <span className="inline-flex items-center gap-1"><ChefHat size={11} /> air fryer</span>}
                  {e.veg && <span className="inline-flex items-center gap-1"><Leaf size={11} /> vegetariano</span>}
                </span>
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)", flexShrink: 0 }}>Ver →</span>
            </a>
          ))}
        </div>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Comer bem por pouco — como funciona
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Todas as receitas usam ingredientes baratos e fáceis de encontrar em qualquer supermercado
          português. Indicamos faixas de custo (€ = mais barato) em vez de totais ao cêntimo, porque
          os preços variam por loja e época. O truque para poupar de verdade: escolhe as receitas da
          semana, mete os ingredientes na lista e espreita os <a href="/folhetos" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>folhetos dos supermercados</a>{" "}
          antes de sair de casa.
        </p>

        <CtaApp texto="Mete os ingredientes na lista de compras num toque — grátis" />
      </div>
    </LayoutPublico>
  );
}
