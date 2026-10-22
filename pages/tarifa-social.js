import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import VerificadorTarifaSocial from "../VerificadorTarifaSocial";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { PRESTACOES, VALOR_TARIFA, LIMITE_RENDIMENTO, PERGUNTAS_TARIFA_SOCIAL, FONTES_TARIFA_SOCIAL, VERIFICADO_TARIFA_SOCIAL, perguntasTarifaLd } from "../lib/seoTarifaSocial";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — "tenho direito à tarifa social?" para luz, gás
 * natural e internet, com verificador. Alvo: "tarifa social quem tem
 * direito", "tarifa social luz requisitos", "tarifa social internet".
 * Regras e valores em lib/seoTarifaSocial (DGEG, ERSE, ANACOM).
 */
const TITULO = "Tarifa social luz, gás e internet: tens direito? | PoupeJá";
const DESCRICAO = "Vê em 30 segundos se tens direito à tarifa social de eletricidade, gás natural e internet: prestações, limite de rendimento, desconto e como pedir.";

const Fonte = ({ f, children }) => <a href={f.href} target="_blank" rel="noopener noreferrer" style={estiloLink}>{children || f.texto}</a>;
const forte = { color: "var(--pj-text)" };
const eur = (v) => v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TarifaSocial() {
  const canonical = `${URL_SITE}/tarifa-social`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Apoios", path: "/apoios" }, { nome: "Tarifa social", path: "/tarifa-social" }];
  const texto0 = { ...estiloTexto, marginTop: 0 };
  const linhas = [
    { tipo: "Eletricidade", valor: `${String(VALOR_TARIFA.luz.pct).replace(".", ",")}% de desconto`, ex: VALOR_TARIFA.luz.exemplo, extra: VALOR_TARIFA.luz.extra },
    { tipo: "Gás natural", valor: `${String(VALOR_TARIFA.gas.pct).replace(".", ",")}% de desconto`, ex: VALOR_TARIFA.gas.exemplo, extra: VALOR_TARIFA.gas.extra },
    { tipo: "Internet", valor: VALOR_TARIFA.internet.preco, ex: VALOR_TARIFA.internet.exemplo, extra: VALOR_TARIFA.internet.extra },
  ];
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Tarifa social de luz, gás e internet: tens direito?" key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasTarifaLd()) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Tarifa social: vê se tens direito</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Luz, gás natural e internet mais baratos para quem recebe certas prestações ou tem rendimentos baixos.
          Responde a duas perguntas e vê a que tens direito.
        </p>

        <VerificadorTarifaSocial />

        <h2 className="font-display" style={estiloH2}>Quanto vale</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {linhas.map((x, i) => (
            <div key={x.tipo} className="px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <p className="flex justify-between" style={{ gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{x.tipo}</span>
                <span className="pj-num font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)", textAlign: "right" }}>{x.valor}</span>
              </p>
              <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4, lineHeight: 1.5 }}>{x.ex} {x.extra}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
          Luz: desconto de 2026. Gás: de outubro de 2026 a setembro de 2027. Percentagens sem taxas nem impostos (<Fonte f={FONTES_TARIFA_SOCIAL.erse} />).
        </p>

        <h2 className="font-display" style={estiloH2}>Quem tem direito</h2>
        <p style={texto0}>
          <strong style={forte}>Por prestação social.</strong> Basta receberes uma destas: {PRESTACOES.map((p) => p.nome.toLowerCase()).join("; ")}.
          No gás natural, o abono só conta no 1.º escalão e a pensão social de velhice não conta.
        </p>
        <p style={estiloTexto}>
          <strong style={forte}>Por rendimento.</strong> Na luz, se o agregado ganhou até {eur(LIMITE_RENDIMENTO.luz)} € no ano; na internet,
          até {eur(LIMITE_RENDIMENTO.internet)} €. Os dois limites sobem 50% por cada pessoa sem rendimentos, incluindo tu, até 10 pessoas.
          No gás natural não há acesso por rendimento.
        </p>
        <p style={estiloTexto}>
          <strong style={forte}>E o contrato:</strong> tem de estar no teu nome e ser da casa onde vives. Na luz, a potência não pode passar
          de 6,9 kVA; no gás, o consumo não pode passar de 500 m³ por ano.
        </p>

        <h2 className="font-display" style={estiloH2}>Como pedir</h2>
        <ol style={{ ...texto0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={forte}>Luz e gás são automáticos.</strong> A DGEG cruza os dados com a Segurança Social e as Finanças e o desconto aparece na fatura, identificado.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Não aparece?</strong> Pede um comprovativo à Segurança Social (ou às Finanças, se for por rendimento) e entrega-o ao teu fornecedor.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Internet:</strong> pede-a ao teu operador com nome, NIF e morada fiscal. A ANACOM confirma e o serviço é ativado em até 10 dias.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Dúvidas ou recusa:</strong> usa o <Fonte f={FONTES_TARIFA_SOCIAL.reclamar} /> ou liga para a linha da tarifa social, 210 308 536.</li>
        </ol>

        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="tarifa-social" texto="Vê na app todos os apoios a que podes ter direito" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS_TARIFA_SOCIAL.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fontes: <Fonte f={FONTES_TARIFA_SOCIAL.dgeg} />, <Fonte f={FONTES_TARIFA_SOCIAL.erse} /> e <Fonte f={FONTES_TARIFA_SOCIAL.anacom} />,
          confirmadas a {dataExtenso(VERIFICADO_TARIFA_SOCIAL)}. O resultado é indicativo: quem decide é a DGEG (luz e gás) e a ANACOM (internet).
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/apoios/tarifa-social-eletricidade", texto: "Tarifa social de eletricidade" },
          { href: "/apoios/tarifa-social-gas", texto: "Tarifa social de gás" },
          { href: "/apoios", texto: "Todos os apoios do Estado" },
          { href: "/prazos", texto: "Prazos do Estado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
