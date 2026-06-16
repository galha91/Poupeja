import { useEffect } from 'react';
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
      // Verifica se há atualização logo ao abrir
      reg.update().catch(() => {});

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

      // Verifica novamente sempre que a app volta a ficar visível
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  }, []);

  return <Component {...pageProps} />
}

export default MyApp
