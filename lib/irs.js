/*
 * IRS 2026 (Continente) — rendimentos de 2026, declarados em 2027.
 * Fonte única para o simulador da app (SecaoIRS) e a página pública /irs.
 *
 * Tabela do art. 68.º do CIRS na redação da Lei 73-A/2025 (OE 2026),
 * copiada do Portal das Finanças em 24/09/2026 e reconfirmada a
 * 22/10/2026.
 *
 * Só se guardam limites e taxas, que é o que a lei publica. A parcela a
 * abater calcula-se — é o que garante a continuidade entre escalões — e
 * assim não há um terceiro número por escalão para se desalinhar.
 */
export const ANO_IRS = 2026;
export const VERIFICADO_IRS = "2026-10-22";
export const FONTE_IRS = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx";

const TABELA_ART68_2026 = [
  { ate: 8342,     taxa: 0.125 },
  { ate: 12587,    taxa: 0.157 },
  { ate: 17838,    taxa: 0.212 },
  { ate: 23089,    taxa: 0.241 },
  { ate: 29397,    taxa: 0.311 },
  { ate: 43090,    taxa: 0.349 },
  { ate: 46566,    taxa: 0.431 },
  { ate: 86634,    taxa: 0.446 },
  { ate: Infinity, taxa: 0.48  },
];

export const ESCALOES_IRS = TABELA_ART68_2026.reduce((acc, e, i) => {
  const ant = acc[i - 1];
  const abater = ant ? ant.abater + ant.ate * (e.taxa - ant.taxa) : 0;
  acc.push({ ...e, de: ant ? ant.ate : 0, abater });
  return acc;
}, []);

// Art. 25.º, n.º 1, a): 8,54 × IAS. IAS 2026 = 537,13 € (Portaria 480-A/2025/1).
export const IAS_2026 = 537.13;
export const DEDUCAO_ESPECIFICA = Math.round(8.54 * IAS_2026 * 100) / 100; // 4587,09 €

/** Escalão (1 a 9) de um rendimento coletável. */
export function escalaoDe(coletavel) {
  const i = ESCALOES_IRS.findIndex((e) => coletavel <= e.ate);
  const idx = i < 0 ? ESCALOES_IRS.length - 1 : i;
  return { numero: idx + 1, ...ESCALOES_IRS[idx] };
}

/** Coleta antes de deduções, para um rendimento coletável (tributação separada). */
export function coletaDe(coletavel) {
  if (!(coletavel > 0)) return 0;
  const e = escalaoDe(coletavel);
  return Math.max(0, coletavel * e.taxa - e.abater);
}

/** Taxa média no limite superior de cada escalão (a coluna B da tabela). */
export function taxaMediaNoLimite(e) {
  return Number.isFinite(e.ate) ? (e.ate * e.taxa - e.abater) / e.ate : null;
}
