import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao,
} from "../../PaginasPrecos";
import { PARES, parPorSlug, comComparacao, compararPar, fraseParComparado, breadcrumbLd, hojeLisboa, porUnidade, euros } from "../../lib/seoPrecos";
import { resumosRecentes, paraProps } from "../../lib/seoPrecosDados";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Página pública SEO — duas cadeias frente a frente, nos artigos que as
 * duas têm. Alvo: "continente ou pingo doce mais barato", "lidl vs aldi".
 * "pingo-doce-vs-continente" redireciona para a ordem canónica.
 */
export default function CompararPar({ par, r, frase, atualizado, outros }) {
  const { a, b } = par;
  const slug = `${a.slug}-vs-${b.slug}`;
  const titulo = `${a.nome} vs ${b.nome}: qual é mais barato? | PoupeJá`;
  const descricao = r.linhas.length
    ? `${frase} Preços de hoje, artigo a artigo, por kg e por litro.`
    : `${a.nome} ou ${b.nome}: qual é mais barato? Comparamos os mesmos artigos nas duas cadeias, por kg e por litro.`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Comparar", path: "/comparar" }, { nome: `${a.nome} vs ${b.nome}`, path: `/comparar/${slug}` }];
  const cab = { fontSize: 11, fontWeight: 600, color: "var(--pj-text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "right" };

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        {!r.indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/comparar/${slug}`} />
        <meta property="og:title" content={`${a.nome} vs ${b.nome}: qual é mais barato?`} key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/comparar/${slug}`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{a.nome} ou {b.nome}: qual é mais barato?</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>{frase}</p>

        {r.linhas.length > 0 && (
          <>
            <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[[a, r.ganhaA], [b, r.ganhaB]].map(([l, n]) => (
                <div key={l.id} className="rounded-2xl p-4" style={{ ...estiloCartao, ...(n > (l === a ? r.ganhaB : r.ganhaA) ? { background: "var(--pj-brand-wash)" } : {}) }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</p>
                  <p className="pj-num font-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 4 }}>{n}</p>
                  <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)" }}>artigos mais baratos</p>
                </div>
              ))}
            </div>

            <h2 className="font-display" style={estiloH2}>Artigo a artigo</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...cab, textAlign: "left" }}>Artigo</th>
                    <th scope="col" style={cab}>{a.nome}</th>
                    <th scope="col" style={cab}>{b.nome}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.linhas.map((l) => {
                    const u = porUnidade(l.unidade);
                    const celula = (v, ganha) => ({ padding: "11px 12px", textAlign: "right", whiteSpace: "nowrap", fontSize: 14, fontWeight: ganha ? 700 : 500, color: ganha ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" });
                    return (
                      <tr key={l.slug} style={{ borderTop: "1px solid var(--pj-subtle)" }}>
                        <td style={{ padding: "11px 12px" }}>
                          <a href={`/precos/${l.slug}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)", textDecoration: "none" }}>{l.nome}</a>
                        </td>
                        <td className="pj-num" style={celula(l.a, l.ganha === a.id)}>{euros(l.a)} €{u}</td>
                        <td className="pj-num" style={celula(l.b, l.ganha === b.id)}>{euros(l.b)} €{u}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <NotaCadeias lojas={[a.nome, b.nome]} />
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", lineHeight: 1.6, marginTop: 6 }}>
          Em cada cadeia conta o produto mais barato por kg, litro ou unidade — muitas vezes a marca própria.
          O que pagas depende da tua lista: na app, a comparação faz-se com os artigos que compras.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="comparar" texto={`Vê se a tua lista fica mais barata no ${a.nome} ou no ${b.nome}`} />

        <h2 className="font-display" style={estiloH2}>Outras comparações</h2>
        <Pilulas itens={[...outros.map((p) => ({ href: `/comparar/${p.slug}`, texto: p.texto })), { href: "/precos", texto: "Todos os preços", fraco: true }]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticPaths() {
  return { paths: PARES.map((p) => ({ params: { par: p.slug } })), fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const achado = parPorSlug(params.par);
  if (!achado) return { notFound: true };
  const { par, invertido } = achado;
  if (invertido) return { redirect: { destination: `/comparar/${par.slug}`, permanent: true } };
  const artigos = comComparacao(await resumosRecentes(hojeLisboa()));
  const r = compararPar(par, artigos);
  const usados = new Set(r.linhas.map((l) => l.slug));
  const atualizado = artigos.filter((x) => usados.has(x.slug)).reduce((m, x) => (x.atualizado > m ? x.atualizado : m), "") || null;
  return {
    props: paraProps({
      par,
      r: { ...r, linhas: r.linhas.map(({ slug, nome, unidade, a, b, ganha }) => ({ slug, nome, unidade, a, b, ganha })) },
      frase: fraseParComparado(par, r),
      atualizado,
      outros: PARES.filter((p) => p.slug !== par.slug && (p.a.id === par.a.id || p.b.id === par.b.id || p.a.id === par.b.id || p.b.id === par.a.id))
        .map((p) => ({ slug: p.slug, texto: `${p.a.nome} vs ${p.b.nome}` })),
    }),
    revalidate: 10800,
  };
}
