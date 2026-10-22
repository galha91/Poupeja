import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraIndemnizacao from "../CalculadoraIndemnizacao";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { calcularCompensacao, RMMG_2026, VERIFICADO_INDEMNIZACAO, FONTE_LEI_13_2023, FONTE_DGERT_366, FONTE_GUIA_CESSACAO, SIMULADOR_ACT } from "../lib/indemnizacao";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — indemnização por despedimento em 2026: dias por
 * ano, limites e simulador. Alvo: "indemnização por despedimento",
 * "calculadora despedimento", "compensação despedimento coletivo".
 * Regras em lib/indemnizacao.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
const ORDENADOS = [900, 1200, 1500, 2000, 3000];

const PERGUNTAS = [
  {
    p: "Quanto se recebe de indemnização num despedimento coletivo?",
    r: "14 dias de ordenado base e diuturnidades por cada ano completo de antiguidade, desde 1 de maio de 2023 (antes eram 12). O mesmo vale para a extinção do posto de trabalho e para a inadaptação. Em fração de ano, o valor é proporcional.",
  },
  {
    p: "E se o meu contrato é antigo?",
    r: "Os contratos anteriores a 2013 somam períodos com regras diferentes: 30 dias por ano até outubro de 2012 nos contratos anteriores a novembro de 2011, 20 dias até setembro de 2013, e depois 12 dias (ou 18 nos três primeiros anos do contrato, se ainda não tinha três anos em outubro de 2013) até abril de 2023. A calculadora faz esta soma.",
  },
  {
    p: "Qual é o máximo e o mínimo da compensação?",
    r: "O ordenado conta até 20 vezes o salário mínimo (18 400 € em 2026) e o total não passa de 12 meses de ordenado, ou de 240 vezes o salário mínimo (220 800 €) quando o ordenado é muito alto. Nos contratos anteriores a novembro de 2011, o total também não é inferior a três meses de ordenado.",
  },
  {
    p: "Quanto recebo quando acaba um contrato a termo?",
    r: "Se a empresa decidir não renovar, 24 dias de ordenado base e diuturnidades por ano de antiguidade nos contratos desde maio de 2023. Se foste tu a dizer que não querias renovar, não há compensação. Antes de maio de 2023 eram 18 dias nos três primeiros anos e 12 depois.",
  },
  {
    p: "E se eu rescindir com justa causa?",
    r: "Se a empresa não paga o ordenado, te assedia ou falha de forma grave, podes rescindir com justa causa e tens direito a uma indemnização entre 15 e 45 dias de ordenado por ano de antiguidade, e nunca menos de três meses. Quanto mais grave for o que a empresa fez, mais perto dos 45 dias.",
  },
  {
    p: "O que recebo além da indemnização?",
    r: "O \"acerto de contas\": as férias que não gozaste com o subsídio de férias, e os proporcionais de férias, subsídio de férias e subsídio de Natal do ano em que sais. Calcula-se à parte e também se recebe quando és tu a sair.",
  },
  {
    p: "E se me despeço eu?",
    r: "Quando és tu a demitir-te, sem justa causa, não tens direito a compensação legal e tens de dar aviso prévio. Se saíres por mútuo acordo, o valor é o que combinarem.",
  },
];

export default function IndemnizacaoDespedimento({ exemplos }) {
  const titulo = "Indemnização por despedimento 2026: calculadora | PoupeJá";
  const descricao = "Quanto recebes de indemnização num despedimento em 2026: calculadora com os 14 dias por ano, contratos antigos, fim de contrato a termo, limites e justa causa.";
  const canonical = `${URL_SITE}/indemnizacao-despedimento`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "Indemnização por despedimento", path: "/indemnizacao-despedimento" }];
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
        <meta property="og:title" content="Indemnização por despedimento 2026: calculadora" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Indemnização por despedimento em 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto recebes se o contrato acabar por decisão da empresa, com as regras que se aplicam à data de início do teu contrato.
        </p>

        <CalculadoraIndemnizacao />

        <h2 className="font-display" style={estiloH2}>Exemplo: contrato de 2020 até 2026</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Ordenado</th>
                <th scope="col" style={{ ...td, paddingRight: 12 }}>Compensação</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.ordenado} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 12px" }}>{eur0(x.ordenado)} €</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 12, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{eur(x.valor)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Contrato sem termo de 1 de janeiro de 2020 a 31 de dezembro de 2026 (12 dias por ano até abril de 2023 e 14 dias depois), despedimento coletivo.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="indemnizacao" texto="Vê na app o subsídio de desemprego e outros apoios a que podes ter direito" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_LEI_13_2023} target="_blank" rel="noopener noreferrer" style={estiloLink}>Lei n.º 13/2023</a>,{" "}
          <a href={FONTE_DGERT_366} target="_blank" rel="noopener noreferrer" style={estiloLink}>DGERT sobre o regime transitório e os limites do art. 366.º</a> (o texto da DGERT ainda fala em 12 dias, valor anterior a maio de 2023) e{" "}
          <a href={FONTE_GUIA_CESSACAO} target="_blank" rel="noopener noreferrer" style={estiloLink}>Guia Prático da Cessação do Contrato de Trabalho</a>, confirmados a {dataExtenso(VERIFICADO_INDEMNIZACAO)}.
          É uma estimativa. Confirma sempre no <a href={SIMULADOR_ACT} target="_blank" rel="noopener noreferrer" style={estiloLink}>simulador oficial da ACT</a> ou com um advogado ou sindicato. Não cobre despedimento ilícito, contratos com regras próprias, nem o IRS sobre a indemnização.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/subsidio-desemprego", texto: "Subsídio de desemprego 2026" },
          { href: "/salario-liquido", texto: "Salário líquido 2026" },
          { href: "/recibos-verdes", texto: "Recibos verdes 2026" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  return {
    props: {
      exemplos: ORDENADOS.map((ordenado) => ({
        ordenado,
        valor: calcularCompensacao({ tipo: "coletivo", retribuicao: ordenado, inicio: "2020-01-01", fim: "2026-12-31", rmmg: RMMG_2026 }).total,
      })),
    },
  };
}
