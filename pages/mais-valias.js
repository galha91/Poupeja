import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraMaisValias from "../CalculadoraMaisValias";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { calcularMaisValia, COEFICIENTES_2026, VERIFICADO_MAIS_VALIAS, FONTE_PORTARIA_COEF, FONTE_ART10_CIRS, FONTE_DL_97_2026 } from "../lib/maisValias";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — mais-valias na venda de casa em 2026: quanto se
 * paga, reinvestimento e coeficientes. Alvo: "mais-valias venda casa",
 * "simulador mais-valias imobiliárias", "coeficiente desvalorização
 * moeda 2026". Regras em lib/maisValias.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COEF_EXEMPLOS = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2022, 2024];

const PERGUNTAS = [
  {
    p: "Como se calculam as mais-valias na venda de casa?",
    r: "Preço de venda menos o preço de compra corrigido pela inflação, menos as despesas (IMT, selo, escritura, comissão da venda e obras dos últimos 12 anos). Só 50% do ganho entra no IRS e soma-se aos teus outros rendimentos, por isso o imposto depende do escalão em que ficas.",
  },
  {
    p: "O que é o coeficiente de desvalorização da moeda?",
    r: "Um número que atualiza o preço a que compraste a casa para tirar o efeito da inflação. Em 2026 vem na Portaria n.º 457/2026/1 e depende do ano da compra: por exemplo, 1,43 para 2005 e 1,19 para 2021. Só se aplica se passaram mais de 24 meses entre a compra e a venda.",
  },
  {
    p: "Como não pagar mais-valias vendendo a casa onde vivo?",
    r: "Reinvestindo o valor da venda, sem o capital que ainda deves do crédito, noutra casa para viver, entre 24 meses antes e 36 meses depois da venda. A casa vendida tem de ter sido a tua habitação própria e permanente nos 12 meses anteriores, e tens de declarar a intenção de reinvestir no IRS do ano da venda. Se reinvestires só uma parte, só essa parte fica de fora.",
  },
  {
    p: "Há regras novas em 2026?",
    r: "Sim. Desde o Decreto-Lei n.º 97/2026, nas vendas feitas entre 2026 e 2029, também se pode reinvestir em casas para arrendamento acessível (renda dentro do limite da lei, arrendada em 36 meses nos primeiros cinco anos, sem vender em cinco anos). Passou também a haver uma suspensão do prazo de reinvestimento quando um contrato falha por culpa de terceiros e há ação judicial.",
  },
  {
    p: "E se tiver 65 anos ou estiver reformado?",
    r: "Podes aplicar o valor da venda, nos seis meses seguintes, num seguro de vida financeiro, fundo de pensões aberto, certificado do regime público de capitalização ou PEPP. Os seguros e fundos têm de pagar uma prestação regular durante pelo menos 10 anos, até 7,5% do valor investido por ano.",
  },
  {
    p: "Quando declaro a venda?",
    r: "Uma venda de 2026 declara-se no IRS de 2027, entre abril e junho, no Anexo G. Declara-se sempre, mesmo que não haja imposto a pagar ou que a mais-valia fique toda excluída por reinvestimento.",
  },
  {
    p: "As casas compradas antes de 1989 pagam mais-valias?",
    r: "Não, ao abrigo do regime transitório do Código do IRS. A venda declara-se na mesma, em regra no Anexo G1.",
  },
];

export default function MaisValias({ exemplo }) {
  const titulo = "Simulador de mais-valias da venda de casa 2026 | PoupeJá";
  const descricao = "Quanto IRS pagas na venda da casa em 2026: simulador com os coeficientes oficiais, despesas, reinvestimento em habitação ou arrendamento, e regras dos 65 anos.";
  const canonical = `${URL_SITE}/mais-valias`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "Mais-valias da casa", path: "/mais-valias" }];
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
        <meta property="og:title" content="Simulador de mais-valias da venda de casa 2026" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Mais-valias da venda de casa em 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto IRS pagas se vendeste ou vais vender casa em 2026, e quanto podes poupar reinvestindo.
        </p>

        <CalculadoraMaisValias />

        <h2 className="font-display" style={estiloH2}>Exemplo</h2>
        <p style={estiloTexto}>
          Casa comprada em 2005 por {eur(exemplo.compra)} € e vendida em 2026 por {eur(exemplo.venda)} €, com {eur(exemplo.despesas)} € de despesas e obras.
          O preço de compra sobe para {eur(exemplo.aquisicaoCorrigida)} € (coeficiente de {String(exemplo.coeficiente).replace(".", ",")}), a mais-valia é de {eur(exemplo.maisValia)} €
          e só {eur(exemplo.entraNoIrs)} € entram no IRS. Se reinvestires todo o valor da venda numa casa para viver, não pagas nada.
        </p>

        <h2 className="font-display" style={estiloH2}>Coeficientes de 2026</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Ano da compra</th>
                <th scope="col" style={{ ...td, paddingRight: 12 }}>Coeficiente</th>
              </tr>
            </thead>
            <tbody>
              {COEF_EXEMPLOS.map((a) => (
                <tr key={a} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 12px" }}>{a}</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 12, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{String(COEFICIENTES_2026[a]).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Portaria n.º 457/2026/1, de 15 de outubro, para bens vendidos em 2026. Para vendas de 2025 vale a tabela do ano anterior.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=prazos" tipo="mais-valias" texto="Recebe na app o aviso do IRS e dos prazos de reinvestimento" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_PORTARIA_COEF} target="_blank" rel="noopener noreferrer" style={estiloLink}>Portaria n.º 457/2026/1</a>,{" "}
          <a href={FONTE_ART10_CIRS} target="_blank" rel="noopener noreferrer" style={estiloLink}>art. 10.º do Código do IRS</a> e{" "}
          <a href={FONTE_DL_97_2026} target="_blank" rel="noopener noreferrer" style={estiloLink}>Decreto-Lei n.º 97/2026</a>, confirmados a {dataExtenso(VERIFICADO_MAIS_VALIAS)}.
          É uma estimativa para residentes, antes de deduções à coleta e do adicional de solidariedade. Não cobre casas herdadas, vendas de 2025 ou anteriores, nem não residentes.
          Usa o maior valor entre a escritura e o valor patrimonial tributário, na compra e na venda.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/imt", texto: "Simulador de IMT 2026" },
          { href: "/irs", texto: "Escalões de IRS 2026" },
          { href: "/credito-habitacao", texto: "Simulador de crédito habitação" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const venda = 350000;
  const compra = 150000;
  const r = calcularMaisValia({ venda, compra, anoCompra: 2005, despesasCompra: 7500, obras: 20000 });
  return {
    props: {
      exemplo: { venda, compra, despesas: r.despesas, aquisicaoCorrigida: r.aquisicaoCorrigida, coeficiente: r.coeficiente, maisValia: r.maisValia, entraNoIrs: r.entraNoIrs },
    },
  };
}
