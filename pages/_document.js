import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-PT">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="PoupeJá - A tua carteira digital portuguesa" />

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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-03J0G95879" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-03J0G95879');
        `}} />

        {/* OG */}
        <meta property="og:title" content="PoupeJá" />
        <meta property="og:description" content="A tua carteira digital portuguesa" />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
