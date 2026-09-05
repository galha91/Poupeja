import Head from "next/head";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { CIDADES } from "../../lib/seo-slugs";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página pública SEO — preços dos combustíveis hoje em Portugal.
 * Server-rendered com dados reais da DGEG (via /api/combustiveis),
 * cacheada 30 min na CDN. Alvo: pesquisas "preço gasóleo hoje",
 * "gasolina mais barata", etc.
 */
export default function Combustiveis({ dados, atualizadoEm, erro }) {
  const porTipo = {};
  for (const d of dados || []) {
    if (!porTipo[d.tipo]) porTipo[d.tipo] = d; // dados já vêm ordenados por preço
  }
  const tiposDestaque = ["Gasóleo", "Gasolina 95", "GPL Auto"].filter(t => porTipo[t]);
  const dataStr = atualizadoEm
    ? new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Preços dos combustíveis hoje em Portugal",
    description: "Preços mínimos e médios de gasóleo, gasolina e GPL por marca em Portugal, com dados oficiais da DGEG. Atualizado diariamente.",
    url: `${SITE_URL}/combustiveis`,
    inLanguage: "pt-PT",
    creator: { "@type": "Organization", name: "DGEG — Direção-Geral de Energia e Geologia" },
    ...(atualizadoEm ? { dateModified: atualizadoEm } : {}),
  };

  return (
    <LayoutPublico>
      <Head>
        <title>Preços dos Combustíveis Hoje em Portugal — Gasóleo e Gasolina mais baratos | PoupeJá</title>
        <meta name="description" content={`Preços de hoje por marca (dados oficiais DGEG): gasóleo desde €${porTipo["Gasóleo"]?.preco?.toFixed(3) ?? "—"}, gasolina 95 desde €${porTipo["Gasolina 95"]?.preco?.toFixed(3) ?? "—"}. Vê os postos mais baratos perto de ti, grátis.`} />
        <link rel="canonical" href={`${SITE_URL}/combustiveis`} />
        <meta property="og:title" content="Preços dos combustíveis hoje em Portugal" />
        <meta property="og:description" content="Gasóleo e gasolina mais baratos por marca, com dados oficiais da DGEG. Atualizado diariamente." />
        <meta property="og:url" content={`${SITE_URL}/combustiveis`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Dados oficiais DGEG · {dataStr}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Preços dos combustíveis hoje em Portugal
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          O preço mais baixo por marca, em todo o país, atualizado com os dados oficiais da
          Direção-Geral de Energia e Geologia. Na app PoupeJá vês os postos mais baratos{" "}
          <strong style={{ color: "var(--pj-text)" }}>perto de ti</strong> e crias avisos de preço.
        </p>

        {erro ? (
          <p style={{ marginTop: 28, color: "var(--pj-text-muted)" }}>Os dados não estão disponíveis neste momento. Tenta novamente daqui a pouco.</p>
        ) : (
          <>
            {/* Mais barato por tipo */}
            <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {tiposDestaque.map(t => (
                <div key={t} className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                  <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{t} mais barato</p>
                  <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 6 }}>
                    €{porTipo[t].preco.toFixed(3)}
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{porTipo[t].posto}</p>
                </div>
              ))}
            </div>

            {/* Tabela por marca */}
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
              Preço mínimo por marca
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              {(dados || []).slice(0, 16).map((d, i) => (
                <div key={`${d.posto}-${d.tipo}`} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{d.posto}</p>
                    <p style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{d.tipo} · {d.totalPostos} posto{d.totalPostos !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display" style={{ fontSize: 17, fontWeight: 600, color: "var(--pj-brand-ink)" }}>€{d.preco.toFixed(3)}</p>
                    <p style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>médio €{d.precoMedio.toFixed(3)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 10 }}>
              Fonte: DGEG — preços comunicados pelos postos. O preço no posto pode variar.
            </p>
          </>
        )}

        {/* Páginas por cidade */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Preços por cidade
        </h2>
        <div className="flex flex-wrap gap-2">
          {CIDADES.map(c => (
            <a
              key={c.slug}
              href={`/combustiveis/${c.slug}`}
              className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", background: "var(--pj-card)", border: "1px solid var(--pj-border)", borderRadius: 12, padding: "8px 14px" }}
            >
              {c.nome}
            </a>
          ))}
        </div>

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
  try {
    const proto = req.headers.host?.startsWith("localhost") ? "http" : "https";
    const r = await fetch(`${proto}://${req.headers.host}/api/combustiveis`);
    const j = await r.json();
    if (!j.dados?.length) throw new Error("sem dados");
    return { props: { dados: j.dados, atualizadoEm: j.atualizadoEm || null, erro: false } };
  } catch {
    return { props: { dados: [], atualizadoEm: null, erro: true } };
  }
}
