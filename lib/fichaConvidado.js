import { classificarOrigem, origemEtiqueta, regiaoDe, tipoDispositivo, modoValido, caminhoValido } from "./visitas.js";

/*
 * Ficha anónima de um convidado, montada no servidor a partir do que já
 * se mede no contador de visitas: categorias largas, nunca o IP, o URL de
 * onde veio, o nome ou o email. Fica junto ao id aleatório do browser.
 *
 * fora_pt: a ligação vem de fora de Portugal. Quase sempre são os aparelhos
 * de teste do Google Play, por isso o admin conta-os à parte.
 */
const ANFITRIAO = "xn--poupej-uta.com";

export function construirFicha(headers, chegada = {}) {
  const pais = String(headers["x-vercel-ip-country"] || "").toUpperCase().slice(0, 2) || null;
  const ref = typeof chegada.ref === "string" ? chegada.ref.slice(0, 300) : "";
  return {
    origem: origemEtiqueta(chegada.o) || classificarOrigem(ref, ANFITRIAO),
    regiao: regiaoDe(pais, headers["x-vercel-ip-country-region"]),
    pais,
    dispositivo: tipoDispositivo(headers["user-agent"]),
    modo: modoValido(chegada.modo),
    entrada: caminhoValido(chegada.entrada),
    fora_pt: !!pais && pais !== "PT",
  };
}

// Partes da app que contam (os separadores de baixo e os de cada secção).
export const SECOES = new Set([
  "mobilidade", "mercados", "lista", "taloes", "contas", "apoios", "poupanca", "lojas", "irs",
  "comparar", "folhetos", "ementas", "receitas", "garantias", "prazos",
]);

// Respostas a "Como conheceste o PoupeJá?".
export const RESPOSTAS = new Set(["instagram", "facebook", "tiktok", "amigo", "google", "outro"]);
