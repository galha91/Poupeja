import Head from "next/head";
import { eur } from "../../lib/formato";
import { descreverFrescura } from "../../lib/frescura";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { Preco, LinhaPreco } from "../../Preco";
import { listarMunicipios, frescuraDosPrecos } from "../../lib/municipios";
import { URL_SITE as SITE_URL } from "../../lib/site";

/*
 * Página pública SEO — preços dos combustíveis hoje em Portugal.
 * Server-rendered com dados reais da DGEG (via /api/combustiveis),
 * cacheada 30 min na CDN. Alvo: pesquisas "preço gasóleo hoje",
 * "gasolina mais barata", etc.
 */
export default function Combustiveis({ dados, concelhos, frescura, erro }) {
  const idade = descreverFrescura(frescura);
  /*
   * Uma lista por combustível. Ordenar preços de produtos diferentes na
   * mesma coluna não compara nada — cada combustível tem a sua escala.
   */
  const porCombustivel = (() => {
    const mapa = new Map();
    for (const d of dados || []) {
      if (!mapa.has(d.tipo)) mapa.set(d.tipo, []);
      mapa.get(d.tipo).push(d);
    }
    return [...mapa.entries()].map(([tipo, marcas]) => {
      const ordenadas = marcas.slice().sort((a, b) => a.preco - b.preco);
      return {
        tipo,
        marcas: ordenadas,
        min: ordenadas[0]?.preco,
        max: ordenadas[ordenadas.length - 1]?.preco,
      };
    }).sort((a, b) => a.tipo.localeCompare(b.tipo, "pt"));
  })();

  // Agrupados por distrito: uma lista corrida de duzentos concelhos não se lê.
  const agrupados = new Map();
  for (const c of concelhos || []) {
    if (!agrupados.has(c.distrito)) agrupados.set(c.distrito, []);
    agrupados.get(c.distrito).push(c);
  }
  const porDistrito = [...agrupados.entries()]
    .map(([d, l]) => [d, l.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt"))])
    .sort((a, b) => a[0].localeCompare(b[0], "pt"));
  const nConcelhos = (concelhos || []).length;
  const totalPostos = (concelhos || []).reduce((s, c) => s + c.nPostos, 0);
  const porTipo = {};
  for (const d of dados || []) {
    if (!porTipo[d.tipo]) porTipo[d.tipo] = d; // dados já vêm ordenados por preço
  }
  const tiposDestaque = ["Gasóleo", "Gasolina 95", "GPL Auto"].filter(t => porTipo[t]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Preços dos combustíveis hoje em Portugal",
    description: "Preços mínimos e médios de gasóleo, gasolina e GPL por marca em Portugal, com dados oficiais da DGEG. Atualizado diariamente.",
    url: `${SITE_URL}/combustiveis`,
    inLanguage: "pt-PT",
    creator: { "@type": "Organization", name: "DGEG — Direção-Geral de Energia e Geologia" },
    ...(idade.iso ? { dateModified: idade.iso } : {}),
  };

  return (
    <LayoutPublico>
      <Head>
        <title>Preços dos Combustíveis Hoje em Portugal — Gasóleo e Gasolina mais baratos | PoupeJá</title>
        <meta name="description" content={`Preços de hoje por marca (dados oficiais DGEG): gasóleo desde €${eur(porTipo["Gasóleo"]?.preco, 3)}, gasolina 95 desde €${eur(porTipo["Gasolina 95"]?.preco, 3)}. Vê os postos mais baratos perto de ti, grátis.`} />
        <link rel="canonical" href={`${SITE_URL}/combustiveis`} />
        <meta property="og:title" content="Preços dos combustíveis hoje em Portugal" key="og:title" />
        <meta property="og:description" content="Gasóleo e gasolina mais baratos por marca, com dados oficiais da DGEG. Atualizado diariamente." key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/combustiveis`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Dados oficiais DGEG · {idade.rotulo}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Preços dos combustíveis hoje em Portugal
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          O preço mais baixo por marca, em todo o país, atualizado com os dados oficiais da
          Direção-Geral de Energia e Geologia. Na app PoupeJá vês os postos mais baratos{" "}
          <strong style={{ color: "var(--pj-text)" }}>perto de ti</strong> e crias avisos de preço.
        </p>

        {idade.aviso && (
          <div className="rounded-2xl p-4 mt-6" style={{ background: "var(--pj-warn-wash)", border: "1px solid var(--pj-warn-border)" }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--pj-warn)", fontWeight: 600 }}>{idade.aviso}</p>
          </div>
        )}

        {erro ? (
          <p style={{ marginTop: 28, color: "var(--pj-text-muted)" }}>Os dados não estão disponíveis neste momento. Tenta novamente daqui a pouco.</p>
        ) : (
          <>
            {/* Mais barato por tipo */}
            <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {tiposDestaque.map(t => (
                <div key={t} className="rounded-2xl p-4" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                  <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>{t} mais barato</p>
                  <p style={{ marginTop: 6 }}>
                    <Preco valor={porTipo[t].preco} casas={3} tamanho={30} />
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{porTipo[t].posto}</p>
                </div>
              ))}
            </div>

            {/*
              Era uma lista só, ordenada por preço, com os três
              combustíveis misturados: GPL a €0,810 por cima de gasóleo a
              €1,489 por cima de gasolina a €1,661, como se fossem
              comparáveis. Quem passasse os olhos lia "Repsol é o mais
              barato" — de um produto diferente. Agora é uma lista por
              combustível, e dentro de cada uma a barra mostra a distância
              ao mais barato daquele combustível.
            */}
            {porCombustivel.map(grupo => (
              <div key={grupo.tipo} style={{ marginTop: 36 }}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
                  <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>
                    {grupo.tipo} — preço mínimo por marca
                  </h2>
                  <span style={{ fontSize: 13, color: "var(--pj-text-faint)" }}>
                    {grupo.marcas.length} marca{grupo.marcas.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                  {grupo.marcas.map((d, i) => (
                    <LinhaPreco
                      key={`${d.posto}-${d.tipo}`}
                      nome={d.posto}
                      contexto={`${d.totalPostos} posto${d.totalPostos !== 1 ? "s" : ""} · médio €${eur(d.precoMedio, 3)}`}
                      valor={d.preco}
                      min={grupo.min}
                      max={grupo.max}
                      destaque={i === 0}
                      primeira={i === 0}
                    />
                  ))}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 10 }}>
              Fonte: DGEG — preços comunicados pelos próprios postos. {idade.rotulo}.
              O preço no posto pode variar.
            </p>
          </>
        )}

        {/* Páginas por concelho, agrupadas por distrito — é também o caminho
            de rastreio: sem isto o Google não chega às páginas de concelho. */}
        {porDistrito.length > 0 && (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 6 }}>
              Preços por concelho
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginBottom: 18 }}>
              {nConcelhos} concelhos com preços comparados, dos {totalPostos} postos que a DGEG cobre.
            </p>
            {porDistrito.map(([distrito, lista]) => (
              <div key={distrito} style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 9 }}>
                  {distrito}
                </p>
                <div className="flex flex-wrap gap-2">
                  {lista.map(c => (
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
              </div>
            ))}
          </>
        )}

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ req, res }) {
  // Sem stale-while-revalidate: ver a explicação em [cidade].js — o juízo
  // "isto é de hoje" fica preso no HTML gerado.
  res.setHeader("Cache-Control", "public, s-maxage=1800");

  // A lista de concelhos falha em separado dos preços por marca: se uma
  // parte da página não tiver dados, a outra continua a servir.
  let concelhos = [];
  let frescura = null;
  try {
    concelhos = (await listarMunicipios()).map(m => ({
      slug: m.slug, nome: m.nome, distrito: m.distrito || "Outros", nPostos: m.nPostos,
    }));
    frescura = await frescuraDosPrecos();
  } catch {}

  try {
    const proto = req.headers.host?.startsWith("localhost") ? "http" : "https";
    const r = await fetch(`${proto}://${req.headers.host}/api/combustiveis`);
    const j = await r.json();
    if (!j.dados?.length) throw new Error("sem dados");
    return { props: { dados: j.dados, concelhos, frescura, erro: false } };
  } catch {
    return { props: { dados: [], concelhos, frescura, erro: true } };
  }
}
