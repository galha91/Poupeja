/*
 * Que browser está a abrir o site, para a página /instalar mostrar os passos
 * certos. Só olha para o user agent (e para o toque, que distingue o iPad
 * com iPadOS 13+, que se apresenta como Mac).
 *
 * Devolve { so, nav }:
 *   so  → "ios" | "android" | "desktop"
 *   nav → "app" (browser dentro de outra app: Instagram, Facebook, TikTok…),
 *         ou o browser: "safari", "chrome", "edge", "firefox", "opera",
 *         "samsung", "duckduckgo", "yandex", "xiaomi", "huawei".
 *
 * A ordem dos testes importa: os browsers dentro de apps e os derivados do
 * Chromium também dizem "Safari" ou "Chrome" no user agent.
 */

// Browsers dentro de apps: não instalam; é preciso abrir o link num browser
const EM_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|MessengerForiOS|musical_ly|BytedanceWebview|TikTok|LinkedInApp|Snapchat|Pinterest|Twitter|Line\/|MicroMessenger|Barcelona|GSA\//i;

export function detetarNavegador(ua = "", { toque = false } = {}) {
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && toque);
  const android = !ios && /Android/i.test(ua);
  const so = ios ? "ios" : android ? "android" : "desktop";

  if (so !== "desktop" && EM_APP.test(ua)) return { so, nav: "app" };
  // WebView genérica do Android (outras apps que abrem links por dentro)
  if (android && /; wv\)/.test(ua)) return { so, nav: "app" };

  if (ios) {
    if (/CriOS/.test(ua)) return { so, nav: "chrome" };
    if (/EdgiOS/.test(ua)) return { so, nav: "edge" };
    if (/FxiOS/.test(ua)) return { so, nav: "firefox" };
    if (/OPiOS|OPT\//.test(ua)) return { so, nav: "opera" };
    if (/DuckDuckGo|Ddg\//.test(ua)) return { so, nav: "duckduckgo" };
    if (/YaBrowser/.test(ua)) return { so, nav: "yandex" };
    return { so, nav: "safari" }; // inclui o Brave, que usa o user agent do Safari
  }

  if (android) {
    if (/SamsungBrowser/.test(ua)) return { so, nav: "samsung" };
    if (/EdgA\//.test(ua)) return { so, nav: "edge" };
    if (/Firefox\//.test(ua)) return { so, nav: "firefox" };
    if (/OPR\/|OPX\//.test(ua)) return { so, nav: "opera" };
    if (/DuckDuckGo/.test(ua)) return { so, nav: "duckduckgo" };
    if (/YaBrowser/.test(ua)) return { so, nav: "yandex" };
    if (/MiuiBrowser|XiaoMi/.test(ua)) return { so, nav: "xiaomi" };
    if (/HuaweiBrowser|HONORBrowser/.test(ua)) return { so, nav: "huawei" };
    return { so, nav: "chrome" }; // inclui o Brave e outros Chromium
  }

  if (/Edg\//.test(ua)) return { so, nav: "edge" };
  if (/OPR\//.test(ua)) return { so, nav: "opera" };
  if (/Firefox\//.test(ua)) return { so, nav: "firefox" };
  if (/Chrome\//.test(ua) || /Chromium\//.test(ua)) return { so, nav: "chrome" };
  if (/Safari\//.test(ua)) return { so, nav: "safari" };
  return { so, nav: "chrome" };
}
