import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraImt from "../CalculadoraImt";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { calcularImt, deducaoSeloJovem, TABELAS_IMT, VERIFICADO_IMT, FONTE_TABELAS_IMT, FONTE_ART17, FONTE_IMT_JOVEM } from "../lib/imt";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — IMT e Imposto do Selo 2026 na compra de casa, com
 * simulador e IMT Jovem. Alvo: "simulador IMT", "IMT 2026", "IMT jovem",
 * "quanto pago de IMT". Tabelas e regras em lib/imt.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (v) => v.toLocaleString("pt-PT", { maximumFractionDigits: 0 });
const pct = (t) => `${(t * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`;
const PRECOS = [150000, 200000, 250000, 300000, 400000, 500000];

const PERGUNTAS = [
  {
    p: "Como se calcula o IMT?",
    r: "Multiplica-se o valor da casa pela taxa do escalão e tira-se a parcela a abater. Na habitação própria e permanente, em 2026, não se paga IMT até 106 346 €; a partir daí a taxa sobe de 2% a 8%. Acima de 660 982 € paga-se 6% sobre tudo e acima de 1 150 853 €, 7,5%.",
  },
  {
    p: "O IMT incide sobre o preço ou sobre o valor patrimonial?",
    r: "Sobre o maior dos dois: o preço da escritura ou o valor patrimonial tributário (VPT) que está na caderneta predial (art. 12.º do Código do IMT).",
  },
  {
    p: "Quem tem direito ao IMT Jovem?",
    r: "Quem tem até 35 anos à data da escritura, compra a primeira casa para viver nela, não é dependente no IRS desse ano e não foi dono de outra casa nos três anos anteriores. Não paga IMT nem Imposto do Selo até 330 539 €; até 660 982 € paga só sobre a parte acima de 330 539 €. Num casal, cada um é avaliado pela sua metade.",
  },
  {
    p: "Quando se paga o IMT?",
    r: "Antes da escritura. A declaração (Modelo 1 do IMT) é entregue no Portal das Finanças, muitas vezes pelo notário ou pelo banco, e o comprovativo do pagamento é pedido na escritura. O Imposto do Selo paga-se ao mesmo tempo.",
  },
  {
    p: "E se o comprador não for residente em Portugal?",
    r: "Desde maio de 2026, quem não é residente paga uma taxa única de 7,5% na compra de casa, sem isenções, salvo se passar a residir cá no prazo de dois anos ou arrendar a casa a renda moderada (Decreto-Lei n.º 97/2026). Nesses casos pode pedir depois a devolução da diferença.",
  },
];

