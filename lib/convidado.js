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
    // Dispositivos do dono (marcados pelo contador de visitas) não contam.
    if (localStorage.getItem("poupeja_nao_contar") === "1") return;
    if (sessionStorage.getItem(CHAVE_SESSAO)) return;
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  } catch {}
  const id = idConvidado(true);
  if (!id) return;
  // De onde veio da primeira vez (guardado pelo _app). O servidor só o usa
  // quando o convidado é novo.
  let toque = {};
  try { toque = JSON.parse(localStorage.getItem("poupeja_primeiro_toque") || "{}") || {}; } catch {}
  enviar({ id, origem: toque.origem, campanha: toque.campanha });
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

/** Id deste convidado, se já entrou na app (para ligar um email que ele dê). */
export function idConvidadoAtual() {
  return idConvidado(false);
}
