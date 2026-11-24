import Head from "next/head";
import LayoutPublico, { CtaApp } from "../LayoutPublico";
import { Preco } from "../Preco";
import { Migalhas, Pilulas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { eur } from "../lib/formato";
import { dataExtenso } from "../lib/datas";
import { URL_SITE } from "../lib/site";
import { hojeLisboa } from "../lib/seoFormato";
import { ARTIGOS_NATAL, PESSOAS, anoDoNatal, lerNatal, natalServe, variacaoNatal } from "../lib/natal";

/*
 * "Quanto custa a ceia de Natal?" — o mesmo cabaz da consoada em cada
 * supermercado, com os preços desta semana (lib/natal). Alvo: "ceia de
 * natal barata", "preço do bacalhau natal", "supermercado mais barato natal".
 *
 * Lê uma linha de paginas_marca, calculada nos GitHub Actions (regra 1 do
 * CLAUDE.md). ISR de 12 h. Sem cabaz recente fica fora do Google (noindex),
 * mas a página existe o ano todo: o URL ganha autoridade de um Natal para
 * o outro.
 */

const forte = { color: "var(--pj-text)" };
const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
const naLoja = (l) => `${l.loja === "apolonia" ? "na" : "no"} ${l.nome}`;

const RECEITAS = [
  { href: "/receitas/natal", texto: "Todas as receitas de Natal" },
  { href: "/receitas/bacalhau-gomes-sa", texto: "Bacalhau à Gomes de Sá" },
  { href: "/receitas/bacalhau-bras", texto: "Bacalhau à Brás (com as sobras)" },
  { href: "/receitas/rabanadas", texto: "Rabanadas" },
  { href: "/receitas/arroz-doce", texto: "Arroz-doce" },
  { href: "/receitas/aletria", texto: "Aletria" },
];

/* As páginas de preço de cada artigo da época (/precos/<artigo>), para quem compara um a um. */
const PRECOS_NATAL = [
  ["bacalhau", "Bacalhau"], ["lombos-de-bacalhau", "Lombos de bacalhau"], ["polvo", "Polvo"], ["perna-de-peru", "Peru"],
  ["cabrito", "Cabrito"], ["borrego", "Borrego"], ["bolo-rei", "Bolo-rei"], ["queijo-da-serra", "Queijo da Serra"],
  ["castanhas", "Castanhas"], ["nozes", "Nozes"], ["amendoas", "Amêndoas"], ["pinhoes", "Pinhões"],
  ["passas", "Passas"], ["tamaras", "Tâmaras"], ["aletria", "Aletria"], ["espumante", "Espumante"],
].map(([slug, texto]) => ({ href: `/precos/${slug}`, texto }));

export default function CeiaDeNatal({ natal = null, atual = false, ano }) {
  const canonical = `${URL_SITE}/ceia-de-natal`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Ceia de Natal", path: "/ceia-de-natal" }];
  const n = atual ? natal : null;
  const barata = n?.porLoja?.[0];
  const cara = n?.porLoja?.[n.porLoja.length - 1];
  const v = n ? variacaoNatal(n) : null;
  const titulo = `Quanto custa a ceia de Natal ${ano}? O supermercado mais barato`;

  const resposta = !n ? ""
    : n.empate
      ? `Esta semana a consoada para ${PESSOAS} pessoas custa entre ${eur(barata.total, 2)} € ${naLoja(barata)} e ${eur(cara.total, 2)} € ${naLoja(cara)}. O primeiro lugar depende de um ou dois artigos (ao tirar um, já é outra cadeia a mais barata), por isso a tua lista decide.`
      : `Esta semana, a consoada para ${PESSOAS} pessoas fica mais barata ${naLoja(barata)}: ${eur(barata.total, 2)} €. ${naLoja(cara).replace(/^./, (c) => c.toUpperCase())}, os mesmos artigos custam ${eur(cara.total, 2)} €, mais ${eur(cara.total - barata.total, 2)} €.`;
  const descricao = n
    ? `${resposta} Bacalhau, polvo, couve, batata e bolo-rei, comparados em ${n.porLoja.length} supermercados.`
    : `Quanto custa a ceia de Natal em cada supermercado: bacalhau, polvo, couve, batata e bolo-rei, comparados todas as semanas até ao Natal.`;

  const faq = [
    n && { p: `Quanto custa a ceia de Natal em ${ano}?`, r: resposta },
    n && { p: "Qual é o supermercado mais barato para o Natal?", r: n.empate
      ? `Esta semana não há um claramente mais barato: entre ${barata.nome} e ${n.porLoja[1].nome} a diferença é pequena ou depende de um só artigo. Compara a tua lista no próprio dia.`
      : `Na semana de ${dataExtenso(n.dia, { ano: false })} foi o ${barata.nome}. Muda de semana para semana com as promoções de dezembro, por isso atualizamos esta página todos os dias até ao Natal.` },
    { p: "Quando é melhor comprar o bacalhau?", r: "O bacalhau seco aguenta semanas num sítio fresco e seco. Compra quando o preço ao quilo estiver baixo e não deixes para a última semana, quando as promoções já acabaram e a procura é maior. Na app PoupeJá podes criar um alerta: avisamos quando o bacalhau baixar." },
    { p: "Porque é que o Lidl e a Mercadona não aparecem?", r: "O Lidl só publica online as promoções do folheto, por isso não tem preço do dia para todos os artigos. A Mercadona não tem loja online com preços em Portugal. Não inventamos nem estimamos preços de cadeias que não conseguimos ver." },
    { p: "Os preços são de loja física ou online?", r: "Online, sem entrega. Na loja podem existir promoções do folheto, descontos de cartão e cupões que aqui não contam. Vê os folhetos desta semana antes de ires." },
  ].filter(Boolean);

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };

  return (
    <LayoutPublico>
      <Head>
        <title>{`Ceia de Natal ${ano}: quanto custa e onde é mais barata | PoupeJá`}</title>
        <meta name="description" content={descricao} />
        <link rel="canonical" href={canonical} />
        {!atual && <meta name="robots" content="noindex" />}
        <meta property="og:title" content={titulo} key="og:title" />
        <meta property="og:description" content={descricao} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(ld) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>{titulo}</h1>

        {!n ? (
          <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
            Todos os dias, de novembro ao Natal, comparamos a consoada para {PESSOAS} pessoas nos supermercados com loja online: bacalhau, polvo, couve,
            batata, ovos, azeite e bolo-rei. Os preços desta época aparecem aqui assim que houver o cabaz da semana. Até lá, vê{" "}
            <a href="/supermercado-mais-barato" style={estiloLink}>qual é o supermercado mais barato</a> com o cabaz básico.
          </p>
        ) : (
          <>
            <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>{resposta}</p>
            {v && (
              <p style={estiloTexto}>
                {v.diff === 0
                  ? <>Em média, o cabaz custa o mesmo do que na semana passada.</>
                  : <>Em média, o cabaz está <strong style={forte}>{eur(Math.abs(v.diff), 2)} € {v.diff > 0 ? "mais caro" : "mais barato"}</strong> do que na semana de {dataExtenso(v.desde, { ano: false })} ({v.pct > 0 ? "+" : ""}{String(v.pct).replace(".", ",")} %).</>}
              </p>
            )}

            <h2 className="font-display" style={estiloH2}>A consoada desta semana, por supermercado</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {n.porLoja.map((l, i) => (
                <div key={l.loja} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>
                    {i + 1}. {l.nome}
                    {i > 0 && <span className="pj-num" style={{ fontSize: 12, fontWeight: 500, color: "var(--pj-text-faint)" }}> +{eur(l.total - barata.total, 2)} €</span>}
                  </span>
                  <Preco valor={l.total} tamanho={19} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 8, lineHeight: 1.5 }}>
              Preços online a {dataExtenso(n.dia)}. O produto mais barato de cada cadeia, na mesma quantidade, só com os artigos que todas tinham nesse dia.
            </p>

            <h2 className="font-display" style={estiloH2}>Artigo a artigo: onde fica mais barato</h2>
            <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
              {n.detalhe.filter((d) => d.melhor).map((d, i) => (
                <div key={d.nome} className="flex items-center justify-between px-4 py-3" style={{ gap: 10, ...linha(i) }}>
                  <span style={{ fontSize: 14, color: "var(--pj-text)", minWidth: 0 }}>
                    <strong style={{ fontWeight: 600 }}>{d.nome}</strong> <span style={{ color: "var(--pj-text-faint)" }}>· {d.txt}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2 }}>
                      Mais barato {naLoja(d.melhor)}{d.cara && d.cara.custo > d.melhor.custo ? ` · até ${eur(d.cara.custo, 2)} € ${naLoja(d.cara)}` : ""}
                    </span>
                  </span>
                  <Preco valor={d.melhor.custo} tamanho={16} />
                </div>
              ))}
            </div>
            <p style={estiloTexto}>
              <strong style={forte}>Dividir as compras compensa?</strong> Às vezes: o bacalhau numa cadeia e o resto noutra pode poupar mais alguns euros,
              mas uma segunda viagem custa combustível e tempo. A app faz essa conta por ti, já com a viagem.
            </p>
          </>
        )}

        <h2 className="font-display" style={estiloH2}>O que entra no cabaz</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>A consoada tradicional para {PESSOAS} pessoas, sem vinho nem marisco (o preço depende mais da escolha do que da loja):</p>
        <ul style={{ ...estiloTexto, paddingLeft: 20, listStyle: "disc" }}>
          {ARTIGOS_NATAL.map((a) => <li key={a.nome} style={{ marginTop: 4 }}><strong style={forte}>{a.nome}</strong>, {a.txt} <span style={{ color: "var(--pj-text-faint)" }}>({a.para})</span></li>)}
        </ul>

        <h2 className="font-display" style={estiloH2}>Como poupar na ceia de Natal</h2>
        <ol style={{ ...estiloTexto, marginTop: 0, paddingLeft: 20, listStyle: "decimal" }}>
          <li style={{ marginTop: 6 }}><strong style={forte}>Faz a lista antes de ir.</strong> Com as quantidades certas para quem vem: é o que mais evita compras a mais.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Compra o bacalhau cedo.</strong> O seco aguenta semanas. Cria um alerta de preço e compra quando baixar.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Compara ao quilo, não à embalagem.</strong> No bacalhau e no polvo a diferença entre calibres e marcas é grande.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Vê os folhetos de dezembro.</strong> As promoções de Natal mudam todas as semanas: <a href="/folhetos" style={estiloLink}>folhetos desta semana</a>.</li>
          <li style={{ marginTop: 6 }}><strong style={forte}>Aproveita as sobras.</strong> O bacalhau que sobra dá um bacalhau à Brás no dia 25, e o pão duro dá rabanadas.</li>
        </ol>

        <CtaApp texto="Compara a tua lista de Natal em todos os supermercados, grátis e sem conta" href="/?atalho=lista" />

        <h2 className="font-display" style={estiloH2}>Perguntas frequentes</h2>
        {faq.map((x) => (
          <div key={x.p} style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 600, color: "var(--pj-text)" }}>{x.p}</h3>
            <p style={{ ...estiloTexto, marginTop: 6 }}>{x.r}</p>
          </div>
        ))}

        <h2 className="font-display" style={estiloH2}>Receitas de Natal baratas</h2>
        <Pilulas itens={RECEITAS} />

        <h2 className="font-display" style={estiloH2}>Preço de hoje dos artigos de Natal</h2>
        <Pilulas itens={PRECOS_NATAL} />

        <h2 className="font-display" style={estiloH2}>Ver também</h2>
        <Pilulas itens={[
          { href: "/iva-zero", texto: "IVA zero a 1 de janeiro" },
          { href: "/supermercado-mais-barato", texto: "Supermercado mais barato" },
          { href: "/barometro", texto: "Barómetro PoupeJá", fraco: true },
        ]} />

        <p style={{ fontSize: 12.5, color: "var(--pj-text-faint)", marginTop: 28, lineHeight: 1.6 }}>
          Como fazemos as contas: todos os dias pesquisamos os mesmos artigos nas lojas online de cada cadeia e ficamos com o mais barato de cada uma, na mesma
          quantidade. Só se somam os artigos que todas as cadeias têm nesse dia. Quando a diferença é pequena ou depende de um só artigo, dizemos que há empate.
          São preços online, sem entrega, cartões nem cupões.
        </p>
      </div>
    </LayoutPublico>
  );
}

export async function getStaticProps() {
  const natal = await lerNatal();
  const atual = !!natal && natalServe(natal);
  const ano = anoDoNatal(hojeLisboa());
  return {
    props: { natal: natal ? { ...natal, semanas: (natal.semanas || []).slice(-8) } : null, atual, ano },
    revalidate: atual ? 12 * 3600 : 6 * 3600,
  };
}
