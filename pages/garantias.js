import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraGarantia from "../CalculadoraGarantia";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { PRAZOS_GARANTIA, PERGUNTAS_GARANTIAS, FONTES_GARANTIAS, VERIFICADO_GARANTIAS, perguntasLd } from "../lib/seoGarantias";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — a garantia legal explicada, com calculadora.
 * Alvo: "garantia 3 anos", "garantia legal portugal", "como reclamar
 * garantia". Texto fixo, verificado contra o DL 84/2021 (lib/seoGarantias).
 */
const TITULO = "Garantia legal de 3 anos: prazos e como reclamar | PoupeJá";
const DESCRICAO = "Até quando vai a tua garantia? Calcula em segundos e vê o que a lei te dá: 3 anos, troca no 1.º mês, 30 dias para reparar e como reclamar.";

const Fonte = ({ f }) => <a href={f.href} target="_blank" rel="noopener noreferrer" style={estiloLink}>{f.texto}</a>;

export default function Garantias() {
  const canonical = `${URL_SITE}/garantias`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Garantias", path: "/garantias" }];
  const h2 = { ...estiloH2 };
  const texto0 = { ...estiloTexto, marginTop: 0 };
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Garantia legal de 3 anos: prazos e como reclamar" key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasLd()) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Garantia de 3 anos: até quando vai a tua</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          Tudo o que compras a uma loja desde 2022 tem 3 anos de garantia legal, a contar da entrega. Quem responde é a loja,
          não só a marca, e a reparação é de graça.
        </p>

        <CalculadoraGarantia />

        <h2 className="font-display" style={h2}>Os prazos que contam</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {PRAZOS_GARANTIA.map((x, i) => (
            <div key={i} className="flex px-4 py-3" style={{ gap: 14, ...(i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}) }}>
              <span className="pj-num font-display flex-shrink-0" style={{ width: 82, fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{x.prazo}</span>
              <span style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                {x.oQue} <span style={{ fontSize: 12, color: "var(--pj-text-faint)", whiteSpace: "nowrap" }}>({x.art})</span>
              </span>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={h2}>O que podes pedir à loja</h2>
        <p style={texto0}>
          Primeiro, <strong style={{ color: "var(--pj-text)" }}>reparação ou troca</strong>: escolhes tu, salvo se a tua escolha for impossível ou
          muito mais cara para a loja do que a outra (art. 15.º). Se a loja não resolver, se o defeito voltar ou se for grave,
          podes pedir <strong style={{ color: "var(--pj-text)" }}>desconto no preço</strong> ou <strong style={{ color: "var(--pj-text)" }}>desfazer a compra</strong> e
          receber o dinheiro em 14 dias (art. 20.º).
        </p>
        <p style={estiloTexto}>
          Se o defeito aparece nos primeiros 30 dias, não tens de esperar pela reparação: podes pedir logo outro igual ou o
          dinheiro de volta (art. 16.º).
        </p>

        <h2 className="font-display" style={h2}>Como reclamar, passo a passo</h2>
        <ol style={{ ...texto0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Avisa a loja por escrito</strong> (e-mail ou carta) e guarda a prova: diz o que compraste, quando, o defeito e o que queres (art. 12.º, n.º 5).</li>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Entrega o produto</strong> com a fatura ou outra prova de compra. Transporte e reparação são por conta da loja (art. 18.º).</li>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Conta os 30 dias.</strong> Enquanto o produto está na loja, a garantia fica parada e não corre (art. 12.º, n.º 4).</li>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Sem resposta?</strong> Escreve no <Fonte f={FONTES_GARANTIAS.livro} /> e recorre a um dos <Fonte f={FONTES_GARANTIAS.arbitragem} />, que são gratuitos ou baratos.</li>
        </ol>
        <p style={estiloTexto}>
          Tens 2 anos, a contar do dia em que avisaste a loja, para fazer valer estes direitos (art. 17.º). Também podes pedir
          a reparação ou a troca diretamente ao fabricante (art. 40.º).
        </p>

        <h2 className="font-display" style={h2}>Garantia da marca ou da loja</h2>
        <p style={texto0}>
          A garantia comercial (a "extensão de garantia", o certificado da marca) é um extra: vale o que estiver escrito nela e
          na publicidade, mas nunca tira os direitos da garantia legal (art. 43.º). Antes de pagar uma extensão, vê se não dura
          menos do que os 3 anos que já tens de graça.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=garantias" tipo="garantias" texto="Guarda a fatura na app e recebe aviso antes de a garantia acabar" />

        <h2 className="font-display" style={h2}>Perguntas frequentes</h2>
        {PERGUNTAS_GARANTIAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <Fonte f={FONTES_GARANTIAS.lei} />, confirmado a {dataExtenso(VERIFICADO_GARANTIAS)}. Para compras a outro particular
          estas regras não se aplicam. Dúvidas sobre um caso concreto: <Fonte f={FONTES_GARANTIAS.portal} />.
        </p>

        <h2 className="font-display" style={h2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/devolucoes", texto: "Devolver compras online" },
          { href: "/apoios", texto: "Apoios do Estado" },
          { href: "/prazos", texto: "Prazos do Estado" },
          { href: "/precos", texto: "Preços de supermercado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
