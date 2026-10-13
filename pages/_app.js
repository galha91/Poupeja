import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { URL_SITE } from '../lib/site';
import { modoExecucao } from '../lib/plataforma';
import AvisoCookies from '../AvisoCookies';

function temSessaoGuardada() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (/^sb-.*-auth-token$/.test(localStorage.key(i) || '')) return true;
    }
  } catch (_) {}
  return false;
}
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Contador de visitas sem cookies (ver pages/api/visita.js). Só o caminho e,
  // na primeira página da visita, o site de onde vieste.
  useEffect(() => {
    // Os dispositivos do dono ficam marcados e deixam de contar.
    let primeira = true;
    const contar = async (url) => {
      try {
        if (localStorage.getItem('poupeja_nao_contar') === '1') return;
      } catch (_) {}
      const ref = primeira ? document.referrer : 'interno';
      // Novo ou recorrente: só um bit, calculado neste aparelho (o primeiro dia
      // fica guardado aqui; o servidor nunca recebe a data).
      let rec = null;
      try {
        const hoje = new Date().toLocaleDateString('sv-SE');
        let primeiroDia = localStorage.getItem('poupeja_primeira_visita');
        if (!primeiroDia) { primeiroDia = hoje; localStorage.setItem('poupeja_primeira_visita', hoje); }
        rec = primeiroDia === hoje ? 'novo' : 'recorrente';
      } catch (_) {}
      const o = primeira ? new URLSearchParams(window.location.search).get('o') : null;
      primeira = false;
      const headers = { 'Content-Type': 'application/json' };
      /*
       * O cliente do Supabase (~60 kB) vivia aqui, no _app — ou seja, em
       * TODAS as páginas, incluindo as públicas de SEO e a de quem nunca
       * criou conta. Só faz falta para mandar o token de quem tem sessão,
       * e uma sessão do Supabase deixa sempre uma chave "sb-…" no
       * localStorage. Sem essa chave, nem se descarrega.
       */
      try {
        if (temSessaoGuardada()) {
          const { supabase, supabaseConfigurado } = await import('../lib/supabase');
          if (supabaseConfigurado) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
          }
        }
      } catch (_) {}
      try {
        const r = await fetch('/api/visita', {
          method: 'POST',
          headers,
          body: JSON.stringify({ caminho: url.split(/[?#]/)[0], ref, o, modo: modoExecucao(), rec }),
          keepalive: true,
        });
        if (r.headers.get('X-Nao-Contar') === '1') localStorage.setItem('poupeja_nao_contar', '1');
      } catch (_) {}
    };
    contar(window.location.pathname);
    router.events.on('routeChangeComplete', contar);
    return () => router.events.off('routeChangeComplete', contar);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tem de correr no primeiro carregamento: é o único momento em que o
  // referrer da app Android está disponível (ver lib/plataforma.js).
  // Aproveita-se para dizer ao GA de onde vem a sessão — sem isto, as
  // visitas da app e do site ficavam misturadas nos relatórios.
  useEffect(() => {
    const modo = modoExecucao();
    try { window.gtag?.('set', 'user_properties', { modo_app: modo }); } catch (_) {}
  }, []);

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
        {/* Título por omissão: a app (/) não tinha <title> — o separador do
            browser e os leitores de ecrã mostravam o endereço. As páginas
            públicas substituem-no com o seu (mesma key). */}
        <title key="title">PoupeJá — Folhetos, lista de compras e combustível mais barato</title>
        <meta name="description" content="Folhetos de 9 supermercados, uma lista de compras que diz onde fica mais barata e os postos de combustível mais baratos perto de ti. Grátis e sem registo." />
        <meta property="og:site_name" content="PoupeJá" key="og:site_name" />
        <meta property="og:title" content="PoupeJá — Folhetos, lista de compras e combustível mais barato" key="og:title" />
        <meta property="og:description" content="Folhetos de 9 supermercados, lista de compras mais barata e combustível mais barato perto de ti. Grátis e sem registo." key="og:description" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:url" content={URL_SITE} key="og:url" />
        <meta property="og:image" content={`${URL_SITE}/og.png?v=2`} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta property="og:image:alt" content="PoupeJá — folhetos, lista de compras e combustível mais barato" key="og:image:alt" />
        <meta property="og:image:type" content="image/png" key="og:image:type" />
        <meta property="og:locale" content="pt_PT" key="og:locale" />

        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        {/* Sem twitter:title/description/image: o X cai para og:*, que cada
            página já substitui. Duplicar aqui mostrava o cartão genérico. */}
      </Head>
      <Component {...pageProps} />
      <AvisoCookies />
    </>
  )
}

export default MyApp
