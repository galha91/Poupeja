import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraIuc from "../CalculadoraIuc";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { calcularIuc, VERIFICADO_IUC, FONTE_TABELAS_IUC, FONTE_ART9_IUC, FONTE_ART10_IUC, FONTE_DL_161_2026 } from "../lib/iuc";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — IUC 2026: quanto paga o carro, com simulador e os
 * novos prazos. Alvo: "simulador IUC", "IUC 2026", "quanto pago de IUC".
 * Tabelas e regras em lib/iuc.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EXEMPLOS = [
  { nome: "Utilitário a gasolina, 1.0, de 2021 (120 g/km WLTP)", dados: { combustivel: "gasolina", cilindrada: 999, ano: 2021, co2: 120, norma: "wltp" } },
  { nome: "Compacto a gasolina, 1.5, de 2019 (135 g/km WLTP)", dados: { combustivel: "gasolina", cilindrada: 1498, ano: 2019, co2: 135, norma: "wltp" } },
  { nome: "Familiar a gasóleo, 1.6, de 2018 (110 g/km NEDC)", dados: { combustivel: "gasoleo", cilindrada: 1598, ano: 2018, co2: 110, norma: "nedc" } },
  { nome: "SUV a gasolina, 2.0, de 2022 (160 g/km WLTP)", dados: { combustivel: "gasolina", cilindrada: 1984, ano: 2022, co2: 160, norma: "wltp" } },
  { nome: "Carro a gasolina, 1.4, de 2003", dados: { combustivel: "gasolina", cilindrada: 1400, ano: 2003 } },
];

const PERGUNTAS = [
  {
    p: "Como se calcula o IUC de um carro?",
    r: "Depende da data da 1.ª matrícula. Até junho de 2007, conta a cilindrada, o combustível e o ano. Desde julho de 2007, soma-se a taxa da cilindrada à das emissões de CO₂, multiplica-se por um coeficiente que sobe com a idade do carro (1,15 desde 2010) e, no gasóleo, soma-se uma taxa adicional. A matrícula de 2017 em diante paga ainda um adicional nos carros com muitas emissões.",
  },
  {
    p: "Quando se paga o IUC?",
    r: "Em 2026, até ao fim do mês da matrícula. Em 2027 há um regime transitório (Decreto-Lei n.º 161/2026): paga-se em outubro se o valor for até 500 €, ou em julho e outubro se for superior, e quem quiser pode pagar tudo em julho. A partir de 2028 o prazo passa a ser abril, repartido em até três prestações. Quem tiver vários carros passa a ter uma só liquidação por ano.",
  },
  {
    p: "Os carros elétricos pagam IUC?",
    r: "Os carros 100% elétricos matriculados desde julho de 2007 estão isentos. Os híbridos, incluindo os plug-in, pagam como um carro a gasolina ou a gasóleo. A redução de 75% para híbridos plug-in é no ISV, o imposto da matrícula, não no IUC.",
  },
  {
    p: "Quem está isento de IUC?",
    r: "Não se paga quando o valor é inferior a 10 €. Há isenção para pessoas com incapacidade de 60% ou mais (até 240 € por ano e um só carro), clássicos com mais de 30 anos reconhecidos como históricos, ambulâncias e tratores, entre outros casos. Os carros matriculados antes de 1981 também não pagam.",
  },
  {
    p: "Qual é a diferença entre o IUC e o ISV?",
    r: "O ISV paga-se uma vez, quando o carro é matriculado em Portugal. O IUC paga-se todos os anos, até a matrícula ser cancelada, por quem for o proprietário.",
  },
];

export default function Iuc({ exemplos }) {
  const titulo = "Simulador de IUC 2026: quanto paga o teu carro | PoupeJá";
  const descricao = "Quanto pagas de IUC em 2026: simulador com as tabelas oficiais para carros antes e depois de 2007, gasolina, gasóleo e elétricos, e os novos prazos de 2027.";
  const canonical = `${URL_SITE}/iuc`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "IUC 2026", path: "/iuc" }];
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
        <meta property="og:title" content="Simulador de IUC 2026: quanto paga o teu carro" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Simulador de IUC 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto o teu carro paga de IUC por ano e quando tens de pagar. Os dados estão no livrete.
        </p>

        <CalculadoraIuc />

        <h2 className="font-display" style={estiloH2}>Exemplos de IUC em 2026</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Carro</th>
                <th scope="col" style={{ ...td, paddingRight: 12 }}>Por ano</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.nome} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td style={{ padding: "10px 12px" }}>{x.nome}</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 12, fontWeight: 600, color: "var(--pj-brand-ink)", whiteSpace: "nowrap" }}>{eur(x.valor)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Os valores de 2026 são os mesmos de 2024 e 2025. As emissões de CO₂ estão no livrete ou no certificado de conformidade (COC).
        </p>

        <h2 className="font-display" style={estiloH2}>Quando pagar</h2>
        <ul style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>2026:</strong> até ao fim do mês da matrícula.</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>2027:</strong> em outubro, se o valor for até 500 €. Acima disso, em julho e outubro, ou tudo em julho.</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>Desde 2028:</strong> em abril, se for até 100 €. Entre 100 € e 500 €, em abril e outubro. Acima de 500 €, em abril, julho e outubro. Também se pode pagar tudo em abril.</li>
        </ul>

        <BotaoAbrirPoupeja href="/?atalho=prazos" tipo="iuc" texto="Recebe na app o aviso do prazo do IUC e de outros impostos" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_TABELAS_IUC} target="_blank" rel="noopener noreferrer" style={estiloLink}>tabelas do IUC 2026 do ACP</a>,{" "}
          <a href={FONTE_ART9_IUC} target="_blank" rel="noopener noreferrer" style={estiloLink}>art. 9.º</a> e{" "}
          <a href={FONTE_ART10_IUC} target="_blank" rel="noopener noreferrer" style={estiloLink}>10.º do Código do IUC</a> e{" "}
          <a href={FONTE_DL_161_2026} target="_blank" rel="noopener noreferrer" style={estiloLink}>Decreto-Lei n.º 161/2026</a>, confirmados a {dataExtenso(VERIFICADO_IUC)}.
          O valor final é o do Portal das Finanças. Só para automóveis ligeiros de passageiros; motos, mercadorias, barcos e aeronaves têm outras tabelas.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/combustiveis", texto: "Combustíveis mais baratos" },
          { href: "/garantias", texto: "Garantia de 3 anos" },
          { href: "/prazos", texto: "Prazos do Estado" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: { exemplos: EXEMPLOS.map((x) => ({ nome: x.nome, valor: calcularIuc(x.dados).devido })) },
  };
}
