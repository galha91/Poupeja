import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraRendas from "../CalculadoraRendas";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { COEFICIENTES, COEFICIENTE_2027, VERIFICADO_RENDAS, FONTE_AVISO_INE, FONTE_COEFICIENTES } from "../lib/rendas";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — atualização das rendas em 2027: coeficiente,
 * calculadora e carta ao inquilino. Alvo: "atualização de rendas 2027",
 * "coeficiente de atualização das rendas", "aumento da renda 2027".
 * Regras em lib/rendas.
 */
const pct = (c) => `${((c - 1) * 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const coef = (c) => c.toLocaleString("pt-PT", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const PERGUNTAS = [
  {
    p: "Quanto podem subir as rendas em 2027?",
    r: "Até 2,56%. O coeficiente de atualização de 2027 é de 1,0256, fixado pelo INE no Aviso n.º 24199/2026/2, de 1 de outubro, para todos os tipos de arrendamento: habitação (renda livre, condicionada ou apoiada), comércio e outros fins.",
  },
  {
    p: "Como se calcula a renda nova?",
    r: "Multiplica-se a renda atual por 1,0256. Uma renda de 750 € passa a 769,20 €. A conta arredonda-se ao cêntimo.",
  },
  {
    p: "Quando começa a valer a renda nova?",
    r: "No aniversário do contrato, e só a partir do fim do 1.º ano. Um contrato que começou a 1 de fevereiro de 2026 só pode ter a renda nova a partir de 1 de fevereiro de 2027. Um contrato que começa em 2027 só se atualiza em 2028.",
  },
  {
    p: "Como tem de ser feita a comunicação ao inquilino?",
    r: "Por escrito, com pelo menos 30 dias de antecedência, a dizer o coeficiente e a renda nova. Faz-se por carta registada com aviso de receção, ou entregando em mão com a assinatura do inquilino a confirmar que recebeu.",
  },
  {
    p: "O senhorio é obrigado a aumentar a renda?",
    r: "Não. O coeficiente é o máximo que o senhorio pode aplicar, não um aumento automático. Pode aumentar menos ou não aumentar.",
  },
  {
    p: "E se o contrato tiver outra regra de atualização?",
    r: "Vale o que está no contrato. O coeficiente do INE aplica-se quando senhorio e inquilino não combinaram outro critério de atualização.",
  },
  {
    p: "Como se calcula o coeficiente do INE?",
    r: "É a variação do índice de preços no consumidor, sem habitação, nos últimos 12 meses com valores disponíveis a 31 de agosto. O INE publica-o em outubro, para vigorar no ano civil seguinte.",
  },
];

export default function AtualizacaoRendas() {
  const titulo = "Atualização de rendas 2027: calculadora e carta | PoupeJá";
  const descricao = "Quanto sobe a renda em 2027: coeficiente de 1,0256 (+2,56%), calculadora com a data do aumento, prazo do aviso ao inquilino e modelo de carta.";
  const canonical = `${URL_SITE}/atualizacao-de-rendas`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }, { nome: "Atualização de rendas 2027", path: "/atualizacao-de-rendas" }];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
  const td = { padding: "10px 6px", textAlign: "right" };
  const anos = Object.keys(COEFICIENTES).map(Number).sort((a, b) => b - a);
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Atualização de rendas 2027: calculadora e modelo de carta" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Atualização das rendas em 2027</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          As rendas podem subir até {pct(COEFICIENTE_2027)} em 2027. Vê quanto passa a ser a tua e quando o aumento pode começar.
        </p>

        <CalculadoraRendas />

        <h2 className="font-display" style={estiloH2}>Coeficientes dos últimos anos</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Ano</th>
                <th scope="col" style={td}>Coeficiente</th>
                <th scope="col" style={{ ...td, paddingRight: 12 }}>Aumento</th>
              </tr>
            </thead>
            <tbody>
              {anos.map((a) => (
                <tr key={a} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td className="pj-num" style={{ padding: "10px 12px" }}>{a}</td>
                  <td className="pj-num" style={td}>{coef(COEFICIENTES[a])}</td>
                  <td className="pj-num" style={{ ...td, paddingRight: 12, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{pct(COEFICIENTES[a])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Em 2023 o aumento foi limitado a 2% por lei, apesar de o índice dar mais.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=prazos" tipo="rendas" texto="Recebe na app o aviso do prazo da carta e de outros prazos" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_AVISO_INE} target="_blank" rel="noopener noreferrer" style={estiloLink}>Aviso do INE n.º 24199/2026/2</a> e{" "}
          <a href={FONTE_COEFICIENTES} target="_blank" rel="noopener noreferrer" style={estiloLink}>coeficientes do Portal da Habitação</a>, confirmados a {dataExtenso(VERIFICADO_RENDAS)}.
          O modelo de carta é só um ponto de partida e não substitui aconselhamento jurídico. Não cobre contratos anteriores a 1990 nem rendas com regras próprias.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/imt", texto: "Simulador de IMT 2026" },
          { href: "/credito-habitacao", texto: "Simulador de crédito habitação" },
          { href: "/mais-valias", texto: "Mais-valias da venda de casa" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
