import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import { Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { URL_SITE, DOMINIO_VISIVEL } from "../lib/site";
import { COMPARADAS, NAO_INCLUIDAS } from "../lib/cobertura";

/*
 * Página de imprensa: o que é o PoupeJá em poucas linhas, os dados que
 * se podem citar, o logótipo e o contacto. Texto fixo, sem dados por
 * pedido. É o link que vai nos emails a jornalistas (docs/CAMPANHA.md).
 */
const CONTACTO = "poupeja.portugal@gmail.com";
const TITULO = "Imprensa: o que é o PoupeJá, dados e contacto";
const DESCRICAO = "O PoupeJá é um site português, grátis e sem registo, que compara preços de supermercado, folhetos e combustíveis. Dados para citar, logótipo e contacto.";

const DADOS = [
  { href: "/barometro", nome: "Barómetro do cabaz", texto: "O custo do cabaz básico em cada cadeia, semana a semana." },
  { href: "/precos", nome: "Preços por artigo", texto: "O preço de hoje de cada artigo básico em cada cadeia, com histórico." },
  { href: "/comparar", nome: "Cadeia contra cadeia", texto: "Qual de duas cadeias fica mais barata, artigo a artigo." },
  { href: "/combustiveis", nome: "Combustíveis por concelho", texto: "Os postos mais baratos de cada concelho, com dados oficiais da DGEG." },
  { href: "/combustiveis/esta-semana", nome: "Combustíveis esta semana", texto: "O que cada marca subiu ou desceu nos últimos 7 dias." },
  { href: "/reduflacao", nome: "Reduflação", texto: "Produtos que ficaram mais pequenos sem o preço descer." },
];
const FICHEIROS = [
  { href: "/icon.svg", nome: "Logótipo (SVG)" },
  { href: "/icon-512.png", nome: "Logótipo (PNG, 512 px)" },
  { href: "/og.png", nome: "Imagem de apresentação (PNG)" },
];

export default function Imprensa() {
  const canonical = `${URL_SITE}/imprensa`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Imprensa", path: "/imprensa" }];
  const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
  return (
    <LayoutPublico>
      <Head>
        <title>{`${TITULO} | PoupeJá`}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={TITULO} key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Imprensa</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          O PoupeJá ({DOMINIO_VISIVEL}) é um site português, grátis e sem registo, para ver onde ficam mais baratas as compras
          antes de sair de casa: preços de supermercado, folhetos, combustíveis, receitas, talões e garantias, e apoios do Estado.
        </p>

        <h2 className="font-display" style={estiloH2}>Em poucas linhas</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {[
            `Compara os preços online de ${COMPARADAS.length} cadeias: ${COMPARADAS.map((c) => c.nome).join(", ")}.`,
            "Os preços dos combustíveis são os que os postos comunicam à DGEG.",
            "Não pede email nem instalação. Não vende dados.",
            "Alguns links levam a lojas parceiras e podem dar comissão. Isso não altera os resultados.",
          ].map((t, i) => (
            <p key={i} className="px-4 py-3" style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5, ...linha(i) }}>{t}</p>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 10, lineHeight: 1.55 }}>
          Cadeias que ainda não entram na comparação: {NAO_INCLUIDAS.map((c) => c.nome).join(", ")}. Do Lidl só entram as promoções do folheto.
        </p>

        <h2 className="font-display" style={estiloH2}>Dados que pode citar</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {DADOS.map((d, i) => (
            <a key={d.href} href={d.href} className="pj-tap no-underline block px-4 py-3" style={linha(i)}>
              <span className="block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{d.nome}</span>
              <span className="block" style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>{d.texto}</span>
            </a>
          ))}
        </div>
        <p style={estiloTexto}>
          Os números podem ser usados livremente com a indicação «Fonte: PoupeJá, {DOMINIO_VISIVEL}» e a data dos preços, que está em cada página.
        </p>

        <h2 className="font-display" style={estiloH2}>Logótipo e imagens</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {FICHEIROS.map((f, i) => (
            <a key={f.href} href={f.href} download className="pj-tap no-underline block px-4 py-3" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-brand-ink)", ...linha(i) }}>{f.nome}</a>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Contacto</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Para pedir dados de um artigo, de uma cadeia ou de um concelho, ou marcar uma conversa:{" "}
          <a href={`mailto:${CONTACTO}`} style={estiloLink}>{CONTACTO}</a>.
        </p>
      </div>
    </LayoutPublico>
  );
}
