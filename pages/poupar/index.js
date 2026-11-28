import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { Migalhas, estiloH1, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { PERFIS } from "../../lib/seoPerfis";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { jsonLdSeguro } from "../../lib/escapar";

/* Índice das páginas por perfil. Estática, sem dados. */
const TITULO = "Poupar por perfil: estudantes, famílias e reformados | PoupeJá";
const DESCRICAO = "Onde se pode poupar consoante a fase da vida: compras, refeições, transportes e apoios do Estado para estudantes, famílias e reformados.";

export default function Poupar() {
  const canonical = `${URL_SITE}/poupar`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Poupar", path: "/poupar" }];
  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Poupar por perfil" key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Poupar consoante a fase da vida</h1>
        <p style={estiloTexto}>Cada casa gasta de maneira diferente. Escolhe o perfil mais parecido com o teu.</p>
        <div className="rounded-2xl overflow-hidden" style={{ ...estiloCartao, marginTop: 20 }}>
          {PERFIS.map((p, i) => (
            <a key={p.slug} href={`/poupar/${p.slug}`} className="pj-tap block no-underline px-4 py-4" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span style={{ display: "block", fontSize: 15.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{p.nome}</span>
              <span style={{ display: "block", fontSize: 13.5, color: "var(--pj-text-muted)", marginTop: 3, lineHeight: 1.5 }}>{p.intro}</span>
            </a>
          ))}
        </div>
      </div>
    </LayoutPublico>
  );
}
