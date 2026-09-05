import { evento } from "./analytics";
import { linkPartilha } from "./site";

/*
 * Partilha nativa (iOS/Android) com recurso a copiar o link.
 *
 * Devolve "partilhado" | "copiado" | false. O false tanto é cancelamento
 * como falha — quem chama trata os dois da mesma maneira (não mostra nada).
 */
async function partilhar({ texto, url, tipo, titulo = "PoupeJá" }) {
  evento("share", { content_type: tipo });
  if (typeof navigator === "undefined") return false;
  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto, url });
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

export async function partilharPoupanca(valor, periodo = "este mês") {
  return partilhar({
    tipo: "poupanca",
    texto: `Já poupei €${valor.toFixed(2)} nas compras ${periodo} com o PoupeJá 🐷💚 Experimenta grátis:`,
    url: linkPartilha("/p", { v: "poupanca", valor: valor.toFixed(2) }),
  });
}

/* Recomendar a app em si — sem número nenhum agarrado. */
export async function partilharApp() {
  return partilhar({
    tipo: "app",
    texto: "🐷 Uso o PoupeJá para poupar nas compras: os folhetos de todos os supermercados num só sítio, o combustível mais barato ao pé de casa e os apoios do Estado. É grátis e nem precisas de criar conta:",
    url: linkPartilha("/"),
  });
}
