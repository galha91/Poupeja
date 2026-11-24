import Head from "next/head";
import LayoutPublico from "../LayoutPublico";
import { Migalhas, estiloH1, estiloH2, estiloTexto, estiloCartao, estiloLink } from "../PaginasPrecos";
import { breadcrumbLd } from "../lib/seoPrecos";
import { jsonLdSeguro } from "../lib/escapar";
import { URL_SITE, DOMINIO_VISIVEL } from "../lib/site";
import { COMPARADAS, NAO_INCLUIDAS } from "../lib/cobertura";
import { receitas } from "../lib/receitas/motor";
import { COLECOES } from "../lib/receitas/colecoes";

/*
 * Página de imprensa: o que é o PoupeJá em poucas linhas, os dados que
 * se podem citar, o logótipo e o contacto. Texto fixo, sem dados por
 * pedido. É o link que vai nos emails a jornalistas (docs/CAMPANHA.md).
 */
const CONTACTO = "poupeja.portugal@gmail.com";
const TITULO = "Imprensa: o que é o PoupeJá, dados e contacto";
const DESCRICAO = "O PoupeJá é um site português, grátis e sem registo, que compara preços de supermercado, folhetos e combustíveis. Dados para citar, logótipo e contacto.";

const DADOS = [
  { href: "/barometro", nome: "Barómetro do cabaz", texto: "O custo do cabaz básico em cada cadeia, semana a semana." },
  { href: "/precos", nome: "Preços por artigo", texto: "O preço de hoje de cada artigo básico em cada cadeia, com histórico." },
  { href: "/comparar", nome: "Cadeia contra cadeia", texto: "Qual de duas cadeias fica mais barata, artigo a artigo." },
  { href: "/combustiveis", nome: "Combustíveis por concelho", texto: "Os postos mais baratos de cada concelho, com dados oficiais da DGEG." },
  { href: "/combustiveis/esta-semana", nome: "Combustíveis esta semana", texto: "O que cada marca subiu ou desceu nos últimos 7 dias." },
  { href: "/reduflacao", nome: "Reduflação", texto: "Produtos que ficaram mais pequenos sem o preço descer." },
];
/*
 * Ecrãs para descarregar: capturas reais do site em produção (telemóvel,
 * 780 × 1688), com os preços reais do dia em que foram tiradas (obtidos da
 * API de produção). Refazem-se depois de mudanças visíveis.
 */
const DIA_ECRAS = "14 e 24 de novembro de 2026";
const ECRAS = [
  { f: "app-plano-semana", nome: "Plano da semana", texto: "Os jantares da semana, com sopa, para a casa toda." },
  { f: "app-ajustar-jantar", nome: "Ajustar um jantar", texto: "Trocar por outra proteína, jantar fora, convidados, cozinhar a dobrar." },
  { f: "app-lista-comparada", nome: "A lista, comparada", texto: "A mesma lista em cada supermercado, com a loja mais barata à frente." },
  { f: "app-orcamento", nome: "Cabe no orçamento?", texto: "O total real da lista ao lado do orçamento da semana." },
  { f: "app-o-que-posso-cozinhar", nome: "O que posso cozinhar?", texto: "Receitas com o que já há em casa; o que falta vai para a lista." },
  { f: "site-receita-foto", nome: "Uma receita", texto: "Fotografia, tempo, custo e valores por pessoa; as quantidades ajustam-se à casa." },
  { f: "site-receitas-lista", nome: "Receitas baratas", texto: "Páginas públicas de receitas baratas, com fotografia, sem registo." },
];
/* Peças publicadas sobre o PoupeJá. Acrescentar à cabeça quando sair outra. */
const NA_IMPRENSA = [
  { meio: "Pplware", data: "novembro de 2026", titulo: "Este site português reúne e compara preços de supermercados, combustíveis e muito mais",
    href: "https://pplware.sapo.pt/informacao/este-site-portugues-reune-e-compara-precos-de-supermercados-combustiveis-e-muito-mais/" },
  { meio: "HR Portugal", data: "7 de novembro de 2026", titulo: "Onde é mais barato? Nova app gratuita permite comparar preços de supermercados e combustíveis em tempo real",
    href: "https://hrportugal.sapo.pt/nova-app-gratuita-permite-comparar-precos-de-supermercados-e-combustiveis-em-tempo-real/" },
];
const METODO = [
  "Os preços de supermercado vêm das lojas online de cada cadeia e são atualizados todos os dias. Do Lidl entram as promoções do folheto e os preços dos talões que os utilizadores leem.",
  "Compara-se o mesmo artigo pelo preço por kg, litro ou unidade, para que embalagens diferentes não enganem.",
  "Quando uma cadeia não tem o artigo, fica de fora dessa comparação: nunca se estima nem se inventa um preço.",
  "Os preços online podem ser diferentes dos da loja física. Os valores são indicativos e cada página mostra a data em que foram recolhidos.",
  "Os combustíveis são os preços que os postos comunicam à DGEG.",
];
const FICHEIROS = [
  { href: "/icon.svg", nome: "Logótipo (SVG)" },
  { href: "/icon-512.png", nome: "Logótipo (PNG, 512 px)" },
  { href: "/og.png", nome: "Imagem de apresentação (PNG)" },
];

