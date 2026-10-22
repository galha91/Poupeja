import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import dadosApoios from "../../public/apoios.json";
import dadosPrazos from "../../data/prazos-estado.json";
import { slugApoio, slugPrazo, prazosDoApoio } from "../../lib/seoEstado";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Página pública SEO — um apoio do Estado. Alvo: "tarifa social de
 * eletricidade como pedir", "passe sub23 quem tem direito". Até agora todos
 * os apoios viviam numa página só (/apoios), com âncoras; uma página por
 * apoio dá ao Google uma resposta por pesquisa. O conteúdo é o mesmo do
 * public/apoios.json, que é revisto contra as fontes oficiais.
 */
export default function Apoio({ apoio, categoria, atualizado, prazos, relacionados }) {
  const slug = slugApoio(apoio);
  const canonical = `${URL_SITE}/apoios/${slug}`;
  const ano = atualizado ? new Date(atualizado).getFullYear() : null;
  const titulo = [
    `${apoio.titulo}: quem pode pedir e como${ano ? ` (${ano})` : ""} | PoupeJá`,
    `${apoio.titulo}: quem pode pedir | PoupeJá`,
    `${apoio.titulo} | PoupeJá`,
  ].find((t) => t.length <= 60) || `${apoio.titulo} | PoupeJá`;
  const descricao = cortar(`${apoio.titulo}${apoio.valor ? ` — ${apoio.valor}` : ""}. ${apoio.descricao} Quem pode pedir e como requerer, com link oficial.`);
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Apoios do Estado", path: "/apoios" }, { nome: apoio.titulo, path: `/apoios/${slug}` }];
  const servicoLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: apoio.titulo,
    description: apoio.descricao,
    serviceType: categoria,
    areaServed: { "@type": "Country", name: "Portugal" },
    ...(apoio.link ? { url: apoio.link } : {}),
    ...(apoio.quemPode?.length ? { audience: { "@type": "Audience", audienceType: apoio.quemPode.join("; ") } } : {}),
  };

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={titulo.replace(/ \| PoupeJá$/, "")} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servicoLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{apoio.titulo}</h1>
        {apoio.valor && <p style={{ fontSize: 16, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 8 }}>{apoio.valor}</p>}
        <p style={estiloTexto}>{apoio.descricao}</p>

        {apoio.quemPode?.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Quem pode pedir</h2>
            <ul className="rounded-2xl p-5" style={{ ...estiloCartao, margin: 0, paddingLeft: 36 }}>
              {apoio.quemPode.map((q, i) => <li key={i} style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.7 }}>{q}</li>)}
            </ul>
          </>
        )}

        {apoio.comoRequerer && (
          <>
            <h2 className="font-display" style={estiloH2}>Como pedir</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>{apoio.comoRequerer}</p>
          </>
        )}

        {prazos.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Prazos</h2>
            <Pilulas itens={prazos.map((p) => ({ href: `/prazos/${p.slug}`, texto: `${p.titulo} · ${p.prazoTexto}` }))} />
          </>
        )}

        {apoio.link && (
          <a href={apoio.link} target="_blank" rel="noopener noreferrer" className="pj-tap flex items-center justify-between no-underline mt-8 rounded-2xl px-5 py-4"
            style={{ ...estiloCartao, color: "var(--pj-text)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Ver no site oficial</span>
            <span aria-hidden="true" style={{ color: "var(--pj-brand-ink)" }}>→</span>
          </a>
        )}
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 12 }}>
          Informação revista contra as fontes oficiais{atualizado ? ` a ${new Date(atualizado).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
          O PoupeJá é independente e não é um serviço do Estado; confirma sempre no site oficial antes de pedir.
        </p>

        {apoio.id === "abono-familia" && (
          <a href="/abono-de-familia" className="pj-tap flex items-center justify-between no-underline mt-6 rounded-2xl px-5 py-4" style={{ ...estiloCartao, color: "var(--pj-text)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Calcula o teu escalão e quanto recebes</span>
            <span aria-hidden="true" style={{ color: "var(--pj-brand-ink)" }}>→</span>
          </a>
        )}
        {apoio.id === "irs-jovem" && (
          <a href="/irs" className="pj-tap flex items-center justify-between no-underline mt-6 rounded-2xl px-5 py-4" style={{ ...estiloCartao, color: "var(--pj-text)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Escalões de IRS e em qual ficas</span>
            <span aria-hidden="true" style={{ color: "var(--pj-brand-ink)" }}>→</span>
          </a>
        )}
        {apoio.id.startsWith("tarifa-social") && (
          <a href="/tarifa-social" className="pj-tap flex items-center justify-between no-underline mt-6 rounded-2xl px-5 py-4" style={{ ...estiloCartao, color: "var(--pj-text)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Vê em 30 segundos se tens direito</span>
            <span aria-hidden="true" style={{ color: "var(--pj-brand-ink)" }}>→</span>
          </a>
        )}

        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="apoio" texto="Vê na app os apoios e prazos que se aplicam a ti" />

        {relacionados.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Outros apoios de {categoria.toLowerCase()}</h2>
            <Pilulas itens={[...relacionados.map((r) => ({ href: `/apoios/${r.slug}`, texto: r.titulo })), { href: "/apoios", texto: "Todos os apoios", fraco: true }]} />
          </>
        )}
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: (dadosApoios.apoios || []).map((a) => ({ params: { apoio: slugApoio(a) } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const apoios = dadosApoios.apoios || [];
  const apoio = apoios.find((a) => slugApoio(a) === params.apoio);
  if (!apoio) return { notFound: true };
  const nomeCat = Object.fromEntries((dadosApoios.categorias || []).map((c) => [c.id, c.nome]));
  const mesma = apoios.filter((a) => a.id !== apoio.id && a.categoria === apoio.categoria);
  const outras = apoios.filter((a) => a.id !== apoio.id && a.categoria !== apoio.categoria);
  return {
    props: {
      apoio,
      categoria: nomeCat[apoio.categoria] || "Outros",
      atualizado: dadosApoios.atualizado || null,
      prazos: prazosDoApoio(apoio.id, dadosPrazos.prazos).map((p) => ({ slug: slugPrazo(p), titulo: p.titulo, prazoTexto: p.prazoTexto })),
      relacionados: [...mesma, ...outras].slice(0, 6).map((a) => ({ slug: slugApoio(a), titulo: a.titulo })),
    },
    revalidate: 3600,
  };
}
