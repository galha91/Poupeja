import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, Migalhas, estiloH1, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import dadosPrazos from "../../data/prazos-estado.json";
import { slugPrazo, estadoPrazo } from "../../lib/seoEstado";
import { ordenarPrazos } from "../../lib/prazosEstado";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { hojeLisboa } from "../../lib/seoFormato";
import { URL_SITE } from "../../lib/site";

/* Hub dos prazos do Estado: o que acaba primeiro, à frente. */
export default function Prazos({ prazos, ano }) {
  const titulo = `Prazos do Estado ${ano}: IRS, IMI, abono e mais | PoupeJá`;
  const descricao = `${prazos.length} prazos das Finanças e da Segurança Social, por ordem: o que acaba primeiro à frente, com os dias que faltam e o link oficial.`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Prazos do Estado", path: "/prazos" }];
  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${URL_SITE}/prazos`} />
        <meta property="og:title" content={`Prazos do Estado ${ano}`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={`${URL_SITE}/prazos`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Prazos do Estado a não perder</h1>
        <p style={estiloTexto}>O que acaba primeiro está à frente. Cada prazo foi confirmado na fonte oficial.</p>
        <div className="rounded-2xl overflow-hidden mt-6" style={estiloCartao}>
          {prazos.map((p, i) => (
            <a key={p.slug} href={`/prazos/${p.slug}`} className="block px-4 py-3 no-underline" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{p.titulo}</span>
              <span style={{ display: "block", fontSize: 12.5, color: p.aberto ? "var(--pj-brand-ink)" : "var(--pj-text-faint)", marginTop: 2, fontWeight: p.aberto ? 600 : 400 }}>
                {p.resumo}
              </span>
            </a>
          ))}
        </div>
        <BotaoAbrirPoupeja href="/?atalho=apoios" tipo="prazos" texto="Recebe avisos na app antes de cada prazo" />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const hoje = hojeLisboa();
  const prazos = ordenarPrazos(dadosPrazos.prazos, hoje).map((p) => {
    const e = estadoPrazo(p, hoje);
    return {
      slug: slugPrazo(p),
      titulo: p.titulo,
      aberto: !!e?.aberto,
      resumo: e?.aberto ? `A decorrer · faltam ${e.dias} dia${e.dias !== 1 ? "s" : ""}` : p.prazoTexto,
    };
  });
  return { props: { prazos, ano: hoje.slice(0, 4) }, revalidate: 21600 };
}
