import Head from "next/head";
import { URL_SITE } from "./lib/site";

/*
 * O que a home (/) mostra antes de a app hidratar — e portanto o que o
 * Google vê. Antes disto o servidor devolvia uma página vazia e o texto
 * indexado era o do primeiro slide do onboarding, sem links.
 * Depois de hidratar, a app abre por cima (como convidado, se não houver
 * sessão), por isso isto só se vê uma fração de segundo a quem tem JS.
 */

const TITULO = "PoupeJá — Folhetos, lista de compras e combustível mais barato";
const DESCRICAO = "Folhetos de 9 supermercados, uma lista de compras que diz onde fica mais barata e os postos de combustível mais baratos perto de ti. Grátis e sem registo.";

export function HeadInicio() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PoupeJá",
    url: URL_SITE,
    inLanguage: "pt-PT",
    description: DESCRICAO,
  };
  return (
    <Head>
      <title key="title">{TITULO}</title>
      <meta name="description" content={DESCRICAO} />
      <link rel="canonical" href={URL_SITE} />
      <meta property="og:title" content={TITULO} key="og:title" />
      <meta property="og:description" content={DESCRICAO} key="og:description" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Head>
  );
}

const BLOCOS = [
  { href: "/folhetos", t: "Folhetos desta semana", d: "Aldi, Auchan, Continente, E.Leclerc, Intermarché, Lidl, Pingo Doce e mais, num só sítio." },
  { href: "/combustiveis", t: "Combustível mais barato", d: "Preços oficiais da DGEG, por concelho, atualizados todos os dias." },
  { href: "/receitas", t: "Receitas baratas", d: "Pratos para a semana com ingredientes simples." },
  { href: "/apoios", t: "Apoios do Estado", d: "O que existe, quem pode pedir e onde requerer." },
];

export default function ConteudoPublicoInicio() {
  return (
    <main className="mx-auto px-5 py-12" style={{ maxWidth: 720, color: "var(--pj-text)", minHeight: "100vh", background: "var(--pj-surface)" }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--pj-text-faint)" }}>PoupeJá</p>
      <h1 className="font-display" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
        Folhetos, lista de compras e combustível mais barato — num só sítio
      </h1>
      <p style={{ fontSize: 15, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
        Grátis e sem registo. Vê os folhetos da semana, descobre onde a tua lista de compras fica mais barata
        e onde atestar o carro perto de ti.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 12 }}>
        {BLOCOS.map(b => (
          <li key={b.href}>
            <a href={b.href} className="no-underline" style={{ display: "block", padding: "14px 16px", borderRadius: 14, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "inherit" }}>
              <strong style={{ display: "block", fontSize: 15 }}>{b.t}</strong>
              <span style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>{b.d}</span>
            </a>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 24 }}>
        Independente: não é um serviço do Estado nem está ligado às cadeias de supermercados.{" "}
        <a href="/fontes" style={{ color: "var(--pj-brand-ink)" }}>Ver fontes</a>
      </p>
    </main>
  );
}
