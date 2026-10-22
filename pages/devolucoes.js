import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import CalculadoraDevolucao from "../CalculadoraDevolucao";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { PRAZOS_DEVOLUCAO, EXCECOES_DEVOLUCAO, PERGUNTAS_DEVOLUCOES, FONTES_DEVOLUCOES, VERIFICADO_DEVOLUCOES, perguntasDevolucoesLd } from "../lib/seoDevolucoes";
import { breadcrumbLd } from "../lib/seoPrecos";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — devolver compras online (livre resolução), com
 * calculadora. Alvo: "devolver compra online 14 dias", "direito de
 * devolução", "livre resolução". Texto fixo, verificado contra o
 * DL 24/2014 (lib/seoDevolucoes). Irmã de /garantias.
 */
const TITULO = "Devolver compras online: 14 dias e como fazer | PoupeJá";
const DESCRICAO = "Até quando podes devolver uma compra online? Calcula o prazo e vê as regras: 14 dias sem dar motivo, reembolso em 14 dias e o que não se devolve.";

const Fonte = ({ f }) => <a href={f.href} target="_blank" rel="noopener noreferrer" style={estiloLink}>{f.texto}</a>;
const forte = { color: "var(--pj-text)" };

export default function Devolucoes() {
  const canonical = `${URL_SITE}/devolucoes`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Devoluções", path: "/devolucoes" }];
  const texto0 = { ...estiloTexto, marginTop: 0 };
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Devolver compras online: 14 dias e como fazer" key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasDevolucoesLd()) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Devolver uma compra online: até quando podes</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          O que compras pela internet, por telefone ou por catálogo pode ser devolvido em 14 dias, sem dares motivo.
          A loja tem de te devolver o dinheiro, incluindo o envio.
        </p>

        <CalculadoraDevolucao />

        <h2 className="font-display" style={estiloH2}>Os prazos que contam</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {PRAZOS_DEVOLUCAO.map((x, i) => (
            <div key={i} className="flex px-4 py-3" style={{ gap: 14, ...(i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}) }}>
              <span className="pj-num font-display flex-shrink-0" style={{ width: 82, fontSize: 15, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{x.prazo}</span>
              <span style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5 }}>
                {x.oQue} <span style={{ fontSize: 12, color: "var(--pj-text-faint)", whiteSpace: "nowrap" }}>({x.art})</span>
              </span>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Como devolver, passo a passo</h2>
        <ol style={{ ...texto0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={forte}>Avisa a loja dentro do prazo</strong>: pelo formulário de livre resolução, por e-mail ou por carta. Guarda a prova (art. 11.º).</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Envia o produto</strong> nos 14 dias seguintes, bem conservado. Podes tê-lo aberto e experimentado como numa loja (arts. 13.º e 14.º).</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Guarda o comprovativo de envio.</strong> Com ele, a loja já não pode atrasar o reembolso (art. 12.º, n.º 4).</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Sem dinheiro em 14 dias?</strong> A loja passa a dever-te o dobro. Reclama no <Fonte f={FONTES_DEVOLUCOES.livro} /> ou num dos <Fonte f={FONTES_DEVOLUCOES.arbitragem} />.</li>
        </ol>

        <h2 className="font-display" style={estiloH2}>O que não se pode devolver</h2>
        <ul style={{ ...texto0, paddingLeft: 20, listStyle: "disc" }}>
          {EXCECOES_DEVOLUCAO.map((x) => <li key={x} style={{ marginTop: 4 }}>{x}</li>)}
        </ul>
        <p style={estiloTexto}>
          A lista está no art. 17.º. Mesmo nestes casos, se o produto tem defeito tens direito à{" "}
          <a href="/garantias" style={estiloLink}>garantia legal de 3 anos</a>.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=taloes" tipo="devolucoes" texto="Guarda o talão na app e encontra-o quando precisares" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS_DEVOLUCOES.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Fonte: <Fonte f={FONTES_DEVOLUCOES.lei} />, versão em vigor, confirmado a {dataExtenso(VERIFICADO_DEVOLUCOES)}. Dúvidas sobre
          um caso concreto: <Fonte f={FONTES_DEVOLUCOES.portal} />.
        </p>

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/garantias", texto: "Garantia de 3 anos" },
          { href: "/apoios", texto: "Apoios do Estado" },
          { href: "/precos", texto: "Preços de supermercado", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}
