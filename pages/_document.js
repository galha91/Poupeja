import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-PT">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Tema escuro — aplica a classe antes de pintar para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('poupeja_prefs')||'{}');if(p.temaEscuro===true){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <meta name="description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." />

        {/* Fontes — preconnect + link (não bloqueia o primeiro render como @import) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b6b4f" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PoupeJá" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Favicon */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />

        {/* Google Search Console */}
        <meta name="google-site-verification" content="cttSk3-ygwGp1WFEaAoVoSrthAlBMSMmIItaYh5VpPc" />

        {/* Google Analytics GA4 — script inline para ser detetável no HTML estático */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q3JQG95879"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-Q3JQG95879');`,
          }}
        />

        {/*
          Os cartões Open Graph / Twitter vivem no _app.js, não aqui: as metas
          do _document não podem ser substituídas por uma página (o next/head
          só sabe desduplicar o que passa por ele, por `key`). Estando aqui,
          cada página emitia o SEU cartão e logo a seguir o genérico — e os
          leitores que ficam com a última ocorrência (X/Twitter) mostravam
          sempre o cartão genérico em vez do personalizado.
        */}
      </Head>
      <body>
        <Main />
        {/*
          A home é uma SPA: sem JavaScript o <div id="__next"> fica vazio e a
          pessoa vê uma página branca, sem sequer saber onde está. Isto dá-lhe
          o nome do sítio e os caminhos que funcionam mesmo sem JS.

          O `#__next:empty` é o que impede isto de aparecer por cima das
          páginas públicas (/folhetos, /combustiveis, …): essas vêm com o
          conteúdo montado do servidor, o contentor não está vazio, e a regra
          não pega. Sem esse detalhe, quem navega sem JS via este aviso
          repetido no topo de páginas que estavam a funcionar bem.
        */}
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: `.pj-sem-js{display:none}#__next:empty~.pj-sem-js{display:block}` }} />
          <div className="pj-sem-js" style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1c1917" }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>PoupeJá</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#57534e", marginTop: 12 }}>
              A app precisa de JavaScript para funcionar. Ativa-o nas definições do teu browser
              e recarrega a página — ou segue por aqui, que estas páginas abrem na mesma:
            </p>
            <ul style={{ fontSize: 15, lineHeight: 2, paddingLeft: 20, marginTop: 8 }}>
              <li><a href="/folhetos" style={{ color: "#0b6b4f" }}>Folhetos dos supermercados desta semana</a></li>
              <li><a href="/combustiveis" style={{ color: "#0b6b4f" }}>Preços dos combustíveis hoje</a></li>
              <li><a href="/receitas" style={{ color: "#0b6b4f" }}>Receitas baratas para 4 pessoas</a></li>
              <li><a href="/apoios" style={{ color: "#0b6b4f" }}>Apoios do Estado</a></li>
              <li><a href="/lista" style={{ color: "#0b6b4f" }}>Lista de compras partilhada</a></li>
              <li><a href="/instalar" style={{ color: "#0b6b4f" }}>Como instalar a app</a></li>
            </ul>
          </div>
        </noscript>
        <NextScript />
        {/* Awin Publisher MasterTag */}
        <script src="https://www.dwin1.com/pub.2930079.min.js" type="text/javascript" defer="defer"></script>
      </body>
    </Html>
  )
}
