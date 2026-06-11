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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qpwzqlswobjryrnqpvsk.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
