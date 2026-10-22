import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraRecibos from "../CalculadoraRecibos";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { calcularRecibosVerdes, BASE_MAXIMA, VERIFICADO_RECIBOS, FONTE_GUIA_TI, FONTE_ART31, FONTE_ART101, FONTE_ART101B, FONTE_ART53 } from "../lib/recibosVerdes";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — recibos verdes 2026: quanto sobra depois da
 * Segurança Social e do IRS. Alvo: "simulador recibos verdes",
 * "recibos verdes líquido", "quanto pago de segurança social
 * independente". Regras em lib/recibosVerdes.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
const MENSAIS = [1000, 1500, 2000, 2500, 3000, 4000];

const PERGUNTAS = [
  {
    p: "Quanto se paga de Segurança Social nos recibos verdes?",
    r: "21,4% de 70% do que faturas em serviços. Quem fatura 2000 € por mês paga 299,60 € por mês. O mínimo é 20 € por mês e a base nunca passa de 6445,56 € (12 vezes o IAS), por isso o máximo é 1379,35 €. Nos primeiros 12 meses de atividade não se paga.",
  },
  {
    p: "Quanto IRS pago nos recibos verdes?",
    r: "No regime simplificado, só 75% do que faturas conta para IRS nas profissões da lista do art. 151.º do Código do IRS, e 35% nos outros serviços. Sobre esse valor aplicam-se os escalões normais do IRS. No 1.º ano o valor que conta desce para metade e no 2.º ano para três quartos.",
  },
  {
    p: "O que é a retenção na fonte nos recibos verdes?",
    r: "Um adiantamento de IRS que as empresas (com contabilidade organizada) descontam e entregam às Finanças por ti: 23% nas profissões do art. 151.º e 11,5% nos outros serviços. No fim do ano acertas contas na declaração de IRS. Se prevês faturar menos de 15 000 € por ano, podes pedir dispensa de retenção.",
  },
  {
    p: "Tenho de cobrar IVA nos recibos verdes?",
    r: "Não, se o volume de negócios do ano anterior foi até 15 000 € e escolheste o regime de isenção do art. 53.º do Código do IVA. Acima disso cobras 23% de IVA ao cliente e entregas esse valor ao Estado: não é teu.",
  },
  {
    p: "Quando começo a pagar Segurança Social?",
    r: "O enquadramento começa no 1.º dia do 12.º mês depois de abrires atividade. Daí em diante a contribuição é calculada todos os trimestres a partir da declaração trimestral que fazes à Segurança Social.",
  },
];

export default function RecibosVerdes({ exemplos }) {
  const titulo = "Simulador de recibos verdes 2026: quanto sobra | PoupeJá";
  const descricao = "Quanto sobra dos recibos verdes em 2026 depois da Segurança Social e do IRS: simulador com retenção na fonte, IVA e regime simplificado.";
  const canonical = `${URL_SITE}/recibos-verdes`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "Recibos verdes", path: "/recibos-verdes" }];
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
        <meta property="og:title" content="Simulador de recibos verdes 2026: quanto sobra" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Recibos verdes 2026: quanto sobra</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto guardar para a Segurança Social e o IRS, e quanto fica para ti, com as regras de 2026.
        </p>

        <CalculadoraRecibos />

        <h2 className="font-display" style={estiloH2}>Quanto sobra, por mês</h2>
        <div className="rounded-2xl overflow-x-auto" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th scope="col" style={{ padding: "10px 10px", textAlign: "left" }}>Faturas</th>
                <th scope="col" style={td}>Seg. Social</th>
                <th scope="col" style={td}>IRS</th>
                <th scope="col" style={{ ...td, paddingRight: 10 }}>Sobra</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.mensal} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 10px" }}>{eur0(x.mensal)} €</td>
                  <td className="pj-num" style={td}>{eur(x.ssMes)} €</td>
                  <td className="pj-num" style={td}>{eur(x.irsMes)} €</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 10, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{eur(x.liquidoMes)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Profissão da lista do art. 151.º, mais de 2 anos de atividade, valores sem IVA, 12 meses por ano. O IRS é antes das deduções à coleta (despesas de saúde, educação, dependentes).
        </p>

        <h2 className="font-display" style={estiloH2}>Como se calcula</h2>
        <ul style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>Segurança Social:</strong> 21,4% de 70% do que faturas. Mínimo de 20 € por mês, máximo de {eur(BASE_MAXIMA * 0.214)} €.</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>IRS:</strong> 75% do que faturas (35% em outros serviços) entra no rendimento. O que a Segurança Social tira acima de 10% do rendimento abate-se. Depois aplicam-se os escalões de IRS.</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>Despesas:</strong> se as despesas ligadas à atividade somarem menos de 15% do que faturas, a diferença também paga IRS. A dedução específica de 4587,09 € conta como despesa.</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>Retenção:</strong> é só um adiantamento. O IRS certo é o da declaração do ano seguinte.</li>
        </ul>

        <BotaoAbrirPoupeja href="/?atalho=prazos" tipo="recibos-verdes" texto="Recebe na app o aviso das declarações trimestrais e do IRS" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_GUIA_TI} target="_blank" rel="noopener noreferrer" style={estiloLink}>Guia Prático dos Trabalhadores Independentes, Segurança Social</a>,{" "}
          <a href={FONTE_ART31} target="_blank" rel="noopener noreferrer" style={estiloLink}>art. 31.º</a>,{" "}
          <a href={FONTE_ART101} target="_blank" rel="noopener noreferrer" style={estiloLink}>101.º</a> e{" "}
          <a href={FONTE_ART101B} target="_blank" rel="noopener noreferrer" style={estiloLink}>101.º-B do Código do IRS</a> e{" "}
          <a href={FONTE_ART53} target="_blank" rel="noopener noreferrer" style={estiloLink}>art. 53.º do Código do IVA</a>, confirmados a {dataExtenso(VERIFICADO_RECIBOS)}.
          É uma estimativa para quem está no regime simplificado, sem outros rendimentos nem IRS Jovem. Quem tem contabilidade organizada ou trabalha também por conta de outrem paga de outra forma.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/salario-liquido", texto: "Salário líquido 2026" },
          { href: "/irs", texto: "Escalões de IRS 2026" },
          { href: "/subsidio-desemprego", texto: "Subsídio de desemprego 2026" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: {
      exemplos: MENSAIS.map((mensal) => {
        const r = calcularRecibosVerdes({ mensal });
        return { mensal, ssMes: r.ssMes, irsMes: r.irsMes, liquidoMes: r.liquidoMes };
      }),
    },
  };
}
