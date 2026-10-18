import { supabase } from "./supabase";

/*
 * Notificações push fora das Definições — o alerta de preço precisa delas
 * e pede-as no momento em que faz sentido (ao criar o alerta), em vez de
 * obrigar a ir às Definições primeiro. Mesma subscrição, mesmo endpoint.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** "ativo" | "inativo" | "bloqueado" | "sem-suporte" */
export async function estadoPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) return "sem-suporte";
  if (Notification.permission === "denied") return "bloqueado";
  try {
    const reg = await navigator.serviceWorker.ready;
    return (await reg.pushManager.getSubscription()) ? "ativo" : "inativo";
  } catch {
    return "inativo";
  }
}

/** Pede autorização e regista a subscrição na conta. Devolve o novo estado. */
export async function ativarPush() {
  if ((await estadoPush()) === "sem-suporte") return "sem-suporte";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "bloqueado";
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) }));
  await guardarSubscricao(sub);
  return "ativo";
}

/*
 * Envia a subscrição ao servidor: com sessão fica na conta; sem sessão
 * (convidado) fica sem dono e recebe só os avisos gerais.
 */
export async function guardarSubscricao(sub, metodo = "POST") {
  let token = null;
  try { token = (await supabase.auth.getSession()).data.session?.access_token || null; } catch {}
  await fetch("/api/push-subscribe", {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(metodo === "DELETE" ? { endpoint: sub.endpoint } : { subscription: sub }),
  });
}

/*
 * O aviso por notificação é personalizado e só existe para contas (o cron
 * percorre as subscrições com user_id). Sem conta, não vale a pena pedir
 * autorização: o aviso aparece dentro da app.
 */
export async function temConta() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch {
    return false;
  }
}
