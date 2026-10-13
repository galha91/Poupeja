/*
 * "O meu desconto" no combustível.
 *
 * Muita gente não paga o preço afixado: tem cartão de frota, de
 * supermercado (Continente/Galp, Pingo Doce/BP…) ou desconto da empresa.
 * O posto mais barato no papel pode não ser o mais barato para ela. A
 * pessoa diz quanto desconta em cada marca (cêntimos por litro) e a lista
 * passa a ordenar pelo preço que ela paga mesmo.
 *
 * Fica só neste dispositivo: não há catálogo de cartões para manter nem
 * dados de ninguém no servidor. Nunca se inventa um desconto.
 */
const CHAVE = "poupeja_descontos_comb";
export const MAX_CENT = 50; // acima disto é quase de certeza um engano (50 cêntimos/litro)

export function normalizarMarca(m) {
  return String(m || "").trim().toLowerCase();
}

/** { "galp": 10, "bp": 5 } — cêntimos por litro, por marca normalizada */
export function lerDescontos() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    return d && typeof d === "object" ? d : {};
  } catch { return {}; }
}

export function guardarDescontos(d) {
  try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch {}
  return d;
}

/* Cêntimos aceites: número entre 0 (exclusive) e MAX_CENT, com uma casa. */
export function centimosValidos(v) {
  const n = Math.round(parseFloat(String(v).replace(",", ".")) * 10) / 10;
  return n > 0 && n <= MAX_CENT ? n : null;
}

/*
 * Aplica o desconto a um posto. `preco` passa a ser o que a pessoa paga;
 * o afixado fica em `precoAfixado`, e `desconto` diz quantos cêntimos.
 * Sem desconto para a marca, o posto sai igual.
 */
export function aplicarDesconto(posto, descontos, campoMarca = "marca") {
  const cent = descontos?.[normalizarMarca(posto?.[campoMarca])];
  if (!cent || !(posto?.preco > 0)) return posto;
  const preco = Math.round((posto.preco - cent / 100) * 1000) / 1000;
  return { ...posto, preco, precoAfixado: posto.preco, desconto: cent };
}

export function aplicarDescontos(postos, descontos, campoMarca = "marca") {
  if (!descontos || !Object.keys(descontos).length) return postos || [];
  return (postos || []).map(p => aplicarDesconto(p, descontos, campoMarca));
}
