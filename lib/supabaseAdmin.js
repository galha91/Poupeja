import { createClient } from "@supabase/supabase-js";

/*
 * Cliente admin do Supabase (service role) — apenas para uso server-side
 * em rotas /api protegidas. A service role key ignora o Row Level Security,
 * por isso NUNCA deve ser exposta ao browser nem usada em código cliente.
 *
 * Devolve null se a env var ainda não estiver configurada, para que as
 * rotas que dependem dela possam falhar de forma controlada.
 */
export function getSupabaseAdmin() {
  /*
   * Sem fallback para o projeto de produção, de propósito. Este cliente
   * ignora o Row Level Security: apontá-lo por omissão à base de dados real
   * significava que qualquer ambiente mal configurado escrevia lá, com
   * poderes totais. Falta de configuração passa a devolver null, e quem
   * chama já sabe tratar disso (503).
   */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
