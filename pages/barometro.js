import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import { Preco } from "../Preco";
import { Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { eur } from "../lib/formato";
import { dataExtenso } from "../lib/datas";
import { URL_SITE, DOMINIO_VISIVEL } from "../lib/site";
import { NAO_INCLUIDAS } from "../lib/cobertura";
import { lerBarometro, barometroServe, variacao, mesmoCabaz } from "../lib/barometro";

/*
 * Barómetro PoupeJá: quanto custa o cabaz básico esta semana, por cadeia,
 * e quanto mudou desde a semana passada. É a página que se envia a
 * jornalistas e que outros sites podem citar (ver docs/CAMPANHA.md).
 *
 * Lê uma linha de paginas_marca, já calculada nos GitHub Actions
 * (lib/barometro). Sem dados recentes fica fora do Google (noindex).
 */
const forte = { color: "var(--pj-text)" };
const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
const sinal = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${eur(Math.abs(v), 2)} €`;

export default function Barometro({ semanas = [], atual = false }) {
  const canonical = `${URL_SITE}/barometro`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Barómetro do cabaz", path: "/barometro" }];
  const s = semanas[semanas.length - 1] || null;
  const v = variacao(semanas);
  const barata = s?.lojas[0];
  const cara = s?.lojas[s.lojas.length - 1];
  const diferenca = s ? Math.round((cara.total - barata.total) * 100) / 100 : 0;
  const titulo = "Barómetro PoupeJá: quanto custa o cabaz básico esta semana";
  const descricao = s
    ? `A ${dataExtenso(s.dia, { ano: false })}, o cabaz básico de ${s.artigos.length} artigos custa em média ${eur(s.media, 2)} € nas ${s.lojas.length} cadeias comparadas: de ${eur(barata.total, 2)} € (${barata.nome}) a ${eur(cara.total, 2)} € (${cara.nome}).`
    : "O custo do cabaz básico de supermercado em Portugal, por cadeia e semana a semana, com preços online recolhidos pelo PoupeJá.";
  const frase = s
    ? `Segundo o Barómetro PoupeJá, a ${dataExtenso(s.dia)} o cabaz básico de ${s.artigos.length} artigos custava ${eur(barata.total, 2)} € no ${barata.nome} e ${eur(cara.total, 2)} € no ${cara.nome} (preços online).`
    : "";

  return (
    <LayoutPublico>
      <Head>
        <title>{`${titulo} | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        {!atual && <meta name="robots" content="noindex" />}
        <meta property="og:title" content={titulo} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Barómetro PoupeJá: quanto custa o cabaz básico esta semana</h1>

        {!s ? (
          <p style={estiloTexto}>
            O barómetro guarda todas as semanas o custo dos mesmos artigos básicos em cada cadeia com preços online.
            O primeiro valor aparece aqui assim que o cabaz desta semana for calculado.
          </p>
        ) : (
          <>
            <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
              Preços online recolhidos a {dataExtenso(s.dia)}. {s.artigos.length} artigos básicos, os mesmos em {s.lojas.length} cadeias de âmbito nacional.
            </p>

            <div className="rounded-2xl p-4 mt-6" style={estiloCartao}>
              <p style={rotulo}>Custo médio do cabaz</p>
              <div className="flex items-center justify-between" style={{ marginTop: 8, gap: 10 }}>
                <Preco valor={s.media} tamanho={30} />
                {v && (
                  <span className="pj-num" style={{ fontSize: 12.5, fontWeight: 600, padding: "3px 8px", borderRadius: 8, background: "var(--pj-subtle)", color: "var(--pj-text)" }}>
                    {Math.abs(v.diff) < 0.01 ? "igual à semana passada" : `${sinal(v.diff)} (${String(Math.abs(v.pct)).replace(".", ",")}%) numa semana`}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 6, lineHeight: 1.5 }}>
                {v
                  ? `Comparado com ${dataExtenso(v.desde, { ano: false })}, o mesmo cabaz nas mesmas cadeias.`
                  : semanas.length > 1
                    ? "Sem comparação com a semana passada: os artigos ou as cadeias com preço não são os mesmos."
                    : "Primeira semana do barómetro. A variação aparece a partir da segunda."}
              </p>
            </div>

            <h2 className="font-display" style={estiloH2}>O cabaz em cada cadeia</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {s.lojas.map((l, i) => (
                <div key={l.loja} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{l.nome}</span>
                  <Preco valor={l.total} tamanho={19} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 10, lineHeight: 1.55 }}>
              {s.empate
                ? <>Entre a mais barata e a mais cara vão {eur(diferenca, 2)} €. A diferença é pequena ou depende de um só artigo, por isso <strong style={forte}>esta semana não há uma cadeia claramente mais barata</strong>.</>
                : <>O {barata.nome} fica {eur(diferenca, 2)} € abaixo do {cara.nome} neste cabaz.</>}
            </p>

            <h2 className="font-display" style={estiloH2}>O que entra no cabaz</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>
              {s.artigos.join(", ")}. Uma unidade de cada, o produto mais barato de cada cadeia na mesma quantidade.
            </p>

            {semanas.length > 1 && (
              <>
                <h2 className="font-display" style={estiloH2}>Semana a semana</h2>
                <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
                  {[...semanas].reverse().slice(0, 12).map((x, i, lista) => {
                    const anterior = lista[i + 1];
                    return (
                      <div key={x.semana} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>Semana de {dataExtenso(x.semana, { ano: false })}</p>
                          <p className="pj-num" style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>
                            de {eur(x.lojas[0].total, 2)} € ({x.lojas[0].nome}) a {eur(x.lojas[x.lojas.length - 1].total, 2)} €
                            {anterior && !mesmoCabaz(x, anterior) ? " · cabaz diferente do da semana anterior" : ""}
                          </p>
                        </div>
                        <Preco valor={x.media} tamanho={17} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <h2 className="font-display" style={estiloH2}>Como é calculado</h2>
            <p style={{ ...estiloTexto, marginTop: 0 }}>
              Todos os dias o PoupeJá pesquisa os mesmos artigos nas lojas online de cada cadeia e fica com o mais barato de cada uma, na mesma quantidade.
              Só se somam os artigos que todas as cadeias têm nesse dia. O valor da semana é o do dia mais recente.
              Duas semanas só são comparadas quando o cabaz é o mesmo: os mesmos artigos nas mesmas cadeias.
            </p>
            <p style={estiloTexto}>
              <strong style={forte}>Limitações.</strong> São preços das lojas online, que podem ser diferentes dos da loja física.
              Só entram cadeias de âmbito nacional com o sortido todo online. Ficam de fora {NAO_INCLUIDAS.map((c) => c.nome).join(", ")} e
              o Lidl, que só publica as promoções. O cabaz é pequeno: mostra a tendência, não a conta de uma família.
            </p>

            <h2 className="font-display" style={estiloH2}>Como citar</h2>
            <div className="rounded-2xl p-4" style={estiloCartao}>
              <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.6 }}>{frase}</p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 8 }}>Fonte: Barómetro PoupeJá, {DOMINIO_VISIVEL}/barometro</p>
            </div>
            <p style={estiloTexto}>
              Os números podem ser usados livremente com indicação da fonte. Para dados de outros artigos ou de um concelho,
              ver a <a href="/imprensa" style={estiloLink}>página de imprensa</a>.
            </p>
          </>
        )}

        <CtaApp texto="Compara a tua lista de compras, grátis e sem conta" href="/?atalho=lista" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const props = await lerBarometro();
  const atual = !!props && barometroServe(props);
  // Só as últimas 12 semanas vão para a página.
  return { props: { semanas: props ? props.semanas.slice(-13) : [], atual }, revalidate: atual ? 12 * 3600 : 3600 };
}
