import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, GraficoHistorico, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { PRAZOS_EURIBOR, prazoPorSlug, resumirEuribor, nomeMes, pct } from "../../lib/seoEuribor";
import { seriesEuribor } from "../../lib/euriborDados";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (periodo) => { const [a, m] = periodo.split("-").map(Number); return `${MESES_CURTOS[m - 1]} ${String(a).slice(2)}`; };

/*
 * Página pública SEO — um prazo da Euribor. Alvo: "euribor 6 meses hoje",
 * "euribor 12 meses". Valor do mês, variação, efeito na prestação e os
 * últimos 24 meses (gráfico + tabela).
 */
export default function EuriborPrazo({ prazo, resumo, serie, outros }) {
  const canonical = `${URL_SITE}/euribor/${prazo.slug}`;
  const titulo = resumo
    ? [`${prazo.nome} hoje: ${pct(resumo.atual.valor)} | PoupeJá`, `${prazo.nome}: ${pct(resumo.atual.valor)}`].find((t) => t.length <= 60)
    : `${prazo.nome} hoje | PoupeJá`;
  const descricao = resumo ? resumo.frases.join(" ").slice(0, 158).replace(/\s+\S*$/, "") + "…" : `${prazo.nome}: média mensal publicada pelo BCE e efeito na prestação do crédito à habitação.`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Euribor", path: "/euribor" }, { nome: prazo.curto, path: `/euribor/${prazo.slug}` }];

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        {!resumo && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={titulo.replace(/ \| PoupeJá$/, "")} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{prazo.nome} hoje</h1>
        {resumo ? (
          <>
            <div className="rounded-2xl p-5 mt-6" style={estiloCartao}>
              <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{nomeMes(resumo.atual.periodo)} · média do mês</p>
              <p className="pj-num font-display" style={{ fontSize: 40, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 6 }}>{pct(resumo.atual.valor)}</p>
            </div>
            {resumo.frases.slice(1).map((f, i) => <p key={i} style={i === 0 ? { ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 } : estiloTexto}>{f}</p>)}
            <GraficoHistorico serie={serie} titulo={`${prazo.nome}, últimos ${serie.length} meses`} legenda="Média de cada mês"
              fmt={(v) => pct(v)} eixo={(v) => pct(v, 2)} rotuloDia={mesCurto} minPontos={3} />
          </>
        ) : (
          <p style={estiloTexto}>Os valores do BCE não estão disponíveis neste momento. Tenta daqui a pouco.</p>
        )}

        <BotaoAbrirPoupeja href="/credito-habitacao" tipo="euribor" texto={`Simula a tua prestação com a ${prazo.nome}`} />

        <h2 className="font-display" style={estiloH2}>Outros prazos</h2>
        <Pilulas itens={[...outros.map((o) => ({ href: `/euribor/${o.slug}`, texto: o.nome })), { href: "/euribor", texto: "Euribor hoje", fraco: true }]} />
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 16 }}>
          Fonte: <a href="https://data.ecb.europa.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>Banco Central Europeu</a> (média mensal).
        </p>
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: PRAZOS_EURIBOR.map((p) => ({ params: { prazo: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const prazo = prazoPorSlug(params.prazo);
  if (!prazo) return { notFound: true };
  const s = (await seriesEuribor())[prazo.id] || [];
  const resumo = resumirEuribor(s, prazo);
  return {
    props: {
      prazo: { slug: prazo.slug, nome: prazo.nome, curto: prazo.curto },
      resumo,
      serie: s.map((p) => ({ dia: p.periodo, media: p.valor, minimo: p.valor })),
      outros: PRAZOS_EURIBOR.filter((p) => p.slug !== prazo.slug).map((p) => ({ slug: p.slug, nome: p.nome })),
    },
    revalidate: resumo ? 21600 : 600,
  };
}
