import Head from "next/head";
import { eur } from "./lib/formato";
import { descreverFrescura } from "./lib/frescura";
import { Preco, LinhaPreco } from "./Preco";
import LayoutPublico from "./LayoutPublico";
import { BotaoAbrirPoupeja } from "./PaginasPrecos";
import GraficoPreco from "./GraficoPreco";
import { URL_SITE } from "./lib/site";
import { FONTES } from "./lib/fontes";
import { slugify } from "./lib/slug";

/*
 * Página pública SEO — um combustível no país inteiro (/combustiveis/gasoleo,
 * /gasolina-95, /gpl). Alvo: "preço gasóleo hoje", "gasolina 95 mais
 * barata". Liga aos distritos e aos concelhos mais baratos, que é por onde
 * se responde a "preço gasóleo <concelho> hoje".
 *
 * As três páginas são ficheiros em pages/combustiveis/ que reexportam isto
 * (e os dados de lib/combustivelTipoProps):
 * uma rota fixa ganha ao [cidade], e "gasoleo" nunca é nome de concelho.
 */
const rotulo = { fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" };
const cartao = { background: "var(--pj-card)", border: "1px solid var(--pj-border)" };
const h2 = { fontSize: 20, fontWeight: 600, marginTop: 36, marginBottom: 12 };

export default function PaginaTipoCombustivel({ dados, serie = [] }) {
  const { tipo, frescura, media, minimo, nPrecos, porDeposito, baratos, distritos, concelhos, outros } = dados;
  const idade = descreverFrescura(frescura);
  const hoje = idade.deHoje ? " hoje" : "";
  const canonical = `${URL_SITE}/combustiveis/${tipo.slug}`;
  const nomeTitulo = tipo.nome.charAt(0).toUpperCase() + tipo.nome.slice(1);
  const titulo = `Preço ${tipo.nome}${hoje}: média €${eur(media, 3)} | PoupeJá`;
  const descricao = `${nomeTitulo}${hoje} em Portugal: média de €${eur(media, 3)}/L e o mais barato a €${eur(minimo, 3)} (${baratos[0].municipio || baratos[0].nome}). ${distritos.length} distritos e ${nPrecos} postos, dados DGEG.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PoupeJá", item: URL_SITE },
      { "@type": "ListItem", position: 2, name: "Combustíveis", item: `${URL_SITE}/combustiveis` },
      { "@type": "ListItem", position: 3, name: nomeTitulo, item: canonical },
    ],
  };
  const dMin = distritos[0]?.media, dMax = distritos[distritos.length - 1]?.media;

  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Preço ${tipo.nome}${hoje} em Portugal`} key="og:title" />
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
          Preço do {tipo.nome}{hoje} em Portugal
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          A média do país é <strong style={{ color: "var(--pj-text)" }}>€{eur(media, 3)} por litro</strong>, em {nPrecos} postos.
          O mais barato está a <strong style={{ color: "var(--pj-text)" }}>€{eur(minimo, 3)}</strong>
          {baratos[0].municipio ? ` em ${baratos[0].municipio}` : ""}: num depósito de 50 litros são{" "}
          <strong style={{ color: "var(--pj-brand-ink)" }}>€{eur(porDeposito, 2)} a menos</strong> do que num posto na média.
        </p>

        {idade.aviso && (
          <div className="rounded-2xl p-4 mt-6" style={{ background: "var(--pj-warn-wash)", border: "1px solid var(--pj-warn-border)" }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--pj-warn)", fontWeight: 600 }}>{idade.aviso}</p>
          </div>
        )}

        <GraficoPreco serie={serie} titulo={`${nomeTitulo} em Portugal, últimos 30 dias`} />

        <h2 className="font-display" style={h2}>Postos com o {tipo.nome} mais barato</h2>
        <div className="rounded-2xl overflow-hidden" style={cartao}>
          {baratos.map((p, i) => (
            <LinhaPreco key={`${p.nome}-${i}`} nome={p.nome} contexto={[p.municipio, p.distrito].filter(Boolean).join(" · ")}
              valor={p.preco} min={baratos[0].preco} max={baratos[baratos.length - 1].preco} destaque={i === 0} primeira={i === 0} />
          ))}
        </div>

        <h2 className="font-display" style={h2}>{nomeTitulo} por distrito</h2>
        {dMin != null && dMax != null && (
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.6, marginBottom: 12 }}>
            Do distrito mais barato ({distritos[0].nome}) ao mais caro ({distritos[distritos.length - 1].nome}),
            a média muda {Math.round((dMax - dMin) * 100)} cêntimos por litro.
          </p>
        )}
        <div className="rounded-2xl overflow-hidden" style={cartao}>
          {distritos.map((d, i) => (
            <a key={d.nome} href={`/combustiveis/distrito/${slugify(d.nome)}`} className="flex items-center justify-between px-4 py-3 no-underline"
              style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
              <span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{d.nome}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)" }}>mais barato €{eur(d.minimo, 3)}</span>
              </span>
              <span className="flex-shrink-0"><Preco valor={d.media} casas={3} tamanho={16} /></span>
            </a>
          ))}
        </div>

        {concelhos.length > 0 && (
          <>
            <h2 className="font-display" style={h2}>Concelhos com o {tipo.nome} mais barato</h2>
            <div className="flex flex-wrap gap-2">
              {concelhos.map(c => (
                <a key={c.slug} href={`/combustiveis/${c.slug}`} className="pj-tap no-underline"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", ...cartao, borderRadius: 12, padding: "8px 14px" }}>
                  {c.nome} · €{eur(c.preco, 3)}
                </a>
              ))}
            </div>
          </>
        )}

        <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 16 }}>
          Fonte: DGEG — preços comunicados pelos próprios postos. {idade.rotulo}. O preço no posto pode variar.
        </p>

        <BotaoAbrirPoupeja href="/?atalho=mobilidade" tipo="combustivel" texto="Vê os postos mais baratos perto de ti — grátis" />

        <h2 className="font-display" style={h2}>Outros combustíveis</h2>
        <div className="flex flex-wrap gap-2">
          {[...outros.map(o => ({ href: `/combustiveis/${o.slug}`, texto: `Preço ${o.nome}` })), { href: "/combustiveis", texto: "Todas as marcas" }].map(o => (
            <a key={o.href} href={o.href} className="pj-tap no-underline"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", ...cartao, borderRadius: 12, padding: "8px 14px" }}>{o.texto}</a>
          ))}
        </div>
      </div>
    </LayoutPublico>
  );
}
