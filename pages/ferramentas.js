import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import { BotaoAbrirPoupeja, Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { URL_SITE } from "../lib/site";

/*
 * Página pública — todas as calculadoras e guias num sítio. Serve para
 * partilhar um só link e para o Google chegar a todas as ferramentas.
 */
const GRUPOS = [
  {
    nome: "Salário e impostos",
    itens: [
      { href: "/salario-liquido", titulo: "Salário líquido 2026", texto: "Do bruto ao líquido, com IRS Jovem e dependentes." },
      { href: "/irs", titulo: "Escalões de IRS 2026", texto: "Em que escalão ficas e como funcionam as taxas." },
    ],
  },
  {
    nome: "Família e apoios",
    itens: [
      { href: "/abono-de-familia", titulo: "Abono de família 2026", texto: "Escalão e valor por filho, todos os meses." },
      { href: "/tarifa-social", titulo: "Tarifa social", texto: "Vê se tens luz, gás e internet mais baratos." },
      { href: "/apoios", titulo: "Apoios do Estado", texto: "Os apoios a que podes ter direito e como pedir." },
      { href: "/prazos", titulo: "Prazos do Estado", texto: "IRS, IMI, prova escolar: o que acaba primeiro." },
    ],
  },
  {
    nome: "Casa e crédito",
    itens: [
      { href: "/credito-habitacao", titulo: "Simulador de crédito habitação", texto: "A prestação da casa com a Euribor de hoje." },
      { href: "/euribor", titulo: "Euribor hoje", texto: "3, 6 e 12 meses, com a evolução do último ano." },
    ],
  },
  {
    nome: "Compras",
    itens: [
      { href: "/comparar", titulo: "Qual supermercado é mais barato?", texto: "Continente, Pingo Doce, Lidl, Aldi e Auchan lado a lado." },
      { href: "/precos", titulo: "Preços de supermercado hoje", texto: "Artigo a artigo, com preço por kg e por litro." },
      { href: "/combustiveis", titulo: "Combustíveis mais baratos", texto: "Gasóleo e gasolina perto de ti, atualizados todos os dias." },
      { href: "/garantias", titulo: "Garantia de 3 anos", texto: "Até quando vai a tua garantia e como reclamar." },
      { href: "/devolucoes", titulo: "Devolver compras online", texto: "Os 14 dias, quem paga os portes e o que não se devolve." },
      { href: "/reduflacao", titulo: "Reduflação", texto: "Produtos que encolheram e como não ser apanhado." },
    ],
  },
];

export default function Ferramentas() {
  const titulo = "Calculadoras e guias para poupar | PoupeJá";
  const descricao = "Salário líquido, IRS, abono de família, tarifa social, crédito habitação, preços de supermercado e combustíveis. Grátis e sem conta.";
  const canonical = `${URL_SITE}/ferramentas`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ferramentas", path: "/ferramentas" }];
  const todos = GRUPOS.flatMap((g) => g.itens);
  const listaLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: todos.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.titulo, url: `${URL_SITE}${x.href}` })),
  };
  return (
    <LayoutPublico>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Calculadoras e guias para poupar" key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd(URL_SITE, passos)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listaLd) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Calculadoras e guias para poupar</h1>
        <p style={estiloTexto}>Tudo grátis, sem conta e sem guardar os teus dados. Os valores vêm das fontes oficiais.</p>
        {GRUPOS.map((g) => (
          <section key={g.nome}>
            <h2 className="font-display" style={estiloH2}>{g.nome}</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {g.itens.map((x, i) => (
                <a key={x.href} href={x.href} className="pj-tap block px-4 py-3 no-underline" style={i > 0 ? { borderTop: "1px solid var(--pj-subtle)" } : {}}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.titulo}</span>
                  <span style={{ display: "block", fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>{x.texto}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
        <BotaoAbrirPoupeja href="/" tipo="ferramentas" texto="Abrir a app PoupeJá" />
      </div>
    </LayoutPublico>
  );
}
