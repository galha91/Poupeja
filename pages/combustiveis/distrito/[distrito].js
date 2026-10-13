import Head from "next/head";
import { eur } from "../../../lib/formato";
import { descreverFrescura } from "../../../lib/frescura";
import { Preco } from "../../../Preco";
import LayoutPublico, { CtaApp } from "../../../LayoutPublico";
import { dadosDistrito } from "../../../lib/municipios";
import { URL_SITE } from "../../../lib/site";
import { FONTES } from "../../../lib/fontes";
import GraficoPreco from "../../../GraficoPreco";
import { lerSerie } from "../../../lib/precosSnapshot";

/*
 * Página pública SEO — combustíveis mais baratos num distrito.
 *
 * O nível do meio entre /combustiveis (país) e /combustiveis/<concelho>.
 * Alvo: "gasóleo mais barato distrito de Braga", "preço combustível
 * Braga". Tem conteúdo seu (o posto mais barato do distrito, a média
 * contra o país, os concelhos ordenados) e liga a todos os concelhos do
 * distrito — é por aqui que o Google chega aos que não estão no sitemap.
 */
export default function CombustiveisDistrito({ dados, serieGasoleo = [] }) {
  const { distrito, destaques, amplitude, concelhos, nPostos, outros, frescura } = dados;
  const idade = descreverFrescura(frescura);
  const canonical = `${URL_SITE}/combustiveis/distrito/${distrito.slug}`;

  const gasoleo  = destaques.find(d => d.tipoLabel === "Gasóleo");
  const gasolina = destaques.find(d => d.tipoLabel === "Gasolina 95");
  const titulo = `Combustível mais barato no distrito de ${distrito.nome} hoje — gasóleo e gasolina | PoupeJá`;
  const descricao =
    `Preços de hoje no distrito de ${distrito.nome} (dados oficiais DGEG)` +
    `${gasoleo ? `: gasóleo desde €${eur(gasoleo.preco, 3)} em ${gasoleo.municipio}` : ""}` +
    `${gasolina ? `${gasoleo ? "," : ":"} gasolina 95 desde €${eur(gasolina.preco, 3)}` : ""}` +
    `. ${concelhos.length} concelhos e ${nPostos} postos comparados, grátis.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PoupeJá", item: URL_SITE },
      { "@type": "ListItem", position: 2, name: "Combustíveis", item: `${URL_SITE}/combustiveis` },
      { "@type": "ListItem", position: 3, name: `Distrito de ${distrito.nome}`, item: canonical },
    ],
  };

  const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
  const cartao = { background: "var(--pj-card)", border: "1px solid var(--pj-border)" };

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Combustível mais barato no distrito de ${distrito.nome}`} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={rotulo}>
          <a href="/combustiveis" className="pj-alvo" style={{ color: "inherit" }}>Combustíveis</a>
          {" "}· Dados oficiais{" "}
          <a href={FONTES.dgeg.href} target="_blank" rel="noopener noreferrer" className="pj-alvo" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>DGEG</a>
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Combustível mais barato no distrito de {distrito.nome}{idade.deHoje ? " hoje" : ""}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          <strong style={{ color: "var(--pj-text)" }}>{nPostos} postos</strong> em{" "}
          <strong style={{ color: "var(--pj-text)" }}>{concelhos.length} concelhos</strong>, com os preços comunicados
          à Direção-Geral de Energia e Geologia. {idade.rotulo}.
        </p>

        {idade.aviso && (
          <div className="rounded-2xl p-4 mt-6" style={{ background: "var(--pj-warn-wash)", border: "1px solid var(--pj-warn-border)" }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--pj-warn)", fontWeight: 600 }}>{idade.aviso}</p>
          </div>
        )}

        {/* Mais barato por tipo no distrito, com a média contra o país */}
        <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {destaques.map(d => (
            <div key={d.tipoLabel} className="rounded-2xl p-4" style={cartao}>
              <p style={rotulo}>{d.tipoLabel} mais barato</p>
              <p style={{ marginTop: 8 }}><Preco valor={d.preco} casas={3} tamanho={30} /></p>
              <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 2 }}>{d.nome} · {d.municipio}</p>
              <p style={{ fontSize: 12, marginTop: 6, color: "var(--pj-text-faint)" }}>
                Média no distrito €{eur(d.mediaDistrito, 3)}
                {d.vsPais != null && d.vsPais !== 0 && (
                  <span style={{ fontWeight: 600, color: d.vsPais < 0 ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                    {` · ${Math.abs(d.vsPais)} cênt. ${d.vsPais < 0 ? "abaixo" : "acima"} do país`}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {amplitude && (
          <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--pj-brand-wash)", border: "1px solid var(--pj-border)" }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--pj-text)" }}>
              No distrito de {distrito.nome} o gasóleo vai de{" "}
              <strong>€{eur(amplitude.min, 3)}</strong> a <strong>€{eur(amplitude.max, 3)}</strong> por litro.
              Num depósito de 50 litros, são{" "}
              <strong style={{ color: "var(--pj-brand-ink)" }}>€{eur(amplitude.porDeposito, 2)} de diferença</strong>{" "}
              entre o posto mais barato e o mais caro.
            </p>
          </div>
        )}

        {/* 30 dias de gasóleo no distrito (resumo diário; só com 7+ dias) */}
        <GraficoPreco serie={serieGasoleo} titulo={`Gasóleo no distrito de ${distrito.nome}, últimos 30 dias`} />

        {/* Todos os concelhos do distrito — o motivo de a página existir */}
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 6 }}>
          Gasóleo por concelho
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginBottom: 14 }}>
          O posto mais barato de cada concelho, do mais barato para o mais caro. Toca para ver os postos.
        </p>
        <div className="rounded-2xl overflow-hidden" style={cartao}>
          {concelhos.map((c, i) => (
            <a key={c.slug} href={`/combustiveis/${c.slug}`}
              className="flex items-center justify-between px-4 py-3 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{c.nome}</p>
                <p style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>{c.nPostos} postos</p>
              </div>
              {c.gasoleo != null
                ? <span className="flex-shrink-0"><Preco valor={c.gasoleo} casas={3} tamanho={16} /></span>
                : <span style={{ fontSize: 12, color: "var(--pj-text-faint)" }}>sem gasóleo</span>}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 10 }}>
          Fonte: <a href={FONTES.dgeg.href} target="_blank" rel="noopener noreferrer" className="pj-alvo" style={{ color: "var(--pj-brand-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>DGEG — Direção-Geral de Energia e Geologia</a> — preços comunicados pelos próprios postos. O preço no posto pode variar.
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 14 }}>
          Outros distritos
        </h2>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {outros.map(o => (
            <a key={o.slug} href={`/combustiveis/distrito/${o.slug}`} className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-text)", padding: "10px 14px", borderRadius: 12, ...cartao }}>
              {o.nome}
            </a>
          ))}
        </div>

        <CtaApp texto="Vê os postos mais baratos perto de ti — grátis" />
      </div>
    </LayoutPublico>
  );
}

export async function getServerSideProps({ res, params }) {
  const [dados, serieGasoleo] = await Promise.all([
    dadosDistrito(params.distrito),
    lerSerie({ escopo: "distrito", chave: params.distrito, tipo: "Gasóleo" }).catch(() => []),
  ]);
  if (!dados) return { notFound: true };
  // 30 minutos secos, sem stale-while-revalidate — ver [cidade].js.
  res.setHeader("Cache-Control", "public, s-maxage=1800");
  return { props: { dados, serieGasoleo } };
}
