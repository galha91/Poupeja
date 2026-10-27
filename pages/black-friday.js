import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraDesconto from "../CalculadoraDesconto";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { REGRAS_DESCONTO, PERGUNTAS_BLACK_FRIDAY, FONTES_BLACK_FRIDAY, VERIFICADO_BLACK_FRIDAY, perguntasBlackFridayLd, diaBlackFriday } from "../lib/seoBlackFriday";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — Black Friday: o desconto é verdadeiro? Alvo:
 * "black friday 2026", "desconto falso", "preço mais baixo 30 dias".
 * Texto fixo, verificado contra o DL 70/2007 (lib/seoBlackFriday). Irmã
 * de /garantias e /devolucoes.
 */
const ANO = Number(VERIFICADO_BLACK_FRIDAY.slice(0, 4));
const DIA = diaBlackFriday(ANO);
const TITULO = `Black Friday ${ANO}: o desconto é verdadeiro? | PoupeJá`;
const DESCRICAO = `A Black Friday é a ${dataExtenso(DIA, { ano: false })}. Vê se o desconto é real: o preço riscado tem de ser o mais baixo dos últimos 30 dias. Calcula o desconto verdadeiro.`;

const Fonte = ({ f }) => <a href={f.href} target="_blank" rel="noopener noreferrer" style={estiloLink}>{f.texto}</a>;
const forte = { color: "var(--pj-text)" };

export default function BlackFriday() {
  const canonical = `${URL_SITE}/black-friday`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Black Friday", path: "/black-friday" }];
  const texto0 = { ...estiloTexto, marginTop: 0 };
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Black Friday ${ANO}: o desconto é verdadeiro?`} key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasBlackFridayLd()) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Black Friday {ANO}: o desconto é verdadeiro?</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          A Black Friday é a {dataExtenso(DIA)}. O preço riscado tem de ser o preço mais baixo a que a loja vendeu o produto
          nos 30 dias anteriores. Se o subiram em outubro para o «baixar» em novembro, o desconto não é o que anunciam.
        </p>

        <CalculadoraDesconto />

        <h2 className="font-display" style={estiloH2}>O que a lei exige nos descontos</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {REGRAS_DESCONTO.map((x, i) => (
            <div key={i} className="px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                {x.regra} <span style={{ fontSize: 12, color: "var(--pj-text-faint)", whiteSpace: "nowrap" }}>({x.art})</span>
              </span>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Como não ser enganado</h2>
        <ol style={{ ...texto0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={forte}>Vê o preço desde já.</strong> Tira uma foto ou captura de ecrã dos produtos que queres. Em novembro sabes se o preço «antes» é verdade.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Compara o preço riscado com o que viste.</strong> Se já esteve mais barato no último mês, o desconto real conta a partir daí. Usa a calculadora acima.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Compara entre lojas.</strong> Um desconto de 30% numa loja pode ficar mais caro do que o preço normal noutra.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Conta tudo.</strong> Portes, extensões de garantia e seguros que vêm marcados por defeito. A garantia legal de 3 anos já é tua sem pagar mais.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Desconto falso?</strong> Reclama no <Fonte f={FONTES_BLACK_FRIDAY.livro} />. A fiscalização é da <Fonte f={FONTES_BLACK_FRIDAY.asae} />.</li>
        </ol>

        <h2 className="font-display" style={estiloH2}>No supermercado também conta</h2>
        <p style={estiloTexto}>
          As mesmas regras valem para as promoções do supermercado. Guardamos todos os dias o preço de centenas de artigos no
          Continente, Pingo Doce, Auchan, Lidl e Aldi. Em cada artigo vês o histórico dos últimos 30 dias e se o preço de hoje está
          mesmo baixo: <a href="/precos" style={estiloLink}>preços de supermercado hoje</a>.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=mercados" tipo="black-friday" texto="Compara preços e cria alertas na app" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS_BLACK_FRIDAY.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <Fonte f={FONTES_BLACK_FRIDAY.lei} />, versão em vigor, confirmado a {dataExtenso(VERIFICADO_BLACK_FRIDAY)}. Dúvidas sobre
          um caso concreto: <Fonte f={FONTES_BLACK_FRIDAY.portal} />.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/garantias", texto: "Garantia de 3 anos" },
          { href: "/devolucoes", texto: "Devolver compras online" },
          { href: "/reduflacao", texto: "Produtos que encolheram" },
          { href: "/precos", texto: "Preços de supermercado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
