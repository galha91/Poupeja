/*
 * Ponte para a app nativa (Capacitor). A app carrega o site ao vivo
 * (capacitor.config.json → server.url), por isso o código web é o mesmo;
 * o que muda é o que a WebView do Android não faz sozinha:
 *
 *   - <a download> com blob: não descarrega nada numa WebView, e o
 *     navigator.share com ficheiros também não existe → Filesystem + Share;
 *   - não há Notification nem service worker → LocalNotifications, que
 *     AGENDA os avisos no telemóvel (tocam com a app fechada, sem servidor
 *     e sem os dados saírem do dispositivo).
 *
 * Os plugins são lidos de window.Capacitor.Plugins (registados pela casca
 * nativa); nada disto entra no JavaScript da web. Sem a casca, ou sem o
 * plugin instalado nela, tudo devolve false e a app segue pelo caminho web.
 * Na TWA (Play Store) corre o Chrome — o caminho web já funciona.
 */

function plugins() {
  try {
    const c = typeof window !== "undefined" ? window.Capacitor : null;
    return c?.isNativePlatform?.() ? c.Plugins || {} : null;
  } catch { return null; }
}

export function temNativo(nome) {
  return !!plugins()?.[nome];
}

/* ─── Ficheiros ─── */

function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

/** Grava na cache da app e abre o menu de partilha. true se tratou do ficheiro. */
export async function partilharFicheiroNativo(nome, blob, titulo) {
  const p = plugins();
  if (!p?.Filesystem || !p?.Share) return false;
  try {
    const { uri } = await p.Filesystem.writeFile({ path: nome, data: await blobParaBase64(blob), directory: "CACHE" });
    await p.Share.share({ title: titulo || nome, files: [uri], dialogTitle: titulo || nome });
    return true;
  } catch (e) {
    // Fechar o menu de partilha não é erro.
    return /cancel/i.test(String(e?.message || e)) ? true : false;
  }
}

/* ─── Notificações agendadas ─── */

const CHAVE_IDS = "poupeja_notif_nativas";

// Ids de notificação têm de ser inteiros de 32 bits; derivam do lembrete e do marco.
export function idNotificacao(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/**
 * Lista do que agendar: um aviso por antecedência, às 9:00 do dia certo,
 * só no futuro. Pura (testável); `agora` é um Date.
 */
export function planoNotificacoes(lembretes, textoDe, agora = new Date()) {
  const out = [];
  for (const l of lembretes) {
    const [a, m, d] = String(l.data).split("-").map(Number);
    if (!a || !m || !d) continue;
    for (const dias of l.antecedencias || []) {
      const quando = new Date(a, m - 1, d - dias, 9, 0, 0);
      if (quando <= agora) continue;
      out.push({ id: idNotificacao(`${l.id}@${dias}`), title: l.titulo, body: textoDe(l, dias), at: quando });
    }
  }
  return out.sort((x, y) => x.at - y.at).slice(0, 60); // o Android limita os alarmes por app
}

/**
 * Reagenda tudo: cancela o que este código agendou antes e agenda o plano
 * novo. Pede autorização só quando há algo para agendar (ou seja, depois
 * de a pessoa ativar um lembrete).
 */
export async function agendarNotificacoesNativas(plano) {
  const LN = plugins()?.LocalNotifications;
  if (!LN) return false;
  try {
    let anteriores = [];
    try { anteriores = JSON.parse(localStorage.getItem(CHAVE_IDS) || "[]"); } catch {}
    if (anteriores.length) await LN.cancel({ notifications: anteriores.map(id => ({ id })) }).catch(() => {});
    localStorage.setItem(CHAVE_IDS, "[]");
    if (!plano.length) return true;

    let perm = await LN.checkPermissions();
    if (perm.display === "prompt" || perm.display === "prompt-with-rationale") perm = await LN.requestPermissions();
    if (perm.display !== "granted") return false;

    await LN.schedule({
      notifications: plano.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: n.at, allowWhileIdle: true },
        extra: { url: "/" },
      })),
    });
    localStorage.setItem(CHAVE_IDS, JSON.stringify(plano.map(n => n.id)));
    return true;
  } catch {
    return false;
  }
}
