import { createClient } from "@supabase/supabase-js";

/*
 * Cliente do Supabase para o browser.
 *
 * A anon key é pública por design — a segurança vem do Row Level Security
 * nas tabelas, não do segredo da chave. O que NÃO pode acontecer é o
 * projeto ser adivinhado.
 *
 * Havia aqui um fallback para o URL e a chave da produção. Parecia
 * inofensivo, mas queria dizer que qualquer ambiente sem as env vars
 * configuradas — uma máquina local, um preview mal configurado, um fork —
 * se ligava silenciosamente à base de dados REAL e escrevia lá. Um teste
 * mal apontado bastava para estragar dados de gente a sério.
 *
 * Agora falta de configuração é erro, não é um atalho para a produção.
 * Para desenvolver, cria um .env.local com as chaves do TEU projeto de
 * desenvolvimento (ver TAREFAS_PC.md).
 *
 * ── Porque é que o erro é preguiçoso ──────────────────────────────────
 *
 * À primeira, este ficheiro fazia `throw` assim que era importado. A
 * intenção estava certa, o momento não: o `next build` importa TODOS os
 * módulos de página na fase "Collecting page data", e nessa fase ninguém
 * fala com o Supabase — só se lê a forma da página. Resultado, com as env
 * vars ausentes na máquina de build:
 *
 *     Error: Failed to collect page data for /admin
 *     Error: Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL...
 *
 * O build inteiro morria. Ficou escondido duas semanas porque o deploy já
 * falhava antes, no cron (ver TAREFAS_PC.md), e ninguém chegou a ver isto.
 *
 * O erro continua a ser um erro — não há fallback, não há cliente falso
 * que finja funcionar e devolva dados vazios em silêncio, que é
 * precisamente o que esta guarda existe para impedir. Só muda de momento:
 * rebenta quando alguém TOCA no cliente (`supabase.auth`, `supabase.from`),
 * não quando o módulo é carregado. Importar passa; usar sem configuração
 * não.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FALTA_CONFIGURACAO =
  "Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL e/ou " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY. Cria um .env.local com as chaves do teu " +
  "projeto de desenvolvimento — não há fallback para a produção de propósito.";

/*
 * Um cliente que só sabe fazer uma coisa: rebentar com a razão certa.
 * Símbolos e `then` devolvem undefined para que inspecionar o objeto
 * (um `await` por engano, um console.log, o React DevTools) não dispare
 * um erro enganador longe do sítio onde o problema está.
 */
function clientePorConfigurar() {
  return new Proxy(
    {},
    {
      get(_alvo, prop) {
        if (typeof prop === "symbol" || prop === "then" || prop === "toJSON") {
          return undefined;
        }
        throw new Error(FALTA_CONFIGURACAO);
      },
      apply() {
        throw new Error(FALTA_CONFIGURACAO);
      },
    }
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : clientePorConfigurar();

/* Para quem queira verificar antes de tocar, em vez de apanhar o erro. */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_KEY);
