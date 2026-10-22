import Head from "next/head";
import { eur } from "../../../lib/formato";
import { descreverFrescura } from "../../../lib/frescura";
import { Preco, LinhaPreco } from "../../../Preco";
import LayoutPublico from "../../../LayoutPublico";
import { BotaoAbrirPoupeja } from "../../../PaginasPrecos";
import { dadosMarcaCombustivel } from "../../../lib/municipios";
import { URL_SITE } from "../../../lib/site";
import { FONTES } from "../../../lib/fontes";
import { slugify } from "../../../lib/slug";

/*
 * Página pública SEO — uma marca de combustível no país inteiro.
 * Alvo: "preço gasóleo galp hoje", "prio é mais barato?". A média da marca
 * contra o país, o lugar entre as marcas, os postos e distritos onde ela
 * está mais barata. Só marcas com 20+ postos (ver lib/combustivelMarca).
 */
const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
const cartao = { background: "var(--pj-card)", border: "1px solid var(--pj-border)" };
const h2 = { fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 12 };

export default function MarcaCombustivel({ dados }) {
  const { marca, tipos, baratos, distritos, outras, frescura } = dados;
  const idade = descreverFrescura(frescura);
  const hoje = idade.deHoje ? " hoje" : "";
  const canonical = `${URL_SITE}/combustiveis/marca/${marca.slug}`;
  const gasoleo = tipos.find((t) => t.tipo === "Gasóleo");
  const titulo = [
    gasoleo && `Preço gasóleo ${marca.nome}${hoje}: média €${eur(gasoleo.media, 3)} | PoupeJá`,
    `Combustível ${marca.nome}${hoje}: preços | PoupeJá`,
  ].filter(Boolean).find((t) => t.length <= 60) || `${marca.nome}: preços | PoupeJá`;
  const descricao = `Preços ${marca.nome}${hoje} em ${marca.nPostos} postos (dados DGEG)` +
    (gasoleo ? `: gasóleo com média de €${eur(gasoleo.media, 3)}/L, ${gasoleo.posicao}.ª marca mais barata de ${gasoleo.deMarcas}.` : ".");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PoupeJá", item: URL_SITE },
      { "@type": "ListItem", position: 2, name: "Combustíveis", item: `${URL_SITE}/combustiveis` },
      { "@type": "ListItem", position: 3, name: marca.nome, item: canonical },
    ],
  };

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Preços ${marca.nome}${hoje}`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={rotulo}>
          Dados oficiais{" "}
          <a href={FONTES.dgeg.href} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>DGEG</a>
          {" "}· {idade.rotulo}
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Preço dos combustíveis {marca.nome}{hoje}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          <strong style={{ color: "var(--pj-text)" }}>{marca.nPostos} postos {marca.nome}</strong> com preço comunicado à DGEG.
          {gasoleo && <> No gasóleo, é a <strong style={{ color: "var(--pj-text)" }}>{gasoleo.posicao}.ª marca mais barata</strong> de {gasoleo.deMarcas}, pela média.</>}
        </p>

        <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {tipos.map((t) => (
            <div key={t.tipo} className="rounded-2xl p-4" style={cartao}>
              <p style={rotulo}>{t.tipo} · média</p>
              <p style={{ marginTop: 8 }}><Preco valor={t.media} casas={3} tamanho={30} /></p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>mais barato €{eur(t.minimo, 3)} · {t.n} postos</p>
              {t.vsPais != null && Math.abs(t.vsPais) >= 0.1 && (
                <p style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: t.vsPais < 0 ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                  {eur(Math.abs(t.vsPais), 1)} cênt. {t.vsPais < 0 ? "abaixo" : "acima"} da média do país
                </p>
              )}
            </div>
          ))}
        </div>

        {baratos.length > 0 && (
          <>
            <h2 className="font-display" style={h2}>Postos {marca.nome} com o gasóleo mais barato</h2>
            <div className="rounded-2xl overflow-hidden" style={cartao}>
              {baratos.map((p, i) => (
                <LinhaPreco key={`${p.nome}-${i}`} nome={p.nome} contexto={[p.municipio, p.distrito].filter(Boolean).join(" · ")}
                  valor={p.preco} min={baratos[0].preco} max={baratos[baratos.length - 1].preco} destaque={i === 0} primeira={i === 0} />
              ))}
            </div>
          </>
        )}

        {distritos.length > 1 && (
          <>
            <h2 className="font-display" style={h2}>Gasóleo {marca.nome} por distrito</h2>
            <div className="rounded-2xl overflow-hidden" style={cartao}>
              {distritos.map((d, i) => (
                <a key={d.nome} href={`/combustiveis/distrito/${slugify(d.nome)}`} className="flex items-center justify-between px-4 py-3 no-underline"
                  style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                  <span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{d.nome}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)" }}>{d.n} postos · mais barato €{eur(d.minimo, 3)}</span>
                  </span>
                  <span className="flex-shrink-0"><Preco valor={d.media} casas={3} tamanho={16} /></span>
                </a>
              ))}
            </div>
          </>
        )}

        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 16 }}>
          Fonte: DGEG — preços comunicados pelos próprios postos. {idade.rotulo}. Descontos de cartão ou app da marca não estão incluídos.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=mobilidade" tipo="combustivel_marca" texto={`Vê os postos ${marca.nome} perto de ti — grátis`} />

        {outras.length > 0 && (
          <>
            <h2 className="font-display" style={h2}>Outras marcas</h2>
            <div className="flex flex-wrap gap-2">
              {[...outras.map((o) => ({ href: `/combustiveis/marca/${o.slug}`, texto: o.nome })), { href: "/combustiveis/gasoleo", texto: "Gasóleo no país" }].map((o) => (
                <a key={o.href} href={o.href} className="pj-tap no-underline"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", ...cartao, borderRadius: 12, padding: "8px 14px" }}>{o.texto}</a>
              ))}
            </div>
          </>
        )}
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ res, params }) {
  const dados = await dadosMarcaCombustivel(params.marca).catch(() => null);
  if (!dados) return { notFound: true };
  // 30 minutos secos, sem stale-while-revalidate — ver pages/combustiveis/[cidade].js.
  res.setHeader("Cache-Control", "public, s-maxage=1800");
  return { props: JSON.parse(JSON.stringify({ dados })) };
}
