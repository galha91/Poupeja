/*
 * Contagem de quem usa o site em modo convidado. O convidado local não tem
 * conta no Supabase, por isso cada browser recebe um id aleatório (sem dados
 * pessoais) e avisa a API quando abre a app ou quando passa a ter conta.
 */
import { modoExecucao } from "./plataforma";

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
    // Dispositivos do dono (marcados pelo contador de visitas) não contam.
    if (localStorage.getItem("poupeja_nao_contar") === "1") return;
    if (sessionStorage.getItem(CHAVE_SESSAO)) return;
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  } catch {}
  const id = idConvidado(true);
  if (id) enviar({ id, chegada: chegadaDaSessao() });
}

/* De onde veio e por que página entrou nesta sessão (guardado pelo _app). */
function chegadaDaSessao() {
  let c = {};
  try { c = JSON.parse(sessionStorage.getItem("poupeja_chegada") || "{}") || {}; } catch {}
  return { ref: c.ref || "", o: c.o || null, entrada: c.entrada || "/", modo: modoExecucao() };
}

/* Uma parte da app que o convidado abriu (uma vez por sessão e parte). */
export function registarSecaoConvidado(secao) {
  const id = idConvidado(false);
  if (!id || !secao) return;
  try {
    if (localStorage.getItem("poupeja_nao_contar") === "1") return;
    const chave = `poupeja_secao_${secao}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
  } catch {}
  enviar({ id, secao });
}

/* Resposta a "Como conheceste o PoupeJá?". */
export function responderComoConheceu(resposta) {
  const id = idConvidado(false);
  if (id) enviar({ id, resposta });
}

/** O convidado criou conta ou entrou numa. */
export function registarConversaoConvidado() {
  const id = idConvidado(false);
  if (id) enviar({ id, converteu: true });
}

/*
 * Um passo do percurso do convidado (comparou | escolheu | alerta |
 * pediu_conta). Uma vez por sessão e marco; sem id (já tem conta, ou nunca
 * foi contado) não faz nada.
 */
export function registarMarcoConvidado(marco) {
  const id = idConvidado(false);
  if (!id) return;
  try {
    if (localStorage.getItem("poupeja_nao_contar") === "1") return;
    const chave = `poupeja_marco_${marco}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
  } catch {}
  enviar({ id, marco });
}
