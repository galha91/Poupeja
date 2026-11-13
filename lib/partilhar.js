import { evento } from "./analytics";
import { linkPartilha } from "./site";
import { eur } from "./formato";

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
    texto: `Já poupei €${eur(valor, 2)} nas compras ${periodo} com o PoupeJá 🐷💚 Experimenta grátis:`,
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

/* Uma comparação: «Azeite: mais barato no Pingo Doce, 5,49 €/L». O link abre a mesma pesquisa. */
export async function partilharComparacao({ q, loja, preco, sufixo = "" }) {
  const nome = q.charAt(0).toUpperCase() + q.slice(1);
  return partilhar({
    tipo: "comparacao",
    texto: `🛒 ${nome}: o mais barato está no ${loja}, a ${eur(preco, 2)} €${sufixo}. Vê a comparação no PoupeJá:`,
    url: linkPartilha("/", { atalho: "mercados", q, o: "partilha" }),
  });
}

/*
 * O resultado da lista comparada: «12 artigos: no Lidl ficam a 23,40 €,
 * menos 4,10 € do que no Continente». É o momento em que a app mostrou o
 * que vale, e não havia como o mostrar a mais ninguém. O total é o do
 * conjunto comparável (o que todas as lojas têm), o mesmo do ecrã.
 */
export function textoResultadoLista({ artigos, loja, total, poupanca = 0, lojaCara = "" }) {
  const n = `${artigos} ${artigos === 1 ? "artigo" : "artigos"}`;
  const fica = artigos === 1 ? "fica" : "ficam";
  const diferenca = poupanca >= 0.5 && lojaCara ? `, menos ${eur(poupanca, 2)} € do que no ${lojaCara}` : "";
  return `🛒 Comparei a minha lista de compras no PoupeJá. ${n}: no ${loja} ${fica} a ${eur(total, 2)} €${diferenca}. Vê onde a tua fica mais barata, grátis e sem conta:`;
}

export async function partilharResultadoLista(dados) {
  return partilhar({
    tipo: "resultado_lista",
    texto: textoResultadoLista(dados),
    url: linkPartilha("/", { atalho: "lista", o: "partilha-lista" }),
  });
}
