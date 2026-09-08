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
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Supabase não configurado: faltam NEXT_PUBLIC_SUPABASE_URL e/ou " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY. Cria um .env.local com as chaves do teu " +
    "projeto de desenvolvimento — não há fallback para a produção de propósito."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
