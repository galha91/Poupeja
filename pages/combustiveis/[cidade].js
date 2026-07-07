import Head from "next/head";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { CIDADES } from "../../lib/seo-slugs";

const SITE_URL = "https://xn--poupej-uta.com";

// Tipos em destaque nos cartões (os mesmos da página nacional)
const TIPOS_DESTAQUE = ["Gasóleo", "Gasolina 95", "GPL Auto"];

/*
 * Página pública SEO — combustíveis mais baratos numa cidade.
 * Server-rendered com dados reais da DGEG (via /api/combustiveis em modo
 * local, raio 15 km), cacheada 30 min na CDN. Alvo: "gasóleo mais barato
 * em lisboa", "gasolina barata porto", etc.
 */
export default function CombustiveisCidade({ cidade, destaques, estacoes, atualizadoEm, erro }) {
  const dataStr = atualizadoEm
    ? new Date(atualizadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const gasoleo = destaques.find(d => d.tipoLabel === "Gasóleo");
  const gasolina = destaques.find(d => d.tipoLabel === "Gasolina 95");
  const descricao = gasoleo || gasolina
    ? `Preços de hoje em ${cidade.nome} (dados oficiais DGEG)${gasoleo ? `: gasóleo desde €${gasoleo.preco.toFixed(3)}` : ""}${gasolina ? `${gasoleo ? "," : ":"} gasolina 95 desde €${gasolina.preco.toFixed(3)}` : ""}. Vê os postos mais baratos num raio de 15 km, grátis.`
    : `Postos de combustível mais baratos em ${cidade.nome} e num raio de 15 km, com dados oficiais da DGEG. Gasóleo, gasolina e GPL, atualizado diariamente.`;
  const outras = CIDADES.filter(c => c.slug !== cidade.slug);

  return (
    <LayoutPublico>
      <Head>
        <title>{`Preço dos Combustíveis em ${cidade.nome} Hoje — gasóleo e gasolina mais baratos | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={`${SITE_URL}/combustiveis/${cidade.slug}`} />
        <meta property="og:title" content={`Preço dos combustíveis em ${cidade.nome} hoje`} />
        <meta property="og:description" content={descricao} />
        <meta property="og:url" content={`${SITE_URL}/combustiveis/${cidade.slug}`} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Dados oficiais DGEG{dataStr ? ` · ${dataStr}` : ""}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Preço dos combustíveis em {cidade.nome} hoje
        </h1>
        <p style={{ fontSize: 14.5, color: "#5c6b62", lineHeight: 1.6, marginTop: 12 }}>
          Os postos mais baratos num raio de 15 km de {cidade.nome}, com os preços
          comunicados à Direção-Geral de Energia e Geologia. Na app PoupeJá vês os postos{" "}
          <strong style={{ color: "#14231c" }}>à tua volta</strong> e crias avisos de preço.
        </p>

        {erro || !estacoes.length ? (
          <p style={{ marginTop: 28, color: "#5c6b62" }}>Os dados não estão disponíveis neste momento. Tenta novamente daqui a pouco.</p>
        ) : (
          <>
            {/* Mais barato por tipo */}
            <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {destaques.map(d => (
                <div key={d.tipoLabel} className="rounded-2xl p-4" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
                  <p style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{d.tipoLabel} mais barato</p>
                  <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "#0b6b4f", marginTop: 6 }}>
                    €{d.preco.toFixed(3)}
                  </p>
                  <p style={{ fontSize: 12.5, color: "#5c6b62", marginTop: 2 }}>
                    {d.nome || d.marca}{d.distancia != null ? ` · a ${d.distancia} km` : ""}
                  </p>
                </div>
              ))}
            </div>

            {/* Postos mais baratos */}
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
              Postos mais baratos perto de {cidade.nome}
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fbfaf6", border: "1px solid #e4e2d8" }}>
              {estacoes.map((e, i) => (
                <div key={`${e.id}-${e.tipoLabel}`} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: "1px solid #eeece4" } : {}}>
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{e.nome || e.marca}</p>
                    <p style={{ fontSize: 12, color: "#8a978e" }}>
                      {e.tipoLabel}
                      {e.municipio ? ` · ${e.municipio}` : ""}
                      {e.distancia != null ? ` · a ${e.distancia} km` : ""}
                    </p>
                  </div>
                  <p className="font-display flex-shrink-0" style={{ fontSize: 17, fontWeight: 600, color: "#0b6b4f" }}>€{e.preco.toFixed(3)}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#8a978e", marginTop: 10 }}>
              Fonte: DGEG — preços comunicados pelos postos. O preço no posto pode variar.
            </p>
          </>
        )}

        {/* Outras cidades */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Preços noutras cidades
        </h2>
        <div className="flex flex-wrap gap-2">
          {outras.map(c => (
            <a
              key={c.slug}
              href={`/combustiveis/${c.slug}`}
              className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "#0b6b4f", background: "#fbfaf6", border: "1px solid #e4e2d8", borderRadius: 12, padding: "8px 14px" }}
            >
              {c.nome}
            </a>
          ))}
          <a
            href="/combustiveis"
            className="pj-tap no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: "#5c6b62", background: "#fbfaf6", border: "1px solid #e4e2d8", borderRadius: 12, padding: "8px 14px" }}
          >
            Todo o país
          </a>
        </div>

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ req, res, params }) {
  const cidade = CIDADES.find(c => c.slug === params.cidade);
  if (!cidade) return { notFound: true };

  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");

  const base = { cidade: { slug: cidade.slug, nome: cidade.nome } };
  try {
    const proto = req.headers.host?.startsWith("localhost") ? "http" : "https";
    const r = await fetch(`${proto}://${req.headers.host}/api/combustiveis?lat=${cidade.lat}&lon=${cidade.lon}&raio=15`);
    const j = await r.json();
    if (!j.estacoes?.length) throw new Error("sem dados");

    // Já vêm ordenadas por preço: o primeiro de cada tipo é o mais barato.
    const destaques = [];
    for (const t of TIPOS_DESTAQUE) {
      const melhor = j.estacoes.find(e => e.tipoLabel === t);
      if (melhor) destaques.push(melhor);
    }
    const estacoes = j.estacoes
      .filter(e => e.tipoLabel === "Gasóleo" || e.tipoLabel === "Gasolina 95")
      .slice(0, 12);

    return { props: { ...base, destaques, estacoes, atualizadoEm: j.atualizadoEm || null, erro: false } };
  } catch {
    return { props: { ...base, destaques: [], estacoes: [], atualizadoEm: null, erro: true } };
  }
}
