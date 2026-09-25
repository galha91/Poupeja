import { supabase } from "./supabase";
import { pararSync } from "./sync";

/*
 * Apaga a conta com sessão iniciada (ver pages/api/apagar-conta.js) e limpa
 * o que ficou neste dispositivo. Usado nas Definições e em /apagar-conta.
 *
 * Os dados locais vão também: são cópia dos da conta, e se ficassem, o
 * pull() do lib/sync subia-os para a próxima conta criada neste telemóvel.
 */
export async function apagarConta() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sem sessão iniciada.");

  const r = await fetch("/api/apagar-conta", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ confirmar: "APAGAR" }),
  });
  if (!r.ok) {
    const { erro } = await r.json().catch(() => ({}));
    throw new Error(erro || "Não foi possível apagar a conta agora.");
  }

  pararSync(); // antes de limpar: a limpeza não pode ir atrás da conta como "alteração"
  limparDadosLocais();
  // "local": a conta já não existe no servidor; só falta esquecer a sessão aqui.
  try { await supabase.auth.signOut({ scope: "local" }); } catch {}
}

export function limparDadosLocais() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("poupeja_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}
