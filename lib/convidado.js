/*
 * Contagem de quem usa o site em modo convidado. O convidado local não tem
 * conta no Supabase, por isso cada browser recebe um id aleatório (sem dados
 * pessoais) e avisa a API quando abre a app ou quando passa a ter conta.
 */
const CHAVE_ID = "poupeja_convidado_id";
const CHAVE_SESSAO = "poupeja_convidado_contado";

function idConvidado(criar) {
  try {
    let id = localStorage.getItem(CHAVE_ID);
    if (!id && criar && typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
      localStorage.setItem(CHAVE_ID, id);
    }
    return id;
  } catch {
    return null;
  }
}

function enviar(corpo) {
  try {
    fetch("/api/convidado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** Uma abertura por sessão do browser. */
export function registarAberturaConvidado() {
  try {
    if (sessionStorage.getItem(CHAVE_SESSAO)) return;
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  } catch {}
  const id = idConvidado(true);
  if (id) enviar({ id });
}

/** O convidado criou conta ou entrou numa. */
export function registarConversaoConvidado() {
  const id = idConvidado(false);
  if (id) enviar({ id, converteu: true });
}