export default function Imprensa() {
  const canonical = `${URL_SITE}/imprensa`;
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Imprensa", path: "/imprensa" }];
  const linha = (i) => (i ? { borderTop: "1px solid var(--pj-subtle)" } : {});
  return (
    <LayoutPublico>
      <Head>
        <title>{`${TITULO} | PoupeJá`}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={TITULO} key="og:title" />
        <meta property="og:description" content={DESCRICAO} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd(URL_SITE, passos)) }} />
      </Head>
      <div style={{ paddingTop: 24 }}>
        <Migalhas passos={passos.slice(1)} />
        <h1 className="font-display" style={estiloH1}>Imprensa</h1>
        <p style={{ ...estiloTexto, color: "var(--pj-text)", fontWeight: 500 }}>
          O PoupeJá ({DOMINIO_VISIVEL}) é um site português, grátis e sem registo, para ver onde ficam mais baratas as compras
          antes de sair de casa: preços de supermercado, folhetos, combustíveis, receitas, talões e garantias, e apoios do Estado.
        </p>

        <h2 className="font-display" style={estiloH2}>Em poucas linhas</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {[
            "Acompanha os preços de mais de 18 mil produtos, todos os dias.",
            `Compara os preços online de ${COMPARADAS.length} cadeias: ${COMPARADAS.map((c) => c.nome).join(", ")}.`,
            "Os preços dos combustíveis são os que os postos comunicam à DGEG.",
            `Planeia as refeições da semana com ${receitas().length} receitas portuguesas baratas, ajusta-as à casa e faz a lista de compras.`,
            "A comparação em todos os supermercados é grátis, assim como dividir as compras por duas lojas.",
            "Não pede email nem instalação. Não vende dados.",
            "Alguns links levam a lojas parceiras e podem dar comissão. Isso não altera os resultados.",
          ].map((t, i) => (
            <p key={i} className="px-4 py-3" style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5, ...linha(i) }}>{t}</p>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 10, lineHeight: 1.55 }}>
          Cadeias que ainda não entram na comparação: {NAO_INCLUIDAS.map((c) => c.nome).join(", ")}. Do Lidl entram as promoções do folheto e os preços dos talões lidos pelos utilizadores.
        </p>

        <h2 className="font-display" style={estiloH2}>Na imprensa</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {NA_IMPRENSA.map((n, i) => (
            <a key={n.href} href={n.href} target="_blank" rel="noopener" className="pj-tap no-underline block px-4 py-3" style={linha(i)}>
              <span className="block" style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text-faint)" }}>{n.meio} · {n.data}</span>
              <span className="block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 2, lineHeight: 1.4 }}>{n.titulo}</span>
            </a>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Como recolhemos os preços</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {METODO.map((t, i) => (
            <p key={i} className="px-4 py-3" style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5, ...linha(i) }}>{t}</p>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Dados que pode citar</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {DADOS.map((d, i) => (
            <a key={d.href} href={d.href} className="pj-tap no-underline block px-4 py-3" style={linha(i)}>
              <span className="block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{d.nome}</span>
              <span className="block" style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>{d.texto}</span>
            </a>
          ))}
        </div>
        <p style={estiloTexto}>
          Os números podem ser usados livremente com a indicação «Fonte: PoupeJá, {DOMINIO_VISIVEL}» e a data dos preços, que está em cada página.
        </p>

        <h2 className="font-display" style={estiloH2}>Ficha técnica</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {[
            ["O que é", "Site e app web (instala-se no telemóvel a partir do browser) para poupar nas compras"],
            ["Preço", "Grátis e sem registo"],
            ["Supermercados comparados", `${COMPARADAS.length}: ${COMPARADAS.map((c) => c.nome).join(", ")}`],
            ["Receitas", `${receitas().length}, em ${COLECOES.length} coleções públicas (por ingrediente, dieta e ocasião)`],
            ["Combustíveis", "Os postos de todo o país, com os preços que comunicam à DGEG"],
            ["Feito em", "Portugal"],
          ].map(([k, v], i) => (
            <div key={k} className="px-4 py-3" style={linha(i)}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text-faint)" }}>{k}</p>
              <p style={{ fontSize: 14, color: "var(--pj-text)", lineHeight: 1.5, marginTop: 2 }}>{v}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Ecrãs</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Capturas reais, tiradas no telemóvel a {DIA_ECRAS}, com os preços desse dia (PNG, 780 × 1688). De uso livre em peças sobre o PoupeJá.
        </p>
        <div className="grid grid-cols-2 gap-3" style={{ marginTop: 14 }}>
          {ECRAS.map((e) => (
            <a key={e.f} href={`/imprensa/${e.f}.png`} download className="pj-tap no-underline block rounded-2xl overflow-hidden" style={estiloCartao}>
              <img src={`/imprensa/${e.f}.png`} alt={`${e.nome}: ${e.texto}`} loading="lazy" width={780} height={1688}
                style={{ display: "block", width: "100%", height: "auto", aspectRatio: "780 / 1688", background: "var(--pj-subtle)" }} />
              <span className="block px-3 py-2.5">
                <span className="block" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>{e.nome}</span>
                <span className="block" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 2, lineHeight: 1.4 }}>{e.texto}</span>
                <span className="block" style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-brand-ink)", marginTop: 6 }}>Descarregar</span>
              </span>
            </a>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Logótipo e imagens</h2>
        <div className="rounded-2xl overflow-hidden" style={estiloCartao}>
          {FICHEIROS.map((f, i) => (
            <a key={f.href} href={f.href} download className="pj-tap no-underline block px-4 py-3" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-brand-ink)", ...linha(i) }}>{f.nome}</a>
          ))}
        </div>

        <h2 className="font-display" style={estiloH2}>Contacto</h2>
        <p style={{ ...estiloTexto, marginTop: 0 }}>
          Para pedir dados de um artigo, de uma cadeia ou de um concelho, marcar uma entrevista ou pedir uma correção:{" "}
          <a href={`mailto:${CONTACTO}`} style={estiloLink}>{CONTACTO}</a>.
        </p>
        <p style={estiloTexto}>
          Fundador e contacto: Ricardo Galha.
        </p>
      </div>
    </LayoutPublico>
  );
}
