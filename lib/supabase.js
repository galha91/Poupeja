import { createClient } from "@supabase/supabase-js";

// A anon key do Supabase é pública por design — a segurança é garantida
// por Row Level Security nas tabelas, não pelo segredo da chave.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qpwzqlswobjymqpvsk.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_8NoGng9dbokFIOeLS7ZKiw_nGv4dVfo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
