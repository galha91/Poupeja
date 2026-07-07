import Head from "next/head";
import { ArrowRight } from "lucide-react";

const SITE_URL = "https://xn--poupej-uta.com";

/*
 * Página de aterragem das partilhas — /p?v=poupanca&valor=23.45&ref=abc123
 * Existe para o WhatsApp/redes mostrarem um cartão rico (via /api/og com o
 * valor real) em vez de um link seco, e para carregar o ?ref= de quem
 * convidou até à app.
 */
export default function Partilha({ valor, ref_ }) {
  const valorFmt = valor.toFixed(2).replace(".", ",");
  const destino = ref_ ? `/?ref=${encodeURIComponent(ref_)}` : "/";
  const ogImg = `${SITE_URL}/api/og?v=poupanca&valor=${valor.toFixed(2)}`;
  const titulo = `Já poupei €${valorFmt} nas compras com o PoupeJá`;

  return (
    <>
      <Head>
        <title>{titulo}</title>
        <meta name="description" content="Poupança real, medida talão a talão. Folhetos, combustíveis e apoios — experimenta grátis, sem registo." />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content={titulo} />
        <meta property="og:description" content="Poupança real, medida talão a talão. Experimenta grátis — nem precisas de registo." />
        <meta property="og:image" content={ogImg} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImg} />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#f6f5f0", color: "#14231c" }}>
        <img src="/icon-192.png" alt="PoupeJá" width={64} height={64} style={{ borderRadius: 16 }} />
        <p className="mt-6" style={{ fontSize: 11, color: "#8a978e", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Poupança real com o PoupeJá
        </p>
        <h1 className="font-display mt-3" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Alguém já poupou <span style={{ color: "#0b6b4f" }}>€{valorFmt}</span> nas compras
        </h1>
        <p className="mt-3 max-w-sm" style={{ fontSize: 14.5, color: "#5c6b62", lineHeight: 1.6 }}>
          Folhetos dos supermercados, combustível mais barato, talões e apoios do Estado — tudo grátis.
          Podes experimentar sem criar conta.
        </p>
        <a href={destino} className="pj-tap inline-flex items-center gap-2 no-underline mt-7 rounded-2xl px-7 py-4 text-white font-semibold" style={{ background: "#0b6b4f", fontSize: 15 }}>
          Experimentar grátis <ArrowRight size={17} />
        </a>
        <a href="/instalar" className="mt-4 no-underline" style={{ fontSize: 13, fontWeight: 600, color: "#0b6b4f" }}>
          Ou instala a app no telemóvel →
        </a>
      </main>
    </>
  );
}

export async function getServerSideProps({ query, res }) {
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  const valor = Math.min(Math.max(parseFloat(query.valor) || 0, 0), 99999);
  const ref_ = typeof query.ref === "string" ? query.ref.slice(0, 16) : null;
  return { props: { valor, ref_ } };
}
