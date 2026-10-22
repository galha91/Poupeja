import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import SimuladorCredito from "../SimuladorCredito";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto } from "../PaginasPrecos";
import { PRAZOS_EURIBOR, nomeMes, pct } from "../lib/seoEuribor";
import { seriesEuribor } from "../lib/euriborDados";
import { breadcrumbLd } from "../lib/seoPrecos";
import { URL_SITE } from "../lib/site";
import { cortar } from "../lib/seoFormato";

/*
 * Página pública SEO — simulador de crédito à habitação, com a Euribor do
 * mês já preenchida. Alvo: "simulador crédito habitação", "calcular
 * prestação casa". As contas são as da app (lib/credito).
 */
export default function CreditoHabitacao({ euribores, periodo }) {
  const titulo = "Simulador de crédito habitação com a Euribor de hoje | PoupeJá".length <= 60
    ? "Simulador de crédito habitação com a Euribor de hoje | PoupeJá"
    : "Simulador crédito habitação: Euribor de hoje | PoupeJá";
  const descricao = euribores.length
    ? `Calcula a prestação da casa com a Euribor de ${nomeMes(periodo)} (${euribores.map((e) => `${e.curto} ${pct(e.valor)}`).join(", ")}). Grátis, sem registo, nada é guardado.`
    : "Calcula a prestação do crédito à habitação com Euribor e spread. Grátis, sem registo, nada é guardado.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Crédito habitação", path: "/credito-habitacao" }];
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Simulador de crédito habitação PoupeJá",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url: `${URL_SITE}/credito-habitacao`,
  };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        <link rel="canonical" href={`${URL_SITE}/credito-habitacao`} />
        <meta property="og:title" content="Simulador de crédito habitação" key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/credito-habitacao`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Simulador de crédito habitação</h1>
        <p style={estiloTexto}>
          Muda os valores e vê a prestação.{euribores.length ? <> A Euribor vem já preenchida com a média de {nomeMes(periodo)} publicada pelo BCE.</> : ""} Nada do que escreves sai do teu telemóvel.
        </p>
        <SimuladorCredito euribores={euribores} />

        <h2 className="font-display" style={estiloH2}>Como se calcula</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Taxa variável, prestação constante (o método que os bancos portugueses usam): a taxa anual é a Euribor mais o spread,
          e uma Euribor negativa conta como zero. A prestação real pode incluir seguros e comissões que este cálculo não tem.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=contas" tipo="credito" texto="Guarda o teu crédito na app e simula amortizações" />

        <h2 className="font-display" style={estiloH2}>Euribor hoje</h2>
        <Pilulas itens={[...PRAZOS_EURIBOR.map((p) => ({ href: `/euribor/${p.slug}`, texto: p.nome })), { href: "/imt", texto: "IMT e Imposto do Selo" }, { href: "/euribor", texto: "Todos os prazos", fraco: true }]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const series = await seriesEuribor();
  const euribores = PRAZOS_EURIBOR
    .map((p) => { const s = series[p.id] || []; const u = s[s.length - 1]; return u ? { id: p.id, curto: p.curto, valor: u.valor, periodo: u.periodo } : null; })
    .filter(Boolean);
  return { props: { euribores, periodo: euribores[0]?.periodo || null }, revalidate: euribores.length ? 21600 : 600 };
}
