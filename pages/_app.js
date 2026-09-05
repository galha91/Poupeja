import { useEffect } from 'react';
import Head from 'next/head';
import { URL_SITE } from '../lib/site';
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let recarregando = false;

    // Quando um service worker novo assume o controlo, recarrega uma vez
    // para que o utilizador veja logo a versão mais recente.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const verificar = () => reg.update().catch(() => {});

      // Verifica se há atualização logo ao abrir
      verificar();

      // Se já houver um SW à espera, ativa-o imediatamente
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Quando encontra uma nova versão, ativa-a assim que estiver instalada
      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        if (!novo) return;
        novo.addEventListener('statechange', () => {
          if (novo.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Verifica sempre que a app volta a ficar visível — essencial para a
      // app instalada no ecrã principal, que muitas vezes é retomada (não
      // arrancada de novo) e não verificaria atualizações de outra forma.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verificar();
      });
      window.addEventListener('focus', verificar);
      window.addEventListener('online', verificar);

      // Verificação periódica enquanto a app fica aberta (a cada 30 min)
      setInterval(verificar, 30 * 60 * 1000);
    }).catch(() => {});
  }, []);

  // Aplica/atualiza o tema escuro quando a preferência muda noutra parte da app
  useEffect(() => {
    function aplicarTema() {
      try {
        const p = JSON.parse(localStorage.getItem('poupeja_prefs') || '{}');
        document.documentElement.classList.toggle('dark', p.temaEscuro === true);
      } catch (_) {}
    }
    aplicarTema();
    window.addEventListener('poupeja:tema', aplicarTema);
    return () => window.removeEventListener('poupeja:tema', aplicarTema);
  }, []);

  return (
    <>
      <Head>
        {/*
          Cartão de partilha por omissão. Cada `key` é um ponto de substituição:
          uma página que ponha <meta property="og:image" key="og:image" …/> no
          seu próprio <Head> APAGA esta — é assim que o /p e a /lista mostram o
          cartão personalizado sem o genérico vir atrás. Mexer numa key aqui
          obriga a mexer na mesma key nas páginas.
        */}
        <meta property="og:site_name" content="PoupeJá" key="og:site_name" />
        <meta property="og:title" content="PoupeJá — Poupa nas compras do dia a dia 🐷" key="og:title" />
        <meta property="og:description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." key="og:description" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:url" content={URL_SITE} key="og:url" />
        <meta property="og:image" content={`${URL_SITE}/og.png?v=2`} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta property="og:image:alt" content="PoupeJá — os folhetos de todos os supermercados num só sítio, grátis" key="og:image:alt" />
        <meta property="og:image:type" content="image/png" key="og:image:type" />
        <meta property="og:locale" content="pt_PT" key="og:locale" />

        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:title" content="PoupeJá — Poupa nas compras do dia a dia 🐷" key="twitter:title" />
        <meta name="twitter:description" content="Guarda talões, descobre promoções e desafia-te a poupar mais este mês. A app de poupança portuguesa. 100% grátis." key="twitter:description" />
        <meta name="twitter:image" content={`${URL_SITE}/og.png?v=2`} key="twitter:image" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
