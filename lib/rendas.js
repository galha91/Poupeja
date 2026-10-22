/*
 * Atualização de rendas para 2027. Fonte única para a página pública
 * /atualizacao-de-rendas. Confirmado a 22/10/2026.
 *
 * Coeficiente de 2027: 1,0256 (+2,56%), Aviso do INE n.º 24199/2026/2, de
 * 1 de outubro, para todos os tipos de arrendamento urbano e rural. Vem da
 * variação do índice de preços no consumidor sem habitação nos 12 meses
 * com dados a 31 de agosto.
 *
 * Código Civil, art. 1077.º: quando o contrato não define outro critério,
 * o senhorio pode atualizar a renda uma vez por ano, a partir do fim do
 * 1.º ano de contrato, comunicando-o ao inquilino por escrito, com o
 * coeficiente e a nova renda, pelo menos 30 dias antes do início do
 * período de atualização.
 */
export const VERIFICADO_RENDAS = "2026-10-22";
export const ANO_ATUALIZACAO = 2027;
export const COEFICIENTE_2027 = 1.0256;
export const FONTE_AVISO_INE = "https://diariodarepublica.pt/dr/detalhe/aviso/24199-2026-1175645456";
export const FONTE_COEFICIENTES = "https://www.portaldahabitacao.pt/coeficientes-de-atualizacao-de-rendas";
export const AVISO_MINIMO_DIAS = 30;

/* Coeficientes dos últimos anos (renda livre e condicionada). 2023 foi limitado a 2% por lei. */
export const COEFICIENTES = {
  2027: 1.0256, 2026: 1.0224, 2025: 1.0216, 2024: 1.0694, 2023: 1.02,
  2022: 1.0043, 2021: 0.9997, 2020: 1.0051, 2019: 1.0115, 2018: 1.0112,
};

const cent = (v) => Math.round(v * 100 + 1e-6) / 100;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const diasDoMes = (ano, mes) => new Date(Date.UTC(ano, mes, 0)).getUTCDate();

/** Renda atualizada com o coeficiente de 2027. */
export const rendaAtualizada = (renda) => cent(Number(renda) * COEFICIENTE_2027);

/*
 * renda: renda mensal atual. inicio: data de início do contrato, "AAAA-MM-DD".
 * O aumento só vale a partir do fim do 1.º ano e no aniversário do
 * contrato; a carta tem de chegar pelo menos 30 dias antes. Contratos
 * que começam em 2027 só se atualizam em 2028, com outro coeficiente.
 */
export function calcularAtualizacao({ renda, inicio }) {
  const r = Number(renda);
  if (!(r > 0)) return null;
  const nova = rendaAtualizada(r);
  const base = { renda: r, nova, aumentoMensal: cent(nova - r), aumentoAnual: cent((nova - r) * 12), coeficiente: COEFICIENTE_2027 };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(inicio || ""));
  if (!m) return { ...base, data: null };
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ano >= ANO_ATUALIZACAO) return { ...base, data: "adiada", inicioAno: ano };
  const diaEfeito = Math.min(dia, diasDoMes(ANO_ATUALIZACAO, mes));
  const efeito = Date.UTC(ANO_ATUALIZACAO, mes - 1, diaEfeito);
  return { ...base, data: "2027", efeito: iso(efeito), comunicarAte: iso(efeito - AVISO_MINIMO_DIAS * 86400000) };
}
