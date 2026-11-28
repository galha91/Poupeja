import Head from "next/head";
import { useEffect, useState } from "react";
import { Link2, Wallet, ShoppingCart } from "lucide-react";
import LayoutPublico from "../../LayoutPublico";
import ImportarReceita from "../../ImportarReceita";
import { jsonLdSeguro } from "../../lib/escapar";
import { breadcrumbLd } from "../../lib/seoPrecos";
import { Migalhas } from "../../PaginasPrecos";

const SITE_URL = "https://xn--poupej-uta.com";
const TITULO = "Receitas do TikTok: vê quanto custam | PoupeJá";
const DESCRICAO = "Cola o link de um vídeo do TikTok, o texto de uma receita ou tira uma fotografia: vês os ingredientes, o custo por pessoa com os preços de hoje e uma versão mais barata.";

const PASSOS = [
  { Icone: Link2, titulo: "Cola, partilha ou fotografa", texto: "O link do TikTok, a descrição de um Reel ou a página de um livro." },
  { Icone: Wallet, titulo: "Vê quanto custa", texto: "O custo por pessoa com os preços de hoje e trocas que poupam." },
  { Icone: ShoppingCart, titulo: "Compra onde é mais barato", texto: "Os ingredientes vão para a lista e comparas os supermercados." },
];

const PERGUNTAS = [
  ["É grátis?", "Sim. Não precisas de conta nem de pagar para importar receitas ou comparar os supermercados."],
  ["De onde posso importar?", "Os links do TikTok abrem sozinhos. Do Instagram, do YouTube ou de um blog, copia a descrição da receita e cola-a no separador Texto. Também podes fotografar uma receita de um livro, de uma revista ou de um ecrã."],
  ["Como é calculado o custo?", "Cada ingrediente é ligado ao artigo certo dos supermercados e usa-se o melhor preço de hoje. É uma estimativa: na lista de compras vês o total exato em cada supermercado."],
  ["E se a receita só estiver dita no vídeo?", "Às vezes a descrição do vídeo não tem a receita. Nesse caso, escreve-a ou cola-a no separador Texto, ou tira uma captura de ecrã e usa o separador Fotografia."],
];

/*
 * /receitas/importar — também é o destino da partilha do Android
 * (share_target no manifest): ?url=…&text=…&title=… começa logo a importar.
 * Página estática: o trabalho é todo na API, a pedido.
 */
export default function Importar() {
  const [partilhado, setPartilhado] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const junto = [p.get("url"), p.get("text"), p.get("title")].filter(Boolean).join(" ").trim();
    if (junto) {
      setPartilhado(junto.slice(0, 5000));
      window.history.replaceState(null, "", "/receitas/importar");
    }
  }, []);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const passos = [{ nome: "PoupeJá", path: "/" }, { nome: "Receitas", path: "/receitas" }, { nome: "Importar uma receita", path: "/receitas/importar" }];
  const migalhas = breadcrumbLd(SITE_URL, passos);

  return (
    <LayoutPublico>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRICAO} />
        <link rel="canonical" href={`${SITE_URL}/receitas/importar`} />
        <meta property="og:title" key="og:title" content="Viste uma receita no TikTok? Vê quanto custa." />
        <meta property="og:description" key="og:description" content={DESCRICAO} />
        <meta property="og:url" key="og:url" content={`${SITE_URL}/receitas/importar`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(faqLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(migalhas) }} />
      </Head>
      <div className="mx-auto px-5" style={{ maxWidth: 640, paddingBottom: 48 }}>
        <div style={{ paddingTop: 16 }}><Migalhas passos={passos.slice(1)} /></div>
        <h1 className="font-display" style={{ fontSize: 32, lineHeight: 1.12, fontWeight: 600, marginTop: 14 }}>
          Viste uma receita no TikTok?<br /><span style={{ color: "var(--pj-brand-ink)" }}>Vê quanto custa.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12, marginBottom: 22 }}>
          Cola o link, o texto ou tira uma fotografia. Em segundos tens os ingredientes, o custo por pessoa com os preços de hoje e uma versão mais barata. Grátis e sem conta.
        </p>

        <ImportarReceita partilhado={partilhado} />

        <section aria-labelledby="como" style={{ marginTop: 40 }}>
          <h2 id="como" className="font-display" style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Como funciona</h2>
          <ol className="grid" style={{ gap: 10, listStyle: "none", padding: 0 }}>
            {PASSOS.map(({ Icone, titulo, texto }, i) => (
              <li key={i} className="flex items-start rounded-2xl" style={{ gap: 14, padding: "14px 16px", background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                <span className="flex items-center justify-center rounded-xl" style={{ flexShrink: 0, width: 38, height: 38, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)" }}><Icone size={18} /></span>
                <span>
                  <span className="block" style={{ fontSize: 15, fontWeight: 600 }}>{titulo}</span>
                  <span style={{ fontSize: 13.5, color: "var(--pj-text-muted)" }}>{texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="perguntas" style={{ marginTop: 36 }}>
          <h2 id="perguntas" className="font-display" style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Perguntas</h2>
          {PERGUNTAS.map(([q, a]) => (
            <details key={q} className="rounded-2xl" style={{ marginTop: 8, padding: "12px 16px", background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <summary style={{ fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{q}</summary>
              <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 8 }}>{a}</p>
            </details>
          ))}
        </section>
      </div>
    </LayoutPublico>
  );
}
