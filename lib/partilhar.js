import { evento } from "./analytics";

/* Partilha nativa (iOS/Android) com fallback para copiar o link. */
export async function partilharPoupanca(valor, periodo = "este mês") {
  evento("share", { content_type: "poupanca" });
  const texto = `Já poupei €${valor.toFixed(2)} nas compras ${periodo} com o PoupeJá 🐷💚 Experimenta grátis:`;
  const url = "https://poupejá.com";
  if (typeof navigator === "undefined") return false;
  if (navigator.share) {
    try {
      await navigator.share({ title: "PoupeJá", text: texto, url });
      return "partilhado";
    } catch (e) {
      if (e?.name === "AbortError") return false; // utilizador cancelou
    }
  }
  try {
    await navigator.clipboard.writeText(`${texto} ${url}`);
    return "copiado";
  } catch {}
  return false;
}
