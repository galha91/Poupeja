import { diaBlackFriday } from "./seoBlackFriday.js";
import { INICIO as IVA_INICIO, FIM_PREVISTO as IVA_FIM, CAMPANHA_DESDE as IVA_DESDE } from "./ivaZeroDatas.js";

/*
 * Campanhas sazonais: o que o Início e o email semanal destacam em cada
 * altura do ano, para trazer gente de volta pelas pesquisas que sobem.
 *
 *   Black Friday   7 dias antes até à própria sexta-feira → /black-friday
 *   Ceia de Natal  do dia a seguir à Black Friday até 26 dez → /ceia-de-natal
 *   IVA zero       de 27 dez 2026 a 31 mar 2027 → /iva-zero (lib/ivaZeroDatas)
 *
 * São só datas (sem rede nem base de dados). A primeira que coincidir ganha.
 */

const dia = (iso, delta) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

/* hoje: "YYYY-MM-DD". Devolve a campanha ativa ou null. */
export function campanhaAtiva(hoje) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje || "")) return null;
  const ano = Number(hoje.slice(0, 4));
  const bf = diaBlackFriday(ano);
  if (hoje >= dia(bf, -7) && hoje <= bf) {
    return {
      id: `black-friday-${ano}`,
      titulo: "Black Friday: o desconto é verdadeiro?",
      texto: "A regra dos 30 dias e o desconto real, calculado.",
      href: "/black-friday",
      emoji: "🏷️",
    };
  }
  if (hoje > bf && hoje <= `${ano}-12-26`) {
    return {
      id: `natal-${ano}`,
      titulo: "Quanto custa a ceia de Natal?",
      texto: "A consoada em cada supermercado, atualizada todos os dias.",
      href: "/ceia-de-natal",
      emoji: "🎄",
    };
  }
  if (hoje >= IVA_DESDE && hoje <= IVA_FIM) {
    const antes = hoje < IVA_INICIO;
    return {
      id: "iva-zero-2027",
      titulo: antes ? "IVA zero a 1 de janeiro: os preços vão descer?" : "IVA zero: a descida chegou às prateleiras?",
      texto: antes ? "Acompanhamos quase 2 mil alimentos, produto a produto." : "O mesmo produto, antes e depois, em cada supermercado.",
      href: "/iva-zero",
      emoji: "🧾",
    };
  }
  return null;
}

/* O dia de hoje em Lisboa, "YYYY-MM-DD". */
export const hojeEmLisboa = (agora = new Date()) => agora.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
