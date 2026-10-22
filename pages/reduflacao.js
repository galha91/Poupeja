import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import { BotaoAbrirPoupeja, Pilulas, Migalhas, Atualizado, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../PaginasPrecos";
import { casosPublicos } from "../lib/reduflacaoDados";
import { LOJAS_SEO, breadcrumbLd } from "../lib/seoPrecos";
import { hojeLisboa, dataCurta, cortar } from "../lib/seoFormato";
import { URL_SITE } from "../lib/site";

/*
 * Página pública SEO — reduflação: o que é, como a detetar e os casos que
 * o PoupeJá confirmou (o mesmo produto, na mesma loja, a trazer menos e a
 * sair mais caro ao kg). Alvo: "reduflação", "produtos que encolheram".
 * Os casos vêm de produtos_embalagem com regras apertadas (ver
 * lib/reduflacao.casosReduflacao): só o que aguenta levar o nome à frente.
 */
const MEDIMOS_DESDE = "outubro de 2026";
const nomeLoja = (id) => LOJAS_SEO.find((l) => l.id === id)?.nome || id;
const eur = (v) => Number(v).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PERGUNTAS = [
  {
    p: "O que é a reduflação?",
    r: "É quando um produto passa a trazer menos quantidade (menos gramas, menos mililitros, menos unidades) e o preço fica igual ou desce menos do que a quantidade. Na prática, o preço por kg ou por litro sobe sem a etiqueta mudar.",
  },
  {
    p: "A reduflação é legal?",
    r: "Sim, desde que a quantidade certa esteja na embalagem. Por isso o que conta é o preço por kg, por litro ou por unidade, que as lojas são obrigadas a mostrar na etiqueta ao lado do preço.",
  },
  {
    p: "Como sei se um produto encolheu?",
    r: "Compara o preço por kg ou por litro com o de há uns meses, e não só o preço da embalagem. Desconfia de embalagens novas, de \"nova receita\" e de pacotes iguais com menos peso escrito. A app PoupeJá avisa quando um produto que pesquisas encolheu.",
  },
];

export default function Reduflacao({ casos, atualizado }) {
  const canonical = `${URL_SITE}/reduflacao`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Preços", path: "/precos" }, { nome: "Reduflação", path: "/reduflacao" }];
  const titulo = "Reduflação: o que é e produtos que encolheram | PoupeJá";
  const descricao = cortar(casos.length
    ? `${casos.length} produto${casos.length > 1 ? "s" : ""} que ${casos.length > 1 ? "encolheram" : "encolheu"} nos supermercados portugueses: menos gramas pelo mesmo preço. Vê quais, quanto encolheram e como te defendes.`
    : "Reduflação é o produto que encolhe e o preço que não desce. Vê como a detetar no supermercado e os casos que o PoupeJá confirma em Portugal.");
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
  return (
    <LayoutPublico destaqueEmentas>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Reduflação: produtos que encolheram" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Reduflação: produtos que encolheram</h1>
        {atualizado && <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, fontWeight: 600 }}><Atualizado dia={atualizado} /></p>}
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          O mesmo produto, na mesma loja, a trazer menos pelo mesmo preço. Medimos o tamanho das embalagens todos os dias desde {MEDIMOS_DESDE}.
        </p>

        <h2 className="font-display" style={estiloH2}>Casos confirmados</h2>
        {casos.length > 0 ? (
          <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
            {casos.map((c, i) => (
              <div key={c.id} className="px-4 py-3" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                <p className="flex justify-between" style={{ gap: 12 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.35 }}>{c.nome}</span>
                  <span className="pj-num flex-shrink-0" style={{ fontSize: 14.5, fontWeight: 700, color: "var(--pj-brand-ink)" }}>+{c.pct}%</span>
                </p>
                <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 3, lineHeight: 1.5 }}>
                  {nomeLoja(c.loja)} · {c.antes.qtd} → {c.agora.qtd} ({c.menos}% menos) · {c.antes.preco === c.agora.preco ? `mesmo preço, ${eur(c.agora.preco)}\u00a0€` : `${eur(c.antes.preco)}\u00a0€ → ${eur(c.agora.preco)}\u00a0€`} · desde {dataCurta(c.agora.desde)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ ...estiloTexto, marginTop: 0 }}>
            Ainda nenhum caso passou as nossas regras. Só publicamos quando o mesmo produto, com o mesmo nome e na mesma loja, foi visto
            pelo menos uma semana no tamanho antigo e vários dias no novo, a sair mais caro ao kg. A lista atualiza-se sozinha.
          </p>
        )}
        {casos.length > 0 && (
          <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
            A percentagem é quanto mais pagas por kg, litro ou unidade. Preços vistos nos sites das lojas; podem variar por loja física.
          </p>
        )}

        <h2 className="font-display" style={estiloH2}>Como não ser apanhado</h2>
        <ol style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Olha para o preço por kg ou litro</strong>, não para o preço da embalagem. Está na etiqueta, em letra mais pequena.</li>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Desconfia de embalagens novas</strong> e de &quot;nova receita&quot;: é quando o tamanho costuma mudar.</li>
          <li style={{ marginTop: 6 }}><strong style={{ color: "var(--pj-text)" }}>Compara marcas pelo preço ao kg.</strong> A embalagem família nem sempre compensa.</li>
        </ol>

        <BotaoAbrirPoupeja href="/?atalho=mercados" tipo="reduflacao" texto="Compara preços ao kg na app, loja a loja" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {PERGUNTAS.map((x) => (
          <div key={x.p} style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/precos", texto: "Preços de supermercado hoje" },
          { href: "/comparar", texto: "Qual supermercado é mais barato?" },
          { href: "/marcas", texto: "Preços por marca", fraco: true },
        ]} />
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const hoje = hojeLisboa();
  const casos = await casosPublicos(hoje);
  return {
    props: JSON.parse(JSON.stringify({ casos: casos.slice(0, 50), atualizado: casos.length ? hoje : null })),
    revalidate: 21600,
  };
}
