/*
 * Abono de família para crianças e jovens (2026) — escalão e valor mensal.
 * Fonte única para a página pública /abono-de-familia.
 *
 * Montantes: Portaria n.º 60/2026/1, de 5 de fevereiro (arts. 2.º a 4.º).
 * Escalões e rendimento de referência: Guia Prático da Segurança Social
 * (DL 176/2003): rendimentos anuais do agregado ÷ (n.º de crianças e
 * jovens com direito + 1), comparados com 0,5 / 1 / 1,7 / 2,5 × IAS × 14,
 * com o IAS do ano a que os rendimentos dizem respeito. Confirmado a
 * 22/10/2026.
 *
 * Majoração de famílias numerosas (art. 3.º): para cada criança até 36
 * meses a partir do segundo titular, valor diferente com dois ou com
 * mais de dois titulares. Monoparental (art. 4.º): +50% sobre o abono e
 * as majorações.
 */
export const VERIFICADO_ABONO = "2026-10-22";
export const FONTE_MONTANTES = "https://diariodarepublica.pt/dr/detalhe/portaria/60-2026-1038101444";
export const FONTE_GUIA = "https://www.seg-social.pt/ptss/pssd/documento/cmc1z3qdt00j1kl2ya2677byz";
export const SIMULADOR_OFICIAL = "https://www.seg-social.pt/ptss/sps/simulador/6";

// IAS do ano dos rendimentos usados.
export const IAS_RENDIMENTOS = { 2024: 509.26, 2025: 522.5 };
export const MULTIPLOS_ESCALAO = [0.5, 1, 1.7, 2.5];

/* Montantes mensais por escalão (1 a 4) e idade: até 36 meses, 36–72 meses, mais de 72 meses. */
export const MONTANTES = {
  1: { ate3: 190.98, de3a6: 75.13, mais6: 75.13 },
  2: { ate3: 161.65, de3a6: 75.13, mais6: 75.13 },
  3: { ate3: 132.07, de3a6: 59.33, mais6: 54.35 },
  4: { ate3: 88.43, de3a6: 44.77, mais6: 0 },
};
/* Majoração por criança até 36 meses, a partir do segundo titular. */
export const MAJORACAO = {
  doisTitulares: { 1: 64.96, 2: 57.64, 3: 54.35, 4: 39.28 },
  maisDeDois: { 1: 106.96, 2: 92.32, 3: 85.76, 4: 55.7 },
};

const cent = (v) => Math.round(v * 100) / 100;

/**
 * Limites dos escalões 1 a 4 (o 5.º é acima do último). Como no Guia:
 * múltiplo × IAS arredondado ao cêntimo, depois × 14 (1,7 × 509,26 =
 * 865,74 → 12 120,36 €).
 */
export function limitesEscalao(anoRendimentos = 2025) {
  const ias = IAS_RENDIMENTOS[anoRendimentos] || IAS_RENDIMENTOS[2025];
  return MULTIPLOS_ESCALAO.map((m) => cent(cent(m * ias) * 14));
}

/** Escalão (1 a 5) para um rendimento de referência. */
export function escalaoAbono(rendimentoReferencia, anoRendimentos = 2025) {
  const lim = limitesEscalao(anoRendimentos);
  const i = lim.findIndex((l) => rendimentoReferencia <= l);
  return i < 0 ? 5 : i + 1;
}

/*
 * rendimentoAnual: soma dos rendimentos anuais do agregado (brutos).
 * idades: uma por criança/jovem com direito — "ate3" | "de3a6" | "mais6".
 * monoparental: só uma pessoa responsável.
 */
export function calcularAbono({ rendimentoAnual, idades = [], monoparental = false, anoRendimentos = 2025 }) {
  const n = idades.length;
  const r = Number(rendimentoAnual);
  if (!n || !Number.isFinite(r) || r < 0) return null;
  const referencia = cent(r / (n + 1));
  const escalao = escalaoAbono(referencia, anoRendimentos);
  if (escalao === 5) return { referencia, escalao, total: 0, criancas: idades.map((idade) => ({ idade, valor: 0 })) };

  const tabelaMaj = n > 2 ? MAJORACAO.maisDeDois : MAJORACAO.doisTitulares;
  // A majoração vai para as crianças até 36 meses que não são o primeiro titular.
  // Mostra-se nos filhos a partir do 2.º (o 1.º só se for o único pequeno).
  let majoracoes = n >= 2 ? Math.min(idades.filter((i) => i === "ate3").length, n - 1) : 0;
  const comMaj = new Set();
  for (const i of [...idades.keys()].slice(1).concat(0)) {
    if (majoracoes > 0 && idades[i] === "ate3") { comMaj.add(i); majoracoes--; }
  }
  const criancas = idades.map((idade, i) => {
    let valor = (MONTANTES[escalao][idade] || 0) + (comMaj.has(i) ? tabelaMaj[escalao] : 0);
    if (monoparental) valor *= 1.5;
    return { idade, valor: cent(valor) };
  });
  return { referencia, escalao, criancas, total: cent(criancas.reduce((s, c) => s + c.valor, 0)) };
}
