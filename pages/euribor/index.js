import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { PRAZOS_EURIBOR, resumirEuribor, nomeMes, pct, CREDITO_REF } from "../../lib/seoEuribor";
import { seriesEuribor } from "../../lib/euriborDados";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";

/*
 * Página pública SEO — a Euribor deste mês, nos três prazos. Alvo:
 * "euribor hoje", "euribor 6 meses", "taxa euribor". Dados do BCE (média
 * mensal, a que os bancos usam para rever o crédito à habitação).
 */
export default function Euribor({ prazos, periodo }) {
  const titulo = periodo ? `Euribor hoje: valores de ${nomeMes(periodo)} | PoupeJá` : "Euribor hoje: 3, 6 e 12 meses | PoupeJá";
  const t = titulo.length <= 60 ? titulo : "Euribor hoje: 3, 6 e 12 meses | PoupeJá";
  const p6 = prazos.find((p) => p.slug === "6-meses");
  const descricao = prazos.length
    ? `Euribor em ${nomeMes(periodo)}: ${prazos.map((p) => `${p.curto} ${pct(p.valor)}`).join(", ")}. Quanto muda a prestação do crédito à habitação. Dados do BCE.`
    : "Euribor a 3, 6 e 12 meses, com a média do mês publicada pelo BCE e o efeito na prestação do crédito à habitação.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Euribor", path: "/euribor" }];
  return (
    <LayoutPublico>
      <Head>
        <title>{t}</title>
        <meta name="description" content={descricao} />
        {!prazos.length && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/euribor`} />
        <meta property="og:title" content={t.replace(/ \| PoupeJá$/, "")} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/euribor`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Euribor hoje</h1>
        <p style={estiloTexto}>
          {prazos.length
            ? <>Valores de <strong style={{ color: "var(--pj-text)" }}>{nomeMes(periodo)}</strong> (média do mês publicada pelo BCE), a que os bancos usam para rever a taxa do crédito à habitação.</>
            : "Os valores do BCE não estão disponíveis neste momento. Tenta daqui a pouco."}
        </p>
        <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {prazos.map((p) => (
            <a key={p.slug} href={`/euribor/${p.slug}`} className="pj-tap rounded-2xl p-4 no-underline" style={estiloCartao}>
              <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{p.curto}</p>
              <p className="pj-num font-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 6 }}>{pct(p.valor)}</p>
              {p.variacao != null && (
                <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>
                  {Math.abs(p.variacao) < 0.001 ? "igual ao mês anterior" : `${p.variacao < 0 ? "−" : "+"}${pct(Math.abs(p.variacao))} num mês`}
                </p>
              )}
            </a>
          ))}
        </div>
        {p6 && <p style={estiloTexto}>{p6.fraseCredito}</p>}

        <BotaoAbrirPoupeja href="/credito-habitacao" tipo="euribor" texto="Simula a tua prestação com a Euribor de hoje" />

        <h2 className="font-display" style={estiloH2}>O que é a Euribor</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          É a taxa a que os bancos da zona euro emprestam dinheiro entre si. Num crédito à habitação com taxa variável,
          a taxa que pagas é a Euribor mais o spread do teu banco, revista a cada 3, 6 ou 12 meses conforme o contrato.
          Se a Euribor for negativa, conta como zero: o banco não pode cobrar menos do que o spread.
        </p>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 12 }}>
          Fonte: <a href="https://data.ecb.europa.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>Banco Central Europeu</a>.
          Exemplo de crédito: {CREDITO_REF.capital.toLocaleString("pt-PT")} € a {CREDITO_REF.anos} anos com spread de {pct(CREDITO_REF.spread, 1)}.
        </p>
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const series = await seriesEuribor();
  const prazos = PRAZOS_EURIBOR.map((p) => {
    const r = resumirEuribor(series[p.id], p);
    if (!r) return null;
    return {
      slug: p.slug, curto: p.curto, valor: r.atual.valor, periodo: r.atual.periodo,
      variacao: r.mesAntes ? Math.round((r.atual.valor - r.mesAntes.valor) * 1000) / 1000 : null,
      fraseCredito: r.frases[r.frases.length - 1],
    };
  }).filter(Boolean);
  // Sem dados do BCE, tenta outra vez em 10 minutos em vez de 6 horas.
  return { props: { prazos, periodo: prazos[0]?.periodo || null }, revalidate: prazos.length ? 21600 : 600 };
}
