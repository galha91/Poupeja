/*
 * Onde é que o PoupeJá está a correr: na app Android (TWA), instalado como
 * PWA, ou num browser normal.
 *
 * Até aqui só se perguntava `display-mode: standalone`. Isso chega para a
 * PWA instalada, mas dentro da app da Play Store não é garantido — e o
 * resultado seria convidar a "Instalar o PoupeJá" quem já o instalou.
 *
 * O sinal fiável da TWA é o referrer do arranque: o Android abre a app com
 * `document.referrer === "android-app://com.poupeja.app/"`. Só vale para o
 * primeiro carregamento; uma navegação com recarga completa perde-o. Por
 * isso fica guardado em sessionStorage — e não em localStorage, que a TWA
 * partilha com o Chrome: um sinal persistente escondia os convites também
 * a quem depois abrisse o site no browser.
 */

export const PACOTE_ANDROID = "com.poupeja.app";
export const URL_PLAY_STORE = `https://play.google.com/store/apps/details?id=${PACOTE_ANDROID}`;

const CHAVE_SESSAO = "poupeja_twa";

/** Na app Android da Play Store. Chamar cedo (ver _app.js) para apanhar o referrer. */
export function emAppAndroid() {
  if (typeof window === "undefined") return false;
  try {
    if (document.referrer.startsWith(`android-app://${PACOTE_ANDROID}`)) {
      sessionStorage.setItem(CHAVE_SESSAO, "1");
      return true;
    }
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return false;
  }
}

/** Instalado de alguma forma: app Android ou PWA no ecrã principal. */
export function instalado() {
  if (typeof window === "undefined") return false;
  if (emAppAndroid()) return true;
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

/** "app-android" | "pwa" | "browser" — para analytics e para o registo do dispositivo. */
export function modoExecucao() {
  if (emAppAndroid()) return "app-android";
  return instalado() ? "pwa" : "browser";
}

/*
 * No Chrome para Android, pergunta se a app da Play Store já está instalada
 * neste telemóvel. Funciona porque o manifest declara a app em
 * `related_applications` e a app declara o site nos assetStatements. Noutros
 * browsers a API não existe e a resposta é simplesmente "não se sabe".
 */
export async function appAndroidInstalada() {
  try {
    if (typeof navigator === "undefined" || !navigator.getInstalledRelatedApps) return false;
    const apps = await navigator.getInstalledRelatedApps();
    return apps.some((a) => a.id === PACOTE_ANDROID);
  } catch {
    return false;
  }
}
