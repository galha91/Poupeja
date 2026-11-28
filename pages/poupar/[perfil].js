import Head from "next/head";
import LayoutPublico from "../../LayoutPublico";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../../PaginasPrecos";
import { PERFIS, SLUGS_PERFIS, perfilPorSlug, perguntasPerfilLd } from "../../lib/seoPerfis";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { URL_SITE } from "../../lib/site";
import { jsonLdSeguro } from "../../lib/escapar";

/*
 * Página pública SEO por perfil: estudantes, famílias, reformados.
 * Texto fixo (lib/seoPerfis): gerada no build, sem pedidos ao Supabase.
 */
export default function PouparPerfil({ slug }) {
  const perfil = perfilPorSlug(slug);
  const canonical = `${URL_SITE}/poupar/${perfil.slug}`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Poupar", path: "/poupar" }, { nome: perfil.nome, path: `/poupar/${perfil.slug}` }];
  const outros = PERFIS.filter((p) => p.slug !== perfil.slug);
  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{perfil.titulo}</title>
        <meta name="description" content={perfil.descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={perfil.h1} key="og:title" />
        <meta property="og:description" content={perfil.descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(perguntasPerfilLd(perfil)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{perfil.h1}</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>{perfil.intro}</p>

        {perfil.seccoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-display" style={estiloH2}>{s.titulo}</h2>
            {s.paragrafos.map((t) => <p key={t} style={{ ...estiloTexto, marginTop: 0, marginBottom: 10 }}>{t}</p>)}
            <div style={{ marginTop: 12 }}>
              <Pilulas itens={s.links.map((l) => ({ href: l.href, texto: l.texto }))} />
            </div>
          </section>
        ))}

        <BotaoAbrirPoupeja href={`/?o=poupar-${perfil.slug}`} texto="Abrir o PoupeJá — grátis e sem conta" tipo={`poupar-${perfil.slug}`} />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        <div className="rounded-2xl px-4 py-1" style={estiloCartao}>
          {perfil.perguntas.map((x, i) => (
            <div key={x.p} className="py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
              <p style={{ ...estiloTexto, marginTop: 4 }}>{x.r}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Outros perfis</h2>
        <Pilulas itens={outros.map((o) => ({ href: `/poupar/${o.slug}`, texto: o.nome }))} />

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.55 }}>
          Os preços são indicativos e vêm das lojas online das cadeias; podem diferir dos das lojas físicas.
          A informação sobre apoios não dispensa a confirmação junto da entidade responsável. <a href="/fontes" style={{ color: "var(--pj-text-muted)" }}>Fontes</a>
        </p>
      </div>
    </LayoutPublico>
  );
}

export function getStaticPaths() {
  return { paths: SLUGS_PERFIS.map((perfil) => ({ params: { perfil } })), fallback: false };
}

export function getStaticProps({ params }) {
  return { props: { slug: params.perfil } };
}
