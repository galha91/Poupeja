import { useEffect } from "react";
import Head from "next/head";
import { URL_SITE } from "../../lib/site";
import { ID_PARTILHA_RE } from "../../lib/listaCompras";

/*
 * O link de uma lista partilhada (/lista/<id>) é só a porta: serve a
 * pré-visualização do WhatsApp/iMessage (meta tags, no servidor) e leva
 * logo para dentro do PoupeJá (/?lista=<id>), onde a lista abre no ecrã
 * da lista de compras, com a conta, o catálogo e a comparação de preços.
 * A edição já não vive aqui.
 */
export default function ListaPartilhada({ id }) {
  const valido = ID_PARTILHA_RE.test(id);
  const destino = valido ? `/?lista=${id}` : "/?atalho=lista";

  useEffect(() => { if (valido) window.location.replace(destino); }, []);

  return (
    <>
      <Head>
        <title>Lista de compras partilhada — PoupeJá</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Abre e edita esta lista de compras comigo, em tempo real. Grátis no PoupeJá." />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/* Pré-visualização (WhatsApp, iMessage, redes sociais) */}
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="PoupeJá" key="og:site_name" />
        <meta property="og:title" content="🛒 A nossa lista de compras — PoupeJá" key="og:title" />
        <meta property="og:description" content="Abre o link e edita a lista comigo, em tempo real. Grátis." key="og:description" />
        <meta property="og:image" content={`${URL_SITE}/api/og?v=lista`} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta property="og:image:alt" content="Lista de compras partilhada no PoupeJá" key="og:image:alt" />
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:title" content="🛒 A nossa lista de compras — PoupeJá" key="twitter:title" />
        <meta name="twitter:description" content="Abre o link e edita a lista comigo, em tempo real. Grátis." key="twitter:description" />
        <meta name="twitter:image" content={`${URL_SITE}/api/og?v=lista`} key="twitter:image" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: "var(--pj-surface, #f7f5ef)" }}>
        <span aria-hidden className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 18, background: "var(--pj-brand, #0b6b4f)", fontSize: 26 }}>🐷</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--pj-text, #14231c)", marginTop: 18 }}>
          {valido ? "A abrir a lista no PoupeJá…" : "Link da lista inválido"}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--pj-text-muted, #5b6a62)", lineHeight: 1.5, marginTop: 8, maxWidth: 320 }}>
          {valido ? "Se não abrir sozinha, toca no botão." : "Pede a quem partilhou para enviar o link outra vez."}
        </p>
        <a href={destino} style={{ marginTop: 22, minHeight: 48, display: "inline-flex", alignItems: "center", padding: "0 22px", borderRadius: 14, background: "var(--pj-brand, #0b6b4f)", color: "#fff", fontSize: 15, fontWeight: 600 }}>
          {valido ? "Abrir no PoupeJá" : "Ir para o PoupeJá"}
        </a>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { id: String(params.id || "") } };
}
