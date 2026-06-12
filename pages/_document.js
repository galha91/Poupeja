import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-PT">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PoupeJá" />
        <link rel="apple-touch-icon" href="/icon.svg" />

        {/* Favicon */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />

        {/* Google Search Console */}
        <meta name="google-site-verification" content="cttSk3-ygwGp1WFEaAoVoSrthAlBMSMmIItaYh5VpPc" />

        {/* Google Analytics GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q3JQG95879"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-Q3JQG95879');`,
          }}
        />

        {/* Open Graph — otimizado para partilha social */}
        <meta property="og:site_name" content="PoupeJá" />
        <meta property="og:title" content="PoupeJá — Poupa nas compras do dia a dia 🐷" />
        <meta property="og:description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://xn--poupej-uta.com" />
        <meta property="og:image" content="https://xn--poupej-uta.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="PoupeJá — Poupa nas compras do dia a dia" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:locale" content="pt_PT" />

        {/* Twitter / X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PoupeJá — Poupa nas compras do dia a dia 🐷" />
        <meta name="twitter:description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." />
        <meta name="twitter:image" content="https://xn--poupej-uta.com/api/og" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