export default function Imt({ exemplos }) {
  const titulo = "Simulador de IMT 2026 e Imposto do Selo | PoupeJá";
  const descricao = "Quanto pagas de IMT e Imposto do Selo ao comprar casa em 2026: simulador com as tabelas oficiais, IMT Jovem, segunda habitação, Açores e Madeira.";
  const canonical = `${URL_SITE}/imt`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "IMT 2026", path: "/imt" }];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
  const td = { padding: "10px 6px", textAlign: "right" };
  const hpp = TABELAS_IMT.continente.hpp;
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Simulador de IMT 2026 e Imposto do Selo" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Simulador de IMT 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê quanto pagas de IMT e de Imposto do Selo ao comprar casa, com as tabelas das Finanças para 2026 e o IMT Jovem.
        </p>

        <CalculadoraImt />

        <h2 className="font-display" style={estiloH2}>Quanto se paga, por preço</h2>
        <div className="rounded-2xl overflow-x-auto" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th scope="col" style={{ padding: "10px 10px", textAlign: "left" }}>Preço</th>
                <th scope="col" style={td}>Para viver</th>
                <th scope="col" style={td}>IMT Jovem</th>
                <th scope="col" style={{ ...td, paddingRight: 10 }}>2.ª casa</th>
              </tr>
            </thead>
            <tbody>
              {exemplos.map((x) => (
                <tr key={x.valor} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 10px" }}>{eur0(x.valor)} €</td>
                  <td className="pj-num" style={td}>{eur(x.hpp)} €</td>
                  <td className="pj-num" style={{ ...td, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{eur(x.jovem)} €</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 10 }}>{eur(x.habitacao)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          IMT mais Imposto do Selo da compra (0,8%), no continente, com um só comprador. Não inclui o Imposto do Selo do crédito.
        </p>

        <h2 className="font-display" style={estiloH2}>Escalões do IMT 2026</h2>
        <div className="rounded-2xl overflow-x-auto" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th scope="col" style={{ padding: "10px 10px", textAlign: "left" }}>Valor da casa</th>
                <th scope="col" style={td}>Taxa</th>
                <th scope="col" style={{ ...td, paddingRight: 10 }}>Parcela a abater</th>
              </tr>
            </thead>
            <tbody>
              {hpp.map((l, i) => (
                <tr key={l.ate} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 10px" }}>
                    {i === 0 ? `Até ${eur0(l.ate)} €` : l.ate === Infinity ? `Mais de ${eur0(hpp[i - 1].ate)} €` : `${eur0(hpp[i - 1].ate)} € a ${eur0(l.ate)} €`}
                  </td>
                  <td className="pj-num" style={td}>{pct(l.taxa)}{l.unica ? " sobre tudo" : ""}</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 10 }}>{l.unica || !l.abater ? "—" : `${eur(l.abater)} €`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Habitação própria e permanente, no continente. Exemplo: casa de 250 000 € → 250 000 × 7% − 10 457,96 = 7042,04 € de IMT.
          Na segunda casa paga-se 1% logo desde o primeiro euro; nos Açores e na Madeira os escalões são 25% mais altos.
        </p>

        <h2 className="font-display" style={estiloH2}>IMT Jovem</h2>
        <p style={estiloTexto}>
          Até aos 35 anos, na primeira casa para viver, não se paga IMT nem Imposto do Selo até {eur0(TABELAS_IMT.continente.jovem[0].ate)} €.
          Entre esse valor e {eur0(TABELAS_IMT.continente.jovem[1].ate)} € paga-se 8% só sobre a parte acima, e o Imposto do Selo tem um desconto até {eur(deducaoSeloJovem())} €.
          Acima de {eur0(TABELAS_IMT.continente.jovem[1].ate)} € paga-se como toda a gente. Se a casa deixar de ser a tua habitação nos seis anos seguintes
          (salvo se a venderes, casares, te separares, tiveres mais filhos ou mudares de emprego para mais de 100 km), perdes a isenção.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=contas" tipo="imt" texto="Guarda o crédito na app e acompanha a prestação" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_TABELAS_IMT} target="_blank" rel="noopener noreferrer" style={estiloLink}>tabelas práticas do IMT para 2026 (Ofício-Circulado n.º 40129/2026)</a>,{" "}
          <a href={FONTE_ART17} target="_blank" rel="noopener noreferrer" style={estiloLink}>art. 17.º do Código do IMT</a> e{" "}
          <a href={FONTE_IMT_JOVEM} target="_blank" rel="noopener noreferrer" style={estiloLink}>IMT Jovem no Portal das Finanças</a>, confirmados a {dataExtenso(VERIFICADO_IMT)}.
          É uma estimativa: o valor final é o da liquidação das Finanças. Não inclui as despesas de escritura e registo.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/credito-habitacao", texto: "Simulador de crédito habitação" },
          { href: "/euribor", texto: "Euribor hoje" },
          { href: "/apoios/imt-isencao-jovem", texto: "IMT Jovem: como pedir" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const total = (valor, destino, jovens = 0) => calcularImt({ valor, destino, jovens }).total;
  return {
    props: {
      exemplos: PRECOS.map((valor) => ({ valor, hpp: total(valor, "hpp"), jovem: total(valor, "hpp", 1), habitacao: total(valor, "habitacao") })),
    },
  };
}
