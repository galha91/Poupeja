import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import {
  Atualizado, BotaoAbrirPoupeja, NotaCadeias, Pilulas, ListaArtigos, Migalhas,
  estiloH1, estiloH2, estiloTexto,
} from "../../PaginasPrecos";
import { CATEGORIAS_SEO, LOJAS_SEO, boasCompras, breadcrumbLd, hojeLisboa, BOA_COMPRA_MIN_PCT } from "../../lib/seoPrecos";
import { resumos30Dias, paraProps } from "../../lib/seoPrecosDados";
import { URL_SITE } from "../../lib/site";
import { cortar } from "../../lib/seoFormato";

/*
 * Boas compras de hoje: os artigos cujo melhor preço está no mínimo dos
 * últimos 30 dias, ou perto dele, e bem abaixo da média. É o que só o
 * histórico diz — uma promoção no folheto não diz se o preço é mesmo baixo.
 */
export default function BoasCompras({ minimos, perto, porCategoria, atualizado }) {
  const total = minimos.length + perto.length;
  const maior = [...minimos, ...perto].sort((a, b) => b.pctMedia - a.pctMedia)[0];
  const titulo = "Boas compras hoje no supermercado: preços no mínimo | PoupeJá";
  const descricao = total
    ? `${total} artigos estão hoje no preço mais baixo do mês ou perto dele${maior ? `, como ${maior.nome.toLowerCase()} (${maior.pctMedia}% abaixo da média)` : ""}. Comparado com 30 dias de preços.`
    : "Os artigos de supermercado que hoje estão no preço mais baixo dos últimos 30 dias, no Continente, Pingo Doce, Auchan, Lidl e Aldi.";
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Preços", path: "/precos" }, { nome: "Boas compras", path: "/precos/boas-compras" }];
  // Com quase nada para mostrar, a página é só uma explicação: fora do Google.
  const indexavel = total >= 3;

  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={cortar(descricao)} />
        {!indexavel && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={`${URL_SITE}/precos/boas-compras`} />
        <meta property="og:title" content="Boas compras hoje no supermercado" key="og:title" />
        <meta property="og:description" content={cortar(descricao)} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/precos/boas-compras`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Boas compras de hoje</h1>
        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>
        <p style={estiloTexto}>
          {total
            ? <>Hoje há <strong style={{ color: "var(--pj-text)" }}>{total} artigos</strong> com o melhor preço no mínimo dos últimos 30 dias ou perto dele, e pelo menos {BOA_COMPRA_MIN_PCT}% abaixo da média.</>
            : "Hoje nenhum artigo está claramente abaixo do habitual. Os preços andam iguais aos dos últimos 30 dias."}
          {" "}Se precisas deles, é boa altura para comprar.
        </p>

        {minimos.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>No preço mais baixo do mês</h2>
            <ListaArtigos artigos={minimos} />
          </>
        )}

        {perto.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Perto do mínimo</h2>
            <ListaArtigos artigos={perto} />
          </>
        )}
        <NotaCadeias lojas={LOJAS_SEO.map((l) => l.nome)} />

        <BotaoAbrirPoupeja href="/?atalho=lista" tipo="boas-compras" texto="Junta à lista e vê onde fica mais barata" />

        <h2 className="font-display" style={estiloH2}>Como sabemos que o preço é bom</h2>
        <p style={estiloTexto}>
          Todos os dias guardamos o melhor preço de cada artigo em cada cadeia, por kg, litro ou unidade. Aqui comparamos o
          melhor preço de hoje com o melhor preço de cada um dos dias anteriores (pelo menos 7 dias com registo).
          Um artigo entra na lista se estiver no mínimo desse período, ou no terço mais baixo, e pelo menos {BOA_COMPRA_MIN_PCT}% abaixo da média.
        </p>
        <p style={estiloTexto}>
          Um cartaz a dizer «promoção» não basta: às vezes o preço «antes» foi subido dias antes. O histórico mostra se o preço está mesmo baixo.
        </p>

        {porCategoria.length > 0 && (
          <>
            <h2 className="font-display" style={estiloH2}>Por categoria</h2>
            <Pilulas itens={porCategoria.map((c) => ({ href: `/precos/categoria/${c.slug}`, texto: `${c.nome} (${c.n})` }))} />
          </>
        )}

        <h2 className="font-display" style={estiloH2}>Mais preços</h2>
        <Pilulas itens={[
          { href: "/precos", texto: "Todos os preços de hoje" },
          { href: "/comparar", texto: "Comparar duas cadeias" },
          { href: "/reduflacao", texto: "Produtos que encolheram" },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const lista = boasCompras(await resumos30Dias(hojeLisboa()));
  const linha = (a) => ({ slug: a.slug, nome: a.nome, unidade: a.unidade, pctMedia: a.pctMedia, vencedor: a.vencedor, contexto: a.contexto });
  const contagem = new Map();
  for (const a of lista) contagem.set(a.categoria, (contagem.get(a.categoria) || 0) + 1);
  return {
    props: paraProps({
      minimos: lista.filter((a) => a.juizo === "minimo").map(linha),
      perto: lista.filter((a) => a.juizo === "bom").map(linha),
      porCategoria: CATEGORIAS_SEO.filter((c) => contagem.has(c.slug)).map((c) => ({ ...c, n: contagem.get(c.slug) })),
      atualizado: lista.reduce((m, a) => (a.atualizado > m ? a.atualizado : m), "") || null,
    }),
    revalidate: 10800,
  };
}
