import Head from "next/head";
import { ShoppingCart, Share2, Users, WifiOff } from "lucide-react";
import LayoutPublico, { CtaApp } from "../../LayoutPublico";
import { URL_SITE as SITE_URL } from "../../lib/site";

/*
 * Página pública da lista de compras.
 *
 * Existia um buraco: /folhetos e /receitas prometem "mete os ingredientes na
 * lista de compras" e o único destino era /instalar. Quem adivinhava
 * poupejá.com/lista — o nome mais natural do mundo — apanhava um 404 seco.
 */
const COMO_FUNCIONA = [
  { Icon: ShoppingCart, titulo: "Escreve o que precisas", texto: "Adiciona produtos à mão ou puxa os ingredientes de qualquer receita do PoupeJá num toque." },
  { Icon: Share2,       titulo: "Partilha o link",        texto: "Um toque em partilhar gera um link. Quem o receber abre a lista no browser — sem instalar nada, sem criar conta." },
  { Icon: Users,        titulo: "Riscam os dois ao mesmo tempo", texto: "Se o teu par riscar o leite no supermercado, desaparece do teu telemóvel em segundos. Sem telefonemas a meio do corredor." },
  { Icon: WifiOff,      titulo: "Funciona sem rede",      texto: "Dentro do hipermercado a rede falha. A lista continua a abrir e a guardar o que riscaste — sincroniza quando voltares a ter sinal." },
];

export default function Lista() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lista de compras partilhada — PoupeJá",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE_URL}/lista`,
    inLanguage: "pt-PT",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };
  return (
    <LayoutPublico>
      <Head>
        <title>Lista de Compras Partilhada — grátis e sem registo | PoupeJá</title>
        <meta name="description" content="Faz a lista de compras no telemóvel e partilha-a com quem vai contigo. Riscam os dois ao mesmo tempo, funciona offline e não precisa de conta. Grátis." />
        <link rel="canonical" href={`${SITE_URL}/lista`} />
        <meta property="og:title" content="Lista de compras partilhada — grátis, sem registo" key="og:title" />
        <meta property="og:description" content="Partilha a lista com quem vai às compras contigo. Riscam os dois ao mesmo tempo, mesmo sem rede." key="og:description" />
        <meta property="og:url" content={`${SITE_URL}/lista`} key="og:url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Grátis · sem registo
        </p>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 10 }}>
          Lista de compras partilhada
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 12 }}>
          A lista de compras do PoupeJá vive no teu telemóvel e pode ser{" "}
          <strong style={{ color: "var(--pj-text)" }}>partilhada por link</strong> com quem faz
          as compras contigo. Cada um risca no seu telemóvel e os dois veem o mesmo — sem
          instalar nada do outro lado, sem criar conta.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {COMO_FUNCIONA.map(({ Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-2xl p-4 flex gap-3.5" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: "var(--pj-subtle)" }}>
                <Icon size={18} style={{ color: "var(--pj-brand-ink)" }} />
              </span>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</p>
                <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.6, marginTop: 3 }}>{texto}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 36 }}>
          Recebeste um link de uma lista?
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Os links partilhados têm o formato <code style={{ fontSize: 13, background: "var(--pj-subtle)", padding: "2px 6px", borderRadius: 6 }}>poupejá.com/lista/…</code> e
          abrem direto na lista — basta tocar no link que te enviaram. Se caíste aqui sem link,
          é porque este é o endereço geral: a tua própria lista está{" "}
          <a href="/" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>dentro da app</a>, no separador Mercado.
        </p>

        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>
          Quem tiver o link vê a lista
        </h2>
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
          Uma lista partilhada não tem palavra-passe: quem tiver o link consegue ver e editar.
          É de propósito — é isso que permite ao outro abrir sem conta nenhuma. Por isso, não
          escrevas nada pessoal numa lista partilhada e envia o link só a quem confias. Podes
          ler os detalhes na <a href="/privacidade" style={{ color: "var(--pj-brand-ink)", fontWeight: 600 }}>política de privacidade</a>.
        </p>

        <CtaApp texto="Faz a tua lista e partilha-a — grátis" />
      </div>
    </LayoutPublico>
  );
}
