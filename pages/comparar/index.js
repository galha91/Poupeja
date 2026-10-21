import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { Atualizado, BotaoAbrirPoupeja, NotaCadeias, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { PARES, LOJAS_SEO, comComparacao, compararPar, vitoriasPorLoja, breadcrumbLd, hojeLisboa } from "../../lib/seoPrecos";
import { resumosRecentes, paraProps } from "../../lib/seoPrecosDados";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Hub das comparações entre cadeias. Cada par mostra o resultado de hoje,
 * para o link já responder à pergunta antes do clique.
 */
export default function Comparar({ pares, vitorias, atualizado }) {
  const titulo = "Comparar supermercados: qual é mais barato? | PoupeJá";
  const lider = vitorias[0];
  const descricao = lider
    ? `Continente, Pingo Doce, Auchan, Lidl e Aldi frente a frente. Hoje, o ${lider.nome} é o mais barato em ${lider.vitorias} artigos. Vê cada comparação.`
    : "Continente, Pingo Doce, Auchan, Lidl e Aldi frente a frente, nos mesmos artigos, por kg e por litro.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Comparar", path: "/comparar" }];
  const comDados = pares.filter((p) => p.comuns > 0);

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        <link rel="canonical" href={`${URL_SITE}/comparar`} />
        <meta property="og:title" content="Comparar supermercados: qual é mais barato?" key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/comparar`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Qual é o supermercado mais barato?</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>
          Depende do que compras. Comparamos os mesmos artigos, cadeia a cadeia, pelo preço por kg, litro ou unidade.
          {lider && <> Hoje, quem ganha mais vezes é o <strong style={{ color: "var(--pj-text)" }}>{lider.nome}</strong> ({lider.vitorias} artigos).</>}
        </p>

        <h2 className="font-display" style={estiloH2}>Frente a frente</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {(comDados.length ? comDados : pares).map((p, i) => (
            <a key={p.slug} href={`/comparar/${p.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{p.a} vs {p.b}</span>
              <span style={{ fontSize: 12.5, color: "var(--pj-text-muted)", textAlign: "right" }}>
                {p.comuns ? <>{p.vencedor ? <><strong style={{ color: "var(--pj-brand-ink)" }}>{p.vencedor}</strong> em {p.vitorias} de {p.comuns}</> : `empate em ${p.comuns}`}</> : "ver"}
              </span>
            </a>
          ))}
        </div>
        <NotaCadeias lojas={LOJAS_SEO.map((l) => l.nome)} />

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="comparar" texto="Vê onde a tua lista fica mais barata" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const artigos = comComparacao(await resumosRecentes(hojeLisboa()));
  const pares = PARES.map((p) => {
    const r = compararPar(p, artigos);
    const vencedor = r.ganhaA > r.ganhaB ? p.a.nome : r.ganhaB > r.ganhaA ? p.b.nome : null;
    return { slug: p.slug, a: p.a.nome, b: p.b.nome, comuns: r.linhas.length, vencedor, vitorias: Math.max(r.ganhaA, r.ganhaB) };
  }).sort((x, y) => y.comuns - x.comuns);
  return {
    props: paraProps({
      pares,
      vitorias: vitoriasPorLoja(artigos),
      atualizado: artigos.reduce((m, a) => (a.atualizado > m ? a.atualizado : m), "") || null,
    }),
    revalidate: 10800,
  };
}
