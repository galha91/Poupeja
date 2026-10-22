import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import dadosPrazos from "../../data/prazos-estado.json";
import dadosApoios from "../../public/apoios.json";
import { slugPrazo, slugApoio, apoiosDoPrazo, estadoPrazo, dataLonga } from "../../lib/seoEstado";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { hojeLisboa, cortar } from "../../lib/seoFormato";
import { URL_SITE } from "../../lib/site";

/*
 * Página pública SEO — um prazo do Estado. Alvo: "prazo IRS 2027", "até
 * quando atualizar o agregado familiar". A data é a da próxima vez que o
 * prazo acaba, calculada todos os dias (ISR), com os dias que faltam.
 */
export default function Prazo({ prazo, estado, apoios, outros }) {
  const slug = slugPrazo(prazo);
  const canonical = `${URL_SITE}/prazos/${slug}`;
  const ano = estado ? estado.fim.slice(0, 4) : null;
  const titulo = [
    `${prazo.titulo}: prazo ${ano || ""} e como fazer | PoupeJá`.replace("  ", " "),
    `${prazo.titulo}: prazo${ano ? ` ${ano}` : ""} | PoupeJá`,
    `${prazo.titulo} | PoupeJá`,
  ].find((t) => t.length <= 60) || `${prazo.titulo} | PoupeJá`;
  const descricao = cortar(`${prazo.titulo}: ${estado ? estado.frase : prazo.prazoTexto + "."} ${prazo.descricao}`);
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Prazos do Estado", path: "/prazos" }, { nome: prazo.titulo, path: `/prazos/${slug}` }];

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
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{prazo.titulo}{ano ? `: prazo ${ano}` : ""}</h1>

        <div className="rounded-2xl p-5 mt-6" style={{ ...estiloCartao, background: estado?.aberto ? "var(--pj-brand-wash)" : "var(--pj-card)" }}>
          <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>Prazo</p>
          <p className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{prazo.prazoTexto}</p>
          {estado && <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 6, fontWeight: 500 }}>{estado.frase}</p>}
        </div>

        <p style={estiloTexto}>{prazo.descricao}</p>
        {prazo.quemPode && (
          <>
            <h2 className="font-display" style={estiloH2}>Quem tem de tratar disto</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>{prazo.quemPode}</p>
          </>
        )}

        {prazo.link && (
          <a href={prazo.link} target="_blank" rel="noopener noreferrer" className="pj-tap flex items-center justify-between no-underline mt-8 rounded-2xl px-5 py-4"
            style={{ ...estiloCartao, color: "var(--pj-text)" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Ver no {prazo.fonte || "site oficial"}</span>
            <span aria-hidden="true" style={{ color: "var(--pj-brand-ink)" }}>→</span>
          </a>
        )}
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 12 }}>
          Prazo confirmado na fonte oficial{prazo.verificado ? ` a ${dataLonga(prazo.verificado)}` : ""}. O PoupeJá não é um serviço do Estado.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="prazo" texto="Recebe um aviso na app antes deste prazo acabar" />

        {apoios.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Apoios relacionados</h2>
            <Pilulas itens={apoios.map((a) => ({ href: `/apoios/${a.slug}`, texto: a.titulo }))} />
          </>
        )}
        <h2 className="font-display" style={estiloH2}>Outros prazos</h2>
        <Pilulas itens={[...outros.map((o) => ({ href: `/prazos/${o.slug}`, texto: o.titulo })), { href: "/prazos", texto: "Todos os prazos", fraco: true }]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: dadosPrazos.prazos.map((p) => ({ params: { prazo: slugPrazo(p) } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const prazo = dadosPrazos.prazos.find((p) => slugPrazo(p) === params.prazo);
  if (!prazo) return { notFound: true };
  const hoje = hojeLisboa();
  return {
    props: {
      prazo,
      estado: estadoPrazo(prazo, hoje),
      apoios: apoiosDoPrazo(prazo.id, dadosApoios.apoios || []).map((a) => ({ slug: slugApoio(a), titulo: a.titulo })),
      outros: dadosPrazos.prazos.filter((p) => p.id !== prazo.id).slice(0, 8).map((p) => ({ slug: slugPrazo(p), titulo: p.titulo })),
    },
    // Os dias que faltam mudam todos os dias.
    revalidate: 21600,
  };
}
