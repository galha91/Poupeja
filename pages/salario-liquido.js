import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraSalario from "../CalculadoraSalario";
import { Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { salarioLiquido, VERIFICADO_SALARIO, FONTE_RETENCAO } from "../lib/salario";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — salário líquido 2026 (bruto → líquido), com as
 * tabelas de retenção do Despacho n.º 233-A/2026 (lib/salario). Alvo:
 * "salário líquido 2026", "simulador salário líquido", "1500 euros
 * brutos quanto é líquido". O acerto anual do IRS fica para o simulador
 * da app, que abre já preenchido.
 */
const FONTE_NOVEMBRO = "https://diariodarepublica.pt/dr/detalhe/despacho/12523-a-2026-1180337885";
const EXEMPLOS = [920, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 4000];

const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

export default function SalarioLiquido({ exemplos }) {
  const titulo = "Salário líquido 2026: do bruto ao líquido | PoupeJá";
  const descricao = "Calcula o teu salário líquido em 2026: Segurança Social e retenção de IRS pelas tabelas oficiais, com dependentes e IRS Jovem. Exemplos de 920 € a 4000 €.";
  const canonical = `${URL_SITE}/salario-liquido`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Salário líquido 2026", path: "/salario-liquido" }];
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Calculadora de salário líquido PoupeJá",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url: canonical,
  };
  const forte = { color: "var(--pj-text)" };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Salário líquido 2026: do bruto ao líquido" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Salário líquido 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Do bruto ao que cai na conta: 11% para a Segurança Social e a retenção de IRS das tabelas oficiais de 2026, com IRS Jovem e incapacidade.
        </p>

        <CalculadoraSalario />

        <h2 className="font-display" style={estiloH2}>Quanto fica líquido</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Bruto</th>
                <th scope="col" style={{ textAlign: "right", padding: "10px 6px" }}>IRS</th>
                <th scope="col" style={{ textAlign: "right", padding: "10px 12px" }}>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.bruto} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 12px" }}>{eur0(x.bruto)} €</td>
                  <td className="pj-num" style={{ padding: "10px 6px", textAlign: "right", color: "var(--pj-text-muted)" }}>{eur(x.irs)} €</td>
                  <td className="pj-num" style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--pj-brand-ink)" }}>{eur(x.liquido)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Por mês, solteiro sem dependentes, trabalho por conta de outrem no Continente. Com dependentes, ou casado com o cônjuge sem rendimentos, retém-se menos.
        </p>

        <h2 className="font-display" style={estiloH2}>Como se calcula</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          <strong style={forte}>Segurança Social:</strong> 11% do bruto, sempre.{" "}
          <strong style={forte}>IRS:</strong> a empresa aplica a tabela de retenção que corresponde à tua situação: salário × taxa da linha, menos uma
          parcela a abater e um valor por cada dependente. Com 3 ou mais dependentes a taxa baixa um ponto. Até 920 € brutos (o salário mínimo) não há retenção.
          Com IRS Jovem, a taxa calcula-se sobre o salário todo mas só se aplica à parte que não está isenta: 100% no 1.º ano, 75% do 2.º ao 4.º, 50% do 5.º ao 7.º
          e 25% do 8.º ao 10.º, até 2110,15 € isentos por mês. Com incapacidade de 60% ou mais há tabelas próprias, com retenção mais baixa.
        </p>
        <p style={estiloTexto}>
          A retenção é um adiantamento: o IRS a sério faz-se na declaração do ano seguinte, com as tuas despesas e deduções. É aí que recebes ou pagas
          a diferença. Para veres quanto, o simulador da app abre já com os teus números.
        </p>

        <h2 className="font-display" style={estiloH2}>Novembro de 2026: retenção a metade</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Por causa da descida do IRS aprovada este ano, o que te for pago em novembro de 2026, incluindo o subsídio de Natal se vier nesse mês, tem metade da
          retenção (Despacho n.º 12523-A/2026). Ficam de fora só os salários muito altos (acima de cerca de 20 mil € por mês, a última linha de cada tabela). Em dezembro volta tudo ao normal.
        </p>

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <a href={FONTE_RETENCAO} target="_blank" rel="noopener noreferrer" style={estiloLink}>Despacho n.º 233-A/2026 (tabelas de retenção na fonte, Diário da República)</a> e{" "}
          <a href={FONTE_NOVEMBRO} target="_blank" rel="noopener noreferrer" style={estiloLink}>Despacho n.º 12523-A/2026</a>, confirmados a {dataExtenso(VERIFICADO_SALARIO)}.
          IRS Jovem pelo art. 99.º-F, n.º 4, do Código do IRS (isenção mensal até 2110,15 €); incapacidade ≥ 60% pelas tabelas IV a VII. Não inclui Açores e Madeira, dependentes com deficiência nem outros descontos (sindicato, seguros). Valores ao cêntimo, indicativos.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/irs", texto: "Escalões de IRS 2026" },
          { href: "/apoios/irs-jovem", texto: "IRS Jovem" },
          { href: "/tarifa-social", texto: "Tarifa social: tens direito?" },
          { href: "/credito-habitacao", texto: "Simulador de crédito habitação", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return { props: { exemplos: EXEMPLOS.map((b) => salarioLiquido(b)) } };
}
