import { INGREDIENTES } from "./ingredientes.js";

/*
 * O pedido de imagem de uma receita, sempre com a mesma direção de arte:
 * é o que faz as fotografias parecerem do mesmo livro (ver lib/receitas/fotos).
 * Em inglês porque os modelos de imagem seguem-no melhor.
 */
export const ESTILO = [
  "Realistic home-cooked food photograph, Portuguese family kitchen.",
  "One single portion for one person, served as it comes out of the pot, not restaurant plating.",
  "Plain white ceramic plate (or white bowl for soups and desserts) on a light oak wooden table,",
  "a folded linen napkin with a thin blue stripe at the edge, a simple fork.",
  "Soft natural daylight from a window on the left, gentle shadows, warm but true colours.",
  "Camera at 45 degrees, plate centred with space around it, shallow depth of field.",
  "No text, no logos, no hands, no people, no packaging, no garnish that is not in the recipe.",
].join(" ");

const TIPO = {
  prato: "main course",
  sopa: "soup in a bowl",
  "pequeno-almoco": "breakfast",
  sobremesa: "dessert",
};

/* Os ingredientes que se veem no prato (sem sal, azeite, especiarias nem o que é da despensa). */
export function ingredientesVisiveis(receita, max = 6) {
  return (receita.ing || [])
    .map(([key]) => INGREDIENTES[key])
    .filter((i) => i && !i.desp && i.g !== 0)
    .map((i) => i.nome.replace(/\s*\([^)]*\)/g, "").toLowerCase())
    .slice(0, max);
}

export function promptDaFoto(receita) {
  const ing = ingredientesVisiveis(receita);
  return [
    `Dish: "${receita.nome}", a home-style ${TIPO[receita.tipo] || "dish"} as cooked in Portugal.`,
    ing.length ? `Visible ingredients: ${ing.join(", ")}.` : "",
    ESTILO,
  ].filter(Boolean).join(" ");
}
