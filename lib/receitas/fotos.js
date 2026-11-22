import MANIFESTO from "../../data/fotos-receitas.json";

/*
 * Fotografias das receitas.
 *
 * O que a PlanMyMeals faz (nov 2026): uma fotografia por receita, gerada
 * por IA, com um aviso comprido por baixo. Bom: a receita "dá fome" e o
 * Google mostra a imagem nos resultados. Fraco: cada imagem tem um cenário
 * diferente (mesa azul numa, madeira noutra), são pratos de restaurante e
 * não dizem nada do preço.
 *
 * O que fazemos melhor:
 *   - um estilo só (lib/receitas/fotoPrompt): a mesma mesa, a mesma luz, o
 *     mesmo prato; a lista de receitas parece um livro e não um banco de
 *     imagens, e reconhece-se o PoupeJá numa partilha;
 *   - a dose de UMA pessoa, caseira, como sai do tacho: bate certo com o
 *     "1,85 €/pessoa" que vai por cima da fotografia;
 *   - aviso curto e honesto ("Imagem ilustrativa, criada com IA") e, quando
 *     houver, fotografias reais de quem fez a receita passam à frente;
 *   - ficheiros já no tamanho certo (scripts/fotos-receitas/processar.mjs),
 *     sem a otimização de imagens da Vercel (no plano Hobby é limitada) e
 *     com cache longa no browser (next.config.js), para poupar pedidos à CDN.
 *
 * data/fotos-receitas.json diz que receitas já têm fotografia e de onde
 * vem cada uma; as outras continuam com o emoji:
 *   { "fotos": { "<id>": { "fonte": "ia" } } }
 *   { "fotos": { "<id>": { "fonte": "commons", "autor": "…", "licenca": "CC BY-SA 4.0",
 *                          "pagina": "https://commons.wikimedia.org/wiki/File:…" } } }
 * As fotografias reais (Wikimedia Commons, licenças CC) levam sempre o
 * crédito do autor e a licença: é a condição para as usar.
 */
export const PASTA = "/receitas/fotos";
const FOTOS = MANIFESTO.fotos || {};
const COM_FOTO = new Set(Object.keys(FOTOS));
export const LICENCAS_LIVRES = /^(CC0|Public domain|PD|CC BY(-SA)? \d\.\d)/i;

export const temFoto = (id) => COM_FOTO.has(id);

/* Os ficheiros de uma receita: 4:3 grande e pequeno, 1:1 e 16:9 (Google) e o JPG da partilha. */
export function fotosDe(id) {
  if (!temFoto(id)) return null;
  const b = `${PASTA}/${id}`;
  return {
    grande: `${b}-1200.webp`,   // 1200×900
    pequena: `${b}-480.webp`,   // 480×360
    quadrada: `${b}-1x1.webp`,  // 720×720
    larga: `${b}-16x9.webp`,    // 1200×675
    partilha: `${b}-og.jpg`,    // 1200×630, para a imagem de partilha
  };
}

export const AVISO_IA = "Imagem ilustrativa, criada com IA.";

/* O texto por baixo da fotografia: o aviso da IA ou o crédito do autor. */
export function creditoDe(id) {
  const f = FOTOS[id];
  if (!f) return null;
  if (f.fonte === "commons") {
    return { texto: `Fotografia: ${f.autor || "autor desconhecido"}, ${f.licenca} (Wikimedia Commons)`, url: f.pagina || null };
  }
  return { texto: AVISO_IA, url: null };
}
