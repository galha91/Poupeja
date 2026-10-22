import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraDesemprego from "../CalculadoraDesemprego";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { valorSubsidio, IAS, VERIFICADO_DESEMPREGO, FONTE_GUIA_DESEMPREGO } from "../lib/desemprego";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — subsídio de desemprego 2026: valor, duração e
 * simulador. Alvo: "subsídio de desemprego 2026", "simulador subsídio de
 * desemprego", "quanto recebo de desemprego". Regras em lib/desemprego.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SALARIOS = [920, 1000, 1200, 1500, 2000, 2500, 3000];
const DURACAO = [
  ["Menos de 30 anos", "150 dias", "210 dias", "330 dias", "+30"],
  ["30 a 39 anos", "180 dias", "330 dias", "420 dias", "+30"],
  ["40 a 49 anos", "210 dias", "360 dias", "540 dias", "+45"],
  ["50 anos ou mais", "270 dias", "480 dias", "540 dias", "+60"],
];

const PERGUNTAS = [
  {
    p: "Quanto se recebe de subsídio de desemprego?",
    r: "65% da remuneração de referência, que é a média dos salários de 12 meses com os subsídios de férias e de Natal. Em 2026 o valor fica entre 537,13 € (o IAS) e 1342,83 € (2,5 vezes o IAS) por mês, e nunca passa de 75% do que recebias líquido.",
  },
  {
    p: "Quem tem direito ao subsídio de desemprego?",
    r: "Quem ficou desempregado sem querer (despedimento, fim de contrato, rescisão com justa causa), tem pelo menos 12 meses de descontos nos últimos 24 e está inscrito no IEFP. Quem se despede por vontade própria, em regra, não tem direito.",
  },
  {
    p: "Até quando posso pedir o subsídio?",
    r: "Tens 90 dias seguidos a contar do dia em que ficaste desempregado. Se pedires depois, o tempo de atraso é descontado ao tempo de subsídio.",
  },
];

export default function SubsidioDesemprego({ exemplos }) {
  const titulo = "Subsídio de desemprego 2026: valor e duração | PoupeJá";
  const descricao = "Quanto recebes de subsídio de desemprego em 2026 e durante quanto tempo: simulador com as regras da Segurança Social, mínimo de 537,13 € e máximo de 1342,83 €.";
  const canonical = `${URL_SITE}/subsidio-desemprego`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Apoios", path: "/apoios" }, { nome: "Subsídio de desemprego", path: "/subsidio-desemprego" }];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
  const td = { padding: "10px 6px", textAlign: "right" };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Subsídio de desemprego 2026: valor e duração" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Subsídio de desemprego 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto recebes por mês e durante quanto tempo, com as regras e os limites da Segurança Social.
        </p>

        <CalculadoraDesemprego />

        <h2 className="font-display" style={estiloH2}>Quanto se recebe</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Salário bruto</th>
                <th scope="col" style={{ ...td, paddingRight: 12 }}>Subsídio por mês</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.salario} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 12px" }}>{eur(x.salario)} €</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 12, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{eur(x.valor)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Solteiro sem dependentes, sempre o mesmo salário com subsídios de férias e de Natal. Limites de 2026: mínimo de {eur(IAS)} € (ou 617,70 € se ganhavas
          pelo menos o salário mínimo), máximo de {eur(2.5 * IAS)} € e nunca mais de 75% do líquido.
        </p>

        <h2 className="font-display" style={estiloH2}>Durante quanto tempo</h2>
        <div className="rounded-2xl overflow-x-auto" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th scope="col" style={{ padding: "10px 10px", textAlign: "left" }}>Idade</th>
                <th scope="col" style={td}>12–14 meses</th>
                <th scope="col" style={td}>15–23</th>
                <th scope="col" style={td}>24+</th>
                <th scope="col" style={{ ...td, paddingRight: 10 }}>5 anos</th>
              </tr>
            </thead>
            <tbody>
              {DURACAO.map((l) => (
                <tr key={l[0]} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td style={{ padding: "10px 10px" }}>{l[0]}</td>
                  <td className="pj-num" style={td}>{l[1]}</td>
                  <td className="pj-num" style={td}>{l[2]}</td>
                  <td className="pj-num" style={td}>{l[3]}</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 10 }}>{l[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Meses de descontos. A última coluna são os dias a mais por cada 5 anos de descontos nos últimos 20 (Quadro I do Guia Prático).
        </p>

        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="desemprego" texto="Vê na app outros apoios a que podes ter direito" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <a href={FONTE_GUIA_DESEMPREGO} target="_blank" rel="noopener noreferrer" style={estiloLink}>Guia Prático do Subsídio de Desemprego, Segurança Social</a>,
          confirmado a {dataExtenso(VERIFICADO_DESEMPREGO)}. Os seis exemplos do Guia dão o mesmo resultado nesta calculadora. É uma estimativa: a Segurança Social usa os
          salários registados e a tabela de IRS que estiver em vigor. Não inclui o regime transitório de quem já tinha direito em março de 2012.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/tarifa-social", texto: "Tarifa social: tens direito?" },
          { href: "/abono-de-familia", texto: "Abono de família 2026" },
          { href: "/salario-liquido", texto: "Salário líquido 2026" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: {
      exemplos: SALARIOS.map((salario) => ({ salario, valor: valorSubsidio({ rr: Math.round((salario * 14) / 12 * 100) / 100 }).valor })),
    },
  };
}
