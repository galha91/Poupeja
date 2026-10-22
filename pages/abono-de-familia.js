import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraAbono from "../CalculadoraAbono";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { MONTANTES, MAJORACAO, limitesEscalao, VERIFICADO_ABONO, FONTE_MONTANTES, FONTE_GUIA, SIMULADOR_OFICIAL } from "../lib/abono";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — abono de família 2026: escalões, valores e
 * calculadora. Alvo: "abono de família 2026", "escalões abono de
 * família", "valor abono família". Regras e montantes em lib/abono.
 */
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const v = (x) => (x ? `${eur(x)} €` : "—");

const PERGUNTAS = [
  {
    p: "Como sei o meu escalão do abono de família?",
    r: "Soma os rendimentos brutos de um ano de todos os que vivem em casa e divide pelo número de filhos com direito a abono mais um. O resultado (rendimento de referência) diz o escalão: para pedidos feitos em 2026, que usam os rendimentos de 2025, o 1.º vai até 3657,50 €, o 2.º até 7315 €, o 3.º até 12 435,50 € e o 4.º até 18 287,50 €. Acima disso é o 5.º escalão, que não recebe.",
  },
  {
    p: "Até que idade se recebe o abono?",
    r: "Até aos 16 anos. Depois continua se o jovem estudar: até aos 18 no ensino básico, até aos 21 no secundário e até aos 24 no superior, com prova escolar todos os anos. No 4.º escalão o abono acaba aos 6 anos.",
  },
  {
    p: "Quando é pago o abono de família?",
    r: "Todos os meses, por transferência da Segurança Social. O pedido faz-se na Segurança Social Direta e o escalão é revisto todos os anos com os rendimentos do ano anterior.",
  },
  {
    p: "Quem tem só um responsável recebe mais?",
    r: "Sim. Nas famílias monoparentais o abono e as majorações aumentam 50% (Portaria n.º 60/2026/1, art. 4.º).",
  },
];

export default function AbonoFamilia() {
  const titulo = "Abono de família 2026: escalões e valores | PoupeJá";
  const descricao = "Quanto recebes de abono de família em 2026: escalões, valores por idade, majorações e simulador. De 44,77 € a 190,98 € por filho, por mês.";
  const canonical = `${URL_SITE}/abono-de-familia`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Apoios", path: "/apoios" }, { nome: "Abono de família 2026", path: "/abono-de-familia" }];
  const lim = limitesEscalao(2025);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
  const th = { padding: "10px 6px", textAlign: "right" };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Abono de família 2026: escalões, valores e simulador" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Abono de família 2026</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Vê o teu escalão e quanto recebes por mês, filho a filho. Valores oficiais de 2026.
        </p>

        <CalculadoraAbono />

        <h2 className="font-display" style={estiloH2}>Valores por mês, por filho</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: "var(--pj-text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th scope="col" style={{ padding: "10px 12px", textAlign: "left" }}>Escalão</th>
                <th scope="col" style={th}>Até 3 anos</th>
                <th scope="col" style={th}>3 a 6</th>
                <th scope="col" style={{ ...th, paddingRight: 12 }}>Mais de 6</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((e) => (
                <tr key={e} style={{ borderTop: "1px solid var(--pj-subtle)", color: "var(--pj-text)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e}.º</td>
                  <td className="pj-num" style={th}>{v(MONTANTES[e].ate3)}</td>
                  <td className="pj-num" style={th}>{v(MONTANTES[e].de3a6)}</td>
                  <td className="pj-num" style={{ ...th, paddingRight: 12 }}>{v(MONTANTES[e].mais6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Portaria n.º 60/2026/1, art. 2.º. O 5.º escalão não recebe abono.
        </p>

        <h2 className="font-display" style={estiloH2}>Os 5 escalões</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {[`Até ${eur(lim[0])} €`, `${eur(lim[0])} € a ${eur(lim[1])} €`, `${eur(lim[1])} € a ${eur(lim[2])} €`, `${eur(lim[2])} € a ${eur(lim[3])} €`, `Mais de ${eur(lim[3])} €`].map((t, i) => (
            <div key={i} className="flex justify-between px-4 py-3" style={{ gap: 10, ...(i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}) }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{i + 1}.º escalão</span>
              <span className="pj-num" style={{ fontSize: 14, color: "var(--pj-text-muted)" }}>{t}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Rendimento de referência para pedidos feitos em 2026 (rendimentos de 2025, IAS de 522,50 €). Quem já recebe é avaliado com os rendimentos
          de 2024 e limites um pouco mais baixos; a calculadora faz as duas contas. Para ter direito, a família também não pode ter mais de 128 911,20 € em depósitos e aplicações (240 × IAS).
        </p>

        <h2 className="font-display" style={estiloH2}>Recebe-se mais quando</h2>
        <ul style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>Há mais filhos pequenos:</strong> cada filho até 3 anos, a partir do segundo titular, tem uma majoração de {eur(MAJORACAO.doisTitulares[4])} € a {eur(MAJORACAO.doisTitulares[1])} € (com dois titulares) ou de {eur(MAJORACAO.maisDeDois[4])} € a {eur(MAJORACAO.maisDeDois[1])} € (com mais de dois).</li>
          <li style={{ marginTop: 4 }}><strong style={{ color: "var(--pj-text)" }}>A família é monoparental:</strong> mais 50% sobre o abono e as majorações.</li>
        </ul>

        <BotaoAbrirPoupeja href="/?atalho=prazos" tipo="abono" texto="Recebe na app o aviso da prova escolar e de outros prazos" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <a href={FONTE_MONTANTES} target="_blank" rel="noopener noreferrer" style={estiloLink}>Portaria n.º 60/2026/1</a> e{" "}
          <a href={FONTE_GUIA} target="_blank" rel="noopener noreferrer" style={estiloLink}>Guia Prático da Segurança Social</a>, confirmados a {dataExtenso(VERIFICADO_ABONO)}.
          O valor final é o da Segurança Social, que tem um <a href={SIMULADOR_OFICIAL} target="_blank" rel="noopener noreferrer" style={estiloLink}>simulador oficial</a>.
          Não inclui bonificação por deficiência nem abono pré-natal.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/apoios/abono-familia", texto: "Abono de família: como pedir" },
          { href: "/prazos/prova-escolar", texto: "Prazo da prova escolar" },
          { href: "/tarifa-social", texto: "Tarifa social: tens direito?" },
          { href: "/ferramentas", texto: "Todas as calculadoras", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
